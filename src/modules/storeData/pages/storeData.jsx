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
        // Normalize root: if array, take first item (assuming single store view)
        let p = Array.isArray(fullData) ? fullData[0] : fullData;
        
        for (const key of currentPath) {
            if (p && p[key] !== undefined) {
                p = p[key];
            } else if (p && p.summary && p.summary[key] !== undefined) {
                // Fallback: Check inside 'summary' (e.g. for shortcut paths)
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
            const newPath = currentPath.slice(0, -1).join('.');
            if (newPath) {
                setSearchParams({ path: newPath });
            } else {
                setSearchParams({});
            }
        } else {
            navigate('/store-data');
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

    const isRoot = !currentPathStr;
    const rootItem = isRoot && fullData ? (Array.isArray(fullData) ? fullData[0] : fullData) : null;

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
                    <h1 style={{ fontSize: '2rem', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span 
                            onClick={() => setSearchParams({})} 
                            style={{ cursor: 'pointer', textDecoration: 'none' }}
                            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                        >
                            {storeName}
                        </span>
                        
                        {currentPathStr && currentPathStr.split('.').map((segment, index, arr) => {
                            const segmentPath = arr.slice(0, index + 1).join('.');
                            return (
                                <React.Fragment key={index}>
                                    <span style={{ fontSize: '1rem', color: '#94a3b8', margin: '0 0.5rem' }}>/</span>
                                    <span 
                                        onClick={() => setSearchParams({ path: segmentPath })}
                                        style={{ 
                                            fontSize: '1rem', 
                                            color: '#64748b', 
                                            fontWeight: 'normal', 
                                            cursor: 'pointer' 
                                        }}
                                        onMouseOver={(e) => {
                                            e.target.style.textDecoration = 'underline';
                                            e.target.style.color = '#334155';
                                        }}
                                        onMouseOut={(e) => {
                                            e.target.style.textDecoration = 'none';
                                            e.target.style.color = '#64748b';
                                        }}
                                    >
                                        {segment}
                                    </span>
                                </React.Fragment>
                            );
                        })}
                    </h1>
                </div>
            </div>

            <div className="table-responsive-elite">
                <table className="custom-table">
                    <thead>
                        {isRoot ? (
                            <tr>
                                <th colSpan="2" style={{ textAlign: "left", fontSize: '1.2rem', padding: '1rem' }}>
                                    {storeName}
                                </th>
                            </tr>
                        ) : (
                             <tr>
                                <th style={{ textAlign: "left", width: "40%" }}>{isArrayView ? "Index / ID" : "Field Name"}</th>
                                <th style={{ textAlign: "center" }}>Action / Value</th>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {isRoot && rootItem ? (
                            <>
                                {/* Created At */}
                                <tr>
                                    <td className="font-semibold" style={{ textAlign: "left" }}>Created At</td>
                                    <td className="font-mono-muted" style={{ textAlign: "center" }}>
                                        {formatDate(rootItem.createdAt || rootItem.created_at)}
                                    </td>
                                </tr>
                                {/* Updated At */}
                                <tr>
                                    <td className="font-semibold" style={{ textAlign: "left" }}>Updated At</td>
                                    <td className="font-mono-muted" style={{ textAlign: "center" }}>
                                        {formatDate(rootItem.updatedAt || rootItem.updated_at)}
                                    </td>
                                </tr>
                                {/* Summary Details */}
                                {rootItem.summary && typeof rootItem.summary === 'object' && Object.entries(rootItem.summary).map(([key, val]) => {
                                    const isComplex = val && typeof val === 'object';
                                    return (
                                        <tr key={key}>
                                            <td className="font-semibold" style={{ textAlign: "left" }}>{key}</td>
                                            <td style={{ textAlign: "center" }}>
                                                {isComplex ? (
                                                    <button 
                                                        onClick={() => handleNavigate(key)}
                                                        className="filter-icon-button action-btn-centered"
                                                        style={{ margin: '0 auto' }}
                                                        title="View Details"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>
                                                ) : (
                                                    <span style={{ color: '#64748b', fontFamily: 'monospace' }}>
                                                        {String(val)}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {(!rootItem.summary || Object.keys(rootItem.summary).length === 0) && (
                                     <tr><td colSpan="2" className="empty-state-cell">No summary data available</td></tr>
                                )}
                            </>
                        ) : (
                         /* Existing Logic for sub-paths (Drill Down) */
                         isArrayView ? (
                            currentData.length === 0 ? (
                                <tr><td colSpan="2" className="empty-state-cell">No records found</td></tr>
                            ) : (
                                currentData.map((item, index) => (
                                    <tr key={index}>
                                        <td className="font-semibold" style={{ textAlign: "left" }}>
                                            {item.shopDomain || item.storeName || `Item ${index}`}
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
                        ) : (
                             /* Object View (Drill Down) */
                             Object.keys(currentData || {})
                                .filter((key) => {
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
                                                    className="filter-icon-button action-btn-centered"
                                                    style={{ margin: '0 auto' }}
                                                    title="View Details"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
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
                        )
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StoreData;
