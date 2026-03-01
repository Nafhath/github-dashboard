import { useState, useEffect, useCallback } from 'react';

export function useApi<T>(apiFunc: () => Promise<T>, deps: any[] = []) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const stableFunc = useCallback(apiFunc, deps);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await stableFunc();
                if (isMounted) setData(result);
            } catch (err: any) {
                if (isMounted) setError(err.message || 'An error occurred');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [stableFunc]);

    return { data, loading, error };
}
