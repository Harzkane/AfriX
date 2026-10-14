import axios from "axios";

// Create Axios instance with BFF proxy support
const api = axios.create({
  baseURL:
    typeof window !== "undefined"
      ? "/api/proxy"
      : process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Response Interceptor: Handle 401 (Unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        try {
          await fetch("/api/auth/session", { method: "DELETE" });
        } catch (_) {}
        sessionStorage.removeItem("admin_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
