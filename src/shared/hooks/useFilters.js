import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

const useFilters = (initialFilters, enableUrlPersistence = false) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Use ref to stabilize initialFilters in case it's passed as an inline object
  const initialFiltersRef = useRef(initialFilters);

  const [filters, setFilters] = useState(() => {
    if (!enableUrlPersistence) return initialFilters;

    const output = { ...initialFilters };
    let hasParams = false;
    // Check URL for existing keys
    Object.keys(initialFilters).forEach((key) => {
      const val = searchParams.get(key);
      if (val !== null) {
        const isArray = Array.isArray(initialFilters[key]);
        output[key] = isArray ? val.split(",") : val;
        hasParams = true;
      }
    });
    return hasParams ? output : initialFilters;
  });

  // Sync from URL to State (Handle Back/Forward/Navigation)
  // Flag to prevent state updates from URL syncing back to URL
  const isSyncingFromUrl = useRef(false);

  // Sync from URL to State (Handle Back/Forward/Navigation)
  useEffect(() => {
    if (!enableUrlPersistence) return;

    setFilters((prev) => {
      const next = { ...prev };
      let hasChanges = false;

      Object.keys(initialFiltersRef.current).forEach((key) => {
        const paramVal = searchParams.get(key);
        const initialVal = initialFiltersRef.current[key];
        const isArray = Array.isArray(initialVal);

        let effectiveParamVal;
        if (paramVal !== null) {
          effectiveParamVal = isArray ? paramVal.split(",") : paramVal;
        } else {
          effectiveParamVal = initialVal;
        }

        const prevVal = prev[key];
        const isDifferent = isArray
          ? JSON.stringify(effectiveParamVal) !== JSON.stringify(prevVal)
          : String(effectiveParamVal) !== String(prevVal);

        if (isDifferent) {
          next[key] = effectiveParamVal;
          hasChanges = true;
        }
      });

      if (hasChanges) {
        isSyncingFromUrl.current = true;
        return next;
      }
      return prev;
    });
  }, [searchParams, enableUrlPersistence]);

  // Sync from State to URL
  useEffect(() => {
    if (!enableUrlPersistence) return;

    if (isSyncingFromUrl.current) {
      isSyncingFromUrl.current = false;
      return;
    }

    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      let hasChanges = false;
      const defaults = initialFiltersRef.current;

      Object.entries(filters).forEach(([key, value]) => {
        const initial = defaults[key];
        const isArray = Array.isArray(initial);

        // Determine if value is "empty" (matches default empty state)
        const isEmpty = isArray
          ? value.length === 0
          : value === "" || value === null || value === undefined;

        if (!isEmpty) {
          const strVal = isArray ? value.join(",") : String(value);
          if (newParams.get(key) !== strVal) {
            newParams.set(key, strVal);
            hasChanges = true;
          }
        } else {
          if (newParams.has(key)) {
            newParams.delete(key);
            hasChanges = true;
          }
        }
      });
      return hasChanges ? newParams : prev;
    });
  }, [filters, enableUrlPersistence, setSearchParams]);

  /**
   * Update a single filter
   * @param {string} name - Filter key
   * @param {any} value - New value
   */
  const updateFilter = useCallback((name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  /**
   * Update multiple filters at once
   * @param {Object} updates - Object with keys/values to update
   */
  const updateFilters = useCallback((updates) => {
    setFilters((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  /**
   * Reset filters to initial state
   */
  const resetFilters = useCallback(() => {
    setFilters(initialFiltersRef.current);
  }, []);

  return {
    filters,
    setFilters,
    updateFilter,
    updateFilters,
    resetFilters,
  };
};

export default useFilters;
