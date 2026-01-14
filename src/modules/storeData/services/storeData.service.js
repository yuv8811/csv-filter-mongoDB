import api from "../../../shared/services/api";

const storeDataService = {
    /**
     * Fetch merchant store data
     * @param {string} storeName - The name of the store (collection name)
     * @returns {Promise<Array>}
     */
    getStoreData: (storeName) => {
        return api.get(`/merchant-store/${encodeURIComponent(storeName)}`);
    }
};

export default storeDataService;
