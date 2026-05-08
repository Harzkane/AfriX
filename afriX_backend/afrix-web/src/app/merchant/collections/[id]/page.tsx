"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  ExternalLink,
  Loader2,
  Wallet,
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

export default function MerchantCollectionDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [transaction, setTransaction] = useState<MerchantTransaction | null>(null);
  const [loading, setLoading] = useState(true);

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
      </section>

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
              <CardTitle>Payer & Recipient</CardTitle>
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
  );
}
