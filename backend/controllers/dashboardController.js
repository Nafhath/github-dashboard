import { fetchRepositories } from '../services/githubService.js';
import axios from 'axios';

export const getDashboardStats = async (req, res, next) => {
    try {
        const username = req.query.username || 'octocat';
        const repos = await fetchRepositories(username);

        // Fallback/Demo activities if events API isn't built yet, but we requested it!
        let activities = [];
        try {
            // Only fetch external event log if we have a token to avoid instant block
            if (process.env.GITHUB_TOKEN) {
                const eventsRes = await axios.get(`https://api.github.com/users/${username}/events/public?per_page=10`, {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'Authorization': `token ${process.env.GITHUB_TOKEN}`
                    }
                });

                activities = eventsRes.data.map((event, idx) => {
                    const type = event.type === 'PushEvent' ? 'commit'
                        : event.type === 'IssuesEvent' ? 'issue'
                            : event.type === 'PullRequestEvent' ? 'pr'
                                : 'branch';

                    let title = event.type;
                    if (event.type === 'PushEvent') {
                        title = event.payload.commits?.[0]?.message || 'Push to branch';
                    } else if (event.type === 'IssuesEvent') {
                        title = `${event.payload.action} issue #${event.payload.issue?.number}`;
                    } else if (event.type === 'PullRequestEvent') {
                        title = `${event.payload.action} PR #${event.payload.pull_request?.number}`;
                    }

                    return {
                        id: event.id || idx.toString(),
                        type,
                        title: title.substring(0, 50),
                        repo: event.repo.name.split('/')[1] || event.repo.name,
                        author: event.actor.display_login || event.actor.login,
                        timestamp: new Date(event.created_at).toLocaleDateString(),
                        status: event.payload.pull_request?.merged ? 'merged' : undefined
                    };
                });
            }
        } catch (e) {
            console.error("Failed to load real github events:", e.message);
        }

        // Fallback if no events loaded (rate limit / no token)
        if (activities.length === 0) {
            activities = [
                { id: '1', type: 'commit', title: 'Update dependencies', repo: repos[0]?.name || 'core', author: username, timestamp: '15m ago' },
                { id: '2', type: 'commit', title: 'Fix navigation bug', repo: repos[1]?.name || 'ui', author: username, timestamp: '1h ago' },
            ];
        }

        const totalCommits = repos.reduce((sum, r) => sum + r.commits, 0);
        // Sort repos by most recently updated (latest push/commit)
        const sortedByDate = [...repos].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        const mostRecentRepo = sortedByDate.length > 0 ? sortedByDate[0] : null;

        res.json({
            totalRepos: repos.length,
            totalCommits,
            reposIncrease: 1,
            commitsIncrease: 2,
            mostActiveRepo: mostRecentRepo?.name || 'None',
            mostActiveRepoOwner: mostRecentRepo?.owner || 'Nafhath',
            mostRecentRepoUpdatedAt: mostRecentRepo?.updatedAt || null,
            recentActivities: activities,
        });
    } catch (error) {
        next(error);
    }
};
