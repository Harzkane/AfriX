// src/stores/slices/mintRequestSlice.ts
import { create } from "zustand";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/api";
import type { MintRequestState } from "@/stores/types/mintRequest.types";

export const useMintRequestStore = create<MintRequestState>()((set, get) => ({
  currentRequest: null,
  loading: false,
  error: null,

  createMintRequest: async (agentId, amount, tokenType) => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post(
        API_ENDPOINTS.REQUESTS.MINT.CREATE,
        {
          agent_id: agentId,
          amount,
          token_type: tokenType,
        }
      );
      const request = data.data;
      set({ currentRequest: request, loading: false });
      return request;
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Failed to create mint request";

      // For self-transaction errors, don't set global error state
      // Let the component handle it with a friendly modal
      if (!message.includes("cannot create mint requests to themselves")) {
        set({ error: message, loading: false });
      } else {
        set({ loading: false });
      }

      throw new Error(message);
    }
  },

  uploadProof: async (requestId, imageUri) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("proof", {
        uri: imageUri,
        type: "image/jpeg",
        name: "payment-proof.jpg",
      } as any);

      const { data } = await apiClient.post(
        API_ENDPOINTS.REQUESTS.MINT.UPLOAD_PROOF(requestId),
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      set({ currentRequest: data.data, loading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to upload proof";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  checkStatus: async (requestId) => {
    try {
      const { data } = await apiClient.get(
        API_ENDPOINTS.REQUESTS.MINT.STATUS(requestId)
      );
      set({ currentRequest: data.data });
    } catch (err: any) {
      console.error("Failed to check status:", err);
    }
  },

  fetchCurrentRequest: async () => {
    try {
      // Assuming there's an endpoint to get the latest pending request
      // If not, we might need to list requests and filter
      const { data } = await apiClient.get(API_ENDPOINTS.REQUESTS.LIST);
      if (data.success && data.data.length > 0) {
        // Find the most recent active request
        const activeRequest = data.data.find((req: any) =>
          ["pending", "proof_submitted"].includes(req.status.toLowerCase())
        );
        if (activeRequest) {
          set({ currentRequest: activeRequest });
        }
      }
    } catch (err) {
      console.log("No active mint request found or failed to fetch");
    }
  },

  openDispute: async (requestId, reason, details) => {
    set({ loading: true, error: null });
    try {
      const { currentRequest } = get();
      if (!currentRequest) throw new Error("No active request found");

      const payload: any = {
        reason,
        details,
        agentId: currentRequest.agent_id,
      };

      if (currentRequest.escrow_id) {
        payload.escrowId = currentRequest.escrow_id;
      } else {
        payload.mintRequestId = currentRequest.id;
      }

      await apiClient.post("/disputes", payload);
      await get().checkStatus(requestId);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  clearRequest: () => set({ currentRequest: null }),
  clearError: () => set({ error: null }),
}));
