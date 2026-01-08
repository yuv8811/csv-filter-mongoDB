import api from "../../../shared/services/api";

const authService = {
    /**
     * Verify if the user session is valid
     * @param {string} userId 
     * @returns {Promise<{valid: boolean}>}
     */
    verifyUser: (userId) => {
        return api.post("/verify-user", { userId });
    }
};

export default authService;
