import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import "../../../styles/App.css";
import "../../../styles/sidepanel.css";
import "../../../styles/storeVisits.css";
import storeVisitService from "../services/storeVisits.service";
import { normalizeDomain } from "../../../shared/utils/helpers";
import filteredData from "../../storeData/config/filteredData.json";
import merchantAnalyticsService from "../../merchantAnalytics/services/merchantAnalytics.service";
import cardNames from "../../storeData/config/cardNames.json";

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

const checkFilter = (item, feature, label, status) => {
  if (!feature || !label || !status) return true;
  const val = safeGet(item, feature);
  if (val === undefined || val === null) return false;

  const isMatch = (s) =>
    status === "Inactive" ? s !== "Active" : s === status;

  // Primitives
  if (
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean"
  ) {
    return isMatch(normalizeStatus(val));
  }

  // Handle generic "Status" label for objects (e.g. { status: true })
  if (
    label === "Status" &&
    typeof val === "object" &&
    !Array.isArray(val) &&
    val !== null
  ) {
    // Check filteredData first
    const config = filteredData[feature];
    if (config?.fields && Array.isArray(config.fields)) {
      for (const field of config.fields) {
        if (val[field] !== undefined) {
          if (isMatch(normalizeStatus(val[field]))) return true;
        }
      }
    }

    // Fallback heuristics
    let raw = val.status;
    if (raw === undefined) raw = val.active;
    if (raw === undefined) raw = val.enabled;
    if (raw === undefined) raw = val.connected;
    if (raw !== undefined) {
      return isMatch(normalizeStatus(raw));
    }
  }

  // Profile/Register Fields
  if (
    feature === "newCustomerAccountProfileFields" ||
    feature === "registerAccountFields"
  ) {
    if (!Array.isArray(val)) return false;
    return val.some((f) => {
      const fLabel = (f.label || f.name || "")
        .trim()
        .replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()));
      if (fLabel !== label) return false;
      let raw = f.status;
      if (raw === undefined) raw = f.active;
      if (raw === undefined) raw = f.enabled;
      const s = raw !== undefined ? normalizeStatus(raw) : "Active";
      return isMatch(s);
    });
  }

  // Arrays
  if (Array.isArray(val)) {
    return val.some((sub) => {
      if (!sub || typeof sub !== "object") return false;
      let l = sub.label || sub.name || sub.id || "Unknown";
      if (sub?.formTitle?.heading) l = sub.formTitle.heading;
      if (l !== label) return false;

      let finalStatus = "Inactive";
      if (
        sub.status === true ||
        sub.status === "true" ||
        sub.status === "Active" ||
        sub.status === "1"
      ) {
        finalStatus = "Active";
      } else if (
        sub.status === false ||
        sub.status === "false" ||
        sub.status === "Inactive" ||
        sub.status === "0"
      ) {
        finalStatus = "Inactive";
      } else {
        let raw = sub.status;
        if (raw === undefined) raw = sub.active;
        if (raw === undefined) raw = sub.enabled;
        if (raw === undefined) raw = sub.formStatus;
        finalStatus = normalizeStatus(raw);
      }
      return isMatch(finalStatus);
    });
  }

  // Objects
  if (typeof val === "object") {
    return Object.entries(val).some(([k, v]) => {
      if (k === "_id") return false;
      let l = k;
      let rawStatus = v;
      if (v && typeof v === "object") {
        if (v.label) l = v.label;
        if (v?.formTitle?.heading) l = v.formTitle.heading;
        if (v.status !== undefined) rawStatus = v.status;
        else if (v.active !== undefined) rawStatus = val.active;
        else if (v.enabled !== undefined) rawStatus = v.enabled;
      }

      const match = l === label || cardNames[l] === label;
      if (!match) return false;

      const s = normalizeStatus(rawStatus);
      return isMatch(s);
    });
  }

  return false;
};

const StoreVisit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [visits, statuses] = await Promise.all([
          storeVisitService.getStoreVisits(controller.signal),
          merchantAnalyticsService.getAllStoreStatus(),
        ]);

        const statusMap = new Map();
        if (Array.isArray(statuses)) {
          statuses.forEach((s) => {
            if (s.storeName) statusMap.set(s.storeName, s);
          });
        }

        const visitsArray = Array.isArray(visits) ? visits : [];
        const merged = visitsArray.map((v) => {
          const s = statusMap.get(v.shopDomain);
          return s ? { ...v, ...s, summary: s.summary } : v;
        });

        setData(merged);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Store visit fetch failed:", err);
          setError(err.message || "Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, []);

  const filterFeature = searchParams.get("feature");
  const filterLabel = searchParams.get("label");
  const filterStatus = searchParams.get("status");

  const filteredData = useMemo(() => {
    if (!filterFeature || !filterLabel || !filterStatus) return data;
    return data.filter((item) =>
      checkFilter(item, filterFeature, filterLabel, filterStatus),
    );
  }, [data, filterFeature, filterLabel, filterStatus]);

  const onViewDetail = (item) => {
    navigate(`/store-data/${encodeURIComponent(item.shopDomain)}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader" />
        <p>Loading Analytics...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="repository-container">
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            onClick={() => navigate("/")}
            className="filter-icon-button"
            style={{ marginRight: "1rem" }}
            title="Back to Dashboard"
          >
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
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div>
            <h1 style={{ margin: 0 }}>Analytics</h1>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
              Total Stores: <strong>{filteredData.length}</strong>
            </p>
          </div>
        </div>
        <button
          className="filter-icon-button"
          title="Merchant Analytics"
          onClick={() => navigate("/merchant-analytics")}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </button>
      </div>

      {filterFeature && filterLabel && filterStatus && (
        <div
          style={{
            marginBottom: "1rem",
            color: "#0f172a",
            fontSize: "0.9rem",
            padding: "0.5rem",
            background: "#f1f5f9",
            borderRadius: "6px",
            display: "inline-block",
          }}
        >
          Filtered by <strong>{filterFeature}</strong>: {filterLabel} —{" "}
          <span
            style={{
              color: filterStatus === "Active" ? "#10b981" : "#ef4444",
              fontWeight: 700,
            }}
          >
            {filterStatus}
          </span>
          <button
            onClick={() => navigate(".")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              marginLeft: "0.5rem",
              padding: "2px",
              verticalAlign: "middle",
              color: "#64748b",
            }}
            title="Clear filters"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      <div className="table-responsive-elite">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Shop Domain</th>
              <th style={{ textAlign: "center" }}>Customer Visits</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="3" className="empty-state-cell">
                  No records found
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.shopDomain}>
                  <td className="font-semibold" style={{ textAlign: "left" }}>
                    <div className="domain-wrapper">
                      {normalizeDomain(item.shopDomain)}
                    </div>
                  </td>
                  <td
                    className="font-mono-muted font-bold"
                    style={{ textAlign: "center" }}
                  >
                    {item.totalCount ?? 0}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      className="filter-icon-button"
                      style={{ margin: "0 auto" }}
                      onClick={() => onViewDetail(item)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreVisit;
