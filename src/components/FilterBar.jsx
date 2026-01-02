import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Filters from './filters';

const FilterBar = ({
    filters,
    handleFilterChange,
    statuses,
    resetFilters
}) => {
    const navigate = useNavigate();
    const [showFilters, setShowFilters] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const filterRef = useRef(null);
    const searchRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showFilters && filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilters(false);
            }
            if (showSearch && searchRef.current && !searchRef.current.contains(event.target)) {
                // Only collapse if search is empty to avoid accidental closing while typing
                if (!filters.shopDomain) setShowSearch(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showFilters, showSearch, filters.shopDomain]);

    return (
        <div className="search-container">
            <div className={`search-input-wrapper-collapsible ${showSearch ? 'open' : ''}`} ref={searchRef}>
                <button
                    title='Search'
                    className="filter-icon-button search-toggle-btn"
                    onClick={() => setShowSearch(!showSearch)}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </button>
                <input
                    type="text"
                    name="shopDomain"
                    placeholder="Search domain..."
                    value={filters.shopDomain || ""}
                    onChange={handleFilterChange}
                    className="search-input-elite"
                />
            </div>

            <div className="filter-popover-container" ref={filterRef}>
                <button
                    type="button"
                    title='Filter'
                    className={`filter-icon-button ${showFilters ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowFilters(!showFilters);
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    {(() => {
                        const activeCount = Object.entries(filters).filter(([key, value]) => {
                            if (['shopDomain', 'firstEventSort', 'lastEventSort', 'planPriceSort'].includes(key)) return false;
                            return value !== "" && value !== undefined && (Array.isArray(value) ? value.length > 0 : true);
                        }).length;

                        return activeCount > 0 && (
                            <div className="filter-badge-count">
                                {activeCount}
                            </div>
                        );
                    })()}
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

            <button
                className="filter-icon-button"
                onClick={() => navigate('/analytics')}
                title="Analytics">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
            </button>
            <button
                className="filter-icon-button"
                onClick={() => navigate('/import')}
                title="Import"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
            </button>
            <button
                className="filter-icon-button "
                onClick={() => navigate('/export')}
                title="Export"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
            </button>
        </div>
    );
};

export default FilterBar;
