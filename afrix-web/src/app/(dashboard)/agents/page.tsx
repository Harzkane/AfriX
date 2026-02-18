"use client";

import { useAgents } from "@/hooks/useAgents";
import { useEffect, useState } from "react";
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
    Briefcase,
    ShieldAlert,
    Wallet,
    UserCheck,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Pagination } from "@/components/ui/pagination";

export default function AgentsPage() {
    const {
        stats,
        agents,
        pagination,
        isLoading,
        fetchStats,
        fetchAgents
    } = useAgents();
    const paginationTotal = pagination?.total ?? 0;
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 15;

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        const params: any = {
            limit,
            offset: (currentPage - 1) * limit
        };
        if (activeTab === "pending_kyc") {
            params.status = "pending";
            params.verified = false;
        } else if (activeTab === "active") {
            params.status = "active";
        }
        fetchAgents(params);
    }, [activeTab, currentPage, fetchAgents]);

    // Reset to page 1 when tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const formatUsdt = (val: number | string | undefined) => {
        return `${Number(val ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Agent Management</h1>
                    <p className="text-sm text-muted-foreground">Oversee agent network, KYC, and liquidity</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.agent_counts.total || 0}</div>
                        <p className="text-xs text-muted-foreground">{stats?.agent_counts.active || 0} active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.kyc_stats.pending_review || 0}</div>
                        <p className="text-xs text-muted-foreground">Applications to review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatUsdt(stats?.financial_summary.total_deposits_usd)}</div>
                        <p className="text-xs text-muted-foreground">System-wide collateral</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Verified</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.kyc_stats.verified || 0}</div>
                        <p className="text-xs text-muted-foreground">Fully vetted agents</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="all" onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All Agents</TabsTrigger>
                    <TabsTrigger value="pending_kyc">Pending KYC</TabsTrigger>
                    <TabsTrigger value="active">Active Network</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Agent</TableHead>
                                        <TableHead>Tier & Location</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Liquidity</TableHead>
                                        <TableHead>Utilization</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                                                Loading agents...
                                            </TableCell>
                                        </TableRow>
                                    ) : agents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                No agents found in this category.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        agents.map((agent) => (
                                            <TableRow key={agent.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{agent.user.full_name}</span>
                                                        <span className="text-xs text-muted-foreground">{agent.user.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <Badge variant="outline" className="w-fit">{agent.tier}</Badge>
                                                        <span className="text-xs text-muted-foreground">{agent.country}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1 flex-col sm:flex-row">
                                                        {agent.status === "active" && <Badge className="bg-green-600">Active</Badge>}
                                                        {agent.status === "pending" && <Badge variant="secondary">Pending</Badge>}
                                                        {agent.status === "suspended" && <Badge variant="destructive">Suspended</Badge>}

                                                        {agent.is_verified ? (
                                                            <Badge variant="outline" className="text-blue-600 border-blue-200">Verified</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-orange-600 border-orange-200">Unverified</Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{formatUsdt(agent.deposit_usd)}</span>
                                                        <span className="text-xs text-muted-foreground">Deposit (collateral)</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">{agent.financial_summary?.utilization_percentage}%</span>
                                                        <div className="w-24 h-1.5 bg-secondary rounded-full mt-1">
                                                            <div
                                                                className={`h-full rounded-full ${Number(agent.financial_summary?.utilization_percentage) > 80 ? 'bg-red-500' : 'bg-primary'}`}
                                                                style={{ width: `${Math.min(Number(agent.financial_summary?.utilization_percentage), 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => router.push(`/agents/${agent.id}`)}>
                                                        Manage
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            <Pagination
                                currentPage={currentPage}
                                totalCount={paginationTotal}
                                limit={limit}
                                onPageChange={setCurrentPage}
                                isLoading={isLoading}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
