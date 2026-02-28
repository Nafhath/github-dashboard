import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '../layout/Sidebar';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, icon, ...props }, ref) => {
        return (
            <div className="relative flex items-center w-full">
                {icon && (
                    <Search className="absolute left-3 text-slate-500" size={18} />
                )}
                <input
                    ref={ref}
                    className={cn(
                        "w-full bg-[#0b121e]/50 border border-slate-700 text-slate-200 placeholder:text-slate-500 rounded-xl px-4 py-2.5 outline-none transition-all duration-300 focus:bg-slate-800/80 focus:border-primary focus:ring-1 focus:ring-primary shadow-inner",
                        icon && "pl-10",
                        className
                    )}
                    {...props}
                />
            </div>
        );
    }
);
Input.displayName = "Input";
