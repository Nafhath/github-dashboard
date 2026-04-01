import express from 'express';
import { finishGithubAuth, getAuthMe, logout, startGithubAuth } from '../controllers/authController.js';
import { getRepos, getRepoDetails, getRecentCommits } from '../controllers/repoController.js';
import { getGroups, createGroup, updateGroup, deleteGroup } from '../controllers/groupController.js';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { getAnalyticsStats } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/auth/github', startGithubAuth);
router.get('/auth/github/callback', finishGithubAuth);
router.get('/auth/me', getAuthMe);
router.post('/auth/logout', logout);

router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

router.get('/repos', getRepos);
router.get('/repos/:owner/:repo/commits', getRecentCommits);
router.get('/repos/:owner/:repo', getRepoDetails);
router.get('/groups', getGroups);
router.post('/groups', createGroup);
router.put('/groups/:id', updateGroup);
router.delete('/groups/:id', deleteGroup);
router.get('/dashboard', getDashboardStats);

router.get('/analytics', getAnalyticsStats);

export default router;
