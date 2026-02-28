import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Terminal, GitCommit, GitBranch, GitPullRequest, AlertCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import type { Activity } from '../types';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { data, loading, error } = useApi(api.getDashboardStats);

    if (loading) return <div className="flex h-64 items-center justify-center"><Spinner size={40} /></div>;
    if (error || !data) return <div className="text-red-400">Failed to load dashboard: {error}</div>;

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'branch': return <GitBranch size={16} className="text-primary" />;
            case 'issue': return <AlertCircle size={16} className="text-amber-400" />;
            case 'pr': return <GitPullRequest size={16} className="text-emerald-400" />;
            default: return <GitCommit size={16} className="text-slate-400" />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px]">
                        <div className="w-full h-full rounded-full bg-slate-900 border-2 border-slate-900 overflow-hidden">
                            <img src="https://avatars.githubusercontent.com/u/64386740?v=4" alt="User Avatar" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
                        <p className="text-slate-400 text-sm">Welcome back, Nafhath</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="bg-slate-800/50 rounded-full">
                        <Search size={20} />
                    </Button>
                    <Button variant="ghost" size="icon" className="bg-slate-800/50 rounded-full relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-primary font-semibold text-sm tracking-wider uppercase">
                            <Terminal size={18} /> Repositories
                        </div>
                        <span className="text-emerald-400 text-sm font-medium bg-emerald-500/10 px-2 py-1 rounded-lg">
                            +{data.reposIncrease}%
                        </span>
                    </div>
                    <div className="text-5xl font-black text-white">{data.totalRepos}</div>
                </Card>

                <Card className="flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-secondary font-semibold text-sm tracking-wider uppercase">
                            <GitCommit size={18} /> Commits
                        </div>
                        <span className="text-emerald-400 text-sm font-medium bg-emerald-500/10 px-2 py-1 rounded-lg">
                            +{data.commitsIncrease}%
                        </span>
                    </div>
                    <div className="text-5xl font-black text-white">{data.totalCommits.toLocaleString()}</div>
                </Card>
            </div>

            {/* Most Active Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Most Active</h2>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" onClick={() => navigate('/repos')}>See All</Button>
                </div>
                <Card noPadding className="relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-slate-800/20 to-transparent z-0" />

                    {/* Mock Chart Background */}
                    <div className="absolute bottom-0 left-0 w-full h-32 flex items-end gap-1 opacity-40 px-6 z-0 mix-blend-screen">
                        {[40, 30, 60, 45, 80, 50, 90, 70, 100].map((h, i) => (
                            <div key={i} className="flex-1 bg-primary/60 rounded-t-sm transition-all duration-500 group-hover:bg-primary/80" style={{ height: `${h}%` }} />
                        ))}
                    </div>

                    <div className="relative z-10 p-6 flex flex-col h-[240px] justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary p-2 rounded-lg shadow-[0_0_15px_rgba(14,165,233,0.5)]">
                                <Terminal size={20} className="text-white" />
                            </div>
                            <span className="text-2xl font-bold text-white">{data.mostActiveRepo}</span>
                        </div>

                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Last active 2 hours ago</p>
                                <p className="text-secondary font-medium text-sm mt-1">High volume this week</p>
                            </div>
                            <Button
                                className="shadow-[0_0_20px_rgba(14,165,233,0.3)]"
                                onClick={() => window.open(`https://github.com/mhmdn/${data.mostActiveRepo}`, '_blank')}
                            >
                                View Repo
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Recent Activity */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
                <div className="space-y-3">
                    {data.recentActivities.map((activity: Activity) => (
                        <Card key={activity.id} className="p-4 flex items-center gap-4 hover:bg-slate-800/60 transition-colors">
                            <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 shadow-inner">
                                {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white">
                                    <span className="text-slate-300 font-semibold">{activity.title.split(' ')[0]} {activity.title.split(' ')[1]}</span>
                                    {" "}
                                    <span className="text-primary">{activity.title.split(' ').slice(2).join(' ')}</span>
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {activity.type === 'pr' ? `By ${activity.author}` : `In ${activity.repo}`} • {activity.timestamp}
                                </p>
                            </div>
                            {activity.status === 'merged' && (
                                <Badge variant="success" dot>Merged</Badge>
                            )}
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};
