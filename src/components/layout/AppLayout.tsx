import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export const AppLayout: React.FC = () => {
    return (
        <div className="flex min-h-screen bg-[#0b121e] text-slate-200 selection:bg-primary/30 font-sans">
            <Sidebar />
            <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden min-h-screen">
                <div className="max-w-[1400px] mx-auto p-4 md:p-8 xl:p-10">
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
