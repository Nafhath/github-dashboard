import express from 'express';
import { getRepos, getRepoDetails, getRecentCommits } from '../controllers/repoController.js';
import { getGroups, createGroup } from '../controllers/groupController.js';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { getAnalyticsStats } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/repos', getRepos);
router.get('/repos/:owner/:repo/commits', getRecentCommits);
router.get('/repos/:owner/:repo', getRepoDetails);
router.get('/groups', getGroups);
router.post('/groups', createGroup);
router.get('/dashboard', getDashboardStats);

// Mock Analytics Endpoint (Derived from Repos/Groups in a real app, 
// using static struct mixed with dynamic total for demo purposes)
router.get('/analytics', async (req, res, next) => {
    try {
        res.json({
            totalCommits: 5240, // Usually aggregated via DB/Cache
            commitsIncrease: 12,
            languageDistribution: [
                { name: 'TypeScript', value: 60, color: '#0ea5e9' },
                { name: 'Rust', value: 20, color: '#14b8a6' },
                { name: 'CSS', value: 20, color: '#a855f7' },
            ],
            commitTimeline: [
                { date: '1 Oct', commits: 12 },
                { date: '5 Oct', commits: 15 },
                { date: '10 Oct', commits: 8 },
                { date: '15 Oct', commits: 35 },
                { date: '20 Oct', commits: 22 },
                { date: '25 Oct', commits: 45 },
                { date: '30 Oct', commits: 60 },
            ]
        });
    } catch (error) {
        next(error);
    }
});

export default router;
