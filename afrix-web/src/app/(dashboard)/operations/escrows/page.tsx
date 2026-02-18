"use client";

import { useOperations, Escrow } from "@/hooks/useOperations";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react";
import { format, isPast } from "date-fns";
import { useSearchParams } from "next/navigation";

function EscrowsPageContent() {
    const searchParams = useSearchParams();
    const { escrows, isLoading, fetchEscrows } = useOperations();
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
    const [expiredFilter, setExpiredFilter] = useState(searchParams.get("expired") || "all");

    useEffect(() => {
        const params: any = {};
        if (statusFilter !== "all") params.status = statusFilter;
        if (expiredFilter === "expired" || expiredFilter === "true") params.expired = "true";
        fetchEscrows(params);
    }, [statusFilter, expiredFilter, fetchEscrows]);

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; className: string }> = {
            locked: { variant: "outline", className: "bg-blue-500/10 text-blue-600" },
            completed: { variant: "default", className: "bg-green-600" },
            disputed: { variant: "destructive", className: "" },
            refunded: { variant: "outline", className: "bg-gray-500/10 text-gray-600" },
        };

        const config = variants[status] || variants.locked;
        return (
            <Badge variant={config.variant} className={config.className}>
                {status.toUpperCase()}
            </Badge>
        );
    };

    const isExpired = (expiresAt: string) => {
        return isPast(new Date(expiresAt));
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Escrow Monitor</h1>
                    <p className="text-sm text-muted-foreground">Track locked funds and manage escrow transactions.</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="locked">Locked</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="disputed">Disputed</SelectItem>
                                <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={expiredFilter} onValueChange={setExpiredFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Expiry" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Escrows</SelectItem>
                                <SelectItem value="expired">Expired Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Escrows Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Agent</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Expires</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                                        Loading escrows...
                                    </TableCell>
                                </TableRow>
                            ) : escrows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No escrows found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                escrows.map((escrow: Escrow) => (
                                    <TableRow key={escrow.id}>
                                        <TableCell>
                                            <div className="font-medium">{escrow.fromUser?.full_name || "Unknown"}</div>
                                            <div className="text-xs text-muted-foreground">{escrow.fromUser?.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">Agent {escrow.agent?.tier || "N/A"}</div>
                                            <div className="text-xs text-muted-foreground">Rating: {escrow.agent?.rating || "N/A"}</div>
                                        </TableCell>
                                        <TableCell className="font-mono font-bold">
                                            {parseFloat(escrow.amount).toLocaleString()} {escrow.token_type}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(escrow.status)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                {isExpired(escrow.expires_at) && escrow.status === 'locked' && (
                                                    <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                                                )}
                                                <span className={`text-xs ${isExpired(escrow.expires_at) && escrow.status === 'locked' ? 'text-red-600 font-semibold' : ''}`}>
                                                    {format(new Date(escrow.expires_at), "MMM d, yyyy")}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {format(new Date(escrow.created_at), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/operations/escrows/${escrow.id}`}>View</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

export default function EscrowsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        }>
            <EscrowsPageContent />
        </Suspense>
    );
}
