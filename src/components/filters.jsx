import CustomDropdown from "./CustomDropdown";

const Filters = ({
    filters,
    handleFilterChange,
    statuses,
    resetFilters,
    setShowFilters
}) => {
    const statusOptions = [
        { label: "All Statuses", value: "" },
        ...statuses.map(s => ({ label: s, value: s }))
    ];

    const sortOptions = [
        { label: "Default", value: "" },
        { label: "Oldest First", value: "asc" },
        { label: "Newest First", value: "desc" }
    ];

    return (
        <div className="filter-popover">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0 }}>Filters</h3>
                <button
                    className="filter-icon-button"
                    onClick={() => setShowFilters(false)}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
            </div>

            <div className="filter-group">
                <label>Status</label>
                <CustomDropdown
                    name="eventStatus"
                    value={filters.eventStatus}
                    onChange={handleFilterChange}
                    options={statusOptions}
                    placeholder="All Statuses"
                />
            </div>

            <div className="filter-group">
                <label>First Event Sort</label>
                <CustomDropdown
                    name="firstEventSort"
                    value={filters.firstEventSort}
                    onChange={handleFilterChange}
                    options={sortOptions}
                    placeholder="Default"
                />
            </div>

            <div className="filter-group">
                <label>Last Event Sort</label>
                <CustomDropdown
                    name="lastEventSort"
                    value={filters.lastEventSort}
                    onChange={handleFilterChange}
                    options={sortOptions}
                    placeholder="Default"
                />
            </div>

            <button onClick={resetFilters} className="reset-filters-btn">
                Reset All Filters
            </button>
        </div>
    );
};

export default Filters;