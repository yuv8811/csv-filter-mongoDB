import api from "../../../shared/services/api";

const metafieldService = {
    /**
     * Fetch metafields for a given shop domain
     * @param {string} shopDomain 
     * @returns {Promise<Object>}
     */
    getMetafields: (shopDomain) => {
        return api.get(`/shopify/metafields?shop=${shopDomain}`);
    }
};

export default metafieldService;
