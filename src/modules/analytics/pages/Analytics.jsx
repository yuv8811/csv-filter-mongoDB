import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";
import { safeParseDate } from "../../../shared/utils/helpers";
import CustomDropdown from "../../../shared/components/CustomDropdown/CustomDropdown";
import DateRangePicker from "../../dashboard/components/filters/DateRangePicker";
import {
  getRelevantEvent,
  determinePlanDetails,
} from "../../dashboard/utils/dataProcessor";

const DateFilter = ({
  preset,
  setPreset,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  showPicker,
  setShowPicker,
  pickerRef,
}) => {
  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <div style={{ width: "160px" }}>
        <CustomDropdown
          name="dateRangePreset"
          value={preset}
          onChange={(e) => {
            const val = e.target.value;
            setPreset(val);
            const now = new Date();
            let start = null;
            let end = null;
            if (val === "today") {
              start = new Date();
              end = new Date();
            } else if (val === "7days") {
              start = new Date();
              start.setDate(now.getDate() - 7);
              end = now;
            } else if (val === "30days") {
              start = new Date();
              start.setDate(now.getDate() - 30);
              end = now;
            } else if (val === "thisMonth") {
              start = new Date(now.getFullYear(), now.getMonth(), 1);
              end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            } else if (val === "lastMonth") {
              start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              end = new Date(now.getFullYear(), now.getMonth(), 0);
            } else if (val === "all") {
              start = "";
              end = "";
            }
            if (val !== "custom") {
              setStartDate(start ? start.toISOString().split("T")[0] : "");
              setEndDate(end ? end.toISOString().split("T")[0] : "");
            }
          }}
          options={[
            { label: "All Time", value: "all" },
            { label: "Today", value: "today" },
            { label: "Last 7 Days", value: "7days" },
            { label: "Last 30 Days", value: "30days" },
            { label: "This Month", value: "thisMonth" },
            { label: "Last Month", value: "lastMonth" },
            { label: "Custom Range", value: "custom" },
          ]}
          placeholder="Date Range"
        />
      </div>
      {preset === "custom" && (
        <div style={{ position: "relative" }} ref={pickerRef}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              border: "1px solid #e2e8f0",
              borderRadius: "4px",
              padding: "6px 12px",
              backgroundColor: showPicker ? "#f1f5f9" : "white",
              transition: "background-color 0.15s ease",
            }}
            onClick={() => setShowPicker(!showPicker)}
          >
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              {startDate ? new Date(startDate).toLocaleDateString() : "Start"} →{" "}
              {endDate ? new Date(endDate).toLocaleDateString() : "End"}
            </span>
          </div>
          {showPicker && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                zIndex: 1000,
                marginTop: "4px",
              }}
            >
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
  textColor: "#64748b",
  fontSize: 12,
  fontFamily: "Inter, sans-serif",
  axis: {
    domain: {
      line: {
        stroke: "#cbd5e1",
        strokeWidth: 1,
      },
    },
    legend: {
      text: {
        fontSize: 12,
        fill: "#1e293b", // Slate-800 for maximum contrast
        fontWeight: 900, // Black weight for boldness
        textTransform: "uppercase",
        letterSpacing: "1px",
        fontFamily: "Inter, sans-serif",
      },
    },
    ticks: {
      line: {
        stroke: "#cbd5e1",
        strokeWidth: 1,
      },
      text: {
        fontSize: 11,
        fill: "#64748b",
        fontWeight: 600,
        fontFamily: "Inter, sans-serif",
      },
    },
  },
  grid: {
    line: {
      stroke: "#f1f5f9",
      strokeWidth: 1,
      strokeDasharray: "4 4",
    },
  },
};

const MetricCard = ({ title, value, icon, trend, subLabel }) => (
  <div
    style={{
      background: "white",
      borderRadius: "16px",
      padding: "1.5rem",
      boxShadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
      cursor: "default",
      border: "1px solid #f1f5f9",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05)";
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <span
        style={{
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </span>
      {icon && (
        <div
          style={{
            padding: "8px",
            background: "#f0f9ff",
            borderRadius: "12px",
            color: "#0284c7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      )}
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
      <span
        style={{
          fontSize: "2rem",
          fontWeight: "800",
          color: "#0f172a",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      {subLabel && (
        <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
          {subLabel}
        </span>
      )}
    </div>
    {trend && (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          marginTop: "auto",
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: "600",
            color: trend.isPositive ? "#16a34a" : "#dc2626",
            background: trend.isPositive ? "#dcfce7" : "#fee2e2",
            padding: "2px 8px",
            borderRadius: "999px",
          }}
        >
          {trend.value}
        </span>
        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
          vs last period
        </span>
      </div>
    )}
  </div>
);

const Analytics = ({ data, updateMainFilter }) => {
  const navigate = useNavigate();
  const [chartType, setChartType] = useState("bar");
  const [mainPreset, setMainPreset] = useState("all");
  const [mainStartDate, setMainStartDate] = useState("");
  const [mainEndDate, setMainEndDate] = useState("");
  const [subscriptionChartType, setSubscriptionChartType] = useState("bar");
  const [subscriptionPreset, setSubscriptionPreset] = useState("all");
  const [subscriptionStartDate, setSubscriptionStartDate] = useState("");
  const [subscriptionEndDate, setSubscriptionEndDate] = useState("");

  const [showMainPicker, setShowMainPicker] = useState(false);
  const [showSubscriptionPicker, setShowSubscriptionPicker] = useState(false);
  const mainPickerRef = useRef(null);
  const subscriptionPickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mainPickerRef.current &&
        !mainPickerRef.current.contains(event.target)
      ) {
        setShowMainPicker(false);
      }
      if (
        subscriptionPickerRef.current &&
        !subscriptionPickerRef.current.contains(event.target)
      ) {
        setShowSubscriptionPicker(false);
      }
    };

    if (showMainPicker || showSubscriptionPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMainPicker, showSubscriptionPicker]);

  const filterData = (rawData, startDate, endDate) => {
    if (!rawData) return [];
    if (!startDate && !endDate) return rawData;

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    return rawData
      .map((item) => {
        const filteredEvents = (item.additionalInfo || []).filter((event) => {
          const dateObj = safeParseDate(event.date);
          if (!dateObj) return false;
          if (start && dateObj < start) return false;
          if (end && dateObj > end) return false;
          return true;
        });
        if (filteredEvents.length === 0) return null;
        return {
          ...item,
          additionalInfo: filteredEvents,
        };
      })
      .filter((item) => item !== null);
  };

  const filteredMainData = useMemo(
    () => filterData(data, mainStartDate, mainEndDate),
    [data, mainStartDate, mainEndDate],
  );

  const filteredSubscriptionData = useMemo(
    () => filterData(data, subscriptionStartDate, subscriptionEndDate),
    [data, subscriptionStartDate, subscriptionEndDate],
  );

  const getEmptylineData = (startStr, endStr) => {
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
        timeKey = current.toISOString().split("T")[0];
        current.setDate(current.getDate() + 1);
      } else {
        timeKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
        current.setMonth(current.getMonth() + 1);
      }
      if (!dummyMonths.includes(timeKey)) dummyMonths.push(timeKey);
      iterations++;
    }
    return [
      {
        id: "No Data",
        data: dummyMonths.map((m) => ({ x: new Date(m), y: 1 })),
      },
    ];
  };

  const { statusDistribution, lineChartData, pieChartData } = useMemo(() => {
    const chartData = filteredMainData || [];

    const allowedStatuses = ["Uninstalled", "Installed"];
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
      chartData.forEach((item) => {
        const eventsInRange = item.additionalInfo || [];

        // Use centralized logic from getRelevantEvent
        // It sorts internally and now returns the raw last event
        const relevantEventObj = getRelevantEvent({
          ...item,
          additionalInfo: eventsInRange,
        });
        const rawLastEvent = relevantEventObj
          ? (relevantEventObj.event || "").toLowerCase()
          : "unknown";

        let status = "Unknown";
        // Logic: Uninstalled & Subscription Canceled -> Uninstalled
        if (
          rawLastEvent === "uninstalled" ||
          rawLastEvent.includes("canceled")
        ) {
          status = "Uninstalled";
        }
        // Logic: Installed, Store Closed/Reopen, Other Subscriptions -> Installed
        else if (
          rawLastEvent === "installed" ||
          rawLastEvent.includes("store") ||
          rawLastEvent.includes("subscription")
        ) {
          status = "Installed";
        }

        if (allowedStatuses.includes(status)) {
          statusCounts[status] = (statusCounts[status] || 0) + 1;
          allStatuses.add(status);
        }

        if (relevantEventObj && relevantEventObj.date) {
          const dateObj = safeParseDate(relevantEventObj.date);
          if (dateObj) {
            let shouldInclude = true;
            // STRICT DATE FILTER
            if (mainStartDate && mainEndDate) {
              const start = new Date(mainStartDate);
              const end = new Date(mainEndDate);
              end.setHours(23, 59, 59, 999);
              if (dateObj < start || dateObj > end) shouldInclude = false;
            }

            if (shouldInclude && allowedStatuses.includes(status)) {
              let timeKey;
              if (useDaily) {
                timeKey = dateObj.toISOString().split("T")[0];
              } else {
                timeKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
              }
              allMonths.add(timeKey);
              if (!timeStatusMap[timeKey]) timeStatusMap[timeKey] = {};
              timeStatusMap[timeKey][status] =
                (timeStatusMap[timeKey][status] || 0) + 1;
            }
          }
        }
      });
    }

    const sortedStatus = Object.entries(statusCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const sortedPie = Object.entries(statusCounts)
      .map(([name, count]) => ({ id: name, label: name, value: count }))
      .sort((a, b) => b.value - a.value);

    const sortedMonths = Array.from(allMonths).sort();
    const topStatuses = Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .map((s) => s[0]);

    let lineSeries = topStatuses.map((status) => ({
      id: status,
      data: sortedMonths.map((month) => ({
        x: new Date(month),
        y: (timeStatusMap[month] && timeStatusMap[month][status]) || 0,
        seriesName: status,
      })),
    }));

    if (lineSeries.length === 0) {
      lineSeries = getEmptylineData(mainStartDate, mainEndDate);
      if (sortedStatus.length === 0)
        sortedStatus.push({ name: "No Data", count: 0 });
      if (sortedPie.length === 0)
        sortedPie.push({ id: "No Data", label: "No Data", value: 1 });
    }

    return {
      statusDistribution: sortedStatus,
      lineChartData: lineSeries,
      pieChartData: sortedPie,
    };
  }, [filteredMainData, mainStartDate, mainEndDate]);

  const { planChartData, subscriptionLineData } = useMemo(() => {
    const chartData = filteredSubscriptionData || [];
    const eventCounts = {
      "Subscription Charge Activated": 0,
      "Subscription Charge Canceled": 0,
      "Subscription Charge Frozen": 0,
      "Subscription Charge Expired": 0,
    };
    const subTimeStatusMap = {};
    const allSubMonths = new Set();

    let useDaily = false;
    if (subscriptionStartDate && subscriptionEndDate) {
      const start = new Date(subscriptionStartDate);
      const end = new Date(subscriptionEndDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 60) useDaily = true;
    }

    if (chartData.length > 0) {
      chartData.forEach((item) => {
        const eventsInRange = item.additionalInfo || [];

        // Count totals for Bar/Pie
        const relevantEventObj = getRelevantEvent({
          ...item,
          additionalInfo: eventsInRange,
        });
        const rawLastEvent = relevantEventObj
          ? (relevantEventObj.event || "").toLowerCase()
          : "unknown";

        if (rawLastEvent.includes("activated"))
          eventCounts["Subscription Charge Activated"]++;
        else if (rawLastEvent.includes("canceled"))
          eventCounts["Subscription Charge Canceled"]++;
        else if (
          rawLastEvent.includes("frozen") &&
          !rawLastEvent.includes("unfrozen")
        )
          eventCounts["Subscription Charge Frozen"]++;
        else if (rawLastEvent.includes("expired"))
          eventCounts["Subscription Charge Expired"]++;

        // Process Timeline for Line Chart
        // Process Timeline for Line Chart
        // Only map the relevant (last) event to the timeline
        if (relevantEventObj && relevantEventObj.date) {
          const dateObj = safeParseDate(relevantEventObj.date);
          if (dateObj) {
            let shouldInclude = true;
            // STRICT DATE FILTER: Only count events within the selected range
            if (subscriptionStartDate && subscriptionEndDate) {
              const start = new Date(subscriptionStartDate);
              const end = new Date(subscriptionEndDate);
              end.setHours(23, 59, 59, 999);
              if (dateObj < start || dateObj > end) shouldInclude = false;
            }

            if (shouldInclude) {
              let subEventName = "";
              if (rawLastEvent.includes("activated"))
                subEventName = "Subscription Charge Activated";
              else if (rawLastEvent.includes("canceled"))
                subEventName = "Subscription Charge Canceled";
              else if (
                rawLastEvent.includes("frozen") &&
                !rawLastEvent.includes("unfrozen")
              )
                subEventName = "Subscription Charge Frozen";
              else if (rawLastEvent.includes("expired"))
                subEventName = "Subscription Charge Expired";

              if (subEventName) {
                let timeKey;
                if (useDaily) {
                  timeKey = dateObj.toISOString().split("T")[0];
                } else {
                  timeKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
                }
                allSubMonths.add(timeKey);
                if (!subTimeStatusMap[timeKey]) subTimeStatusMap[timeKey] = {};
                subTimeStatusMap[timeKey][subEventName] =
                  (subTimeStatusMap[timeKey][subEventName] || 0) + 1;
              }
            }
          }
        }
      });
    }

    const sortedMonths = Array.from(allSubMonths).sort();
    const subStatuses = Object.keys(eventCounts);

    let lineSeries = subStatuses.map((status) => ({
      id: status,
      data: sortedMonths.map((month) => ({
        x: new Date(month),
        y: (subTimeStatusMap[month] && subTimeStatusMap[month][status]) || 0,
        seriesName: status,
      })),
    }));

    if (lineSeries.length === 0 || sortedMonths.length === 0) {
      lineSeries = getEmptylineData(
        subscriptionStartDate,
        subscriptionEndDate,
      ).map((d) => ({ ...d, id: "No Data" }));
    }

    return {
      planChartData: Object.entries(eventCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      subscriptionLineData: lineSeries,
    };
  }, [filteredSubscriptionData, subscriptionStartDate, subscriptionEndDate]);

  const getChartColor = (item) => {
    // Handle different Nivo data structures
    const id = item.indexValue || item.id || item.name || item;
    const lower = String(id).toLowerCase();

    if (lower === "installed") return "#10b981"; // Green
    if (lower === "uninstalled") return "#ef4444"; // Red

    // Subscription Events Colors
    if (lower.includes("activated")) return "#10b981"; // Emerald
    if (lower.includes("canceled")) return "#ef4444"; // Red
    if (lower.includes("frozen")) return "#3b82f6"; // Blue
    if (lower.includes("expired")) return "#f59e0b"; // Amber

    // Default palette for other statuses
    const palette = ["#3b82f6", "#f59e0b", "#8b5cf6", "#6366f1"];
    // Simple consistent hash-like color assignment
    let hash = 0;
    for (let i = 0; i < lower.length; i++) {
      hash = lower.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  };

  const chartOptions = [
    { label: "Bar Chart", value: "bar" },
    { label: "Line Chart", value: "line" },
    { label: "Pie Chart", value: "pie" },
  ];

  const renderChart = () => {
    let legendLabel = "Month";
    let diffDays = 100;
    if (mainStartDate && mainEndDate) {
      const start = new Date(mainStartDate);
      const end = new Date(mainEndDate);
      diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
      if (diffDays < 60) legendLabel = "Day";
    }

    switch (chartType) {
      case "pie":
        return (
          <ResponsivePie
            data={pieChartData}
            margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
            innerRadius={0.5}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            colors={getChartColor}
            borderWidth={1}
            borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor="#333333"
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: "color" }}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
            theme={CHART_THEME}
            onClick={(node) => {
              const status = node.id;
              let filterKey = "";
              if (status === "Installed") filterKey = "Active";
              else if (status === "Uninstalled") filterKey = "Inactive";
              else filterKey = status ? status.toLowerCase() : "";

              if (filterKey) {
                navigate(`/?eventStatus=${filterKey}`);
              }
            }}
          />
        );
      case "line":
        return (
          <ResponsiveLine
            onClick={(point) => {
              const status = point.serieId;
              let filterKey = "";
              if (status === "Installed") filterKey = "Active";
              else if (status === "Uninstalled") filterKey = "Inactive";
              else filterKey = status ? status.toLowerCase() : "";

              if (filterKey) {
                navigate(`/?eventStatus=${filterKey}`);
              }
            }}
            data={lineChartData}
            margin={{ top: 20, right: 30, bottom: 60, left: 70 }}
            xScale={{
              type: "time",
              precision: "day",
            }}
            yScale={{
              type: "linear",
              min: 0,
              max: "auto",
              stacked: false,
              reverse: false,
            }}
            gridXValues={[]}
            gridYValues={5}
            enableGridX={false}
            enableGridY={true}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickValues: 20,
              tickSize: 0,
              tickPadding: 15,
              tickRotation: 0,
              legend: legendLabel,
              legendOffset: 45,
              legendPosition: "middle",
              format: (value) => {
                if (value instanceof Date) {
                  return value.toLocaleDateString("en-US", {
                    month: "short",
                    day: diffDays < 60 ? "numeric" : undefined,
                    year: diffDays < 60 ? undefined : "2-digit",
                  });
                }
                return value;
              },
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 15,
              tickRotation: 0,
              legend: "COUNT",
              legendOffset: -60,
              legendPosition: "middle",
            }}
            enableArea={true}
            areaOpacity={0.1}
            colors={getChartColor}
            lineWidth={4}
            pointSize={8}
            activePointSize={12}
            pointColor={{ theme: "background" }}
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            enableSlices="x"
            crosshairType="x"
            curve="monotoneX"
            legends={[
              {
                anchor: "top-right",
                direction: "column",
                justify: false,
                translateX: 0,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: "left-to-right",
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: "circle",
                symbolBorderColor: "rgba(0, 0, 0, .5)",
                effects: [
                  {
                    on: "hover",
                    style: {
                      itemBackground: "rgba(0, 0, 0, .03)",
                      itemOpacity: 1,
                    },
                  },
                ],
              },
            ]}
            sliceTooltip={({ slice }) => {
              const sortedPoints = [...slice.points].sort(
                (a, b) => b.data.y - a.data.y,
              );
              return (
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.98)",
                    backdropFilter: "blur(12px)",
                    padding: "12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow:
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    minWidth: "200px",
                  }}
                >
                  <div
                    style={{
                      marginBottom: "12px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#64748b",
                      borderBottom: "1px solid #f1f5f9",
                      paddingBottom: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>Period</span>
                    <span style={{ color: "#0f172a" }}>
                      {slice.points[0].data.x instanceof Date
                        ? slice.points[0].data.x.toLocaleDateString("en-US", {
                            month: "short",
                            day: diffDays < 60 ? "numeric" : undefined,
                            year: diffDays < 60 ? undefined : "numeric",
                          })
                        : slice.points[0].data.x}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {sortedPoints.map((point) => {
                      const label =
                        point.data.seriesName ||
                        point.serieId ||
                        point.serie?.id ||
                        "Unknown";
                      return (
                        <div
                          key={point.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "12px",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: `${point.serieColor}08`, // Very faint background
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "6px",
                                height: "6px",
                                backgroundColor: point.serieColor,
                                borderRadius: "50%",
                              }}
                            />
                            <span
                              style={{
                                color: "#334155",
                                fontWeight: "600",
                                fontSize: "12px",
                                textTransform: "capitalize",
                              }}
                            >
                              {label}
                            </span>
                          </div>
                          <strong
                            style={{
                              color: "#0f172a",
                              fontWeight: "700",
                              fontSize: "13px",
                            }}
                          >
                            {point.data.yFormatted}
                          </strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }}
            theme={CHART_THEME}
          />
        );
      case "plan":
        return (
          <ResponsiveBar
            data={planChartData}
            keys={["count"]}
            indexBy="name"
            margin={{ top: 30, right: 30, bottom: 60, left: 70 }}
            padding={0.4}
            valueScale={{ type: "linear" }}
            indexScale={{ type: "band", round: true }}
            colors={{ scheme: "nivo" }}
            borderRadius={4}
            borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 0,
              tickPadding: 10,
              tickRotation: 0,
              legendPosition: "middle",
              legendOffset: 32,
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 10,
              tickRotation: 0,
              legend: "COUNT",
              legendPosition: "middle",
              legendOffset: -60,
            }}
            enableGridX={false}
            enableGridY={true}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor="#ffffff"
            isInteractive={true}
            onClick={(node) => {
              navigate(`/?eventStatus=${encodeURIComponent(node.indexValue)}`);
            }}
            theme={CHART_THEME}
            tooltip={({ id, value, color, indexValue }) => (
              <div
                style={{
                  padding: "8px 12px",
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    background: color,
                    borderRadius: "4px",
                  }}
                ></div>
                <span style={{ color: "#64748b", fontSize: "13px" }}>
                  {indexValue}:
                </span>
                <strong style={{ color: "#1e293b" }}>{value}</strong>
              </div>
            )}
          />
        );
      case "bar":
      default:
        return (
          <ResponsiveBar
            data={statusDistribution}
            keys={["count"]}
            indexBy="name"
            margin={{ top: 30, right: 30, bottom: 60, left: 70 }}
            padding={0.4}
            valueScale={{ type: "linear" }}
            indexScale={{ type: "band", round: true }}
            colors={getChartColor}
            colorBy="indexValue"
            borderRadius={4}
            borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 0,
              tickPadding: 10,
              tickRotation: 0,
              legend: "",
              legendPosition: "middle",
              legendOffset: 32,
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 10,
              tickRotation: 0,
              legend: "COUNT",
              legendPosition: "middle",
              legendOffset: -60,
            }}
            enableGridX={false}
            enableGridY={true}
            gridYValues={5}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor="#ffffff"
            role="application"
            ariaLabel="Status Distribution Chart"
            isInteractive={true}
            onClick={(node) => {
              const status = node.indexValue;
              let filterKey = "";

              // Map Analytics Status to DataProcessor Group Keys
              if (status === "Installed") filterKey = "Active";
              else if (status === "Uninstalled") filterKey = "Inactive";
              else filterKey = status ? status.toLowerCase() : "";

              if (filterKey) {
                navigate(`/?eventStatus=${filterKey}`);
              }
            }}
            theme={CHART_THEME}
            tooltip={({ id, value, color, indexValue }) => (
              <div
                style={{
                  padding: "8px 12px",
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    background: color,
                    borderRadius: "4px",
                  }}
                ></div>
                <span style={{ color: "#64748b", fontSize: "13px" }}>
                  {indexValue}:
                </span>
                <strong style={{ color: "#1e293b" }}>{value}</strong>
              </div>
            )}
          />
        );
    }
  };

  const renderSubscriptionChart = () => {
    switch (subscriptionChartType) {
      case "pie":
        const pieData = planChartData.map((d) => ({
          id: d.name,
          label: d.name,
          value: d.count,
        }));
        return (
          <ResponsivePie
            onClick={(node) => {
              navigate(`/?eventStatus=${encodeURIComponent(node.id)}`);
            }}
            data={pieData}
            margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
            innerRadius={0.5}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            colors={getChartColor}
            borderWidth={1}
            borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor="#333333"
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: "color" }}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
            theme={CHART_THEME}
          />
        );
      case "line":
        let legendLabel = "Month";
        let diffDays = 100; // Default large enough to show Month Year
        if (subscriptionStartDate && subscriptionEndDate) {
          const start = new Date(subscriptionStartDate);
          const end = new Date(subscriptionEndDate);
          diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
          if (diffDays < 60) legendLabel = "Day";
        }
        return (
          <ResponsiveLine
            onClick={(point) => {
              navigate(`/?eventStatus=${encodeURIComponent(point.serieId)}`);
            }}
            data={subscriptionLineData}
            margin={{ top: 20, right: 30, bottom: 60, left: 70 }}
            xScale={{
              type: "time",
              precision: "day",
            }}
            yScale={{
              type: "linear",
              min: 0,
              max: "auto",
              stacked: false,
              reverse: false,
            }}
            gridXValues={[]}
            gridYValues={5}
            enableGridX={false}
            enableGridY={true}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickValues: 20,
              tickSize: 0,
              tickPadding: 15,
              tickRotation: 0,
              legend: legendLabel,
              legendOffset: 45,
              legendPosition: "middle",
              format: (value) => {
                if (value instanceof Date) {
                  return value.toLocaleDateString("en-US", {
                    month: "short",
                    day: diffDays < 60 ? "numeric" : undefined,
                    year: diffDays < 60 ? undefined : "2-digit",
                  });
                }
                return value;
              },
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 15,
              tickRotation: 0,
              legend: "COUNT",
              legendOffset: -60,
              legendPosition: "middle",
            }}
            enableArea={true}
            areaOpacity={0.1}
            colors={getChartColor}
            lineWidth={4}
            pointSize={8}
            activePointSize={12}
            pointColor={{ theme: "background" }}
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            enableSlices="x"
            crosshairType="x"
            curve="monotoneX"
            legends={[
              {
                anchor: "top-right",
                direction: "column",
                justify: false,
                translateX: 0,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: "left-to-right",
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: "circle",
                symbolBorderColor: "rgba(0, 0, 0, .5)",
                effects: [
                  {
                    on: "hover",
                    style: {
                      itemBackground: "rgba(0, 0, 0, .03)",
                      itemOpacity: 1,
                    },
                  },
                ],
              },
            ]}
            sliceTooltip={({ slice }) => {
              const sortedPoints = [...slice.points].sort(
                (a, b) => b.data.y - a.data.y,
              );
              return (
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.98)",
                    backdropFilter: "blur(12px)",
                    padding: "12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow:
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    minWidth: "200px",
                  }}
                >
                  <div
                    style={{
                      marginBottom: "12px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#64748b",
                      borderBottom: "1px solid #f1f5f9",
                      paddingBottom: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>Period</span>
                    <span style={{ color: "#0f172a" }}>
                      {slice.points[0].data.x instanceof Date
                        ? slice.points[0].data.x.toLocaleDateString("en-US", {
                            month: "short",
                            day: diffDays < 60 ? "numeric" : undefined,
                            year: diffDays < 60 ? undefined : "numeric",
                          })
                        : slice.points[0].data.x}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {sortedPoints.map((point) => {
                      const label =
                        point.data.seriesName ||
                        point.serieId ||
                        point.serie?.id ||
                        "Unknown";
                      return (
                        <div
                          key={point.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "12px",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: `${point.serieColor}08`, // Very faint background
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "6px",
                                height: "6px",
                                backgroundColor: point.serieColor,
                                borderRadius: "50%",
                              }}
                            />
                            <span
                              style={{
                                color: "#334155",
                                fontWeight: "600",
                                fontSize: "12px",
                                textTransform: "capitalize",
                              }}
                            >
                              {label}
                            </span>
                          </div>
                          <strong
                            style={{
                              color: "#0f172a",
                              fontWeight: "700",
                              fontSize: "13px",
                            }}
                          >
                            {point.data.yFormatted}
                          </strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }}
            theme={CHART_THEME}
          />
        );
      case "bar":
      default:
        return (
          <ResponsiveBar
            data={planChartData}
            keys={["count"]}
            indexBy="name"
            margin={{ top: 30, right: 30, bottom: 60, left: 70 }}
            padding={0.4}
            valueScale={{ type: "linear" }}
            indexScale={{ type: "band", round: true }}
            colors={getChartColor}
            colorBy="indexValue"
            borderRadius={4}
            borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 0,
              tickPadding: 10,
              tickRotation: 0,
              legendPosition: "middle",
              legendOffset: 32,
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 10,
              tickRotation: 0,
              legend: "COUNT",
              legendPosition: "middle",
              legendOffset: -60,
            }}
            enableGridX={false}
            enableGridY={true}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor="#ffffff"
            isInteractive={true}
            onClick={(node) => {
              navigate(`/?eventStatus=${encodeURIComponent(node.indexValue)}`);
            }}
            theme={CHART_THEME}
            tooltip={({ id, value, color, indexValue }) => (
              <div
                style={{
                  padding: "8px 12px",
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    background: color,
                    borderRadius: "4px",
                  }}
                ></div>
                <span style={{ color: "#64748b", fontSize: "13px" }}>
                  {indexValue}:
                </span>
                <strong style={{ color: "#1e293b" }}>{value}</strong>
              </div>
            )}
          />
        );
    }
  };

  const totalApps = statusDistribution
    ? statusDistribution.reduce((acc, curr) => acc + curr.count, 0)
    : 0;
  const activeInstalls = statusDistribution
    ? statusDistribution.find((s) => s.name === "Installed")?.count || 0
    : 0;
  const uninstalls = statusDistribution
    ? statusDistribution.find((s) => s.name === "Uninstalled")?.count || 0
    : 0;
  const activeSubs = planChartData
    ? planChartData.find((p) => p.name === "Subscription Charge Activated")
        ?.count || 0
    : 0;

  return (
    <div
      className="analytics-container fade-in"
      style={{
        padding: "2rem",
        width: "100%",
        minHeight: "100vh",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        {/* Header Section */}
        <div className="data-header">
          <div className="data-header-left">
            <div
              className="data-header-title"
              style={{ display: "flex", alignItems: "center", gap: "1rem" }}
            >
              <button
                className="back-button"
                onClick={() => navigate("/")}
                aria-label="Back to Dashboard"
                style={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#cbd5e1")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "#e2e8f0")
                }
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
              <div>
                <h1
                  style={{
                    fontSize: "1.875rem",
                    fontWeight: "800",
                    color: "#0f172a",
                    margin: 0,
                    letterSpacing: "-0.025em",
                  }}
                >
                  Analytics Dashboard
                </h1>
                <p
                  style={{
                    margin: 0,
                    color: "#64748b",
                    fontSize: "0.875rem",
                    marginTop: "4px",
                  }}
                >
                  Track your app's performance and subscription metrics
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.5rem",
          }}
        >
          <MetricCard
            title="Total Stores"
            value={totalApps}
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            }
          />
          <MetricCard
            title="Active Installs"
            value={activeInstalls}
            subLabel={`(${totalApps > 0 ? ((activeInstalls / totalApps) * 100).toFixed(1) : 0}%)`}
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            }
          />
          <MetricCard
            title="Uninstalls"
            value={uninstalls}
            subLabel={`(${totalApps > 0 ? ((uninstalls / totalApps) * 100).toFixed(1) : 0}%)`}
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            }
          />
          <MetricCard
            title="Active Subscriptions"
            value={activeSubs}
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            }
          />
        </div>

        <div
          className="chart-card"
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "16px",
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
            height: "500px",
            border: "1px solid #f1f5f9",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3
              style={{
                marginBottom: "1rem",
                color: "#334155",
                textTransform: "capitalize",
              }}
            >
              {chartType} Chart View
            </h3>
            <div
              className="data-header-right"
              style={{ display: "flex", gap: "1rem", alignItems: "center" }}
            >
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

          <div style={{ height: "420px" }}>{renderChart()}</div>
        </div>

        <div
          className="chart-card"
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "16px",
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
            height: "500px",
            border: "1px solid #f1f5f9",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3
              style={{
                marginBottom: "1rem",
                color: "#334155",
                textTransform: "capitalize",
              }}
            >
              Subscription Events
            </h3>
            <div
              className="data-header-right"
              style={{ display: "flex", gap: "1rem", alignItems: "center" }}
            >
              <DateFilter
                preset={subscriptionPreset}
                setPreset={setSubscriptionPreset}
                startDate={subscriptionStartDate}
                setStartDate={setSubscriptionStartDate}
                endDate={subscriptionEndDate}
                setEndDate={setSubscriptionEndDate}
                showPicker={showSubscriptionPicker}
                setShowPicker={setShowSubscriptionPicker}
                pickerRef={subscriptionPickerRef}
              />
              <div>
                <CustomDropdown
                  name="subscriptionChartType"
                  value={subscriptionChartType}
                  onChange={(e) => setSubscriptionChartType(e.target.value)}
                  options={chartOptions}
                  placeholder="Select Chart Type"
                />
              </div>
            </div>
          </div>

          <div style={{ height: "420px" }}>{renderSubscriptionChart()}</div>
        </div>
      </div>{" "}
      {/* End max-width wrapper */}
    </div>
  );
};

export default Analytics;
