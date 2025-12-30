import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveBump } from '@nivo/bump';
import { ResponsivePie } from '@nivo/pie';
import { safeParseDate } from '../utils/helpers';
import CustomDropdown from './CustomDropdown';
import DateRangePicker from './DateRangePicker';

const CHART_THEME = {
    background: "#ffffff",
    textColor: "#333333",
    fontSize: 11,
    axis: {
        domain: {
            line: {
                stroke: "#777777",
                strokeWidth: 1
            }
        },
        legend: {
            text: {
                fontSize: 12,
                fill: "#333333"
            }
        },
        ticks: {
            line: {
                stroke: "#777777",
                strokeWidth: 1
            },
            text: {
                fontSize: 11,
                fill: "#333333"
            }
        }
    },
    grid: {
        line: {
            stroke: "#dddddd",
            strokeWidth: 1
        }
    }
};

const Analytics = ({ data }) => {
    const [chartType, setChartType] = useState('bar');
    const [dateRangePreset, setDateRangePreset] = useState('all');
    const [startDate, setStartDate] = useState('');

    const [endDate, setEndDate] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const datePickerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setShowDatePicker(false);
            }
        };

        if (showDatePicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDatePicker]);
    const filteredAnalyticsData = useMemo(() => {
        if (!data) return [];
        if (!startDate && !endDate) return data;

        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        return data.map(item => {
            const filteredEvents = (item.additionalInfo || []).filter(event => {
                const dateObj = safeParseDate(event.date);
                if (!dateObj) return false;

                if (start && dateObj < start) return false;
                if (end && dateObj > end) return false;

                return true;
            });

            if (filteredEvents.length === 0) return null;

            return {
                ...item,
                additionalInfo: filteredEvents
            };
        }).filter(item => item !== null);

    }, [data, startDate, endDate]);

    const { statusDistribution, bumpChartData, pieChartData } = useMemo(() => {
        const chartData = filteredAnalyticsData;

        if (!chartData || chartData.length === 0) {
            return { statusDistribution: [], bumpChartData: [], pieChartData: [] };
        }

        const allowedStatuses = ['uninstalled', 'store closed', 'installed'];
        const statusCounts = {};
        const timeStatusMap = {};
        const allMonths = new Set();
        const allStatuses = new Set();

        let useDaily = false;
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 60) useDaily = true;
        } else if (startDate && !endDate) {
        }

        chartData.forEach(item => {
            const status = item.currentEvent || "Unknown";

            if (!allowedStatuses.includes(status.toLowerCase())) {
                return;
            }

            statusCounts[status] = (statusCounts[status] || 0) + 1;
            allStatuses.add(status);

            const events = item.additionalInfo || [];
            events.forEach(event => {
                const dateObj = safeParseDate(event.date);
                if (!dateObj) return;

                const evStatus = event.event || "Unknown";
                if (!allowedStatuses.includes(evStatus.toLowerCase())) {
                    return;
                }

                let timeKey;
                if (useDaily) {
                    timeKey = dateObj.toISOString().split('T')[0];
                } else {
                    timeKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                }

                allMonths.add(timeKey);

                if (!timeStatusMap[timeKey]) {
                    timeStatusMap[timeKey] = {};
                }

                timeStatusMap[timeKey][evStatus] = (timeStatusMap[timeKey][evStatus] || 0) + 1;
                allStatuses.add(evStatus);
            });
        });

        const sortedStatus = Object.entries(statusCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        const sortedPie = Object.entries(statusCounts)
            .map(([name, count]) => ({ id: name, label: name, value: count }))
            .sort((a, b) => b.value - a.value);

        const sortedMonths = Array.from(allMonths).sort();

        const topStatuses = Object.entries(statusCounts)
            .sort((a, b) => b[1] - a[1])
            .map(s => s[0]);

        const bumpSeries = topStatuses.map(status => {
            return {
                id: status,
                data: sortedMonths.map(month => ({
                    x: month,
                    y: (timeStatusMap[month] && timeStatusMap[month][status]) || 0
                }))
            };
        });

        return {
            statusDistribution: sortedStatus || [],
            bumpChartData: bumpSeries,
            pieChartData: sortedPie
        };
    }, [filteredAnalyticsData, startDate, endDate]);

    const chartOptions = [
        { label: "Bar Chart", value: "bar" },
        { label: "Bump Chart", value: "bump" },
        { label: "Pie Chart", value: "pie" }
    ];

    const renderChart = () => {
        let legendLabel = 'Month';
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
            if (diffDays < 60) legendLabel = 'Day';
        } else if (startDate && !endDate) {
        }


        switch (chartType) {
            case 'pie':
                return (
                    <ResponsivePie
                        data={pieChartData}
                        margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                        innerRadius={0.5}
                        padAngle={0.7}
                        cornerRadius={3}
                        activeOuterRadiusOffset={8}
                        colors={{ scheme: 'nivo' }}
                        borderWidth={1}
                        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                        arcLinkLabelsSkipAngle={10}
                        arcLinkLabelsTextColor="#333333"
                        arcLinkLabelsThickness={2}
                        arcLinkLabelsColor={{ from: 'color' }}
                        arcLabelsSkipAngle={10}
                        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                        theme={CHART_THEME}
                    />
                );
            case 'bump':
                return (
                    <ResponsiveBump
                        data={bumpChartData}
                        margin={{ top: 40, right: 100, bottom: 40, left: 60 }}
                        colors={{ scheme: 'category10' }}
                        lineWidth={3}
                        activeLineWidth={6}
                        inactiveLineWidth={3}
                        inactiveOpacity={0.15}
                        pointSize={10}
                        activePointSize={16}
                        inactivePointSize={0}
                        pointColor={{ theme: 'background' }}
                        pointBorderWidth={3}
                        activePointBorderWidth={3}
                        pointBorderColor={{ from: 'serie.color' }}
                        axisTop={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: legendLabel,
                            legendPosition: 'middle',
                            legendOffset: -36
                        }}
                        axisBottom={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: legendLabel,
                            legendPosition: 'middle',
                            legendOffset: 32
                        }}
                        axisLeft={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: 'Count',
                            legendPosition: 'middle',
                            legendOffset: -40
                        }}
                        theme={CHART_THEME}
                    />
                );
            case 'bar':
            default:
                return (
                    <ResponsiveBar
                        data={statusDistribution}
                        keys={['count']}
                        indexBy="name"
                        margin={{ top: 30, right: 30, bottom: 60, left: 60 }}
                        padding={0.4}
                        valueScale={{ type: 'linear' }}
                        indexScale={{ type: 'band', round: true }}
                        colors={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']}
                        colorBy="indexValue"
                        borderRadius={4}
                        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                        axisTop={null}
                        axisRight={null}
                        axisBottom={{
                            tickSize: 0,
                            tickPadding: 16,
                            tickRotation: 0,
                            legend: '',
                            legendPosition: 'middle',
                            legendOffset: 32
                        }}
                        axisLeft={{
                            tickSize: 0,
                            tickPadding: 16,
                            tickRotation: 0,
                            legend: 'Count',
                            legendPosition: 'middle',
                            legendOffset: -50
                        }}
                        enableGridX={false}
                        enableGridY={true}
                        gridYValues={5}
                        labelSkipWidth={12}
                        labelSkipHeight={12}
                        labelTextColor="#ffffff"
                        role="application"
                        ariaLabel="Status Distribution Chart"
                        theme={{
                            ...CHART_THEME,
                            axis: {
                                ...CHART_THEME.axis,
                                legend: {
                                    text: {
                                        fill: '#64748b', // Modern Blue
                                        fontSize: 13,
                                        fontWeight: 700,
                                        fontFamily: 'Inter, sans-serif',
                                        letterSpacing: '1px',
                                        textTransform: 'uppercase'
                                    }
                                },
                                ticks: {
                                    ...CHART_THEME.axis.ticks,
                                    text: {
                                        ...CHART_THEME.axis.ticks.text,
                                        fill: '#64748b',
                                        fontSize: 12,
                                        fontWeight: 600
                                    }
                                }
                            },
                            grid: {
                                line: {
                                    stroke: '#f1f5f9',
                                    strokeWidth: 1,
                                    strokeDasharray: '4 4'
                                }
                            }
                        }}
                        tooltip={({ id, value, color, indexValue }) => (
                            <div
                                style={{
                                    padding: '8px 12px',
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <div style={{ width: '12px', height: '12px', background: color, borderRadius: '4px' }}></div>
                                <span style={{ color: '#64748b', fontSize: '12px' }}>{indexValue}:</span>
                                <strong style={{ color: '#1e293b' }}>{value}</strong>
                            </div>
                        )}
                    />
                );
        }
    };

    if (!data || data.length === 0) {
        return (
            <div className="analytics-container fade-in" style={{ padding: '2rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
                <div className="data-header">
                    <div className="data-header-left">
                        <div className="data-header-title">
                            <h1>Analytics Dashboard</h1>
                            <p>Visualizing 0 records</p>
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#334155' }}>No data available</h3>
                    <p style={{ color: '#64748b' }}>Try adjusting your filters in the Database Records tab.</p>
                </div>
            </div>
        );
    }


    return (
        <div className="analytics-container fade-in" style={{ padding: '2rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="data-header">
                <div className="data-header-left">
                    <div className="data-header-title">
                        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#1e293b' }}>Analytics Dashboard</h1>
                        <p style={{ color: '#64748b' }}>Visualizing {filteredAnalyticsData.length} records</p>
                    </div>
                </div>
            </div>

            <div className="filters-row" style={{ display: 'flex', gap: '1rem', margin: '2rem 0', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ width: '200px' }}>
                    <CustomDropdown
                        name="dateRangePreset"
                        value={dateRangePreset}
                        onChange={(e) => {
                            const preset = e.target.value;
                            setDateRangePreset(preset);

                            const now = new Date();
                            let start = null;
                            let end = null;

                            if (preset === 'today') {
                                start = new Date();
                                end = new Date();
                            } else if (preset === '7days') {
                                start = new Date();
                                start.setDate(now.getDate() - 7);
                                end = now;
                            } else if (preset === '30days') {
                                start = new Date();
                                start.setDate(now.getDate() - 30);
                                end = now;
                            } else if (preset === 'thisMonth') {
                                start = new Date(now.getFullYear(), now.getMonth(), 1);
                                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                            } else if (preset === 'lastMonth') {
                                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                                end = new Date(now.getFullYear(), now.getMonth(), 0);
                            } else if (preset === 'all') {
                                start = '';
                                end = '';
                            }

                            if (preset !== 'custom') {
                                setStartDate(start ? start.toISOString().split('T')[0] : '');
                                setEndDate(end ? end.toISOString().split('T')[0] : '');
                            }
                        }}
                        options={[
                            { label: 'All Time', value: 'all' },
                            { label: 'Today', value: 'today' },
                            { label: 'Last 7 Days', value: '7days' },
                            { label: 'Last 30 Days', value: '30days' },
                            { label: 'This Month', value: 'thisMonth' },
                            { label: 'Last Month', value: 'lastMonth' },
                            { label: 'Custom Range', value: 'custom' }
                        ]}
                        placeholder="Select Date Range"
                    />
                </div>

                {dateRangePreset === 'custom' && (
                    <div style={{ position: 'relative' }} ref={datePickerRef}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                padding: '8px',
                                backgroundColor: showDatePicker ? '#f1f5f9' : 'white',
                                transition: 'background-color 0.15s ease',
                            }}
                            className={`custom-date-trigger ${showDatePicker ? 'active' : ''}`}
                            onClick={() => setShowDatePicker(!showDatePicker)}
                        >
                            <div className="trigger-content" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="calendar-icon">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <div className="date-labels">
                                    <span className={!startDate ? 'placeholder' : ''}>
                                        {startDate ? new Date(startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Start Date'}
                                    </span>
                                    <span className="separator">→</span>
                                    <span className={!endDate ? 'placeholder' : ''}>
                                        {endDate ? new Date(endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'End Date'}
                                    </span>
                                </div>
                            </div>
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="chevron-icon"
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>

                        {showDatePicker && (
                            <DateRangePicker
                                startDate={startDate}
                                endDate={endDate}
                                onChange={(start, end) => {
                                    setStartDate(start);
                                    setEndDate(end);
                                    if (start && end) {
                                        // Optional: Close on selection
                                        // setShowDatePicker(false);
                                    }
                                }}
                                onClose={() => setShowDatePicker(false)}
                            />
                        )}
                    </div>
                )}

                {(startDate || endDate) && dateRangePreset !== 'all' && (
                    <button
                        onClick={() => {
                            setStartDate('');
                            setEndDate('');
                            setDateRangePreset('all');
                        }}
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: '#eff6ff',
                            border: '1px solid #dbeafe',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#2563eb',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#dbeafe'}
                        onMouseOut={(e) => e.target.style.background = '#eff6ff'}
                    >
                        <span>Reset</span>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.5 2.5L2.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2.5 2.5L9.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="chart-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', height: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#334155', textTransform: 'capitalize' }}>{chartType} Chart View</h3>
                    <div className="data-header-right">
                        <div style={{ width: '180px' }}>
                            <CustomDropdown
                                name="chartType"
                                value={chartType}
                                onChange={(e) => setChartType(e.target.value)}
                                options={chartOptions}
                                placeholder="Select Chart Type"
                            />
                        </div>
                    </div>
                </div>

                <div style={{ height: '420px' }}>
                    {renderChart()}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
