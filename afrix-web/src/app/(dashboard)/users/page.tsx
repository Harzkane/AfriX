"use client";

import { useUsers } from "@/hooks/useUsers";
import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Loader2,
    Search,
    Users,
    UserCheck,
    Briefcase,
    Shield,
    MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/ui/pagination";

export default function UsersPage() {
    const {
        stats,
        users,
        pagination,
        isLoading,
        fetchStats,
        fetchUsers
    } = useUsers();
    const router = useRouter();

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 15;

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        const params: any = {
            limit,
            offset: (currentPage - 1) * limit
        };
        if (search) params.search = search;
        if (roleFilter !== "all") params.role = roleFilter;
        if (statusFilter === "active") params.is_active = true;
        if (statusFilter === "suspended") params.is_suspended = true;

        const timer = setTimeout(() => {
            fetchUsers(params);
        }, 500); // Debounce search

        return () => clearTimeout(timer);
    }, [search, roleFilter, statusFilter, currentPage, fetchUsers]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, roleFilter, statusFilter]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                    <p className="text-sm text-muted-foreground">Manage users, agents, and merchants</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.user_counts.total || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.user_counts.recent_registrations_30d || 0} new in 30d
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Verified Identity</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.verification_stats.identity_verified || 0}</div>
                        <p className="text-xs text-muted-foreground">Fully KYC verified</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Agents</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.user_counts.by_role.agents || 0}</div>
                        <p className="text-xs text-muted-foreground">Active agents</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Admins</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.user_counts.by_role.admins || 0}</div>
                        <p className="text-xs text-muted-foreground">System administrators</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Table */}
            <Card>
                <div className="p-4 flex flex-col md:flex-row gap-4 border-b">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="w-[200px]">
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="agent">Agent</SelectItem>
                                <SelectItem value="merchant">Merchant</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-[200px]">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Verification</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                                        Loading users...
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.full_name}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                user.role === 'admin' ? 'default' :
                                                    user.role === 'agent' ? 'secondary' :
                                                        user.role === 'merchant' ? 'destructive' : 'outline'
                                            }>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                {user.is_suspended && <Badge variant="destructive">Suspended</Badge>}
                                                {!user.is_active && <Badge variant="outline">Inactive</Badge>}
                                                {user.is_active && !user.is_suspended && <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {user.email_verified && <span className="text-xs text-green-600 flex items-center"><UserCheck className="h-3 w-3 mr-1" /> Email</span>}
                                                {user.identity_verified && <span className="text-xs text-blue-600 flex items-center"><Shield className="h-3 w-3 mr-1" /> KYC</span>}
                                                {!user.email_verified && <span className="text-xs text-muted-foreground">Unverified</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {format(new Date(user.created_at), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => router.push(`/users/${user.id}`)}>
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <Pagination
                        currentPage={currentPage}
                        totalCount={pagination.total}
                        limit={limit}
                        onPageChange={setCurrentPage}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
