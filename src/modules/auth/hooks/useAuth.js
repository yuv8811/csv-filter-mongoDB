import { useState, useEffect, useCallback } from "react";
import authService from "../services/auth.service";

const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        const auth = localStorage.getItem("isAuthenticated") === "true";
        const timestamp = localStorage.getItem("loginTimestamp");
        const userId = localStorage.getItem("userId");
        const twelveHours = 12 * 60 * 60 * 1000;

        if (auth && timestamp && userId) {
            const now = new Date().getTime();
            if (now - parseInt(timestamp, 10) < twelveHours) {
                return true;
            }
        }
        return false;
    });

    const logout = useCallback(() => {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("loginTimestamp");
        localStorage.removeItem("userId");
        setIsAuthenticated(false);
    }, []);

    const loginSuccess = useCallback((user) => {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("loginTimestamp", new Date().getTime().toString());
        if (user && user._id) {
            localStorage.setItem("userId", user._id);
        }
        setIsAuthenticated(true);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;

        const checkAuth = async () => {
            const timestamp = localStorage.getItem("loginTimestamp");
            const userId = localStorage.getItem("userId");
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
                    }
                } catch (err) {
                    console.error("Auth check failed", err);
                }
            } else {
                logout();
            }
        };

        checkAuth();
        const interval = setInterval(checkAuth, 5000);
        return () => clearInterval(interval);
    }, [isAuthenticated, logout]);

    return { isAuthenticated, loginSuccess, logout };
};

export default useAuth;
