"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

export interface EducationStats {
    total_users: number;
    completion_by_module: Record<string, {
        completed: number;
        in_progress: number;
        not_started: number;
        completion_rate: string;
    }>;
    average_performance: Record<string, {
        avg_attempts: string;
        avg_score: string;
    }>;
    recent_completions_7d: number;
    fully_educated_users: number;
    education_config: {
        required: boolean;
        pass_score: number;
        max_attempts: number;
    };
}

export interface EducationProgress {
    id: number;
    user_id: string;
    module: string;
    completed: boolean;
    attempts: number;
    score: number;
    completed_at: string | null;
    created_at: string;
    user: {
        id: string;
        full_name: string;
        email: string;
        country_code: string;
    };
}

export interface UserEducationSummary {
    total_modules: number;
    completed_modules: number;
    completion_percentage: string;
    can_mint: boolean;
    can_burn: boolean;
}

export interface UserProgressItem {
    id: number;
    user_id: string;
    module: string;
    completed: boolean;
    attempts: number;
    score: number;
    completed_at: string | null;
    created_at: string;
}

export interface UserEducationProgressResponse {
    user: { id: string; full_name: string; email: string };
    summary: UserEducationSummary;
    progress: UserProgressItem[];
    user_flags: Record<string, boolean>;
}

export interface EducationPagination {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
}

/** One row per user (education summary) */
export interface UserEducationSummaryRow {
    user_id: string;
    full_name: string;
    email: string;
    completed_modules: number;
    total_modules: number;
    completion_percentage: string;
    can_mint: boolean;
    can_burn: boolean;
}

const DEFAULT_PAGE_SIZE = 20;

export function useEducation() {
    const [stats, setStats] = useState<EducationStats | null>(null);
    const [progressList, setProgressList] = useState<EducationProgress[]>([]);
    const [userList, setUserList] = useState<UserEducationSummaryRow[]>([]);
    const [pagination, setPagination] = useState<EducationPagination | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get("/admin/education/stats");
            setStats(res.data.data);
        } catch (err: any) {
            console.error("Failed to fetch education stats:", err);
        }
    }, []);

    /** List users with education summary (one row per user). Use for main Education Center list. */
    const fetchUsersWithEducation = useCallback(async (params: any = {}, append = false) => {
        setIsLoading(true);
        setError(null);
        try {
            const limit = params.limit ?? DEFAULT_PAGE_SIZE;
            const offset = params.offset ?? 0;
            const res = await api.get("/admin/education/users", { params: { ...params, limit, offset } });
            const data = res.data.data as UserEducationSummaryRow[];
            const pag = res.data.pagination as EducationPagination;
            setPagination(pag ?? null);
            setUserList(append ? (prev) => [...prev, ...data] : data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load users");
            toast.error("Failed to load education list");
        } finally {
            setIsLoading(false);
        }
    }, []);

    /** List progress records (one row per user+module). Use for "by module" or legacy views. */
    const fetchProgress = useCallback(async (params: any = {}, append = false) => {
        setIsLoading(true);
        setError(null);
        try {
            const limit = params.limit ?? DEFAULT_PAGE_SIZE;
            const offset = params.offset ?? 0;
            const res = await api.get("/admin/education/progress", { params: { ...params, limit, offset } });
            const data = res.data.data as EducationProgress[];
            const pag = res.data.pagination as EducationPagination;
            setPagination(pag ?? null);
            setProgressList(append ? (prev) => [...prev, ...data] : data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load progress");
            toast.error("Failed to load education progress");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchUserProgress = useCallback(async (userId: string): Promise<UserEducationProgressResponse | null> => {
        try {
            const res = await api.get(`/admin/education/users/${userId}/progress`);
            return res.data.data as UserEducationProgressResponse;
        } catch (err: any) {
            console.error("Failed to fetch user education progress:", err);
            return null;
        }
    }, []);

    const resetUserProgress = async (userId: string, module?: string, reason: string = "Admin reset") => {
        try {
            await api.post(`/admin/education/users/${userId}/reset`, { module, reason });
            toast.success(module ? `Reset progress for ${module}` : "Reset all education progress");
            await Promise.all([fetchStats(), fetchProgress()]);
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to reset progress");
            throw err;
        }
    };

    const markComplete = async (userId: string, module: string, reason: string) => {
        try {
            await api.post(`/admin/education/users/${userId}/complete`, { module, reason });
            toast.success(`Module ${module.replace(/_/g, " ")} marked complete`);
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to mark complete");
            throw err;
        }
    };

    return {
        stats,
        progressList,
        userList,
        pagination,
        isLoading,
        error,
        fetchStats,
        fetchUsersWithEducation,
        fetchProgress,
        fetchUserProgress,
        resetUserProgress,
        markComplete,
        DEFAULT_PAGE_SIZE,
    };
}
