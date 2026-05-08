"use client";

import { useDisputes, Dispute } from "@/hooks/useDisputes";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Loader2,
    AlertTriangle,
    CheckCircle2,
    ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Pagination } from "@/components/ui/pagination";

const VALID_TABS = new Set(["open", "escalated", "resolved", "all"]);

function DisputesPageContent() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get("tab");
    const startingTab = initialTab && VALID_TABS.has(initialTab) ? initialTab : "open";

    const {
        disputes,
        pagination,
        stats,
        isLoading,
        fetchStats,
        fetchDisputes
    } = useDisputes();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState(startingTab);
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 15;

    const getRawReference = (dispute: Dispute) =>
        (
            dispute.escrow?.transaction?.reference ||
            dispute.transaction_summary?.reference ||
            dispute.reference ||
            dispute.mintRequest?.user_bank_reference ||
            dispute.transaction_id ||
            dispute.id
        ).toString();

    const getDisplayReference = (dispute: Dispute) => {
        const fullReference = getRawReference(dispute);

        return fullReference.length > 18
            ? `${fullReference.slice(0, 8)}...${fullReference.slice(-4)}`
            : fullReference;
    };

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const queryParams = useMemo(() => {
        const params: Record<string, string | number> = {
            limit,
            offset: (currentPage - 1) * limit
        };

        if (activeTab === "open") params.status = "open";
        if (activeTab === "resolved") params.status = "resolved";
        if (activeTab === "escalated") params.escalation_level = "arbitration";

        return params;
    }, [activeTab, currentPage]);

    useEffect(() => {
        fetchDisputes(queryParams);
    }, [fetchDisputes, queryParams]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dispute Resolution</h1>
                    <p className="text-sm text-muted-foreground">Manage and arbitrate transaction disputes</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Disputes</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_disputes || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Cases</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.open || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Escalated</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.escalated || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.resolved || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs
                value={activeTab}
                onValueChange={(value) => {
                    setActiveTab(value);
                    setCurrentPage(1);
                }}
                className="space-y-4"
            >
                <TabsList>
                    <TabsTrigger value="open">Open Disputes</TabsTrigger>
                    <TabsTrigger value="escalated">Escalated</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved</TabsTrigger>
                    <TabsTrigger value="all">All History</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>User / Agent</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Opened</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                                                Loading disputes...
                                            </TableCell>
                                        </TableRow>
                                    ) : disputes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                No disputes found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        disputes.map((dispute) => (
                                            <TableRow key={dispute.id}>
                                                <TableCell className="font-mono text-sm" title={getRawReference(dispute)}>
                                                    {getDisplayReference(dispute)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{dispute.user?.full_name}</span>
                                                        <span className="text-xs text-muted-foreground">vs. {dispute.agent?.id ? `Agent (Tier ${dispute.agent.tier})` : "System"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {Number(
                                                        dispute.transaction_summary?.amount ??
                                                        dispute.escrow?.amount ??
                                                        dispute.mintRequest?.amount ??
                                                        0
                                                    ).toLocaleString()}{" "}
                                                    {dispute.transaction_summary?.token_type ||
                                                        dispute.escrow?.token_type ||
                                                        dispute.mintRequest?.token_type ||
                                                        ""}
                                                </TableCell>
                                                <TableCell>
                                                    {dispute.status === "open" && <Badge variant="secondary">Open</Badge>}
                                                    {dispute.status === "resolved" && <Badge className="bg-green-600">Resolved</Badge>}
                                                    {dispute.status === "escalated" && <Badge variant="destructive">Escalated</Badge>}
                                                    {dispute.escalation_level !== "auto" && <Badge variant="destructive" className="ml-2">{dispute.escalation_level}</Badge>}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {format(new Date(dispute.created_at), "MMM d, HH:mm")}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" onClick={() => router.push(`/disputes/${dispute.id}`)}>
                                                        Manage
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <div className="mt-4">
                        <Pagination
                            currentPage={currentPage}
                            totalCount={pagination?.total || 0}
                            limit={limit}
                            onPageChange={setCurrentPage}
                            isLoading={isLoading}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function DisputesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        }>
            <DisputesPageContent />
        </Suspense>
    );
}
