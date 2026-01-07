// src/stores/types/wallet.types.ts
export interface Wallet {
  id: string;
  user_id: string;
  token_type: "NT" | "CT" | "USDT";
  balance: string;
  pending_balance: string;
  available_balance: string;
  blockchain_address: string;
  is_active: boolean;
  is_frozen: boolean;
  total_received: string;
  total_sent: string;
  transaction_count: number;
  created_at: string;
  updated_at: string;
}

export interface WalletState {
  wallets: Wallet[];
  exchangeRates: {
    USDT_TO_NT: number;
    USDT_TO_CT: number;
  };
  loading: boolean;
  error: string | null;
  fetchWallets: () => Promise<void>;
  fetchExchangeRates: () => Promise<void>;
  getWalletByType: (tokenType: string) => Wallet | undefined;
  clearError: () => void;
}
