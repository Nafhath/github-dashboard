import { buildGithubContext, fetchRepositories, fetchRepoDetails, fetchRecentCommits } from '../services/githubService.js';

export const getRepos = async (req, res, next) => {
    try {
        const context = buildGithubContext(req);
        const repos = await fetchRepositories(context);
        res.json(repos);
    } catch (error) {
        next(error);
    }
};

export const getRepoDetails = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const details = await fetchRepoDetails(owner, repo, buildGithubContext(req));
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
        const commits = await fetchRecentCommits(owner, repo, 30, buildGithubContext(req));
        res.json(commits);
    } catch (error) {
        next(error);
    }
};
