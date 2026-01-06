import { NavLink } from 'react-router-dom';

const Sidebar = ({ onLogout }) => {
    return (
        <aside className="admin-sidebar">
            <div className="sidebar-header">
                <div className="sidebar-brand">
                    <h2>Custlo</h2>
                </div>
            </div>

            <nav className="admin-tabs">
                <NavLink
                    to="/"
                    end
                    className={({ isActive }) => `tab-button ${isActive ? "active" : ""}`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Database Records
                </NavLink>

                {/* <NavLink
                    to="/metafields"
                    className={({ isActive }) => `tab-button ${isActive ? "active" : ""}`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="11" y1="8" x2="11" y2="14" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                    Metafield Search
                </NavLink> */}
                <NavLink className={({ isActive }) => `tab-button ${isActive ? "active" : ""}`} to="/session-data">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <ellipse cx="12" cy="5" rx="9" ry="3" />
                        <path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5" />
                        <path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6" />
                    </svg>
                    session data
                </NavLink>
                <button
                    className="tab-button logout-button"
                    onClick={onLogout}
                    style={{ marginTop: 'auto' }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                </button>
            </nav>
        </aside>
    );
};

export default Sidebar;
