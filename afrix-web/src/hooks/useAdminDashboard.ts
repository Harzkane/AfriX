import { useState, useEffect } from "react";
import api from "@/lib/api";

interface DashboardData {
    users: {
        total: number;
        active: number;
        suspended: number;
        recent_30d: number;
        growth_history: Array<{ name: string; users: number }>;
    };
    agents: {
        total: number;
        active: number;
        pending: number;
        verified: number;
        tier_distribution: Array<{ name: string; value: number }>;
    };
    transactions: {
        total: number;
        completed: number;
        pending: number;
        failed: number;
        recent_24h: number;
        total_fees: string;
        volume_history: Array<{ name: string; transactions: number; activity: number }>;
        status_distribution: Array<{ name: string; value: number; color: string }>;
    };
    wallets: {
        total_wallets: number;
        active: number;
        frozen: number;
        total_tvl: string;
        tvl_by_token: Record<string, { total_balance: string; wallet_count: number }>;
        token_distribution: Array<{ name: string; value: number; color: string }>;
    };
    disputes: {
        total: number;
        open: number;
        resolved: number;
        critical: number;
    };
    escrows: {
        total: number;
        active: number;
        expired: number;
    };
    requests: {
        total: number;
        pending_mint: number;
        pending_burn: number;
        pending_total: number;
    };
    security: {
        locked_accounts: number;
        unverified_emails: number;
        failed_login_attempts: number;
        flagged_transactions: number;
        total_alerts: number;
    };
    pending: {
        kyc_approvals: number;
        withdrawals: number;
        critical_disputes: number;
        expired_escrows: number;
        flagged_transactions: number;
        total: number;
    };
    platform_fee_balances?: {
        NT: number;
        CT: number;
        USDT: number;
    };
    lastUpdated: string;
}

interface UseDashboardReturn extends DashboardData {
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useAdminDashboard(): UseDashboardReturn {
    const [data, setData] = useState<DashboardData>({
        users: {
            total: 0,
            active: 0,
            suspended: 0,
            recent_30d: 0,
            growth_history: []
        },
        agents: {
            total: 0,
            active: 0,
            pending: 0,
            verified: 0,
            tier_distribution: []
        },
        transactions: {
            total: 0,
            completed: 0,
            pending: 0,
            failed: 0,
            recent_24h: 0,
            total_fees: "0.00",
            volume_history: [],
            status_distribution: []
        },
        wallets: {
            total_wallets: 0,
            active: 0,
            frozen: 0,
            total_tvl: "0.00",
            tvl_by_token: {},
            token_distribution: []
        },
        disputes: {
            total: 0,
            open: 0,
            resolved: 0,
            critical: 0
        },
        escrows: {
            total: 0,
            active: 0,
            expired: 0
        },
        requests: {
            total: 0,
            pending_mint: 0,
            pending_burn: 0,
            pending_total: 0
        },
        security: {
            locked_accounts: 0,
            unverified_emails: 0,
            failed_login_attempts: 0,
            flagged_transactions: 0,
            total_alerts: 0
        },
        pending: {
            kyc_approvals: 0,
            withdrawals: 0,
            critical_disputes: 0,
            expired_escrows: 0,
            flagged_transactions: 0,
            total: 0
        },
        platform_fee_balances: { NT: 0, CT: 0, USDT: 0 },
        lastUpdated: new Date().toISOString()
    });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await api.get("/admin/dashboard/overview");

            if (response.data.success) {
                setData(response.data.data);
            } else {
                throw new Error("Failed to fetch dashboard data");
            }
        } catch (err: any) {
            console.error("Failed to fetch dashboard:", err);
            setError(err.message || "Failed to load dashboard data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    return {
        ...data,
        isLoading,
        error,
        refresh: fetchDashboard
    };
}
