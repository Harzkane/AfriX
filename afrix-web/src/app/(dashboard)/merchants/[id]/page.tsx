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
    XCircle
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

export default function MerchantDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const {
        currentMerchant,
        isLoading,
        fetchMerchant,
        approveMerchant,
        rejectMerchant
    } = useMerchants();

    const [isActionLoading, setIsActionLoading] = useState(false);
    const [rejectDialog, setRejectDialog] = useState(false);
    const [reason, setReason] = useState("");

    useEffect(() => {
        if (id) fetchMerchant(id as string);
    }, [id, fetchMerchant]);

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

            <div className="grid gap-6 md:grid-cols-2">
                {/* Business Details */}
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
                                <span className="font-medium text-sm">Tax ID / TIN</span>
                                <span className="font-mono">{currentMerchant.kyc?.tax_id || "N/A"}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-medium text-sm">Reg Number</span>
                                <span className="font-mono">{currentMerchant.kyc?.registration_number || "N/A"}</span>
                            </div>
                            <div className="flex justify-between pt-2">
                                <span className="font-medium text-sm">Admin User</span>
                                <span>{currentMerchant.user?.full_name || "N/A"}</span>
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

                {/* KYC & Actions */}
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
                                <div className="p-4 border rounded-md bg-background flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-8 w-8 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">Business Registration</p>
                                            <p className="text-xs text-muted-foreground">Document submitted on {format(new Date(currentMerchant.kyc.submitted_at), "MMM d")}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => window.open(currentMerchant.kyc?.document_url, '_blank')}>View</Button>
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
                                    <div className="bg-red-50 p-3 rounded text-sm text-red-800 border border-red-200">
                                        <strong>Rejection Reason:</strong> {currentMerchant.kyc.rejection_reason}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-4">No KYC documents submitted.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

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
