// src/stores/slices/walletSlice.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/api";
import type { WalletState } from "@/stores/types/wallet.types";

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallets: [],
      exchangeRates: {
        USDT_TO_NT: 1500, // Default fallback
        USDT_TO_CT: 565,  // Default fallback
      },
      loading: false,
      error: null,

      fetchWallets: async () => {
        set({ loading: true, error: null });
        try {
          console.log("📡 Fetching wallets...");
          const { data } = await apiClient.get(API_ENDPOINTS.WALLETS.LIST);
          console.log("✅ Wallets fetched:", data.data.length);
          set({ wallets: data.data, loading: false });
        } catch (err: any) {
          const errorMsg =
            err.response?.data?.message || "Failed to fetch wallets";
          console.error("❌ Wallet fetch error:", errorMsg);

          // Don't set error for 401 (just means not authenticated)
          if (err.response?.status !== 401) {
            set({ error: errorMsg, loading: false });
          } else {
            set({ loading: false });
          }
        }
      },

      fetchExchangeRates: async () => {
        try {
          // Fetch USDT -> NT
          const ntRes = await apiClient.get("/wallets/rates", {
            params: { from: "USDT", to: "NT" },
          });

          // Fetch USDT -> CT
          const ctRes = await apiClient.get("/wallets/rates", {
            params: { from: "USDT", to: "CT" },
          });

          if (ntRes.data.success && ctRes.data.success) {
            set((state) => ({
              exchangeRates: {
                ...state.exchangeRates,
                USDT_TO_NT: ntRes.data.data.rate,
                USDT_TO_CT: ctRes.data.data.rate,
              },
            }));
          }
        } catch (error) {
          console.error("Failed to fetch exchange rates:", error);
          // Keep default/previous rates on error
        }
      },

      getWalletByType: (tokenType: string) => {
        const { wallets } = get();
        return wallets.find((w) => w.token_type === tokenType);
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "wallet-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ wallets: state.wallets }),
    }
  )
);
