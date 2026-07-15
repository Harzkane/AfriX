"use client";

import { useMerchants } from "@/hooks/useMerchants";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Loader2,
    ArrowLeft,
    Store,
    FileText,
    Building2,
    Mail,
    Phone,
    CheckCircle,
    XCircle,
    Wallet,
    CreditCard,
    Activity,
    ShieldCheck,
    Download
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MerchantDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const {
        currentMerchant,
        currentMerchantFinancials,
        isLoading,
        fetchMerchant,
        fetchMerchantFinancialSummary,
        approveMerchant,
        rejectMerchant
    } = useMerchants();

    const [isActionLoading, setIsActionLoading] = useState(false);
    const [rejectDialog, setRejectDialog] = useState(false);
    const [reason, setReason] = useState("");

    useEffect(() => {
        if (!id) return;
        fetchMerchant(id as string);
        fetchMerchantFinancialSummary(id as string);
    }, [id, fetchMerchant, fetchMerchantFinancialSummary]);

    if (isLoading || !currentMerchant) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const handleAction = async (action: 'approve' | 'reject') => {
        setIsActionLoading(true);
        try {
            if (action === 'approve') {
                await approveMerchant(currentMerchant.id);
            } else {
                await rejectMerchant(currentMerchant.id, reason);
                setRejectDialog(false);
                setReason("");
            }
        } catch (error) {
            // Handled
        } finally {
            setIsActionLoading(false);
        }
    };

    const formatTokenAmount = (amount?: number | string, tokenType?: string) => {
        const value = typeof amount === "number" ? amount : parseFloat(String(amount || 0)) || 0;
        return `${value.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        })} ${tokenType || ""}`.trim();
    };

    const formatDateTime = (value?: string | null) => {
        if (!value) return "N/A";
        return format(new Date(value), "MMM d, yyyy • h:mm a");
    };

    const getSourceLabel = (source?: string) => {
        if (source === "kaalis") return "Kaalis";
        if (source === "api") return "API";
        return "Direct AfriExchange";
    };

    const exportMerchantTransactions = () => {
        const transactions = currentMerchantFinancials?.recent_collections || [];
        const headers = ["Reference", "Amount", "Token", "Status", "Source", "Date", "Processed At", "Tx Hash"];
        
        const escapeCsv = (val: any) => {
            const stringified = String(val ?? "");
            if (stringified.includes(",") || stringified.includes('"') || stringified.includes("\n")) {
                return `"${stringified.replace(/"/g, '""')}"`;
            }
            return stringified;
        };

        const rows = transactions.map((tx: any) => [
            escapeCsv(tx.reference),
            escapeCsv(tx.amount),
            escapeCsv(tx.token_type),
            escapeCsv(tx.status),
            escapeCsv(tx.source || "direct"),
            escapeCsv(tx.created_at ? format(new Date(tx.created_at), "yyyy-MM-dd HH:mm:ss") : ""),
            escapeCsv(tx.processed_at ? format(new Date(tx.processed_at), "yyyy-MM-dd HH:mm:ss") : ""),
            escapeCsv(tx.tx_hash)
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `merchant-${currentMerchant.business_name?.replace(/\s+/g, '-').toLowerCase()}-tx-${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{currentMerchant.business_name}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Store className="h-3 w-3" /> Merchant Profile
                        <span>•</span>
                        {currentMerchant.verification_status === 'approved' && <Badge className="bg-green-600">Verified Partner</Badge>}
                        {currentMerchant.verification_status === 'pending' && <Badge variant="secondary">Pending Review</Badge>}
                        {currentMerchant.verification_status === 'rejected' && <Badge variant="destructive">Rejected</Badge>}
                    </div>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="financials">Financials</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" /> Business Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-3">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="font-medium text-sm">Business Name</span>
                                        <span>{currentMerchant.business_name}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="font-medium text-sm">Display Name</span>
                                        <span>{currentMerchant.display_name || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="font-medium text-sm">Merchant ID</span>
                                        <span className="font-mono text-xs">{currentMerchant.id}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="font-medium text-sm">Tax ID / TIN</span>
                                        <span className="font-mono">{currentMerchant.kyc?.tax_id || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="font-medium text-sm">Reg Number</span>
                                        <span className="font-mono">{currentMerchant.kyc?.registration_number || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="font-medium text-sm">Owner</span>
                                        <span>{currentMerchant.owner?.full_name || currentMerchant.user?.full_name || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between pt-2">
                                        <span className="font-medium text-sm">Joined</span>
                                        <span>{format(new Date(currentMerchant.created_at), "MMM d, yyyy")}</span>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="h-4 w-4" /> {currentMerchant.business_email}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Phone className="h-4 w-4" /> {currentMerchant.business_phone}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Wallet className="h-5 w-5" /> Settlement & Integration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-3">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="font-medium text-sm">Settlement Wallet ID</span>
                                        <span className="font-mono text-xs">{currentMerchantFinancials?.settlement_wallet?.id || currentMerchant.settlement_wallet_id || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="font-medium text-sm">Token Type</span>
                                        <span>{currentMerchantFinancials?.settlement_wallet?.token_type || currentMerchant.default_token_type || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="font-medium text-sm">Merchant Fee</span>
                                        <span>{currentMerchant.payment_fee_percent ?? currentMerchantFinancials?.merchant.payment_fee_percent ?? 0}%</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="font-medium text-sm">Webhook URL</span>
                                        <span className="max-w-[220px] truncate text-right text-sm text-muted-foreground">
                                            {currentMerchantFinancials?.merchant.webhook_url || currentMerchant.webhook_url || "Not configured"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2">
                                        <span className="font-medium text-sm">API Key</span>
                                        <Badge variant={currentMerchantFinancials?.merchant.api_key_configured ? "default" : "secondary"}>
                                            {currentMerchantFinancials?.merchant.api_key_configured ? "Configured" : "Not configured"}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="financials" className="space-y-6">
                    <Card className="border-cyan-200 bg-cyan-50/60 dark:border-cyan-900/30 dark:bg-cyan-950/20">
                        <CardContent className="p-4 text-sm text-cyan-950 dark:text-cyan-200">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-700 dark:text-cyan-400" />
                                <div>
                                    <p className="font-medium">Fee scope note</p>
                                    <p className="mt-1 text-cyan-900/80 dark:text-cyan-300/80">
                                        {currentMerchantFinancials?.notes?.fee_scope || "AfriExchange merchant fees shown here are separate from any external marketplace platform fees."}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Successful Collections</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{currentMerchantFinancials?.summary.successful_collections_count || 0}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Failed Collections</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{currentMerchantFinancials?.summary.failed_collections_count || 0}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{currentMerchantFinancials?.summary.pending_collections_count || 0}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Processing</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{currentMerchantFinancials?.summary.processing_collections_count || 0}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Settlement Balance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatTokenAmount(
                                        currentMerchantFinancials?.settlement_wallet?.balance,
                                        currentMerchantFinancials?.settlement_wallet?.token_type
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Wallet className="h-5 w-5" /> Settlement Wallet
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="font-medium">Wallet ID</span>
                                    <span className="font-mono text-xs">{currentMerchantFinancials?.settlement_wallet?.id || "N/A"}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="font-medium">Available Balance</span>
                                    <span>{formatTokenAmount(currentMerchantFinancials?.settlement_wallet?.available_balance, currentMerchantFinancials?.settlement_wallet?.token_type)}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="font-medium">Pending Balance</span>
                                    <span>{formatTokenAmount(currentMerchantFinancials?.settlement_wallet?.pending_balance, currentMerchantFinancials?.settlement_wallet?.token_type)}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="font-medium">Blockchain Address</span>
                                    <span className="max-w-[220px] truncate font-mono text-xs">{currentMerchantFinancials?.settlement_wallet?.blockchain_address || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Last Synced</span>
                                    <span>{formatDateTime(currentMerchantFinancials?.settlement_wallet?.last_synced_at)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5" /> Collection Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="mb-2 text-sm font-medium">Total Volume by Token</p>
                                    <div className="space-y-2">
                                        {Object.entries(currentMerchantFinancials?.summary.total_volume || {}).length ? (
                                            Object.entries(currentMerchantFinancials?.summary.total_volume || {}).map(([token, value]) => (
                                                <div key={token} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                                                    <span>{token}</span>
                                                    <span className="font-medium">{formatTokenAmount(value, token)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No completed collections yet.</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="mb-2 text-sm font-medium">Platform Fees by Token</p>
                                    <div className="space-y-2">
                                        {Object.entries(currentMerchantFinancials?.summary.total_fees || {}).length ? (
                                            Object.entries(currentMerchantFinancials?.summary.total_fees || {}).map(([token, value]) => (
                                                <div key={token} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                                                    <span>{token}</span>
                                                    <span className="font-medium">{formatTokenAmount(value, token)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No fee activity yet.</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" /> Recent Merchant Collections
                                </CardTitle>
                                <CardDescription>
                                    Direct AfriExchange collections and marketplace-linked collections, including Kaalis.
                                </CardDescription>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2"
                                onClick={exportMerchantTransactions}
                                disabled={!currentMerchantFinancials?.recent_collections?.length}
                            >
                                <Download className="h-4 w-4" />
                                Export CSV
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Reference</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Created</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Payer</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Source</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Amount</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Fee</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Net</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border bg-transparent">
                                        {currentMerchantFinancials?.recent_collections?.length ? currentMerchantFinancials.recent_collections.map((collection) => (
                                            <tr key={collection.id}>
                                                <td className="px-4 py-3 text-xs font-mono text-foreground">{collection.reference}</td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateTime(collection.created_at)}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="flex flex-col">
                                                        <span>{collection.payer?.full_name || "Unknown payer"}</span>
                                                        <span className="text-xs text-muted-foreground">{collection.payer?.email || "No email"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={collection.source === "kaalis" ? "default" : "secondary"}>
                                                        {getSourceLabel(collection.source)}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium">{formatTokenAmount(collection.amount, collection.token_type)}</td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">{formatTokenAmount(collection.fee, collection.token_type)}</td>
                                                <td className="px-4 py-3 text-sm font-medium">{formatTokenAmount(collection.net_settlement, collection.token_type)}</td>
                                                <td className="px-4 py-3 text-sm capitalize text-muted-foreground">{collection.status}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                                    No merchant collections found yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="compliance" className="space-y-6">
                    <Card className={currentMerchant.verification_status === 'pending' ? "border-blue-200 bg-blue-50/10" : ""}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" /> Application Review
                            </CardTitle>
                            <CardDescription>
                                Assess validity of business documents.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {currentMerchant.kyc ? (
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between rounded-md border bg-background p-4">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-8 w-8 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">Business Registration</p>
                                                    <p className="text-xs text-muted-foreground">Document submitted on {format(new Date(currentMerchant.kyc.submitted_at), "MMM d")}</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" disabled={!currentMerchant.kyc?.business_certificate_url && !currentMerchant.kyc?.document_url} onClick={() => window.open(currentMerchant.kyc?.business_certificate_url || currentMerchant.kyc?.document_url, '_blank')}>View</Button>
                                        </div>
                                        
                                        <div className="flex items-center justify-between rounded-md border bg-background p-4">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-8 w-8 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">Government ID</p>
                                                    <p className="text-xs text-muted-foreground">Document submitted on {format(new Date(currentMerchant.kyc.submitted_at), "MMM d")}</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" disabled={!currentMerchant.kyc?.id_document_url} onClick={() => window.open(currentMerchant.kyc?.id_document_url, '_blank')}>View</Button>
                                        </div>
                                        
                                        <div className="flex items-center justify-between rounded-md border bg-background p-4">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-8 w-8 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">Proof of Address</p>
                                                    <p className="text-xs text-muted-foreground">Document submitted on {format(new Date(currentMerchant.kyc.submitted_at), "MMM d")}</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" disabled={!currentMerchant.kyc?.proof_of_address_url} onClick={() => window.open(currentMerchant.kyc?.proof_of_address_url, '_blank')}>View</Button>
                                        </div>
                                    </div>

                                    {currentMerchant.verification_status === 'pending' && (
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                className="flex-1 bg-green-600 hover:bg-green-700"
                                                onClick={() => handleAction('approve')}
                                                disabled={isActionLoading}
                                            >
                                                <CheckCircle className="mr-2 h-4 w-4" /> Approve Application
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                className="flex-1"
                                                onClick={() => setRejectDialog(true)}
                                                disabled={isActionLoading}
                                            >
                                                <XCircle className="mr-2 h-4 w-4" /> Reject
                                            </Button>
                                        </div>
                                    )}

                                    {currentMerchant.verification_status === 'rejected' && (
                                        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                                            <strong>Rejection Reason:</strong> {currentMerchant.kyc.rejection_reason}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="py-4 text-center text-muted-foreground">No KYC documents submitted.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Merchant Application</DialogTitle>
                        <DialogDescription>
                            Reason for rejection will be sent to the business email.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Rejection Reason</Label>
                            <Input
                                placeholder="e.g. Invalid Tax ID"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => handleAction('reject')} disabled={!reason || isActionLoading}>
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
