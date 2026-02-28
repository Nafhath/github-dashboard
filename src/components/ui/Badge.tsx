import React from 'react';
import { cn } from '../layout/Sidebar';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'warning';
    dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'primary',
    dot = false,
    className, ...props
}) => {
    const variants = {
        primary: "bg-primary/20 text-primary border-primary/30",
        secondary: "bg-secondary/20 text-secondary border-secondary/30",
        success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        outline: "bg-transparent text-slate-300 border-slate-700",
    };

    const dotColors = {
        primary: "bg-primary",
        secondary: "bg-secondary",
        success: "bg-emerald-400",
        warning: "bg-amber-400",
        outline: "bg-slate-400",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
                variants[variant],
                className
            )}
            {...props}
        >
            {dot && (
                <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[variant])} />
            )}
            {children}
        </span>
    );
};
