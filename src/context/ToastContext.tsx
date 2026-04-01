import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { cn } from '../components/layout/Sidebar';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
    id: number;
    message: string;
    variant: ToastVariant;
}

interface ToastContextValue {
    showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({
    showToast: () => undefined,
});

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
        const id = Date.now() + Math.random();
        setToasts((current) => [...current, { id, message, variant }]);

        window.setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 3200);
    }, []);

    const value = useMemo(() => ({ showToast }), [showToast]);

    const variants = {
        success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
        error: 'border-rose-500/20 bg-rose-500/10 text-rose-100',
        info: 'border-sky-500/20 bg-sky-500/10 text-sky-100',
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed top-4 right-4 z-[70] space-y-3 w-[min(92vw,22rem)]">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={cn(
                            'rounded-2xl border px-4 py-3 backdrop-blur-xl shadow-2xl',
                            variants[toast.variant]
                        )}
                    >
                        <p className="text-sm font-medium">{toast.message}</p>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
