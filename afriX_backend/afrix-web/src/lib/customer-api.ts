import axios from "axios";

const USER_TOKEN_KEY = "user_token";
const USER_PROFILE_KEY = "user_profile";

export const getStoredUserToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_TOKEN_KEY);
};

export const setStoredUserSession = (token: string, user: unknown) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_TOKEN_KEY, token);
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
};

export const clearStoredUserSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_TOKEN_KEY);
  localStorage.removeItem(USER_PROFILE_KEY);
};

const customerApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

customerApi.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = getStoredUserToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export type HostedPaymentDetails = {
  id: string;
  reference: string;
  amount: number;
  fee?: string | number;
  currency?: string;
  token_type?: string;
  description?: string;
  status: string;
  created_at?: string;
  metadata?: {
    return_url?: string | null;
    [key: string]: unknown;
  };
  customer?: {
    id: string;
    name: string;
    email: string;
  } | null;
  merchant?: {
    id: string;
    business_name: string;
    display_name?: string;
    logo_url?: string;
  } | null;
};

export type HostedUserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  verification_level: number;
  wallets: Array<{
    id: string;
    token_type: string;
    balance: string | number;
    created_at?: string;
  }>;
};

export const hostedPaymentApi = {
  login: async (email: string, password: string) => {
    const response = await customerApi.post("/auth/login", { email, password });
    const { tokens, user, requires_2fa } = response.data.data || {};

    if (requires_2fa) {
      throw new Error("2FA is not yet supported in hosted checkout.");
    }

    if (!tokens?.access_token) {
      throw new Error("Hosted checkout login did not return an access token.");
    }

    if (user?.role !== "user" && user?.role !== "agent") {
      throw new Error(
        "This hosted payment page is for buyer accounts only. Please sign in with a user or agent account."
      );
    }

    setStoredUserSession(tokens.access_token, user);
    return { token: tokens.access_token, user };
  },

  getCurrentUserProfile: async () => {
    const response = await customerApi.get("/users/me");
    return response.data.data as HostedUserProfile;
  },

  getPaymentDetails: async (transactionId: string) => {
    const response = await customerApi.get(`/payments/${transactionId}`);
    return response.data.data as HostedPaymentDetails;
  },

  processPayment: async ({
    transactionId,
    amount,
    tokenType,
    reference,
  }: {
    transactionId: string;
    amount: number;
    tokenType: string;
    reference?: string;
  }) => {
    const response = await customerApi.post("/payments/process", {
      transaction_id: transactionId,
      amount,
      token_type: tokenType,
      reference,
    });

    return response.data.data;
  },
};

export default customerApi;
