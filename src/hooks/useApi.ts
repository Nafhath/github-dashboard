import { useState, useEffect } from 'react';

export function useApi<T>(apiFunc: () => Promise<T>, deps: any[] = []) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await apiFunc();
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
    }, [apiFunc, ...deps]);

    return { data, loading, error };
}
