import React, { useState, useEffect } from 'react';
import './DetailModal.css';

const DetailModal = ({ item, onClose }) => {
    const [displayItem, setDisplayItem] = useState(item);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setDisplayItem(item);
        if (item && item.shopDomain) {
            fetch(`http://localhost:3000/shop-details/${item.shopDomain}`)
                .then(res => res.json())
                .then(data => {
                    if (data && !data.error) {
                        setDisplayItem(prev => ({
                            ...prev,
                            shop_owner: data.shop_owner,
                            phone: data.phone,
                            shop_type: data.shop_type,
                            customer: data.customer,
                            shopEmail: data.shopEmail || prev.shopEmail,
                            shopCountry: data.shopCountry || prev.shopCountry
                        }));
                    }
                })
                .catch(err => console.error("Failed to fetch shop details", err));
        }
    }, [item]);

    if (!displayItem) return null;

    // Helper to format date nicely
    const formatDate = (dateString, includeTime = true) => {
        if (!dateString) return '';
        try {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            if (includeTime) {
                options.hour = '2-digit';
                options.minute = '2-digit';
            }
            return new Date(dateString).toLocaleDateString('en-US', options);
        } catch (e) {
            return dateString;
        }
    };

    // Filter Logic
    const history = displayItem.additionalInfo || [];
    const filteredHistory = history.filter(event => {
        const matchesSearch =
            (event.event || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (event.details || '').toLowerCase().includes(searchTerm.toLowerCase());

        if (activeTab === 'subscription') {
            const subKeywords = ['subscription', 'charge', 'activate', 'frozen', 'cancel'];
            const isSub = subKeywords.some(k => (event.event || '').toLowerCase().includes(k));
            return matchesSearch && isSub;
        }

        return matchesSearch;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Icons
    const Icons = {
        email: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>,
        phone: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>,
        user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
        map: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>,
        tag: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>,
        id: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"></rect><circle cx="12" cy="10" r="2"></circle><line x1="8" y1="2" x2="8" y2="4"></line><line x1="16" y1="2" x2="16" y2="4"></line></svg>,
        link: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>,
        search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
        store: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3zM3 9h18M9 21V9"></path></svg>
    };

    const getEventStyle = (text) => {
        const t = (text || '').toLowerCase();
        // Identify subscription events for specific card styling
        if (t.includes('subscription') && t.includes('activated')) return 'subscription-active';
        return 'default';
    };

    return (
        <div className="dm-overlay" onClick={onClose}>
            <div className="dm-modal" onClick={e => e.stopPropagation()}>
                <div className="dm-split-layout">
                    {/* LEFT SIDEBAR - PROFILE */}
                    <div className="dm-sidebar">
                        <div className="dm-profile-header">
                            <h2 className="dm-shop-name">{displayItem.shopName || "Unknown Shop"}</h2>
                            <a href={`https://${displayItem.shopDomain}`} target="_blank" rel="noopener noreferrer" className="dm-shop-domain">
                                {displayItem.shopDomain} {Icons.link}
                            </a>
                            <h3 className="dm-total-spent">Total Spent: ${(displayItem.totalSpent || 0).toFixed(2)}</h3>
                        </div>

                        <div className="dm-info-group">
                            <h3 className="dm-group-title">Contact & Details</h3>

                            {[
                                { label: 'Owner', value: displayItem.shop_owner, icon: Icons.user, key: 'owner' },
                                { label: 'Email', value: displayItem.shopEmail, icon: Icons.email, key: 'email' },
                                { label: 'Phone', value: displayItem.phone, icon: Icons.phone, key: 'phone' },
                                { label: 'Country', value: displayItem.shopCountry, icon: Icons.map, key: 'country' },
                                { label: 'Store type', value: displayItem.shop_type, icon: Icons.store, key: 'type' },
                                { label: 'Customers', value: displayItem.customer, icon: Icons.user, key: 'id' },
                            ].map((field) => (
                                <div
                                    className="dm-info-row"
                                    key={field.key}
                                >
                                    <span className="dm-info-icon">{field.icon}</span>
                                    <div className="dm-info-content">
                                        <label>{field.label}</label>
                                        <div className="dm-value-wrapper">
                                            <span>{field.value || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>

                    {/* RIGHT CONTENT - ACTIVITY */}
                    <div className="dm-main">
                        <div className="dm-main-header interactive">
                            <h3>Activity Log</h3>
                            <div className="dm-controls">
                                <div className="dm-tabs">
                                    <button
                                        className={`dm-tab ${activeTab === 'all' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('all')}
                                    >
                                        All
                                    </button>
                                    <button
                                        className={`dm-tab ${activeTab === 'subscription' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('subscription')}
                                    >
                                        Subscription
                                    </button>
                                </div>
                                <div className="dm-search-wrapper">
                                    {Icons.search}
                                    <input
                                        type="text"
                                        placeholder="Search events..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="dm-search-input"
                                    />
                                </div>
                                <button className="dm-close-floater" onClick={onClose}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        </div>

                        <div className="dm-scroll-area">
                            <div className="dm-timeline-new">
                                {filteredHistory.length > 0 ? (
                                    filteredHistory.map((event, index) => {
                                        const typeClass = getEventStyle(event.event);
                                        return (
                                            <div key={index} className={`dm-new-item ${typeClass}`}>
                                                <div className="dm-new-date">
                                                    <span className="dm-day">{formatDate(event.date, false)}</span>
                                                    <span className="dm-time">{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                                </div>
                                                <div className="dm-new-marker-line">
                                                    <div className="dm-new-marker"></div>
                                                </div>
                                                <div className="dm-new-card">
                                                    <div className="dm-new-card-header">
                                                        <h4>{event.event}</h4>
                                                        {event.billingDate && <span className="dm-billing-tag">Bill: {event.billingDate}</span>}
                                                    </div>
                                                    {event.details && <p className="dm-new-details">{event.details}</p>}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="dm-empty-state">
                                        No events found matching your filter.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailModal;
