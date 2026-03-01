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
        if (process.env.GITHUB_TOKEN && username === 'octocat') {
            response = await client.get(`/user/repos?per_page=100&sort=updated`);
        } else {
            response = await client.get(`/users/${username}/repos?per_page=100&sort=updated`);
        }

        // Enrich with commit counts in parallel, limited to top 15 to avoid rate-limit blowup if no token
        const topRepos = response.data.slice(0, 15);

        const enrichedRepos = await Promise.all(
            topRepos.map(async (repo) => {
                const commitCount = await fetchCommitCount(repo.owner.login, repo.name);
                return {
                    id: repo.id.toString(),
                    name: repo.name,
                    description: repo.description,
                    language: repo.language || 'Unknown',
                    stars: repo.stargazers_count,
                    forks: repo.forks_count,
                    commits: commitCount,
                    isPrivate: repo.private,
                    updatedAt: repo.updated_at
                };
            })
        );

        cache.set(cacheKey, { timestamp: Date.now(), data: enrichedRepos });
        return enrichedRepos;
    } catch (error) {
        console.error(`Error fetching repos for ${username}:`, error.message);
        throw new Error('Failed to fetch repositories from GitHub');
    }
};

export const fetchCommitCount = async (owner, repo) => {
    const cacheKey = `commits_${owner}_${repo}`;

    if (cache.has(cacheKey)) {
        const cachedData = cache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < CACHE_TTL) {
            return cachedData.data;
        }
    }

    try {
        const client = getGithubClient();
        // Pagination trick to get total commits without fetching all payload pages
        // See: https://gist.github.com/0penBrain/7be59a48aba778c955d992aa69e524c5
        const response = await client.get(`/repos/${owner}/${repo}/commits?per_page=1`, {
            validateStatus: (status) => status < 500 // Resolve even on 409 (empty repo)
        });

        if (response.status === 409) return 0; // Empty repository

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

        // Fetch base repo info, contributors, and languages in parallel
        const [repoRes, contribsRes, langsRes] = await Promise.all([
            client.get(`/repos/${owner}/${repo}`),
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
