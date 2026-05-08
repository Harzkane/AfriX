"use client";

import { useWithdrawals, WithdrawalRequest } from "@/hooks/useWithdrawals";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Loader2,
    ArrowLeft,
    DollarSign,
    Wallet,
    CheckCircle,
    XCircle,
    ExternalLink,
    AlertTriangle,
    Send,
    Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function WithdrawalDetailPage() {
    const { id } = useParams();
    const {
        fetchWithdrawal,
        approveWithdrawal,
        rejectWithdrawal,
        markPaid,
        fetchStats,
        fetchWithdrawals,
    } = useWithdrawals();
    const [request, setRequest] = useState<WithdrawalRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionDialog, setActionDialog] = useState<"approve" | "reject" | "pay" | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [txHash, setTxHash] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (id) {
            setLoading(true);
            fetchWithdrawal(id as string).then((r) => {
                setRequest(r);
                setLoading(false);
            });
        }
    }, [id, fetchWithdrawal]);

    const handleApprove = async () => {
        if (!request) return;
        setActionLoading(true);
        try {
            await approveWithdrawal(request.id);
            toast.success("Withdrawal approved");
            setActionDialog(null);
            const updated = await fetchWithdrawal(request.id);
            setRequest(updated ?? null);
            fetchStats();
            fetchWithdrawals({});
        } catch (e: any) {
            toast.error(e.message || "Approval failed");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!request || !rejectReason.trim()) {
            toast.error("Rejection reason required");
            return;
        }
        setActionLoading(true);
        try {
            await rejectWithdrawal(request.id, rejectReason);
            toast.success("Withdrawal rejected");
            setActionDialog(null);
            setRejectReason("");
            const updated = await fetchWithdrawal(request.id);
            setRequest(updated ?? null);
            fetchStats();
            fetchWithdrawals({});
        } catch (e: any) {
            toast.error(e.message || "Rejection failed");
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkPaid = async () => {
        if (!request || !txHash.trim()) {
            toast.error("Transaction hash required");
            return;
        }
        setActionLoading(true);
        try {
            await markPaid(request.id, txHash);
            toast.success("Marked as paid");
            setActionDialog(null);
            setTxHash("");
            const updated = await fetchWithdrawal(request.id);
            setRequest(updated ?? null);
            fetchStats();
            fetchWithdrawals({});
        } catch (e: any) {
            toast.error(e.message || "Failed to mark paid");
        } finally {
            setActionLoading(false);
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
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            case "rejected":
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatCurrency = (val: number | string | undefined) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(val || 0));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!request) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/withdrawals">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Withdrawals
                    </Link>
                </Button>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground">Withdrawal request not found.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/withdrawals">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Withdrawals
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    {request.status === "pending" && (
                        <>
                            <Button
                                size="sm"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => setActionDialog("approve")}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" /> Approve
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setActionDialog("reject")}
                            >
                                <XCircle className="mr-2 h-4 w-4" /> Reject
                            </Button>
                        </>
                    )}
                    {request.status === "approved" && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setActionDialog("pay")}>
                            <Send className="mr-2 h-4 w-4" /> Mark Paid
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Withdrawal Request
                    </CardTitle>
                    <CardDescription>ID: {request.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <div className="mt-1">{getStatusBadge(request.status)}</div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Amount (USD)</p>
                            <p className="text-2xl font-bold font-mono">{formatCurrency(request.amount_usd)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Created</p>
                            <p className="text-sm">{format(new Date(request.created_at), "PPp")}</p>
                        </div>
                        {request.paid_at && (
                            <div>
                                <p className="text-sm text-muted-foreground">Paid at</p>
                                <p className="text-sm">{format(new Date(request.paid_at), "PPp")}</p>
                            </div>
                        )}
                    </div>
                    {request.paid_tx_hash && (
                        <div>
                            <p className="text-sm text-muted-foreground">Transaction</p>
                            <a
                                href={`${process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || 'https://polygonscan.com'}/tx/${request.paid_tx_hash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1 font-mono"
                            >
                                {request.paid_tx_hash.slice(0, 18)}... <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    )}
                    {request.status === "rejected" && request.admin_notes && (
                        <div className="rounded-md border border-red-200 bg-red-50/50 dark:bg-red-950/20 p-3 text-sm">
                            <p className="font-medium text-red-800 dark:text-red-200">Rejection reason</p>
                            <p className="text-muted-foreground">{request.admin_notes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {request.agent && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Agent
                        </CardTitle>
                        <CardDescription>Requesting agent and payout details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm text-muted-foreground">Agent ID</p>
                                <p className="font-mono text-sm">{request.agent.id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">User ID</p>
                                <p className="font-mono text-sm">{request.agent.user_id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Withdrawal address</p>
                                <p className="font-mono text-sm break-all">{request.agent.withdrawal_address}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Deposit (USD)</p>
                                <p className="font-mono font-medium">{formatCurrency(request.agent.deposit_usd)}</p>
                            </div>
                            {request.agent.available_capacity != null && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Available capacity</p>
                                    <p className="font-mono">{formatCurrency(request.agent.available_capacity)}</p>
                                </div>
                            )}
                            {(request.agent.tier != null || request.agent.rating != null) && (
                                <div className="sm:col-span-2 flex gap-4">
                                    {request.agent.tier != null && (
                                        <span className="text-sm">Tier: <Badge variant="outline">{request.agent.tier}</Badge></span>
                                    )}
                                    {request.agent.rating != null && (
                                        <span className="text-sm">Rating: {request.agent.rating}</span>
                                    )}
                                </div>
                            )}
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/agents/${request.agent.id}`}>View agent</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {(request.status === "pending" || request.status === "approved") && request.agent && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            Safety & limits
                        </CardTitle>
                        <CardDescription>Outstanding tokens and max withdrawable</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-3">
                            {request.outstanding_tokens != null && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Outstanding tokens</p>
                                    <p className="font-mono font-medium">{formatCurrency(request.outstanding_tokens)}</p>
                                </div>
                            )}
                            {request.max_withdrawable != null && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Max withdrawable</p>
                                    <p className="font-mono font-medium">{formatCurrency(request.max_withdrawable)}</p>
                                </div>
                            )}
                            {request.is_safe != null && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Safe to approve</p>
                                    {request.is_safe ? (
                                        <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Yes</Badge>
                                    ) : (
                                        <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> No</Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Payment info
                    </CardTitle>
                    <CardDescription>Where to send funds (when marking paid)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Network</span>
                            <span>Polygon</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Token</span>
                            <span>USDT</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount</span>
                            <span className="font-mono font-bold">{formatCurrency(request.amount_usd)}</span>
                        </div>
                        {request.agent?.withdrawal_address && (
                            <div>
                                <span className="text-muted-foreground block mb-1">Destination address</span>
                                <p className="font-mono text-xs break-all bg-muted p-2 rounded">{request.agent.withdrawal_address}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={actionDialog === "approve"} onOpenChange={(open) => !open && setActionDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve withdrawal</DialogTitle>
                        <DialogDescription>
                            Approve this withdrawal of {formatCurrency(request.amount_usd)}? The agent will be notified and you can mark it paid after sending USDT.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <div className="flex justify-between text-sm mb-1">
                            <span>Agent deposit:</span>
                            <span className="font-mono">{formatCurrency(request.agent?.deposit_usd)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                            <span>Withdrawal amount:</span>
                            <span>{formatCurrency(request.amount_usd)}</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
                        <Button onClick={handleApprove} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm approval
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={actionDialog === "reject"} onOpenChange={(open) => !open && setActionDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject withdrawal</DialogTitle>
                        <DialogDescription>
                            Provide a reason for rejecting this withdrawal of {formatCurrency(request.amount_usd)}. The agent will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label>Reason</Label>
                        <Textarea
                            placeholder="e.g. Insufficient trading volume"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={actionDialog === "pay"} onOpenChange={(open) => !open && setActionDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark as paid</DialogTitle>
                        <DialogDescription>
                            Enter the Polygon transaction hash for the payment of {formatCurrency(request.amount_usd)} to the agent&apos;s withdrawal address.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label>Transaction hash</Label>
                        <Input
                            placeholder="0x..."
                            value={txHash}
                            onChange={(e) => setTxHash(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Must be a valid transaction on Polygon network.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
                        <Button onClick={handleMarkPaid} disabled={!txHash.trim() || actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm & mark paid
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
