// src/constants/api.ts
import Constants from "expo-constants";

const API_URL =
  Constants.expoConfig?.extra?.apiUrl || "http://192.168.1.144:5001/api/v1";

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/auth/register",
    VERIFY: "/auth/verify-email",
    LOGIN: "/auth/login",
    ME: "/auth/me",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    RESEND_VERIFICATION: "/auth/resend-verification",
  },
  // WALLET: {
  //   BALANCE: "/wallet/balance",
  // },
  WALLETS: {
    LIST: "/wallets",
    BY_ID: (id: string) => `/wallets/${id}`,
    TRANSFER: "/wallets/transfer",
  },

  AGENTS: {
    LIST: "/agents/list", // You may need to add this endpoint
    BY_ID: (id: string) => `/agents/${id}`,
    PROFILE: "/agents/profile",
    REGISTER: "/agents/register",
    REVIEW: "/agents/review",
    REQUESTS: "/requests", // Agent-specific requests (Backend route is /)
    DEPOSIT_ADDRESS: "/agents/deposit-address",
  },

  REQUESTS: {
    LIST: "/requests", // Added list endpoint
    USER: "/requests/user", // Added user requests endpoint
    MINT: {
      CREATE: "/requests/mint",
      UPLOAD_PROOF: (id: string) => `/requests/mint/${id}/proof`,
      STATUS: (id: string) => `/requests/mint/${id}`,
      CONFIRM: "/requests/mint/confirm",
      REJECT: "/requests/mint/reject",
    },
    BURN: {
      CREATE: "/requests/burn",
      CONFIRM: "/requests/burn/confirm",
      STATUS: (id: string) => `/requests/burn/${id}`,
      UPLOAD_FIAT_PROOF: (id: string) => `/requests/burn/${id}/fiat-proof`,
      REJECT: "/requests/burn/reject",
    },
  },
};

export { API_URL };
