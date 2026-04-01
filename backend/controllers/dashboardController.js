import { buildGithubContext, fetchRepositories } from '../services/githubService.js';
import axios from 'axios';

export const getDashboardStats = async (req, res, next) => {
    try {
        const context = buildGithubContext(req);
        const username = context.username;
        const repos = await fetchRepositories(context);

        // Only count repos where the user has committed (userCommits > 0)
        const contributedRepos = repos.filter(r => r.userCommits > 0);
        const totalUserCommits = repos.reduce((sum, r) => sum + (r.userCommits || 0), 0);

        // Most active = repo with the most user commits, using recency as a tiebreaker.
        const mostActiveRepo = [...contributedRepos].sort((a, b) => {
            if ((b.userCommits || 0) !== (a.userCommits || 0)) {
                return (b.userCommits || 0) - (a.userCommits || 0);
            }

            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        })[0] || repos[0] || null;

        // Real activity from GitHub: use authenticated events (includes private) or public events
        let activities = [];
        try {
            const token = context.token || process.env.GITHUB_TOKEN;
            if (token) {
                const headers = {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `token ${token}`
                };
                const realLogin = req.auth?.login || (await axios.get('https://api.github.com/user', { headers })).data.login;
                // Fetch events performed by the authenticated user
                const eventsRes = await axios.get(
                    `https://api.github.com/users/${realLogin}/events?per_page=15`,
                    { headers }
                );

                const rawEvents = eventsRes.data
                    .filter(e => ['PushEvent', 'IssuesEvent', 'PullRequestEvent', 'CreateEvent'].includes(e.type))
                    .slice(0, 10);

                activities = await Promise.all(rawEvents.map(async (event, idx) => {
                    const type = event.type === 'PushEvent' ? 'commit'
                        : event.type === 'IssuesEvent' ? 'issue'
                            : event.type === 'PullRequestEvent' ? 'pr'
                                : 'branch';

                    let title = event.type;
                    if (event.type === 'PushEvent') {
                        const branch = event.payload.ref?.replace('refs/heads/', '') || 'main';
                        const repoFullName = event.repo.name; // e.g. "Nafhath/github-dashboard"
                        const headSha = event.payload.head;
                        // Try payload commits first, then fetch real message using head SHA
                        let commitMsg = event.payload.commits?.find(c => c.message?.trim())?.message?.split('\n')[0]?.trim();
                        if (!commitMsg && headSha) {
                            try {
                                const commitRes = await axios.get(
                                    `https://api.github.com/repos/${repoFullName}/commits/${headSha}`,
                                    { headers }
                                );
                                commitMsg = commitRes.data?.commit?.message?.split('\n')[0]?.trim();
                            } catch (_) { /* ignore */ }
                        }
                        const count = event.payload.size || event.payload.commits?.length || 1;
                        title = commitMsg || `Pushed ${count} commit${count !== 1 ? 's' : ''} to ${branch}`;
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
                        title: title.substring(0, 70),
                        repo: event.repo.name.split('/')[1] || event.repo.name,
                        repoOwner: event.repo.name.split('/')[0] || username,
                        author: event.actor.display_login || event.actor.login,
                        timestamp: relTime,
                        status: event.payload.pull_request?.merged ? 'merged' : undefined
                    };
                }));
            }
        } catch (e) {
            console.error("Failed to load real github events:", e.message);
        }

        // Relative last active time from most recent repo
        const lastActiveRelative = (() => {
            if (!mostActiveRepo?.updatedAt) return 'Unknown';
            const diffMs = Date.now() - new Date(mostActiveRepo.updatedAt).getTime();
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
            mostActiveRepo: mostActiveRepo?.name || 'None',
            mostActiveRepoOwner: mostActiveRepo?.owner || 'Nafhath',
            mostActiveRepoCommits: mostActiveRepo?.userCommits || 0,
            mostRecentRepoUpdatedAt: mostActiveRepo?.updatedAt || null,
            lastActiveRelative,
            recentActivities: activities,
        });
    } catch (error) {
        next(error);
    }
};
