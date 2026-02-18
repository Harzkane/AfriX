"use client";

import { useDisputes } from "@/hooks/useDisputes";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Loader2,
    ArrowLeft,
    ShieldAlert,
    AlertTriangle,
    Coins
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
                setNotes("Proof of payment not provided or invalid. Refunding burner.");
                break;
            case 'complete':
                setNotes("Agent provided valid proof of payment. Finalizing transaction.");
                break;
            case 'penalize':
                setNotes("Agent failed to comply with terms. Penalizing and refunding.");
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
                                <h4 className="font-semibold text-sm mb-1">Reason</h4>
                                <p className="text-sm">{currentDispute.reason}</p>
                            </div>
                            <div className="p-3 bg-muted rounded-md">
                                <h4 className="font-semibold text-sm mb-1">Description</h4>
                                <p className="text-sm">{currentDispute.details}</p>
                            </div>

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
                            <span className="font-medium text-sm">Escrow Amount</span>
                            <span>{currentDispute.escrow?.amount} {currentDispute.escrow?.token_type}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-medium text-sm">Complainant (Buyer)</span>
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
                                        Refund Complainant
                                    </Button>
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 text-xs px-2"
                                        onClick={() => openActionDialog('complete')}
                                    >
                                        Finalize (Favor Agent)
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="text-xs px-2"
                                        onClick={() => openActionDialog('penalize')}
                                    >
                                        Penalize Agent
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
                        <DialogTitle>Confirm Action: {actionDialog?.toUpperCase()}</DialogTitle>
                        <DialogDescription>
                            Please provide a reason or notes for this action.
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
