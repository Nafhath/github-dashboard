import axios from 'axios';

// Simple in-memory cache to avoid rate limiting
// In a real production app, this would be Redis
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes

const getGithubClient = () => {
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
    };

    if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    return axios.create({
        baseURL: 'https://api.github.com',
        headers
    });
};

export const fetchRepositories = async (username = 'octocat') => {
    const cacheKey = `repos_${username}`;

    if (cache.has(cacheKey)) {
        const cachedData = cache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < CACHE_TTL) {
            return cachedData.data;
        }
    }

    try {
        const client = getGithubClient();
        let response;
        let authenticatedLogin = username;

        if (process.env.GITHUB_TOKEN && username === 'octocat') {
            // Fetch authenticated user's repos (includes all org repos they're a member of)
            response = await client.get(`/user/repos?per_page=100&sort=updated&affiliation=owner,organization_member`);
            // Get authenticated user's actual login
            try {
                const meRes = await client.get(`/user`);
                authenticatedLogin = meRes.data.login;
            } catch (_) { }
        } else {
            response = await client.get(`/users/${username}/repos?per_page=100&sort=updated`);
        }

        // Enrich top repos with total commits + user-specific commit count + avatar
        const topRepos = response.data.slice(0, 15);
        const authLogin = authenticatedLogin;

        const enrichedRepos = await Promise.all(
            topRepos.map(async (repo) => {
                const [totalCommits, userCommits, topContributorRes] = await Promise.all([
                    fetchCommitCount(repo.owner.login, repo.name),
                    fetchCommitCount(repo.owner.login, repo.name, authLogin),
                    client.get(`/repos/${repo.owner.login}/${repo.name}/contributors?per_page=1`)
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
                    isOwnedByUser: repo.owner.login.toLowerCase() === authLogin.toLowerCase()
                };
            })
        );

        // Sort: repos created by the authenticated user first, then org repos
        enrichedRepos.sort((a, b) => {
            if (a.isOwnedByUser && !b.isOwnedByUser) return -1;
            if (!a.isOwnedByUser && b.isOwnedByUser) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        cache.set(cacheKey, { timestamp: Date.now(), data: enrichedRepos });
        return enrichedRepos;
    } catch (error) {
        console.error(`Error fetching repos for ${username}:`, error.message);
        throw new Error('Failed to fetch repositories from GitHub');
    }
};

export const fetchCommitCount = async (owner, repo, author = null) => {
    const cacheKey = `commits_${owner}_${repo}${author ? `_${author}` : ''}`;

    if (cache.has(cacheKey)) {
        const cachedData = cache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < CACHE_TTL) {
            return cachedData.data;
        }
    }

    try {
        const client = getGithubClient();
        const authorParam = author ? `&author=${encodeURIComponent(author)}` : '';
        // Pagination trick to get total commits without fetching all payload pages
        // See: https://gist.github.com/0penBrain/7be59a48aba778c955d992aa69e524c5
        const response = await client.get(`/repos/${owner}/${repo}/commits?per_page=1${authorParam}`, {
            validateStatus: (status) => status < 500 // Resolve even on 409 (empty repo)
        });

        if (response.status === 409) return 0; // Empty repository
        // If data is empty array, the author has no commits in this repo
        if (Array.isArray(response.data) && response.data.length === 0) return 0;

        let commitCount = 1;
        if (response.headers.link) {
            // Extract the last page number from the Link header
            // e.g. <https://api.github.com/repositories/123/commits?per_page=1&page=45>; rel="last"
            const match = response.headers.link.match(/page=(\d+)>; rel="last"/);
            if (match) {
                commitCount = parseInt(match[1], 10);
            }
        }

        cache.set(cacheKey, { timestamp: Date.now(), data: commitCount });
        return commitCount;
    } catch (error) {
        console.error(`Error fetching commit count for ${owner}/${repo}:`, error.message);
        return 0; // Graceful fallback
    }
};

export const fetchRepoDetails = async (owner, repo) => {
    const cacheKey = `repo_details_${owner}_${repo}`;

    if (cache.has(cacheKey)) {
        const cachedData = cache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < CACHE_TTL) {
            return cachedData.data;
        }
    }

    try {
        const client = getGithubClient();

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

        // Fetch contributors and languages in parallel (safe, non-fatal)
        const [contribsRes, langsRes] = await Promise.all([
            client.get(`/repos/${owner}/${repo}/contributors?per_page=15`).catch(() => ({ data: [] })),
            client.get(`/repos/${owner}/${repo}/languages`).catch(() => ({ data: {} }))
        ]);

        const repoData = repoRes.data;
        const commitCount = await fetchCommitCount(owner, repo);

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

        cache.set(cacheKey, { timestamp: Date.now(), data: details });
        return details;
    } catch (error) {
        console.error(`Error fetching repo details for ${owner}/${repo}:`, error.message);
        throw new Error('Failed to fetch repository details from GitHub');
    }
};

export const fetchRecentCommits = async (owner, repo, perPage = 30) => {
    const cacheKey = `commits_list_${owner}_${repo}`;

    if (cache.has(cacheKey)) {
        const cachedData = cache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < CACHE_TTL) {
            return cachedData.data;
        }
    }

    try {
        const client = getGithubClient();
        const response = await client.get(`/repos/${owner}/${repo}/commits?per_page=${perPage}`);

        const commits = response.data.map(c => ({
            sha: c.sha.substring(0, 7),
            fullSha: c.sha,
            message: c.commit.message.split('\n')[0], // First line only
            author: c.commit.author.name,
            authorLogin: c.author?.login || null,
            authorAvatar: c.author?.avatar_url || null,
            date: c.commit.author.date,
            htmlUrl: c.html_url
        }));

        cache.set(cacheKey, { timestamp: Date.now(), data: commits });
        return commits;
    } catch (error) {
        console.error(`Error fetching commits for ${owner}/${repo}:`, error.message);
        throw new Error('Failed to fetch commits from GitHub');
    }
};
