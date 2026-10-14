import axios from "axios";

// Create Axios instance with BFF proxy support for merchant requests
const merchantApi = axios.create({
  baseURL:
    typeof window !== "undefined"
      ? "/api/proxy"
      : process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

merchantApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      try {
        await fetch("/api/auth/session", { method: "DELETE" });
      } catch (_) {}
      localStorage.removeItem("merchant_token");
      localStorage.removeItem("merchant_user");
      sessionStorage.removeItem("merchant_user");
      window.location.href = "/merchant/login";
    }
    return Promise.reject(error);
  }
);

export default merchantApi;
