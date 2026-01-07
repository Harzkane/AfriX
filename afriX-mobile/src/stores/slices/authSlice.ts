// src/stores/slices/authSlice.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/api";
import type { AuthState } from "@/stores/types/auth.types";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          console.log("🔐 Attempting login...");
          const { data } = await apiClient.post(
            API_ENDPOINTS.AUTH.LOGIN,
            credentials
          );

          console.log("📦 Login response:", data);

          // ✅ Extract token from nested structure
          const { user, tokens } = data.data;
          const token = tokens.access_token; // ← Get access_token from tokens object

          if (!token) {
            throw new Error("No token received from server");
          }

          console.log("✅ Token extracted:", token.slice(0, 30) + "...");

          // ✅ Save token to BOTH Zustand AND SecureStore
          await SecureStore.setItemAsync("auth_token", token);
          console.log("✅ Token saved to SecureStore");

          // Set auth header for future requests
          apiClient.defaults.headers.Authorization = `Bearer ${token}`;
          console.log("✅ Auth header set on apiClient");

          set({ user, token, isAuthenticated: true, loading: false });
          console.log("✅ Login successful for:", user.email);
        } catch (err: any) {
          console.error("❌ Login error:", err);
          const message =
            err.response?.data?.message || err.message || "Login failed";
          set({ error: message, loading: false });
          throw new Error(message);
        }
      },

      register: async (form) => {
        set({ loading: true, error: null });
        try {
          await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, form);
          set({ loading: false });
        } catch (err: any) {
          set({
            error: err.response?.data?.message || "Registration failed",
            loading: false,
          });
          throw err;
        }
      },

      verifyEmail: async (verificationToken) => {
        set({ loading: true, error: null });
        try {
          const { data } = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY, {
            token: verificationToken,
          });

          console.log("✅ Email verified successfully:", data);
          set({ loading: false });
        } catch (err: any) {
          set({
            error: err.response?.data?.message || "Invalid token",
            loading: false,
          });
          throw err;
        }
      },

      logout: async () => {
        try {
          // ✅ Clear token from BOTH places
          await SecureStore.deleteItemAsync("auth_token");
          delete apiClient.defaults.headers.Authorization;
          console.log("✅ Logged out, token cleared");
        } catch (err) {
          console.error("❌ Logout error:", err);
        }

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        });
      },

      initAuth: async () => {
        try {
          // ✅ Check SecureStore first (source of truth for API calls)
          const secureToken = await SecureStore.getItemAsync("auth_token");

          if (!secureToken) {
            console.log("ℹ️  No auth token found in SecureStore");
            set({ isAuthenticated: false, loading: false });
            return;
          }

          console.log("🔐 Found token in SecureStore, verifying...");

          // Set header for the verification request
          apiClient.defaults.headers.Authorization = `Bearer ${secureToken}`;

          const { data } = await apiClient.get(API_ENDPOINTS.AUTH.ME);

          // ✅ Backend returns: { success: true, data: { user: {...} } }
          // Extract user from nested structure
          const userData = data.data?.user || data.data || data.user || data;

          if (!userData || !userData.email) {
            console.error('❌ Invalid user data:', data);
            throw new Error('Invalid user data from /auth/me');
          }

          console.log("✅ User authenticated:", userData.email);

          set({
            user: userData,
            token: secureToken,
            isAuthenticated: true,
            loading: false,
          });
        } catch (err: any) {
          console.log("⚠️  Token invalid, clearing auth");
          console.error("initAuth error:", err.message);
          try {
            await SecureStore.deleteItemAsync("auth_token");
          } catch (e) {
            console.error("Failed to delete token:", e);
          }
          delete apiClient.defaults.headers.Authorization;

          set({
            token: null,
            isAuthenticated: false,
            user: null,
            loading: false,
          });
        }
      },

      clearError: () => set({ error: null }),

      forgotPassword: async (email: string) => {
        set({ loading: true, error: null });
        try {
          await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
          set({ loading: false });
        } catch (err: any) {
          const message =
            err.response?.data?.message || "Failed to send reset email";
          set({ error: message, loading: false });
          throw new Error(message);
        }
      },

      resetPassword: async (token: string, new_password: string) => {
        set({ loading: true, error: null });
        try {
          await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
            token,
            new_password,
          });
          set({ loading: false });
        } catch (err: any) {
          const message =
            err.response?.data?.message || "Password reset failed";
          set({ error: message, loading: false });
          throw new Error(message);
        }
      },

      resendVerification: async (email: string) => {
        set({ loading: true, error: null });
        try {
          await apiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, {
            email,
          });
          set({ loading: false });
        } catch (err: any) {
          const message =
            err.response?.data?.message || "Failed to resend verification";
          set({ error: message, loading: false });
          throw new Error(message);
        }
      },

      fetchMe: async () => {
        set({ loading: true, error: null });
        try {
          const { data } = await apiClient.get(API_ENDPOINTS.AUTH.ME);
          // Backend returns { success: true, data: { user: {...} } }
          set({ user: data.data.user, isAuthenticated: true, loading: false });
        } catch (err: any) {
          set({
            error: err.response?.data?.message || "Failed to fetch user",
            loading: false,
          });
          throw new Error(err.response?.data?.message);
        }
      },

      setUser: (user) => set({ user }),

      setToken: async (token) => {
        await SecureStore.setItemAsync("auth_token", token);
        apiClient.defaults.headers.Authorization = `Bearer ${token}`;
        set({ token, isAuthenticated: true });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

export const initAuth = () => useAuthStore.getState().initAuth();
