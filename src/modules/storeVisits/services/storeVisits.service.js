import api from "../../../shared/services/api";

const storeVisitService = {
    /**
     * Fetch store visit analytics
     * @returns {Promise<Array>}
     */
    getStoreVisits: (signal) => {
        return api.get("/store-visits");
    }
};

export default storeVisitService;
