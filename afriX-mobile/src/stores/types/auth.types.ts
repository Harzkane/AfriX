// src/stores/types/auth.types.ts
export type User = {
  id: string;
  email: string;
  full_name: string;
  country_code: string;
  role: "user" | "admin" | "agent";
  email_verified: boolean;
  verification_level: number;
  phone_number?: string;
  created_at: string;
  two_factor_enabled?: boolean;
  push_notifications_enabled?: boolean;
  email_notifications_enabled?: boolean;
  sms_notifications_enabled?: boolean;
  education_what_are_tokens?: boolean;
  education_how_agents_work?: boolean;
  education_understanding_value?: boolean;
  education_safety_security?: boolean;
};

// defines the shape of our store
export type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  login: (credentials: { email: string; password: string }) => Promise<
    void | { requires_2fa: true; temp_token: string }
  >;
  register: (form: {
    email: string;
    password: string;
    full_name: string;
    country_code: string;
  }) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  logout: () => void;
  initAuth: () => Promise<void>;
  unlockWithBiometric: () => Promise<boolean>;
  clearError: () => void;

  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, new_password: string) => Promise<void>;
  changePassword: (current_password: string, new_password: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  fetchMe: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
};
