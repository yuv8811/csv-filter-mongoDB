import api from "../../../shared/services/api";

const loginService = {
    /**
     * Login user
     * @param {string} identifier 
     * @returns {Promise<any>}
     */
    login: (identifier) => {
        return api.post("/login", { identifier });
    }
};

export default loginService;
