"use client";

import { useOperations, Escrow } from "@/hooks/useOperations";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Loader2,
    ArrowLeft,
    Lock,
    User,
    Briefcase,
    Receipt,
    AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isPast } from "date-fns";
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

export default function EscrowDetailPage() {
    const { id } = useParams();
    const { fetchEscrow, forceFinalizeEscrow } = useOperations();
    const [escrow, setEscrow] = useState<Escrow | null>(null);
    const [loading, setLoading] = useState(true);
    const [forceOpen, setForceOpen] = useState(false);
    const [forceNotes, setForceNotes] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (id) {
            setLoading(true);
            fetchEscrow(id as string).then((e) => {
                setEscrow(e);
                setLoading(false);
            });
        }
    }, [id, fetchEscrow]);

    const handleForceFinalize = async () => {
        if (!escrow) return;
        setActionLoading(true);
        try {
            await forceFinalizeEscrow(escrow.id, forceNotes || undefined);
            toast.success("Escrow force-finalized");
            setForceOpen(false);
            setForceNotes("");
            const updated = await fetchEscrow(escrow.id);
            setEscrow(updated ?? null);
        } catch (e: any) {
            toast.error(e.response?.data?.error || "Force finalize failed");
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = {
            locked: "bg-blue-500/10 text-blue-600",
            completed: "bg-green-600",
            disputed: "bg-destructive/10 text-destructive",
            refunded: "bg-muted text-muted-foreground",
        };
        return (
            <Badge className={map[status] || ""}>
                {status.toUpperCase()}
            </Badge>
        );
    };

    const isExpired = escrow ? isPast(new Date(escrow.expires_at)) : false;
    const canForceFinalize = escrow?.status === "locked";

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!escrow) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/operations/escrows">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Escrows
                    </Link>
                </Button>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground">Escrow not found.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/operations/escrows">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Escrows
                    </Link>
                </Button>
                {canForceFinalize && (
                    <Button variant="destructive" size="sm" onClick={() => setForceOpen(true)}>
                        Force Finalize
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Escrow Details
                    </CardTitle>
                    <CardDescription>ID: {escrow.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <div className="flex items-center gap-2 mt-1">
                                {getStatusBadge(escrow.status)}
                                {isExpired && escrow.status === "locked" && (
                                    <AlertTriangle className="h-4 w-4 text-red-500" title="Expired" />
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Amount</p>
                            <p className="font-mono font-bold text-lg">
                                {parseFloat(escrow.amount).toLocaleString()} {escrow.token_type}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Expires</p>
                            <p className={`text-sm ${isExpired && escrow.status === "locked" ? "text-red-600 font-medium" : ""}`}>
                                {format(new Date(escrow.expires_at), "PPp")}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Created</p>
                            <p className="text-sm">{format(new Date(escrow.created_at), "PPp")}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-4 w-4" />
                            User (Seller)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {escrow.fromUser ? (
                            <>
                                <p className="font-medium">{escrow.fromUser.full_name}</p>
                                <p className="text-sm text-muted-foreground">{escrow.fromUser.email}</p>
                                {escrow.fromUser.phone_number && (
                                    <p className="text-sm text-muted-foreground">{escrow.fromUser.phone_number}</p>
                                )}
                                <Button variant="link" className="px-0 mt-2" asChild>
                                    <Link href={`/users/${escrow.fromUser.id}`}>View user</Link>
                                </Button>
                            </>
                        ) : (
                            <p className="text-muted-foreground text-sm">User not loaded</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Agent
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {escrow.agent ? (
                            <>
                                <p className="font-medium">Tier: {escrow.agent.tier}</p>
                                <p className="text-sm text-muted-foreground">Rating: {escrow.agent.rating}</p>
                                <Button variant="link" className="px-0 mt-2" asChild>
                                    <Link href={`/agents/${escrow.agent.id}`}>View agent</Link>
                                </Button>
                            </>
                        ) : (
                            <p className="text-muted-foreground text-sm">No agent assigned</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {escrow.transaction && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            Linked Transaction
                        </CardTitle>
                        <CardDescription>Transaction that initiated this escrow</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm">{escrow.transaction.reference}</span>
                            <Badge variant="outline">{escrow.transaction.type}</Badge>
                            <span className="text-sm">
                                {parseFloat(escrow.transaction.amount).toLocaleString()} — {escrow.transaction.status}
                            </span>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/financials/transactions/${escrow.transaction.id}`}>View transaction</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Dialog open={forceOpen} onOpenChange={setForceOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Force Finalize Escrow</DialogTitle>
                        <DialogDescription>
                            This will complete the escrow by admin override. Use only when necessary (e.g. expired with no dispute).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="force-notes">Notes (optional)</Label>
                        <Textarea
                            id="force-notes"
                            placeholder="Reason for force finalize..."
                            value={forceNotes}
                            onChange={(e) => setForceNotes(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setForceOpen(false)} disabled={actionLoading}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleForceFinalize} disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Force Finalize"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
