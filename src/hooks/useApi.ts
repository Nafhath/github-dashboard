import { useState, useEffect, useCallback } from 'react';

interface UseApiOptions {
    deps?: unknown[];
    cacheKey?: string;
}

const getStorageKey = (cacheKey: string) => `api-cache:${cacheKey}`;

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

export function useApi<T>(apiFunc: () => Promise<T>, options: UseApiOptions = {}) {
    const { deps = [], cacheKey } = options;
    const cachedData = cacheKey ? getCachedApiValue<T>(cacheKey) : null;
    const [data, setData] = useState<T | null>(cachedData);
    const [loading, setLoading] = useState<boolean>(!cachedData);
    const [error, setError] = useState<string | null>(null);
    const [isCachedData, setIsCachedData] = useState<boolean>(!!cachedData);
    const [reloadToken, setReloadToken] = useState(0);

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

                if (cacheKey && typeof window !== 'undefined') {
                    window.localStorage.setItem(getStorageKey(cacheKey), JSON.stringify(result));
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

    return { data, loading, error, isCachedData, refetch };
}
