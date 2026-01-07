// src/stores/slices/transferSlice.ts
import { StateCreator } from "zustand";
import apiClient from "@/services/apiClient";

export interface TransferState {
    // Transfer data
    recipientEmail: string | null;
    recipientName: string | null;
    tokenType: "NT" | "CT" | "USDT";
    amount: string;
    note: string;
    fee: number;

    // UI state
    loading: boolean;
    error: string | null;

    // Actions
    setRecipient: (email: string, name?: string) => void;
    setTokenType: (type: "NT" | "CT" | "USDT") => void;
    setAmount: (amount: string) => void;
    setNote: (note: string) => void;
    calculateFee: () => void;
    executeTransfer: () => Promise<void>;
    reset: () => void;
}

export const createTransferSlice: StateCreator<TransferState> = (set, get) => ({
    // Initial state
    recipientEmail: null,
    recipientName: null,
    tokenType: "NT",
    amount: "",
    note: "",
    fee: 0,
    loading: false,
    error: null,

    // Actions
    setRecipient: (email, name) => {
        set({ recipientEmail: email, recipientName: name, error: null });
    },

    setTokenType: (type) => {
        set({ tokenType: type });
        get().calculateFee();
    },

    setAmount: (amount) => {
        set({ amount });
        get().calculateFee();
    },

    setNote: (note) => {
        set({ note });
    },

    calculateFee: () => {
        const { amount } = get();
        if (!amount || parseFloat(amount) <= 0) {
            set({ fee: 0 });
            return;
        }

        // Fee is 0.5% of the amount (as per roadmap)
        const feeAmount = parseFloat(amount) * 0.005;
        set({ fee: feeAmount });
    },

    executeTransfer: async () => {
        const { recipientEmail, amount, tokenType, note } = get();

        if (!recipientEmail || !amount || parseFloat(amount) <= 0) {
            set({ error: "Please fill in all required fields" });
            return;
        }

        set({ loading: true, error: null });

        try {
            const response = await apiClient.post("/wallets/transfer", {
                to_email: recipientEmail,
                amount: parseFloat(amount),
                token_type: tokenType,
                description: note || undefined,
            });

            if (response.data.success) {
                // Transfer successful
                console.log("✅ Transfer successful:", response.data.data);
                set({ loading: false });
                // Reset will be called from the success screen
            } else {
                throw new Error(response.data.message || "Transfer failed");
            }
        } catch (error: any) {
            console.error("❌ Transfer failed:", error);
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                "Failed to complete transfer";
            set({ error: errorMessage, loading: false });
            throw error;
        }
    },

    reset: () => {
        set({
            recipientEmail: null,
            recipientName: null,
            tokenType: "NT",
            amount: "",
            note: "",
            fee: 0,
            loading: false,
            error: null,
        });
    },
});

// Create and export the store
import { create } from "zustand";

export const useTransferStore = create<TransferState>()(createTransferSlice);
