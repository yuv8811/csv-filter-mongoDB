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
                <pre style={{
                    margin: 0,
                    background: 'rgba(0,0,0,0.03)',
                    padding: '12px',
                    paddingTop: '40px',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.05)',
                    fontFamily: '"Fira Code", monospace',
                    fontSize: '0.8rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    maxHeight: isExpanded ? 'none' : '140px',
                    overflow: 'hidden',
                    color: '#475569',
                    position: 'relative'
                }}>
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
                        <p style={{ color: 'var(--text-muted)' }}>Fetch live store metafields via Shopify API</p>
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
                            className={`filter-icon-button active ${loading ? 'loading' : ''}`}
                            style={{ width: '100px', height: '42px', borderRadius: '12px' }}
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
                            <th style={{ width: '180px' }}>Namespace</th>
                            <th style={{ width: '200px' }}>Key</th>
                            <th>Value</th>
                            <th style={{ width: '140px', textAlign: 'right' }}>Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? (
                            filtered.map((mf, i) => (
                                <tr className="hover-row" key={mf.id || i}>
                                    <td style={{ verticalAlign: 'top', padding: '1.5rem 1rem' }}>
                                        <div style={{
                                            fontSize: '0.65rem',
                                            color: '#64748b',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            background: '#f1f5f9',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            display: 'inline-block'
                                        }}>
                                            {mf.namespace === "customer_dashboard" && "Customer Dashboard"}
                                        </div>
                                    </td>
                                    <td style={{ verticalAlign: 'top', padding: '1.5rem 1rem' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>{mf.key}</div>
                                    </td>
                                    <td style={{ verticalAlign: 'top', padding: '1.5rem 1rem' }}>
                                        <MetafieldValue mf={mf} />
                                    </td>
                                    <td style={{ verticalAlign: 'top', textAlign: 'right', padding: '1.5rem 1rem' }}>
                                        <span className="type-badge">{mf.type.replace(/_/g, ' ')}</span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
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

            <style>{`
                .metafield-search-view {
                    animation: fadeIn 0.4s ease-out;
                }
                .modern-input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    background: white;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    transition: all 0.2s ease;
                }
                .modern-input-wrapper:focus-within {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 4px rgba(0,0,0,0.05);
                }
                .modern-input-wrapper.search svg {
                    position: absolute;
                    left: 12px;
                    color: var(--text-muted);
                }
                .modern-input-wrapper.search .modern-input {
                    padding-left: 36px;
                }
                .modern-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: none;
                    background: transparent;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--text-main);
                    outline: none;
                }
                .modern-input-wrapper {
                    width: 250px;
                }

                .shop-details-minimal {
                    display: flex;
                    gap: 40px;
                    padding: 24px;
                    background: white;
                    border-radius: 16px;
                    border: 1px solid var(--border);
                    margin-bottom: 24px;
                    box-shadow: var(--shadow-sm);
                }
                .detail-box label {
                    display: block;
                    font-size: 0.65rem;
                    font-weight: 800;
                    color: var(--text-muted);
                    margin-bottom: 6px;
                    letter-spacing: 0.05em;
                }
                .detail-box .value {
                    font-weight: 700;
                    font-size: 1rem;
                }
                .detail-box .value.primary { color: var(--primary); }
                .detail-box .value.success { color: #10b981; }
                .detail-box .value.muted { color: var(--text-muted); font-size: 0.9rem; }

                .meta-value-container { position: relative; }
                .value-actions {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    display: flex;
                    gap: 6px;
                    z-index: 10;
                }
                .action-btn {
                    padding: 4px 10px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 1px solid rgba(0,0,0,0.1);
                    background: white;
                    color: var(--text-main);
                }
                .action-btn:hover { background: #f8fafc; }
                .action-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
                .action-btn.secondary { background: rgba(0,0,0,0.05); border: none; }

                .value-fade {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 30px;
                    background: linear-gradient(transparent, white);
                    border-radius: 0 0 12px 12px;
                    pointer-events: none;
                }
                .type-badge {
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    padding: 4px 10px;
                    background: #f1f5f9;
                    color: #64748b;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                .error-alert {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 16px;
                    background: #fee2e2;
                    color: #991b1b;
                    border-radius: 12px;
                    margin-bottom: 24px;
                    font-size: 0.9rem;
                    font-weight: 600;
                }
                .loader-small {
                    width: 18px;
                    height: 18px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin: 0 auto;
                }
                .loader-center {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .hover-row:hover td { background: #fcfdfe; }
            `}</style>
        </div>
    );
};

export default MetafieldSearch;
