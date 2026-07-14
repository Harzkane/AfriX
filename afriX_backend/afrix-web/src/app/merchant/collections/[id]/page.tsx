"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  RotateCcw,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";

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
  network?: string | null;
  fromUser?: {
    id: string;
    full_name?: string | null;
    email?: string | null;
    phone_number?: string | null;
  } | null;
  toUser?: {
    id: string;
    full_name?: string | null;
    email?: string | null;
    phone_number?: string | null;
  } | null;
  fromWallet?: {
    id: string;
    token_type?: string | null;
  } | null;
  toWallet?: {
    id: string;
    token_type?: string | null;
  } | null;
  merchant?: {
    id: string;
    business_name?: string | null;
    display_name?: string | null;
    default_token_type?: string | null;
    settlement_wallet_id?: string | null;
  } | null;
};

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function formatAmount(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  if (Number.isNaN(parsed)) return "0";
  return numberFormatter.format(parsed);
}

function statusTone(status?: string): "default" | "secondary" | "destructive" | "outline" {
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
    case "refunded":
      return "destructive";
    default:
      return "outline";
  }
}

function formatTimestamp(value?: string | null) {
  if (!value) return "N/A";
  try {
    return format(new Date(value), "MMM d, yyyy • h:mm a");
  } catch {
    return "N/A";
  }
}

// ─── Refund Dialog ────────────────────────────────────────────────────────────

function RefundDialog({
  transaction,
  onClose,
  onRefunded,
}: {
  transaction: MerchantTransaction;
  onClose: () => void;
  onRefunded: (updated: MerchantTransaction) => void;
}) {
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const canSubmit = reason.trim().length >= 3 && confirmed && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      const res = await merchantApi.post(`/merchants/collections/${transaction.id}/refund`, {
        reason: reason.trim(),
      });
      const refundedData = res.data?.data;
      toast.success("Refund processed — tokens returned to buyer.");
      setDone(true);
      onRefunded({
        ...transaction,
        status: refundedData?.status ?? "refunded",
        metadata: {
          ...(transaction.metadata ?? {}),
          refund_reason: refundedData?.refund_reason ?? reason.trim(),
          refunded_at: refundedData?.refunded_at ?? new Date().toISOString(),
        },
      });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          "Refund failed — please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl border bg-card shadow-2xl p-8 text-center space-y-4">
          <div className="flex justify-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </span>
          </div>
          <h2 className="text-xl font-semibold">Refund Successful</h2>
          <p className="text-sm text-muted-foreground">
            {formatAmount(transaction.amount)} {transaction.token_type} have been returned to the
            buyer&apos;s wallet.
          </p>
          <Button className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
              <RotateCcw className="h-4 w-4 text-destructive" />
            </span>
            <h2 className="text-base font-semibold">Refund Collection</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Summary pill */}
          <div className="rounded-xl border bg-muted/40 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Amount to refund</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {formatAmount(transaction.amount)}{" "}
                <span className="text-base font-medium text-muted-foreground">
                  {transaction.token_type}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">To</p>
              <p className="mt-1 text-sm font-medium">
                {transaction.fromUser?.full_name || "Buyer"}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                {transaction.fromUser?.email || "—"}
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 p-4">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              This action is <strong>irreversible</strong>. Tokens will be immediately moved from your
              settlement wallet back to the buyer. Make sure your wallet has sufficient balance before
              proceeding.
            </p>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="refund-reason">
              Reason for refund <span className="text-destructive">*</span>
            </label>
            <textarea
              id="refund-reason"
              ref={inputRef}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Buyer double-charged on checkout, order cancelled by customer…"
              className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              {reason.trim().length}/3 characters minimum
            </p>
          </div>

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-destructive"
            />
            <span className="text-sm text-muted-foreground leading-snug">
              I confirm that I want to refund{" "}
              <strong className="text-foreground">
                {formatAmount(transaction.amount)} {transaction.token_type}
              </strong>{" "}
              to this buyer. I understand this cannot be undone.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t px-6 py-4">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1 gap-2"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Confirm Refund
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MerchantCollectionDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [transaction, setTransaction] = useState<MerchantTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRefundDialog, setShowRefundDialog] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await merchantApi.get(`/merchants/transactions/${id}`);
        setTransaction(response.data.data || null);
      } catch (error: any) {
        console.error("Failed to load merchant collection detail:", error);
        toast.error(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Failed to load collection details"
        );
        setTransaction(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const isRefundable =
    transaction?.status?.toLowerCase() === "completed";

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/merchant/collections">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collections
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Collection transaction not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {showRefundDialog && (
        <RefundDialog
          transaction={transaction}
          onClose={() => setShowRefundDialog(false)}
          onRefunded={(updated) => {
            setTransaction(updated);
            setShowRefundDialog(false);
          }}
        />
      )}

      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/merchant/collections">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collections
          </Link>
        </Button>

        <section className="overflow-hidden rounded-lg border bg-card">
          <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <CreditCard className="h-3.5 w-3.5" />
                  Collection Transaction
                </Badge>
                <Badge variant={statusTone(transaction.status)}>{transaction.status}</Badge>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {formatAmount(transaction.amount)} {transaction.token_type}
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {transaction.description || "Merchant collection transaction"}
              </p>
              <p className="font-mono text-xs text-muted-foreground break-all">
                {transaction.reference}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start xl:flex-col xl:items-end">
              {/* ── Refund Button ── */}
              {isRefundable ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2 shrink-0"
                  onClick={() => setShowRefundDialog(true)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Issue Refund
                </Button>
              ) : transaction.status?.toLowerCase() === "refunded" ? (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/5 px-3 py-1 text-xs font-medium text-destructive">
                  <RotateCcw className="h-3 w-3" />
                  Refunded{" "}
                  {transaction.metadata?.refunded_at
                    ? formatTimestamp(transaction.metadata.refunded_at as string)
                    : ""}
                </div>
              ) : null}

              {/* ── Stat cards ── */}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="min-w-[150px]">
                  <CardContent className="p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p>
                    <p className="mt-2 text-sm font-semibold">
                      {formatTimestamp(transaction.created_at)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="min-w-[150px]">
                  <CardContent className="p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Processed</p>
                    <p className="mt-2 text-sm font-semibold">
                      {formatTimestamp(transaction.processed_at)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="min-w-[150px]">
                  <CardContent className="p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Fee</p>
                    <p className="mt-2 text-sm font-semibold">
                      {formatAmount(transaction.fee)} {transaction.token_type}
                    </p>
                  </CardContent>
                </Card>
                <Card className="min-w-[150px]">
                  <CardContent className="p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Network</p>
                    <p className="mt-2 text-sm font-semibold">{transaction.network || "Off-chain"}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Refund reason banner (shown after refund) */}
        {transaction.status?.toLowerCase() === "refunded" &&
          transaction.metadata?.refund_reason && (
            <div className="flex gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-5 py-4">
              <RotateCcw className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Refund Reason</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {transaction.metadata.refund_reason as string}
                </p>
                {transaction.metadata?.refunded_at && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Refunded on {formatTimestamp(transaction.metadata.refunded_at as string)}
                  </p>
                )}
              </div>
            </div>
          )}

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Record</CardTitle>
              <CardDescription>
                Core ledger details for this merchant collection entry.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Transaction ID</p>
                <p className="mt-1 break-all font-mono text-xs">{transaction.id}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Reference</p>
                <p className="mt-1 break-all font-mono text-xs">{transaction.reference}</p>
              </div>
              {transaction.tx_hash ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Tx Hash</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <p className="break-all font-mono text-xs">{transaction.tx_hash}</p>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={transaction.tx_hash}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open hash
                      </a>
                    </Button>
                  </div>
                </div>
              ) : null}
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Metadata</p>
                <pre className="mt-2 max-h-64 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs whitespace-pre-wrap break-words">
                  {JSON.stringify(transaction.metadata || {}, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payer &amp; Recipient</CardTitle>
                <CardDescription>
                  The users and wallets involved in this merchant collection.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">From user</p>
                  <p className="mt-1 font-medium">
                    {transaction.fromUser?.full_name || "Not attached"}
                  </p>
                  <p className="text-muted-foreground">
                    {transaction.fromUser?.email || "Email not available"}
                  </p>
                  {transaction.fromUser?.phone_number ? (
                    <p className="text-muted-foreground">{transaction.fromUser.phone_number}</p>
                  ) : null}
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">To user</p>
                  <p className="mt-1 font-medium">
                    {transaction.toUser?.full_name || "Merchant account"}
                  </p>
                  <p className="text-muted-foreground">
                    {transaction.toUser?.email || "Email not available"}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <Wallet className="h-3.5 w-3.5" />
                      From wallet
                    </div>
                    <p className="mt-2 break-all font-mono text-xs">
                      {transaction.fromWallet?.id || "N/A"}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {transaction.fromWallet?.token_type || transaction.token_type}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <Wallet className="h-3.5 w-3.5" />
                      To wallet
                    </div>
                    <p className="mt-2 break-all font-mono text-xs">
                      {transaction.toWallet?.id || "N/A"}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {transaction.toWallet?.token_type || transaction.token_type}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Merchant Context</CardTitle>
                <CardDescription>
                  Which merchant settlement identity this transaction belongs to.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Merchant</p>
                  <p className="mt-1 font-medium">
                    {transaction.merchant?.display_name ||
                      transaction.merchant?.business_name ||
                      "Merchant"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Settlement Wallet
                  </p>
                  <p className="mt-1 break-all font-mono text-xs">
                    {transaction.merchant?.settlement_wallet_id || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Default Token</p>
                  <p className="mt-1 font-medium">
                    {transaction.merchant?.default_token_type || transaction.token_type}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
