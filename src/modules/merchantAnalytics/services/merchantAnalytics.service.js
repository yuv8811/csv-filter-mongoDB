import api from "../../../shared/services/api";

const merchantAnalyticsService = {
  getAllStoreStatus: () => {
    return api.get("/merchant-analytics/all-stores");
  },
};

export default merchantAnalyticsService;
