"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

export interface UserStats {
    user_counts: {
        total: number;
        by_role: { regular: number; agents: number; merchants: number; admins: number; };
        recent_registrations_30d: number;
    };
    verification_stats: {
        email_verified: number;
        phone_verified: number;
        identity_verified: number;
    };
    account_status: {
        active: number;
        suspended: number;
        locked: number;
    };
    wallet_stats: {
        total_wallets: number;
        active: number;
        frozen: number;
    };
}

export interface UserWallet {
    id: string;
    token_type: string;
    balance: string;
    pending_balance?: string;
    total_received?: string;
    total_sent?: string;
    transaction_count?: number;
    is_frozen: boolean;
    frozen_reason?: string | null;
    created_at?: string;
}

export interface UserAgentSummary {
    id: string;
    status: string;
    tier: string;
    deposit_usd: number;
    available_capacity: number;
    rating: number;
    is_verified: boolean;
}

export interface UserMerchantSummary {
    id: string;
    business_name: string;
    verification_status: string;
    created_at: string;
}

export interface User {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string | null;
    country_code: string;
    country?: string;
    role: string;
    email_verified: boolean;
    phone_verified: boolean;
    identity_verified: boolean;
    verification_level: number;
    is_active: boolean;
    is_suspended: boolean;
    last_login_at?: string | null;
    last_login_ip?: string | null;
    created_at: string;
    updated_at?: string;
    wallets?: UserWallet[];
    transaction_summary?: {
        total_transactions: number;
        total_sent: number;
        total_received: number;
    };
    agent?: UserAgentSummary | null;
    merchant?: UserMerchantSummary | null;
    suspended_until?: string | null;
    suspension_reason?: string | null;
    /** Security */
    two_factor_enabled?: boolean;
    login_attempts?: number;
    locked_until?: string | null;
    last_unlocked_at?: string | null;
    last_unlocked_by_id?: string | null;
    last_unlocked_by?: { id: string; full_name: string } | null;
    last_reset_attempts_at?: string | null;
    last_reset_attempts_by_id?: string | null;
    last_reset_attempts_by?: { id: string; full_name: string } | null;
    /** Preferences */
    language?: string;
    theme?: string;
    push_notifications_enabled?: boolean;
    email_notifications_enabled?: boolean;
    sms_notifications_enabled?: boolean;
    /** Referral */
    referral_code?: string | null;
    referred_by?: string | null;
    /** Education progress */
    education_what_are_tokens?: boolean;
    education_how_agents_work?: boolean;
    education_understanding_value?: boolean;
    education_safety_security?: boolean;
}

export function useUsers() {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0, has_more: false });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get("/admin/users/stats");
            setStats(res.data.data);
        } catch (err: any) {
            console.error("Failed to fetch user stats:", err);
        }
    }, []);

    const fetchUsers = useCallback(async (params: any = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/admin/users", { params });
            setUsers(res.data.data);
            setPagination(res.data.pagination);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load users");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchUser = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get(`/admin/users/${id}`);
            setCurrentUser(res.data.data);
            return res.data.data;
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load user");
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const suspendUser = async (id: string, reason: string, durationDays?: number) => {
        try {
            await api.post(`/admin/users/${id}/suspend`, { reason, duration_days: durationDays });
            toast.success("User suspended successfully");
            await fetchUser(id);
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to suspend user");
            throw err;
        }
    };

    const unsuspendUser = async (id: string) => {
        try {
            await api.post(`/admin/users/${id}/unsuspend`);
            toast.success("User unsuspended successfully");
            await fetchUser(id);
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to unsuspend user");
            throw err;
        }
    };

    const verifyEmail = async (id: string) => {
        try {
            await api.post(`/admin/users/${id}/verify-email`);
            toast.success("Email verified manually");
            await fetchUser(id);
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to verify email");
            throw err;
        }
    };

    const creditWallet = async (id: string, data: { amount: number, token_type: string, description: string }) => {
        try {
            await api.post(`/admin/users/${id}/credit-wallet`, data);
            toast.success("Wallet credited successfully");
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to credit wallet");
            throw err;
        }
    };

    const debitWallet = async (id: string, data: { amount: number, token_type: string, description: string }) => {
        try {
            await api.post(`/admin/users/${id}/debit-wallet`, data);
            toast.success("Wallet debited successfully");
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to debit wallet");
            throw err;
        }
    };

    const freezeWallet = async (id: string, tokenType: string, reason: string) => {
        try {
            await api.post(`/admin/users/${id}/freeze-wallet`, { token_type: tokenType, reason });
            toast.success(`${tokenType} wallet frozen`);
            await fetchUser(id);
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to freeze wallet");
            throw err;
        }
    };

    const unfreezeWallet = async (id: string, tokenType: string) => {
        try {
            await api.post(`/admin/users/${id}/unfreeze-wallet`, { token_type: tokenType });
            toast.success(`${tokenType} wallet unfrozen`);
            await fetchUser(id);
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to unfreeze wallet");
            throw err;
        }
    };

    return {
        stats,
        users,
        currentUser,
        pagination,
        isLoading,
        error,
        fetchStats,
        fetchUsers,
        fetchUser,
        suspendUser,
        unsuspendUser,
        verifyEmail,
        creditWallet,
        debitWallet,
        freezeWallet,
        unfreezeWallet
    };
}
