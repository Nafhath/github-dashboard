import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Badge } from '../ui/Badge';
import { useAppShell } from '../../context/AppShellContext';

export const AppLayout: React.FC = () => {
    const { backendStatus } = useAppShell();

    const backendBadge = backendStatus === 'online'
        ? { label: 'Backend Online', variant: 'success' as const }
        : backendStatus === 'offline'
            ? { label: 'Using Cached Data', variant: 'warning' as const }
            : { label: 'Connecting Backend', variant: 'outline' as const };

    return (
        <div className="flex min-h-screen bg-[#0b121e] text-slate-200 selection:bg-primary/30 font-sans">
            <Sidebar />
            <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden min-h-screen">
                <div className="max-w-[1400px] mx-auto p-4 md:p-8 xl:p-10">
                    <div className="flex justify-end mb-4">
                        <Badge variant={backendBadge.variant} dot>
                            {backendBadge.label}
                        </Badge>
                    </div>
                    <Outlet />
                </div>
            </main>
            <BottomNav />
            {/* Dynamic Background Glow Effect */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-secondary/5 blur-[100px]" />
            </div>
        </div>
    );
};
