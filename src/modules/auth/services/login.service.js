import api from "../../../shared/services/api";

const loginService = {
    /**
     * Login user
     * @param {string} identifier 
     * @returns {Promise<any>}
     */
    login: (identifier, password) => {
        return api.post("/login", { identifier, password });
    }
};

export default loginService;
