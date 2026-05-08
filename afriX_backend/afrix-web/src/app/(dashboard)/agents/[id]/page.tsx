"use client";

import { useAgents } from "@/hooks/useAgents";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Loader2,
    ArrowLeft,
    CheckCircle,
    ShieldCheck,
    Briefcase,
    DollarSign,
    AlertTriangle,
    FileText,
    User,
    Mail,
    Phone,
    MapPin,
    Wallet,
    TrendingUp,
    Clock,
    ExternalLink,
    CreditCard,
    Smartphone
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AgentDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const {
        currentAgent,
        isLoading,
        fetchAgent,
        approveKyc,
        rejectKyc,
        suspendAgent,
        activateAgent
    } = useAgents();

    const [isActionLoading, setIsActionLoading] = useState(false);

    // Dialogs
    const [rejectDialog, setRejectDialog] = useState(false);
    const [suspendDialog, setSuspendDialog] = useState(false);
    const [reason, setReason] = useState("");

    useEffect(() => {
        if (id) fetchAgent(id as string);
    }, [id, fetchAgent]);

    if (isLoading || !currentAgent) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const formatUsdt = (val: number | string | undefined) => {
        return `${Number(val ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
    };
    const formatToken = (val: number | string | undefined, token: "NT" | "CT") => {
        return `${Number(val ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${token}`;
    };

    const handleKycAction = async (action: 'approve' | 'reject') => {
        setIsActionLoading(true);
        try {
            if (action === 'approve') {
                await approveKyc(currentAgent.id);
            } else {
                await rejectKyc(currentAgent.id, reason);
                setRejectDialog(false);
                setReason("");
            }
        } catch (error) {
            // Handled
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleStatusAction = async (action: 'suspend' | 'activate') => {
        setIsActionLoading(true);
        try {
            if (action === 'activate') {
                await activateAgent(currentAgent.id);
            } else {
                await suspendAgent(currentAgent.id, reason);
                setSuspendDialog(false);
                setReason("");
            }
        } catch (error) {
            // Handled
        } finally {
            setIsActionLoading(false);
        }
    };

    const openDocument = (url: string | null | undefined, label: string) => {
        if (url) {
            window.open(url, "_blank", "noopener,noreferrer");
        } else {
            toast.error(`${label} not available`);
        }
    };

    const kyc = currentAgent.kyc;
    const docItems = [
        { label: "ID Document", url: kyc?.id_document_url },
        { label: "Selfie", url: kyc?.selfie_url },
        { label: "Proof of Address", url: kyc?.proof_of_address_url },
        { label: "Business Registration", url: kyc?.business_registration_url },
    ];

    const maskAddress = (addr: string | undefined) => {
        if (!addr) return "—";
        if (addr.length <= 14) return addr;
        return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
    };

    const maskAccount = (num: string | undefined) => {
        if (!num) return "—";
        if (num.length <= 4) return num;
        return `****${num.slice(-4)}`;
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{currentAgent.user.full_name}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <Briefcase className="h-3 w-3" /> Tier: <span className="font-medium capitalize">{currentAgent.tier}</span>
                        <span>•</span>
                        <span className="capitalize">{currentAgent.status}</span>
                        <span>•</span>
                        {currentAgent.is_verified ? (
                            <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">Verified</Badge>
                        ) : (
                            <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800">Unverified</Badge>
                        )}
                    </div>
                </div>
                <div className="ml-auto flex gap-2">
                    {currentAgent.status === 'suspended' ? (
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleStatusAction('activate')}
                            disabled={isActionLoading}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" /> Reactivate Agent
                        </Button>
                    ) : (
                        currentAgent.status === 'active' && (
                            <Button
                                variant="destructive"
                                onClick={() => setSuspendDialog(true)}
                            >
                                <AlertTriangle className="mr-2 h-4 w-4" /> Suspend Agent
                            </Button>
                        )
                    )}

                    {currentAgent.status === 'pending' && currentAgent.is_verified && (
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleStatusAction('activate')}
                            disabled={isActionLoading}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" /> Activate Network Access
                        </Button>
                    )}
                </div>
            </div>

            {/* Profile & Contact */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" /> Profile & Contact
                    </CardTitle>
                    <CardDescription>Agent account and contact details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Email</p>
                                <p className="font-medium">{currentAgent.user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Phone</p>
                                <p className="font-medium">{currentAgent.user.phone_number || currentAgent.phone_number || "—"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Country / Currency</p>
                                <p className="font-medium">{currentAgent.country} / {currentAgent.currency || "—"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Joined</p>
                                <p className="font-medium">{currentAgent.user.created_at ? format(new Date(currentAgent.user.created_at), "MMM d, yyyy") : (currentAgent.created_at ? format(new Date(currentAgent.created_at), "MMM d, yyyy") : "—")}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-1">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Withdrawal Address</p>
                                <p className="font-mono text-sm">{maskAddress(currentAgent.withdrawal_address)}</p>
                            </div>
                        </div>
                        {(currentAgent.bank_name || currentAgent.account_number) && (
                            <div className="flex items-center gap-3 sm:col-span-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Bank</p>
                                    <p className="font-medium">{currentAgent.bank_name || "—"} {currentAgent.account_name && `• ${currentAgent.account_name}`} {currentAgent.account_number && `• ${maskAccount(currentAgent.account_number)}`}</p>
                                </div>
                            </div>
                        )}
                        {/* Mobile Money (XOF countries: Orange Money, Wave, Kiren, Moov, etc.) */}
                        {(currentAgent.currency === "XOF" || currentAgent.mobile_money_provider || currentAgent.mobile_money_number) && (
                            <div className="flex items-center gap-3 sm:col-span-2">
                                <Smartphone className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Mobile Money (XOF)</p>
                                    <p className="font-medium">
                                        {currentAgent.mobile_money_provider || "—"}
                                        {currentAgent.mobile_money_number ? ` • ${currentAgent.mobile_money_number}` : ""}
                                    </p>
                                    {currentAgent.currency === "XOF" && !currentAgent.mobile_money_provider && !currentAgent.mobile_money_number && (
                                        <p className="text-xs text-muted-foreground mt-0.5">Agent can add Orange Money, Wave, Kiren, Moov in Edit Bank Details.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Financial Health & Activity */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" /> Financial Health
                        </CardTitle>
                        <CardDescription>Deposit, capacity, and utilization.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground uppercase">Total Deposit</span>
                                <div className="text-2xl font-bold">{formatUsdt(currentAgent.deposit_usd)}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground uppercase">Available Capacity</span>
                                <div className="text-2xl font-bold text-green-600">{formatUsdt(currentAgent.available_capacity)}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground uppercase">Outstanding (USDT)</span>
                                <div className="text-xl font-bold text-orange-600">
                                    {formatUsdt((currentAgent.financial_summary as any)?.outstanding_usdt ?? currentAgent.financial_summary?.outstanding_tokens)}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground uppercase">Max Withdrawable</span>
                                <div className="text-xl font-bold">{formatUsdt(currentAgent.financial_summary?.max_withdrawable)}</div>
                            </div>
                            <div className="space-y-1 col-span-2">
                                <span className="text-xs text-muted-foreground uppercase">Utilization</span>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${Number(currentAgent.financial_summary?.utilization_percentage) > 80 ? 'bg-red-500' : 'bg-primary'}`}
                                            style={{ width: `${Math.min(Number(currentAgent.financial_summary?.utilization_percentage || 0), 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium w-12 text-right">{currentAgent.financial_summary?.utilization_percentage ?? 0}%</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" /> Activity & Earnings
                        </CardTitle>
                        <CardDescription>Mint/burn volume and commissions — NT/CT with approximated USDT.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Total Earnings (Commission) - NT/CT cards like Agent dashboard */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Earnings (Commission)</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg border bg-green-50/50 dark:bg-green-950/20 p-4">
                                    <p className="text-xs text-muted-foreground font-medium">NT</p>
                                    <p className="text-xl font-bold text-green-700 dark:text-green-400">
                                        {formatToken((currentAgent.total_earnings_by_token as Record<string, number>)?.NT ?? 0, "NT")}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        ≈ {formatUsdt((currentAgent.total_earnings_by_token_usdt as Record<string, number>)?.NT ?? 0)}
                                    </p>
                                </div>
                                <div className="rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
                                    <p className="text-xs text-muted-foreground font-medium">CT</p>
                                    <p className="text-xl font-bold text-green-700 dark:text-green-400">
                                        {formatToken((currentAgent.total_earnings_by_token as Record<string, number>)?.CT ?? 0, "CT")}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        ≈ {formatUsdt((currentAgent.total_earnings_by_token_usdt as Record<string, number>)?.CT ?? 0)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Total Minted - NT/CT cards */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Minted</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 p-4">
                                    <p className="text-xs text-muted-foreground font-medium">NT</p>
                                    <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                                        {formatToken((currentAgent.total_minted_by_token as Record<string, number>)?.NT ?? 0, "NT")}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        ≈ {formatUsdt((currentAgent.total_minted_by_token_usdt as Record<string, number>)?.NT ?? 0)}
                                    </p>
                                </div>
                                <div className="rounded-lg border bg-orange-50/50 dark:bg-orange-950/20 p-4">
                                    <p className="text-xs text-muted-foreground font-medium">CT</p>
                                    <p className="text-xl font-bold text-orange-700 dark:text-orange-400">
                                        {formatToken((currentAgent.total_minted_by_token as Record<string, number>)?.CT ?? 0, "CT")}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        ≈ {formatUsdt((currentAgent.total_minted_by_token_usdt as Record<string, number>)?.CT ?? 0)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Total Burned - NT/CT cards */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Burned</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg border bg-red-50/50 dark:bg-red-950/20 p-4">
                                    <p className="text-xs text-muted-foreground font-medium">NT</p>
                                    <p className="text-xl font-bold text-red-700 dark:text-red-400">
                                        {formatToken((currentAgent.total_burned_by_token as Record<string, number>)?.NT ?? 0, "NT")}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        ≈ {formatUsdt((currentAgent.total_burned_by_token_usdt as Record<string, number>)?.NT ?? 0)}
                                    </p>
                                </div>
                                <div className="rounded-lg border bg-rose-50/50 dark:bg-rose-950/20 p-4">
                                    <p className="text-xs text-muted-foreground font-medium">CT</p>
                                    <p className="text-xl font-bold text-red-700 dark:text-red-400">
                                        {formatToken((currentAgent.total_burned_by_token as Record<string, number>)?.CT ?? 0, "CT")}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        ≈ {formatUsdt((currentAgent.total_burned_by_token_usdt as Record<string, number>)?.CT ?? 0)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Summary row: total USDT + commission + optional meta */}
                        <div className="flex flex-wrap items-center gap-4 pt-2 border-t text-sm">
                            <span className="text-muted-foreground">Total earnings (USDT):</span>
                            <span className="font-bold text-green-600">{formatUsdt(currentAgent.total_earnings_usdt ?? currentAgent.total_earnings)}</span>
                            {currentAgent.commission_rate != null && (
                                <>
                                    <span className="text-muted-foreground">·</span>
                                    <span className="text-muted-foreground">Commission rate:</span>
                                    <span className="font-medium">{Number(currentAgent.commission_rate) * 100}%</span>
                                </>
                            )}
                            {currentAgent.response_time_minutes != null && (
                                <>
                                    <span className="text-muted-foreground">·</span>
                                    <span className="text-muted-foreground">Avg. response:</span>
                                    <span className="font-medium">{currentAgent.response_time_minutes} min</span>
                                </>
                            )}
                        </div>
                        {(currentAgent.financial_summary?.liquidity_nt != null || currentAgent.financial_summary?.liquidity_ct != null) && (
                            <div className="text-sm">
                                <span className="text-muted-foreground">Liquidity (NT / CT): </span>
                                <span className="font-mono">{formatUsdt(currentAgent.financial_summary?.liquidity_nt)} / {formatUsdt(currentAgent.financial_summary?.liquidity_ct)}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* User Wallets (if any) */}
            {currentAgent.user.wallets && currentAgent.user.wallets.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5" /> Wallet Balances
                        </CardTitle>
                        <CardDescription>Token balances linked to this user.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            {currentAgent.user.wallets.map((w) => (
                                <div key={w.token_type} className="rounded-lg border bg-muted/40 px-4 py-2">
                                    <span className="text-xs text-muted-foreground uppercase">{w.token_type}</span>
                                    <div className="font-mono font-bold">{Number(w.balance).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* KYC Application */}
            <Card className={!currentAgent.is_verified ? "border-orange-200 bg-orange-50/10 dark:border-orange-800 dark:bg-orange-950/20" : "border-green-200 bg-green-50/10 dark:border-green-800 dark:bg-green-950/20"}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" /> KYC Application
                    </CardTitle>
                    <CardDescription>
                        Review submitted documents and verify agent identity.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {kyc ? (
                        <>
                            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                                <div><span className="font-medium text-muted-foreground">Status</span><div><Badge variant={kyc.status === 'approved' ? 'default' : 'secondary'} className="mt-1">{kyc.status.replace(/_/g, ' ')}</Badge></div></div>
                                <div><span className="font-medium text-muted-foreground">ID Number</span><div className="font-mono">{kyc.id_document_number || "—"}</div></div>
                                <div><span className="font-medium text-muted-foreground">ID Type</span><div className="capitalize">{kyc.id_document_type?.replace(/_/g, ' ') || "—"}</div></div>
                                <div><span className="font-medium text-muted-foreground">Full Legal Name</span><div>{kyc.full_legal_name || "—"}</div></div>
                                <div><span className="font-medium text-muted-foreground">Date of Birth</span><div>{kyc.date_of_birth ? format(new Date(kyc.date_of_birth), "MMM d, yyyy") : "—"}</div></div>
                                <div><span className="font-medium text-muted-foreground">Nationality</span><div>{kyc.nationality || "—"}</div></div>
                                <div><span className="font-medium text-muted-foreground">Submitted</span><div>{format(new Date(kyc.submitted_at), "MMM d, yyyy HH:mm")}</div></div>
                                {kyc.reviewed_at && <div><span className="font-medium text-muted-foreground">Reviewed</span><div>{format(new Date(kyc.reviewed_at), "MMM d, yyyy")}</div></div>}
                                {kyc.risk_level && <div><span className="font-medium text-muted-foreground">Risk</span><div className="capitalize">{kyc.risk_level}</div></div>}
                                {kyc.residential_address && <div className="sm:col-span-2"><span className="font-medium text-muted-foreground">Address</span><div className="text-muted-foreground">{kyc.residential_address}</div></div>}
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm font-medium">Documents</p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {docItems.map(({ label, url }) => (
                                        <div key={label} className="flex items-center justify-between rounded-lg border bg-background p-3">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                                                <div>
                                                    <p className="font-medium">{label}</p>
                                                    <p className="text-xs text-muted-foreground">{url ? "Available" : "Not uploaded"}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openDocument(url, label)}
                                                disabled={!url}
                                            >
                                                <ExternalLink className="h-3 w-3 mr-1" />
                                                View
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {kyc.status === 'under_review' && (
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                        onClick={() => handleKycAction('approve')}
                                        disabled={isActionLoading}
                                    >
                                        Approve KYC
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => setRejectDialog(true)}
                                        disabled={isActionLoading}
                                    >
                                        Reject
                                    </Button>
                                </div>
                            )}

                            {kyc.status === 'rejected' && kyc.rejection_reason && (
                                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200">
                                    <strong>Rejection reason:</strong> {kyc.rejection_reason}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <AlertTriangle className="h-10 w-10 mb-3 opacity-50" />
                            <p className="font-medium">No KYC documents submitted yet.</p>
                            <p className="text-sm">Agent must upload ID, selfie, and proof of address to be verified.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Rejection Dialog */}
            <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject KYC Application</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this application. The agent will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Rejection Reason</Label>
                            <Input
                                placeholder="e.g. Document image is blurry"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => handleKycAction('reject')} disabled={!reason || isActionLoading}>
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Suspension Dialog */}
            <Dialog open={suspendDialog} onOpenChange={setSuspendDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Suspend Agent</DialogTitle>
                        <DialogDescription>
                            This will halt all agent operations.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Reason for Suspension</Label>
                            <Input
                                placeholder="e.g. Policy violation"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSuspendDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => handleStatusAction('suspend')} disabled={!reason || isActionLoading}>
                            Suspend Agent
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
