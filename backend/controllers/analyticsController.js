import { fetchRepositories } from '../services/githubService.js';

export const getAnalyticsStats = async (req, res, next) => {
    try {
        const username = req.query.username || 'octocat';
        const repos = await fetchRepositories(username);

        const totalCommits = repos.reduce((sum, r) => sum + r.commits, 0);

        // Calculate Language Distribution
        const languageCounts = {};
        repos.forEach(repo => {
            if (repo.language && repo.language !== 'Unknown') {
                languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
            }
        });

        // Sort, translate to PieChart format, filter top 5, and assign static colors
        const colors = ['#0ea5e9', '#14b8a6', '#a855f7', '#f43f5e', '#eab308', '#64748b'];
        const languageDistribution = Object.entries(languageCounts)
            .sort((a, b) => b[1] - a[1]) // highest first
            .slice(0, 5) // top 5
            .map(([name, count], index) => {
                // percentage
                const value = Math.round((count / Object.keys(languageCounts).reduce((t, k) => t + languageCounts[k], 0)) * 100);
                return {
                    name,
                    value,
                    color: colors[index % colors.length]
                };
            });

        // Commits timeline (mocked to simulate an active month relative to total commits since GitHub's REST 
        // API doesn't give a fast timeline across ALL repos without rate limit suicide!)
        const commitTimeline = [
            { date: '1 Oct', commits: Math.round(totalCommits * 0.05) },
            { date: '5 Oct', commits: Math.round(totalCommits * 0.12) },
            { date: '10 Oct', commits: Math.round(totalCommits * 0.08) },
            { date: '15 Oct', commits: Math.round(totalCommits * 0.22) },
            { date: '20 Oct', commits: Math.round(totalCommits * 0.15) },
            { date: '25 Oct', commits: Math.round(totalCommits * 0.28) },
            { date: '30 Oct', commits: Math.round(totalCommits * 0.10) },
        ];

        res.json({
            totalCommits,
            commitsIncrease: 12,
            languageDistribution,
            commitTimeline
        });

    } catch (error) {
        next(error);
    }
};
