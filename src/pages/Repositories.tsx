import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, GitFork, GitCommit, Lock, User } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import type { Repository } from '../types';

export const Repositories: React.FC = () => {
    const navigate = useNavigate();
    const { data: repos, loading, error } = useApi(api.getRepositories);
    const [activeFilter, setActiveFilter] = useState('All Repos');

    if (loading) return <div className="flex h-64 items-center justify-center"><Spinner size={40} /></div>;
    if (error || !repos) return <div className="text-red-400">Failed to load repositories: {error}</div>;

    const filters = ['All Repos', 'Active', 'Language', 'Private'];

    const getDotColor = (lang: string) => {
        switch (lang) {
            case 'TypeScript': return 'bg-sky-400';
            case 'Python': return 'bg-emerald-400';
            case 'JavaScript': return 'bg-amber-400';
            case 'Rust': return 'bg-orange-500';
            default: return 'bg-slate-400';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-3 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    Inventory
                </h1>
                <Button size="icon" className="rounded-xl w-10 h-10 shadow-lg shadow-primary/20 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30">
                    <span className="text-2xl leading-none font-light mb-1">+</span>
                </Button>
            </div>

            <div className="space-y-4">
                <Input icon placeholder="Search repositories..." className="bg-slate-900/40" />
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {filters.map(filter => (
                        <Badge
                            key={filter}
                            variant={activeFilter === filter ? 'primary' : 'outline'}
                            className="px-4 py-1.5 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap"
                            onClick={() => setActiveFilter(filter)}
                        >
                            {filter} {filter !== 'All Repos' && <span className="ml-1 opacity-50 text-[10px]">▼</span>}
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="space-y-4 mt-6">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest pl-2">
                    {repos.filter((r: Repository) => r.isOwnedByUser).length > 0 ? 'Your Repositories First' : 'Recent Repositories'}
                </h2>
                {repos.map((repo: Repository) => (
                    <Card key={repo.id} onClick={() => navigate(`/repo/${repo.owner}/${repo.name}`)} className="p-5 flex flex-col gap-3 group hover:border-primary/50 transition-colors cursor-pointer relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0 pr-4">
                                <h3 className="text-lg font-semibold text-slate-200 group-hover:text-primary transition-colors truncate">{repo.name}</h3>
                                {repo.isPrivate && <Lock size={14} className="text-slate-500 shrink-0" />}
                                {!repo.isOwnedByUser && (
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                                        {repo.owner}
                                    </span>
                                )}
                            </div>

                            {/* Owner avatar in top-right corner */}
                            <div className="shrink-0 relative" title={repo.owner}>
                                {repo.ownerAvatarUrl ? (
                                    <img
                                        src={repo.ownerAvatarUrl}
                                        alt={repo.owner}
                                        className="w-8 h-8 rounded-full border-2 border-slate-700 group-hover:border-primary/50 transition-colors shadow-md object-cover"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center">
                                        <User size={14} className="text-slate-400" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <p className="text-sm text-slate-400/80 leading-relaxed pr-2 line-clamp-2">
                            {repo.description || <span className="italic text-slate-600">No description</span>}
                        </p>

                        <div className="flex items-center gap-5 mt-2 text-xs text-slate-400 font-medium flex-wrap">
                            <span className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${getDotColor(repo.language)} shadow-sm`} />
                                {repo.language}
                            </span>
                            <span className="flex items-center gap-1 hover:text-white transition-colors"><Star size={14} /> {(repo.stars >= 1000) ? `${(repo.stars / 1000).toFixed(1)}k` : repo.stars}</span>
                            <span className="flex items-center gap-1 hover:text-white transition-colors"><GitFork size={14} /> {repo.forks}</span>
                            <span className="flex items-center gap-1 hover:text-white transition-colors">
                                <GitCommit size={14} /> {repo.commits >= 1000 ? `${(repo.commits / 1000).toFixed(1)}k` : repo.commits} total
                            </span>
                            {repo.userCommits > 0 && (
                                <span className="flex items-center gap-1 text-primary font-semibold">
                                    <GitCommit size={14} className="text-primary" /> {repo.userCommits} mine
                                </span>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
