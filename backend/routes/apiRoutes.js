import express from 'express';
import { getRepos, getRepoDetails, getRecentCommits } from '../controllers/repoController.js';
import { getGroups, createGroup } from '../controllers/groupController.js';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { getAnalyticsStats } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

router.get('/repos', getRepos);
router.get('/repos/:owner/:repo/commits', getRecentCommits);
router.get('/repos/:owner/:repo', getRepoDetails);
router.get('/groups', getGroups);
router.post('/groups', createGroup);
router.get('/dashboard', getDashboardStats);

router.get('/analytics', getAnalyticsStats);

export default router;
