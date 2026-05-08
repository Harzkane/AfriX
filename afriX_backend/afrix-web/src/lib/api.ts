import axios from "axios";

// Create Axios instance
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
});

// Request Interceptor: Add Token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("admin_token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 (Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== "undefined") {
                localStorage.removeItem("admin_token");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
