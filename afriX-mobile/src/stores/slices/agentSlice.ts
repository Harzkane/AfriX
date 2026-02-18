// src/stores/slices/agentSlice.ts
import { create } from "zustand";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/api";
import { AgentState } from "../types/agent.types";

export const useAgentStore = create<AgentState>((set, get) => ({
  stats: null,
  pendingRequests: [],
  withdrawalRequests: [],
  depositHistory: [],
  reviews: [],
  history: [],
  dashboardData: null,
  loading: false,
  error: null,

  // Agent Selection (User View)
  agents: [],
  selectedAgent: null,

  // Registration state
  kycStatus: null,
  agentStatus: null,

  fetchAgentStats: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.AGENTS.PROFILE);
      const agentData = data.data;

      set({
        stats: {
          pending_requests: 0, // Backend needs to return this count
          total_earnings: agentData.financial_summary?.total_earnings || 0,
          total_minted: agentData.total_minted || 0,
          total_burned: agentData.total_burned || 0,
          total_reviews: agentData.total_reviews || 0,
          available_capacity: agentData.available_capacity || 0,
        },
        agentStatus: agentData.status, // Update agent status
        loading: false,
      });
    } catch (err: any) {
      // If 403, it means user is not an agent yet - this is expected for new users
      if (err.response?.status === 403) {
        set({ agentStatus: null, loading: false });
        return;
      }
      set({ error: err.message, loading: false });
    }
  },

  fetchDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.get('/agents/dashboard');
      set({
        dashboardData: data.data,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchPendingRequests: async () => {
    set({ loading: true, error: null });
    try {
      // Use agent-specific endpoint
      const { data } = await apiClient.get(API_ENDPOINTS.AGENTS.REQUESTS);
      const allRequests = data.data || [];

      // Filter for pending requests
      const pending = allRequests.filter((r: any) =>
        (r.status === 'pending' || r.status === 'proof_submitted' || r.status === 'escrowed') &&
        !(new Date(r.expires_at).getTime() < Date.now()) &&
        r.status !== 'disputed'
      );

      set({ pendingRequests: pending, loading: false });

      // Update stats count
      set((state) => ({
        stats: state.stats ? { ...state.stats, pending_requests: pending.length } : null
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchHistory: async () => {
    // TODO: Implement history fetching
    set({ loading: false });
  },

  fetchAgents: async (country: string, sort?: "rating" | "fastest" | "capacity") => {
    set({ loading: true, error: null });
    try {
      let url = `${API_ENDPOINTS.AGENTS.LIST}?country=${country}`;
      if (sort && sort !== "rating") url += `&sort=${sort}`;
      const { data } = await apiClient.get(url);
      set({ agents: data.data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  selectAgent: (agent) => {
    set({ selectedAgent: agent });
  },

  confirmMintRequest: async (requestId) => {
    set({ loading: true, error: null });
    try {
      await apiClient.post(API_ENDPOINTS.REQUESTS.MINT.CONFIRM, { request_id: requestId });
      // Refresh list
      await get().fetchPendingRequests();
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  confirmBurnPayment: async (requestId, proof) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("proof", {
        uri: proof.uri,
        type: "image/jpeg",
        name: "proof.jpg",
      } as any);

      await apiClient.post(
        API_ENDPOINTS.REQUESTS.BURN.UPLOAD_FIAT_PROOF(requestId),
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // Refresh pending requests list
      await get().fetchPendingRequests();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  rejectRequest: async (requestId, reason, type) => {
    set({ loading: true, error: null });
    try {
      const endpoint =
        type === "mint"
          ? API_ENDPOINTS.REQUESTS.MINT.REJECT
          : API_ENDPOINTS.REQUESTS.BURN.REJECT;

      await apiClient.post(endpoint, {
        request_id: requestId,
        reason,
      });
      // Refresh list
      await get().fetchPendingRequests();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Registration Actions
  registerAsAgent: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post("/agents/register", data);
      set({
        agentStatus: response.data.data.status,
        loading: false
      });
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to register as agent";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  uploadKyc: async (personalInfo, documents) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();

      // Add personal info
      Object.entries(personalInfo).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Add documents
      if (documents.id_document) {
        formData.append("id_document", {
          uri: documents.id_document.uri,
          type: documents.id_document.type,
          name: documents.id_document.name,
        } as any);
      }

      if (documents.selfie) {
        formData.append("selfie", {
          uri: documents.selfie.uri,
          type: documents.selfie.type,
          name: documents.selfie.name,
        } as any);
      }

      if (documents.proof_of_address) {
        formData.append("proof_of_address", {
          uri: documents.proof_of_address.uri,
          type: documents.proof_of_address.type,
          name: documents.proof_of_address.name,
        } as any);
      }

      if (documents.business_registration) {
        formData.append("business_registration", {
          uri: documents.business_registration.uri,
          type: documents.business_registration.type,
          name: documents.business_registration.name,
        } as any);
      }

      await apiClient.post("/agents/kyc/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update KYC status
      await get().checkKycStatus();
      set({ loading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to upload KYC documents";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  checkKycStatus: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get("/agents/kyc/status");
      const kycStatus = response.data.data;
      set({ kycStatus, loading: false });
      return kycStatus;
    } catch (err: any) {
      // If 403, it means user is not an agent yet
      if (err.response?.status === 403) {
        set({ kycStatus: null, loading: false });
        return null;
      }
      const message = err.response?.data?.message || "Failed to check KYC status";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  resubmitKyc: async (personalInfo, documents) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();

      // Add personal info
      Object.entries(personalInfo).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Add documents (same as uploadKyc)
      if (documents.id_document) {
        formData.append("id_document", {
          uri: documents.id_document.uri,
          type: documents.id_document.type,
          name: documents.id_document.name,
        } as any);
      }

      if (documents.selfie) {
        formData.append("selfie", {
          uri: documents.selfie.uri,
          type: documents.selfie.type,
          name: documents.selfie.name,
        } as any);
      }

      if (documents.proof_of_address) {
        formData.append("proof_of_address", {
          uri: documents.proof_of_address.uri,
          type: documents.proof_of_address.type,
          name: documents.proof_of_address.name,
        } as any);
      }

      if (documents.business_registration) {
        formData.append("business_registration", {
          uri: documents.business_registration.uri,
          type: documents.business_registration.type,
          name: documents.business_registration.name,
        } as any);
      }

      await apiClient.put("/agents/kyc/resubmit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update KYC status
      await get().checkKycStatus();
      set({ loading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to resubmit KYC";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  updateProfile: async (updates) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put(API_ENDPOINTS.AGENTS.PROFILE, updates);

      // Refresh profile data to get updated values
      await Promise.all([
        get().fetchAgentStats(),
        get().fetchDashboard()
      ]);

      // IMPORTANT: Also refresh user data in auth store to update UI
      const { useAuthStore } = await import('../index');
      await useAuthStore.getState().fetchMe();

      set({ loading: false });
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to update profile";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  submitDeposit: async (amount, txHash) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post("/agents/deposit", {
        amount_usd: amount,
        tx_hash: txHash,
      });

      await Promise.all([get().fetchAgentStats(), get().fetchDashboard()]);

      set({
        agentStatus: response.data.data.agent.status,
        loading: false
      });
    } catch (err: any) {
      const raw = err.response?.data?.message || "Failed to submit deposit";
      const message = raw.includes("already been used")
        ? "This deposit was already applied. Each transaction can only be used once."
        : raw;
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  createWithdrawalRequest: async (amountUsd: number) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post("/agents/withdraw-request", {
        amount_usd: amountUsd
      });

      // Refresh dashboard to update available capacity
      await get().fetchDashboard();

      set({ loading: false });
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to create withdrawal request";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  fetchWithdrawalRequests: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.get("/agents/withdraw-requests");
      set({ withdrawalRequests: data.data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchDepositHistory: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.get("/agents/deposit-history");
      set({ depositHistory: data.data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchReviews: async (agentId: string) => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.get(`/agents/${agentId}/reviews`);
      set({ reviews: data.data.reviews || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  respondToReview: async (reviewId: string, response: string) => {
    set({ loading: true, error: null });
    try {
      await apiClient.post(`/agents/review/${reviewId}/respond`, { response });
      // Refresh reviews
      const state = get();
      if (state.stats) {
        // We need the agent ID to refresh reviews. 
        // Assuming we are viewing our own reviews, we can get ID from profile/stats if available, 
        // or we might need to store currentAgentId separately.
        // For now, let's assume the caller will handle refresh or we use the ID from the review if possible.
        // Better approach: Just update the local state for immediate feedback
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.id === reviewId
              ? { ...r, agent_response: response, agent_response_at: new Date().toISOString() }
              : r
          ),
          loading: false
        }));
      } else {
        set({ loading: false });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  submitReview: async (payload) => {
    set({ loading: true, error: null });
    try {
      await apiClient.post(API_ENDPOINTS.AGENTS.REVIEW, payload);
      set({ loading: false });
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Failed to submit review. Please try again.";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },
}));
