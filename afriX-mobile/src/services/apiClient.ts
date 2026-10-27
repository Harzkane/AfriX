// src/services/apiClient.ts
import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const API_URL =
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) ||
  Constants.expoConfig?.extra?.apiUrl ||
  "https://afrix-iqvq.onrender.com/api/v1";

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 25000,
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
    }

    if (__DEV__) {
      console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor — handle 401 globally
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`✅ ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (__DEV__) {
        console.log("⚠️  Unauthorized — token invalid or expired");
      }
      SecureStore.deleteItemAsync("auth_token").catch(() => {});
      delete apiClient.defaults.headers.Authorization;
      try {
        const { useAuthStore } = require("@/stores/slices/authSlice");
        useAuthStore.getState().logout?.();
      } catch (_) {}
    } else if (
      error.response?.status === 403 &&
      (error.config?.url?.includes("/agents/profile") ||
        error.config?.url?.includes("/agents/kyc/status"))
    ) {
      // Suppress 403 errors for agent status checks (expected for non-agents)
      if (__DEV__) {
        console.log("ℹ️  User is not an agent yet (403 expected)");
      }
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
    } else if (
      error.response?.status === 400 &&
      error.config?.url?.includes("/agents/deposit")
    ) {
      // Log briefly; user sees friendly message in Alert, not backend/URL
      console.log("ℹ️  Deposit request failed (400)");
    } else if (
      error.response?.status === 400 &&
      (error.config?.url?.includes("/auth/2fa/disable") ||
        error.config?.url?.includes("/auth/2fa/verify"))
    ) {
      // Suppress 2FA errors; user sees friendly Alert, not backend message
      console.log("ℹ️  2FA request failed (handled by UI)");
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
