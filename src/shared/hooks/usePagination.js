import { useState, useMemo, useCallback } from 'react';

const usePagination = (data = [], itemsPerPage = 50) => {
    const [currentPage, setCurrentPage] = useState(1);

    // Reset page when data length changes significantly (optional, but good UX)
    // For now keeping simple: strict control by caller or auto-reset if out of bounds?
    // Let's keep it simple.

    const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

    const currentData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return data.slice(startIndex, startIndex + itemsPerPage);
    }, [data, currentPage, itemsPerPage]);

    const goToPage = useCallback((page) => {
        const pageNum = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(pageNum);
    }, [totalPages]);

    return {
        currentPage,
        totalPages,
        currentData,
        goToPage,
        setCurrentPage // Expose direct setter if needed
    };
};

export default usePagination;
