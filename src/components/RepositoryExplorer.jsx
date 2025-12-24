import { useState, useEffect } from "react";
import Filters from "./filters";
import Pagination from "./pagination";

const RepositoryExplorer = ({
    data,
    filters,
    handleFilterChange,
    statuses,
    resetFilters,
    showFilters,
    setShowFilters,
    filterRef,
    currentPage,
    totalPages,
    handlePageChange,
    onViewDetail,
    originalDataCount
}) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const isFilterActive = !!filters.eventStatus || !!filters.firstEventSort || !!filters.lastEventSort;

    useEffect(() => {
        if (!isSearchOpen && filters.shopDomain) {
            // Keep it open if there is a value
            setIsSearchOpen(true);
        }
    }, []);

    return (
        <div className="view-section">
            <header className="section-header">
                <div className="section-title">
                    <h1>Database Explorer</h1>
                    <p>Managing {originalDataCount} active records</p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div className={`search-container ${isSearchOpen ? 'open' : ''}`} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                        {isSearchOpen && (
                            <input
                                type="text"
                                name="shopDomain"
                                placeholder="Search domain..."
                                value={filters.shopDomain}
                                onChange={handleFilterChange}
                                className="search-input-header"
                                autoFocus
                                onBlur={() => { if (!filters.shopDomain) setIsSearchOpen(false); }}
                            />
                        )}
                        <button
                            className={`filter-icon-button ${isSearchOpen ? 'active' : ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                if (isSearchOpen) {
                                    if (filters.shopDomain) {
                                        handleFilterChange({ target: { name: 'shopDomain', value: '' } });
                                    }
                                    setIsSearchOpen(false);
                                } else {
                                    setIsSearchOpen(true);
                                }
                            }}
                        >
                            {isSearchOpen ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            )}
                        </button>
                    </div>

                    <div className="filter-popover-container" ref={filterRef}>
                        <button
                            className={`filter-icon-button ${showFilters ? "active" : ""}`}
                            onClick={() => setShowFilters(!showFilters)}
                            style={{ position: 'relative' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                            {isFilterActive && (
                                <span className="filter-dot" />
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
            </header>

            <div style={{ overflowX: 'auto' }}>
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Shop Domain</th>
                            <th>Latest Status</th>
                            <th>First Event</th>
                            <th>Last Event</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? data.map(item => {
                            const events = item.additionalInfo?.length ? item.additionalInfo : [{ event: item.event, date: item.date }];
                            const lastEvent = events[events.length - 1];
                            return (
                                <tr key={item._id}>
                                    <td style={{ fontWeight: 600 }}>{item.shopDomain}</td>
                                    <td><span className={`event-badge status-${lastEvent.event?.toLowerCase()}`}>{lastEvent.event}</span></td>
                                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.date}</td>
                                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{lastEvent.date}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="filter-icon-button" onClick={() => onViewDetail(item)} style={{ margin: 'auto' }}>
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
                                <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                    No records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    handlePageChange={handlePageChange}
                />
            )}
        </div>
    );
};

export default RepositoryExplorer;
