import { useState, useEffect, useCallback } from 'react';

interface UseApiOptions {
    deps?: unknown[];
    cacheKey?: string;
}

const getStorageKey = (cacheKey: string) => `api-cache:${cacheKey}`;
const getMetaStorageKey = (cacheKey: string) => `api-cache-meta:${cacheKey}`;

export function getCachedApiValue<T>(cacheKey: string): T | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const stored = window.localStorage.getItem(getStorageKey(cacheKey));
        return stored ? JSON.parse(stored) as T : null;
    } catch {
        return null;
    }
}

export function getCachedApiTimestamp(cacheKey: string): number | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const stored = window.localStorage.getItem(getMetaStorageKey(cacheKey));

        if (!stored) {
            return null;
        }

        const parsed = JSON.parse(stored) as { fetchedAt?: number };
        return typeof parsed.fetchedAt === 'number' ? parsed.fetchedAt : null;
    } catch {
        return null;
    }
}

export function useApi<T>(apiFunc: () => Promise<T>, options: UseApiOptions = {}) {
    const { deps = [], cacheKey } = options;
    const cachedData = cacheKey ? getCachedApiValue<T>(cacheKey) : null;
    const [data, setData] = useState<T | null>(cachedData);
    const [loading, setLoading] = useState<boolean>(!cachedData);
    const [error, setError] = useState<string | null>(null);
    const [isCachedData, setIsCachedData] = useState<boolean>(!!cachedData);
    const [reloadToken, setReloadToken] = useState(0);
    const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(cacheKey ? getCachedApiTimestamp(cacheKey) : null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const stableFunc = useCallback(apiFunc, deps);

    const refetch = useCallback(() => {
        setReloadToken((value) => value + 1);
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            setLoading((currentLoading) => currentLoading || !cachedData);

            setError(null);

            try {
                const result = await stableFunc();

                if (!isMounted) {
                    return;
                }

                setData(result);
                setIsCachedData(false);
                setLastSyncedAt(Date.now());

                if (cacheKey && typeof window !== 'undefined') {
                    window.localStorage.setItem(getStorageKey(cacheKey), JSON.stringify(result));
                    window.localStorage.setItem(getMetaStorageKey(cacheKey), JSON.stringify({ fetchedAt: Date.now() }));
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message || 'An error occurred');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [cacheKey, cachedData, reloadToken, stableFunc]);

    return { data, loading, error, isCachedData, lastSyncedAt, refetch };
}
