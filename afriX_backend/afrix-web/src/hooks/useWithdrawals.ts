"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

// Types
export interface WithdrawalRequest {
    id: string;
    agent_id: string;
    amount_usd: string;
    status: string;
    paid_tx_hash?: string;
    admin_notes?: string;
    created_at: string;
    updated_at?: string;
    paid_at?: string;
    outstanding_tokens?: number;
    max_withdrawable?: number;
    is_safe?: boolean;
    agent?: {
        id: string;
        user_id: string;
        withdrawal_address: string;
        deposit_usd: number;
        total_minted: number;
        total_burned: number;
        available_capacity?: number;
        tier?: string;
        rating?: string | number;
    };
}

export interface WithdrawalStats {
    pending_count: number;
    approved_count: number;
    paid_count: number;
    total_paid_volume: number;
}

export function useWithdrawals() {
    const [stats, setStats] = useState<WithdrawalStats | null>(null);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [pendingWithdrawals, setPendingWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get("/admin/withdrawals/stats");
            setStats(res.data.data);
        } catch (err: any) {
            console.error("Failed to fetch withdrawal stats:", err);
            // Don't block UI on stats failure
        }
    }, []);

    // Fetch all withdrawals
    const fetchWithdrawals = useCallback(async (params: any = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/admin/withdrawals", { params });
            setWithdrawals(res.data.data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load withdrawals");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch pending withdrawals
    const fetchPending = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/admin/withdrawals/pending");
            setPendingWithdrawals(res.data.data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load pending withdrawals");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch single withdrawal (for detail page)
    const fetchWithdrawal = useCallback(async (id: string): Promise<WithdrawalRequest | null> => {
        try {
            const res = await api.get(`/admin/withdrawals/${id}`);
            return res.data.data as WithdrawalRequest;
        } catch (err: any) {
            console.error("Failed to fetch withdrawal:", err);
            return null;
        }
    }, []);

    // Actions
    const approveWithdrawal = async (requestId: string) => {
        try {
            await api.post("/admin/withdrawals/approve", { request_id: requestId });
            await Promise.all([fetchStats(), fetchPending(), fetchWithdrawals()]);
            return true;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || "Failed to approve withdrawal");
        }
    };

    const markPaid = async (requestId: string, txHash: string) => {
        try {
            await api.post("/admin/withdrawals/paid", { request_id: requestId, tx_hash: txHash });
            await Promise.all([fetchStats(), fetchPending(), fetchWithdrawals()]);
            return true;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || "Failed to mark as paid");
        }
    };

    const rejectWithdrawal = async (requestId: string, reason: string) => {
        try {
            await api.post("/admin/withdrawals/reject", { request_id: requestId, reason });
            await Promise.all([fetchStats(), fetchPending(), fetchWithdrawals()]);
            return true;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || "Failed to reject withdrawal");
        }
    };

    // Load initial data
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        stats,
        withdrawals,
        pendingWithdrawals,
        isLoading,
        error,
        fetchStats,
        fetchWithdrawals,
        fetchPending,
        fetchWithdrawal,
        approveWithdrawal,
        markPaid,
        rejectWithdrawal
    };
}
