import React, { useState } from 'react';
import { Share2, ChevronLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const Analytics: React.FC = () => {
    const { data, loading, error, isCachedData } = useApi(api.getAnalytics, { cacheKey: 'analytics' });
    const [activeTab, setActiveTab] = useState('Overview');

    if (loading) return <div className="flex h-64 items-center justify-center"><Spinner size={40} /></div>;
    if (!data) return <div className="text-red-400">Failed to load analytics: {error}</div>;

    const tabs = ['Overview', 'Repositories', 'Languages'];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 bg-slate-800/50 hover:bg-slate-700/50 text-slate-200">
                        <ChevronLeft size={20} />
                    </Button>
                    <h1 className="text-xl font-bold flex items-center gap-3 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Activity Analytics
                    </h1>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <Share2 size={20} />
                </Button>
            </div>

            <div className="flex justify-around border-b border-slate-800">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        className={`flex-1 py-3 text-sm font-medium relative transition-colors ${activeTab === tab ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_10px_rgba(14,165,233,0.8)]" />}
                    </button>
                ))}
            </div>

            {(isCachedData || error) && (
                <Card className="p-4 text-sm text-sky-100 border-sky-500/20 bg-sky-500/10">
                    Showing cached analytics while the backend reconnects.
                </Card>
            )}

            <Card className="p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <h2 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">TOTAL COMMITS</h2>
                <div className="flex items-end gap-3 mb-1">
                    <span className="text-4xl font-black text-white">{data.totalCommits.toLocaleString()}</span>
                    <span className="text-emerald-400 font-semibold mb-1 text-sm">~{data.commitsIncrease}%</span>
                </div>
                <p className="text-sm text-slate-500 font-medium">Last 30 days vs previous period</p>

                {data.repoActivity && data.repoActivity.length > 0 && (() => {
                    const maxCommits = Math.max(...data.repoActivity.map((r: any) => r.commits), 1);

                    return (
                        <div className="mt-8">
                            <div className="flex items-end gap-2 h-20">
                                {data.repoActivity.map((repo: any, i: number) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                        <div
                                            className="w-full bg-primary/60 hover:bg-primary transition-colors rounded-t-sm"
                                            style={{ height: `${Math.max((repo.commits / maxCommits) * 100, 8)}%` }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-2">
                                {data.repoActivity.map((repo: any, i: number) => (
                                    <span key={i} className="flex-1 text-center text-[9px] font-bold text-slate-600 tracking-widest uppercase truncate px-0.5">
                                        {repo.name.length > 8 ? repo.name.substring(0, 8) + '…' : repo.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })()}
            </Card>

            <Card className="p-6">
                <h2 className="text-sm font-bold text-white mb-6">Language Distribution</h2>
                <div className="flex items-center gap-8 md:gap-16 pl-4">
                    <div className="w-32 h-32 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.languageDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={42}
                                    outerRadius={60}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.languageDistribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 0px 8px ${entry.color}60)` }} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                            <span className="text-[10px] text-slate-400 font-semibold tracking-wider">Total</span>
                            <span className="text-xl font-black text-white leading-none mt-1">{data.languageDistribution?.length || 0}</span>
                        </div>
                    </div>
                    <div className="flex-1 space-y-5 flex flex-col justify-center">
                        {data.languageDistribution.map((lang: any, i: number) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full shadow-md" style={{ backgroundColor: lang.color, boxShadow: `0 0 10px ${lang.color}80` }}></div>
                                    <span className="text-sm font-semibold text-slate-200">{lang.name}</span>
                                </div>
                                <span className="text-sm font-bold text-white pr-4">{lang.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            <Card className="p-6 mb-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-sm font-bold text-white">Commit Activity</h2>
                    <span className="text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg tracking-wide uppercase">Last 30 Days</span>
                </div>
                <div className="h-48 w-full -ml-4 pl-4 pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.commitTimeline} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} dy={15} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)' }}
                                itemStyle={{ color: '#0ea5e9', fontWeight: 'bold' }}
                                cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Area type="monotone" dataKey="commits" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorCommits)" activeDot={{ r: 6, fill: '#0ea5e9', stroke: '#0f172a', strokeWidth: 2 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};
