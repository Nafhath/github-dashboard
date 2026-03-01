import { fetchRepositories, fetchRepoDetails, fetchRecentCommits } from '../services/githubService.js';

export const getRepos = async (req, res, next) => {
    try {
        const username = req.query.username || 'octocat'; // Configurable or default
        const repos = await fetchRepositories(username);
        res.json(repos);
    } catch (error) {
        next(error);
    }
};

export const getRepoDetails = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const details = await fetchRepoDetails(owner, repo);
        res.json(details);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        next(error);
    }
};

export const getRecentCommits = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const commits = await fetchRecentCommits(owner, repo);
        res.json(commits);
    } catch (error) {
        next(error);
    }
};
