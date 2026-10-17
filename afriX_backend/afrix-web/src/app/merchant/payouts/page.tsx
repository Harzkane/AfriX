"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Send,
  Download,
  Filter,
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  RefreshCw,
  Store,
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  TrendingUp,
} from "lucide-react";

import merchantApi from "@/lib/merchant-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type VendorPayoutTransaction = {
  id: string;
  reference: string;
  amount: string | number;
  token_type: string;
  status: string;
  description?: string | null;
  fee?: string | number | null;
  tx_hash?: string | null;
  metadata?: {
    source?: string;
    payout_type?: string;
    idempotencyKey?: string;
    kaalisPayoutId?: string;
    kaalisVendorId?: string;
    rentHubTransactionId?: string;
    landlordId?: string;
    landlord_name?: string;
    landlord_email?: string;
    gross_amount?: number;
    platform_fee?: number;
    platformFee?: number;
    vendor_email?: string;
    vendor_name?: string;
    vendor_wallet_address?: string;
    orderId?: string;
    currency?: string;
    country?: string;
    [key: string]: unknown;
  } | null;
  toUser?: {
    id: string;
    email: string;
    full_name: string;
    phone_number?: string;
  } | null;
  toWallet?: {
    id: string;
    blockchain_address: string;
    token_type: string;
  } | null;
  created_at: string;
  updated_at?: string;
  processed_at?: string | null;
};

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function formatAmount(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  if (Number.isNaN(parsed)) return "0";
  return numberFormatter.format(parsed);
}

function statusTone(status?: string) {
  switch ((status || "").toLowerCase()) {
    case "completed":
    case "success":
    case "successful":
    case "paid":
      return "default";
    case "pending":
    case "processing":
      return "secondary";
    case "failed":
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
}

export default function MerchantPayoutsPage() {
  const [payouts, setPayouts] = useState<VendorPayoutTransaction[]>([]);
  const [merchant, setMerchant] = useState<{ id?: string; business_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tokenFilter, setTokenFilter] = useState("all");
  const [selectedPayout, setSelectedPayout] = useState<VendorPayoutTransaction | null>(null);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const [txRes, profileRes] = await Promise.all([
        merchantApi.get("/merchants/transactions?type=payout&limit=100"),
        merchantApi.get("/merchants/profile").catch(() => null),
      ]);
      setPayouts(txRes.data?.data?.transactions || []);
      if (profileRes?.data?.data) {
        setMerchant(profileRes.data.data);
      }
    } catch (error) {
      console.error("Failed to load vendor payouts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
  }, []);

  const isRentHub = useMemo(() => {
    return (
      merchant?.business_name?.toLowerCase().includes("renthub") ||
      payouts.some((p) => p.metadata?.source === "renthub")
    );
  }, [merchant, payouts]);

  const isKaalis = useMemo(() => {
    return (
      merchant?.business_name?.toLowerCase().includes("kaalis") ||
      payouts.some((p) => p.metadata?.source === "kaalis")
    );
  }, [merchant, payouts]);

  const partnerPlatform = isRentHub
    ? "RentHub Escrow"
    : isKaalis
    ? "Kaalis Store"
    : (merchant?.business_name || "Partner Platform");

  const externalIdLabel = isRentHub
    ? "RentHub Escrow ID"
    : isKaalis
    ? "Kaalis Payout ID"
    : "External Payout ID";

  const beneficiaryLabel = isRentHub ? "Landlord" : "Vendor";

  const tokenOptions = useMemo(() => {
    return Array.from(new Set(payouts.map((tx) => tx.token_type).filter(Boolean)));
  }, [payouts]);

  const filteredPayouts = useMemo(() => {
    return payouts.filter((tx) => {
      const beneficiaryName =
        tx.metadata?.landlord_name ||
        tx.metadata?.vendor_name ||
        tx.toUser?.full_name ||
        "";
      const beneficiaryEmail =
        tx.metadata?.landlord_email ||
        tx.metadata?.vendor_email ||
        tx.toUser?.email ||
        "";
      const externalId =
        (tx.metadata?.rentHubTransactionId as string) ||
        (tx.metadata?.kaalisPayoutId as string) ||
        (tx.metadata?.payoutId as string) ||
        (tx.metadata?.orderId as string) ||
        "";
      const walletAddress =
        tx.metadata?.vendor_wallet_address ||
        tx.toWallet?.blockchain_address ||
        "";

      const searchMatch =
        !search ||
        tx.reference?.toLowerCase().includes(search.toLowerCase()) ||
        tx.description?.toLowerCase().includes(search.toLowerCase()) ||
        beneficiaryName.toLowerCase().includes(search.toLowerCase()) ||
        beneficiaryEmail.toLowerCase().includes(search.toLowerCase()) ||
        externalId.toLowerCase().includes(search.toLowerCase()) ||
        walletAddress.toLowerCase().includes(search.toLowerCase());

      const statusMatch = statusFilter === "all" || tx.status.toLowerCase() === statusFilter.toLowerCase();
      const tokenMatch = tokenFilter === "all" || tx.token_type === tokenFilter;

      return searchMatch && statusMatch && tokenMatch;
    });
  }, [search, statusFilter, tokenFilter, payouts]);

  const stats = useMemo(() => {
    const completed = filteredPayouts.filter((tx) =>
      ["completed", "success", "successful", "paid"].includes((tx.status || "").toLowerCase())
    );
    const pending = filteredPayouts.filter((tx) =>
      ["pending", "processing"].includes((tx.status || "").toLowerCase())
    );

    const totalVolume = completed.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const avgVolume = completed.length > 0 ? totalVolume / completed.length : 0;

    const totalPlatformFees = completed.reduce((sum, tx) => {
      const explicitFee = Number(tx.metadata?.platformFee || tx.metadata?.platform_fee);
      if (!isNaN(explicitFee) && explicitFee > 0) return sum + explicitFee;
      const isRentHubTx = tx.metadata?.source === "renthub" || isRentHub;
      return sum + (Number(tx.amount || 0) / (isRentHubTx ? 0.98 : 0.92)) * (isRentHubTx ? 0.02 : 0.08);
    }, 0);

    const primaryToken =
      tokenFilter !== "all"
        ? tokenFilter
        : (filteredPayouts[0]?.token_type || payouts[0]?.token_type || (isRentHub ? "NT" : "CT"));

    const feeRateLabel = isRentHub ? "2%" : "8%";

    return {
      totalVolume,
      totalPlatformFees,
      completedCount: completed.length,
      pendingCount: pending.length,
      avgVolume,
      primaryToken,
      partnerPlatform,
      feeRateLabel,
    };
  }, [filteredPayouts, tokenFilter, payouts, isRentHub, partnerPlatform]);

  const handleExportCSV = () => {
    if (!filteredPayouts.length) return;
    const headers = [
      "Reference",
      "Date",
      `${beneficiaryLabel} Name`,
      `${beneficiaryLabel} Email`,
      externalIdLabel,
      "Wallet Address",
      "Amount",
      "Token",
      "Status",
    ];
    const rows = filteredPayouts.map((tx) => {
      const beneficiaryName =
        tx.metadata?.landlord_name ||
        tx.metadata?.vendor_name ||
        tx.toUser?.full_name ||
        (isRentHub ? "Property Landlord" : "Marketplace Vendor");
      const beneficiaryEmail =
        tx.metadata?.landlord_email ||
        tx.metadata?.vendor_email ||
        tx.toUser?.email ||
        "";
      const externalId =
        (tx.metadata?.rentHubTransactionId as string) ||
        (tx.metadata?.kaalisPayoutId as string) ||
        (tx.metadata?.payoutId as string) ||
        (tx.metadata?.orderId as string) ||
        "";
      const walletAddress =
        tx.metadata?.vendor_wallet_address ||
        tx.toWallet?.blockchain_address ||
        "";

      return [
        tx.reference,
        tx.created_at,
        `"${beneficiaryName}"`,
        beneficiaryEmail,
        externalId,
        walletAddress,
        tx.amount,
        tx.token_type,
        tx.status,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${isRentHub ? "landlord" : "vendor"}_payouts_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendor Payouts &amp; Settlements</h1>
          <p className="text-sm text-muted-foreground">
            Complete audit trail of marketplace vendor settlements processed via AfriExchange.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadPayouts} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!filteredPayouts.length}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-purple-100 bg-purple-50/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-300">
              Platform Fees ({stats.feeRateLabel})
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {formatAmount(stats.totalPlatformFees)} {stats.primaryToken}
            </div>
            <p className="text-xs text-muted-foreground">
              Accumulated {stats.feeRateLabel} fee retained by platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid to {beneficiaryLabel}s</CardTitle>
            <Send className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(stats.totalVolume)} {stats.primaryToken}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {stats.completedCount} completed {beneficiaryLabel.toLowerCase()} settlements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settlement Count</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedCount}</div>
            <p className="text-xs text-muted-foreground">
              Successfully credited to {beneficiaryLabel.toLowerCase()} wallets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Payout</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(stats.avgVolume)} {stats.primaryToken}
            </div>
            <p className="text-xs text-muted-foreground">Per {beneficiaryLabel.toLowerCase()} settlement transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partner Integration</CardTitle>
            <Store className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.partnerPlatform}</div>
            <p className="text-xs text-emerald-600 font-medium">Integration Active</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Filter {beneficiaryLabel} Settlements</CardTitle>
          <CardDescription>
            Search by reference, {beneficiaryLabel.toLowerCase()} name, email, {externalIdLabel.toLowerCase()}, or wallet address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${beneficiaryLabel.toLowerCase()} name, email, ID...`}
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tokenFilter} onValueChange={setTokenFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tokens</SelectItem>
                {tokenOptions.map((token) => (
                  <SelectItem key={token} value={token}>
                    {token}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Settlements Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date &amp; Time</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>{beneficiaryLabel}</TableHead>
                <TableHead>{externalIdLabel}</TableHead>
                <TableHead>Wallet Address</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                    <RefreshCw className="inline-block mr-2 h-4 w-4 animate-spin" />
                    Loading {beneficiaryLabel.toLowerCase()} settlements...
                  </TableCell>
                </TableRow>
              ) : filteredPayouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                    No {beneficiaryLabel.toLowerCase()} payout records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayouts.map((tx) => {
                  const beneficiaryName =
                    tx.metadata?.landlord_name ||
                    tx.metadata?.vendor_name ||
                    tx.toUser?.full_name ||
                    (isRentHub ? "Property Landlord" : "Marketplace Vendor");
                  const beneficiaryEmail =
                    tx.metadata?.landlord_email ||
                    tx.metadata?.vendor_email ||
                    tx.toUser?.email ||
                    "—";
                  const walletAddress =
                    tx.metadata?.vendor_wallet_address || tx.toWallet?.blockchain_address || "—";
                  const externalPayoutId =
                    (tx.metadata?.rentHubTransactionId as string) ||
                    (tx.metadata?.kaalisPayoutId as string) ||
                    (tx.metadata?.payoutId as string) ||
                    (tx.metadata?.orderId as string) ||
                    "—";

                  return (
                    <TableRow key={tx.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPayout(tx)}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {tx.created_at ? format(new Date(tx.created_at), "yyyy-MM-dd HH:mm") : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-medium">
                        {tx.reference}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{beneficiaryName}</div>
                        <div className="text-xs text-muted-foreground">{beneficiaryEmail}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {externalPayoutId.length > 16 ? `${externalPayoutId.slice(0, 16)}...` : externalPayoutId}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {walletAddress !== "—" ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatAmount(tx.amount)}{" "}
                        <span className="text-xs text-muted-foreground">{tx.token_type}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusTone(tx.status)}>{tx.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPayout(tx);
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedPayout} onOpenChange={(open) => !open && setSelectedPayout(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Vendor Settlement Details</DialogTitle>
            <DialogDescription>
              Transaction audit and metadata for payout reference {selectedPayout?.reference}
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="flex flex-col gap-4 text-sm mt-2">
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg">
                <div>
                  <span className="text-xs text-muted-foreground block">Amount</span>
                  <span className="text-lg font-bold">
                    {formatAmount(selectedPayout.amount)} {selectedPayout.token_type}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Status</span>
                  <Badge variant={statusTone(selectedPayout.status)} className="mt-1">
                    {selectedPayout.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Processed At</span>
                  <span className="text-xs font-medium">
                    {selectedPayout.processed_at
                      ? format(new Date(selectedPayout.processed_at), "yyyy-MM-dd HH:mm:ss")
                      : format(new Date(selectedPayout.created_at), "yyyy-MM-dd HH:mm:ss")}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Source Platform</span>
                  <span className="text-xs font-medium capitalize">
                    {selectedPayout.metadata?.source || (isRentHub ? "RentHub" : "Kaalis Store")}
                  </span>
                </div>
              </div>

              {/* Payout Breakdown */}
              <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Payout Breakdown
                </h4>
                {(() => {
                  const isRentHubTx = selectedPayout.metadata?.source === "renthub" || isRentHub;
                  const vendorAmt = Number(selectedPayout.amount || 0);
                  const orderTotal = selectedPayout.metadata?.gross_amount
                    ? Number(selectedPayout.metadata.gross_amount)
                    : selectedPayout.metadata?.order_total
                    ? Number(selectedPayout.metadata.order_total)
                    : vendorAmt / (isRentHubTx ? 0.98 : 0.92);
                  const platformFee = selectedPayout.metadata?.platform_fee || selectedPayout.metadata?.platformFee
                    ? Number(selectedPayout.metadata.platform_fee || selectedPayout.metadata.platformFee)
                    : orderTotal * (isRentHubTx ? 0.02 : 0.08);
                  const feeRate = isRentHubTx ? "2%" : "8%";
                  const currency = selectedPayout.metadata?.currency || selectedPayout.token_type || (isRentHubTx ? "NT" : "CT");
                  const pct = ((vendorAmt / orderTotal) * 100).toFixed(1);
                  const fmt = (n: number) =>
                    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  return (
                    <>
                      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-background">
                        <span className="text-xs text-muted-foreground">Gross Amount</span>
                        <span className="text-xs font-semibold">{fmt(orderTotal)} {currency}</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-2 w-2 rounded-full bg-red-400" />
                          <span className="text-xs font-medium text-red-700 dark:text-red-400">
                            Platform Fee ({feeRate})
                            {!selectedPayout.metadata?.platform_fee && !selectedPayout.metadata?.platformFee && (
                              <span className="ml-1 text-[10px] opacity-60">(est.)</span>
                            )}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-red-700 dark:text-red-400">
                          − {fmt(platformFee)} {currency}
                        </span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              {isRentHubTx ? "Landlord Net Payout" : "Vendor Payout"} ({pct}%)
                            </span>
                          </div>
                          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                            {fmt(vendorAmt)} {currency}
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-full bg-muted h-1.5 mt-1">
                        <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-right text-[10px] text-muted-foreground">
                        {pct}% of funds disbursed to {isRentHubTx ? "landlord" : "vendor"}
                      </p>
                    </>
                  );
                })()}
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  {isRentHub ? "Landlord Recipient Information" : "Vendor Recipient Information"}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block">{isRentHub ? "Landlord Name:" : "Vendor Name:"}</span>
                    <span className="font-medium">
                      {selectedPayout.metadata?.landlord_name ||
                        selectedPayout.metadata?.vendor_name ||
                        selectedPayout.toUser?.full_name ||
                        "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{isRentHub ? "Landlord Email:" : "Vendor Email:"}</span>
                    <span className="font-medium">
                      {selectedPayout.metadata?.landlord_email ||
                        selectedPayout.metadata?.vendor_email ||
                        selectedPayout.toUser?.email ||
                        "—"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block">Destination Wallet Address:</span>
                    <span className="font-mono text-xs break-all">
                      {selectedPayout.metadata?.vendor_wallet_address ||
                        selectedPayout.toWallet?.blockchain_address ||
                        "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Marketplace Correlation IDs
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block">{externalIdLabel}:</span>
                    <span className="font-mono">
                      {(selectedPayout.metadata?.rentHubTransactionId as string) ||
                        (selectedPayout.metadata?.kaalisPayoutId as string) ||
                        "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">
                      {isRentHub ? "Landlord ID:" : "Vendor ID:"}
                    </span>
                    <span className="font-mono">
                      {(selectedPayout.metadata?.landlordId as string) ||
                        (selectedPayout.metadata?.kaalisVendorId as string) ||
                        selectedPayout.toUser?.id ||
                        "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Country / Market:</span>
                    <span className="font-medium">
                      {(selectedPayout.metadata?.country as string) ||
                        (isRentHub ? "Nigeria (NGN)" : "XOF Zone (SN)")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">AfriExchange Internal ID:</span>
                    <span className="font-mono text-xs">{selectedPayout.id}</span>
                  </div>
                </div>
              </div>

              {selectedPayout.description && (
                <div className="pt-2 border-t text-xs">
                  <span className="text-muted-foreground block">Description:</span>
                  <span className="font-medium">{selectedPayout.description}</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
