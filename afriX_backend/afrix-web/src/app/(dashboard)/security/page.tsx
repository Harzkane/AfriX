"use client";

import { useSecurity, SecurityIssue } from "@/hooks/useSecurity";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Loader2,
    ShieldAlert,
    Lock,
    UserX,
    AlertTriangle,
    RefreshCw,
    Unlock,
} from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function SecurityPage() {
    const {
        stats,
        issues,
        pagination,
        isLoading,
        fetchStats,
        fetchIssues,
        unlockAccount,
        resetLoginAttempts,
        DEFAULT_PAGE_SIZE,
    } = useSecurity();

    const [activeTab, setActiveTab] = useState("all");
    const [actionDialog, setActionDialog] = useState<{
        type: 'unlock' | 'reset';
        user: SecurityIssue;
        open: boolean;
    } | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        const params: any = { limit: DEFAULT_PAGE_SIZE, offset: 0 };
        if (activeTab === "locked") params.issue_type = "locked";
        if (activeTab === "failed") params.issue_type = "failed_logins";
        if (activeTab === "unverified") params.issue_type = "unverified";
        fetchIssues(params, false);
    }, [activeTab, fetchIssues, DEFAULT_PAGE_SIZE]);

    const handleLoadMore = () => {
        if (!pagination?.has_more) return;
        const params: any = { limit: DEFAULT_PAGE_SIZE, offset: pagination.offset + pagination.limit };
        if (activeTab === "locked") params.issue_type = "locked";
        if (activeTab === "failed") params.issue_type = "failed_logins";
        if (activeTab === "unverified") params.issue_type = "unverified";
        fetchIssues(params, true);
    };

    const handleAction = async () => {
        if (!actionDialog) return;

        setIsActionLoading(true);
        try {
            if (actionDialog.type === 'unlock') {
                await unlockAccount(actionDialog.user.id);
            } else if (actionDialog.type === 'reset') {
                await resetLoginAttempts(actionDialog.user.id);
            }
            setActionDialog(null);
        } catch (err) {
            // Error handling is done in hook
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Security Center</h1>
                    <p className="text-sm text-muted-foreground">Monitor threats and user account security</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        fetchStats();
                        const params: any = { limit: DEFAULT_PAGE_SIZE, offset: 0 };
                        if (activeTab === "locked") params.issue_type = "locked";
                        if (activeTab === "failed") params.issue_type = "failed_logins";
                        if (activeTab === "unverified") params.issue_type = "unverified";
                        fetchIssues(params, false);
                    }}
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Failed Login Attempts</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.failed_login_attempts ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Users with &gt;0 failed attempts</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Locked Accounts</CardTitle>
                        <Lock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.locked_accounts ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Currently locked out</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Suspended Users</CardTitle>
                        <UserX className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.suspended_accounts ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Manually suspended</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unverified Emails</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.unverified_emails ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Total unverified accounts</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Logins (24h)</CardTitle>
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.recent_logins_24h ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Last 24 hours</p>
                    </CardContent>
                </Card>
            </div>

            {/* Users by country (from docs: daily security health check) */}
            {stats?.users_by_country && stats.users_by_country.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Users by Country (Top 5)</CardTitle>
                        <CardDescription>Distribution for security monitoring</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {stats.users_by_country.map(({ country, count }) => (
                                <div key={country} className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
                                    <span className="font-medium">{country}</span>
                                    <span className="text-muted-foreground">{count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Content */}
            <Tabs defaultValue="all" className="space-y-4" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="all">All Issues</TabsTrigger>
                    <TabsTrigger value="locked">Locked Accounts</TabsTrigger>
                    <TabsTrigger value="failed">Failed Logins</TabsTrigger>
                    <TabsTrigger value="unverified">Unverified</TabsTrigger>
                </TabsList>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Issue</TableHead>
                                    <TableHead className="text-center">Failed Attempts</TableHead>
                                    <TableHead>Last Login</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                                            Loading security issues...
                                        </TableCell>
                                    </TableRow>
                                ) : issues.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No active security issues found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    issues.map((issue) => (
                                        <TableRow key={issue.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{issue.full_name || "Unknown User"}</span>
                                                    <span className="text-xs text-muted-foreground">{issue.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {issue.locked_until && new Date(issue.locked_until) > new Date() && (
                                                        <Badge variant="destructive" className="items-center gap-1">
                                                            <Lock className="h-3 w-3" /> Locked
                                                        </Badge>
                                                    )}
                                                    {issue.login_attempts >= 3 && (
                                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                                                            Suspicious Login
                                                        </Badge>
                                                    )}
                                                    {issue.is_suspended && (
                                                        <Badge variant="destructive">Suspended</Badge>
                                                    )}
                                                    {!issue.email_verified && (
                                                        <Badge variant="outline">Unverified</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-mono">
                                                {issue.login_attempts > 0 ? (
                                                    <span className={issue.login_attempts >= 3 ? "text-red-500 font-bold" : "text-muted-foreground"}>
                                                        {issue.login_attempts}
                                                    </span>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {issue.last_login_at ? format(new Date(issue.last_login_at), "MMM d, HH:mm") : "Never"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/security/users/${issue.id}`}>View</Link>
                                                    </Button>
                                                    {issue.locked_until && new Date(issue.locked_until) > new Date() ? (
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700"
                                                            onClick={() => setActionDialog({ type: 'unlock', user: issue, open: true })}
                                                        >
                                                            <Unlock className="mr-1 h-3 w-3" /> Unlock
                                                        </Button>
                                                    ) : issue.login_attempts > 0 ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setActionDialog({ type: 'reset', user: issue, open: true })}
                                                        >
                                                            Reset Attempts
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                    {pagination && (pagination.total > 0 || issues.length > 0) && (
                        <div className="flex items-center justify-between border-t px-4 py-3">
                            <p className="text-sm text-muted-foreground">
                                Showing {issues.length} of {pagination.total} issues
                            </p>
                            {pagination.has_more && (
                                <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={isLoading}>
                                    {isLoading ? "Loading..." : "Load more"}
                                </Button>
                            )}
                        </div>
                    )}
                </Card>
            </Tabs>

            {/* Confirmation Dialog */}
            <Dialog open={!!actionDialog?.open} onOpenChange={(open) => !open && setActionDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionDialog?.type === 'unlock' ? 'Unlock Account' : 'Reset Login Attempts'}
                        </DialogTitle>
                        <DialogDescription>
                            {actionDialog?.type === 'unlock'
                                ? `Are you sure you want to unlock ${actionDialog?.user?.email}'s account? They will be able to log in immediately.`
                                : `Reset failed login attempts for ${actionDialog?.user?.email}? Current attempts: ${actionDialog?.user?.login_attempts}.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
                        <Button
                            onClick={handleAction}
                            disabled={isActionLoading}
                            variant={actionDialog?.type === 'unlock' ? 'default' : 'outline'}
                        >
                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
