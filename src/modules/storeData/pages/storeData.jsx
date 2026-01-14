import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import storeDataService from '../services/storeData.service';
import { safeParseDate } from '../../../shared/utils/helpers';
import "../../../styles/storeVisits.css"; // Ensure styles are available

const StoreData = () => {
    const { storeName } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [fullData, setFullData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get current path
    const currentPathStr = searchParams.get("path") || "";
    const currentPath = useMemo(() => currentPathStr ? currentPathStr.split('.') : [], [currentPathStr]);

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
        let p = fullData;
        for (const key of currentPath) {
            if (p && p[key] !== undefined) {
                p = p[key];
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
            const newPath = currentPath.slice(0, -1).join('.');
            if (newPath) {
                setSearchParams({ path: newPath });
            } else {
                setSearchParams({});
            }
        } else {
            navigate(-1);
        }
    };

    const formatDate = (dateVal) => {
        if (!dateVal) return "N/A";
        const d = safeParseDate(dateVal);
        return d ? d.toLocaleDateString() + ' ' + d.toLocaleTimeString() : String(dateVal);
    };

    if (loading) return <div className="loading-container"><div className="loader"></div><p>Loading Store Data...</p></div>;
    if (error) return <div className="error-message">{error}</div>;

    const isArrayView = Array.isArray(currentData);
    const isObjectView = currentData && typeof currentData === 'object' && !isArrayView;

    return (
        <div className="repository-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="data-header" style={{ marginBottom: '1.5rem', display: 'block' }}>
                 <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <button 
                        onClick={handleBack}
                        className="filter-icon-button"
                        style={{ marginRight: '1rem' }}
                        title="Back"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>
                    <h1 style={{ fontSize: '2rem', color: '#1e293b', margin: 0 }}>
                        {storeName} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 'normal' }}>{currentPathStr ? `/ ${currentPathStr.split('.').join(' / ')}` : ''}</span>
                    </h1>
                </div>
            </div>

            <div className="table-responsive-elite">
                <table className="custom-table">
                    <thead>
                        {isArrayView ? (
                            <tr>
                                <th style={{ textAlign: "left" }}>Store Name</th>
                                <th style={{ textAlign: "left" }}>Created At</th>
                                <th style={{ textAlign: "left" }}>Updated At</th>
                                <th style={{ textAlign: "center" }}>Actions</th>
                            </tr>
                        ) : (
                             <tr>
                                <th style={{ textAlign: "left", width: "40%" }}>Field Name</th>
                                <th style={{ textAlign: "center" }}>Action / Value</th>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {isArrayView ? (
                            currentData.length === 0 ? (
                                <tr><td colSpan="4" className="empty-state-cell">No records found</td></tr>
                            ) : (
                                currentData.map((item, index) => (
                                    <tr key={index}>
                                        {/* Store Name: Use the param storeName, or item.storeName if exists */}
                                        <td className="font-semibold" style={{ textAlign: "left" }}>
                                            {item.shopDomain || item.storeName || storeName}
                                        </td>
                                        <td className="font-mono-muted" style={{ textAlign: "left" }}>
                                            {formatDate(item.createdAt || item.created_at)}
                                        </td>
                                        <td className="font-mono-muted" style={{ textAlign: "left" }}>
                                            {formatDate(item.updatedAt || item.updated_at)}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            <button 
                                                type="button" 
                                                className="filter-icon-button action-btn-centered" 
                                                onClick={() => handleNavigate(index)}
                                                title="View Details"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )
                        ) : isObjectView ? (
                            Object.keys(currentData)
                                .filter((key) => {
                                    // User request: "in analytics and filter show real counts only"
                                    // Filter out 0 values if we are inside an analytics or filter context
                                    const pathStr = currentPathStr ? currentPathStr.toLowerCase() : "";
                                    const isAnalyticsOrFilter = pathStr.includes("analytics") || pathStr.includes("filter");

                                    if (isAnalyticsOrFilter) {
                                        const val = currentData[key];
                                        if (val === 0 || val === "0") return false;
                                    }
                                    return true;
                                })
                                .map((key) => {
                                    const val = currentData[key];
                                    const isComplex = (val && typeof val === 'object');
                                    return (
                                        <tr key={key}>
                                        <td className="font-semibold" style={{ textAlign: "left" }}>{key}</td>
                                        <td style={{ textAlign: "center" }}>
                                            {isComplex ? (
                                                <button 
                                                    onClick={() => handleNavigate(key)}
                                                    className="event-badge status-installed" /* reusing badge style for buttons looks decent, or generic button */
                                                    style={{ cursor: 'pointer', border: 'none', fontSize: '12px' }}
                                                >
                                                    View Details
                                                </button>
                                            ) : (
                                                <span style={{ color: '#64748b', fontFamily: 'monospace' }}>
                                                    {String(val)}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                             <tr>
                                <td colSpan="2" className="empty-state-cell">
                                    {String(currentData)}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StoreData;
