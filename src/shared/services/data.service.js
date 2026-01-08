import api from "./api";

const dataService = {
    /**
     * Fetch all main CSV data records
     * @returns {Promise<Array>}
     */
    getAllRecords: () => {
        return api.get("/");
    },

    /**
     * Fetch detailed shop info
     * @param {string} domain 
     * @returns {Promise<Object>}
     */
    getShopDetails: (domain) => {
        return api.get(`/shop-details/${domain}`);
    },

    /**
     * Upload a CSV file
     * @param {File} file 
     * @returns {Promise<Object>}
     */
    uploadFile: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return api.post("/upload", formData);
    },

    /**
     * Fetch upload history
     * @returns {Promise<Array>}
     */
    getUploadHistory: () => {
        return api.get("/api/upload-history");
    }
};

export default dataService;
