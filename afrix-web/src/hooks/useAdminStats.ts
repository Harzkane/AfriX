import { useState, useEffect } from "react";
import api from "@/lib/api";

interface AdminStats {
    users: {
        total: number;
        active: number;
    };
    agents: {
        total: number;
        active: number;
    };
    transactions: {
        total: number;
        pending: number;
    };
    disputes: {
        open: number;
    };
    volumeHistory: Array<{ name: string; transactions: number; activity: number }>;
    statusDistribution: Array<{ name: string; value: number; color: string }>;
    isLoading: boolean;
    error: string | null;
}

export function useAdminStats() {
    const [stats, setStats] = useState<AdminStats>({
        users: { total: 0, active: 0 },
        agents: { total: 0, active: 0 },
        transactions: { total: 0, pending: 0 },
        disputes: { open: 0 },
        volumeHistory: [],
        statusDistribution: [],
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [usersRes, agentsRes, txRes, dispRes] = await Promise.all([
                    api.get("/admin/users/stats"),
                    api.get("/admin/agents/stats"),
                    api.get("/admin/financial/transactions/stats"),
                    api.get("/admin/operations/disputes/stats"),
                ]);

                const txData = txRes.data.data;

                setStats({
                    users: {
                        total: usersRes.data.data.user_counts.total,
                        active: usersRes.data.data.account_status?.active || 0,
                    },
                    agents: {
                        total: agentsRes.data.data.agent_counts.total,
                        active: agentsRes.data.data.agent_counts.active,
                    },
                    transactions: {
                        total: txData.total_transactions,
                        pending: txData.by_status.pending,
                    },
                    disputes: {
                        open: dispRes.data.data.open,
                    },
                    volumeHistory: txData.volume_history || [],
                    statusDistribution: txData.status_distribution || [],
                    isLoading: false,
                    error: null,
                });
            } catch (err: any) {
                console.error("Failed to fetch admin stats:", err);
                setStats((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: err.message || "Failed to load statistics",
                }));
            }
        };

        fetchStats();
    }, []);

    return stats;
}
