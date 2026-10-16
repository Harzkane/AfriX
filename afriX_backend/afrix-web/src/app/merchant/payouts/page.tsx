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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tokenFilter, setTokenFilter] = useState("all");
  const [selectedPayout, setSelectedPayout] = useState<VendorPayoutTransaction | null>(null);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const response = await merchantApi.get("/merchants/transactions?type=payout&limit=100");
      setPayouts(response.data.data?.transactions || []);
    } catch (error) {
      console.error("Failed to load vendor payouts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
  }, []);

  const tokenOptions = useMemo(() => {
    return Array.from(new Set(payouts.map((tx) => tx.token_type).filter(Boolean)));
  }, [payouts]);

  const filteredPayouts = useMemo(() => {
    return payouts.filter((tx) => {
      const vendorName = tx.metadata?.vendor_name || tx.toUser?.full_name || "";
      const vendorEmail = tx.metadata?.vendor_email || tx.toUser?.email || "";
      const kaalisPayoutId = tx.metadata?.kaalisPayoutId || "";
      const walletAddress = tx.metadata?.vendor_wallet_address || tx.toWallet?.blockchain_address || "";

      const searchMatch =
        !search ||
        tx.reference?.toLowerCase().includes(search.toLowerCase()) ||
        tx.description?.toLowerCase().includes(search.toLowerCase()) ||
        vendorName.toLowerCase().includes(search.toLowerCase()) ||
        vendorEmail.toLowerCase().includes(search.toLowerCase()) ||
        kaalisPayoutId.toLowerCase().includes(search.toLowerCase()) ||
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

    return {
      totalVolume,
      completedCount: completed.length,
      pendingCount: pending.length,
      avgVolume,
    };
  }, [filteredPayouts]);

  const handleExportCSV = () => {
    if (!filteredPayouts.length) return;
    const headers = [
      "Reference",
      "Date",
      "Vendor Name",
      "Vendor Email",
      "Kaalis Payout ID",
      "Wallet Address",
      "Amount",
      "Token",
      "Status",
    ];
    const rows = filteredPayouts.map((tx) => [
      tx.reference,
      tx.created_at,
      `"${tx.metadata?.vendor_name || tx.toUser?.full_name || ""}"`,
      tx.metadata?.vendor_email || tx.toUser?.email || "",
      tx.metadata?.kaalisPayoutId || "",
      tx.metadata?.vendor_wallet_address || tx.toWallet?.blockchain_address || "",
      tx.amount,
      tx.token_type,
      tx.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vendor_payouts_${format(new Date(), "yyyy-MM-dd")}.csv`);
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid to Vendors</CardTitle>
            <Send className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(stats.totalVolume)} CT</div>
            <p className="text-xs text-muted-foreground">
              Across {stats.completedCount} completed vendor settlements
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
              Successfully credited to vendor wallets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Payout</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(stats.avgVolume)} CT</div>
            <p className="text-xs text-muted-foreground">Per vendor settlement transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partner Marketplace</CardTitle>
            <Store className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Kaalis Store</div>
            <p className="text-xs text-emerald-600 font-medium">Path B Integration Active</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Filter Vendor Settlements</CardTitle>
          <CardDescription>
            Search by reference, vendor name, email, Kaalis payout ID, or wallet address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendor name, email, ID..."
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
                <TableHead>Vendor</TableHead>
                <TableHead>Kaalis Payout ID</TableHead>
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
                    Loading vendor settlements...
                  </TableCell>
                </TableRow>
              ) : filteredPayouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                    No vendor payout records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayouts.map((tx) => {
                  const vendorName = tx.metadata?.vendor_name || tx.toUser?.full_name || "Marketplace Vendor";
                  const vendorEmail = tx.metadata?.vendor_email || tx.toUser?.email || "—";
                  const walletAddress =
                    tx.metadata?.vendor_wallet_address || tx.toWallet?.blockchain_address || "—";
                  const kaalisPayoutId = tx.metadata?.kaalisPayoutId || "—";

                  return (
                    <TableRow key={tx.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPayout(tx)}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {tx.created_at ? format(new Date(tx.created_at), "yyyy-MM-dd HH:mm") : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-medium">
                        {tx.reference}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{vendorName}</div>
                        <div className="text-xs text-muted-foreground">{vendorEmail}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {kaalisPayoutId.length > 16 ? `${kaalisPayoutId.slice(0, 16)}...` : kaalisPayoutId}
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
                    {selectedPayout.metadata?.source || "Kaalis Store"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Vendor Recipient Information
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Vendor Name:</span>
                    <span className="font-medium">
                      {selectedPayout.metadata?.vendor_name || selectedPayout.toUser?.full_name || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Vendor Email:</span>
                    <span className="font-medium">
                      {selectedPayout.metadata?.vendor_email || selectedPayout.toUser?.email || "—"}
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
                    <span className="text-muted-foreground block">Kaalis Payout ID:</span>
                    <span className="font-mono">{selectedPayout.metadata?.kaalisPayoutId || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Kaalis Vendor ID:</span>
                    <span className="font-mono">{selectedPayout.metadata?.kaalisVendorId || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Country / Market:</span>
                    <span className="font-medium">{selectedPayout.metadata?.country || "XOF Zone (SN)"}</span>
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
