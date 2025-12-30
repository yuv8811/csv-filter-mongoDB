import React, { useState, useRef, useEffect } from 'react';
import Filters from './filters';

const FilterBar = ({
    filters,
    handleFilterChange,
    statuses,
    resetFilters
}) => {
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
    );
};

export default FilterBar;
