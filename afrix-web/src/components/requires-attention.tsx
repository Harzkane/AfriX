"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, UserCheck, DollarSign, AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";

interface RequiresAttentionProps {
    pending: {
        kyc_approvals: number;
        withdrawals: number;
        critical_disputes: number;
        expired_escrows: number;
        flagged_transactions: number;
        total: number;
    };
}

export function RequiresAttention({ pending }: RequiresAttentionProps) {
    const items = [
        {
            icon: UserCheck,
            label: "Pending KYC Approvals",
            count: pending.kyc_approvals,
            severity: "high" as const,
            link: "/agents?status=pending"
        },
        {
            icon: AlertCircle,
            label: "Critical Disputes (Level 3)",
            count: pending.critical_disputes,
            severity: "critical" as const,
            link: "/disputes?level=3"
        },
        {
            icon: DollarSign,
            label: "Pending Withdrawal Requests",
            count: pending.withdrawals,
            severity: "medium" as const,
            link: "/withdrawals?status=pending"
        },
        {
            icon: Clock,
            label: "Expired Escrows",
            count: pending.expired_escrows,
            severity: "medium" as const,
            link: "/operations/escrows?expired=expired"
        },
        {
            icon: AlertTriangle,
            label: "Flagged Transactions (High)",
            count: pending.flagged_transactions,
            severity: "high" as const,
            link: "/financials/transactions?flagged=high"
        }
    ];

    const getSeverityColor = (severity: "critical" | "high" | "medium") => {
        switch (severity) {
            case "critical":
                return "text-red-600 bg-red-50 dark:bg-red-950/20";
            case "high":
                return "text-orange-600 bg-orange-50 dark:bg-orange-950/20";
            case "medium":
                return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20";
            default:
                return "text-blue-600 bg-blue-50 dark:bg-blue-950/20";
        }
    };

    const activeItems = items.filter(item => item.count > 0);

    if (activeItems.length === 0) {
        return (
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Requires Attention
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-lg">✅ All caught up! No pending items require attention.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Requires Attention
                    <span className="ml-auto text-sm font-normal text-muted-foreground">
                        {pending.total} {pending.total === 1 ? 'item' : 'items'}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {activeItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${getSeverityColor(item.severity)}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{item.label}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {item.count} {item.count === 1 ? 'item' : 'items'} pending
                                        </p>
                                    </div>
                                </div>
                                <Link href={item.link}>
                                    <Button variant="outline" size="sm">
                                        Review →
                                    </Button>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
