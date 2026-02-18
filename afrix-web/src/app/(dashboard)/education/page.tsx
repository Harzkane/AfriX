"use client";

import { useEducation } from "@/hooks/useEducation";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Loader2,
    BookOpen,
    GraduationCap,
    Clock,
    RefreshCw,
    Settings,
    Eye,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function EducationPage() {
    const {
        stats,
        userList,
        pagination,
        isLoading,
        fetchStats,
        fetchUsersWithEducation,
        DEFAULT_PAGE_SIZE,
    } = useEducation();

    const [statusFilter, setStatusFilter] = useState<string>("all");

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        const params: any = { limit: DEFAULT_PAGE_SIZE, offset: 0 };
        if (statusFilter !== "all") params.status = statusFilter;
        fetchUsersWithEducation(params, false);
    }, [statusFilter, fetchUsersWithEducation, DEFAULT_PAGE_SIZE]);

    const handleLoadMore = () => {
        if (!pagination?.has_more) return;
        const params: any = { limit: DEFAULT_PAGE_SIZE, offset: pagination.offset + pagination.limit };
        if (statusFilter !== "all") params.status = statusFilter;
        fetchUsersWithEducation(params, true);
    };

    const handleReset = async () => {
        if (!actionDialog.user || !resetReason) return;
        setIsActionLoading(true);
        try {
            await resetUserProgress(actionDialog.user.user_id, actionDialog.user.module, resetReason);
            setActionDialog({ open: false, user: null });
            setResetReason("");
        } catch (err) {
            // Error handled in hook
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Education Center</h1>
                    <p className="text-sm text-muted-foreground">Track user learning progress and module completion</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        fetchStats();
                        const params: any = { limit: DEFAULT_PAGE_SIZE, offset: 0 };
                        if (statusFilter !== "all") params.status = statusFilter;
                        fetchUsersWithEducation(params, false);
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
                        <CardTitle className="text-sm font-medium">Fully Educated</CardTitle>
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.fully_educated_users || 0}</div>
                        <p className="text-xs text-muted-foreground">Users completed all modules</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Grads</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.recent_completions_7d || 0}</div>
                        <p className="text-xs text-muted-foreground">Modules completed (7d)</p>
                    </CardContent>
                </Card>
                {/* Dynamic Module Stats or General Stats */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_users ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Registered on platform</p>
                    </CardContent>
                </Card>
                {stats?.education_config && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Config</CardTitle>
                            <Settings className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm space-y-1">
                                <p>Pass: {stats.education_config.pass_score}%</p>
                                <p className="text-xs text-muted-foreground">Max attempts: {stats.education_config.max_attempts}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Filters & Table — one row per user */}
            <Card>
                <div className="p-4 flex gap-4 border-b">
                    <div className="w-[200px]">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All users (with progress)</SelectItem>
                                <SelectItem value="completed">Completed all 4</SelectItem>
                                <SelectItem value="in_progress">In progress</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead className="text-center">Modules</TableHead>
                                <TableHead className="text-center">Completion</TableHead>
                                <TableHead className="text-center">Can mint</TableHead>
                                <TableHead className="text-center">Can burn</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : userList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No users with education progress found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                userList.map((row) => (
                                    <TableRow key={row.user_id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{row.full_name || "Unknown"}</span>
                                                <span className="text-xs text-muted-foreground">{row.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-mono">
                                            {row.completed_modules} / {row.total_modules}
                                        </TableCell>
                                        <TableCell className="text-center font-mono">
                                            {row.completion_percentage}%
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {row.can_mint ? (
                                                <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Yes</Badge>
                                            ) : (
                                                <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" /> No</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {row.can_burn ? (
                                                <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Yes</Badge>
                                            ) : (
                                                <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" /> No</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/education/users/${row.user_id}`}>
                                                    <Eye className="mr-1 h-3 w-3" /> View
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                {pagination && (pagination.total > 0 || userList.length > 0) && (
                    <div className="flex items-center justify-between border-t px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                            Showing {userList.length} of {pagination.total} users
                        </p>
                        {pagination.has_more && (
                            <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={isLoading}>
                                {isLoading ? "Loading..." : "Load more"}
                            </Button>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
}
