import { useState, useMemo } from 'react';

const MetafieldSearch = () => {
    const [shopDomain, setShopDomain] = useState('');
    const [metafields, setMetafields] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [shopInfo, setShopInfo] = useState(null);

    const [expandedRows, setExpandedRows] = useState(new Set());

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

        const isLong = displayValue.length > 250 || displayValue.split('\n').length > 5;

        return (
            <div className="meta-value-container">
                <pre className={`meta-pre-block ${isExpanded ? 'expanded' : ''}`}>
                    {displayValue}
                </pre>

                <div className="value-actions">
                    {isLong && (
                        <button
                            onClick={() => toggleRow(mf.id)}
                            className={`action-btn ${isExpanded ? 'active' : ''}`}
                        >
                            {isExpanded ? 'Collapse' : 'Expand'}
                        </button>
                    )}
                    <button
                        onClick={() => copyToClipboard(displayValue)}
                        className="action-btn secondary"
                    >
                        Copy
                    </button>
                </div>

                {!isExpanded && isLong && <div className="value-fade" />}
            </div>
        );
    };

    return (
        <div className="repository-container metafield-search-view">
            <div className="data-header">
                <div className="data-header-left">
                    <div className="data-header-title">
                        <h1>Metafield Search</h1>
                        <p className="repo-stat-line">Fetch live store metafields via Shopify API</p>
                    </div>
                </div>
                <div className="data-header-right">
                    <div className="search-container">
                        <div className="modern-input-wrapper">
                            <input
                                type="text"
                                placeholder="store.myshopify.com"
                                className="modern-input"
                                value={shopDomain}
                                onChange={(e) => setShopDomain(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchMetafields()}
                            />
                        </div>
                        <button
                            onClick={fetchMetafields}
                            disabled={loading || !shopDomain}
                            className={`filter-icon-button active meta-loading-btn ${loading ? 'loading' : ''}`}
                        >
                            {loading ? <div className="loader-small" /> : 'Fetch'}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-alert">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {error}
                </div>
            )}

            {shopInfo && (
                <div className="shop-details-minimal">
                    <div className="detail-box">
                        <label>NAME</label>
                        <div className="value primary">{shopInfo.name}</div>
                    </div>
                    <div className="detail-box">
                        <label>EMAIL</label>
                        <div className="value">{shopInfo.email}</div>
                    </div>
                    <div className="detail-box">
                        <label>PLAN</label>
                        <div className="value success">{shopInfo.plan || 'Development'}</div>
                    </div>
                    <div className="detail-box">
                        <label>DOMAIN</label>
                        <div className="value muted">{shopInfo.domain}</div>
                    </div>
                </div>
            )}



            <div className="table-responsive-elite">
                <table className="custom-table minimal">
                    <thead>
                        <tr>
                            <th className="meta-th-namespace">Namespace</th>
                            <th className="meta-th-key">Key</th>
                            <th>Value</th>
                            <th className="meta-th-type">Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? (
                            filtered.map((mf, i) => (
                                <tr className="hover-row" key={mf.id || i}>
                                    <td className="meta-td">
                                        <div className="meta-namespace-badge">
                                            {mf.namespace === "customer_dashboard" && "Customer Dashboard"}
                                        </div>
                                    </td>
                                    <td className="meta-td">
                                        <div className="meta-key">{mf.key}</div>
                                    </td>
                                    <td className="meta-td">
                                        <MetafieldValue mf={mf} />
                                    </td>
                                    <td className="meta-td meta-td-right">
                                        <span className="type-badge">{mf.type.replace(/_/g, ' ')}</span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="meta-empty-cell">
                                    {loading ? (
                                        <div className="loader-center">
                                            <div className="loader" />
                                            <p>Establishing connection...</p>
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                                            <h3>No data to show</h3>
                                            <p>Enter a Shopify domain above to synchronize data.</p>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MetafieldSearch;
