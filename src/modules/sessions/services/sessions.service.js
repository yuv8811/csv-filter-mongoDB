import api from "../../../shared/services/api";

const sessionService = {
    /**
     * Fetch all session data
     * @returns {Promise<Array>}
     */
    getAll: () => {
        return api.get("/api/session-data");
    },

    /**
     * Create new session data
     * @param {Object} data 
     * @returns {Promise<Object>}
     */
    create: (data) => {
        return api.post("/api/session-data", data);
    },

    /**
     * Update session data
     * @param {string} id 
     * @param {Object} data 
     * @returns {Promise<Object>}
     */
    update: (id, data) => {
        return api.put(`/api/session-data/${id}`, data);
    },

    /**
     * Delete session data
     * @param {string} id 
     * @returns {Promise<Object>}
     */
    delete: (id) => {
        return api.delete(`/api/session-data/${id}`);
    }
};

export default sessionService;
