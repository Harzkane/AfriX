"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

export interface AgentStats {
    agent_counts: {
        total: number;
        active: number;
        pending: number;
        suspended: number;
    };
    kyc_stats: {
        verified: number;
        pending_review: number;
    };
    financial_summary: {
        total_deposits_usd: string;
        total_tokens_minted: string;
        total_tokens_burned: string;
        outstanding_tokens: string;
    };
}

/** KYC document URLs from backend (AgentKyc model) */
export interface AgentKycData {
    id: string;
    status: string;
    submitted_at: string;
    reviewed_at?: string | null;
    rejection_reason?: string | null;
    full_legal_name?: string | null;
    date_of_birth?: string | null;
    id_document_type?: string | null;
    id_document_number?: string | null;
    nationality?: string | null;
    residential_address?: string | null;
    risk_level?: string | null;
    id_document_url?: string | null;
    selfie_url?: string | null;
    proof_of_address_url?: string | null;
    business_registration_url?: string | null;
}

export interface Agent {
    id: string;
    user_id: string;
    status: string;
    tier: string;
    country: string;
    currency?: string;
    deposit_usd: number;
    available_capacity: number;
    total_minted: number;
    total_burned: number;
    total_earnings?: number | string;
    commission_rate?: number;
    rating: number | string;
    response_time_minutes?: number;
    is_verified: boolean;
    withdrawal_address?: string;
    phone_number?: string | null;
    whatsapp_number?: string | null;
    bank_name?: string | null;
    account_number?: string | null;
    account_name?: string | null;
    /** XOF countries: Orange Money, Wave, Kiren Money, Moov Money, etc. */
    mobile_money_provider?: string | null;
    mobile_money_number?: string | null;
    created_at: string;
    user: {
        id: string;
        full_name: string;
        email: string;
        phone_number?: string | null;
        country_code?: string | null;
        created_at?: string;
        wallets?: Array<{ token_type: string; balance: string }>;
    };
    kyc?: AgentKycData | null;
    financial_summary?: {
        outstanding_tokens?: number;
        outstanding_usdt?: number;
        max_withdrawable: number;
        utilization_percentage: string;
        liquidity_nt?: number;
        liquidity_ct?: number;
        total_revenue?: number;
    };
    /** USDT totals from Transaction table (admin & agent app) */
    total_minted_usdt?: number;
    total_burned_usdt?: number;
    total_earnings_usdt?: number;
    total_minted_by_token?: { NT: number; CT: number; USDT: number };
    total_burned_by_token?: { NT: number; CT: number; USDT: number };
    total_earnings_by_token?: { NT: number; CT: number; USDT: number };
    total_minted_by_token_usdt?: { NT: number; CT: number; USDT: number };
    total_burned_by_token_usdt?: { NT: number; CT: number; USDT: number };
    total_earnings_by_token_usdt?: { NT: number; CT: number; USDT: number };
}

export function useAgents() {
    const [stats, setStats] = useState<AgentStats | null>(null);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
    const [pagination, setPagination] = useState<{ total: number; limit: number; offset: number; has_more?: boolean }>({ total: 0, limit: 50, offset: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get("/admin/agents/stats");
            setStats(res.data.data);
        } catch (err: any) {
            console.error("Failed to fetch agent stats:", err);
        }
    }, []);

    const fetchAgents = useCallback(async (params: any = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/admin/agents", { params });
            setAgents(res.data.data);
            if (res.data.pagination) {
                setPagination(res.data.pagination);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load agents");
            toast.error("Failed to load agents");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchAgent = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get(`/admin/agents/${id}`);
            setCurrentAgent(res.data.data);
            return res.data.data;
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load agent");
            toast.error("Failed to load agent details");
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const approveKyc = async (id: string) => {
        try {
            await api.post(`/admin/agents/${id}/approve-kyc`);
            toast.success("Agent KYC approved");
            await fetchAgent(id);
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to approve KYC");
            throw err;
        }
    };

    const rejectKyc = async (id: string, reason: string) => {
        try {
            await api.post(`/admin/agents/${id}/reject-kyc`, { reason });
            toast.success("Agent KYC rejected");
            await fetchAgent(id);
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to reject KYC");
            throw err;
        }
    };

    const suspendAgent = async (id: string, reason: string) => {
        try {
            await api.post(`/admin/agents/${id}/suspend`, { reason });
            toast.success("Agent suspended");
            await fetchAgent(id);
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to suspend agent");
            throw err;
        }
    };

    const activateAgent = async (id: string) => {
        try {
            await api.post(`/admin/agents/${id}/activate`);
            toast.success("Agent activated");
            await fetchAgent(id);
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to activate agent");
            throw err;
        }
    };

    return {
        stats,
        agents,
        currentAgent,
        pagination,
        isLoading,
        error,
        fetchStats,
        fetchAgents,
        fetchAgent,
        approveKyc,
        rejectKyc,
        suspendAgent,
        activateAgent
    };
}
