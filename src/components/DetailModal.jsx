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

                <div className="detail-tabs-container">
                    <button
                        onClick={() => setActiveTab("all")}
                        className={`detail-tab-btn ${activeTab === "all" ? "active" : ""}`}
                    >
                        All Events ({allEvents.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("subscription")}
                        className={`detail-tab-btn ${activeTab === "subscription" ? "active" : ""}`}
                    >
                        Subscription Only ({subscriptionEvents.length})
                    </button>
                </div>

                <div className="sheet-body sheet-scroll-area">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span className="section-label" style={{ marginBottom: 0 }}>
                            {activeTab === "all" ? "COMPLETE EVENT LOG" : "SUBSCRIPTION RELATED EVENTS"}
                        </span>
                        {activeTab === "subscription" && (
                            <span style={{
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                color: '#059669',
                                backgroundColor: '#ecfdf5',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: '1px solid #d1fae5'
                            }}>
                                Total Spent: ${item.totalSpent?.toFixed(2) || "0.00"}
                            </span>
                        )}
                    </div>
                    <div>
                        <table className="detail-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '35%' }}>Event</th>
                                    <th style={{ width: '25%' }}>Date</th>
                                    <th style={{ width: '40%' }}>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayEvents.length > 0 ? (
                                    displayEvents.slice().reverse().map((ev, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <div className="detail-event-name">{ev.event}</div>

                                            </td>
                                            <td className="detail-date">
                                                <div>{ev.date}</div>
                                                {ev.billingDate && (
                                                    <div className="billing-date">
                                                        Bill: {ev.billingDate}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="detail-description">
                                                {ev.details ? (
                                                    <div className="detail-box">
                                                        {ev.details}
                                                    </div>
                                                ) : "-"}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="no-events-message">
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
