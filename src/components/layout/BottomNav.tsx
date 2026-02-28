import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderGit2, FolderOpen, BarChart2 } from 'lucide-react';
import { cn } from './Sidebar';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FolderGit2, label: 'Repos', path: '/repos' },
    { icon: FolderOpen, label: 'Groups', path: '/groups' },
    { icon: BarChart2, label: 'Analytics', path: '/analytics' },
];

export const BottomNav: React.FC = () => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#070e17]/90 backdrop-blur-xl border-t border-slate-800/50 z-50 pb-safe shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.5)]">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "relative flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-all duration-300",
                            isActive ? "text-primary" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-[0_2px_10px_rgba(14,165,233,0.8)]" />
                                )}
                                <item.icon size={20} className={cn("transition-transform duration-300", isActive && "-translate-y-0.5")} />
                                <span className="text-[10px] uppercase font-bold tracking-widest">
                                    {item.label}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};
