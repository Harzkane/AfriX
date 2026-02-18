"use client";

import { useFinancials, Transaction } from "@/hooks/useFinancials";
import { Suspense, useEffect, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ArrowUpDown,
    Download,
    Loader2,
    Search,
    RotateCcw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

function TransactionsPageContent() {
    const searchParams = useSearchParams();
    const { transactions, isLoading, fetchTransactions, refundTransaction } = useFinancials();
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
    const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "all");
    const [searchTerm, setSearchTerm] = useState(searchParams.get("reference") || "");
    const [flaggedFilter, setFlaggedFilter] = useState(searchParams.get("flagged") || "all");

    // Refund State
    const [isRefundLoading, setIsRefundLoading] = useState<string | null>(null);
    const [refundDialog, setRefundDialog] = useState<{ open: boolean; id: string } | null>(null);
    const [refundReason, setRefundReason] = useState("");

    const userIdFromUrl = searchParams.get("user_id") || "";

    useEffect(() => {
        const params: any = {};
        if (statusFilter !== "all") params.status = statusFilter;
        if (typeFilter !== "all") params.type = typeFilter;
        if (flaggedFilter !== "all") params.flagged = flaggedFilter;
        if (searchTerm) params.search = searchTerm;
        if (userIdFromUrl) params.user_id = userIdFromUrl;
        fetchTransactions(params);
    }, [statusFilter, typeFilter, flaggedFilter, searchTerm, userIdFromUrl, fetchTransactions]);

    const handleRefund = async () => {
        if (!refundDialog || !refundReason.trim()) {
            toast.error("Please provide a reason for the refund");
            return;
        }

        setIsRefundLoading(refundDialog.id);
        try {
            await refundTransaction(refundDialog.id, refundReason);
            toast.success("Transaction refunded successfully");
            setRefundDialog(null);
            setRefundReason("");
            // Re-fetch to update UI
            const params: any = {};
            if (statusFilter !== "all") params.status = statusFilter;
            if (typeFilter !== "all") params.type = typeFilter;
            fetchTransactions(params);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to refund transaction");
        } finally {
            setIsRefundLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "completed":
                return <Badge variant="default" className="bg-green-600">Completed</Badge>;
            case "pending":
                return <Badge variant="secondary">Pending</Badge>;
            case "failed":
                return <Badge variant="destructive">Failed</Badge>;
            case "processing":
                return <Badge variant="outline" className="text-blue-600 border-blue-600">Processing</Badge>;
            case "refunded":
                return <Badge variant="outline" className="text-gray-500 border-gray-500">Refunded</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case "mint": return "text-green-600 font-bold";
            case "burn": return "text-orange-600 font-bold";
            case "transfer": return "text-blue-600 font-bold";
            case "swap": return "text-purple-600 font-bold";
            default: return "text-muted-foreground";
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Transaction History</h1>
                    <p className="text-sm text-muted-foreground">Monitor and audit all token movements on the platform.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by Reference or User ID..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="mint">Mint</SelectItem>
                                    <SelectItem value="burn">Burn</SelectItem>
                                    <SelectItem value="transfer">Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                    <SelectItem value="refunded">Refunded</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon">
                                <ArrowUpDown className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[160px]">Date</TableHead>
                                <TableHead>Participants</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Reference</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                                        Loading transactions...
                                    </TableCell>
                                </TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No transactions match your filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx: Transaction) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="text-xs whitespace-nowrap">
                                            {format(new Date(tx.created_at), "MMM d, yyyy")}
                                            <div className="text-[10px] text-muted-foreground">{format(new Date(tx.created_at), "HH:mm:ss")}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 min-w-[200px]">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] px-1 bg-muted rounded uppercase">From</span>
                                                    <span className="truncate max-w-[150px]">{tx.fromUser?.full_name || "System"}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] px-1 bg-muted rounded uppercase">To</span>
                                                    <span className="truncate max-w-[150px] font-medium">{tx.toUser?.full_name || tx.merchant?.business_name || "System"}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={getTypeColor(tx.type)}>{tx.type.toUpperCase()}</span>
                                            {tx.token_type && <span className="ml-2 text-xs text-muted-foreground">({tx.token_type})</span>}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            <div className="font-bold">{parseFloat(tx.amount).toLocaleString()}</div>
                                            <div className="text-[10px] text-muted-foreground">Fee: {parseFloat(tx.fee).toLocaleString()}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {getStatusBadge(tx.status)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-[10px] text-muted-foreground">
                                            {tx.reference.substring(0, 8)}...
                                        </TableCell>
                                        <TableCell className="text-right pr-6 space-x-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/financials/transactions/${tx.id}`}>View</Link>
                                            </Button>
                                            {tx.status === 'completed' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setRefundDialog({ open: true, id: tx.id })}
                                                    title="Refund Transaction"
                                                >
                                                    <RotateCcw className="h-4 w-4 text-muted-foreground hover:text-red-500 transition-colors" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Refund Dialog */}
            <Dialog open={refundDialog?.open || false} onOpenChange={(open) => !open && setRefundDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Refund Transaction</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to refund this transaction? This will reverse the funds and cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Enter refund reason..."
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRefundDialog(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRefund}
                            disabled={!refundReason.trim() || isRefundLoading === refundDialog?.id}
                        >
                            {isRefundLoading === refundDialog?.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RotateCcw className="mr-2 h-4 w-4" />
                            )}
                            Confirm Refund
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function TransactionsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        }>
            <TransactionsPageContent />
        </Suspense>
    );
}
