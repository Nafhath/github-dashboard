import axios from 'axios';

const cache = new Map();
const CACHE_TTL = 1000 * 60 * 15;

const getGithubClient = (token) => {
    const headers = {
        Accept: 'application/vnd.github.v3+json',
    };

    if (token) {
        headers.Authorization = `token ${token}`;
    }

    return axios.create({
        baseURL: 'https://api.github.com',
        headers,
    });
};

const getCacheValue = (cacheKey) => {
    if (!cache.has(cacheKey)) {
        return null;
    }

    const cachedData = cache.get(cacheKey);
    if (Date.now() - cachedData.timestamp >= CACHE_TTL) {
        cache.delete(cacheKey);
        return null;
    }

    return cachedData.data;
};

const setCacheValue = (cacheKey, data) => {
    cache.set(cacheKey, { timestamp: Date.now(), data });
};

const getContextCacheId = ({ username = 'octocat', token, authLogin }) => {
    if (authLogin) {
        return `auth_${authLogin}`;
    }

    if (token) {
        return `token_${username}`;
    }

    return username;
};

export const resolveGithubLogin = async ({ username = 'octocat', token } = {}) => {
    if (!token) {
        return username;
    }

    try {
        const client = getGithubClient(token);
        const meRes = await client.get('/user');
        return meRes.data.login || username;
    } catch (error) {
        console.error('Failed to resolve authenticated GitHub login:', error.message);
        return username;
    }
};

export const fetchCommitCount = async (owner, repo, author = null, options = {}) => {
    const contextId = getContextCacheId(options);
    const cacheKey = `commits_${contextId}_${owner}_${repo}${author ? `_${author}` : ''}`;
    const cachedValue = getCacheValue(cacheKey);

    if (cachedValue !== null) {
        return cachedValue;
    }

    try {
        const client = getGithubClient(options.token);
        const authorParam = author ? `&author=${encodeURIComponent(author)}` : '';
        const response = await client.get(`/repos/${owner}/${repo}/commits?per_page=1${authorParam}`, {
            validateStatus: (status) => status < 500
        });

        if (response.status === 409) return 0;
        if (Array.isArray(response.data) && response.data.length === 0) return 0;

        let commitCount = 1;
        if (response.headers.link) {
            const match = response.headers.link.match(/page=(\d+)>; rel="last"/);
            if (match) {
                commitCount = parseInt(match[1], 10);
            }
        }

        setCacheValue(cacheKey, commitCount);
        return commitCount;
    } catch (error) {
        console.error(`Error fetching commit count for ${owner}/${repo}:`, error.message);
        return 0;
    }
};

export const fetchRepositories = async ({ username = 'octocat', token } = {}) => {
    const authLogin = await resolveGithubLogin({ username, token });
    const contextId = getContextCacheId({ username, token, authLogin });
    const cacheKey = `repos_${contextId}`;
    const cachedValue = getCacheValue(cacheKey);

    if (cachedValue) {
        return cachedValue;
    }

    try {
        const client = getGithubClient(token);
        let response;

        if (token) {
            response = await client.get('/user/repos?per_page=100&sort=updated&affiliation=owner,organization_member,collaborator');
        } else if (process.env.GITHUB_TOKEN && username === 'octocat') {
            const envClient = getGithubClient(process.env.GITHUB_TOKEN);
            response = await envClient.get('/user/repos?per_page=100&sort=updated&affiliation=owner,organization_member,collaborator');
            token = process.env.GITHUB_TOKEN;
        } else {
            response = await client.get(`/users/${username}/repos?per_page=100&sort=updated`);
        }

        const effectiveLogin = token ? await resolveGithubLogin({ username, token }) : username;
        const effectiveClient = getGithubClient(token);
        const topRepos = response.data.slice(0, 15);

        const enrichedRepos = await Promise.all(
            topRepos.map(async (repo) => {
                const [totalCommits, userCommits, topContributorRes] = await Promise.all([
                    fetchCommitCount(repo.owner.login, repo.name, null, { username, token, authLogin: effectiveLogin }),
                    fetchCommitCount(repo.owner.login, repo.name, effectiveLogin, { username, token, authLogin: effectiveLogin }),
                    effectiveClient.get(`/repos/${repo.owner.login}/${repo.name}/contributors?per_page=1`)
                        .catch(() => ({ data: [] }))
                ]);

                const topContributor = topContributorRes.data[0] || null;
                return {
                    id: repo.id.toString(),
                    name: repo.name,
                    owner: repo.owner.login,
                    ownerAvatarUrl: repo.owner.avatar_url,
                    creatorLogin: topContributor?.login || null,
                    creatorAvatarUrl: topContributor?.avatar_url || null,
                    description: repo.description,
                    language: repo.language || 'Unknown',
                    stars: repo.stargazers_count,
                    forks: repo.forks_count,
                    commits: totalCommits,
                    userCommits,
                    isPrivate: repo.private,
                    updatedAt: repo.updated_at,
                    isOwnedByUser: repo.owner.login.toLowerCase() === effectiveLogin.toLowerCase()
                };
            })
        );

        enrichedRepos.sort((a, b) => {
            if (a.isOwnedByUser && !b.isOwnedByUser) return -1;
            if (!a.isOwnedByUser && b.isOwnedByUser) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        setCacheValue(cacheKey, enrichedRepos);
        return enrichedRepos;
    } catch (error) {
        console.error(`Error fetching repos for ${username}:`, error.message);
        throw new Error('Failed to fetch repositories from GitHub');
    }
};

export const fetchRepoDetails = async (owner, repo, options = {}) => {
    const contextId = getContextCacheId(options);
    const cacheKey = `repo_details_${contextId}_${owner}_${repo}`;
    const cachedValue = getCacheValue(cacheKey);

    if (cachedValue) {
        return cachedValue;
    }

    try {
        const client = getGithubClient(options.token || process.env.GITHUB_TOKEN);
        let repoRes;

        try {
            repoRes = await client.get(`/repos/${owner}/${repo}`);
        } catch (err) {
            const status = err.response?.status;
            if (status === 404) {
                const err404 = new Error(`Repository '${owner}/${repo}' not found or is private.`);
                err404.statusCode = 404;
                throw err404;
            }
            throw err;
        }

        const [contribsRes, langsRes] = await Promise.all([
            client.get(`/repos/${owner}/${repo}/contributors?per_page=15`).catch(() => ({ data: [] })),
            client.get(`/repos/${owner}/${repo}/languages`).catch(() => ({ data: {} }))
        ]);

        const repoData = repoRes.data;
        const commitCount = await fetchCommitCount(owner, repo, null, options);

        const details = {
            id: repoData.id.toString(),
            name: repoData.name,
            owner: repoData.owner.login,
            description: repoData.description,
            language: repoData.language || 'Unknown',
            stars: repoData.stargazers_count,
            forks: repoData.forks_count,
            commits: commitCount,
            isPrivate: repoData.private,
            updatedAt: repoData.updated_at,
            htmlUrl: repoData.html_url,
            contributors: contribsRes.data.map(c => ({
                id: c.id,
                login: c.login,
                avatarUrl: c.avatar_url,
                contributions: c.contributions,
                htmlUrl: c.html_url
            })),
            languages: langsRes.data
        };

        setCacheValue(cacheKey, details);
        return details;
    } catch (error) {
        console.error(`Error fetching repo details for ${owner}/${repo}:`, error.message);
        if (error.statusCode) {
            throw error;
        }
        throw new Error('Failed to fetch repository details from GitHub');
    }
};

export const fetchRecentCommits = async (owner, repo, perPage = 30, options = {}) => {
    const contextId = getContextCacheId(options);
    const cacheKey = `commits_list_${contextId}_${owner}_${repo}`;
    const cachedValue = getCacheValue(cacheKey);

    if (cachedValue) {
        return cachedValue;
    }

    try {
        const client = getGithubClient(options.token || process.env.GITHUB_TOKEN);
        const response = await client.get(`/repos/${owner}/${repo}/commits?per_page=${perPage}`);

        const commits = response.data.map(c => ({
            sha: c.sha.substring(0, 7),
            fullSha: c.sha,
            message: c.commit.message.split('\n')[0],
            author: c.commit.author.name,
            authorLogin: c.author?.login || null,
            authorAvatar: c.author?.avatar_url || null,
            date: c.commit.author.date,
            htmlUrl: c.html_url
        }));

        setCacheValue(cacheKey, commits);
        return commits;
    } catch (error) {
        console.error(`Error fetching commits for ${owner}/${repo}:`, error.message);
        throw new Error('Failed to fetch commits from GitHub');
    }
};

export const buildGithubContext = (req, fallbackUsername = 'octocat') => ({
    username: req.auth?.login || req.query.username || fallbackUsername,
    token: req.auth?.accessToken || null,
    authLogin: req.auth?.login || null,
});
