import { useState, useEffect, useCallback } from 'react';

const useFetch = (fetchFunction, immediate = true) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState(null);

    const execute = useCallback(async (...args) => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchFunction(...args);
            setData(result);
            return result;
        } catch (err) {
            setError(err.message || 'An unexpected error occurred');
            return null; // Return null on error so caller can handle if needed
        } finally {
            setLoading(false);
        }
    }, [fetchFunction]);

    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, [immediate, execute]);

    return { data, loading, error, execute, setData };
};

export default useFetch;
