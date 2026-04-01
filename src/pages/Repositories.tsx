import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, GitFork, GitCommit, Lock, User, ArrowUpDown } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import type { Repository } from '../types';
import { useToast } from '../context/ToastContext';

export const Repositories: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { data: repos, loading, error, isCachedData } = useApi(api.getRepositories, { cacheKey: 'repositories' });
    const [activeFilter, setActiveFilter] = useState(() => window.localStorage.getItem('repos:filter') || 'All Repos');
    const [searchQuery, setSearchQuery] = useState(() => window.localStorage.getItem('repos:search') || '');
    const [sortBy, setSortBy] = useState(() => window.localStorage.getItem('repos:sort') || 'Recently Updated');
    const [favorites, setFavorites] = useState<string[]>(() => {
        try {
            const stored = window.localStorage.getItem('repos:favorites');
            return stored ? JSON.parse(stored) as string[] : [];
        } catch {
            return [];
        }
    });

    if (loading) return <div className="flex h-64 items-center justify-center"><Spinner size={40} /></div>;
    if (!repos) return <div className="text-red-400">Failed to load repositories: {error}</div>;

    const filters = ['All Repos', 'Mine', 'Shared', 'Private', 'Active'];
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredRepos = repos.filter((repo: Repository) => {
        const matchesQuery = !normalizedQuery || [
            repo.name,
            repo.owner,
            repo.language,
            repo.description,
            repo.creatorLogin
        ].some((value) => value?.toLowerCase().includes(normalizedQuery));

        const matchesFilter = activeFilter === 'All Repos'
            || (activeFilter === 'Mine' && repo.isOwnedByUser)
            || (activeFilter === 'Shared' && !repo.isOwnedByUser)
            || (activeFilter === 'Private' && repo.isPrivate)
            || (activeFilter === 'Active' && repo.userCommits > 0);

        return matchesQuery && matchesFilter;
    }).sort((left, right) => {
        const leftFav = favorites.includes(left.id) ? 1 : 0;
        const rightFav = favorites.includes(right.id) ? 1 : 0;

        if (leftFav !== rightFav) {
            return rightFav - leftFav;
        }

        switch (sortBy) {
            case 'Stars':
                return right.stars - left.stars;
            case 'Your Commits':
                return right.userCommits - left.userCommits;
            case 'Total Commits':
                return right.commits - left.commits;
            case 'Name':
                return left.name.localeCompare(right.name);
            default:
                return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
        }
    });

    const persistValue = (key: string, value: string) => {
        window.localStorage.setItem(key, value);
    };

    const toggleFavorite = (repoId: string, repoName: string) => {
        setFavorites((current) => {
            const next = current.includes(repoId)
                ? current.filter((id) => id !== repoId)
                : [...current, repoId];

            window.localStorage.setItem('repos:favorites', JSON.stringify(next));
            showToast(
                next.includes(repoId) ? `${repoName} added to favorites` : `${repoName} removed from favorites`,
                'success'
            );
            return next;
        });
    };

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
                <Input
                    icon
                    value={searchQuery}
                    onChange={(event) => {
                        setSearchQuery(event.target.value);
                        persistValue('repos:search', event.target.value);
                    }}
                    placeholder="Search by repo, owner, language, or description..."
                    className="bg-slate-900/40"
                />
                <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {filters.map(filter => (
                        <Badge
                            key={filter}
                            variant={activeFilter === filter ? 'primary' : 'outline'}
                            className="px-4 py-1.5 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap"
                            onClick={() => {
                                setActiveFilter(filter);
                                persistValue('repos:filter', filter);
                            }}
                        >
                            {filter}
                        </Badge>
                    ))}
                    <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
                        <ArrowUpDown size={14} />
                        <select
                            className="bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200"
                            value={sortBy}
                            onChange={(event) => {
                                setSortBy(event.target.value);
                                persistValue('repos:sort', event.target.value);
                            }}
                        >
                            {['Recently Updated', 'Stars', 'Your Commits', 'Total Commits', 'Name'].map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-4 mt-6">
                {(isCachedData || error) && (
                    <Card className="p-4 text-sm text-sky-100 border-sky-500/20 bg-sky-500/10">
                        Showing cached repositories while the backend reconnects.
                    </Card>
                )}
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest pl-2">
                    {filteredRepos.length} repository{filteredRepos.length === 1 ? '' : 'ies'} shown
                </h2>
                {filteredRepos.length > 0 ? filteredRepos.map((repo: Repository) => (
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

                            <div className="shrink-0 flex items-start gap-2">
                                <button
                                    type="button"
                                    className={`mt-1 rounded-full p-1.5 border transition-colors ${favorites.includes(repo.id) ? 'border-amber-400/40 bg-amber-400/10 text-amber-300' : 'border-slate-700 bg-slate-900/60 text-slate-500 hover:text-amber-300'}`}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        toggleFavorite(repo.id, repo.name);
                                    }}
                                    aria-label={favorites.includes(repo.id) ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                    <Star size={14} className={favorites.includes(repo.id) ? 'fill-current' : ''} />
                                </button>
                                <div className="relative" title={repo.creatorLogin || repo.owner}>
                                    {repo.creatorAvatarUrl ? (
                                        <img
                                            src={repo.creatorAvatarUrl}
                                            alt={repo.creatorLogin || repo.owner}
                                            className="w-9 h-9 rounded-full border-2 border-slate-700 group-hover:border-primary/50 transition-colors shadow-md object-cover"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center">
                                            <User size={14} className="text-slate-400" />
                                        </div>
                                    )}
                                    {!repo.isOwnedByUser && repo.ownerAvatarUrl && (
                                        <img
                                            src={repo.ownerAvatarUrl}
                                            alt={repo.owner}
                                            title={repo.owner}
                                            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-slate-900 object-cover"
                                        />
                                    )}
                                </div>
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
                )) : (
                    <Card className="p-8 text-center text-slate-400">
                        No repositories match this search and filter combination.
                    </Card>
                )}
            </div>
        </div>
    );
};
