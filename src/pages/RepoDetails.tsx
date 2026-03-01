import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, GitFork, GitCommit, Users, Github, Lock, Terminal } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import type { Contributor } from '../types';

export const RepoDetails: React.FC = () => {
    const { owner, repoName } = useParams<{ owner: string; repoName: string }>();
    const navigate = useNavigate();

    const { data: repo, loading, error } = useApi(() => api.getRepoDetails(owner!, repoName!), [owner, repoName]);

    if (loading) return <div className="flex h-[80vh] items-center justify-center"><Spinner size={50} /></div>;
    if (error || !repo) return <div className="text-red-400 p-8 text-center flex flex-col items-center gap-4">
        Failed to load repository details: {error}
        <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
    </div>;

    const getDotColor = (lang: string) => {
        switch (lang) {
            case 'TypeScript': return 'bg-sky-400';
            case 'Python': return 'bg-emerald-400';
            case 'JavaScript': return 'bg-amber-400';
            case 'Rust': return 'bg-orange-500';
            case 'CSS': return 'bg-purple-400';
            case 'HTML': return 'bg-red-500';
            default: return 'bg-slate-400';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-12">
            <div className="flex items-start gap-4 mb-6">
                <Button variant="ghost" size="icon" className="mt-1" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </Button>
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        <Terminal size={24} className="text-primary" />
                        <h1 className="text-3xl font-bold text-white tracking-tight">{repo.name}</h1>
                        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 tracking-widest uppercase text-[10px] ml-2 font-bold px-2 py-1">
                            {repo.isPrivate ? <><Lock size={12} className="inline mr-1" /> Private</> : 'Public'}
                        </Badge>
                    </div>
                    <p className="text-slate-400 text-lg leading-relaxed max-w-3xl">{repo.description}</p>
                </div>
                <Button
                    variant="primary"
                    className="shadow-lg shadow-primary/20 flex items-center gap-2"
                    onClick={() => window.open(repo.htmlUrl, '_blank')}
                >
                    <Github size={18} /> View on GitHub
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-5 flex flex-col items-center justify-center text-center gap-2 group hover:border-amber-500/50 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Star size={24} />
                    </div>
                    <div className="text-2xl font-black text-white">{repo.stars.toLocaleString()}</div>
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Stars</div>
                </Card>
                <Card className="p-5 flex flex-col items-center justify-center text-center gap-2 group hover:border-sky-500/50 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <GitFork size={24} />
                    </div>
                    <div className="text-2xl font-black text-white">{repo.forks.toLocaleString()}</div>
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Forks</div>
                </Card>
                <Card className="p-5 flex flex-col items-center justify-center text-center gap-2 group hover:border-emerald-500/50 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <GitCommit size={24} />
                    </div>
                    <div className="text-2xl font-black text-white">{repo.commits.toLocaleString()}</div>
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Commits</div>
                </Card>
                <Card className="p-5 flex flex-col items-center justify-center text-center gap-2 group hover:border-purple-500/50 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Users size={24} />
                    </div>
                    <div className="text-2xl font-black text-white">{repo.contributors?.length || 0}</div>
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Contributors</div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="text-primary" /> Top Contributors
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {repo.contributors && repo.contributors.length > 0 ? (
                            repo.contributors.map((contributor: Contributor) => (
                                <Card key={contributor.id} className="p-4 flex items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => window.open(contributor.htmlUrl, '_blank')}>
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700">
                                        <img src={contributor.avatarUrl} alt={contributor.login} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-slate-200 font-semibold">{contributor.login}</h3>
                                        <p className="text-xs text-primary mt-1 font-medium">{contributor.contributions} contributions</p>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full text-center p-8 bg-slate-900/50 rounded-xl border border-dashed border-slate-700">
                                <p className="text-slate-500">No contributors found or data unavailable.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white">Languages</h2>
                    <Card className="p-6">
                        {repo.languages && Object.keys(repo.languages).length > 0 ? (
                            <div className="space-y-4">
                                {Object.entries(repo.languages)
                                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                                    .map(([lang, bytes], _, arr) => {
                                        const totalBytes = arr.reduce((sum, [, b]) => sum + (b as number), 0);
                                        const percentage = (((bytes as number) / totalBytes) * 100).toFixed(1);

                                        return (
                                            <div key={lang} className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="flex items-center gap-2 text-slate-300 font-medium">
                                                        <span className={`w-2.5 h-2.5 rounded-full ${getDotColor(lang)} shadow-sm`} />
                                                        {lang}
                                                    </span>
                                                    <span className="text-slate-500 font-mono text-xs">{percentage}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${getDotColor(lang)} rounded-full`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-4 text-sm">Language data not available.</p>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};
