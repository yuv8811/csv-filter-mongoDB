import { useState, useRef, useEffect } from "react";
import CustomDropdown from "./CustomDropdown";

const ExportEngine = ({
    filters,
    handleFilterChange,
    handleStatusBulk,
    statuses,
    resetFilters,
    recordCount,
    onExport
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedCount = filters.eventStatus.length;
    const displayText = selectedCount === 0
        ? "All Statuses"
        : selectedCount === statuses.length
            ? "All Statuses Selected"
            : `${selectedCount} Status${selectedCount > 1 ? 'es' : ''} Selected`;

    return (
        <div className="export-container">
            <header className="export-header">
                <h2>Data Export</h2>
                <p>Configure filters below to extract specific segments of your database.</p>
            </header>

            <div className="export-grid">
                <div className="filter-group">
                    <label>Shop Domain Pattern</label>
                    <input
                        type="text"
                        name="shopDomain"
                        placeholder="e.g. myshopify.com"
                        value={filters.shopDomain}
                        onChange={handleFilterChange}
                    />
                </div>
                <div className="filter-group">
                    <label>Capture Status</label>
                    <div className="custom-multi-select" ref={dropdownRef}>
                        <div
                            className={`multi-select-header ${isDropdownOpen ? 'active' : ''}`}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <span>{displayText}</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </div>

                        {isDropdownOpen && (
                            <div className="multi-select-dropdown">
                                <div className="dropdown-actions">
                                    <button className="selection-link" onClick={() => handleStatusBulk("all")}>Select All</button>
                                    <button className="selection-link" onClick={() => handleStatusBulk("clear")}>Clear</button>
                                </div>
                                <div className="dropdown-list">
                                    {statuses.map(s => (
                                        <label key={s} className={`dropdown-item ${filters.eventStatus.includes(s) ? 'selected' : ''}`}>
                                            <input
                                                type="checkbox"
                                                name="eventStatus"
                                                value={s}
                                                checked={filters.eventStatus.includes(s)}
                                                onChange={handleFilterChange}
                                                style={{ display: 'none' }}
                                            />
                                            <div className="custom-checkbox"></div>
                                            <span className="status-label">{s}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="filter-group">
                    <label>Sort by First Event</label>
                    <CustomDropdown
                        name="firstEventSort"
                        value={filters.firstEventSort}
                        onChange={handleFilterChange}
                        options={[
                            { label: "Default", value: "" },
                            { label: "Oldest First", value: "asc" },
                            { label: "Newest First", value: "desc" }
                        ]}
                        placeholder="Default"
                    />
                </div>
                <div className="filter-group">
                    <label>Sort by Last Event</label>
                    <CustomDropdown
                        name="lastEventSort"
                        value={filters.lastEventSort}
                        onChange={handleFilterChange}
                        options={[
                            { label: "Default", value: "" },
                            { label: "Oldest First", value: "asc" },
                            { label: "Newest First", value: "desc" }
                        ]}
                        placeholder="Default"
                    />
                </div>
                <div className="filter-group">
                    <label>Sort by Total Spent</label>
                    <CustomDropdown
                        name="totalSpentSort"
                        value={filters.totalSpentSort}
                        onChange={handleFilterChange}
                        options={[
                            { label: "Default", value: "" },
                            { label: "Lowest First", value: "asc" },
                            { label: "Highest First", value: "desc" }
                        ]}
                        placeholder="Default"
                    />
                </div>
            </div>

            <div className="export-preview-card">
                <div className="export-preview-count">{recordCount}</div>
                <div className="export-preview-label">Records Selected for Export</div>
            </div>

            <div className="export-actions">
                <button
                    className="reset-filters-btn"
                    onClick={resetFilters}
                    style={{ marginTop: 0 }}
                >
                    Reset Configuration
                </button>
                <button
                    className="export-btn"
                    onClick={onExport}
                    disabled={recordCount === 0}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Generate CSV Report
                </button>
            </div>
        </div>
    );
};

export default ExportEngine;
