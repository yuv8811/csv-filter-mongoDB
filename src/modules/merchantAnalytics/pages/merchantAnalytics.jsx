import React, { useEffect, useState } from "react";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";
import { useNavigate } from "react-router-dom";
import merchantAnalyticsService from "../services/merchantAnalytics.service";
import "../../../styles/storeVisits.css";
import cardNames from "../../storeData/config/cardNames.json";
import filteredData from "../../storeData/config/filteredData.json";

const extractPrimitive = (val) => {
  if (val === null || val === undefined) return val;

  if (
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean"
  ) {
    return val;
  }

  if (typeof val === "object") {
    const priorityKeys = [
      "status",
      "active",
      "enabled",
      "connected",
      "completed",
      "value",
      "isActive",
      "isEnabled",
      "isConnected",
      "plan",
    ];

    for (const key of priorityKeys) {
      if (val[key] !== undefined) {
        return extractPrimitive(val[key]);
      }
    }

    const firstPrimitive = Object.values(val).find(
      (v) =>
        typeof v === "string" ||
        typeof v === "boolean" ||
        typeof v === "number",
    );

    return extractPrimitive(firstPrimitive);
  }

  return val;
};

const safeGet = (item, key) => {
  if (item?.summary?.[key] !== undefined) return item.summary[key];
  if (item?.[key] !== undefined) return item[key];
  return undefined;
};

const normalizeStatus = (raw) => {
  const val = extractPrimitive(raw);

  if (val === undefined || val === null) return "Unknown";
  if (val === false) return "Inactive";
  if (val === true) return "Active";

  const s = String(val).trim().toLowerCase();

  if (
    s === "true" ||
    s === "1" ||
    s === "yes" ||
    s === "active" ||
    s === "enabled" ||
    s === "connected" ||
    s === "completed"
  )
    return "Active";

  if (
    s === "false" ||
    s === "0" ||
    s === "no" ||
    s === "inactive" ||
    s === "disabled"
  )
    return "Inactive";

  return String(val).trim();
};

const formatPieData = (counts, colors) =>
  Object.keys(counts)
    .filter((k) => counts[k] > 0)
    .map((k) => ({
      id: k,
      label: k,
      value: counts[k],
      color: colors[k] || "#94a3b8",
    }))
    .sort((a, b) => {
      if (a.id === "Active") return -1;
      if (b.id === "Active") return 1;
      if (a.id === "Inactive") return 1;
      if (b.id === "Inactive") return -1;
      return 0;
    });

const formatBarData = (counts) => {
  return Object.keys(counts)
    .map((k) => {
      const val = counts[k];
      if (typeof val === "object") {
        return {
          id: k,
          Active: val.Active || 0,
          Inactive: val.Inactive || 0,
        };
      }
      return {
        id: k,
        value: val,
      };
    })
    .filter((d) => {
      const val = d.value !== undefined ? d.value : d.Active + d.Inactive;
      return val > 0;
    })
    .sort((a, b) => {
      const valA = a.Active !== undefined ? a.Active : a.value;
      const valB = b.Active !== undefined ? b.Active : b.value;
      if (valA === valB) {
        return String(a.id).localeCompare(String(b.id));
      }
      return valA - valB;
    });
};

/* ======================= BarChartCard ======================= */
const BarChartCard = ({
  title,
  data,
  keys = ["value"], // Keep prop signature
  colors = ["#6366f1"], // Keep prop signature
  navigate,
  featureKey,
  style,
}) => {
  const handleRedirect = (label, status) => {
    if (navigate && featureKey) {
      navigate(
        `/store-visits?feature=${encodeURIComponent(
          featureKey,
        )}&label=${encodeURIComponent(label)}&status=${encodeURIComponent(
          status,
        )}`,
      );
    }
  };

  const hasActiveInactive =
    data.length > 0 &&
    (data[0].Active !== undefined || data[0].Inactive !== undefined);

  return (
    <div
      className="modern-table-card"
      style={{
        transition: "all 0.3s ease",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#fff",
        borderRadius: "16px",
        ...style,
      }}
    >
      <div
        style={{
          padding: "1.5rem 1.75rem 1rem",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "1rem",
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </h2>
      </div>

      <div
        style={{
          padding: "1rem 1.75rem",
          overflowY: "auto",
          maxHeight: "400px",
          flex: 1,
        }}
      >
        {data.length ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            {/* Header Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: "0.75rem",
                marginBottom: "0.5rem",
                borderBottom: "2px solid #f1f5f9",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Label
              </span>
              <div style={{ display: "flex", gap: "1.5rem" }}>
                {hasActiveInactive ? (
                  <>
                    <span
                      style={{
                        width: "60px",
                        textAlign: "right",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Active
                    </span>
                    <span
                      style={{
                        width: "60px",
                        textAlign: "right",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Inactive
                    </span>
                  </>
                ) : (
                  <span
                    style={{
                      width: "60px",
                      textAlign: "right",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Count
                  </span>
                )}
              </div>
            </div>

            {/* Data Rows */}
            {data.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #f8fafc",
                }}
              >
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#334155",
                    maxWidth: "50%",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={item.id}
                >
                  {item.id}
                </span>

                <div style={{ display: "flex", gap: "1.5rem" }}>
                  {hasActiveInactive ? (
                    <>
                      <span
                        onClick={() => handleRedirect(item.id, "Active")}
                        style={{
                          width: "60px",
                          textAlign: "right",
                          fontSize: "0.95rem",
                          fontWeight: 700,
                          color: "#10b981",
                          cursor: "pointer",
                        }}
                      >
                        {(item.Active || 0) > 0 ? "+" : ""}
                        {item.Active || 0}
                      </span>
                      <span
                        onClick={() => handleRedirect(item.id, "Inactive")}
                        style={{
                          width: "60px",
                          textAlign: "right",
                          fontSize: "0.95rem",
                          fontWeight: 700,
                          color: "#ef4444",
                          cursor: "pointer",
                        }}
                      >
                        {(item.Inactive || 0) > 0 ? "-" : ""}
                        {item.Inactive || 0}
                      </span>
                    </>
                  ) : (
                    <span
                      style={{
                        width: "60px",
                        textAlign: "right",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: "#3b82f6",
                      }}
                    >
                      {item.value || 0}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="empty-state"
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "#94a3b8",
              fontStyle: "italic",
            }}
          >
            No data available
          </div>
        )}
      </div>
    </div>
  );
};

/* ======================= ChartCard ======================= */
const ChartCard = ({ title, data, navigate, featureKey }) => {
  const CenteredMetric = ({ dataWithArc, centerX, centerY }) => {
    const total = dataWithArc.reduce((s, d) => s + d.value, 0);
    const active = dataWithArc.find((d) => d.id === "Active")?.value || 0;
    const showPercentage = dataWithArc.length <= 3;
    const percentage = total ? Math.round((active / total) * 100) : 0;

    return (
      <g>
        <text
          x={centerX}
          y={centerY - 10}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontSize: 32,
            fontWeight: 800,
            fill: "#1e293b",
            fontFamily: '"Inter", sans-serif',
          }}
        >
          {showPercentage ? `${percentage}%` : total}
        </text>
        <text
          x={centerX}
          y={centerY + 18}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontSize: 11,
            fontWeight: 600,
            fill: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontFamily: '"Inter", sans-serif',
          }}
        >
          {showPercentage ? "Engagement" : "Total Count"}
        </text>
      </g>
    );
  };

  const CustomPieTooltip = ({ datum }) => {
    return (
      <div
        style={{
          background: "#ffffff",
          padding: "12px 16px",
          borderRadius: "8px",
          color: "#1e293b",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          border: "1px solid #e2e8f0",
          fontFamily: '"Inter", sans-serif',
          minWidth: "120px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
          }}
        >
          <span
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: datum.color,
              borderRadius: "4px",
            }}
          />
          <span style={{ color: "#64748b" }}>{datum.id}:</span>
          <strong style={{ color: "#1e293b", marginLeft: "auto" }}>
            {datum.value}
          </strong>
        </div>
      </div>
    );
  };

  return (
    <div
      className="modern-table-card"
      style={{
        transition: "all 0.3s ease",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
      }}
    >
      <div style={{ padding: "1.5rem 1.75rem 0.5rem" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </h2>
      </div>

      <div style={{ height: "300px", padding: "1rem" }}>
        {data.length ? (
          <ResponsivePie
            data={data}
            onClick={(node) => {
              if (navigate && featureKey) {
                navigate(
                  `/store-visits?feature=${encodeURIComponent(
                    featureKey,
                  )}&label=Status&status=${encodeURIComponent(node.id)}`,
                );
              }
            }}
            colors={{ datum: "data.color" }}
            margin={{ top: 20, right: 20, bottom: 60, left: 20 }}
            startAngle={90}
            endAngle={-270}
            innerRadius={0.75}
            padAngle={3}
            cornerRadius={8}
            activeOuterRadiusOffset={4}
            enableArcLinkLabels={false}
            enableArcLabels={false}
            layers={["arcs", CenteredMetric, "legends"]}
            tooltip={CustomPieTooltip}
            legends={[
              {
                anchor: "bottom",
                direction: "row",
                translateY: 40,
                itemWidth: 80,
                itemHeight: 18,
                symbolSize: 8,
                symbolShape: "circle",
                itemTextColor: "#64748b",
                itemDirection: "left-to-right",
              },
            ]}
          />
        ) : (
          <div className="empty-state">No data available</div>
        )}
      </div>
    </div>
  );
};

/* ======================= Main ======================= */

const MerchantAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total: 0,
    activeRate: 0,
    onboardingRate: 0,
  });

  const [charts, setCharts] = useState({
    appStatus: [],
    onboarding: [],
    pricing: [],
    klaviyo: [],
    mailchimp: [],
    omnisend: [],
    standardTabs: [],
    programs: [],
    profileFields: [],
    registerFields: [],
    advancedTabs: [],
    advancedSettings: [],
    forms: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await merchantAnalyticsService.getAllStoreStatus();
        const totalStores = result.length;

        let activeStores = 0;
        let onboardingComplete = 0;

        const counts = {
          appStatus: {},
          onboarding: {},
          pricing: {},
          klaviyo: {},
          mailchimp: {},
          omnisend: {},
          standardTabs: {},
          programs: {},
          profileFields: {},
          registerFields: {},
          advancedTabs: {},
          advancedSettings: {},
          forms: {},
        };

        const inc = (bucket, raw) => {
          const key = normalizeStatus(raw);
          bucket[key] = (bucket[key] || 0) + 1;
        };

        const incSummary = (item) => {
          const status = normalizeStatus(
            safeGet(item, "appStatusStandardAccount"),
          );
          if (status === "Active") activeStores++;

          const onboard = normalizeStatus(safeGet(item, "onboardingCompleted"));
          if (onboard === "Active") onboardingComplete++;
        };

        // Helper to aggregate arrays of objects/statuses
        const aggList = (bucket, list, filterKeys) => {
          if (!list) return;

          // Handle Arrays
          if (Array.isArray(list)) {
            list.forEach((item) => {
              if (!item || typeof item !== "object") return;
              let rawLabel = item.label || item.name || item.id || "Unknown";
              if (item?.formTitle?.heading) {
                rawLabel = item.formTitle.heading;
              }
              const label = cardNames[rawLabel] || rawLabel;

              let finalStatus = "Inactive";
              if (
                item.status === true ||
                item.status === "true" ||
                item.status === "Active" ||
                item.status === "1"
              ) {
                finalStatus = "Active";
              } else if (
                item.status === false ||
                item.status === "false" ||
                item.status === "Inactive" ||
                item.status === "0"
              ) {
                finalStatus = "Inactive";
              } else {
                let raw = item.status;
                if (raw === undefined) raw = item.active;
                if (raw === undefined) raw = item.enabled;
                if (raw === undefined) raw = item.formStatus;
                finalStatus = normalizeStatus(raw);
              }

              if (!bucket[label]) bucket[label] = { Active: 0, Inactive: 0 };
              if (finalStatus === "Active") bucket[label].Active++;
              else bucket[label].Inactive++;
            });
            return;
          }

          // Handle Objects
          if (typeof list === "object") {
            Object.entries(list).forEach(([key, val]) => {
              if (key === "_id") return;
              if (filterKeys && !filterKeys.includes(key)) return;

              let rawLabel = key;
              let rawStatus = val;
              if (val && typeof val === "object") {
                if (val.label) rawLabel = val.label;
                if (val?.formTitle?.heading) rawLabel = val.formTitle.heading;
                if (val.status !== undefined) rawStatus = val.status;
                else if (val.active !== undefined) rawStatus = val.active;
                else if (val.enabled !== undefined) rawStatus = val.enabled;
              }
              const label = cardNames[rawLabel] || rawLabel;

              const status = normalizeStatus(rawStatus);
              if (
                status === "Unknown" &&
                typeof val === "object" &&
                !val.status &&
                !val.active &&
                !val.enabled
              )
                return;

              if (!bucket[label]) bucket[label] = { Active: 0, Inactive: 0 };
              if (status === "Active") bucket[label].Active++;
              else bucket[label].Inactive++;
            });
          }
        };

        // Special handler for profile fields
        const aggProfileFields = (bucket, list) => {
          if (!Array.isArray(list)) return;
          list.forEach((f) => {
            if (f && (f.label || f.name)) {
              const label = (f.label || f.name)
                .trim()
                .replace(/\w\S*/g, (w) =>
                  w.replace(/^\w/, (c) => c.toUpperCase()),
                );

              let raw = f.status;
              if (raw === undefined) raw = f.active;
              if (raw === undefined) raw = f.enabled;

              const status =
                raw !== undefined ? normalizeStatus(raw) : "Active";

              if (!bucket[label]) bucket[label] = { Active: 0, Inactive: 0 };
              if (status === "Active") bucket[label].Active++;
              else bucket[label].Inactive++;
            }
          });
        };

        const getFilter = (key) => {
          const fields = filteredData[key]?.fields;
          if (Array.isArray(fields) && fields.length > 0) {
            let valid = fields.filter((f) => f !== "status");
            if (key === "advancedAccountSettings") {
              valid = valid.filter((f) => f !== "newCustomerAccountDashboard");
            }
            return valid.length > 0 ? valid : undefined;
          }
          return undefined;
        };

        result.forEach((item) => {
          incSummary(item);
          inc(counts.appStatus, safeGet(item, "appStatusStandardAccount"));
          inc(counts.onboarding, safeGet(item, "onboardingCompleted"));
          inc(counts.klaviyo, safeGet(item, "klaviyoIntegration"));
          inc(counts.mailchimp, safeGet(item, "mailchimpIntegration"));
          inc(counts.omnisend, safeGet(item, "omnisendIntegration"));
          inc(counts.pricing, safeGet(item, "newShopifyPricing"));

          aggList(
            counts.standardTabs,
            safeGet(item, "standardAccountTabsMenu"),
            getFilter("standardAccountTabsMenu"),
          );
          aggList(
            counts.programs,
            safeGet(item, "flowProgramsCount"),
            getFilter("flowProgramsCount"),
          );
          aggProfileFields(
            counts.profileFields,
            safeGet(item, "newCustomerAccountProfileFields"),
          );

          aggProfileFields(
            counts.registerFields,
            safeGet(item, "registerAccountFields"),
          );
          aggList(
            counts.advancedTabs,
            safeGet(item, "advancedAccountTabsMenu"),
            getFilter("advancedAccountTabsMenu"),
          );
          aggList(
            counts.advancedSettings,
            safeGet(item, "advancedAccountSettings"),
            getFilter("advancedAccountSettings"),
          );
          aggList(
            counts.forms,
            safeGet(item, "formBuilder"),
            getFilter("formBuilder"),
          );
        });

        setSummary({
          total: totalStores,
          activeRate: totalStores
            ? Math.round((activeStores / totalStores) * 100)
            : 0,
          onboardingRate: totalStores
            ? Math.round((onboardingComplete / totalStores) * 100)
            : 0,
        });

        const BOOL_COLORS = {
          Active: "#10b981",
          Inactive: "#ef4444",
          Unknown: "#e2e8f0",
        };
        const pricingColors = { ...BOOL_COLORS };
        const extra = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899"];
        let i = 0;
        Object.keys(counts.pricing).forEach((k) => {
          if (!pricingColors[k]) pricingColors[k] = extra[i++ % extra.length];
        });

        setCharts({
          appStatus: formatPieData(counts.appStatus, BOOL_COLORS),
          onboarding: formatPieData(counts.onboarding, BOOL_COLORS),
          klaviyo: formatPieData(counts.klaviyo, BOOL_COLORS),
          mailchimp: formatPieData(counts.mailchimp, BOOL_COLORS),
          omnisend: formatPieData(counts.omnisend, BOOL_COLORS),
          pricing: formatPieData(counts.pricing, pricingColors),
          standardTabs: formatBarData(counts.standardTabs),
          programs: formatBarData(counts.programs),
          profileFields: formatBarData(counts.profileFields),
          registerFields: formatBarData(counts.registerFields),
          advancedTabs: formatBarData(counts.advancedTabs),
          advancedSettings: formatBarData(counts.advancedSettings),
          forms: formatBarData(counts.forms),
        });
      } catch (e) {
        console.error("Analytics failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const featureList = [
    {
      title: cardNames.standardAccountTabsMenu,
      data: charts.standardTabs,
      key: "standardAccountTabsMenu",
    },
    {
      title: "Active Programs Count",
      data: charts.programs,
      key: "flowProgramsCount",
    },
    {
      title: cardNames.newCustomerAccountProfileFields,
      data: charts.profileFields,
      key: "newCustomerAccountProfileFields",
    },
    {
      title: cardNames.registerAccountFields,
      data: charts.registerFields,
      key: "registerAccountFields",
    },
    {
      title: cardNames.advancedAccountTabsMenu,
      data: charts.advancedTabs,
      key: "advancedAccountTabsMenu",
    },
    {
      title: cardNames.advancedAccountSettings,
      data: charts.advancedSettings,
      key: "advancedAccountSettings",
    },
    { title: cardNames.formBuilder, data: charts.forms, key: "formBuilder" },
  ].sort((a, b) => a.data.length - b.data.length);

  return (
    <div className="page-layout premium-container">
      <div className="page-header" style={{ marginBottom: "3rem" }}>
        <button
          onClick={() => navigate(-1)}
          className="back-button"
          style={{ marginBottom: "1rem" }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div>
          <h1
            className="page-title"
            style={{ fontSize: "2.5rem", letterSpacing: "-0.03em" }}
          >
            Merchant Analytics
          </h1>
          <p style={{ fontSize: "1.1rem", color: "#64748b" }}>
            Real-time overview of application performance and adoption.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loader" />
          <p>Loading analytics…</p>
        </div>
      ) : (
        <div className="premium-content">
          <section style={{ marginBottom: "5rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "2rem",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: "#dbeafe",
                  color: "#2563eb",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem",
                }}
              >
                📊
              </div>
              <div>
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  Platform Overview
                </h2>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                  Distribution of statuses and integrations.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "2rem",
              }}
            >
              <ChartCard
                title={cardNames.appStatusStandardAccount}
                data={charts.appStatus}
                navigate={navigate}
                featureKey="appStatusStandardAccount"
              />
              <ChartCard
                title={cardNames.onboardingCompleted}
                data={charts.onboarding}
                navigate={navigate}
                featureKey="onboardingCompleted"
              />
              <ChartCard
                title={cardNames.newShopifyPricing}
                data={charts.pricing}
                navigate={navigate}
                featureKey="newShopifyPricing"
              />
              <ChartCard
                title={cardNames.klaviyoIntegration}
                data={charts.klaviyo}
                navigate={navigate}
                featureKey="klaviyoIntegration"
              />
              <ChartCard
                title={cardNames.mailchimpIntegration}
                data={charts.mailchimp}
                navigate={navigate}
                featureKey="mailchimpIntegration"
              />
              <ChartCard
                title={cardNames.omnisendIntegration}
                data={charts.omnisend}
                navigate={navigate}
                featureKey="omnisendIntegration"
              />
            </div>
          </section>

          <section>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "2rem",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: "#dcfce7",
                  color: "#16a34a",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem",
                }}
              >
                📈
              </div>
              <div>
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  Feature Adoption
                </h2>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                  Usage breakdown of specific features.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
                gap: "2rem",
              }}
            >
              {featureList.map((item, idx) => (
                <BarChartCard
                  key={idx}
                  title={item.title}
                  data={item.data}
                  navigate={navigate}
                  featureKey={item.key}
                  keys={["Active", "Inactive"]}
                  colors={["#10b981", "#ef4444"]}
                  style={
                    item.key === "advancedAccountSettings"
                      ? { gridColumn: "1 / -1" }
                      : undefined
                  }
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default MerchantAnalytics;
