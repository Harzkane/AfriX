"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import api from "@/lib/api";

export type Dispute = {
    id: string;
    escrow_id?: string;
    mint_request_id?: string;
    user_id: string;
    reason: string;
    status: "OPEN" | "RESOLVED" | "ESCALATED";
    resolution?: string;
    created_at: string;
    updated_at: string;
    User?: {
        first_name: string;
        last_name: string;
        email: string;
    };
    Escrow?: {
        amount: number;
        token_type: string;
        transaction_id?: string;
        Transaction?: {
            id: string;
            reference: string;
        };
        Agent?: {
            business_name: string;
            tier: string;
        };
    };
    MintRequest?: {
        amount: number;
        token_type: string;
        Agent?: {
            business_name: string;
            tier: string;
        };
    };
};

export function DisputeTable() {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [actionLoading, setActionLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
    const [actionType, setActionType] = useState<"refund" | "release" | null>(null);

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        try {
            setIsLoading(true);
            const response = await api.get("/admin/operations/disputes");
            setDisputes(response.data.data || []);
        } catch (err: any) {
            console.error("Failed to fetch disputes:", err);
            setError(err.response?.data?.error || "Failed to load disputes");
        } finally {
            setIsLoading(false);
        }
    };

    const handleActionClick = (dispute: Dispute, type: "refund" | "release") => {
        setSelectedDispute(dispute);
        setActionType(type);
        setDialogOpen(true);
    };

    const executeAction = async () => {
        if (!selectedDispute || !actionType) return;

        setActionLoading(true);
        try {
            if (actionType === "refund") {
                // Refund User: /api/v1/admin/financial/transactions/:id/refund
                // We need the transaction ID. If it's an escrow dispute, it's in Escrow.Transaction.id
                // If it's a direct transaction dispute, we might need a different logic, but assuming Escrow context here.
                const transactionId = selectedDispute.Escrow?.Transaction?.id || selectedDispute.Escrow?.transaction_id; // Fallback if populated differently

                if (!transactionId) {
                    throw new Error("Transaction ID not found for this dispute");
                }

                await api.post(`/admin/financial/transactions/${transactionId}/refund`, {
                    reason: `Refunded via Dispute Resolution (Dispute ID: ${selectedDispute.id})`
                });

            } else {
                // Release to Agent: /api/v1/admin/operations/escrows/:id/force-finalize
                const escrowId = selectedDispute.escrow_id;

                if (!escrowId) {
                    throw new Error("Escrow ID not found for this dispute");
                }

                await api.post(`/admin/operations/escrows/${escrowId}/force-finalize`, {
                    notes: `Released via Dispute Resolution (Dispute ID: ${selectedDispute.id})`
                });
            }

            // Refresh list
            await fetchDisputes();
            setDialogOpen(false);
        } catch (err: any) {
            console.error(`Failed to ${actionType}:`, err);
            alert(`Failed to ${actionType}: ${err.response?.data?.error || err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8 text-destructive">
                {error}
            </div>
        );
    }

    if (disputes.length === 0) {
        return (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
                No disputes found
            </div>
        );
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Transaction</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Agent</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {disputes.map((dispute) => {
                            const escrowData = dispute.Escrow;
                            const mintData = dispute.MintRequest;
                            const amount = escrowData?.amount || mintData?.amount || 0;
                            const tokenType = escrowData?.token_type || mintData?.token_type || "N/A";
                            const txRef = escrowData?.Transaction?.reference || dispute.id;
                            const agentName = escrowData?.Agent?.business_name || mintData?.Agent?.business_name || "N/A";
                            const userName = dispute.User
                                ? `${dispute.User.first_name} ${dispute.User.last_name}`
                                : "Unknown";
                            const userEmail = dispute.User?.email || "";

                            return (
                                <TableRow key={dispute.id}>
                                    <TableCell className="font-medium">{txRef}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{userName}</span>
                                            <span className="text-xs text-muted-foreground">{userEmail}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{agentName}</TableCell>
                                    <TableCell>
                                        {amount} {tokenType}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                dispute.status === "OPEN"
                                                    ? "destructive"
                                                    : dispute.status === "RESOLVED"
                                                        ? "default"
                                                        : "secondary"
                                            }
                                            className={
                                                dispute.status === "RESOLVED" ? "bg-green-600 hover:bg-green-700" : ""
                                            }
                                        >
                                            {dispute.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(dispute.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    disabled={dispute.status === "RESOLVED"}
                                                    onClick={() => handleActionClick(dispute, "refund")}
                                                >
                                                    Refund User
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    disabled={dispute.status === "RESOLVED"}
                                                    onClick={() => handleActionClick(dispute, "release")}
                                                >
                                                    Release to Agent
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionType === "refund"
                                ? "This will refund the transaction amount back to the user. This action cannot be undone."
                                : "This will release the funds to the agent, finalizing the transaction. This action cannot be undone."
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeAction} disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {actionType === "refund" ? "Refund User" : "Release Funds"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
