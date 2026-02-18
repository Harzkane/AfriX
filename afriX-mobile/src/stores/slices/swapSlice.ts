// src/stores/slices/swapSlice.ts
import { StateCreator } from "zustand";
import { create } from "zustand";
import apiClient from "@/services/apiClient";

const SWAP_FEE_PERCENT = 1.5; // Platform fee for swaps

export interface SwapState {
    // Swap data
    fromToken: "NT" | "CT" | "USDT";
    toToken: "NT" | "CT" | "USDT";
    amount: string;
    estimatedReceive: string;
    exchangeRate: number;
    /** Platform fee (1.5% of amount) in source token */
    swapFee: number;

    // UI state
    loading: boolean;
    fetchingRate: boolean;
    error: string | null;
    /** Set after executeSwap from API response */
    lastFee?: number;
    lastReceivedAmount?: number;

    // Actions
    setFromToken: (token: "NT" | "CT" | "USDT") => void;
    setToToken: (token: "NT" | "CT" | "USDT") => void;
    setAmount: (amount: string) => void;
    swapTokens: () => void;
    fetchExchangeRate: () => Promise<void>;
    executeSwap: () => Promise<void>;
    reset: () => void;
}

export const createSwapSlice: StateCreator<SwapState> = (set, get) => ({
    // Initial state
    fromToken: "NT",
    toToken: "CT",
    amount: "",
    estimatedReceive: "0",
    exchangeRate: 1,
    swapFee: 0,
    loading: false,
    fetchingRate: false,
    error: null,

    // Actions
    setFromToken: (token) => {
        const { toToken } = get();
        // Prevent same token swap
        if (token === toToken) {
            set({ fromToken: token, toToken: token === "NT" ? "CT" : "NT" });
        } else {
            set({ fromToken: token });
        }
        get().fetchExchangeRate();
    },

    setToToken: (token) => {
        const { fromToken } = get();
        // Prevent same token swap
        if (token === fromToken) {
            set({ toToken: token, fromToken: token === "NT" ? "CT" : "NT" });
        } else {
            set({ toToken: token });
        }
        get().fetchExchangeRate();
    },

    setAmount: (amount) => {
        set({ amount });
        const { exchangeRate } = get();
        if (amount && parseFloat(amount) > 0) {
            const amt = parseFloat(amount);
            const fee = amt * (SWAP_FEE_PERCENT / 100);
            const afterFee = amt - fee;
            const estimated = (afterFee * exchangeRate).toFixed(2);
            set({ estimatedReceive: estimated, swapFee: fee });
        } else {
            set({ estimatedReceive: "0", swapFee: 0 });
        }
    },

    swapTokens: () => {
        const { fromToken, toToken } = get();
        set({ fromToken: toToken, toToken: fromToken });
        get().fetchExchangeRate();
    },

    fetchExchangeRate: async () => {
        const { fromToken, toToken } = get();

        if (fromToken === toToken) {
            set({ exchangeRate: 1, estimatedReceive: get().amount || "0" });
            return;
        }

        set({ fetchingRate: true, error: null });

        try {
            // Check if swap endpoint exists
            const response = await apiClient.get("/wallets/rates", {
                params: {
                    from: fromToken,
                    to: toToken,
                },
            });

            if (response.data.success) {
                const rate = response.data.data.rate || 1;
                set({ exchangeRate: rate, fetchingRate: false });

                // Recalculate estimated receive (after 1.5% platform fee)
                const { amount } = get();
                if (amount && parseFloat(amount) > 0) {
                    const amt = parseFloat(amount);
                    const fee = amt * (SWAP_FEE_PERCENT / 100);
                    const afterFee = amt - fee;
                    const estimated = (afterFee * rate).toFixed(2);
                    set({ estimatedReceive: estimated, swapFee: fee });
                }
            } else {
                throw new Error("Failed to fetch exchange rate");
            }
        } catch (error: any) {
            console.error("❌ Rate fetch failed:", error);

            // Fallback to 1:1 rate if endpoint doesn't exist
            if (error.response?.status === 404) {
                console.log("⚠️ Rates endpoint not found, using 1:1 rate");
                set({ exchangeRate: 1, fetchingRate: false });
                const { amount } = get();
                if (amount && parseFloat(amount) > 0) {
                    const amt = parseFloat(amount);
                    const fee = amt * (SWAP_FEE_PERCENT / 100);
                    set({ estimatedReceive: (amt - fee).toFixed(2), swapFee: fee });
                } else {
                    set({ estimatedReceive: amount || "0", swapFee: 0 });
                }
            } else {
                set({
                    error: error.response?.data?.message || "Failed to fetch rate",
                    fetchingRate: false,
                    exchangeRate: 1,
                });
            }
        }
    },

    executeSwap: async () => {
        const { fromToken, toToken, amount } = get();

        if (!amount || parseFloat(amount) <= 0) {
            set({ error: "Please enter a valid amount" });
            return;
        }

        if (fromToken === toToken) {
            set({ error: "Cannot swap same token" });
            return;
        }

        set({ loading: true, error: null });

        try {
            const response = await apiClient.post("/wallets/swap", {
                from_token: fromToken,
                to_token: toToken,
                amount: parseFloat(amount),
            });

            if (response.data.success) {
                const data = response.data.data;
                const fee = data?.fee != null ? parseFloat(String(data.fee)) : undefined;
                const received = data?.receivedAmount != null ? parseFloat(String(data.receivedAmount)) : undefined;
                set({ loading: false, lastFee: fee, lastReceivedAmount: received });
            } else {
                throw new Error(response.data.message || "Swap failed");
            }
        } catch (error: any) {
            console.error("❌ Swap failed:", error);
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                "Failed to complete swap";
            set({ error: errorMessage, loading: false });
            throw error;
        }
    },

    reset: () => {
        set({
            fromToken: "NT",
            toToken: "CT",
            amount: "",
            estimatedReceive: "0",
            exchangeRate: 1,
            swapFee: 0,
            loading: false,
            fetchingRate: false,
            error: null,
            lastFee: undefined,
            lastReceivedAmount: undefined,
        });
    },
});

// Create and export the store
export const useSwapStore = create<SwapState>()(createSwapSlice);
