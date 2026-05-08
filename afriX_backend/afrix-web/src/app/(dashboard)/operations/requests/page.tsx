"use client";

import { useOperations, MintRequest, BurnRequest } from "@/hooks/useOperations";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X, Eye, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import api from "@/lib/api";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function RequestsPage() {
    const { mintRequests, burnRequests, isLoading, fetchMintRequests, fetchBurnRequests, fetchStats } = useOperations();
    const [statusFilter, setStatusFilter] = useState("all");
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const [cancelDialog, setCancelDialog] = useState<{ open: boolean; type: 'mint' | 'burn'; id: string } | null>(null);
    const [cancelReason, setCancelReason] = useState("");

    useEffect(() => {
        const params: any = {};
        if (statusFilter !== "all") params.status = statusFilter;
        fetchMintRequests(params);
        fetchBurnRequests(params);
    }, [statusFilter, fetchMintRequests, fetchBurnRequests]);

    const handleCancelRequest = async () => {
        if (!cancelDialog || !cancelReason.trim()) {
            toast.error("Please provide a cancellation reason");
            return;
        }

        setIsActionLoading(cancelDialog.id);
        try {
            const endpoint = cancelDialog.type === 'mint'
                ? `/admin/operations/requests/mint/${cancelDialog.id}/cancel`
                : `/admin/operations/requests/burn/${cancelDialog.id}/cancel`;

            await api.post(endpoint, { reason: cancelReason });

            toast.success(`${cancelDialog.type === 'mint' ? 'Mint' : 'Burn'} request cancelled successfully`);
            fetchMintRequests();
            fetchBurnRequests();
            fetchStats();
            setCancelDialog(null);
            setCancelReason("");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Action failed");
        } finally {
            setIsActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; className: string }> = {
            pending: { variant: "outline", className: "bg-yellow-500/10 text-yellow-600" },
            proof_submitted: { variant: "outline", className: "bg-blue-500/10 text-blue-600" },
            confirmed: { variant: "default", className: "bg-green-600" },
            cancelled: { variant: "destructive", className: "" },
        };

        const config = variants[status] || variants.pending;
        return (
            <Badge variant={config.variant} className={config.className}>
                {status.replace('_', ' ').toUpperCase()}
            </Badge>
        );
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Request Management</h1>
                    <p className="text-sm text-muted-foreground">Approve or cancel pending mint and burn requests.</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="proof_submitted">Proof Submitted</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs for Mint/Burn */}
            <Tabs defaultValue="mint" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="mint">Mint Requests ({mintRequests.length})</TabsTrigger>
                    <TabsTrigger value="burn">Burn Requests ({burnRequests.length})</TabsTrigger>
                </TabsList>

                {/* Mint Requests Tab */}
                <TabsContent value="mint">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Proof</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right pr-6">Actions</TableHead>
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
                                    ) : mintRequests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                No mint requests found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        mintRequests.map((request: MintRequest) => (
                                            <TableRow key={request.id}>
                                                <TableCell>
                                                    <div className="font-medium">{request.user?.full_name || "Unknown"}</div>
                                                    <div className="text-xs text-muted-foreground">{request.user?.email}</div>
                                                </TableCell>
                                                <TableCell className="font-mono font-bold">
                                                    {parseFloat(request.amount).toLocaleString()} {request.token_type}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(request.status)}</TableCell>
                                                <TableCell>
                                                    {request.payment_proof_url ? (
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <a href={request.payment_proof_url} target="_blank" rel="noopener noreferrer">
                                                                <Eye className="h-4 w-4 mr-1" /> View
                                                            </a>
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">No proof</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {format(new Date(request.created_at), "MMM d, yyyy")}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/operations/requests/mint/${request.id}`}>View</Link>
                                                        </Button>
                                                        {request.status !== 'confirmed' && request.status !== 'cancelled' && (
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                disabled={isActionLoading === request.id}
                                                                onClick={() => setCancelDialog({ open: true, type: 'mint', id: request.id })}
                                                            >
                                                                {isActionLoading === request.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <X className="mr-2 h-4 w-4" /> Cancel
                                                                    </>
                                                                )}
                                                            </Button>
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
                </TabsContent>

                {/* Burn Requests Tab */}
                <TabsContent value="burn">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Escrow</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right pr-6">Actions</TableHead>
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
                                    ) : burnRequests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                No burn requests found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        burnRequests.map((request: BurnRequest) => (
                                            <TableRow key={request.id}>
                                                <TableCell>
                                                    <div className="font-medium">{request.user?.full_name || "Unknown"}</div>
                                                    <div className="text-xs text-muted-foreground">{request.user?.email}</div>
                                                </TableCell>
                                                <TableCell className="font-mono font-bold">
                                                    {parseFloat(request.amount).toLocaleString()} {request.token_type}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(request.status)}</TableCell>
                                                <TableCell>
                                                    {request.escrow ? (
                                                        <Badge variant="outline">{request.escrow.status}</Badge>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">No escrow</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {format(new Date(request.created_at), "MMM d, yyyy")}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/operations/requests/burn/${request.id}`}>View</Link>
                                                        </Button>
                                                        {request.status !== 'confirmed' && request.status !== 'cancelled' && (
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                disabled={isActionLoading === request.id}
                                                                onClick={() => setCancelDialog({ open: true, type: 'burn', id: request.id })}
                                                            >
                                                                {isActionLoading === request.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <X className="mr-2 h-4 w-4" /> Cancel
                                                                    </>
                                                                )}
                                                            </Button>
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
                </TabsContent>
            </Tabs>

            {/* Cancel Dialog */}
            <Dialog open={cancelDialog?.open || false} onOpenChange={(open) => !open && setCancelDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel {cancelDialog?.type === 'mint' ? 'Mint' : 'Burn'} Request</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for cancelling this request. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Enter cancellation reason..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialog(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleCancelRequest} disabled={!cancelReason.trim()}>
                            Confirm Cancellation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
