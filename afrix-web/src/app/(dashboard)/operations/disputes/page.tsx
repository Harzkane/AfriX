"use client";

import { useOperations, Dispute } from "@/hooks/useOperations";
import { useEffect, useState } from "react";
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
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function DisputesPage() {
    const { disputes, isLoading, fetchDisputes } = useOperations();
    const [statusFilter, setStatusFilter] = useState("all");
    const [escalationFilter, setEscalationFilter] = useState("all");

    useEffect(() => {
        const params: any = {};
        if (statusFilter !== "all") params.status = statusFilter;
        if (escalationFilter !== "all") params.escalation_level = escalationFilter;
        fetchDisputes(params);
    }, [statusFilter, escalationFilter, fetchDisputes]);

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; className: string }> = {
            open: { variant: "outline", className: "bg-yellow-500/10 text-yellow-600" },
            resolved: { variant: "default", className: "bg-green-600" },
            escalated: { variant: "destructive", className: "" },
        };

        const config = variants[status] || variants.open;
        return (
            <Badge variant={config.variant} className={config.className}>
                {status.toUpperCase()}
            </Badge>
        );
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dispute Center</h1>
                    <p className="text-sm text-muted-foreground">Manage and resolve user-agent conflicts.</p>
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
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={escalationFilter} onValueChange={setEscalationFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Escalation" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Levels</SelectItem>
                                <SelectItem value="level_1">Level 1</SelectItem>
                                <SelectItem value="level_2">Level 2</SelectItem>
                                <SelectItem value="level_3">Level 3</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Disputes Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Agent</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Escalation</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                                        Loading disputes...
                                    </TableCell>
                                </TableRow>
                            ) : disputes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No disputes found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                disputes.map((dispute: Dispute) => (
                                    <TableRow key={dispute.id}>
                                        <TableCell>
                                            <div className="font-medium">{dispute.user?.full_name || "Unknown"}</div>
                                            <div className="text-xs text-muted-foreground">{dispute.user?.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">Agent {dispute.agent?.tier || "N/A"}</div>
                                            <div className="text-xs text-muted-foreground">Rating: {dispute.agent?.rating || "N/A"}</div>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">{dispute.reason}</TableCell>
                                        <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{dispute.escalation_level.replace('_', ' ')}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {format(new Date(dispute.created_at), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/operations/disputes/${dispute.id}`}>View</Link>
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
