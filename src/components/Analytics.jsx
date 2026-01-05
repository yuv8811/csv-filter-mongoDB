import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveBump } from '@nivo/bump';
import { ResponsivePie } from '@nivo/pie';
import { safeParseDate } from '../utils/helpers';
import CustomDropdown from './CustomDropdown';
import DateRangePicker from './DateRangePicker';

const DateFilter = ({ preset, setPreset, startDate, setStartDate, endDate, setEndDate, showPicker, setShowPicker, pickerRef }) => {
    return (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ width: '160px' }}>
                <CustomDropdown
                    name="dateRangePreset"
                    value={preset}
                    onChange={(e) => {
                        const val = e.target.value;
                        setPreset(val);
                        const now = new Date();
                        let start = null;
                        let end = null;
                        if (val === 'today') {
                            start = new Date();
                            end = new Date();
                        } else if (val === '7days') {
                            start = new Date();
                            start.setDate(now.getDate() - 7);
                            end = now;
                        } else if (val === '30days') {
                            start = new Date();
                            start.setDate(now.getDate() - 30);
                            end = now;
                        } else if (val === 'thisMonth') {
                            start = new Date(now.getFullYear(), now.getMonth(), 1);
                            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                        } else if (val === 'lastMonth') {
                            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                            end = new Date(now.getFullYear(), now.getMonth(), 0);
                        } else if (val === 'all') {
                            start = '';
                            end = '';
                        }
                        if (val !== 'custom') {
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
                    placeholder="Date Range"
                />
            </div>
            {preset === 'custom' && (
                <div style={{ position: 'relative' }} ref={pickerRef}>
                    <div
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            border: '1px solid #e2e8f0', borderRadius: '4px', padding: '6px 12px',
                            backgroundColor: showPicker ? '#f1f5f9' : 'white', transition: 'background-color 0.15s ease'
                        }}
                        onClick={() => setShowPicker(!showPicker)}
                    >
                        <span style={{ fontSize: '13px', color: '#64748b' }}>
                            {startDate ? new Date(startDate).toLocaleDateString() : 'Start'} → {endDate ? new Date(endDate).toLocaleDateString() : 'End'}
                        </span>
                    </div>
                    {showPicker && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1000, marginTop: '4px' }}>
                            <DateRangePicker
                                startDate={startDate}
                                endDate={endDate}
                                onChange={(s, e) => {
                                    setStartDate(s);
                                    setEndDate(e);
                                }}
                                onClose={() => setShowPicker(false)}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const CHART_THEME = {
    background: "#ffffff",
    textColor: "#333333",
    fontSize: 12,
    axis: {
        domain: {
            line: {
                stroke: "#777777",
                strokeWidth: 1
            }
        },
        legend: {
            text: {
                fontSize: 13,
                fill: "#333333"
            }
        },
        ticks: {
            line: {
                stroke: "#777777",
                strokeWidth: 1
            },
            text: {
                fontSize: 12,
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
    const navigate = useNavigate();
    const [chartType, setChartType] = useState('bar');
    const [mainPreset, setMainPreset] = useState('all');
    const [mainStartDate, setMainStartDate] = useState('');
    const [mainEndDate, setMainEndDate] = useState('');
    const [showMainPicker, setShowMainPicker] = useState(false);
    const mainPickerRef = useRef(null);

    const [subPreset, setSubPreset] = useState('all');
    const [subStartDate, setSubStartDate] = useState('');
    const [subEndDate, setSubEndDate] = useState('');
    const [subChartType, setSubChartType] = useState('bar');
    const [showSubPicker, setShowSubPicker] = useState(false);
    const subPickerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (mainPickerRef.current && !mainPickerRef.current.contains(event.target)) {
                setShowMainPicker(false);
            }
            if (subPickerRef.current && !subPickerRef.current.contains(event.target)) {
                setShowSubPicker(false);
            }
        };

        if (showMainPicker || showSubPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMainPicker, showSubPicker]);

    const filterData = (rawData, startDate, endDate) => {
        if (!rawData) return [];
        if (!startDate && !endDate) return rawData;

        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        return rawData.map(item => {
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
    };

    const filteredMainData = useMemo(() => filterData(data, mainStartDate, mainEndDate), [data, mainStartDate, mainEndDate]);
    const filteredSubData = useMemo(() => filterData(data, subStartDate, subEndDate), [data, subStartDate, subEndDate]);
    const getEmptyBumpData = (startStr, endStr) => {
        let start = startStr ? new Date(startStr) : null;
        let end = endStr ? new Date(endStr) : null;

        if (!start || !end) {
            const now = new Date();
            end = new Date();
            start = new Date();
            start.setDate(now.getDate() - 30);
        }

        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const useDaily = diffDays < 60;

        const dummyMonths = [];
        let current = new Date(start);
        let iterations = 0;
        while (current <= end && iterations < 1000) {
            let timeKey;
            if (useDaily) {
                timeKey = current.toISOString().split('T')[0];
                current.setDate(current.getDate() + 1);
            } else {
                timeKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
                current.setMonth(current.getMonth() + 1);
            }
            if (!dummyMonths.includes(timeKey)) dummyMonths.push(timeKey);
            iterations++;
        }
        return [{
            id: "No Data",
            data: dummyMonths.map(m => ({ x: m, y: 1 }))
        }];
    };

    const { statusDistribution, bumpChartData, pieChartData } = useMemo(() => {
        const chartData = filteredMainData || [];

        const allowedStatuses = ['uninstalled', 'store closed', 'installed', 'subscription charge activated'];
        const statusCounts = {};
        const timeStatusMap = {};
        const allMonths = new Set();
        const allStatuses = new Set();

        let useDaily = false;
        if (mainStartDate && mainEndDate) {
            const start = new Date(mainStartDate);
            const end = new Date(mainEndDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 60) useDaily = true;
        }

        if (chartData.length > 0) {
            chartData.forEach(item => {
                const eventsInRange = item.additionalInfo || [];
                const sortedEvents = [...eventsInRange].sort((a, b) => {
                    const dateA = safeParseDate(a.date);
                    const dateB = safeParseDate(b.date);
                    return dateB - dateA;
                });

                const latestEvent = sortedEvents.length > 0 ? sortedEvents[0].event : (item.currentEvent || "Unknown");
                const status = latestEvent || "Unknown";

                if (allowedStatuses.includes(status.toLowerCase())) {
                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                    allStatuses.add(status);
                }

                eventsInRange.forEach(event => {
                    const dateObj = safeParseDate(event.date);
                    if (!dateObj) return;
                    const evStatus = event.event || "Unknown";
                    if (!allowedStatuses.includes(evStatus.toLowerCase())) return;

                    let timeKey;
                    if (useDaily) {
                        timeKey = dateObj.toISOString().split('T')[0];
                    } else {
                        timeKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                    }
                    allMonths.add(timeKey);
                    if (!timeStatusMap[timeKey]) timeStatusMap[timeKey] = {};
                    timeStatusMap[timeKey][evStatus] = (timeStatusMap[timeKey][evStatus] || 0) + 1;
                    allStatuses.add(evStatus);
                });
            });
        }

        const sortedStatus = Object.entries(statusCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        const sortedPie = Object.entries(statusCounts)
            .map(([name, count]) => ({ id: name, label: name, value: count }))
            .sort((a, b) => b.value - a.value);

        const sortedMonths = Array.from(allMonths).sort();
        const topStatuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(s => s[0]);

        let bumpSeries = topStatuses.map(status => ({
            id: status,
            data: sortedMonths.map(month => ({
                x: month,
                y: (timeStatusMap[month] && timeStatusMap[month][status]) || null
            }))
        }));

        if (bumpSeries.length === 0) {
            bumpSeries = getEmptyBumpData(mainStartDate, mainEndDate);
            if (sortedStatus.length === 0) sortedStatus.push({ name: "No Data", count: 0 });
            if (sortedPie.length === 0) sortedPie.push({ id: "No Data", label: "No Data", value: 1 });
        }

        return {
            statusDistribution: sortedStatus,
            bumpChartData: bumpSeries,
            pieChartData: sortedPie
        };
    }, [filteredMainData, mainStartDate, mainEndDate]);

    const { recentActivations, subscriptionBarData, subscriptionBumpData, subscriptionPieData } = useMemo(() => {
        const chartData = filteredSubData || [];
        const subscriptionEvents = [
            'subscription charge activated',
            'subscription charge frozen',
            'subscription charge unfrozen',
            'subscription charge cancelled'
        ];

        const recentActivations = [];
        const subscriptionCounts = {
            'Subscription Charge Activated': 0,
            'Subscription Charge Frozen': 0,
            'Subscription Charge Unfrozen': 0,
            'Subscription Charge Cancelled': 0
        };
        const timeStatusMap = {};
        const allMonths = new Set();
        let useDaily = false;

        if (subStartDate && subEndDate) {
            const start = new Date(subStartDate);
            const end = new Date(subEndDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 60) useDaily = true;
        }

        if (chartData.length > 0) {
            chartData.forEach(item => {
                const events = item.additionalInfo || [];
                if (events.length === 0) return;

                events.forEach(event => {
                    const evName = event.event?.toLowerCase();
                    if (subscriptionEvents.includes(evName)) {
                        recentActivations.push({
                            shop: item.shopDomain || item.shop || "Unknown Store",
                            date: event.date,
                            event: event.event
                        });

                        const dateObj = safeParseDate(event.date);
                        if (dateObj) {
                            let timeKey;
                            if (useDaily) {
                                timeKey = dateObj.toISOString().split('T')[0];
                            } else {
                                timeKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                            }

                            let statusLabel = "";
                            if (evName.includes('activated')) statusLabel = 'Subscription Charge Activated';
                            else if (evName.includes('frozen') && !evName.includes('unfrozen')) statusLabel = 'Subscription Charge Frozen';
                            else if (evName.includes('unfrozen')) statusLabel = 'Subscription Charge Unfrozen';
                            else if (evName.includes('cancelled')) statusLabel = 'Subscription Charge Cancelled';

                            if (statusLabel) {
                                allMonths.add(timeKey);
                                if (!timeStatusMap[timeKey]) timeStatusMap[timeKey] = {};
                                timeStatusMap[timeKey][statusLabel] = (timeStatusMap[timeKey][statusLabel] || 0) + 1;
                            }
                        }
                    }
                });

                const sortedEvents = [...events].sort((a, b) => {
                    const dateA = safeParseDate(a.date);
                    const dateB = safeParseDate(b.date);
                    return dateB - dateA;
                });
                const latestEvent = sortedEvents[0].event?.toLowerCase() || "";

                if (subscriptionEvents.includes(latestEvent)) {
                    if (latestEvent.includes('activated')) subscriptionCounts['Subscription Charge Activated']++;
                    else if (latestEvent.includes('frozen') && !latestEvent.includes('unfrozen')) subscriptionCounts['Subscription Charge Frozen']++;
                    else if (latestEvent.includes('unfrozen')) subscriptionCounts['Subscription Charge Unfrozen']++;
                    else if (latestEvent.includes('cancelled')) subscriptionCounts['Subscription Charge Cancelled']++;
                }
            });
        }

        recentActivations.sort((a, b) => {
            const dateA = safeParseDate(a.date);
            const dateB = safeParseDate(b.date);
            return dateB - dateA;
        });

        let subscriptionBarData = [
            { name: 'Subscription Charge Activated', count: subscriptionCounts['Subscription Charge Activated'] },
            { name: 'Subscription Charge Frozen', count: subscriptionCounts['Subscription Charge Frozen'] },
            { name: 'Subscription Charge Unfrozen', count: subscriptionCounts['Subscription Charge Unfrozen'] },
            { name: 'Subscription Charge Cancelled', count: subscriptionCounts['Subscription Charge Cancelled'] }
        ].sort((a, b) => b.count - a.count);

        let subscriptionPieData = subscriptionBarData
            .map(d => ({ id: d.name, label: d.name, value: d.count }))
            .sort((a, b) => b.value - a.value);

        const sortedMonths = Array.from(allMonths).sort();
        const topStatuses = Object.keys(subscriptionCounts);

        let subscriptionBumpData = topStatuses.map(status => ({
            id: status,
            data: sortedMonths.map(month => ({
                x: month,
                y: (timeStatusMap[month] && timeStatusMap[month][status]) || null
            }))
        }));

        subscriptionBumpData = subscriptionBumpData.filter(series => series.data.some(d => d.y !== null));

        if (subscriptionBumpData.length === 0) {
            subscriptionBumpData = getEmptyBumpData(subStartDate, subEndDate);
            if (subscriptionBarData.every(d => d.count === 0)) {
                subscriptionBarData = [{ name: "No Data", count: 0 }];
                subscriptionPieData = [{ id: "No Data", label: "No Data", value: 1 }];
            }
        }

        return {
            recentActivations: recentActivations.slice(0, 50),
            subscriptionBarData,
            subscriptionBumpData,
            subscriptionPieData
        };
    }, [filteredSubData, subStartDate, subEndDate]);




    const chartOptions = [
        { label: "Bar Chart", value: "bar" },
        { label: "Bump Chart", value: "bump" },
        { label: "Pie Chart", value: "pie" }
    ];

    const renderChart = () => {
        let legendLabel = 'Month';
        if (mainStartDate && mainEndDate) {
            const start = new Date(mainStartDate);
            const end = new Date(mainEndDate);
            const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
            if (diffDays < 60) legendLabel = 'Day';
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
                        colors={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1']}
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
                                        fontSize: 14,
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
                                        fontSize: 13,
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
                                <span style={{ color: '#64748b', fontSize: '13px' }}>{indexValue}:</span>
                                <strong style={{ color: '#1e293b' }}>{value}</strong>
                            </div>
                        )}
                    />
                );
        }
    };

    const renderSubscriptionTrendChart = () => {
        let legendLabel = 'Month';
        if (subStartDate && subEndDate) {
            const start = new Date(subStartDate);
            const end = new Date(subEndDate);
            const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
            if (diffDays < 60) legendLabel = 'Day';
        }

        const renderSubChartContent = () => {
            switch (subChartType) {
                case 'pie':
                    return (
                        <ResponsivePie
                            data={subscriptionPieData}
                            margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                            innerRadius={0.5}
                            padAngle={0.7}
                            cornerRadius={3}
                            activeOuterRadiusOffset={8}
                            colors={['#10b981', '#3b82f6', '#f59e0b', '#ef4444']}
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
                            data={subscriptionBumpData}
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
                            data={subscriptionBarData || []}
                            keys={['count']}
                            indexBy="name"
                            margin={{ top: 30, right: 30, bottom: 60, left: 60 }}
                            padding={0.4}
                            valueScale={{ type: 'linear' }}
                            indexScale={{ type: 'band', round: true }}
                            colors={['#10b981', '#3b82f6', '#f59e0b', '#ef4444']}
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
                            theme={{
                                ...CHART_THEME,
                                axis: {
                                    ...CHART_THEME.axis,
                                    legend: {
                                        text: {
                                            fill: '#64748b',
                                            fontSize: 14,
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
                                            fontSize: 13,
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
                                    <span style={{ color: '#64748b', fontSize: '13px' }}>{indexValue}:</span>
                                    <strong style={{ color: '#1e293b' }}>{value}</strong>
                                </div>
                            )}
                        />
                    );
            }
        };

        return (
            <div className="chart-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', marginTop: '2rem' }}>
                <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ color: '#334155', textTransform: 'capitalize', margin: 0 }}>Subscription Trends</h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <DateFilter
                            preset={subPreset}
                            setPreset={setSubPreset}
                            startDate={subStartDate}
                            setStartDate={setSubStartDate}
                            endDate={subEndDate}
                            setEndDate={setSubEndDate}
                            showPicker={showSubPicker}
                            setShowPicker={setShowSubPicker}
                            pickerRef={subPickerRef}
                        />
                        <div>
                            <CustomDropdown
                                name="subChartType"
                                value={subChartType}
                                onChange={(e) => setSubChartType(e.target.value)}
                                options={chartOptions}
                                placeholder="Select Chart Type"
                            />
                        </div>
                    </div>
                </div>
                <div style={{ height: '420px' }}>
                    {renderSubChartContent()}
                </div>
            </div>
        );
    }





    return (
        <div className="analytics-container fade-in" style={{ padding: '2rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="data-header">
                <div className="data-header-left">
                    <div className="data-header-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button className="back-button" onClick={() => navigate("/")} aria-label="Back to Dashboard">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                        </button>
                        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>Analytics Dashboard</h1>
                    </div>
                </div>
            </div>



            <div className="chart-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', height: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#334155', textTransform: 'capitalize' }}>{chartType} Chart View</h3>
                    <div className="data-header-right" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <DateFilter
                            preset={mainPreset}
                            setPreset={setMainPreset}
                            startDate={mainStartDate}
                            setStartDate={setMainStartDate}
                            endDate={mainEndDate}
                            setEndDate={setMainEndDate}
                            showPicker={showMainPicker}
                            setShowPicker={setShowMainPicker}
                            pickerRef={mainPickerRef}
                        />
                        <div>
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

            {renderSubscriptionTrendChart()}
        </div>
    );
};

export default Analytics;