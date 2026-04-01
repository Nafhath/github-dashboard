import React, { createContext, useContext } from 'react';

export type BackendStatus = 'connecting' | 'offline' | 'online';

interface AppShellContextValue {
    backendStatus: BackendStatus;
}

const AppShellContext = createContext<AppShellContextValue>({
    backendStatus: 'connecting',
});

export const AppShellProvider: React.FC<React.PropsWithChildren<{ backendStatus: BackendStatus }>> = ({
    backendStatus,
    children
}) => {
    return (
        <AppShellContext.Provider value={{ backendStatus }}>
            {children}
        </AppShellContext.Provider>
    );
};

export const useAppShell = () => useContext(AppShellContext);
