"use client";

import { useFinancials } from "@/hooks/useFinancials";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    TrendingUp,
    Activity,
    AlertCircle,
    Loader2,
    RefreshCcw,
    CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function FinancialsPage() {
    const { stats, platformFeeBalances, isLoading, error, fetchStats } = useFinancials();

    if (isLoading && !stats) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <div className="text-xl font-semibold">Failed to load financial data</div>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={() => fetchStats()}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Retry
                </Button>
            </div>
        );
    }

    const txStatusData = stats ? [
        { name: "Completed", value: stats.transactions.by_status.completed, color: "#10b981" },
        { name: "Pending", value: stats.transactions.by_status.pending, color: "#3b82f6" },
        { name: "Failed", value: stats.transactions.by_status.failed, color: "#ef4444" },
        { name: "Refunded", value: stats.transactions.by_status.refunded, color: "#8b5cf6" },
    ] : [];

    const walletDistributionData = stats ? Object.entries(stats.wallets.balances_by_token).map(([key, val]) => ({
        name: key,
        value: parseFloat(val.total_balance),
        count: val.wallet_count
    })) : [];

    const totalValue = walletDistributionData.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Financial Overview
                    </h2>
                    <p className="text-muted-foreground">
                        Monitor platform liquidity and transaction health in real-time.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button onClick={() => fetchStats()} variant="outline" className="shadow-sm">
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                        <Activity className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.transactions.total_transactions.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-green-500 font-medium">+{stats?.transactions.recent_24h}</span> transactions in last 24h
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${parseFloat(stats?.transactions.total_fees_collected || "0").toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Cumulative facilitation fees
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
                        <Wallet className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.wallets.active.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground text-orange-500">
                            {stats?.wallets.frozen} wallets frozen
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total NT Supply</CardTitle>
                        <CreditCard className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {parseFloat(stats?.wallets.balances_by_token["NT"]?.total_balance || "0").toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Circulating in {stats?.wallets.balances_by_token["NT"]?.wallet_count} wallets
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Platform Fee Wallets */}
            <Card className="shadow-sm border-muted/40 border-l-4 border-l-amber-500">
                <CardHeader>
                    <CardTitle className="text-lg">Platform Fee Wallets</CardTitle>
                    <CardDescription>Fee treasury balances by token (NT, CT, USDT) — all collected fees</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-lg border bg-muted/30 p-4">
                            <p className="text-sm font-medium text-muted-foreground">NT</p>
                            <p className="text-2xl font-bold font-mono">{(platformFeeBalances?.NT ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-4">
                            <p className="text-sm font-medium text-muted-foreground">CT</p>
                            <p className="text-2xl font-bold font-mono">{(platformFeeBalances?.CT ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-4">
                            <p className="text-sm font-medium text-muted-foreground">USDT</p>
                            <p className="text-2xl font-bold font-mono">{(platformFeeBalances?.USDT ?? 0).toLocaleString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Transaction Status Chart */}
                <Card className="col-span-4 shadow-sm border-muted/40">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg text-foreground font-bold">Transaction Status Distribution</CardTitle>
                                <CardDescription className="text-muted-foreground">Performance of transaction processing across statuses</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={txStatusData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 13, fill: 'currentColor', fontWeight: 600 }}
                                    className="text-muted-foreground"
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: 'currentColor' }}
                                    className="text-muted-foreground"
                                />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--popover))',
                                        borderRadius: '12px',
                                        border: '2px solid hsl(var(--border))',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        padding: '12px',
                                        color: 'hsl(var(--popover-foreground))'
                                    }}
                                    itemStyle={{
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        padding: '4px 0',
                                        color: 'hsl(var(--popover-foreground))'
                                    }}
                                    labelStyle={{
                                        fontWeight: 'bold',
                                        color: 'hsl(var(--primary))',
                                        marginBottom: '4px'
                                    }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={45}>
                                    {txStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Token Distribution Chart */}
                <Card className="col-span-3 shadow-sm border-muted/40">
                    <CardHeader>
                        <CardTitle className="text-lg">Global Token Supply</CardTitle>
                        <CardDescription>Balance distribution by token type</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <div className="h-[280px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={walletDistributionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={105}
                                        paddingAngle={5}
                                        dataKey="value"
                                        animationBegin={0}
                                        animationDuration={1500}
                                    >
                                        {walletDistributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--popover))',
                                            borderRadius: '12px',
                                            border: '1px solid hsl(var(--border))',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            color: 'hsl(var(--popover-foreground))'
                                        }}
                                        itemStyle={{
                                            color: 'hsl(var(--popover-foreground))'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-4">
                                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Value</div>
                                <div className="text-2xl font-bold text-foreground">
                                    {totalValue > 1000000
                                        ? `${(totalValue / 1000000).toFixed(1)}M`
                                        : totalValue.toLocaleString()
                                    }
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-2">
                            {walletDistributionData.map((item, idx) => (
                                <div key={item.name} className="flex items-center gap-2 text-sm font-medium">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                    <span className="text-muted-foreground">{item.name}</span>
                                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Wallets Table */}
            <Card className="shadow-sm border-muted/40">
                <CardHeader>
                    <CardTitle className="text-lg">Top Wallets by Balance</CardTitle>
                    <CardDescription>Major holders across all tokens</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto rounded-md border border-muted/50">
                        <table className="w-full caption-bottom text-sm border-collapse">
                            <thead>
                                <tr className="bg-muted/30 border-b">
                                    <th className="h-12 px-4 text-left align-middle font-semibold text-foreground uppercase tracking-wider text-[10px]">Owner</th>
                                    <th className="h-12 px-4 text-left align-middle font-semibold text-foreground uppercase tracking-wider text-[10px]">Asset</th>
                                    <th className="h-12 px-4 text-right align-middle font-semibold text-foreground uppercase tracking-wider text-[10px]">Current Balance</th>
                                    <th className="h-12 px-4 text-right align-middle font-semibold text-foreground uppercase tracking-wider text-[10px]">Health Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted/30">
                                {stats?.wallets.top_wallets.map((wallet) => (
                                    <tr key={wallet.id} className="transition-colors hover:bg-muted/20">
                                        <td className="p-4 align-middle">
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{wallet.user?.full_name || "Unknown User"}</span>
                                                <span className="text-xs text-muted-foreground">{wallet.user?.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                {wallet.token_type}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle text-right font-mono font-medium">
                                            {parseFloat(wallet.balance).toLocaleString()}
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${wallet.is_frozen
                                                ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10"
                                                : "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"}`}>
                                                <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${wallet.is_frozen ? "bg-red-600" : "bg-green-600"}`} />
                                                {wallet.is_frozen ? "Frozen" : "Active"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
