import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, GripVertical, GitCommit } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';

export const Groups: React.FC = () => {
    const navigate = useNavigate();
    const { data: groups, loading: groupsLoading, error: groupsErr } = useApi(api.getGroups);
    const { data: repos, loading: reposLoading, error: reposErr } = useApi(api.getRepositories);
    const [activeTab, setActiveTab] = useState('All Groups');

    if (groupsLoading || reposLoading) return <div className="flex h-64 items-center justify-center"><Spinner size={40} /></div>;
    if (groupsErr || reposErr || !groups || !repos) return <div className="text-red-400">Failed to load groups: {groupsErr || reposErr}</div>;

    const tabs = ['All Groups', 'Active', 'Archived'];

    const handleCreateGroup = async () => {
        const name = window.prompt("Enter new group name:");
        if (name) {
            try {
                await api.createGroup(name, '', []);
                window.location.reload(); // Simple refresh to fetch new data
            } catch (err) {
                alert("Failed to create group");
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-3 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    Project Groups
                </h1>
                <Button onClick={handleCreateGroup} size="icon" className="rounded-xl w-10 h-10 shadow-lg shadow-primary/20 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 flex items-center justify-center">
                    <Plus size={20} />
                </Button>
            </div>

            <div className="space-y-4">
                <Input icon placeholder="Search repositories..." className="bg-slate-900/40" />
                <div className="flex gap-6 border-b border-slate-800 pb-2">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            className={`text-sm font-medium pb-2 relative transition-colors ${activeTab === tab ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_10px_rgba(14,165,233,0.8)]" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-8 mt-8">
                {groups.map((group) => {
                    // Match repoId strings from group to actual repo objects fetched from Github
                    const groupRepos = group.repoIds ? repos.filter(r => group.repoIds.includes(r.name) || group.repoIds.includes(r.id)) : [];

                    return (
                        <div key={group.id} className="space-y-3">
                            <div className="flex justify-between items-center px-1 mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div>
                                    <h2 className="text-lg font-bold text-white">{group.name}</h2>
                                    {group.description && <span className="text-sm text-slate-500">{group.description}</span>}
                                </div>
                                <Badge variant="outline" className="text-xs text-primary font-medium border-primary/20 bg-primary/10 px-2 py-0.5">
                                    {group.totalCommits >= 1000 ? `${(group.totalCommits / 1000).toFixed(1)}k Commits` : `${group.totalCommits} Commits`}
                                </Badge>
                            </div>

                            {groupRepos.length > 0 ? (
                                <>
                                    {groupRepos.map(repo => (
                                        <Card key={repo.id} onClick={() => navigate(`/repo/mhmdn/${repo.name}`)} className="flex items-center justify-between py-3 px-4 group bg-slate-800/20 border-slate-700/50 backdrop-blur-none cursor-pointer hover:bg-slate-800/40 mb-2">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-primary transition-colors">{repo.name}</h3>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">{repo.language}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <span className="text-xs font-semibold text-primary flex items-center gap-1.5"><GitCommit size={14} /> {repo.commits} commits</span>
                                                <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-500 hover:text-white -mr-2 hover:bg-transparent">
                                                    <GripVertical size={18} />
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                    <div className="border border-dashed border-slate-700/50 rounded-xl p-3 flex justify-center text-[11px] font-medium text-slate-500 bg-slate-800/10 hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => window.prompt("Enter Repo Name to Add:")}>
                                        Assign repository (Demo)
                                    </div>
                                </>
                            ) : (
                                <Card className="flex flex-col items-center justify-center p-8 bg-slate-900/30 border-slate-800/50 shadow-inner">
                                    <div className="text-primary/70 mb-3">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" /><path d="M8.5 2h7" /><path d="M7 16h10" /></svg>
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium mb-1.5">No repositories in this group yet.</p>
                                    <button className="text-primary text-xs font-semibold hover:text-sky-400 transition-colors flex items-center gap-1" onClick={() => window.prompt("Enter Repo Name to Add:")}>
                                        <Plus size={14} /> Assign Repo
                                    </button>
                                </Card>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
