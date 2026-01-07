// src/services/apiClient.ts
import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const API_URL = Constants.expoConfig?.extra?.apiUrl || "http://192.169.1.109:5001/api/v1";

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor — attach token securely
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("auth_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(
        `📡 ${config.method?.toUpperCase()} ${config.url} (with auth)`
      );
    } else {
      console.log(`📡 ${config.method?.toUpperCase()} ${config.url} (no auth)`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor — handle 401 globally
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log("⚠️  Unauthorized — token invalid or expired");
      // Optional: Clear token and redirect to login
    } else if (
      error.response?.status === 403 &&
      (error.config?.url?.includes("/agents/profile") ||
        error.config?.url?.includes("/agents/kyc/status"))
    ) {
      // Suppress 403 errors for agent status checks (expected for non-agents)
      console.log("ℹ️  User is not an agent yet (403 expected)");
    } else if (
      error.response?.status === 400 &&
      error.response?.data?.message?.includes("cannot create") &&
      error.response?.data?.message?.includes("to themselves")
    ) {
      // Suppress self-transaction validation errors (handled by friendly modal)
      console.log("ℹ️  Self-transaction prevented (handled by UI modal)");
    } else if (
      error.response?.status === 500 &&
      error.config?.url?.includes("/agents/deposit") &&
      (error.response?.data?.message?.includes("Invalid") ||
        error.response?.data?.message?.includes("transaction hash"))
    ) {
      // Suppress deposit validation errors (shown in Alert to user)
      console.log("ℹ️  Deposit validation error (shown in Alert)");
    } else {
      console.error(
        `❌ ${error.config?.url} - ${error.response?.status}`,
        error.response?.data?.message
      );
    }
    return Promise.reject(error);
  }
);

export default apiClient;
