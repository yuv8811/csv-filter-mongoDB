const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const defaultHeaders = {
    "Content-Type": "application/json",
};

/**
 * Generic fetch wrapper to handle common API logic
 * @param {string} endpoint - The API endpoint (e.g., "/verify-user")
 * @param {object} options - Fetch options (method, headers, body)
 * @returns {Promise<any>} - The JSON response
 */
const request = async (endpoint, options = {}) => {
    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
        config.body = JSON.stringify(config.body);
    }

    if (config.body instanceof FormData) {
        delete config.headers["Content-Type"];
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return response.json();
};

const api = {
    get: (endpoint) => request(endpoint, { method: "GET" }),
    post: (endpoint, body) => request(endpoint, { method: "POST", body }),
    put: (endpoint, body) => request(endpoint, { method: "PUT", body }),
    delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};

export default api;
