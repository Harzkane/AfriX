// src/stores/slices/burnSlice.ts
import { create } from "zustand";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/api";
import { BurnState, BurnRequestStatus } from "../types/burn.types";

export const useBurnStore = create<BurnState>((set, get) => ({
    requests: [],
    currentRequest: null,
    loading: false,
    error: null,

    createBurnRequest: async (data) => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.post(API_ENDPOINTS.REQUESTS.BURN.CREATE, data);
            const newRequest = response.data.data;

            set((state) => ({
                requests: [newRequest, ...state.requests],
                currentRequest: newRequest,
                loading: false,
            }));

            return newRequest;
        } catch (err: any) {
            const message = err.response?.data?.message || "Failed to create burn request";

            // For self-transaction errors, don't set global error state
            // Let the component handle it with a friendly modal
            if (!message.includes("cannot create burn requests to themselves")) {
                set({ error: message, loading: false });
            } else {
                set({ loading: false });
            }

            throw new Error(message);
        }
    },

    fetchBurnRequests: async () => {
        // TODO: Backend needs to implement GET /requests endpoint
        console.log("⏸️  Burn requests list disabled - waiting for backend endpoint");
        set({ loading: false });

        // Uncomment when backend is ready:
        // set({ loading: true, error: null });
        // try {
        //     const response = await apiClient.get(API_ENDPOINTS.REQUESTS.LIST);
        //     const allRequests = response.data.data || [];
        //     const burnRequests = allRequests.filter((r: any) => r.escrow_id !== undefined);
        //     set({ requests: burnRequests, loading: false });
        // } catch (err: any) {
        //     set({ error: err.message, loading: false });
        // }
    },

    fetchCurrentBurnRequest: async (requestId) => {
        const idToFetch = requestId || get().currentRequest?.id;

        if (!idToFetch) {
            console.log("⏸️  No burn request ID to fetch");
            set({ loading: false });
            return;
        }

        set({ loading: true, error: null });
        try {
            const response = await apiClient.get(API_ENDPOINTS.REQUESTS.BURN.STATUS(idToFetch));
            const updatedRequest = response.data.data;

            set({ currentRequest: updatedRequest, loading: false });
        } catch (err: any) {
            // Don't set global error for background fetch
            console.error("Failed to fetch current burn request:", err);
            set({ loading: false });
        }
    },

    /** Sets currentRequest from GET /requests/user: active burn or null. */
    fetchCurrentBurnRequestForUser: async () => {
        try {
            const { data } = await apiClient.get(API_ENDPOINTS.REQUESTS.USER);
            if (data.success && data.data?.length > 0) {
                const burnRequests = (data.data as any[]).filter((r: any) => r.type === "burn");
                const activeRequest = burnRequests.find((req: any) =>
                    ["pending", "escrowed", "fiat_sent"].includes((req.status || "").toLowerCase())
                );
                set({ currentRequest: activeRequest ?? null });
            } else {
                set({ currentRequest: null });
            }
        } catch (err) {
            console.log("No active burn request found or failed to fetch");
            set({ currentRequest: null });
        }
    },

    confirmFiatReceipt: async (requestId) => {
        set({ loading: true, error: null });
        try {
            await apiClient.post(API_ENDPOINTS.REQUESTS.BURN.CONFIRM, {
                request_id: requestId,
            });

            // Refresh the current request
            await get().fetchCurrentBurnRequest();
            set({ loading: false });
        } catch (err: any) {
            const message = err.response?.data?.message || "Failed to confirm receipt";
            set({ error: message, loading: false });
            throw new Error(message);
        }
    },

    openDispute: async (requestId, reason, details) => {
        set({ loading: true, error: null });
        try {
            const currentRequest = get().currentRequest;
            if (!currentRequest?.escrow_id) {
                throw new Error("No escrow ID found for this request");
            }

            await apiClient.post("/disputes", {
                escrowId: currentRequest.escrow_id,
                transactionId: requestId,
                reason,
                details,
            });

            // Refresh the current request to get updated status
            await get().fetchCurrentBurnRequest();
            set({ loading: false });
        } catch (err: any) {
            const message = err.response?.data?.message || "Failed to open dispute";
            set({ error: message, loading: false });
            throw new Error(message);
        }
    },

    clearError: () => set({ error: null }),
    resetCurrentRequest: () => set({ currentRequest: null }),
}));
