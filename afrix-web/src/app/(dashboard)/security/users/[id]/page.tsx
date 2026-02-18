"use client";

import { useUsers } from "@/hooks/useUsers";
import { useSecurity } from "@/hooks/useSecurity";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Loader2,
    ArrowLeft,
    Shield,
    User,
    Lock,
    Unlock,
    AlertTriangle,
    CheckCircle,
    Mail,
    UserX,
    History,
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

export default function SecurityUserDetailPage() {
    const { id } = useParams();
    const { currentUser, isLoading, fetchUser, suspendUser, unsuspendUser } = useUsers();
    const { unlockAccount, resetLoginAttempts, fetchStats, fetchIssues } = useSecurity();
    const [unlockDialog, setUnlockDialog] = useState(false);
    const [resetDialog, setResetDialog] = useState(false);
    const [suspendDialog, setSuspendDialog] = useState(false);
    const [suspensionReason, setSuspensionReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (id) fetchUser(id as string);
    }, [id, fetchUser]);

    const handleUnlock = async () => {
        if (!currentUser) return;
        setActionLoading(true);
        try {
            await unlockAccount(currentUser.id);
            setUnlockDialog(false);
            await Promise.all([fetchUser(currentUser.id), fetchStats(), fetchIssues()]);
        } catch {
            // toast in hook
        } finally {
            setActionLoading(false);
        }
    };

    const handleResetAttempts = async () => {
        if (!currentUser) return;
        setActionLoading(true);
        try {
            await resetLoginAttempts(currentUser.id);
            setResetDialog(false);
            await Promise.all([fetchUser(currentUser.id), fetchStats(), fetchIssues()]);
        } catch {
            // toast in hook
        } finally {
            setActionLoading(false);
        }
    };

    const handleSuspend = async () => {
        if (!currentUser || !suspensionReason.trim()) return;
        setActionLoading(true);
        try {
            await suspendUser(currentUser.id, suspensionReason);
            setSuspendDialog(false);
            setSuspensionReason("");
            await fetchUser(currentUser.id);
        } catch {
            // toast in hook
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnsuspend = async () => {
        if (!currentUser) return;
        setActionLoading(true);
        try {
            await unsuspendUser(currentUser.id);
            await fetchUser(currentUser.id);
        } catch {
            // toast in hook
        } finally {
            setActionLoading(false);
        }
    };

    const isLocked = currentUser?.locked_until && new Date(currentUser.locked_until) > new Date();
    const attempts = currentUser?.login_attempts ?? 0;

    if (isLoading || (id && !currentUser)) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/security">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Security Center
                    </Link>
                </Button>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground">User not found.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/security">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Security Center
                    </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/users/${currentUser.id}`}>Full user profile</Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        User
                    </CardTitle>
                    <CardDescription>Identity and contact</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="font-medium">{currentUser.full_name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {currentUser.email}
                    </p>
                    {currentUser.phone_number && (
                        <p className="text-sm text-muted-foreground">{currentUser.phone_number}</p>
                    )}
                    <p className="text-sm">Country: {currentUser.country_code}</p>
                    <p className="text-xs text-muted-foreground">
                        Joined {format(new Date(currentUser.created_at), "PP")}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Security Status
                    </CardTitle>
                    <CardDescription>Locks, suspension, and login activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Account</span>
                            {currentUser.is_suspended ? (
                                <Badge variant="destructive"><Lock className="w-3 h-3 mr-1" /> Suspended</Badge>
                            ) : currentUser.is_active ? (
                                <Badge variant="outline" className="text-green-600">Active</Badge>
                            ) : (
                                <Badge variant="secondary">Inactive</Badge>
                            )}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Email verified</span>
                            {currentUser.email_verified ? (
                                <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Yes</Badge>
                            ) : (
                                <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" /> No</Badge>
                            )}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm">2FA</span>
                            {currentUser.two_factor_enabled ? (
                                <Badge variant="outline" className="text-green-600">Enabled</Badge>
                            ) : (
                                <Badge variant="secondary">Disabled</Badge>
                            )}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Failed login attempts</span>
                            <span className={`font-mono ${attempts >= 3 ? "text-red-600 font-semibold" : ""}`}>
                                {attempts}
                            </span>
                        </div>
                        {isLocked && (
                            <div className="sm:col-span-2 flex justify-between items-center rounded-md border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                                <span className="text-sm">Locked until</span>
                                <span className="text-sm text-amber-700 dark:text-amber-400">
                                    {format(new Date(currentUser.locked_until!), "PPp")}
                                </span>
                            </div>
                        )}
                        {currentUser.is_suspended && (currentUser.suspension_reason || currentUser.suspended_until) && (
                            <div className="sm:col-span-2 rounded-md border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-3 text-sm">
                                {currentUser.suspension_reason && <p><strong>Reason:</strong> {currentUser.suspension_reason}</p>}
                                {currentUser.suspended_until && (
                                    <p className="text-muted-foreground">Until: {format(new Date(currentUser.suspended_until), "PP")}</p>
                                )}
                            </div>
                        )}
                        <div className="flex justify-between items-center sm:col-span-2">
                            <span className="text-sm">Last login</span>
                            <span className="text-sm text-muted-foreground">
                                {currentUser.last_login_at
                                    ? format(new Date(currentUser.last_login_at), "PPp")
                                    : "Never"}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                        {isLocked && (
                            <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => setUnlockDialog(true)}
                            >
                                <Unlock className="mr-2 h-3 w-3" /> Unlock account
                            </Button>
                        )}
                        {attempts > 0 && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setResetDialog(true)}
                            >
                                Reset login attempts
                            </Button>
                        )}
                        {currentUser.is_suspended ? (
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={handleUnsuspend}
                                disabled={actionLoading}
                            >
                                <Unlock className="mr-2 h-3 w-3" /> Unsuspend account
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setSuspendDialog(true)}
                                disabled={actionLoading}
                            >
                                <UserX className="mr-2 h-3 w-3" /> Suspend account
                            </Button>
                        )}
                        {!isLocked && attempts === 0 && !currentUser.is_suspended && (
                            <p className="text-sm text-muted-foreground">Unlock and reset available above when applicable.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Audit trail */}
            {(currentUser.last_unlocked_at || currentUser.last_reset_attempts_at) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Recent security actions
                        </CardTitle>
                        <CardDescription>Last unlock and reset attempts (audit trail)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {currentUser.last_unlocked_at && (
                            <div className="flex justify-between items-center rounded-md border px-3 py-2">
                                <span className="text-muted-foreground">Last unlocked</span>
                                <span>
                                    {format(new Date(currentUser.last_unlocked_at), "PPp")}
                                    {currentUser.last_unlocked_by?.full_name && (
                                        <span className="text-muted-foreground ml-1">by {currentUser.last_unlocked_by.full_name}</span>
                                    )}
                                </span>
                            </div>
                        )}
                        {currentUser.last_reset_attempts_at && (
                            <div className="flex justify-between items-center rounded-md border px-3 py-2">
                                <span className="text-muted-foreground">Last reset attempts</span>
                                <span>
                                    {format(new Date(currentUser.last_reset_attempts_at), "PPp")}
                                    {currentUser.last_reset_attempts_by?.full_name && (
                                        <span className="text-muted-foreground ml-1">by {currentUser.last_reset_attempts_by.full_name}</span>
                                    )}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <Dialog open={unlockDialog} onOpenChange={setUnlockDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Unlock account</DialogTitle>
                        <DialogDescription>
                            Unlock {currentUser.email}? They will be able to log in immediately. Login attempts will be reset to 0.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUnlockDialog(false)} disabled={actionLoading}>Cancel</Button>
                        <Button onClick={handleUnlock} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Unlock
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={resetDialog} onOpenChange={setResetDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset login attempts</DialogTitle>
                        <DialogDescription>
                            Reset failed login attempts for {currentUser.email}? Current attempts: {attempts}. This will also clear any lock.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResetDialog(false)} disabled={actionLoading}>Cancel</Button>
                        <Button onClick={handleResetAttempts} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reset
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={suspendDialog} onOpenChange={setSuspendDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Suspend account</DialogTitle>
                        <DialogDescription>
                            Suspend {currentUser.email}? They will not be able to log in until unsuspended. A reason is required for audit.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label htmlFor="suspension-reason">Reason</Label>
                        <Textarea
                            id="suspension-reason"
                            placeholder="e.g. Terms violation, security investigation..."
                            value={suspensionReason}
                            onChange={(e) => setSuspensionReason(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setSuspendDialog(false); setSuspensionReason(""); }} disabled={actionLoading}>Cancel</Button>
                        <Button variant="destructive" onClick={handleSuspend} disabled={!suspensionReason.trim() || actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Suspend
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
