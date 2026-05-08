"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CreditCard,
  Download,
  Filter,
  Search,
  SlidersHorizontal,
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

type MerchantTransaction = {
  id: string;
  reference: string;
  amount: string | number;
  token_type: string;
  status: string;
  description?: string | null;
  fee?: string | number | null;
  tx_hash?: string | null;
  metadata?: Record<string, unknown> | null;
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
    case "approved":
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

export default function MerchantCollectionsPage() {
  const [transactions, setTransactions] = useState<MerchantTransaction[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tokenFilter, setTokenFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<MerchantTransaction | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await merchantApi.get("/merchants/transactions?limit=100");
        setTransactions(response.data.data?.transactions || []);
      } catch (error) {
        console.error("Failed to load merchant transactions:", error);
      }
    };
    load();
  }, []);

  const statusOptions = useMemo(() => {
    return Array.from(new Set(transactions.map((tx) => tx.status).filter(Boolean)));
  }, [transactions]);

  const tokenOptions = useMemo(() => {
    return Array.from(new Set(transactions.map((tx) => tx.token_type).filter(Boolean)));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const searchMatch =
        !search ||
        transaction.reference?.toLowerCase().includes(search.toLowerCase()) ||
        transaction.description?.toLowerCase().includes(search.toLowerCase()) ||
        transaction.id?.toLowerCase().includes(search.toLowerCase());

      const statusMatch = statusFilter === "all" || transaction.status === statusFilter;
      const tokenMatch = tokenFilter === "all" || transaction.token_type === tokenFilter;

      return searchMatch && statusMatch && tokenMatch;
    });
  }, [search, statusFilter, tokenFilter, transactions]);

  const stats = useMemo(() => {
    const completed = filteredTransactions.filter((tx) =>
      ["completed", "success", "successful"].includes((tx.status || "").toLowerCase())
    );
    const pending = filteredTransactions.filter((tx) =>
      ["pending", "processing"].includes((tx.status || "").toLowerCase())
    );

    return {
      completedCount: completed.length,
      pendingCount: pending.length,
      filteredVolume: completed.reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
      totalCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTokenFilter("all");
  };

  const exportCsv = () => {
    const headers = [
      "Reference",
      "Amount",
      "Token",
      "Status",
      "Description",
      "Fee",
      "Tx Hash",
      "Date",
      "Processed At",
    ];

    const escapeCsv = (val: any) => {
      const stringified = String(val ?? "");
      if (stringified.includes(",") || stringified.includes('"') || stringified.includes("\n")) {
        return `"${stringified.replace(/"/g, '""')}"`;
      }
      return stringified;
    };

    const rows = filteredTransactions.map((tx) => [
      escapeCsv(tx.reference),
      escapeCsv(tx.amount),
      escapeCsv(tx.token_type),
      escapeCsv(tx.status),
      escapeCsv(tx.description || "Merchant collection transaction"),
      escapeCsv(tx.fee),
      escapeCsv(tx.tx_hash),
      escapeCsv(tx.created_at ? format(new Date(tx.created_at), "yyyy-MM-dd HH:mm:ss") : ""),
      escapeCsv(tx.processed_at ? format(new Date(tx.processed_at), "yyyy-MM-dd HH:mm:ss") : ""),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `afriexchange-collections-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <CreditCard className="h-3.5 w-3.5" />
                Collections
              </Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Merchant Collections</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Review merchant payment activity, search references quickly, and inspect each
              collection without leaving the page.
            </p>
            <p className="max-w-2xl text-xs text-muted-foreground">
              This activity feed covers merchant collection payments. Burn-request refunds or
              escrow returns are tracked in Sell Through Agent, not here.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="min-w-[150px]">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Completed</p>
                  <p className="mt-2 text-2xl font-semibold">{stats.completedCount}</p>
                </CardContent>
              </Card>
              <Card className="min-w-[150px]">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending</p>
                  <p className="mt-2 text-2xl font-semibold">{stats.pendingCount}</p>
                </CardContent>
              </Card>
              <Card className="min-w-[150px]">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Volume</p>
                  <p className="mt-2 text-2xl font-semibold">{formatAmount(stats.filteredVolume)}</p>
                </CardContent>
              </Card>
              <Card className="min-w-[150px]">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Rows</p>
                  <p className="mt-2 text-2xl font-semibold">{stats.totalCount}</p>
                </CardContent>
              </Card>
            </div>
            <Button
              variant="outline"
              className="shrink-0 gap-2 self-start"
              onClick={exportCsv}
              disabled={filteredTransactions.length === 0}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </CardTitle>
          <CardDescription>Search by reference, description, or transaction id.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.6fr_0.7fr_0.7fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reference, description, or transaction id"
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tokenFilter} onValueChange={setTokenFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Token" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tokens</SelectItem>
              {tokenOptions.map((token) => (
                <SelectItem key={token} value={token}>
                  {token}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={clearFilters} className="gap-2">
            <Filter className="h-4 w-4" />
            Clear
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4 lg:hidden">
        {filteredTransactions.length ? (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {transaction.reference}
                    </p>
                    <p className="text-lg font-semibold">
                      {formatAmount(transaction.amount)} {transaction.token_type}
                    </p>
                  </div>
                  <Badge variant={statusTone(transaction.status)}>{transaction.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {transaction.description || "Merchant collection transaction"}
                </p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {transaction.created_at
                      ? format(new Date(transaction.created_at), "MMM d, yyyy")
                      : "N/A"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/merchant/collections/${transaction.id}`}>Open</Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTransaction(transaction)}>
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No collections match the current filters.
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="hidden lg:block">
        <CardHeader>
          <CardTitle>Collection Activity</CardTitle>
          <CardDescription>
            This view reads from your merchant collection transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[880px]">
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length ? (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="max-w-[180px] truncate font-mono text-xs">
                      {tx.reference}
                    </TableCell>
                    <TableCell className="font-medium">{formatAmount(tx.amount)}</TableCell>
                    <TableCell>{tx.token_type}</TableCell>
                    <TableCell>
                      <Badge variant={statusTone(tx.status)}>{tx.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-muted-foreground">
                      {tx.description || "Merchant collection transaction"}
                    </TableCell>
                    <TableCell>
                      {tx.created_at
                        ? format(new Date(tx.created_at), "MMM d, yyyy • h:mm a")
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/merchant/collections/${tx.id}`}>Open</Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedTransaction(tx)}>
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No collections match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedTransaction)} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Collection Details</DialogTitle>
            <DialogDescription>
              Review the selected merchant collection and its reference details.
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardContent className="space-y-3 p-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Reference</p>
                    <p className="mt-1 break-all font-mono text-xs">{selectedTransaction.reference}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Transaction ID</p>
                    <p className="mt-1 break-all font-mono text-xs">{selectedTransaction.id}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={statusTone(selectedTransaction.status)}>
                      {selectedTransaction.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Token</span>
                    <span>{selectedTransaction.token_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold">
                      {formatAmount(selectedTransaction.amount)} {selectedTransaction.token_type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Fee</span>
                    <span>{formatAmount(selectedTransaction.fee)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-3 p-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Description</p>
                    <p className="mt-1 text-muted-foreground">
                      {selectedTransaction.description || "Merchant collection transaction"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p>
                    <p className="mt-1">
                      {selectedTransaction.created_at
                        ? format(new Date(selectedTransaction.created_at), "MMM d, yyyy • h:mm a")
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Processed</p>
                    <p className="mt-1">
                      {selectedTransaction.processed_at
                        ? format(new Date(selectedTransaction.processed_at), "MMM d, yyyy • h:mm a")
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Tx Hash</p>
                    <p className="mt-1 break-all font-mono text-xs">
                      {selectedTransaction.tx_hash || "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="sm:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
                    {JSON.stringify(selectedTransaction.metadata || {}, null, 2)}
                  </pre>
                </CardContent>
              </Card>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" asChild>
                  <Link href={`/merchant/collections/${selectedTransaction.id}`}>
                    Open full collection page
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
