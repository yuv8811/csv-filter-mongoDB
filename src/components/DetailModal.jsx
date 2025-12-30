import { useState } from 'react';

const DetailModal = ({ item, onClose }) => {
    const [activeTab, setActiveTab] = useState("all"); // "all" or "subscription"

    if (!item) return null;

    const allEvents = item.additionalInfo?.length
        ? item.additionalInfo
        : [{ event: item.event, date: item.date }];

    const subscriptionKeywords = [
        'subscription',
        'frozen',
        'closed',
        'activate',
        'cancel',
        'decline'
    ];

    const subscriptionEvents = allEvents.filter(ev => {
        const eventName = (ev.event || "").toLowerCase();
        return subscriptionKeywords.some(key => eventName.includes(key));
    });

    const displayEvents = activeTab === "all" ? allEvents : subscriptionEvents;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="detail-sheet" onClick={e => e.stopPropagation()}>
                <div className="sheet-header">
                    <div className="sheet-title-area">
                        <h2>{item.shopName || item.shopDomain}</h2>
                        <p>Detailed Event Audit</p>
                    </div>
                    <button className="filter-icon-button" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="sheet-metadata">
                    <div className="metadata-item">
                        <label>Domain</label>
                        <span>{item.shopDomain}</span>
                    </div>
                    <div className="metadata-item">
                        <label>Email</label>
                        <span>{item.shopEmail || "N/A"}</span>
                    </div>
                </div>

                <div className="detail-tabs" style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '0 2rem',
                    borderBottom: '1px solid #f1f5f9',
                    marginBottom: '1rem'
                }}>
                    <button
                        onClick={() => setActiveTab("all")}
                        style={{
                            padding: '12px 4px',
                            background: 'none',
                            border: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: activeTab === "all" ? 'var(--primary)' : 'var(--text-muted)',
                            borderBottom: activeTab === "all" ? '2px solid var(--primary)' : '2px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        All Events ({allEvents.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("subscription")}
                        style={{
                            padding: '12px 4px',
                            background: 'none',
                            border: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: activeTab === "subscription" ? 'var(--primary)' : 'var(--text-muted)',
                            borderBottom: activeTab === "subscription" ? '2px solid var(--primary)' : '2px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Subscription Only ({subscriptionEvents.length})
                    </button>
                </div>

                <div className="sheet-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <span className="section-label">
                        {activeTab === "all" ? "COMPLETE EVENT LOG" : "SUBSCRIPTION RELATED EVENTS"}
                    </span>
                    <div className="table-wrapper" style={{ padding: '0 1.5rem 2rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600, color: '#64748b', width: '35%' }}>Event</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600, color: '#64748b', width: '25%' }}>Date</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600, color: '#64748b', width: '40%' }}>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayEvents.length > 0 ? (
                                    displayEvents.slice().reverse().map((ev, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: 500, color: '#1e293b' }}>{ev.event}</div>
                                                {activeTab === "all" && idx === 0 && (
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        background: '#232323ff',
                                                        color: '#ffffffff',
                                                        marginTop: '6px',
                                                        display: 'inline-block',
                                                        fontWeight: 600
                                                    }}>
                                                        Latest
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px 8px', verticalAlign: 'top', color: '#475569' }}>
                                                <div>{ev.date}</div>
                                                {ev.billingDate && (
                                                    <div style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '4px' }}>
                                                        Bill: {ev.billingDate}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px 8px', verticalAlign: 'top', color: '#64748b', fontSize: '0.8125rem', lineHeight: '1.5' }}>
                                                {ev.details ? (
                                                    <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                                                        {ev.details}
                                                    </div>
                                                ) : "-"}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                            No events found matching criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailModal;
