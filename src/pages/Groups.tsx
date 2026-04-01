import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, GitCommit, X, Pencil, Trash2, FolderOpen } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import type { Group, Repository } from '../types';
import { useToast } from '../context/ToastContext';

const getRepoFullName = (repo: Repository) => `${repo.owner}/${repo.name}`;

export const Groups: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { data: groups, loading: groupsLoading, error: groupsErr, refetch: refetchGroups, isCachedData: groupsCached } = useApi(api.getGroups, { cacheKey: 'groups' });
    const { data: repos, loading: reposLoading, error: reposErr, isCachedData: reposCached } = useApi(api.getRepositories, { cacheKey: 'repositories' });
    const [activeTab, setActiveTab] = useState('All Groups');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRepos, setSelectedRepos] = useState<Record<string, string>>({});
    const [busyGroupId, setBusyGroupId] = useState<string | null>(null);

    const tabs = ['All Groups', 'With Repos', 'Empty'];

    const repoLookups = useMemo(() => {
        const byId = new Map<string, Repository>();
        const byFullName = new Map<string, Repository>();
        const byName = new Map<string, Repository[]>();

        (repos || []).forEach((repo) => {
            byId.set(repo.id, repo);
            byFullName.set(getRepoFullName(repo), repo);

            const matches = byName.get(repo.name) || [];
            matches.push(repo);
            byName.set(repo.name, matches);
        });

        return { byId, byFullName, byName };
    }, [repos]);

    const resolveRepoRef = (repoRef: string) => {
        return repoLookups.byId.get(repoRef)
            || repoLookups.byFullName.get(repoRef)
            || (() => {
                const matches = repoLookups.byName.get(repoRef) || [];
                return matches.length === 1 ? matches[0] : null;
            })();
    };

    const groupHasRepo = (group: Group, repo: Repository) => group.repoIds.some((repoRef) => {
        if (repoRef === repo.id || repoRef === getRepoFullName(repo)) {
            return true;
        }

        if (repoRef !== repo.name) {
            return false;
        }

        const matches = repoLookups.byName.get(repo.name) || [];
        return matches.length === 1 && matches[0].id === repo.id;
    });

    const getGroupRepos = (group: Group) => {
        const resolvedRepos = group.repoIds
            .map(resolveRepoRef)
            .filter((repo): repo is Repository => !!repo);

        return Array.from(new Map(resolvedRepos.map((repo) => [repo.id, repo])).values());
    };

    const updateGroupRepos = async (group: Group, nextRepoIds: string[]) => {
        setBusyGroupId(group.id);

        try {
            await api.updateGroup(group.id, { repos: nextRepoIds });
            refetchGroups();
            showToast(`${group.name} updated`, 'success');
        } catch {
            showToast('Failed to update the group. Please try again.', 'error');
        } finally {
            setBusyGroupId(null);
        }
    };

    if (groupsLoading || reposLoading) return <div className="flex h-64 items-center justify-center"><Spinner size={40} /></div>;
    if (!groups || !repos) return <div className="text-red-400">Failed to load groups: {groupsErr || reposErr}</div>;

    const handleCreateGroup = async () => {
        const name = window.prompt('Enter new group name:');

        if (!name?.trim()) {
            return;
        }

        try {
            await api.createGroup(name.trim(), '', []);
            refetchGroups();
            showToast(`${name.trim()} created`, 'success');
        } catch {
            showToast('Failed to create group', 'error');
        }
    };

    const handleEditGroup = async (group: Group) => {
        const name = window.prompt('Update group name:', group.name);

        if (!name?.trim()) {
            return;
        }

        const description = window.prompt('Update group description:', group.description || '') ?? group.description ?? '';

        setBusyGroupId(group.id);
        try {
            await api.updateGroup(group.id, { name: name.trim(), description });
            refetchGroups();
            showToast(`${name.trim()} saved`, 'success');
        } catch {
            showToast('Failed to save group changes', 'error');
        } finally {
            setBusyGroupId(null);
        }
    };

    const handleDeleteGroup = async (group: Group) => {
        const confirmed = window.confirm(`Delete "${group.name}"?`);

        if (!confirmed) {
            return;
        }

        setBusyGroupId(group.id);
        try {
            await api.deleteGroup(group.id);
            refetchGroups();
            showToast(`${group.name} deleted`, 'success');
        } catch {
            showToast('Failed to delete the group', 'error');
        } finally {
            setBusyGroupId(null);
        }
    };

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredGroups = groups.filter((group) => {
        const groupRepos = getGroupRepos(group);
        const matchesTab = activeTab === 'All Groups'
            || (activeTab === 'With Repos' && groupRepos.length > 0)
            || (activeTab === 'Empty' && groupRepos.length === 0);

        const matchesQuery = !normalizedQuery || [
            group.name,
            group.description,
            ...groupRepos.map((repo) => `${repo.owner}/${repo.name}`),
            ...groupRepos.map((repo) => repo.language),
        ].some((value) => value?.toLowerCase().includes(normalizedQuery));

        return matchesTab && matchesQuery;
    });

    const totalAssignedRepos = groups.reduce((sum, group) => sum + getGroupRepos(group).length, 0);
    const mostActiveGroup = [...groups]
        .sort((left, right) => right.totalCommits - left.totalCommits)[0];

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
                <Input
                    icon
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search groups by name, repo, or language..."
                    className="bg-slate-900/40"
                />
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

            {(groupsCached || reposCached || groupsErr || reposErr) && (
                <Card className="p-4 text-sm text-sky-100 border-sky-500/20 bg-sky-500/10">
                    Showing cached group data while the backend reconnects.
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Groups</p>
                    <p className="text-3xl font-black text-white mt-2">{groups.length}</p>
                </Card>
                <Card className="p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Assigned Repositories</p>
                    <p className="text-3xl font-black text-white mt-2">{totalAssignedRepos}</p>
                </Card>
                <Card className="p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Most Active Group</p>
                    <p className="text-lg font-bold text-white mt-2">{mostActiveGroup?.name || 'None yet'}</p>
                    <p className="text-sm text-slate-400 mt-1">{mostActiveGroup?.totalCommits || 0} commits</p>
                </Card>
            </div>

            <div className="space-y-8 mt-8">
                {filteredGroups.length > 0 ? filteredGroups.map((group) => {
                    const groupRepos = getGroupRepos(group);
                    const unassignedRepos = repos.filter((repo) => !groupHasRepo(group, repo));
                    const selectedRepoRef = selectedRepos[group.id] || (unassignedRepos[0] ? getRepoFullName(unassignedRepos[0]) : '');
                    const unresolvedCount = group.repoIds.length - groupRepos.length;

                    return (
                        <div key={group.id} className="space-y-3">
                            <div className="flex justify-between items-center px-1 mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div>
                                    <h2 className="text-lg font-bold text-white">{group.name}</h2>
                                    {group.description && <span className="text-sm text-slate-500">{group.description}</span>}
                                    {unresolvedCount > 0 && (
                                        <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-300 bg-amber-500/10">
                                            {unresolvedCount} unresolved
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs text-primary font-medium border-primary/20 bg-primary/10 px-2 py-0.5">
                                        {group.totalCommits >= 1000 ? `${(group.totalCommits / 1000).toFixed(1)}k Commits` : `${group.totalCommits} Commits`}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-8 h-8"
                                        onClick={() => handleEditGroup(group)}
                                        disabled={busyGroupId === group.id}
                                    >
                                        <Pencil size={15} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-8 h-8 text-rose-300 hover:text-rose-200"
                                        onClick={() => handleDeleteGroup(group)}
                                        disabled={busyGroupId === group.id}
                                    >
                                        <Trash2 size={15} />
                                    </Button>
                                </div>
                            </div>

                            {groupRepos.length > 0 ? (
                                groupRepos.map(repo => (
                                    <Card key={repo.id} onClick={() => navigate(`/repo/${repo.owner}/${repo.name}`)} className="flex items-center justify-between py-3 px-4 group bg-slate-800/20 border-slate-700/50 backdrop-blur-none cursor-pointer hover:bg-slate-800/40 mb-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-200 group-hover:text-primary transition-colors">{repo.name}</h3>
                                                <p className="text-[11px] text-slate-500 mt-0.5">{repo.owner} · {repo.language}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-semibold text-primary flex items-center gap-1.5"><GitCommit size={14} /> {repo.commits} commits</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-8 h-8 text-slate-500 hover:text-white hover:bg-slate-800"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    const nextRepoIds = group.repoIds.filter((repoRef) => !groupHasRepo({ ...group, repoIds: [repoRef] }, repo));
                                                    updateGroupRepos(group, nextRepoIds);
                                                }}
                                                disabled={busyGroupId === group.id}
                                            >
                                                <X size={16} />
                                            </Button>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <Card className="flex flex-col items-center justify-center p-8 bg-slate-900/30 border-slate-800/50 shadow-inner">
                                    <FolderOpen size={30} className="text-primary/70 mb-3" />
                                    <p className="text-slate-400 text-sm font-medium mb-1.5">No repositories in this group yet.</p>
                                </Card>
                            )}

                            <div className="rounded-xl border border-dashed border-slate-700/50 p-4 bg-slate-800/10">
                                <div className="flex flex-col md:flex-row gap-3">
                                    <select
                                        className="flex-1 bg-[#0b121e]/50 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        value={selectedRepoRef || ''}
                                        onChange={(event) => setSelectedRepos((current) => ({ ...current, [group.id]: event.target.value }))}
                                        disabled={unassignedRepos.length === 0 || busyGroupId === group.id}
                                    >
                                        {unassignedRepos.length === 0 ? (
                                            <option value="">All repositories are already assigned</option>
                                        ) : (
                                            unassignedRepos.map((repo) => (
                                                <option key={repo.id} value={getRepoFullName(repo)}>
                                                    {repo.owner}/{repo.name}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    <Button
                                        onClick={() => {
                                            if (!selectedRepoRef) {
                                                return;
                                            }

                                            updateGroupRepos(group, [...group.repoIds, selectedRepoRef]);
                                        }}
                                        disabled={!selectedRepoRef || busyGroupId === group.id}
                                    >
                                        Assign Repository
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <Card className="p-8 text-center text-slate-400">
                        No groups match this search and filter combination.
                    </Card>
                )}
            </div>
        </div>
    );
};
