// src/stores/slices/requestSlice.ts
import { create } from "zustand";
import apiClient from "@/services/apiClient";
import { WEB_URL } from "@/constants/api";
import { useAuthStore } from "./authSlice";

export type RequestMode = "p2p" | "merchant";
export type TokenType = "NT" | "CT" | "USDT";
export type RecipientScope = "anyone" | "person" | "contacts";
export type ExpirationDays = "1" | "3" | "7" | "30" | "never";
export type PrivacyOption = "public" | "private";

export interface DraftRequest {
  mode: RequestMode;
  tokenType: TokenType;
  amount: string;
  recipientScope: RecipientScope;
  recipientEmail: string;
  note: string;
  expirationDays: ExpirationDays;
  privacy: PrivacyOption;
}

export interface CreatedRequest {
  id: string;
  requestId: string;
  tokenType: TokenType;
  amount: number;
  recipientScope: RecipientScope;
  recipientEmail?: string;
  creatorEmail?: string;
  note?: string;
  expirationDays: ExpirationDays;
  privacy: PrivacyOption;
  status: "pending" | "completed" | "cancelled" | "expired";
  shareUrl: string;
  createdAt: string;
  expiresAt: string;
}

interface RequestState {
  draftRequest: DraftRequest;
  createdRequest: CreatedRequest | null;
  loading: boolean;
  error: string | null;

  setDraftRequest: (updates: Partial<DraftRequest>) => void;
  resetDraft: () => void;
  createTokenRequest: () => Promise<CreatedRequest>;
  clearError: () => void;
}

const initialDraft: DraftRequest = {
  mode: "p2p",
  tokenType: "NT",
  amount: "10000",
  recipientScope: "anyone",
  recipientEmail: "",
  note: "Rent payment for August",
  expirationDays: "7",
  privacy: "public",
};

export const useRequestStore = create<RequestState>((set, get) => ({
  draftRequest: initialDraft,
  createdRequest: null,
  loading: false,
  error: null,

  setDraftRequest: (updates) => {
    set((state) => ({
      draftRequest: { ...state.draftRequest, ...updates },
    }));
  },

  resetDraft: () => {
    set({ draftRequest: initialDraft, createdRequest: null, error: null });
  },

  createTokenRequest: async () => {
    const { draftRequest } = get();
    set({ loading: true, error: null });

    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const reqId = `RQST-${randomSuffix}`;

    try {
      // API call to create payment request with fixed reference
      const { data } = await apiClient.post("/merchants/payment-request", {
        amount: parseFloat(draftRequest.amount),
        token_type: draftRequest.tokenType,
        customer_email: draftRequest.recipientEmail || undefined,
        description: draftRequest.note || "Token request",
        recipient_email: draftRequest.recipientEmail || undefined,
        expiration_days: draftRequest.expirationDays,
        privacy: draftRequest.privacy,
        mode: draftRequest.mode,
        reference: reqId,
        metadata: {
          recipient_email: draftRequest.recipientEmail || undefined,
          expiration_days: draftRequest.expirationDays,
          privacy: draftRequest.privacy,
          mode: draftRequest.mode,
          request_id: reqId,
        },
      });

      const expiresDate = new Date();
      if (draftRequest.expirationDays !== "never") {
        expiresDate.setDate(expiresDate.getDate() + parseInt(draftRequest.expirationDays, 10));
      } else {
        expiresDate.setFullYear(expiresDate.getFullYear() + 1);
      }

      const userEmail = useAuthStore.getState().user?.email || "";

      const created: CreatedRequest = {
        id: data?.data?.transaction_id || `req_${Date.now()}`,
        requestId: reqId,
        tokenType: draftRequest.tokenType,
        amount: parseFloat(draftRequest.amount) || 0,
        recipientScope: draftRequest.recipientScope,
        recipientEmail: draftRequest.recipientEmail,
        creatorEmail: userEmail,
        note: draftRequest.note,
        expirationDays: draftRequest.expirationDays,
        privacy: draftRequest.privacy,
        status: "pending",
        shareUrl: `${WEB_URL}/pay/${reqId}`,
        createdAt: new Date().toISOString(),
        expiresAt: expiresDate.toISOString(),
      };

      set({ createdRequest: created, loading: false });
      return created;
    } catch (err: any) {
      console.warn("⚠️ API payment-request notice (using client simulation fallback):", err?.message);

      // Fallback for offline or dev simulation (use same reqId)
      const expiresDate = new Date();
      expiresDate.setDate(expiresDate.getDate() + (draftRequest.expirationDays === "never" ? 365 : parseInt(draftRequest.expirationDays, 10)));
      const userEmail = useAuthStore.getState().user?.email || "";

      const created: CreatedRequest = {
        id: `req_${Date.now()}`,
        requestId: reqId,
        tokenType: draftRequest.tokenType,
        amount: parseFloat(draftRequest.amount) || 0,
        recipientScope: draftRequest.recipientScope,
        recipientEmail: draftRequest.recipientEmail,
        creatorEmail: userEmail,
        note: draftRequest.note,
        expirationDays: draftRequest.expirationDays,
        privacy: draftRequest.privacy,
        status: "pending",
        shareUrl: `${WEB_URL}/pay/${reqId}`,
        createdAt: new Date().toISOString(),
        expiresAt: expiresDate.toISOString(),
      };

      set({ createdRequest: created, loading: false });
      return created;
    }
  },

  clearError: () => set({ error: null }),
}));
