"use client";

import { useFinancials, Transaction } from "@/hooks/useFinancials";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Loader2,
    ArrowLeft,
    User,
    DollarSign,
    FileText,
    RotateCcw,
    Flag,
    Building2,
    Briefcase,
    Wallet,
    Clock,
    Hash,
    ExternalLink,
    ArrowRight
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, string> = {
    mint: "Agent issued tokens to user",
    burn: "User sold tokens back to agent",
    transfer: "Peer-to-peer transfer",
    swap: "Token swap",
    collection: "Merchant payment collection",
};

export default function TransactionDetailPage() {
    const { id } = useParams();
    const { fetchTransaction, refundTransaction, flagTransaction } = useFinancials();
    const [tx, setTx] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [refundOpen, setRefundOpen] = useState(false);
    const [flagOpen, setFlagOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (id) {
            setLoading(true);
            fetchTransaction(id as string).then((data) => {
                setTx(data);
                setLoading(false);
            });
        }
    }, [id, fetchTransaction]);

    const handleRefund = async () => {
        if (!tx || !reason.trim()) return;
        setActionLoading(true);
        try {
            await refundTransaction(tx.id, reason);
            toast.success("Transaction refunded");
            setRefundOpen(false);
            setReason("");
            const updated = await fetchTransaction(tx.id);
            setTx(updated ?? null);
        } catch (e: any) {
            toast.error(e.response?.data?.error || "Refund failed");
        } finally {
            setActionLoading(false);
        }
    };

    const handleFlag = async () => {
        if (!tx || !reason.trim()) return;
        setActionLoading(true);
        try {
            await flagTransaction(tx.id, reason);
            toast.success("Transaction flagged");
            setFlagOpen(false);
            setReason("");
        } catch (e: any) {
            toast.error(e.response?.data?.error || "Flag failed");
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case "completed":
                return <Badge className="bg-green-600">Completed</Badge>;
            case "pending":
                return <Badge variant="secondary">Pending</Badge>;
            case "failed":
                return <Badge variant="destructive">Failed</Badge>;
            case "refunded":
                return <Badge variant="outline" className="text-purple-600 border-purple-600">Refunded</Badge>;
            case "processing":
                return <Badge variant="outline" className="text-blue-600 border-blue-600">Processing</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading || !tx) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const typeHint = TYPE_LABELS[tx.type?.toLowerCase()] || "Value movement";
    const hasBlockchain = tx.network || tx.tx_hash;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/financials/transactions">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight font-mono truncate">{tx.reference}</h1>
                    <p className="text-sm text-muted-foreground capitalize">{tx.type} • {tx.token_type} — {typeHint}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(tx.status)}
                    {tx.status === "completed" && (
                        <Button variant="destructive" size="sm" onClick={() => setRefundOpen(true)}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Refund
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setFlagOpen(true)}>
                        <Flag className="mr-2 h-4 w-4" /> Flag
                    </Button>
                </div>
            </div>

            {/* Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" /> Overview
                    </CardTitle>
                    <CardDescription>Transaction reference, type, and identifiers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="flex items-center gap-3">
                            <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Reference</p>
                                <p className="font-mono font-medium">{tx.reference}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Transaction ID</p>
                                <p className="font-mono text-sm truncate max-w-[200px]" title={tx.id}>{tx.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Type / Token</p>
                                <p className="font-medium capitalize">{tx.type} • {tx.token_type}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Amount & Fee */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" /> Amount & Fee
                        </CardTitle>
                        <CardDescription>Value moved and platform/agent fee.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Amount</span>
                            <span className="text-xl font-bold font-mono">{parseFloat(tx.amount).toLocaleString()} {tx.token_type}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Fee</span>
                            <span className="font-mono">{parseFloat(tx.fee || "0").toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t flex items-center justify-between">
                            <span className="text-muted-foreground">Net (after fee)</span>
                            <span className="font-mono font-medium">{((parseFloat(tx.amount) - parseFloat(tx.fee || "0"))).toLocaleString()} {tx.token_type}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" /> Timeline
                        </CardTitle>
                        <CardDescription>Created, updated, and processed timestamps.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Created</span>
                            <span>{format(new Date(tx.created_at), "MMM d, yyyy HH:mm:ss")}</span>
                        </div>
                        {tx.updated_at && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Updated</span>
                                <span>{format(new Date(tx.updated_at), "MMM d, yyyy HH:mm:ss")}</span>
                            </div>
                        )}
                        {tx.processed_at && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Processed</span>
                                <span>{format(new Date(tx.processed_at), "MMM d, yyyy HH:mm:ss")}</span>
                            </div>
                        )}
                        {!tx.updated_at && !tx.processed_at && (
                            <p className="text-sm text-muted-foreground">No update or processed time recorded.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Parties */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" /> Parties
                    </CardTitle>
                    <CardDescription>From / To users and optional merchant or agent.</CardDescription>
                    <div className="pt-2">
                        <span className="text-xs text-muted-foreground uppercase">Type</span>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="font-normal capitalize">{tx.type}</Badge>
                            <span className="text-sm text-muted-foreground">— {typeHint}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {tx.fromUser && (
                            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase">From</p>
                                <p className="font-medium">{tx.fromUser.full_name}</p>
                                <p className="text-sm text-muted-foreground">{tx.fromUser.email}</p>
                                {tx.fromUser.phone_number && <p className="text-xs">{tx.fromUser.phone_number}</p>}
                                <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                                    <Link href={`/users/${tx.fromUser.id}`}>View user</Link>
                                </Button>
                            </div>
                        )}
                        {tx.fromUser && tx.toUser && (
                            <div className="hidden lg:flex items-center justify-center text-muted-foreground">
                                <ArrowRight className="h-6 w-6" />
                            </div>
                        )}
                        {tx.toUser && (
                            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase">To</p>
                                <p className="font-medium">{tx.toUser.full_name}</p>
                                <p className="text-sm text-muted-foreground">{tx.toUser.email}</p>
                                {tx.toUser.phone_number && <p className="text-xs">{tx.toUser.phone_number}</p>}
                                <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                                    <Link href={`/users/${tx.toUser.id}`}>View user</Link>
                                </Button>
                            </div>
                        )}
                        {tx.merchant && (
                            <div className="rounded-lg border bg-muted/30 p-4 space-y-2 flex flex-col">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Merchant</p>
                                </div>
                                <p className="font-medium">{tx.merchant.business_name}</p>
                                {tx.merchant.display_name && <p className="text-sm text-muted-foreground">{tx.merchant.display_name}</p>}
                                <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                                    <Link href={`/merchants/${tx.merchant.id}`}>View merchant</Link>
                                </Button>
                            </div>
                        )}
                        {tx.agent && (
                            <div className="rounded-lg border bg-muted/30 p-4 space-y-2 flex flex-col">
                                <div className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Agent</p>
                                </div>
                                <p className="font-medium">Tier: {tx.agent.tier} • Rating: {tx.agent.rating}</p>
                                {tx.agent.deposit_usd != null && <p className="text-xs text-muted-foreground">Deposit: ${Number(tx.agent.deposit_usd).toLocaleString()}</p>}
                                <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                                    <Link href={`/agents/${tx.agent.id}`}>View agent</Link>
                                </Button>
                            </div>
                        )}
                        {!tx.fromUser && !tx.toUser && !tx.merchant && !tx.agent && (
                            <p className="text-muted-foreground col-span-2">No party details available.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Wallets involved */}
            {(tx.fromWallet || tx.toWallet) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5" /> Wallets Involved
                        </CardTitle>
                        <CardDescription>Source and destination wallets for this transaction.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {tx.fromWallet && (
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase">From wallet</p>
                                        <p className="font-mono">{tx.fromWallet.token_type} • Balance: {parseFloat(tx.fromWallet.balance).toLocaleString()}</p>
                                    </div>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/financials/wallets/${tx.fromWallet.id}`}>View</Link>
                                    </Button>
                                </div>
                            )}
                            {tx.toWallet && (
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase">To wallet</p>
                                        <p className="font-mono">{tx.toWallet.token_type} • Balance: {parseFloat(tx.toWallet.balance).toLocaleString()}</p>
                                    </div>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/financials/wallets/${tx.toWallet.id}`}>View</Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Blockchain */}
            {hasBlockchain && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Hash className="h-5 w-5" /> Blockchain
                        </CardTitle>
                        <CardDescription>On-chain reference if applicable.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {tx.network && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Network</span>
                                <span className="capitalize">{tx.network}</span>
                            </div>
                        )}
                        {tx.tx_hash && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Transaction hash</p>
                                <p className="font-mono text-xs break-all">{tx.tx_hash}</p>
                                <Button variant="link" size="sm" className="h-auto p-0 mt-1" asChild>
                                    <a href={`${process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || 'https://polygonscan.com'}/tx/${tx.tx_hash}`} target="_blank" rel="noopener noreferrer">
                                        View on explorer <ExternalLink className="h-3 w-3 ml-1 inline" />
                                    </a>
                                </Button>
                            </div>
                        )}
                        {tx.block_number != null && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Block</span>
                                <span className="font-mono">{String(tx.block_number)}</span>
                            </div>
                        )}
                        {tx.gas_fee != null && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Gas fee</span>
                                <span className="font-mono">{String(tx.gas_fee)}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Details / Notes */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" /> Details & Metadata
                    </CardTitle>
                    <CardDescription>Description and optional metadata (proofs, references).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {tx.description ? (
                        <p className="text-sm">{tx.description}</p>
                    ) : (
                        <p className="text-sm text-muted-foreground">No description.</p>
                    )}
                    {tx.metadata && Object.keys(tx.metadata).length > 0 ? (
                        <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-48 border">
                            {JSON.stringify(tx.metadata, null, 2)}
                        </pre>
                    ) : (
                        <p className="text-sm text-muted-foreground">No metadata.</p>
                    )}
                </CardContent>
            </Card>

            <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Refund Transaction</DialogTitle>
                        <DialogDescription>This will reverse the transaction. Provide a reason.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label>Reason</Label>
                        <Textarea placeholder="Refund reason..." value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRefundOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleRefund} disabled={!reason.trim() || actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Refund
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={flagOpen} onOpenChange={setFlagOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Flag Transaction</DialogTitle>
                        <DialogDescription>Mark as suspicious. Provide a reason.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label>Reason</Label>
                        <Textarea placeholder="Flag reason..." value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFlagOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleFlag} disabled={!reason.trim() || actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Flag
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
