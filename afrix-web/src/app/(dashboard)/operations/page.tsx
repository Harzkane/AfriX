"use client";

import { useOperations } from "@/hooks/useOperations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Lock, FileText, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OperationsPage() {
    const { stats } = useOperations();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Operations Center</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage disputes, escrows, and pending requests
                    </p>
                </div>
            </div>

            {/* Critical Alerts */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-red-500/50 bg-red-500/5">
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            Urgent Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="text-2xl font-bold">
                            {(stats?.escrows.expired_needs_action || 0) + (stats?.disputes.escalated || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats?.escrows.expired_needs_action || 0} expired escrows, {stats?.disputes.escalated || 0} escalated disputes
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-yellow-500/50 bg-yellow-500/5">
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-600">
                            <AlertCircle className="h-4 w-4" />
                            Open Disputes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="text-2xl font-bold">{stats?.disputes.open || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats?.disputes.recent_7_days || 0} new in last 7 days
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-blue-500/50 bg-blue-500/5">
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-600">
                            <Lock className="h-4 w-4" />
                            Locked Escrows
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="text-2xl font-bold">{stats?.escrows.locked || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            ${parseFloat(stats?.escrows.total_value_locked || "0").toLocaleString()} TVL
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Dispute Stats */}
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">Total Disputes</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="text-2xl font-bold">{stats?.disputes.total_disputes || 0}</div>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                                {stats?.disputes.resolved || 0} Resolved
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Escrow Stats */}
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">Total Escrows</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="text-2xl font-bold">{stats?.escrows.total_escrows || 0}</div>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                                {stats?.escrows.completed || 0} Completed
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Mint Requests */}
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">Mint Requests</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="text-2xl font-bold">{stats?.requests.mint_requests.total || 0}</div>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs bg-yellow-500/10">
                                {stats?.requests.mint_requests.pending || 0} Pending
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Burn Requests */}
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">Burn Requests</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="text-2xl font-bold">{stats?.requests.burn_requests.total || 0}</div>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs bg-yellow-500/10">
                                {stats?.requests.burn_requests.pending || 0} Pending
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Jump to critical operations</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-3">
                        <Link href="/operations/disputes">
                            <Button variant="outline" className="w-full justify-start">
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Manage Disputes
                            </Button>
                        </Link>
                        <Link href="/operations/escrows">
                            <Button variant="outline" className="w-full justify-start">
                                <Lock className="mr-2 h-4 w-4" />
                                Monitor Escrows
                            </Button>
                        </Link>
                        <Link href="/operations/requests">
                            <Button variant="outline" className="w-full justify-start">
                                <FileText className="mr-2 h-4 w-4" />
                                Review Requests
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
