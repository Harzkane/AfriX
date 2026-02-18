"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

// Types
export interface Dispute {
    id: string;
    escrow_id: string;
    opened_by_user_id: string;
    agent_id: string;
    reason: string;
    status: string;
    escalation_level: string;
    resolution: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    escrow?: {
        id: string;
        amount: string;
        token_type: string;
        status: string;
        transaction?: { id: string; reference: string; type: string; amount: string; status: string };
    };
    user?: {
        id: string;
        full_name: string;
        email: string;
        phone_number?: string;
    };
    agent?: {
        id: string;
        tier: string;
        rating: string | number;
        deposit_usd?: number;
        available_capacity?: number;
    };
}

export interface Escrow {
    id: string;
    transaction_id: string;
    from_user_id: string;
    agent_id: string;
    amount: string;
    token_type: string;
    status: string;
    expires_at: string;
    created_at: string;
    transaction?: {
        id: string;
        reference: string;
        type: string;
        amount: string;
        status: string;
    };
    fromUser?: {
        id: string;
        full_name: string;
        email: string;
    };
    agent?: {
        id: string;
        tier: string;
        rating: string;
    };
}

export interface MintRequest {
    id: string;
    user_id: string;
    agent_id: string;
    amount: string;
    token_type: string;
    status: string;
    payment_proof_url?: string;
    user_bank_reference?: string;
    expires_at?: string;
    created_at: string;
    user?: {
        id: string;
        full_name: string;
        email: string;
        phone_number?: string;
    };
    agent?: {
        id: string;
        tier: string;
        rating: string;
        deposit_usd?: number;
    };
}

export interface BurnRequest {
    id: string;
    user_id: string;
    agent_id: string;
    escrow_id?: string;
    amount: string;
    token_type: string;
    status: string;
    fiat_proof_url?: string;
    agent_bank_reference?: string;
    user_bank_account?: Record<string, unknown>;
    expires_at?: string;
    created_at: string;
    user?: {
        id: string;
        full_name: string;
        email: string;
        phone_number?: string;
    };
    agent?: {
        id: string;
        tier: string;
        rating: string;
        deposit_usd?: number;
    };
    escrow?: {
        id: string;
        status: string;
        amount: string;
        token_type?: string;
        expires_at?: string;
        transaction_id?: string;
    };
}

interface OperationsStats {
    disputes: {
        total_disputes: number;
        open: number;
        resolved: number;
        escalated: number;
        resolved_with_action: number;
        recent_7_days: number;
    };
    escrows: {
        total_escrows: number;
        locked: number;
        completed: number;
        disputed: number;
        refunded: number;
        expired_needs_action: number;
        total_value_locked: string;
    };
    requests: {
        mint_requests: {
            total: number;
            pending: number;
            confirmed: number;
            expired: number;
        };
        burn_requests: {
            total: number;
            pending: number;
            confirmed: number;
            expired: number;
        };
    };
}

export function useOperations() {
    const [stats, setStats] = useState<OperationsStats | null>(null);
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [escrows, setEscrows] = useState<Escrow[]>([]);
    const [mintRequests, setMintRequests] = useState<MintRequest[]>([]);
    const [burnRequests, setBurnRequests] = useState<BurnRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all stats
    const fetchStats = useCallback(async () => {
        try {
            const [disputeRes, escrowRes, requestRes] = await Promise.all([
                api.get("/admin/operations/disputes/stats"),
                api.get("/admin/operations/escrows/stats"),
                api.get("/admin/operations/requests/stats"),
            ]);

            setStats({
                disputes: disputeRes.data.data,
                escrows: escrowRes.data.data,
                requests: requestRes.data.data,
            });
        } catch (err: any) {
            console.error("Failed to fetch operations stats:", err);
            setError(err.response?.data?.error || "Failed to load stats");
        }
    }, []);

    // Fetch disputes
    const fetchDisputes = useCallback(async (params: any = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/admin/operations/disputes", { params });
            setDisputes(res.data.data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load disputes");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch escrows
    const fetchEscrows = useCallback(async (params: any = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/admin/operations/escrows", { params });
            setEscrows(res.data.data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load escrows");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch mint requests
    const fetchMintRequests = useCallback(async (params: any = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/admin/operations/requests/mint", { params });
            setMintRequests(res.data.data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load mint requests");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch burn requests
    const fetchBurnRequests = useCallback(async (params: any = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/admin/operations/requests/burn", { params });
            setBurnRequests(res.data.data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load burn requests");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch single dispute
    const fetchDispute = useCallback(async (id: string) => {
        try {
            const res = await api.get(`/admin/operations/disputes/${id}`);
            return res.data.data as Dispute;
        } catch (err: any) {
            console.error("Failed to fetch dispute:", err);
            return null;
        }
    }, []);

    const escalateDispute = useCallback(async (id: string, escalation_level: string, notes?: string) => {
        await api.post(`/admin/operations/disputes/${id}/escalate`, { escalation_level, notes });
    }, []);

    const resolveDispute = useCallback(async (id: string, payload: { action: string; penalty_amount_usd?: number; notes?: string }) => {
        await api.post(`/admin/operations/disputes/${id}/resolve`, payload);
    }, []);

    // Fetch single escrow
    const fetchEscrow = useCallback(async (id: string) => {
        try {
            const res = await api.get(`/admin/operations/escrows/${id}`);
            return res.data.data as Escrow;
        } catch (err: any) {
            console.error("Failed to fetch escrow:", err);
            return null;
        }
    }, []);

    const forceFinalizeEscrow = useCallback(async (id: string, notes?: string) => {
        await api.post(`/admin/operations/escrows/${id}/force-finalize`, { notes });
    }, []);

    // Fetch single mint request
    const fetchMintRequest = useCallback(async (id: string) => {
        try {
            const res = await api.get(`/admin/operations/requests/mint/${id}`);
            return res.data.data as MintRequest;
        } catch (err: any) {
            console.error("Failed to fetch mint request:", err);
            return null;
        }
    }, []);

    // Fetch single burn request
    const fetchBurnRequest = useCallback(async (id: string) => {
        try {
            const res = await api.get(`/admin/operations/requests/burn/${id}`);
            return res.data.data as BurnRequest;
        } catch (err: any) {
            console.error("Failed to fetch burn request:", err);
            return null;
        }
    }, []);

    // Load stats on mount
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        stats,
        disputes,
        escrows,
        mintRequests,
        burnRequests,
        isLoading,
        error,
        fetchStats,
        fetchDisputes,
        fetchEscrows,
        fetchMintRequests,
        fetchBurnRequests,
        fetchDispute,
        escalateDispute,
        resolveDispute,
        fetchEscrow,
        forceFinalizeEscrow,
        fetchMintRequest,
        fetchBurnRequest,
    };
}
