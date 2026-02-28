import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => {
    return (
        <div className={`flex justify-center items-center ${className || ''}`}>
            <Loader2 size={size} className="animate-spin text-primary" />
        </div>
    );
};
