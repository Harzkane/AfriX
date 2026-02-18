"use client";

import { useFinancials, Wallet, Transaction } from "@/hooks/useFinancials";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Loader2,
    ArrowLeft,
    Wallet as WalletIcon,
    User,
    Lock,
    Unlock,
    History,
    Hash,
    RefreshCw,
    Mail,
    Phone,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { format } from "date-fns";
import { toast } from "sonner";
import api from "@/lib/api";

const TOKEN_LABELS: Record<string, string> = {
    NT: "Naira Token",
    CT: "CFA Token",
    USDT: "Tether (USDT)",
};

export default function WalletDetailPage() {
    const { id } = useParams();
    const { fetchWallet } = useFinancials();
    const [data, setData] = useState<{ wallet: Wallet; recent_transactions: Transaction[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const wallet = data?.wallet;
    const recentTx = data?.recent_transactions ?? [];

    useEffect(() => {
        if (id) {
            setLoading(true);
            fetchWallet(id as string).then((d) => {
                setData(d);
                setLoading(false);
            });
        }
    }, [id, fetchWallet]);

    const handleToggleFreeze = async () => {
        if (!wallet) return;
        setActionLoading(true);
        try {
            const endpoint = wallet.is_frozen
                ? `/admin/users/${wallet.user_id}/unfreeze-wallet`
                : `/admin/users/${wallet.user_id}/freeze-wallet`;
            const payload = wallet.is_frozen
                ? { token_type: wallet.token_type }
                : { token_type: wallet.token_type, reason: "Administrative security review" };
            await api.post(endpoint, payload);
            toast.success(wallet.is_frozen ? "Wallet unfrozen" : "Wallet frozen");
            const updated = await fetchWallet(wallet.id);
            setData(updated);
        } catch (e: any) {
            toast.error(e.response?.data?.error || "Action failed");
        } finally {
            setActionLoading(false);
        }
    };

    const maskAddress = (addr: string) => {
        if (!addr || addr.length <= 14) return addr;
        return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
    };

    const availableBalance = wallet
        ? parseFloat(wallet.balance || "0") - parseFloat(wallet.pending_balance || "0")
        : 0;

    if (loading || !wallet) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const tokenLabel = TOKEN_LABELS[wallet.token_type] || wallet.token_type;
    const hasActivity = wallet.total_received != null || wallet.total_sent != null || (wallet.transaction_count != null && wallet.transaction_count > 0);

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/financials/wallets">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight">{wallet.token_type} Wallet</h1>
                    <p className="text-sm text-muted-foreground">{tokenLabel} • ID: {wallet.id.slice(0, 8)}…</p>
                </div>
                <div className="shrink-0">
                    <Button
                        variant={wallet.is_frozen ? "default" : "destructive"}
                        size="sm"
                        className={wallet.is_frozen ? "bg-green-600 hover:bg-green-700" : ""}
                        onClick={handleToggleFreeze}
                        disabled={actionLoading}
                    >
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : wallet.is_frozen ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                        {wallet.is_frozen ? "Unfreeze" : "Freeze"}
                    </Button>
                </div>
            </div>

            {/* Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <WalletIcon className="h-5 w-5" /> Overview
                    </CardTitle>
                    <CardDescription>Wallet identifier, token type, and status.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="flex items-center gap-3">
                            <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground uppercase">Wallet ID</p>
                                <p className="font-mono text-sm truncate" title={wallet.id}>{wallet.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <WalletIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Token</p>
                                <p className="font-medium">{wallet.token_type} — {tokenLabel}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Status</p>
                                <div className="flex items-center gap-2">
                                    {wallet.is_frozen ? (
                                        <Badge variant="destructive" className="flex items-center w-fit gap-1"><Lock className="h-3 w-3" /> Frozen</Badge>
                                    ) : (
                                        <Badge className="bg-green-600 flex items-center w-fit gap-1"><Unlock className="h-3 w-3" /> Active</Badge>
                                    )}
                                    {wallet.is_active === false && <Badge variant="secondary">Inactive</Badge>}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Balance & Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <WalletIcon className="h-5 w-5" /> Balance & Status
                        </CardTitle>
                        <CardDescription>Current balance, pending, and available to use.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Balance</p>
                            <p className="text-2xl font-bold font-mono">{parseFloat(wallet.balance).toLocaleString()} {wallet.token_type}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending</p>
                                <p className="font-mono">{parseFloat(wallet.pending_balance || "0").toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Available</p>
                                <p className="font-mono font-medium">{availableBalance.toLocaleString()}</p>
                            </div>
                        </div>
                        {wallet.is_frozen && (
                            <>
                                {wallet.frozen_reason && (
                                    <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3 text-sm">
                                        <p className="font-medium">Freeze reason</p>
                                        <p className="text-muted-foreground">{wallet.frozen_reason}</p>
                                    </div>
                                )}
                                {wallet.frozen_at && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Frozen at</span>
                                        <span>{format(new Date(wallet.frozen_at), "MMM d, yyyy HH:mm")}</span>
                                    </div>
                                )}
                            </>
                        )}
                        <div className="pt-2 border-t flex flex-wrap gap-4 text-xs text-muted-foreground">
                            {wallet.created_at && <span>Created {format(new Date(wallet.created_at), "MMM d, yyyy")}</span>}
                            {wallet.updated_at && <span>Updated {format(new Date(wallet.updated_at), "MMM d, yyyy")}</span>}
                        </div>
                    </CardContent>
                </Card>

                {/* Owner */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" /> Owner
                        </CardTitle>
                        <CardDescription>User who owns this wallet.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {wallet.user ? (
                            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <p className="font-medium">{wallet.user.full_name}</p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Mail className="h-3 w-3" /> {wallet.user.email}
                                        </p>
                                        {wallet.user.phone_number && (
                                            <p className="text-sm flex items-center gap-1">
                                                <Phone className="h-3 w-3 text-muted-foreground" /> {wallet.user.phone_number}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {wallet.user.is_suspended && (
                                    <Badge variant="destructive">Account suspended</Badge>
                                )}
                                <Button variant="outline" size="sm" className="w-full" asChild>
                                    <Link href={`/users/${wallet.user.id}`}>View user details</Link>
                                </Button>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">User ID: {wallet.user_id}</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Blockchain address & sync */}
            {(wallet.blockchain_address || wallet.last_synced_at != null) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Hash className="h-5 w-5" /> Wallet & sync
                        </CardTitle>
                        <CardDescription>On-chain address and last sync with blockchain.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {wallet.blockchain_address && (
                            <div>
                                <p className="text-xs text-muted-foreground uppercase mb-1">Blockchain address</p>
                                <p className="font-mono text-sm">{maskAddress(wallet.blockchain_address)}</p>
                                <Button variant="link" size="sm" className="h-auto p-0 mt-1" asChild>
                                    <a href={`${process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || 'https://polygonscan.com'}/address/${wallet.blockchain_address}`} target="_blank" rel="noopener noreferrer">
                                        View on explorer <ExternalLink className="h-3 w-3 ml-1 inline" />
                                    </a>
                                </Button>
                            </div>
                        )}
                        <div className="grid gap-2 sm:grid-cols-2">
                            {wallet.last_synced_at && (
                                <div className="flex items-center gap-2">
                                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Last synced</p>
                                        <p className="text-sm">{format(new Date(wallet.last_synced_at), "MMM d, yyyy HH:mm")}</p>
                                    </div>
                                </div>
                            )}
                            {wallet.last_synced_block != null && (
                                <div className="flex items-center gap-2">
                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Last synced block</p>
                                        <p className="font-mono text-sm">{String(wallet.last_synced_block)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Lifetime activity - always show */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" /> Lifetime activity
                    </CardTitle>
                    <CardDescription>Total received, sent, and transaction count for this wallet.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-lg border bg-muted/40 p-4">
                            <p className="text-xs text-muted-foreground uppercase">Total received</p>
                            <p className="text-xl font-bold text-green-600 font-mono">
                                {hasActivity && wallet.total_received != null
                                    ? `+${parseFloat(wallet.total_received).toLocaleString()}`
                                    : "—"}
                            </p>
                        </div>
                        <div className="rounded-lg border bg-muted/40 p-4">
                            <p className="text-xs text-muted-foreground uppercase">Total sent</p>
                            <p className="text-xl font-bold text-red-500 font-mono">
                                {hasActivity && wallet.total_sent != null
                                    ? `-${parseFloat(wallet.total_sent).toLocaleString()}`
                                    : "—"}
                            </p>
                        </div>
                        <div className="rounded-lg border bg-muted/40 p-4">
                            <p className="text-xs text-muted-foreground uppercase">Transaction count</p>
                            <p className="text-xl font-bold font-mono">
                                {wallet.transaction_count != null ? wallet.transaction_count : "—"}
                            </p>
                        </div>
                    </div>
                    {wallet.user_id && (
                        <Button variant="outline" size="sm" className="mt-4" asChild>
                            <Link href={`/financials/transactions?user_id=${wallet.user_id}`}>View all transactions for this user</Link>
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Recent transactions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" /> Recent transactions
                    </CardTitle>
                    <CardDescription>Latest activity for this wallet.</CardDescription>
                </CardHeader>
                <CardContent>
                    {recentTx.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No recent transactions.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentTx.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="text-sm">{format(new Date(t.created_at), "MMM d, HH:mm")}</TableCell>
                                        <TableCell className="font-mono text-xs">{t.reference}</TableCell>
                                        <TableCell><Badge variant="outline" className="capitalize">{t.type}</Badge></TableCell>
                                        <TableCell className="text-right font-mono">{parseFloat(t.amount).toLocaleString()} {t.token_type}</TableCell>
                                        <TableCell><Badge variant={t.status === "completed" ? "default" : "secondary"} className={t.status === "completed" ? "bg-green-600" : ""}>{t.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/financials/transactions/${t.id}`}>View</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
