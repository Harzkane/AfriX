"use client";

import { useDisputes } from "@/hooks/useDisputes";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Loader2,
    ArrowLeft,
    ShieldAlert,
    AlertTriangle,
    Coins,
    Hash,
    FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function DisputeDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const {
        currentDispute,
        isLoading,
        fetchDispute,
        escalateDispute,
        resolveDispute
    } = useDisputes();

    const [notes, setNotes] = useState("");
    const [actionDialog, setActionDialog] = useState<string | null>(null);

    useEffect(() => {
        if (id) fetchDispute(id as string);
    }, [id, fetchDispute]);

    if (isLoading || !currentDispute) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const displayReference =
        currentDispute.escrow?.transaction?.reference ||
        currentDispute.transaction_summary?.reference ||
        currentDispute.reference ||
        currentDispute.mintRequest?.user_bank_reference ||
        currentDispute.transaction_id ||
        currentDispute.id;
    const displayAmount =
        currentDispute.transaction_summary?.amount ??
        currentDispute.escrow?.amount ??
        currentDispute.mintRequest?.amount;
    const displayTokenType =
        currentDispute.transaction_summary?.token_type ||
        currentDispute.escrow?.token_type ||
        currentDispute.mintRequest?.token_type;
    const isMintDispute = !!currentDispute.mintRequest && !currentDispute.escrow;
    const userRoleLabel = isMintDispute ? "Buyer" : "Seller";
    const amountLabel = isMintDispute ? "Request Amount" : "Escrow Amount";
    const agentProvidedNote =
        currentDispute.mintRequest?.rejection_reason ||
        currentDispute.escrow?.burnRequest?.rejection_reason;

    const handleAction = async () => {
        if (!actionDialog) return;

        try {
            if (actionDialog === 'escalate') {
                await escalateDispute(currentDispute.id, 'arbitration', notes);
            } else if (actionDialog === 'refund') {
                await resolveDispute(currentDispute.id, 'refund', notes);
            } else if (actionDialog === 'penalize') {
                // Hardcoded 50 USD penalty for demo
                await resolveDispute(currentDispute.id, 'penalize_agent', notes, 50);
            } else if (actionDialog === 'complete') {
                await resolveDispute(currentDispute.id, 'complete', notes);
            }
            setActionDialog(null);
            setNotes("");
        } catch (error) {
            // Handled by hook
        }
    };

    const openActionDialog = (action: string) => {
        setActionDialog(action);
        // Set default messages
        switch (action) {
            case 'refund':
                setNotes(
                    isMintDispute
                        ? "Crediting the user with the owed tokens after dispute review."
                        : "Refunding the user's escrowed tokens after dispute review."
                );
                break;
            case 'complete':
                setNotes(
                    isMintDispute
                        ? "Closing the mint dispute in the agent's favor. No token credit will be applied."
                        : "Agent provided valid fiat proof. Releasing the burn settlement."
                );
                break;
            case 'penalize':
                setNotes(
                    isMintDispute
                        ? "Crediting the user and applying an agent penalty after dispute review."
                        : "Refunding the user and applying an agent penalty after dispute review."
                );
                break;
            case 'escalate':
                setNotes("Escalated for administrative review.");
                break;
            default:
                setNotes("");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dispute #{currentDispute.id.substring(0, 8)}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {currentDispute.status === 'open' && <Badge variant="secondary">Open</Badge>}
                        {currentDispute.status === 'resolved' && <Badge className="bg-green-600">Resolved</Badge>}
                        {currentDispute.escalation_level !== 'auto' && <Badge variant="destructive">{currentDispute.escalation_level.replace('_', ' ').toUpperCase()}</Badge>}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Dispute Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5" /> Case Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3">
                            <div className="p-3 bg-muted rounded-md">
                                <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                                    <Hash className="h-4 w-4" /> Reference
                                </h4>
                                <p className="text-sm break-all font-mono">{displayReference}</p>
                            </div>
                            <div className="p-3 bg-muted rounded-md">
                                <h4 className="font-semibold text-sm mb-1">Reason</h4>
                                <p className="text-sm">{currentDispute.reason}</p>
                            </div>
                            {currentDispute.details && (
                                <div className="p-3 bg-muted rounded-md">
                                    <h4 className="font-semibold text-sm mb-1">Description</h4>
                                    <p className="text-sm">{currentDispute.details}</p>
                                </div>
                            )}
                            {agentProvidedNote && (
                                <div className="p-3 bg-muted rounded-md">
                                    <h4 className="font-semibold text-sm mb-1">Agent Note</h4>
                                    <p className="text-sm">{agentProvidedNote}</p>
                                </div>
                            )}
                            {currentDispute.transaction_summary && (
                                <div className="p-3 bg-muted rounded-md">
                                    <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> Transaction Summary
                                    </h4>
                                    <p className="text-sm">
                                        Type: {currentDispute.transaction_summary.type || "N/A"}<br />
                                        Status: {currentDispute.transaction_summary.status || "N/A"}<br />
                                        Record ID: {currentDispute.transaction_summary.id || "N/A"}
                                    </p>
                                </div>
                            )}

                            {/* Evidence / Proof Section */}
                            {(currentDispute.mintRequest?.payment_proof_url || currentDispute.escrow?.burnRequest?.fiat_proof_url) && (
                                <div className="p-3 border rounded-md">
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-500" /> Uploaded Evidence
                                    </h4>
                                    <div className="relative aspect-video rounded-md overflow-hidden bg-slate-100 border">
                                        <img
                                            src={currentDispute.mintRequest?.payment_proof_url || currentDispute.escrow?.burnRequest?.fiat_proof_url}
                                            alt="Dispute Evidence"
                                            className="object-contain w-full h-full cursor-zoom-in"
                                            onClick={() => window.open(currentDispute.mintRequest?.payment_proof_url || currentDispute.escrow?.burnRequest?.fiat_proof_url, '_blank')}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 text-center">
                                        Click image to view full size
                                    </p>
                                </div>
                            )}

                            {currentDispute.resolution && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                    <h4 className="font-semibold text-sm mb-1 text-green-800">Resolution</h4>
                                    <p className="text-sm text-green-700">
                                        Action: {currentDispute.resolution.action}<br />
                                        Notes: {currentDispute.resolution.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Transaction & Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Coins className="h-5 w-5" /> Transaction
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-medium text-sm">{amountLabel}</span>
                            <span>{displayAmount != null ? Number(displayAmount).toLocaleString() : "N/A"} {displayTokenType || ""}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-medium text-sm">Complainant ({userRoleLabel})</span>
                            <span>{currentDispute.user?.full_name}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-medium text-sm">Respondent (Agent)</span>
                            <span>{currentDispute.agent?.id ? `ID: ${currentDispute.agent.id.substring(0, 8)}` : "System"}</span>
                        </div>

                        {currentDispute.status === 'open' && (
                            <div className="pt-4 space-y-3">
                                <h4 className="text-sm font-semibold">Admin Actions</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        className="bg-blue-600 hover:bg-blue-700 text-xs px-2"
                                        onClick={() => openActionDialog('refund')}
                                    >
                                        {isMintDispute ? "Credit User Tokens" : "Refund User Tokens"}
                                    </Button>
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 text-xs px-2"
                                        onClick={() => openActionDialog('complete')}
                                    >
                                        {isMintDispute ? "Close in Agent's Favor" : "Release Settlement"}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="text-xs px-2"
                                        onClick={() => openActionDialog('penalize')}
                                    >
                                        {isMintDispute ? "Credit User + Penalize" : "Refund + Penalize"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="col-span-2"
                                        onClick={() => openActionDialog('escalate')}
                                    >
                                        <AlertTriangle className="mr-2 h-4 w-4" /> Escalate Priority
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={!!actionDialog} onOpenChange={(open) => !open && setActionDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Confirm Action: {
                                actionDialog === "refund"
                                    ? isMintDispute ? "Credit User Tokens" : "Refund User Tokens"
                                    : actionDialog === "complete"
                                        ? isMintDispute ? "Close in Agent's Favor" : "Release Settlement"
                                        : actionDialog === "penalize"
                                            ? isMintDispute ? "Credit User + Penalize Agent" : "Refund User + Penalize Agent"
                                            : actionDialog?.toUpperCase()
                            }
                        </DialogTitle>
                        <DialogDescription>
                            {isMintDispute
                                ? "Use language that reflects token crediting, dispute closure, or agent penalty rather than fiat settlement."
                                : "Use language that reflects escrow refund, settlement release, or agent penalty."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Textarea
                            placeholder="Enter resolution notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
                        <Button onClick={handleAction} disabled={!notes}>Confirm</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
