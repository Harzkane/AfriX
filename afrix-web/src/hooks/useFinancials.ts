import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export interface Transaction {
    id: string;
    reference: string;
    type: string;
    status: string;
    amount: string;
    fee: string;
    token_type: string;
    description?: string | null;
    metadata?: Record<string, unknown> | null;
    created_at: string;
    updated_at?: string;
    processed_at?: string | null;
    from_user_id?: string | null;
    to_user_id?: string | null;
    merchant_id?: string | null;
    agent_id?: string | null;
    from_wallet_id?: string | null;
    to_wallet_id?: string | null;
    network?: string | null;
    tx_hash?: string | null;
    block_number?: number | string | null;
    gas_fee?: string | number | null;
    fromUser?: { id: string; full_name: string; email: string; phone_number?: string };
    toUser?: { id: string; full_name: string; email: string; phone_number?: string };
    fromWallet?: { id: string; token_type: string; balance: string };
    toWallet?: { id: string; token_type: string; balance: string };
    merchant?: { id: string; business_name: string; display_name?: string };
    agent?: { id: string; tier: string; rating: number; deposit_usd?: number };
}

export interface Wallet {
    id: string;
    user_id: string;
    token_type: string;
    balance: string;
    pending_balance?: string;
    total_received?: string;
    total_sent?: string;
    transaction_count?: number;
    is_frozen: boolean;
    frozen_reason?: string | null;
    frozen_at?: string | null;
    is_active?: boolean;
    blockchain_address?: string;
    last_synced_at?: string | null;
    last_synced_block?: number | string | null;
    created_at?: string;
    updated_at?: string;
    user?: { id: string; full_name: string; email: string; phone_number?: string; is_suspended?: boolean };
}

export interface PlatformFeeBalances {
    NT: number;
    CT: number;
    USDT: number;
}

export interface FinancialStats {
    transactions: {
        total_transactions: number;
        by_status: {
            completed: number;
            pending: number;
            failed: number;
            refunded: number;
        };
        by_type: Record<string, { count: number; total_amount: string }>;
        total_fees_collected: string;
        recent_24h: number;
    };
    wallets: {
        total_wallets: number;
        active: number;
        frozen: number;
        balances_by_token: Record<string, { total_balance: string; wallet_count: number }>;
        top_wallets: Wallet[];
    };
}

export function useFinancials() {
    const [stats, setStats] = useState<FinancialStats | null>(null);
    const [platformFeeBalances, setPlatformFeeBalances] = useState<PlatformFeeBalances | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            const [txStatsRes, walletStatsRes, platformFeesRes] = await Promise.all([
                api.get("/admin/financial/transactions/stats"),
                api.get("/admin/financial/wallets/stats"),
                api.get("/admin/financial/platform-fees/balances").catch(() => ({ data: { data: { balances: { NT: 0, CT: 0, USDT: 0 } } } })),
            ]);
            setStats({
                transactions: txStatsRes.data.data,
                wallets: walletStatsRes.data.data,
            });
            setPlatformFeeBalances(platformFeesRes.data?.data?.balances ?? { NT: 0, CT: 0, USDT: 0 });
        } catch (err: any) {
            console.error("Failed to fetch financial stats:", err);
            setError(err.message || "Failed to load financial statistics");
        }
    }, []);

    const fetchTransactions = useCallback(async (params: any = {}) => {
        setIsLoading(true);
        try {
            const res = await api.get("/admin/financial/transactions", { params });
            setTransactions(res.data.data);
            return res.data;
        } catch (err: any) {
            console.error("Failed to fetch transactions:", err);
            setError(err.message || "Failed to load transactions");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchWallets = useCallback(async (params: any = {}) => {
        setIsLoading(true);
        try {
            const res = await api.get("/admin/financial/wallets", { params });
            setWallets(res.data.data);
            return res.data;
        } catch (err: any) {
            console.error("Failed to fetch wallets:", err);
            setError(err.message || "Failed to load wallets");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            await fetchStats();
            setIsLoading(false);
        };
        init();
    }, [fetchStats]);

    const fetchTransaction = useCallback(async (id: string) => {
        try {
            const res = await api.get(`/admin/financial/transactions/${id}`);
            return res.data.data as Transaction;
        } catch (err: any) {
            console.error("Failed to fetch transaction:", err);
            return null;
        }
    }, []);

    const fetchWallet = useCallback(async (id: string) => {
        try {
            const res = await api.get(`/admin/financial/wallets/${id}`);
            return res.data.data as { wallet: Wallet; recent_transactions: Transaction[] };
        } catch (err: any) {
            console.error("Failed to fetch wallet:", err);
            return null;
        }
    }, []);

    const refundTransaction = useCallback(async (id: string, reason: string) => {
        try {
            await api.post(`/admin/financial/transactions/${id}/refund`, { reason });
            fetchStats();
            return true;
        } catch (err: any) {
            console.error("Failed to refund transaction:", err);
            throw err;
        }
    }, [fetchStats]);

    const flagTransaction = useCallback(async (id: string, reason: string, severity?: string) => {
        try {
            await api.post(`/admin/financial/transactions/${id}/flag`, { reason, severity: severity || "medium" });
            return true;
        } catch (err: any) {
            console.error("Failed to flag transaction:", err);
            throw err;
        }
    }, []);

    return {
        stats,
        platformFeeBalances,
        transactions,
        wallets,
        isLoading,
        error,
        fetchStats,
        fetchTransactions,
        fetchWallets,
        fetchTransaction,
        fetchWallet,
        refundTransaction,
        flagTransaction,
    };
}
