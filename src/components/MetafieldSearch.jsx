import { useState, useMemo, useRef, useEffect } from 'react';
import '../metafield-styles.css';

const MetafieldSearch = () => {
    const [shopDomain, setShopDomain] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [metafields, setMetafields] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [shopInfo, setShopInfo] = useState(null);

    const [expandedRows, setExpandedRows] = useState(new Set());
    const searchRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false);
                setError(null);
                setShopDomain('');
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [searchRef]);

    const fetchMetafields = async () => {
        if (!shopDomain) return;
        setLoading(true);
        setError(null);
        setMetafields([]);
        setShopInfo(null);

        try {
            const response = await fetch(`http://localhost:3000/shopify/metafields?shop=${shopDomain}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server responded with ${response.status}`);
            }
            const data = await response.json();
            if (data.errors) {
                setError(data.errors.map(e => e.message).join(', '));
            } else if (data.data?.shop) {
                setShopInfo({
                    name: data.data.shop.name,
                    email: data.data.shop.email,
                    domain: data.data.shop.myshopifyDomain,
                    plan: data.data.shop.plan?.displayName
                });
                setMetafields(data.data.shop.metafields.edges.map(edge => edge.node));
            } else {
                setError('No data found for this shop domain.');
            }
        } catch (err) {
            setError(err.message === 'Failed to fetch' ? 'Connection failed. Check server.' : err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const toggleRow = (id) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const filtered = metafields.filter(mf => mf.namespace === "customer_dashboard");

    const MetafieldValue = ({ mf }) => {
        const isExpanded = expandedRows.has(mf.id);
        const displayValue = useMemo(() => {
            try {
                if (mf.value.trim().startsWith('{') || mf.value.trim().startsWith('[')) {
                    return JSON.stringify(JSON.parse(mf.value), null, 2);
                }
            } catch (e) { }
            return mf.value;
        }, [mf.value]);

        const isLong = displayValue.length > 200 || displayValue.split('\n').length > 4;

        return (
            <div className="json-container">
                <pre className={`json-content ${isExpanded ? 'expanded' : ''}`}>
                    {displayValue}
                </pre>
                {!isExpanded && isLong && <div className="json-fade-overlay" />}

                <div className="json-actions">
                    {isLong && (
                        <button onClick={() => toggleRow(mf.id)} className="json-action-btn">
                            {isExpanded ? 'Collapse' : 'Expand'}
                        </button>
                    )}
                    <button onClick={() => copyToClipboard(displayValue)} className="json-action-btn">
                        Copy
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="data-container">
            {/* HERO SECTION */}
            <div className="metafield-hero">
                <div className="meta-hero-text">
                    <h1>Metafield Explorer</h1>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {!isSearchOpen ? (
                        <button
                            className="meta-search-trigger"
                            onClick={() => setIsSearchOpen(true)}
                            title="Open Search"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                    ) : (
                        <div className="meta-search-box fade-in-scale" ref={searchRef}>
                            <input
                                className="meta-search-input"
                                placeholder="example.myshopify.com (Press Enter to search)"
                                value={shopDomain}
                                onChange={(e) => setShopDomain(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !shopInfo && fetchMetafields()}
                                autoFocus
                                disabled={!!shopInfo} // Disable input if results are shown
                            />
                            {shopInfo ? (
                                <button
                                    className="meta-search-btn"
                                    onClick={() => {
                                        setShopInfo(null);
                                        setMetafields([]);
                                        setError(null);
                                        setShopDomain('');
                                        setIsSearchOpen(false);
                                    }}
                                    style={{ background: '#ef4444' }} // Red color for reset
                                >
                                    Reset
                                </button>
                            ) : (
                                <button
                                    className="meta-search-btn"
                                    onClick={fetchMetafields}
                                    disabled={loading || !shopDomain}
                                >
                                    {loading ? 'Fetching...' : 'Explore Data'}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="error-alert" style={{ maxWidth: '600px', margin: '2rem 0 0', position: 'absolute', top: '100%', right: 0, zIndex: 10 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        {error}
                    </div>
                )}
            </div>

            {/* INFO GRID */}
            {shopInfo && (
                <div className="shop-info-grid">
                    <div className="shop-info-card">
                        <span className="shop-info-label">Shop Name</span>
                        <span className="shop-info-value">{shopInfo.name}</span>
                    </div>
                    <div className="shop-info-card">
                        <span className="shop-info-label">Shop Plan</span>
                        <span className="shop-info-value" style={{ color: '#16a34a' }}>{shopInfo.plan || 'Basic'}</span>
                    </div>
                    <div className="shop-info-card">
                        <span className="shop-info-label">Contact Email</span>
                        <span className="shop-info-value">{shopInfo.email}</span>
                    </div>
                    <div className="shop-info-card">
                        <span className="shop-info-label">Primary Domain</span>
                        <span className="shop-info-value">{shopInfo.domain}</span>
                    </div>
                </div>
            )}

            {/* RESULTS */}
            {!loading && filtered.length === 0 ? (
                <div className="empty-state-container" style={{ marginTop: '2rem' }}>
                    <div className="empty-state-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                            <line x1="8" y1="21" x2="16" y2="21" />
                            <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                    </div>
                    <h3 className="empty-state-title">Nothing to show</h3>
                </div>
            ) : (
                <div className="table-responsive-elite fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="custom-table-container">
                        <table className="custom-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '20%' }}>Key</th>
                                    <th style={{ width: '15%' }}>Type</th>
                                    <th style={{ width: '65%' }}>Value / Content</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '4rem' }}>
                                            <div className="loader" style={{ margin: '0 auto' }} />
                                            <p style={{ marginTop: '1rem', color: '#64748b' }}>Syncing data from Shopify...</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((mf) => (
                                        <tr key={mf.id} className="hover-row">
                                            <td style={{ verticalAlign: 'top', paddingTop: '1.5rem' }}>
                                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{mf.key}</div>
                                                <div className="event-badge" style={{ marginTop: '0.5rem', background: '#f1f5f9', color: '#64748b', fontSize: '0.7rem' }}>
                                                    {mf.namespace}
                                                </div>
                                            </td>
                                            <td style={{ verticalAlign: 'top', paddingTop: '1.5rem' }}>
                                                <span className="type-badge">
                                                    {mf.type.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td>
                                                <MetafieldValue mf={mf} />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MetafieldSearch;
