"use client";

import { useFinancials, Wallet } from "@/hooks/useFinancials";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Search,
    Loader2,
    ShieldAlert,
    ShieldCheck,
    Lock,
    Unlock,
    Info
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";

export default function WalletsPage() {
    const { stats, wallets, isLoading, fetchWallets, fetchStats } = useFinancials();
    const [tokenFilter, setTokenFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

    useEffect(() => {
        const params: any = {};
        if (tokenFilter !== "all") params.token_type = tokenFilter;
        if (statusFilter !== "all") params.is_frozen = statusFilter === "frozen";
        if (searchTerm) params.user_id = searchTerm; // Should ideally be a search param, but listWallets takes user_id
        fetchWallets(params);
    }, [tokenFilter, statusFilter, searchTerm, fetchWallets]);

    const handleToggleFreeze = async (wallet: Wallet) => {
        setIsActionLoading(wallet.id);
        try {
            const endpoint = wallet.is_frozen
                ? `/admin/users/${wallet.user_id}/unfreeze-wallet`
                : `/admin/users/${wallet.user_id}/freeze-wallet`;

            const payload = wallet.is_frozen
                ? { token_type: wallet.token_type }
                : { token_type: wallet.token_type, reason: "Administrative security review" };

            await api.post(endpoint, payload);

            toast.success(`Wallet ${wallet.is_frozen ? 'unfrozen' : 'frozen'} successfully`);
            fetchWallets(); // Refresh list
            fetchStats(); // Refresh header stats
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Action failed");
        } finally {
            setIsActionLoading(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Wallet Monitoring</h1>
                    <p className="text-sm text-muted-foreground">Manage and audit system-wide liquidity and wallet security.</p>
                </div>
            </div>

            {/* Overview Stats Bar */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-muted/50">
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-500" />
                            Total Wallets
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="text-2xl font-bold">{stats?.wallets.total_wallets.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="bg-muted/50">
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600">
                            <ShieldCheck className="h-4 w-4" />
                            Active Wallets
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="text-2xl font-bold">{stats?.wallets.active.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="bg-muted/50">
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-500">
                            <ShieldAlert className="h-4 w-4" />
                            Frozen Wallets
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="text-2xl font-bold">{stats?.wallets.frozen.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by User ID..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={tokenFilter} onValueChange={setTokenFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Token" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Tokens</SelectItem>
                                    <SelectItem value="NT">NT (Naira)</SelectItem>
                                    <SelectItem value="CT">CT (CFA)</SelectItem>
                                    <SelectItem value="USDT">USDT (Tether)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active Only</SelectItem>
                                    <SelectItem value="frozen">Frozen Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Wallets Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Owner</TableHead>
                                <TableHead>Token</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                                        Loading wallets...
                                    </TableCell>
                                </TableRow>
                            ) : wallets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No wallets found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                wallets.map((wallet: Wallet) => (
                                    <TableRow key={wallet.id}>
                                        <TableCell>
                                            <div className="font-medium">{wallet.user?.full_name || "Unknown User"}</div>
                                            <div className="text-xs text-muted-foreground">{wallet.user?.email || wallet.user_id}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{wallet.token_type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold">
                                            {parseFloat(wallet.balance).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {wallet.is_frozen ? (
                                                <Badge variant="destructive" className="flex items-center gap-1 w-fit mx-auto">
                                                    <Lock className="h-3 w-3" /> Frozen
                                                </Badge>
                                            ) : (
                                                <Badge variant="default" className="bg-green-600 flex items-center gap-1 w-fit mx-auto">
                                                    <Unlock className="h-3 w-3" /> Active
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right pr-6 space-x-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/financials/wallets/${wallet.id}`}>View</Link>
                                            </Button>
                                            <Button
                                                variant={wallet.is_frozen ? "outline" : "destructive"}
                                                size="sm"
                                                disabled={isActionLoading === wallet.id}
                                                onClick={() => handleToggleFreeze(wallet)}
                                            >
                                                {isActionLoading === wallet.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : wallet.is_frozen ? (
                                                    <>
                                                        <Unlock className="mr-2 h-4 w-4" /> Unfreeze
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock className="mr-2 h-4 w-4" /> Freeze
                                                    </>
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
