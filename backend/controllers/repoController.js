import { fetchRepositories } from '../services/githubService.js';

export const getRepos = async (req, res, next) => {
    try {
        const username = req.query.username || 'octocat'; // Configurable or default
        const repos = await fetchRepositories(username);
        res.json(repos);
    } catch (error) {
        next(error);
    }
};
