import React, { useState, useRef, useEffect } from 'react';

const Filters = ({
    filters,
    handleFilterChange,
    statuses,
    resetFilters,
    setShowFilters
}) => {
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsStatusOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Use fixed options to align with Analytics categories and Badge logic, plus all raw statuses
    const statusOptions = [
        { label: "All Statuses", value: "" },
        // Append raw statuses for specific filtering
        ...statuses.map(s => ({ 
            label: s.charAt(0).toUpperCase() + s.slice(1), 
            value: s 
        }))
    ];

    const toggleStatus = (val) => {
        if (val === "") {
            handleFilterChange({ target: { name: 'eventStatus', value: [] } });
            setIsStatusOpen(false); // Close on reset
        } else {
            const current = Array.isArray(filters.eventStatus) ? filters.eventStatus : (filters.eventStatus ? [filters.eventStatus] : []);
            const newValues = current.includes(val)
                ? current.filter(v => v !== val)
                : [...current, val];
            handleFilterChange({ target: { name: 'eventStatus', value: newValues } });
        }
    };

    const currentStatuses = Array.isArray(filters.eventStatus) ? filters.eventStatus : (filters.eventStatus ? [filters.eventStatus] : []);

    const sortOptions = [
        { label: "Default", value: "" },
        { label: "Oldest First", value: "asc" },
        { label: "Newest First", value: "desc" }
    ];

    return (
        <div className="filter-popover">
            <div className="filters-header-row">
                <h3 className="filters-title">Filters</h3>
                <button
                    className="filter-icon-button"
                    onClick={() => setShowFilters(false)}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
            </div>

            <div className="filter-group">
                <label>Status</label>
                <div className="custom-select-container" ref={dropdownRef}>
                    <div
                        className={`custom-select-header ${isStatusOpen ? 'active' : ''}`}
                        onClick={() => setIsStatusOpen(!isStatusOpen)}
                    >
                        <span className="selected-value">
                            {currentStatuses.length > 0 
                                ? currentStatuses.join(', ') 
                                : "All Statuses"}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isStatusOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>

                    {isStatusOpen && (
                        <div className="custom-select-dropdown">
                            <div className="dropdown-list">
                                {statusOptions.map((opt) => {
                                    const isSelected = opt.value === "" 
                                        ? currentStatuses.length === 0
                                        : currentStatuses.includes(opt.value);
                                    
                                    return (
                                        <div
                                            key={opt.value}
                                            className={`dropdown-option ${isSelected ? 'selected' : ''}`}
                                            onClick={() => toggleStatus(opt.value)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            <div style={{
                                                width: '16px',
                                                height: '16px',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: isSelected ? '#3b82f6' : 'white',
                                                borderColor: isSelected ? '#3b82f6' : '#cbd5e1'
                                            }}>
                                                {isSelected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                            </div>
                                            {opt.label}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <button onClick={resetFilters} className="reset-filters-btn">
                Reset All Filters
            </button>
        </div>
    );
};

export default Filters;