"use client";

import { useOperations, Dispute } from "@/hooks/useOperations";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Loader2,
    ArrowLeft,
    User,
    Briefcase,
    Lock,
    FileText,
    ArrowUpCircle,
    CheckCircle,
    DollarSign,
    Hash,
    Receipt,
    ImageIcon,
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
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const getErrorMessage = (error: unknown, fallback: string) => {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: unknown }).response === "object" &&
        (error as { response?: { data?: unknown } }).response?.data &&
        typeof (error as { response?: { data?: { error?: unknown } } }).response?.data?.error === "string"
    ) {
        return (error as { response?: { data?: { error?: string } } }).response?.data?.error || fallback;
    }

    return fallback;
};

export default function DisputeDetailPage() {
    const { id } = useParams();
    const { fetchDispute, escalateDispute, resolveDispute } = useOperations();
    const [dispute, setDispute] = useState<Dispute | null>(null);
    const [loading, setLoading] = useState(true);
    const [escalateOpen, setEscalateOpen] = useState(false);
    const [resolveOpen, setResolveOpen] = useState(false);
    const [escalationLevel, setEscalationLevel] = useState("admin");
    const [escalationNotes, setEscalationNotes] = useState("");
    const [resolveAction, setResolveAction] = useState("refund");
    const [resolveNotes, setResolveNotes] = useState("");
    const [penaltyAmount, setPenaltyAmount] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (id) {
            setLoading(true);
            fetchDispute(id as string).then((d) => {
                setDispute(d);
                setLoading(false);
            });
        }
    }, [id, fetchDispute]);

    const handleEscalate = async () => {
        if (!dispute) return;
        setActionLoading(true);
        try {
            await escalateDispute(dispute.id, escalationLevel, escalationNotes);
            toast.success("Dispute escalated");
            setEscalateOpen(false);
            setEscalationNotes("");
            const updated = await fetchDispute(dispute.id);
            setDispute(updated ?? null);
        } catch (e: unknown) {
            toast.error(getErrorMessage(e, "Escalation failed"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleResolve = async () => {
        if (!dispute) return;
        if (resolveAction === "penalize_agent" && !penaltyAmount) {
            toast.error("Penalty amount required");
            return;
        }
        setActionLoading(true);
        try {
            await resolveDispute(dispute.id, {
                action: resolveAction,
                penalty_amount_usd: resolveAction === "penalize_agent" ? parseFloat(penaltyAmount) : undefined,
                notes: resolveNotes,
            });
            toast.success("Dispute resolved");
            setResolveOpen(false);
            setResolveNotes("");
            setPenaltyAmount("");
            const updated = await fetchDispute(dispute.id);
            setDispute(updated ?? null);
        } catch (e: unknown) {
            toast.error(getErrorMessage(e, "Resolution failed"));
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
            open: { variant: "outline", className: "bg-yellow-500/10 text-yellow-600" },
            resolved: { variant: "default", className: "bg-green-600" },
            escalated: { variant: "destructive" },
        };
        const c = map[status] || map.open;
        return <Badge variant={c.variant} className={c.className}>{status?.toUpperCase()}</Badge>;
    };

    if (loading || !dispute) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const transactionSummary = dispute.transaction_summary;
    const isMintDispute = !!dispute.mintRequest && !dispute.escrow;
    const amountLabel = isMintDispute ? "Request Amount" : "Escrow Amount";
    const displayReference =
        dispute.escrow?.transaction?.reference ||
        transactionSummary?.reference ||
        dispute.reference ||
        dispute.mintRequest?.user_bank_reference ||
        dispute.id;
    const displayAmount =
        transactionSummary?.amount ||
        dispute.escrow?.amount ||
        dispute.mintRequest?.amount;
    const displayTokenType =
        transactionSummary?.token_type ||
        dispute.escrow?.token_type ||
        dispute.mintRequest?.token_type;
    const agentProvidedNote =
        dispute.mintRequest?.rejection_reason ||
        dispute.escrow?.burnRequest?.rejection_reason;
    const resolveActionLabels = isMintDispute
        ? {
            refund: "Credit User Tokens",
            penalize_agent: "Credit User + Penalize Agent",
            complete: "Close in Agent's Favor",
        }
        : {
            refund: "Refund User Tokens",
            penalize_agent: "Refund User + Penalize Agent",
            complete: "Release Burn Settlement",
        };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/operations/disputes">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight">Dispute #{dispute.id.slice(0, 8)}</h1>
                    <p className="text-sm text-muted-foreground">{dispute.reason}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(dispute.status)}
                    {dispute.status === "open" && (
                        <>
                            <Button variant="outline" size="sm" onClick={() => setEscalateOpen(true)}>
                                <ArrowUpCircle className="mr-2 h-4 w-4" /> Escalate
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setResolveOpen(true)}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Resolve
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" /> Overview
                    </CardTitle>
                    <CardDescription>Dispute reason, reference, and escalation level.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase">Reference</p>
                            <p className="font-mono text-sm break-all">{displayReference}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase">Type</p>
                            <p className="font-medium">
                                {transactionSummary?.type || (dispute.mintRequest ? "mint_request" : dispute.escrow ? "escrow" : "dispute")}
                            </p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase">Reason</p>
                        <p className="font-medium">{dispute.reason}</p>
                    </div>
                    {dispute.details && (
                        <div>
                            <p className="text-xs text-muted-foreground uppercase">Details</p>
                            <p className="text-sm text-muted-foreground">{dispute.details}</p>
                        </div>
                    )}
                    {agentProvidedNote && (
                        <div>
                            <p className="text-xs text-muted-foreground uppercase">Agent Note</p>
                            <p className="text-sm text-muted-foreground">{agentProvidedNote}</p>
                        </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase">Escalation</p>
                            <Badge variant="outline">{dispute.escalation_level?.replace(/_/g, " ")}</Badge>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase">Created / Updated</p>
                            <p className="text-sm">{format(new Date(dispute.created_at), "MMM d, yyyy HH:mm")} / {format(new Date(dispute.updated_at), "MMM d, yyyy")}</p>
                        </div>
                    </div>
                    {dispute.resolution && Object.keys(dispute.resolution).length > 0 && (
                        <div className="rounded-md border bg-muted/40 p-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase">Resolution</p>
                            <pre className="text-xs mt-1 overflow-auto max-h-32">{JSON.stringify(dispute.resolution, null, 2)}</pre>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                {/* User (opener) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" /> User (Opener)
                        </CardTitle>
                        <CardDescription>User who opened this dispute.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {dispute.user ? (
                            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                                <p className="font-medium">{dispute.user.full_name}</p>
                                <p className="text-sm text-muted-foreground">{dispute.user.email}</p>
                                {dispute.user.phone_number && <p className="text-sm">{dispute.user.phone_number}</p>}
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/users/${dispute.user.id}`}>View user</Link>
                                </Button>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">User ID: {dispute.opened_by_user_id}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Agent */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5" /> Agent
                        </CardTitle>
                        <CardDescription>Agent involved in this dispute.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {dispute.agent ? (
                            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                                <p className="font-medium">Tier: {dispute.agent.tier} • Rating: {dispute.agent.rating}</p>
                                {dispute.agent.deposit_usd != null && <p className="text-sm text-muted-foreground">Deposit: ${Number(dispute.agent.deposit_usd).toLocaleString()}</p>}
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/agents/${dispute.agent.id}`}>View agent</Link>
                                </Button>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">Agent ID: {dispute.agent_id || "—"}</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" /> Transaction Details
                    </CardTitle>
                    <CardDescription>
                        {isMintDispute
                            ? "Underlying mint request data tied to this dispute."
                            : "Underlying escrow and burn-settlement data tied to this dispute."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border bg-muted/30 p-4">
                            <p className="text-xs text-muted-foreground uppercase">{amountLabel}</p>
                            <p className="mt-1 text-lg font-semibold">
                                {displayAmount != null ? Number(displayAmount).toLocaleString() : "N/A"} {displayTokenType || ""}
                            </p>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-4">
                            <p className="text-xs text-muted-foreground uppercase">Status</p>
                            <p className="mt-1 text-lg font-semibold">
                                {transactionSummary?.status || dispute.mintRequest?.status || dispute.escrow?.status || "N/A"}
                            </p>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-4">
                            <p className="text-xs text-muted-foreground uppercase">Record ID</p>
                            <p className="mt-1 text-sm font-mono break-all">
                                {transactionSummary?.id || dispute.mintRequest?.id || dispute.escrow?.transaction?.id || dispute.escrow?.id || "N/A"}
                            </p>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-4">
                            <p className="text-xs text-muted-foreground uppercase">Last Updated</p>
                            <p className="mt-1 text-sm">
                                {transactionSummary?.updated_at
                                    ? format(new Date(transactionSummary.updated_at), "MMM d, yyyy HH:mm")
                                    : format(new Date(dispute.updated_at), "MMM d, yyyy HH:mm")}
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border p-4 space-y-2">
                            <p className="text-xs text-muted-foreground uppercase flex items-center gap-2">
                                <Hash className="h-3.5 w-3.5" /> Reference Data
                            </p>
                            <p className="text-sm"><span className="font-medium">Display reference:</span> {displayReference}</p>
                            {dispute.mintRequest?.user_bank_reference && (
                                <p className="text-sm"><span className="font-medium">Bank reference:</span> {dispute.mintRequest.user_bank_reference}</p>
                            )}
                            {dispute.escrow?.transaction?.reference && (
                                <p className="text-sm"><span className="font-medium">Escrow transaction ref:</span> {dispute.escrow.transaction.reference}</p>
                            )}
                        </div>

                        <div className="rounded-lg border p-4 space-y-2">
                            <p className="text-xs text-muted-foreground uppercase flex items-center gap-2">
                                <DollarSign className="h-3.5 w-3.5" /> Linked Records
                            </p>
                            <p className="text-sm"><span className="font-medium">Mint request:</span> {dispute.mintRequest?.id || "N/A"}</p>
                            <p className="text-sm"><span className="font-medium">Escrow:</span> {dispute.escrow?.id || "N/A"}</p>
                            <p className="text-sm"><span className="font-medium">Transaction:</span> {dispute.escrow?.transaction?.id || transactionSummary?.id || "N/A"}</p>
                        </div>
                    </div>

                    {dispute.mintRequest?.payment_proof_url && (
                        <div className="rounded-lg border p-4 space-y-3">
                            <p className="text-xs text-muted-foreground uppercase flex items-center gap-2">
                                <ImageIcon className="h-3.5 w-3.5" /> Payment Proof
                            </p>
                            <Button variant="outline" size="sm" asChild>
                                <a href={dispute.mintRequest.payment_proof_url} target="_blank" rel="noreferrer">
                                    Open proof image
                                </a>
                            </Button>
                        </div>
                    )}

                    {dispute.escrow?.burnRequest?.fiat_proof_url && (
                        <div className="rounded-lg border p-4 space-y-3">
                            <p className="text-xs text-muted-foreground uppercase flex items-center gap-2">
                                <ImageIcon className="h-3.5 w-3.5" /> Fiat Proof
                            </p>
                            <Button variant="outline" size="sm" asChild>
                                <a href={dispute.escrow.burnRequest.fiat_proof_url} target="_blank" rel="noreferrer">
                                    Open proof image
                                </a>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Linked escrow */}
            {dispute.escrow && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" /> Linked Escrow
                        </CardTitle>
                        <CardDescription>Escrow tied to this dispute.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <p className="font-mono font-bold">{parseFloat(dispute.escrow.amount).toLocaleString()} {dispute.escrow.token_type}</p>
                                <p className="text-sm text-muted-foreground">Status: {dispute.escrow.status}</p>
                                {dispute.escrow.transaction && (
                                    <p className="text-xs text-muted-foreground">Tx: {dispute.escrow.transaction.reference}</p>
                                )}
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/operations/escrows/${dispute.escrow.id}`}>View escrow</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Dialog open={escalateOpen} onOpenChange={setEscalateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Escalate Dispute</DialogTitle>
                        <DialogDescription>Set escalation level and optional notes.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Level</Label>
                            <Select value={escalationLevel} onValueChange={setEscalationLevel}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user_requested">User Requested</SelectItem>
                                    <SelectItem value="admin">Admin Review</SelectItem>
                                    <SelectItem value="arbitration">Arbitration</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Notes (optional)</Label>
                            <Textarea placeholder="Escalation notes..." value={escalationNotes} onChange={(e) => setEscalationNotes(e.target.value)} rows={3} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEscalateOpen(false)}>Cancel</Button>
                        <Button onClick={handleEscalate} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Escalate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Resolve Dispute</DialogTitle>
                        <DialogDescription>
                            {isMintDispute
                                ? "Choose whether to credit the user with tokens, apply an agent penalty, or close the case in the agent's favor."
                                : "Choose whether to refund the user from escrow, apply an agent penalty, or release the burn settlement."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Action</Label>
                            <Select value={resolveAction} onValueChange={setResolveAction}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="refund">{resolveActionLabels.refund}</SelectItem>
                                    <SelectItem value="penalize_agent">{resolveActionLabels.penalize_agent}</SelectItem>
                                    <SelectItem value="complete">{resolveActionLabels.complete}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {resolveAction === "penalize_agent" && (
                            <div className="space-y-2">
                                <Label>Penalty amount (USD)</Label>
                                <Input type="number" placeholder="0.00" value={penaltyAmount} onChange={(e) => setPenaltyAmount(e.target.value)} />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Notes (optional)</Label>
                            <Textarea placeholder="Resolution notes..." value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)} rows={3} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResolveOpen(false)}>Cancel</Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={handleResolve} disabled={actionLoading || (resolveAction === "penalize_agent" && !penaltyAmount)}>
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Resolve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
