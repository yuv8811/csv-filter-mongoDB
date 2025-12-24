import { useState, useRef, useEffect } from "react";

const CustomDropdown = ({ options, value, onChange, placeholder, name }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);
    const displayLabel = selectedOption ? selectedOption.label : placeholder;

    const handleSelect = (val) => {
        onChange({ target: { name, value: val } });
        setIsOpen(false);
    };

    return (
        <div className="custom-select-container" ref={dropdownRef}>
            <div
                className={`custom-select-header ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="selected-value">{displayLabel}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>

            {isOpen && (
                <div className="custom-select-dropdown">
                    <div className="dropdown-list">
                        {options.map((opt) => (
                            <div
                                key={opt.value}
                                className={`dropdown-option ${value === opt.value ? 'selected' : ''}`}
                                onClick={() => handleSelect(opt.value)}
                            >
                                {opt.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
