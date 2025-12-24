const DetailModal = ({ item, onClose }) => {
    if (!item) return null;

    const events = item.additionalInfo?.length
        ? item.additionalInfo
        : [{ event: item.event, date: item.date }];

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
                <div className="sheet-body">
                    <span className="section-label">EVENT LOG</span>
                    <div className="activity-stack">
                        {events.slice().reverse().map((ev, idx) => (
                            <div key={idx} className="activity-card-elite">
                                <div className="activity-main-info">
                                    <span className="activity-primary-text">{ev.event}</span>
                                    <span className="activity-secondary-text">{ev.date}</span>
                                    {ev.billingDate && (
                                        <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '4px', fontWeight: 600 }}>
                                            Billing Date: {ev.billingDate}
                                        </div>
                                    )}
                                    {ev.details && (
                                        <span className="activity-details-text" style={{
                                            fontSize: '0.75rem',
                                            color: '#64748b',
                                            marginTop: '6px',
                                            padding: '8px',
                                            background: '#f8fafc',
                                            borderRadius: '8px',
                                            border: '1px solid #f1f5f9',
                                            display: 'block'
                                        }}>
                                            {ev.details}
                                        </span>
                                    )}
                                </div>
                                {idx === 0 && <div className="activity-badge-minimal">Latest</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailModal;
