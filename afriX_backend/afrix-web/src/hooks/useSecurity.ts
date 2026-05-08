"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

export interface SecurityStats {
    failed_login_attempts: number;
    locked_accounts: number;
    suspended_accounts: number;
    recent_logins_24h: number;
    unverified_emails: number;
    users_by_country: { country: string; count: number }[];
}

export interface SecurityIssue {
    id: string;
    full_name: string;
    email: string;
    country_code: string;
    login_attempts: number;
    locked_until: string | null;
    is_suspended: boolean;
    suspension_reason: string | null;
    email_verified: boolean;
    last_login_at: string;
    created_at: string;
    last_unlocked_at?: string | null;
    last_unlocked_by_id?: string | null;
    last_unlocked_by?: { id: string; full_name: string } | null;
    last_reset_attempts_at?: string | null;
    last_reset_attempts_by_id?: string | null;
    last_reset_attempts_by?: { id: string; full_name: string } | null;
}

export interface SecurityIssuesPagination {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
}

const DEFAULT_PAGE_SIZE = 20;

export function useSecurity() {
    const [stats, setStats] = useState<SecurityStats | null>(null);
    const [issues, setIssues] = useState<SecurityIssue[]>([]);
    const [pagination, setPagination] = useState<SecurityIssuesPagination | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get("/admin/security/stats");
            setStats(res.data.data);
        } catch (err: any) {
            console.error("Failed to fetch security stats:", err);
            // Don't set error state for stats failures to avoid blocking UI
        }
    }, []);

    const fetchIssues = useCallback(async (params: any = {}, append = false) => {
        setIsLoading(true);
        setError(null);
        try {
            const limit = params.limit ?? DEFAULT_PAGE_SIZE;
            const offset = params.offset ?? 0;
            const res = await api.get("/admin/security/issues", { params: { ...params, limit, offset } });
            const data = res.data.data as SecurityIssue[];
            const pag = res.data.pagination as SecurityIssuesPagination;
            setPagination(pag ?? null);
            setIssues(append ? (prev) => [...prev, ...data] : data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load security issues");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const unlockAccount = async (userId: string) => {
        try {
            await api.post(`/admin/security/users/${userId}/unlock`);
            toast.success("Account unlocked successfully");
            await Promise.all([fetchStats(), fetchIssues()]); // Refresh data
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to unlock account");
            throw err;
        }
    };

    const resetLoginAttempts = async (userId: string) => {
        try {
            await api.post(`/admin/security/users/${userId}/reset-attempts`);
            toast.success("Login attempts reset");
            await Promise.all([fetchStats(), fetchIssues()]);
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to reset attempts");
            throw err;
        }
    };

    return {
        stats,
        issues,
        pagination,
        isLoading,
        error,
        fetchStats,
        fetchIssues,
        unlockAccount,
        resetLoginAttempts,
        DEFAULT_PAGE_SIZE,
    };
}
