import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import storeDataService from "../services/storeData.service";
import { safeParseDate } from "../../../shared/utils/helpers";
import "../../../styles/storeVisits.css";
import DataCard from "../components/DataCard";
import Icons from "../components/Icons";
import {
  getFriendlyName,
  getFieldsWhitelist,
  getPreviewWhitelist,
  hasPreviewAndFields,
} from "../utils/storeDataHelpers";

const StoreData = () => {
  const { storeName } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [fullData, setFullData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get current path
  const currentPathStr = searchParams.get("path") || "";
  const currentPath = useMemo(
    () => (currentPathStr ? currentPathStr.split(".") : []),
    [currentPathStr]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await storeDataService.getStoreData(storeName);
        setFullData(result);
      } catch (err) {
        console.error("Failed to fetch store data:", err);
        setError("Failed to load store data.");
      } finally {
        setLoading(false);
      }
    };

    if (storeName) {
      fetchData();
    }
  }, [storeName]);

  // Resolve data at current path
  const currentData = useMemo(() => {
    if (!fullData) return null;
    let p = Array.isArray(fullData) ? fullData[0] : fullData;

    for (const key of currentPath) {
      if (p && p[key] !== undefined) {
        p = p[key];
      } else if (p && p.summary && p.summary[key] !== undefined) {
        p = p.summary[key];
      } else {
        return undefined;
      }
    }
    return p;
  }, [fullData, currentPath]);

  const handleNavigate = (key) => {
    const newPath = currentPathStr ? `${currentPathStr}.${key}` : String(key);
    setSearchParams({ path: newPath });
  };

  const handleBack = () => {
    if (currentPath.length > 0) {
      const newPath = currentPath.slice(0, -1).join(".");
      setSearchParams(newPath ? { path: newPath } : {});
    } else {
      navigate("/store-data");
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return "N/A";
    const d = safeParseDate(dateVal);
    return d
      ? d.toLocaleDateString() + " " + d.toLocaleTimeString()
      : String(dateVal);
  };

  if (loading)
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p style={{ color: "#64748b", fontWeight: 500 }}>
          Loading Store Data...
        </p>
      </div>
    );

  if (error) return <div className="error-message">{error}</div>;

  const isArrayView = Array.isArray(currentData);
  const isRoot = !currentPathStr;
  const rootItem =
    isRoot && fullData
      ? Array.isArray(fullData)
        ? fullData[0]
        : fullData
      : null;

  const renderStatusCell = (key, val, type) => {
    // Helper for Eye Icon
    const EyeIcon = () => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="feather feather-eye"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    );

    if (type === "array") {
      return (
        <div
          style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}
        >
          <button
            onClick={() => handleNavigate(key)}
            className="action-icon-btn"
            title="View Details"
          >
            <EyeIcon />
          </button>
        </div>
      );
    }

    if (type === "object") {
      const keys = Object.keys(val || {});
      // Check if 'status' is the only *visible* key based on whitelist
      const visibleKeys = getPreviewWhitelist([key]);
      const isActuallySingleStatus =
        (visibleKeys &&
          visibleKeys.length === 1 &&
          visibleKeys[0] === "status") ||
        (keys.length === 1 && val.status !== undefined);

      if (val.status !== undefined && isActuallySingleStatus) {
        let s = String(val.status);
        const lower = s.toLowerCase();

        if (
          val.status === true ||
          lower === "active" ||
          lower === "enabled" ||
          lower === "yes"
        ) {
          return <span className="status-badge status-success">Active</span>;
        }
        if (
          val.status === false ||
          lower === "inactive" ||
          lower === "disabled" ||
          lower === "no" ||
          lower === "false"
        ) {
          return <span className="status-badge status-error">Inactive</span>;
        }

        return <span className="status-badge status-neutral">{s}</span>;
      }

      return (
        <div
          style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}
        >
          <button
            onClick={() => handleNavigate(key)}
            className="action-icon-btn"
            title="View Details"
          >
            <EyeIcon />
          </button>
        </div>
      );
    }

    if (type === "simple") {
      const strVal = String(val);
      const lower = strVal.toLowerCase();

      if (
        val === true ||
        lower === "active" ||
        lower === "yes" ||
        lower === "enabled" ||
        lower === "connected"
      ) {
        return <span className="status-badge status-success">Active</span>;
      }

      if (
        val === false ||
        lower === "inactive" ||
        lower === "no" ||
        lower === "disabled" ||
        lower === "false"
      ) {
        return <span className="status-badge status-error">Inactive</span>;
      }

      return (
        <span style={{ fontWeight: 600, color: "#334155" }}>{strVal}</span>
      );
    }
  };

  return (
    <div className="page-layout">
      {/* Header Section */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={handleBack} className="back-button" title="Back">
            <Icons.Back />
          </button>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1 className="page-title" style={{ margin: 0, lineHeight: 1.2 }}>
              {storeName}
            </h1>
            <div
              className="premium-breadcrumbs"
              style={{ margin: "0.5rem 0 0", padding: 0 }}
            >
              <div
                className={`breadcrumb-item ${!currentPathStr ? "active" : ""}`}
                onClick={() => setSearchParams({})}
              >
                Root
              </div>
              {currentPathStr &&
                currentPathStr.split(".").map((segment, index, arr) => {
                  const segmentPath = arr.slice(0, index + 1).join(".");
                  const isActive = index === arr.length - 1;
                  return (
                    <React.Fragment key={index}>
                      <span className="breadcrumb-separator">/</span>
                      <div
                        className={`breadcrumb-item ${
                          isActive ? "active" : ""
                        }`}
                        onClick={() =>
                          !isActive && setSearchParams({ path: segmentPath })
                        }
                      >
                        {getFriendlyName(segment)}
                      </div>
                    </React.Fragment>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      <div className="premium-content">
        {isRoot && rootItem ? (
          <div className="modern-table-card">
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: "70%" }}>Features</th>
                  <th style={{ textAlign: "right", width: "30%" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Meta Info Rows */}
                <tr>
                  <td>
                    <div className="feature-name">Registered</div>
                    <div className="feature-sub">Store creation date</div>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>
                    {formatDate(rootItem.createdAt || rootItem.created_at)}
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="feature-name">Last Updated</div>
                    <div className="feature-sub">Most recent activity</div>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>
                    {formatDate(rootItem.updatedAt || rootItem.updated_at)}
                  </td>
                </tr>

                {/* Summary Rows */}
                {!rootItem.summary ||
                Object.keys(rootItem.summary).length === 0 ? (
                  <tr>
                    <td
                      colSpan="2"
                      className="empty-state-cell"
                      style={{ textAlign: "center", padding: "3rem" }}
                    >
                      No summary data available
                    </td>
                  </tr>
                ) : (
                  Object.entries(rootItem.summary).map(([key, val]) => {
                    const type =
                      !val || typeof val !== "object"
                        ? "simple"
                        : Array.isArray(val)
                        ? "array"
                        : "object";

                    return (
                      <tr key={key}>
                        <td>
                          <div className="feature-name">
                            {getFriendlyName(key)}
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              width: "100%",
                            }}
                          >
                            {renderStatusCell(key, val, type)}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Drill Down View (Unchanged Logic, wrapper updated) */
          <div className="data-grid">
            {isArrayView ? (
              currentData.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: "1/-1" }}>
                  No records found
                </div>
              ) : (
                currentData.map((item, index) => {
                  const isItemObject = item && typeof item === "object";
                  const formTitleLabel =
                    item.formTitle && item.formTitle.heading
                      ? item.formTitle.heading
                      : null;
                  const rawLabel =
                    formTitleLabel ||
                    item.shopDomain ||
                    item.storeName ||
                    item.title ||
                    item.name ||
                    item.id ||
                    `Item ${index + 1}`;
                  const label = getFriendlyName(rawLabel);
                  let activeFilter = getPreviewWhitelist([
                    ...currentPath,
                    index,
                  ]);
                  if (!activeFilter || activeFilter.length === 0) {
                    activeFilter = getPreviewWhitelist(currentPath);
                  }

                  return (
                    <DataCard
                      key={index}
                      label={String(label)}
                      value={isItemObject ? "Details" : String(item)}
                      type={isItemObject ? "object" : typeof item}
                      isClickable={isItemObject}
                      dataObject={isItemObject ? item : null}
                      onClick={() => handleNavigate(index)}
                      filterKeys={activeFilter}
                    />
                  );
                })
              )
            ) : (
              Object.keys(currentData || {})
                .filter((key) => {
                  const currentViewWhitelist = getFieldsWhitelist(currentPath);
                  if (currentViewWhitelist && currentViewWhitelist.length > 0) {
                    return currentViewWhitelist.includes(key);
                  }
                  const pathStr = currentPathStr
                    ? currentPathStr.toLowerCase()
                    : "";
                  const isAnalyticsOrFilter =
                    pathStr.includes("analytics") || pathStr.includes("filter");
                  if (isAnalyticsOrFilter) {
                    const val = currentData[key];
                    if (val === 0 || val === "0") return false;
                  }
                  return true;
                })
                .map((key) => {
                  const val = currentData[key];
                  const isComplex = val && typeof val === "object";
                  const nextLevelFilter = getPreviewWhitelist([
                    ...currentPath,
                    key,
                  ]);

                  return (
                    <DataCard
                      key={key}
                      label={getFriendlyName(key)}
                      value={isComplex ? val : String(val)}
                      type={
                        isComplex
                          ? Array.isArray(val)
                            ? "array"
                            : "object"
                          : typeof val
                      }
                      isClickable={isComplex}
                      dataObject={isComplex && !Array.isArray(val) ? val : null}
                      onClick={() => handleNavigate(key)}
                      filterKeys={nextLevelFilter}
                    />
                  );
                })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreData;
