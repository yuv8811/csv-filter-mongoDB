import { useState, useEffect, useCallback } from "react";
import authService from "../services/auth.service";

const useAuth = () => {
    // Helper to get initial state synchronously
    const getInitialState = () => {
        try {
            const auth = localStorage.getItem("isAuthenticated") === "true";
            const timestamp = localStorage.getItem("loginTimestamp");
            const userId = localStorage.getItem("userId");
            let role = localStorage.getItem("userRole"); 
            const twelveHours = 12 * 60 * 60 * 1000;

            if (auth && timestamp && userId) {
                const now = new Date().getTime();
                if (now - parseInt(timestamp, 10) < twelveHours) {
                    if (!role) {
                        role = 'merchant';
                        localStorage.setItem("userRole", role);
                    }
                    return { isAuthenticated: true, userRole: role };
                }
            }
        } catch (e) {
            console.error("Auth initialization error", e);
        }
        return { isAuthenticated: false, userRole: null };
    };

    const [authState, setAuthState] = useState(getInitialState);

    const logout = useCallback(() => {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("loginTimestamp");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        setAuthState({ isAuthenticated: false, userRole: null });
    }, []);

    const loginSuccess = useCallback((user) => {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("loginTimestamp", new Date().getTime().toString());
        if (user && user._id) {
            localStorage.setItem("userId", user._id);
        }
        
        const role = (user && user.role) ? user.role : 'merchant';
        localStorage.setItem("userRole", role);
        
        setAuthState({ isAuthenticated: true, userRole: role });
    }, []);

    useEffect(() => {
        if (!authState.isAuthenticated) return;

        const userId = localStorage.getItem("userId");

        if (userId) {
             // Force immediate verification check to sync latest role from backend (access.json)
             authService.verifyUser(userId).then(result => {
                 if (!result.valid) {
                     logout();
                 } else if (result.role && result.role !== localStorage.getItem("userRole")) {
                     console.log(`Role updated: ${localStorage.getItem("userRole")} -> ${result.role}`);
                     localStorage.setItem("userRole", result.role);
                     setAuthState(prev => ({ ...prev, userRole: result.role }));
                 }
             }).catch(err => console.error("Immediate auth check failed", err));
        }

        const checkAuth = async () => {
            const timestamp = localStorage.getItem("loginTimestamp");
            // const userId = localStorage.getItem("userId"); // Already defined
            const twelveHours = 12 * 60 * 60 * 1000;
            const now = new Date().getTime();

            if (!timestamp || (now - parseInt(timestamp, 10) > twelveHours)) {
                logout();
                return;
            }

            if (userId) {
                try {
                    const result = await authService.verifyUser(userId);
                    if (!result.valid) {
                        logout();
                    } else if (result.role && result.role !== localStorage.getItem("userRole")) {
                        localStorage.setItem("userRole", result.role);
                        setAuthState(prev => ({ ...prev, userRole: result.role }));
                    }
                } catch (err) {
                    console.error("Auth check failed", err);
                }
            } else {
                logout();
            }
        };

        checkAuth();
        const interval = setInterval(checkAuth, 60000);
        return () => clearInterval(interval);
    }, [authState.isAuthenticated, logout]);

    return { 
        isAuthenticated: authState.isAuthenticated, 
        userRole: authState.userRole, 
        loginSuccess, 
        logout 
    };
};

export default useAuth;
