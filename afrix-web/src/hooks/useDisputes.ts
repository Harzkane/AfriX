"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

export interface Dispute {
    id: string;
    escrow_id: string;
    transaction_id: string;
    reason: string;
    details: string;
    status: 'open' | 'resolved';
    escalation_level: 'auto' | 'level_1' | 'level_2' | 'level_3';
    created_at: string;
    user?: {
        id: string;
        full_name: string;
        email: string;
    };
    agent?: {
        id: string;
        tier: string;
        rating: number;
    };
    mintRequest?: {
        id: string;
        payment_proof_url: string;
        status: string;
    };
    escrow?: {
        amount: number;
        token_type: string;
        status: string;
        burnRequest?: {
            id: string;
            fiat_proof_url: string;
            status: string;
        };
    };
    resolution?: {
        action: string;
        notes: string;
        resolved_by: string;
    }
}

export interface DisputeStats {
    total_disputes: number;
    open: number;
    resolved: number;
    escalated: number;
}

export function useDisputes() {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [currentDispute, setCurrentDispute] = useState<Dispute | null>(null);
    const [pagination, setPagination] = useState({ token: "", total: 0, limit: 15, offset: 0, has_more: false });
    const [stats, setStats] = useState<DisputeStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get("/admin/operations/disputes/stats");
            setStats(res.data.data);
        } catch (err) {
            console.error("Failed to fetch dispute stats", err);
        }
    }, []);

    const fetchDisputes = useCallback(async (params: any = {}) => {
        setIsLoading(true);
        setError(null);
        try {

            const res = await api.get("/admin/operations/disputes", { params });
            // API usage: /admin/operations/disputes returns { success: true, data: [...], count: number, pagination?: ... }
            setDisputes(res.data.data);
            setPagination({
                token: "",
                total: res.data.count || res.data.pagination?.total || 0,
                limit: params.limit || 15,
                offset: params.offset || 0,
                has_more: false
            });
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load disputes");
            toast.error("Failed to load disputes");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchDispute = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get(`/admin/operations/disputes/${id}`);
            setCurrentDispute(res.data.data);
            return res.data.data;
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load dispute");
            toast.error("Failed to load dispute details");
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const escalateDispute = async (id: string, level: string, notes: string) => {
        try {
            await api.post(`/admin/operations/disputes/${id}/escalate`, {
                escalation_level: level,
                notes
            });
            toast.success("Dispute escalated successfully");
            await fetchDispute(id);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to escalate dispute");
            throw err;
        }
    };

    const resolveDispute = async (id: string, action: string, notes: string, penaltyAmount?: number) => {
        try {
            await api.post(`/admin/operations/disputes/${id}/resolve`, {
                action,
                notes,
                penalty_amount_usd: penaltyAmount
            });
            toast.success("Dispute resolved successfully");
            await fetchDispute(id);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to resolve dispute");
            throw err;
        }
    };

    return {
        disputes,
        pagination,
        currentDispute,
        stats,
        isLoading,
        error,
        fetchStats,
        fetchDisputes,
        fetchDispute,
        escalateDispute,
        resolveDispute
    };
}
