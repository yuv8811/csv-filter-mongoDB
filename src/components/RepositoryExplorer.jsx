import { useState, useMemo, useRef, useEffect } from 'react';
import Filters from './filters';

const RepositoryExplorer = ({
    data,
    filters,
    handleFilterChange,
    statuses,
    resetFilters,
    currentPage,
    totalPages,
    handlePageChange,
    onViewDetail,
    originalDataCount
}) => {
    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showFilters && filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilters(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showFilters]);

    return (
        <div className="repository-container">
            <div className="data-header">
                <div className="data-header-left">
                    <div className="data-header-title">
                        <h1>Database Records</h1>
                        <p>{originalDataCount} stores indexed in cluster</p>
                    </div>
                </div>

                <div className="data-header-right">
                    <div className="search-container">
                        <div className="filter-popover-container" ref={filterRef}>
                            <button
                                type="button"
                                className={`filter-icon-button ${showFilters ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowFilters(!showFilters);
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                </svg>
                                {Object.values(filters).some(v => v !== "" && v !== undefined && (Array.isArray(v) ? v.length > 0 : true)) && (
                                    <div className="filter-badge-count">
                                        {Object.values(filters).filter(v => v !== "" && v !== undefined && (Array.isArray(v) ? v.length > 0 : true)).length}
                                    </div>
                                )}
                            </button>

                            {showFilters && (
                                <Filters
                                    filters={filters}
                                    handleFilterChange={handleFilterChange}
                                    statuses={statuses}
                                    resetFilters={resetFilters}
                                    setShowFilters={setShowFilters}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="table-responsive-elite">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Shop Domain</th>
                            <th>Status</th>
                            <th>Total Spent</th>
                            <th>First Seen</th>
                            <th>Last Activity</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? data.map(item => {
                            return (
                                <tr key={item._id}>
                                    <td style={{ fontWeight: 600 }}>{item.shopDomain}</td>
                                    <td><span className={`event-badge status-${item.currentEvent?.toLowerCase()}`}>{item.currentEvent}</span></td>
                                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                        ${item.totalSpent?.toFixed(2)}
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                            {item.activeMonths} month{item.activeMonths !== 1 ? 's' : ''}
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                        {item.firstEventDate}
                                        {item.additionalInfo?.[0]?.details && (
                                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 400, marginTop: '2px', fontFamily: 'sans-serif' }}>
                                                {item.additionalInfo[0].details}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.lastEventDate}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button type="button" className="filter-icon-button" onClick={() => onViewDetail(item)} style={{ margin: 'auto' }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                    <div style={{ opacity: 0.5, marginBottom: '1rem' }}>
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="11" cy="11" r="8" />
                                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        </svg>
                                    </div>
                                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>No matching records found</p>
                                    <p style={{ fontSize: '0.875rem' }}>Try adjusting your search or filters</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        type="button"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <div className="page-indicator">
                        <span>Page</span>
                        <strong>{currentPage}</strong>
                        <span>of</span>
                        <strong>{totalPages}</strong>
                    </div>
                    <button
                        type="button"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default RepositoryExplorer;
