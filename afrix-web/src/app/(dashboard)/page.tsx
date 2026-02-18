"use client";

import { SalesChart } from "@/components/charts/sales-chart";
import { OrderStatusChart } from "@/components/charts/order-status-chart";
import { UserGrowthChart } from "@/components/charts/user-growth-chart";
import { TokenDistributionChart } from "@/components/charts/token-distribution-chart";
import { AgentTierChart } from "@/components/charts/agent-tier-chart";
import { RequiresAttention } from "@/components/requires-attention";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import {
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wallet,
  DollarSign,
  UserCheck,
  Shield,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const dashboard = useAdminDashboard();

  if (dashboard.isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  if (dashboard.error) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>Error: {dashboard.error}</p>
        <button
          onClick={dashboard.refresh}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  const successRate = dashboard.transactions.total > 0
    ? (dashboard.transactions.completed / dashboard.transactions.total) * 100
    : 0;

  // Helper function for metric card colors
  const getMetricColor = (value: number, threshold: { warning: number; danger: number }) => {
    if (value >= threshold.danger) return "text-red-600";
    if (value >= threshold.warning) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <>
      {/* Requires Attention Section */}
      {dashboard.pending.total > 0 && (
        <div className="mb-8">
          <RequiresAttention pending={dashboard.pending} />
        </div>
      )}

      {/* Main Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4 mb-8">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.users.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              +{dashboard.users.recent_30d} in last 30 days
            </p>
          </CardContent>
        </Card>

        {/* Active Agents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.agents.active}</div>
            <p className="text-xs text-muted-foreground">
              of {dashboard.agents.total} Total • {dashboard.agents.pending} Pending
            </p>
          </CardContent>
        </Card>

        {/* Total Value Locked */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value Locked</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${parseFloat(dashboard.wallets.total_tvl).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {dashboard.wallets.active} Active Wallets • {dashboard.wallets.frozen} Frozen
            </p>
          </CardContent>
        </Card>

        {/* Platform Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${parseFloat(dashboard.transactions.total_fees).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total fees collected
            </p>
          </CardContent>
        </Card>

        {/* Platform Fee Wallets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fee Wallets</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">NT</span>
                <span className="font-mono font-medium">{(dashboard.platform_fee_balances?.NT ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CT</span>
                <span className="font-mono font-medium">{(dashboard.platform_fee_balances?.CT ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">USDT</span>
                <span className="font-mono font-medium">{(dashboard.platform_fee_balances?.USDT ?? 0).toLocaleString()}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Fee treasury (NT, CT, USDT)
            </p>
          </CardContent>
        </Card>

        {/* Open Disputes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.disputes.open}</div>
            <p className={`text-xs ${getMetricColor(dashboard.disputes.critical, { warning: 3, danger: 5 })}`}>
              {dashboard.disputes.critical} Critical (Level 3)
            </p>
          </CardContent>
        </Card>

        {/* Pending Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions (24h)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.transactions.recent_24h}</div>
            <p className="text-xs text-muted-foreground">
              {dashboard.transactions.pending} Pending
            </p>
          </CardContent>
        </Card>

        {/* Pending KYC */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.pending.kyc_approvals}</div>
            <p className={`text-xs ${getMetricColor(dashboard.pending.kyc_approvals, { warning: 5, danger: 10 })}`}>
              Requires approval
            </p>
          </CardContent>
        </Card>

        {/* Security Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.security.total_alerts}</div>
            <p className={`text-xs ${getMetricColor(dashboard.security.total_alerts, { warning: 10, danger: 20 })}`}>
              {dashboard.security.locked_accounts} Locked • {dashboard.security.flagged_transactions} Flagged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:gap-8 lg:grid-cols-4 mb-8">
        <SalesChart data={dashboard.transactions.volume_history} />
        <OrderStatusChart
          data={dashboard.transactions.status_distribution}
          successRate={successRate}
        />
      </div>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-4 mb-8">
        <UserGrowthChart data={dashboard.users.growth_history} />
        <TokenDistributionChart data={dashboard.wallets.token_distribution} />
      </div>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-4">
        <AgentTierChart data={dashboard.agents.tier_distribution} />

        {/* Quick Stats Card */}
        <Card className="col-span-4 lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Active Escrows</p>
                <p className="text-2xl font-bold">{dashboard.escrows.active}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Expired Escrows</p>
                <p className={`text-2xl font-bold ${getMetricColor(dashboard.escrows.expired, { warning: 5, danger: 10 })}`}>
                  {dashboard.escrows.expired}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Pending Mint Requests</p>
                <p className="text-2xl font-bold">{dashboard.requests.pending_mint}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Pending Burn Requests</p>
                <p className="text-2xl font-bold">{dashboard.requests.pending_burn}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
