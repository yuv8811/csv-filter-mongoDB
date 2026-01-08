import { useState, useCallback } from 'react';

const useFilters = (initialFilters) => {
    const [filters, setFilters] = useState(initialFilters);

    /**
     * Update a single filter
     * @param {string} name - Filter key
     * @param {any} value - New value
     */
    const updateFilter = useCallback((name, value) => {
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    /**
     * Update multiple filters at once
     * @param {Object} updates - Object with keys/values to update
     */
    const updateFilters = useCallback((updates) => {
        setFilters(prev => ({
            ...prev,
            ...updates
        }));
    }, []);

    /**
     * Reset filters to initial state
     */
    const resetFilters = useCallback(() => {
        setFilters(initialFilters);
    }, [initialFilters]);

    return {
        filters,
        setFilters,
        updateFilter,
        updateFilters,
        resetFilters
    };
};

export default useFilters;
