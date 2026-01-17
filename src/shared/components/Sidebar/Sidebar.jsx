import { NavLink, useLocation } from 'react-router-dom';
import accessConfig from '../../../config/access.json';

const Sidebar = ({ onLogout, userRole }) => {
    const location = useLocation();
    // Helper to check if a path is allowed for the current role
    const isAllowed = (path) => {
        try {
            const role = userRole || 'merchant';
            const roleConfig = accessConfig.roles.find(r => r.role === role);
            
            if (!roleConfig) return false;
            
            if (roleConfig.access.includes('all')) return true;
            return roleConfig.access.includes(path);
        } catch (e) {
            console.error("Sidebar Access Error:", e);
            return true; // Fail safe to visible
        }
    };

    return (
        <aside className="admin-sidebar">
            <div className="sidebar-header">
                <div className="sidebar-brand">
                    <h2>Custlo</h2>
                </div>
            </div>

            <nav className="admin-tabs">
                {isAllowed('/') && (
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
                )}


                {isAllowed('/store-visits') && (
                    <NavLink className={({ isActive }) => `tab-button ${isActive || location.pathname.includes('store-data') ? "active" : ""}`} to="/store-visits">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6l9-4 9 4v16H3V6z" />
                            <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                        </svg>
                        Shop Analytics
                    </NavLink>
                )}

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
