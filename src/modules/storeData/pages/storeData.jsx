import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import storeDataService from '../services/storeData.service';
import { safeParseDate } from '../../../shared/utils/helpers';
import "../../../styles/storeVisits.css";
import DataCard from '../components/DataCard';
import Icons from '../components/Icons';
import { getFriendlyName, getFieldsWhitelist, getPreviewWhitelist, hasPreviewAndFields } from '../utils/storeDataHelpers';

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
            const newPath = currentPath.slice(0, -1).join('.');
            setSearchParams(newPath ? { path: newPath } : {});
        } else {
            navigate('/store-data');
        }
    };

    const formatDate = (dateVal) => {
        if (!dateVal) return "N/A";
        const d = safeParseDate(dateVal);
        return d ? d.toLocaleDateString() + ' ' + d.toLocaleTimeString() : String(dateVal);
    };

    if (loading) return (
        <div className="loading-container">
            <div className="loader"></div>
            <p style={{color: '#64748b', fontWeight: 500}}>Loading Store Data...</p>
        </div>
    );
    
    if (error) return <div className="error-message">{error}</div>;

    const isArrayView = Array.isArray(currentData);
    const isRoot = !currentPathStr;
    const rootItem = isRoot && fullData ? (Array.isArray(fullData) ? fullData[0] : fullData) : null;

    return (
        <div className="premium-container">
            <div className="premium-header">
                <div className="header-top">
                    <button onClick={handleBack} className="back-button" title="Back">
                        <Icons.Back />
                    </button>
                    <h1 className="page-title">{storeName}</h1>
                </div>
                
                <div className="premium-breadcrumbs">
                    <div 
                        className={`breadcrumb-item ${!currentPathStr ? 'active' : ''}`}
                        onClick={() => setSearchParams({})}
                    >
                        Root
                    </div>
                    {currentPathStr && currentPathStr.split('.').map((segment, index, arr) => {
                        const segmentPath = arr.slice(0, index + 1).join('.');
                        const isActive = index === arr.length - 1;
                        return (
                            <React.Fragment key={index}>
                                <span className="breadcrumb-separator"><Icons.ChevronRight /></span>
                                <div 
                                    className={`breadcrumb-item ${isActive ? 'active' : ''}`}
                                    onClick={() => !isActive && setSearchParams({ path: segmentPath })}
                                >
                                    {getFriendlyName(segment)}
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            <div className="premium-content">
                {isRoot && rootItem ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Meta Info Section */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                             <DataCard 
                                label="Created At" 
                                value={formatDate(rootItem.createdAt || rootItem.created_at)} 
                                type="date"
                            />
                             <DataCard 
                                label="Updated At" 
                                value={formatDate(rootItem.updatedAt || rootItem.updated_at)} 
                                type="date"
                            />
                        </div>

                        {/* Summary Section */}
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                            Data Summary
                        </h2>
                        
                        <div className="data-grid">
                            {/* Render Simple Status Cards First */}
                            {rootItem.summary && Object.entries(rootItem.summary)
                                .filter(([_, val]) => !val || typeof val !== 'object')
                                .map(([key, val]) => (
                                    <DataCard
                                        key={key}
                                        label={getFriendlyName(key)}
                                        value={String(val)}
                                        type={typeof val}
                                        isClickable={false}
                                        dataObject={null}
                                        onClick={undefined}
                                        filterKeys={null}
                                    />
                                ))
                            }

                            {/* Render Array Cards (Folders) Second */}
                            {rootItem.summary && Object.entries(rootItem.summary)
                                .filter(([_, val]) => val && Array.isArray(val))
                                .map(([key, val]) => {
                                    // Summary items use the PREVIEW filter
                                    const filter = getPreviewWhitelist([key]);
                                    return (
                                        <DataCard
                                            key={key}
                                            label={getFriendlyName(key)}
                                            value={val}
                                            type="array"
                                            isClickable={true}
                                            dataObject={null} // Arrays pass null unless we want preview, usually handled inside DataCard now
                                            onClick={() => handleNavigate(key)}
                                            filterKeys={filter}
                                        />
                                    );
                                })
                            }

                            {/* Render Object Cards (Detailed Lists) Third */}
                            {rootItem.summary && Object.entries(rootItem.summary)
                                .filter(([_, val]) => val && typeof val === 'object' && !Array.isArray(val))
                                .sort(([keyA, valA], [keyB, valB]) => {
                                    const listA = getPreviewWhitelist([keyA]) || Object.keys(valA);
                                    const listB = getPreviewWhitelist([keyB]) || Object.keys(valB);
                                    return listA.length - listB.length;
                                })
                                .map(([key, val]) => {
                                    // Summary items use the PREVIEW filter
                                    const filter = getPreviewWhitelist([key]);
                                    const showDetails = hasPreviewAndFields([key]);

                                    return (
                                        <DataCard
                                            key={key}
                                            label={getFriendlyName(key)}
                                            value={val}
                                            type="object"
                                            isClickable={true}
                                            dataObject={val}
                                            onClick={() => handleNavigate(key)}
                                            filterKeys={filter}
                                            showDetailsButton={showDetails}
                                        />
                                    );
                                })
                            }

                            {(!rootItem.summary || Object.keys(rootItem.summary).length === 0) && (
                                <div className="empty-state">No summary data available</div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Drill Down View */
                    <div className="data-grid">
                        {isArrayView ? (
                            currentData.length === 0 ? (
                                <div className="empty-state" style={{ gridColumn: '1/-1' }}>No records found</div>
                            ) : (
                                currentData.map((item, index) => {
                                    const isItemObject = item && typeof item === 'object';
                                    
                                    // Try to determine a meaningful label
                                    const formTitleLabel = (item.formTitle && item.formTitle.heading) ? item.formTitle.heading : null;
                                    const rawLabel = formTitleLabel || item.shopDomain || item.storeName || item.title || item.name || item.id || `Item ${index + 1}`;
                                    const label = getFriendlyName(rawLabel);

                                    // Context-aware filter for PREVIEW on the card
                                    let activeFilter = getPreviewWhitelist([...currentPath, index]);
                                    if (!activeFilter || activeFilter.length === 0) {
                                        activeFilter = getPreviewWhitelist(currentPath);
                                    }

                                    return (
                                        <DataCard
                                            key={index}
                                            label={String(label)}
                                            value={isItemObject ? 'Details' : String(item)}
                                            type={isItemObject ? 'object' : typeof item}
                                            isClickable={isItemObject}
                                            dataObject={isItemObject ? item : null}
                                            onClick={() => handleNavigate(index)}
                                            filterKeys={activeFilter}
                                        />
                                    );
                                })
                            )
                        ) : (
                            /* Object View */
                            Object.keys(currentData || {})
                                .filter((key) => {
                                    // Filter Logic: Decide what keys strictly SHOW in this view (Detail View)
                                    // Use 'fields' whitelist here
                                    const currentViewWhitelist = getFieldsWhitelist(currentPath);
                                    
                                    if (currentViewWhitelist && currentViewWhitelist.length > 0) {
                                        return currentViewWhitelist.includes(key);
                                    }

                                    // Default Fallback
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
                                    // For child cards, we want their PREVIEW config
                                    const nextLevelFilter = getPreviewWhitelist([...currentPath, key]);
                                    
                                    return (
                                        <DataCard
                                            key={key}
                                            label={getFriendlyName(key)}
                                            value={isComplex ? val : String(val)}
                                            type={isComplex ? (Array.isArray(val) ? 'array' : 'object') : (typeof val)}
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
