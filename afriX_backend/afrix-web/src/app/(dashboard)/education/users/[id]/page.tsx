"use client";

import { useEducation, UserEducationProgressResponse, UserProgressItem } from "@/hooks/useEducation";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Loader2,
    ArrowLeft,
    BookOpen,
    User,
    Mail,
    GraduationCap,
    CheckCircle,
    XCircle,
    RotateCcw,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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

const MODULE_NAMES: Record<string, string> = {
    what_are_tokens: "What Are Tokens",
    how_agents_work: "How Agents Work",
    understanding_value: "Understanding Value",
    safety_security: "Safety & Security",
};

const ALL_MODULES = Object.keys(MODULE_NAMES);

export default function EducationUserDetailPage() {
    const { id } = useParams();
    const { fetchUserProgress, resetUserProgress, markComplete } = useEducation();
    const [data, setData] = useState<UserEducationProgressResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [resetDialog, setResetDialog] = useState<{ open: boolean; module: string | null }>({ open: false, module: null });
    const [completeDialog, setCompleteDialog] = useState<{ open: boolean; module: string } | null>(null);
    const [reason, setReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (id) {
            setLoading(true);
            fetchUserProgress(id as string).then((d) => {
                setData(d);
                setLoading(false);
            });
        }
    }, [id, fetchUserProgress]);

    const handleReset = async () => {
        if (!id || !reason.trim()) return;
        setActionLoading(true);
        try {
            await resetUserProgress(id as string, resetDialog.module ?? undefined, reason);
            setResetDialog({ open: false, module: null });
            setReason("");
            const updated = await fetchUserProgress(id as string);
            setData(updated ?? null);
        } catch {
            // toast in hook
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkComplete = async () => {
        if (!id || !completeDialog?.module || !reason.trim()) return;
        setActionLoading(true);
        try {
            await markComplete(id as string, completeDialog.module, reason);
            setCompleteDialog(null);
            setReason("");
            const updated = await fetchUserProgress(id as string);
            setData(updated ?? null);
        } catch {
            // toast in hook
        } finally {
            setActionLoading(false);
        }
    };

    const getProgressByModule = (module: string): UserProgressItem | undefined =>
        data?.progress?.find((p) => p.module === module);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/education">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Education Center
                    </Link>
                </Button>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground">User or education progress not found.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/education">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Education Center
                    </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/users/${data.user.id}`}>Full user profile</Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        User
                    </CardTitle>
                    <CardDescription>Identity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="font-medium">{data.user.full_name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {data.user.email}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Summary
                    </CardTitle>
                    <CardDescription>Completion and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <div>
                            <p className="text-sm text-muted-foreground">Completed</p>
                            <p className="text-2xl font-bold">
                                {data.summary.completed_modules} / {data.summary.total_modules}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Completion</p>
                            <p className="text-2xl font-bold">{data.summary.completion_percentage}%</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Can mint</p>
                            {data.summary.can_mint ? (
                                <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Yes</Badge>
                            ) : (
                                <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" /> No</Badge>
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Can burn</p>
                            {data.summary.can_burn ? (
                                <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Yes</Badge>
                            ) : (
                                <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" /> No</Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Module progress
                    </CardTitle>
                    <CardDescription>Per-module status and actions</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Module</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Score</TableHead>
                                <TableHead className="text-center">Attempts</TableHead>
                                <TableHead>Completed at</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ALL_MODULES.map((module) => {
                                const record = getProgressByModule(module);
                                const label = MODULE_NAMES[module] ?? module.replace(/_/g, " ");
                                return (
                                    <TableRow key={module}>
                                        <TableCell className="font-medium">{label}</TableCell>
                                        <TableCell>
                                            {record ? (
                                                record.completed ? (
                                                    <Badge className="bg-green-600">Completed</Badge>
                                                ) : (
                                                    <Badge variant="secondary">In progress</Badge>
                                                )
                                            ) : (
                                                <Badge variant="outline">Not started</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center font-mono">
                                            {record ? `${record.score}%` : "-"}
                                        </TableCell>
                                        <TableCell className="text-center">{record?.attempts ?? "-"}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {record?.completed_at
                                                ? format(new Date(record.completed_at), "MMM d, HH:mm")
                                                : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {record && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setResetDialog({ open: true, module })}
                                                    >
                                                        <RotateCcw className="mr-1 h-3 w-3" /> Reset
                                                    </Button>
                                                )}
                                                {(!record || !record.completed) && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCompleteDialog({ open: true, module })}
                                                    >
                                                        <Check className="mr-1 h-3 w-3" /> Mark complete
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResetDialog({ open: true, module: null })}
                >
                    <RotateCcw className="mr-2 h-3 w-3" /> Reset all modules
                </Button>
            </div>

            <Dialog open={resetDialog.open} onOpenChange={(open) => setResetDialog((prev) => ({ ...prev, open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset progress</DialogTitle>
                        <DialogDescription>
                            {resetDialog.module
                                ? `Reset "${MODULE_NAMES[resetDialog.module] ?? resetDialog.module}" for ${data.user.full_name}. They will need to retake the module.`
                                : `Reset all education progress for ${data.user.full_name}. A reason is required.`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label>Reason</Label>
                        <Textarea
                            placeholder="e.g. User requested retake"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setResetDialog({ open: false, module: null }); setReason(""); }} disabled={actionLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleReset} disabled={!reason.trim() || actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reset
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!completeDialog?.open} onOpenChange={(open) => !open && setCompleteDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark module complete</DialogTitle>
                        <DialogDescription>
                            Manually mark "{completeDialog ? MODULE_NAMES[completeDialog.module] ?? completeDialog.module : ""}" as complete for {data.user.full_name}. Use for offline completion or exemptions.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label>Reason</Label>
                        <Textarea
                            placeholder="e.g. Completed in-person training"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setCompleteDialog(null); setReason(""); }} disabled={actionLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleMarkComplete} disabled={!reason.trim() || actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Mark complete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
