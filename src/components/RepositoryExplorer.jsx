import { useState, useMemo } from 'react';
import FilterBar from './FilterBar';

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
    originalDataCount,
    totalAmount
}) => {


    return (
        <div className="repository-container">
            <div className="data-header">
                <div className="data-header-left">
                    <div className="data-header-title">
                        <h1>Database Records</h1>
                        <div className="repo-stats">
                            <p className="repo-stat-line">
                                Total Stores: <strong>{originalDataCount}</strong>
                            </p>
                            <p className="repo-stat-line">
                                Total Amount: <strong>${totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="data-header-right">
                    <FilterBar
                        filters={filters}
                        handleFilterChange={handleFilterChange}
                        statuses={statuses}
                        resetFilters={resetFilters}
                    />
                </div>
            </div>

            <div className="table-responsive-elite">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Shop Domain</th>
                            <th>Status</th>
                            <th
                                onClick={() => handleFilterChange({ target: { name: 'totalSpentSort', value: filters.totalSpentSort === 'asc' ? 'desc' : 'asc' } })}
                                className="sortable-th"
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    Total Spent
                                    {filters.totalSpentSort === 'asc' && <span>↑</span>}
                                    {filters.totalSpentSort === 'desc' && <span>↓</span>}
                                    {!filters.totalSpentSort && <span style={{ opacity: 0.3, fontSize: '10px' }}>⇅</span>}
                                </div>
                            </th>
                            <th
                                onClick={() => handleFilterChange({ target: { name: 'firstEventSort', value: filters.firstEventSort === 'asc' ? 'desc' : 'asc' } })}
                                className="sortable-th"
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    Created On
                                    {filters.firstEventSort === 'asc' && <span>↑</span>}
                                    {filters.firstEventSort === 'desc' && <span>↓</span>}
                                    {!filters.firstEventSort && <span style={{ opacity: 0.3, fontSize: '10px' }}>⇅</span>}
                                </div>
                            </th>
                            <th
                                onClick={() => handleFilterChange({ target: { name: 'lastEventSort', value: filters.lastEventSort === 'asc' ? 'desc' : 'asc' } })}
                                className="sortable-th"
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    Updated On
                                    {filters.lastEventSort === 'asc' && <span>↑</span>}
                                    {filters.lastEventSort === 'desc' && <span>↓</span>}
                                    {!filters.lastEventSort && <span style={{ opacity: 0.3, fontSize: '10px' }}>⇅</span>}
                                </div>
                            </th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? data.map(item => {
                            return (
                                <tr key={item._id}>
                                    <td className="font-semibold">{item.shopDomain}</td>
                                    <td><span className={`event-badge status-${item.currentEvent?.toLowerCase()}`}>{item.currentEvent}</span></td>
                                    <td className="font-semibold text-primary">
                                        ${item.totalSpent?.toFixed(2)}
                                        <div className="sub-text-small">
                                            {item.activeMonths} month{item.activeMonths !== 1 ? 's' : ''}
                                        </div>
                                    </td>
                                    <td className="font-mono-muted">
                                        {item.firstEventDate}
                                    </td>
                                    <td className="font-mono-muted">{item.lastEventDate}</td>
                                    <td className="text-right">
                                        <button type="button" className="filter-icon-button action-btn-centered" onClick={() => onViewDetail(item)}>
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
                                <td colSpan="6" className="empty-state-cell">
                                    <div className="empty-icon-wrapper">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="11" cy="11" r="8" />
                                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        </svg>
                                    </div>
                                    <p className="empty-title">No matching records found</p>
                                    <p className="empty-subtitle">Try adjusting your search or filters</p>
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
                        <strong>&nbsp;{currentPage}&nbsp;</strong>
                        <span>of</span>
                        <strong>&nbsp;{totalPages}&nbsp;</strong>
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
