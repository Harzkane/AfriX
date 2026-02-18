"use client";

import { useWithdrawals, WithdrawalRequest } from "@/hooks/useWithdrawals";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    DollarSign,
    ExternalLink,
    AlertCircle,
    Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function WithdrawalsPage() {
    const {
        stats,
        withdrawals,
        isLoading,
        fetchStats,
        fetchWithdrawals,
        approveWithdrawal,
        rejectWithdrawal,
        markPaid
    } = useWithdrawals();

    const [activeTab, setActiveTab] = useState("pending");
    const [actionDialog, setActionDialog] = useState<{
        type: 'approve' | 'reject' | 'pay';
        request: WithdrawalRequest;
        open: boolean;
    } | null>(null);

    const [rejectReason, setRejectReason] = useState("");
    const [txHash, setTxHash] = useState("");
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        const params: any = {};
        if (activeTab !== "all") params.status = activeTab;
        fetchWithdrawals(params);
        fetchStats();
    }, [activeTab, fetchWithdrawals, fetchStats]);

    const handleAction = async () => {
        if (!actionDialog) return;

        setIsActionLoading(true);
        try {
            if (actionDialog.type === 'approve') {
                await approveWithdrawal(actionDialog.request.id);
                toast.success("Withdrawal approved successfully");
            } else if (actionDialog.type === 'reject') {
                if (!rejectReason) return toast.error("Rejection reason required");
                await rejectWithdrawal(actionDialog.request.id, rejectReason);
                toast.success("Withdrawal rejected");
            } else if (actionDialog.type === 'pay') {
                if (!txHash) return toast.error("Transaction hash required");
                await markPaid(actionDialog.request.id, txHash);
                toast.success("Withdrawal marked as paid");
            }
            setActionDialog(null);
            setRejectReason("");
            setTxHash("");
        } catch (err: any) {
            toast.error(err.message || "Action failed");
        } finally {
            setIsActionLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
            case "paid":
                return <Badge className="bg-green-600">Paid</Badge>;
            case "approved":
                return <Badge className="bg-blue-600">Approved (Unpaid)</Badge>;
            case "pending":
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
            case "rejected":
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Filter withdrawals client-side for smoother tab switching if we wanted, 
    // but we are using server-side filtering via useEffect.
    // However, for the "all" tab, we might want to show everything.

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Withdrawal Requests</h1>
                    <p className="text-sm text-muted-foreground">Manage agent fiat payout requests</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchStats()}>
                        Refresh Data
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.pending_count || 0}</div>
                        <p className="text-xs text-muted-foreground">Awaiting approval</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved (Unpaid)</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.approved_count || 0}</div>
                        <p className="text-xs text-muted-foreground">Ready for payment</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid Volume</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${(stats?.total_paid_volume || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Lifetime withdrawals</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="pending" className="space-y-4" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="paid">Paid History</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                    <TabsTrigger value="all">All Requests</TabsTrigger>
                </TabsList>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Agent</TableHead>
                                    <TableHead className="text-right">Amount (USD)</TableHead>
                                    <TableHead>Destination</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                                            Loading requests...
                                        </TableCell>
                                    </TableRow>
                                ) : withdrawals.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No requests found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    withdrawals.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="text-xs">
                                                {format(new Date(req.created_at), "MMM d, yyyy")}
                                                <div className="text-muted-foreground">{format(new Date(req.created_at), "HH:mm")}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">Agent #{req.agent?.id.substring(0, 8)}</span>
                                                    <span className="text-xs text-muted-foreground">{req.agent?.user_id}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold">
                                                ${parseFloat(req.amount_usd).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate text-xs font-mono">
                                                {req.agent?.withdrawal_address || "N/A"}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {getStatusBadge(req.status)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2 flex-wrap">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/withdrawals/${req.id}`}>
                                                            <Eye className="mr-1 h-3 w-3" /> View
                                                        </Link>
                                                    </Button>
                                                    {req.status === 'pending' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-green-600 border-green-200 hover:bg-green-50"
                                                                onClick={() => setActionDialog({ type: 'approve', request: req, open: true })}
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                                onClick={() => setActionDialog({ type: 'reject', request: req, open: true })}
                                                            >
                                                                Reject
                                                            </Button>
                                                        </>
                                                    )}
                                                    {req.status === 'approved' && (
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700"
                                                            onClick={() => setActionDialog({ type: 'pay', request: req, open: true })}
                                                        >
                                                            Mark Paid
                                                        </Button>
                                                    )}
                                                    {req.status === 'rejected' && (
                                                        <span className="text-xs text-muted-foreground italic">
                                                            Reason: {req.admin_notes}
                                                        </span>
                                                    )}
                                                    {req.status === 'paid' && req.paid_tx_hash && (
                                                        <a
                                                            href={`${process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || 'https://polygonscan.com'}/tx/${req.paid_tx_hash}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                                                        >
                                                            View Tx <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </Tabs>

            {/* Action Dialog */}
            <Dialog open={!!actionDialog?.open} onOpenChange={(open) => !open && setActionDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionDialog?.type === 'approve' && 'Approve Withdrawal'}
                            {actionDialog?.type === 'reject' && 'Reject Withdrawal'}
                            {actionDialog?.type === 'pay' && 'Confirm Payment'}
                        </DialogTitle>
                        <DialogDescription>
                            {actionDialog?.type === 'approve' && `Are you sure you want to approve this withdrawal of $${actionDialog.request.amount_usd}?`}
                            {actionDialog?.type === 'reject' && `Please provide a reason for rejecting this withdrawal of $${actionDialog.request.amount_usd}.`}
                            {actionDialog?.type === 'pay' && `Enter the transaction hash for the payment of $${actionDialog.request.amount_usd} to ${actionDialog.request.agent?.withdrawal_address}.`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {actionDialog?.type === 'reject' && (
                            <div className="space-y-2">
                                <Label>Rejection Reason</Label>
                                <Textarea
                                    placeholder="e.g., Insufficient trading volume"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                />
                            </div>
                        )}
                        {actionDialog?.type === 'pay' && (
                            <div className="space-y-2">
                                <Label>Polygon Transaction Hash</Label>
                                <Input
                                    placeholder="0x..."
                                    value={txHash}
                                    onChange={(e) => setTxHash(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    <AlertCircle className="h-3 w-3 inline mr-1" />
                                    Must be a valid transaction hash on Polygon network.
                                </p>
                            </div>
                        )}
                        {actionDialog?.type === 'approve' && (
                            <div className="p-3 bg-muted rounded-md text-sm">
                                <div className="flex justify-between mb-1">
                                    <span>Agent Deposit:</span>
                                    <span className="font-mono">${actionDialog.request.agent?.deposit_usd.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between font-bold">
                                    <span>Withdrawal Amount:</span>
                                    <span>${parseFloat(actionDialog.request.amount_usd).toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
                        <Button
                            onClick={handleAction}
                            disabled={isActionLoading}
                            variant={actionDialog?.type === 'reject' ? 'destructive' : 'default'}
                        >
                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {actionDialog?.type === 'approve' && 'Confirm Approval'}
                            {actionDialog?.type === 'reject' && 'Reject Request'}
                            {actionDialog?.type === 'pay' && 'Confirm & Mark Paid'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
