
import FilterBar from './FilterBar';

const SortIcon = ({ direction }) => {
    if (direction === 'asc') {
        return (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5" />
                <path d="M5 12l7-7 7 7" />
            </svg>
        );
    }
    if (direction === 'desc') {
        return (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M19 12l-7 7-7-7" />
            </svg>
        );
    }
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="8 9 12 5 16 9"></polyline>
            <polyline points="16 15 12 19 8 15"></polyline>
        </svg>
    );
};

const SortHeader = ({ label, sortKey, currentSort, onSort }) => {
    const isActive = !!currentSort;
    return (
        <th
            onClick={() => {
                let nextSort;
                if (currentSort === 'asc') nextSort = 'desc';
                else if (currentSort === 'desc') nextSort = '';
                else nextSort = 'asc';
                onSort(sortKey, nextSort);
            }}
            className={`sortable-th ${isActive ? 'active' : ''}`}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {label}
                <div className="sort-icon-wrapper">
                    <SortIcon direction={currentSort} />
                </div>
            </div>
        </th>
    );
};

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
    // onSynchronize,
    // isSynchronizing
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
                            {/* <p className="repo-stat-line">
                                Total Amount: <strong>${totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                            </p> */}
                        </div>
                    </div>
                </div>

                <div className="data-header-right">
                    <FilterBar
                        filters={filters}
                        handleFilterChange={handleFilterChange}
                        statuses={statuses}
                        resetFilters={resetFilters}
                    // onSynchronize={onSynchronize}
                    // isSynchronizing={isSynchronizing}
                    />
                </div>
            </div>

            <div className="table-responsive-elite">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Shop Domain</th>
                            <th>Status</th>
                            <SortHeader
                                label="Plan"
                                sortKey="planPriceSort"
                                currentSort={filters.planPriceSort}
                                onSort={(key, val) => handleFilterChange({ target: { name: key, value: val } })}
                            />
                            <th>Plan Status</th>
                            <SortHeader
                                label="Created On"
                                sortKey="firstEventSort"
                                currentSort={filters.firstEventSort}
                                onSort={(key, val) => handleFilterChange({ target: { name: key, value: val } })}
                            />
                            <SortHeader
                                label="Updated On"
                                sortKey="lastEventSort"
                                currentSort={filters.lastEventSort}
                                onSort={(key, val) => handleFilterChange({ target: { name: key, value: val } })}
                            />
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? data.map(item => {
                            return (
                                <tr key={item._id}>
                                    <td className="font-semibold custom-table-td">{item.shopDomain}</td>
                                    <td className='badge-container'><span className={`event-badge status-${item.currentEvent?.toLowerCase()}`}>{item.currentEvent}</span></td>
                                    <td className="font-semibold text-primary">
                                        {item.planPrice > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.4', fontSize: '11px' }}>
                                                <div>Name :- {item.planName}</div>
                                                <div>Price :- ${item.planPrice.toFixed(2)}</div>
                                            </div>
                                        ) : (
                                            <span className="text-muted">-</span>
                                        )}
                                    </td>
                                    <td>
                                        {item.planStatus}
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
