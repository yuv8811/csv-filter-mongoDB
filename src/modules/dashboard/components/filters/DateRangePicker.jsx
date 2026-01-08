import React, { useState, useEffect } from 'react';
import './DateRangePicker.css';

const DateRangePicker = ({ startDate, endDate, onChange, onClose }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selecting, setSelecting] = useState(false);
    const [tempStart, setTempStart] = useState(startDate ? new Date(startDate) : null);
    const [tempEnd, setTempEnd] = useState(endDate ? new Date(endDate) : null);
    const [hoverDate, setHoverDate] = useState(null);

    // Sync internal state if props change externally
    useEffect(() => {
        if (startDate) setTempStart(new Date(startDate));
        if (endDate) setTempEnd(new Date(endDate));
    }, [startDate, endDate]);

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        clickedDate.setHours(0, 0, 0, 0);

        if (!selecting) {
            // Start a new selection
            setTempStart(clickedDate);
            setTempEnd(null);
            setSelecting(true);
        } else {
            // Complete selection
            let newStart = tempStart;
            let newEnd = clickedDate;

            if (clickedDate < tempStart) {
                newEnd = tempStart;
                newStart = clickedDate;
            }

            setTempEnd(newEnd);
            setTempStart(newStart);
            setSelecting(false);

            // Format dates as YYYY-MM-DD for the parent
            const format = (d) => {
                const offset = d.getTimezoneOffset();
                const dadjusted = new Date(d.getTime() - (offset * 60 * 1000));
                return dadjusted.toISOString().split('T')[0];
            };

            onChange(format(newStart), format(newEnd));
        }
    };

    const handleDateHover = (day) => {
        if (selecting) {
            setHoverDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
        }
    };

    const getDayClass = (day) => {
        const target = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        target.setHours(0, 0, 0, 0);

        let s = tempStart ? new Date(tempStart) : null;
        if (s) s.setHours(0, 0, 0, 0);

        let e = tempEnd ? new Date(tempEnd) : null;
        if (e) e.setHours(0, 0, 0, 0);

        // Handle dynamic selection range
        if (selecting && s && hoverDate) {
            const h = new Date(hoverDate); h.setHours(0, 0, 0, 0);
            const lower = s < h ? s : h;
            const upper = s < h ? h : s;
            e = upper; // Pretend end is hover date for visual
            s = lower;
        }

        const isStart = s && target.getTime() === s.getTime();
        const isEnd = e && target.getTime() === e.getTime();
        const inRange = s && e && target > s && target < e;

        let classes = ['day-cell'];
        if (isStart) classes.push('range-start');
        if (isEnd) classes.push('range-end');
        if (inRange) classes.push('in-range');
        return classes.join(' ');
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty - ${i} `} className="day-cell empty"></div>);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(
                <div
                    key={i}
                    className={getDayClass(i)}
                    onClick={() => handleDateClick(i)}
                    onMouseEnter={() => handleDateHover(i)}
                >
                    {i}
                </div>
            );
        }

        return days;
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="date-picker-container">
            <div className="calendar-header">
                <button onClick={handlePrevMonth} className="nav-button">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <span className="month-year-label">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                <button onClick={handleNextMonth} className="nav-button">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>

            <div className="weekdays-grid">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="weekday-label">{d}</div>
                ))}
            </div>

            <div className="days-grid">
                {renderCalendar()}
            </div>

            {(tempStart || tempEnd) && (
                <div className="picker-footer">
                    <div className="selected-date-display">
                        <span>{tempStart ? tempStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Start'}</span>
                        <span className="arrow-separator">→</span>
                        <span>{tempEnd ? tempEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : (selecting ? 'Select End' : 'End')}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangePicker;

