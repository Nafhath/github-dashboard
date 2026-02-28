import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderGit2, FolderOpen, BarChart2, Settings } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FolderGit2, label: 'Repos', path: '/repos' },
    { icon: FolderOpen, label: 'Groups', path: '/groups' },
    { icon: BarChart2, label: 'Analytics', path: '/analytics' },
];

export const Sidebar: React.FC = () => {
    return (
        <aside className="hidden md:flex flex-col w-64 h-screen bg-[#070e17] border-r border-slate-800/50 p-4 sticky top-0 z-40">
            <div className="flex items-center gap-3 px-2 mb-8 mt-2">
                <div className="bg-primary/20 p-2.5 rounded-xl text-primary ring-1 ring-primary/30 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
                    <FolderGit2 size={24} />
                </div>
                <span className="text-2xl font-black bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight">
                    GitDash
                </span>
            </div>

            <nav className="flex-1 space-y-1.5 mt-4">
                <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Main Menu</div>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                            "text-slate-400 hover:text-white hover:bg-slate-800/50",
                            isActive && "bg-gradient-to-r from-primary/10 to-transparent text-primary hover:text-primary font-medium"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                                )}
                                <item.icon size={20} className={cn("transition-colors duration-300", isActive ? "text-primary" : "text-slate-500 group-hover:text-slate-300")} />
                                {item.label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto pt-4 border-t border-slate-800/50">
                <button className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 w-full hover:bg-slate-800/50 text-slate-400 hover:text-white group">
                    <Settings size={20} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
                    Settings
                </button>
            </div>
        </aside>
    );
};
