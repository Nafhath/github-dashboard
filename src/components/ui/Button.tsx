import React from 'react';
import { cn } from '../layout/Sidebar';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
        const variants = {
            primary: "bg-primary text-white shadow-[0_0_15px_rgba(14,165,233,0.4)] hover:bg-sky-400 hover:shadow-[0_0_25px_rgba(14,165,233,0.6)]",
            secondary: "bg-secondary text-white shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:bg-teal-400 hover:shadow-[0_0_25px_rgba(20,184,166,0.5)]",
            outline: "border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-500",
            ghost: "text-slate-400 hover:text-white hover:bg-slate-800/50",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-xs rounded-lg",
            md: "px-4 py-2 text-sm rounded-xl",
            lg: "px-6 py-3 text-base rounded-xl font-medium",
            icon: "p-2 rounded-xl flex items-center justify-center",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";
