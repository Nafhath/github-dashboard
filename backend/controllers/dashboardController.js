import { fetchRepositories } from '../services/githubService.js';
import axios from 'axios';

export const getDashboardStats = async (req, res, next) => {
    try {
        const username = req.query.username || 'octocat';
        const repos = await fetchRepositories(username);

        // Only count repos where the user has committed (userCommits > 0)
        const contributedRepos = repos.filter(r => r.userCommits > 0);
        const totalUserCommits = repos.reduce((sum, r) => sum + (r.userCommits || 0), 0);

        // Most recently updated among contributed repos
        const sortedByDate = [...contributedRepos].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        const mostRecentRepo = sortedByDate.length > 0 ? sortedByDate[0] : (repos[0] || null);

        // Real activity from GitHub: use authenticated events (includes private) or public events
        let activities = [];
        try {
            if (process.env.GITHUB_TOKEN) {
                // /users/:username/events gives real recent events (public + orgs if authed)
                const eventsRes = await axios.get(`https://api.github.com/users/${username}/events?per_page=10`, {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'Authorization': `token ${process.env.GITHUB_TOKEN}`
                    }
                });

                activities = eventsRes.data
                    .filter(e => ['PushEvent', 'IssuesEvent', 'PullRequestEvent', 'CreateEvent'].includes(e.type))
                    .map((event, idx) => {
                        const type = event.type === 'PushEvent' ? 'commit'
                            : event.type === 'IssuesEvent' ? 'issue'
                                : event.type === 'PullRequestEvent' ? 'pr'
                                    : 'branch';

                        let title = event.type;
                        if (event.type === 'PushEvent') {
                            title = event.payload.commits?.[0]?.message?.split('\n')[0] || 'Push to branch';
                        } else if (event.type === 'IssuesEvent') {
                            title = `${event.payload.action} issue: ${event.payload.issue?.title || ''}`;
                        } else if (event.type === 'PullRequestEvent') {
                            title = `${event.payload.action} PR: ${event.payload.pull_request?.title || ''}`;
                        } else if (event.type === 'CreateEvent') {
                            title = `Created ${event.payload.ref_type} ${event.payload.ref || ''}`;
                        }

                        // Relative time
                        const diffMs = Date.now() - new Date(event.created_at).getTime();
                        const diffMins = Math.floor(diffMs / 60000);
                        const diffHrs = Math.floor(diffMs / 3600000);
                        const diffDays = Math.floor(diffMs / 86400000);
                        const relTime = diffDays > 0 ? `${diffDays}d ago`
                            : diffHrs > 0 ? `${diffHrs}h ago`
                                : `${diffMins}m ago`;

                        return {
                            id: event.id || idx.toString(),
                            type,
                            title: title.substring(0, 60),
                            repo: event.repo.name.split('/')[1] || event.repo.name,
                            repoOwner: event.repo.name.split('/')[0] || username,
                            author: event.actor.display_login || event.actor.login,
                            timestamp: relTime,
                            status: event.payload.pull_request?.merged ? 'merged' : undefined
                        };
                    });
            }
        } catch (e) {
            console.error("Failed to load real github events:", e.message);
        }

        // Relative last active time from most recent repo
        const lastActiveRelative = (() => {
            if (!mostRecentRepo?.updatedAt) return 'Unknown';
            const diffMs = Date.now() - new Date(mostRecentRepo.updatedAt).getTime();
            const mins = Math.floor(diffMs / 60000);
            const hrs = Math.floor(diffMs / 3600000);
            const days = Math.floor(diffMs / 86400000);
            if (days > 0) return `${days}d ago`;
            if (hrs > 0) return `${hrs}h ago`;
            return `${mins}m ago`;
        })();

        res.json({
            totalRepos: contributedRepos.length,
            totalCommits: totalUserCommits,
            reposIncrease: 1,
            commitsIncrease: 2,
            mostActiveRepo: mostRecentRepo?.name || 'None',
            mostActiveRepoOwner: mostRecentRepo?.owner || 'Nafhath',
            mostRecentRepoUpdatedAt: mostRecentRepo?.updatedAt || null,
            lastActiveRelative,
            recentActivities: activities,
        });
    } catch (error) {
        next(error);
    }
};
