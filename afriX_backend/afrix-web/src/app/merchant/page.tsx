"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CreditCard,
  Receipt,
  Send,
  ShieldCheck,
  Store,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

import merchantApi from "@/lib/merchant-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type MerchantProfile = {
  id: string;
  business_name: string;
  display_name: string;
  default_token_type: string;
  verification_status: string;
  settlement_wallet_id: string;
  webhook_url?: string;
  business_email?: string;
  business_phone?: string;
  description?: string;
  city?: string;
  country?: string;
  created_at?: string;
  kyc?: {
    status: string;
    rejection_reason?: string;
  };
};

type MerchantSummary = {
  total_collections: number;
  total_volume: number;
  total_payouts?: number;
  total_payout_volume?: number;
  total_platform_fees?: number;
  pending_payments: number;
  collections_by_token?: Record<string, number>;
  payouts_by_token?: Record<string, number>;
  primary_token?: string;
};

type MerchantWallet = {
  id: string;
  token_type: string;
  balance: string | number;
  created_at?: string;
};

type MerchantTransaction = {
  id: string;
  reference: string;
  amount: string | number;
  token_type: string;
  status: string;
  description?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
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

const EXCHANGE_RATES: Record<string, number> = {
  NT_TO_CT: 0.37,
  CT_TO_NT: 2.7,
  NT_TO_USDT: 0.00067,
  CT_TO_USDT: 0.00177,
  USDT_TO_NT: 1500,
  USDT_TO_CT: 565,
};

function convertToken(amount: number, from: string, to: string): number {
  if (!amount || !from || !to || from.toUpperCase() === to.toUpperCase()) return amount;
  const key = `${from.toUpperCase()}_TO_${to.toUpperCase()}`;
  if (EXCHANGE_RATES[key]) return amount * EXCHANGE_RATES[key];
  const invKey = `${to.toUpperCase()}_TO_${from.toUpperCase()}`;
  if (EXCHANGE_RATES[invKey]) return amount / EXCHANGE_RATES[invKey];
  return amount;
}

export default function MerchantOverviewPage() {
  const [selectedToken, setSelectedToken] = useState<string>("NT");
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [summary, setSummary] = useState<MerchantSummary | null>(null);
  const [wallets, setWallets] = useState<MerchantWallet[]>([]);
  const [recentCollections, setRecentCollections] = useState<MerchantTransaction[]>([]);
  const [updatingToken, setUpdatingToken] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, summaryRes, userRes, transactionsRes] = await Promise.all([
          merchantApi.get("/merchants/profile"),
          merchantApi.get("/merchants/dashboard"),
          merchantApi.get("/users/me"),
          merchantApi.get("/merchants/transactions?limit=20"),
        ]);

        const prof = profileRes.data.data;
        setProfile(prof);
        setSummary(summaryRes.data);
        setWallets(userRes.data.data?.wallets || []);
        setRecentCollections(transactionsRes.data.data?.transactions || []);

        // Default to merchant's profile default token or NT
        if (prof?.default_token_type) {
          setSelectedToken(prof.default_token_type);
        }
      } catch (error) {
        console.error("Failed to load merchant overview:", error);
      }
    };

    load();
  }, []);

  const isRentHub = useMemo(() => {
    return (
      profile?.business_name?.toLowerCase().includes("renthub") ||
      recentCollections.some(
        (c) =>
          (c.metadata as any)?.source === "renthub" ||
          (c.metadata as any)?.platform === "renthub" ||
          c.description?.toLowerCase().includes("renthub")
      )
    );
  }, [profile?.business_name, recentCollections]);

  const activeToken = selectedToken;

  const handleSwitchDefaultToken = async (newTokenType: string) => {
    setSelectedToken(newTokenType);
    if (updatingToken) return;
    setUpdatingToken(true);
    try {
      await merchantApi.put("/merchants/profile", { default_token_type: newTokenType });
      setProfile((prev) => (prev ? { ...prev, default_token_type: newTokenType } : null));
      const summaryRes = await merchantApi.get("/merchants/dashboard");
      setSummary(summaryRes.data);
    } catch (err) {
      console.error("Failed to switch default token:", err);
    } finally {
      setUpdatingToken(false);
    }
  };

  const settlementWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === profile?.settlement_wallet_id) || null,
    [profile?.settlement_wallet_id, wallets]
  );

  const convertedMetrics = useMemo(() => {
    const colByToken = summary?.collections_by_token || {};
    const payByToken = summary?.payouts_by_token || {};

    let totalCol = 0;
    let hasCol = false;
    Object.entries(colByToken).forEach(([tok, amt]) => {
      hasCol = true;
      totalCol += convertToken(Number(amt || 0), tok, activeToken);
    });

    if (!hasCol && summary?.total_volume) {
      const orig = isRentHub ? "NT" : (summary?.primary_token || "CT");
      totalCol = convertToken(Number(summary.total_volume), orig, activeToken);
    }

    let totalPay = 0;
    let hasPay = false;
    Object.entries(payByToken).forEach(([tok, amt]) => {
      hasPay = true;
      totalPay += convertToken(Number(amt || 0), tok, activeToken);
    });

    if (!hasPay && summary?.total_payout_volume) {
      const orig = isRentHub ? "NT" : (summary?.primary_token || "CT");
      totalPay = convertToken(Number(summary.total_payout_volume), orig, activeToken);
    }

    const feeRate = isRentHub ? 0.02 : 0.08;
    const baseRatio = isRentHub ? 0.98 : 0.92;
    const totalFee = (totalPay / baseRatio) * feeRate;

    let totalWallet = 0;
    wallets.forEach((w) => {
      totalWallet += convertToken(Number(w.balance || 0), w.token_type, activeToken);
    });

    return {
      collectedVolume: totalCol,
      payoutVolume: totalPay,
      feeVolume: totalFee,
      walletBalance: totalWallet,
    };
  }, [summary, activeToken, wallets, isRentHub]);

  const walletTotals = useMemo(() => {
    return wallets.reduce<Record<string, number>>((acc, wallet) => {
      acc[wallet.token_type] = Number(wallet.balance || 0);
      return acc;
    }, {});
  }, [wallets]);

  const onboardingIncomplete = useMemo(() => {
    if (!profile) return false;
    const approved = profile.verification_status === "approved";
    const hasWebhook = Boolean(profile.webhook_url?.trim());
    const hasWallet = Boolean(profile.settlement_wallet_id);
    return !approved || !hasWebhook || !hasWallet;
  }, [profile]);

  const onboardingSteps = useMemo(() => {
    if (!profile) return [];
    return [
      {
        done: true, // Path A is default
        label: "Integration path selected",
        hint: "You are currently on Path A (Standard Integration).",
      },
      {
        done: profile.verification_status === "approved",
        label: "Merchant approved",
        hint: profile.kyc?.status === "rejected" 
          ? `Application rejected: ${profile.kyc.rejection_reason || 'Please resubmit your documents.'}`
          : profile.kyc 
            ? "KYC review pending — contact admin if it has been more than 2 business days." 
            : "Submit your KYC documents to begin the verification process.",
      },
      {
        done: Boolean(profile.settlement_wallet_id),
        label: "Settlement wallet assigned",
        hint: "Wallet is assigned automatically after approval.",
      },
      {
        done: Boolean(profile.webhook_url?.trim()),
        label: "Webhook URL configured",
        hint: "Set your webhook endpoint in API & Webhooks.",
      },
    ];
  }, [profile]);

  return (
    <div className="space-y-6">
      {/* Onboarding banner — hidden once fully ready */}
      {onboardingIncomplete && profile && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                Complete your merchant setup
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Finish the steps below before expecting live collections or webhook callbacks.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                {onboardingSteps.map((step) => (
                  <div key={step.label} className="flex items-center gap-1.5 text-sm">
                    <span
                      className={`h-2 w-2 rounded-full ${step.done ? "bg-emerald-500" : "bg-amber-400"}`}
                    />
                    <span
                      className={
                        step.done
                          ? "text-muted-foreground line-through"
                          : "text-amber-900 dark:text-amber-200"
                      }
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {(!profile.kyc || profile.kyc.status === "rejected") && (
                <Button asChild size="sm" className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700">
                  <Link href="/merchant/kyc">{profile.kyc ? "Resubmit KYC" : "Submit KYC"}</Link>
                </Button>
              )}
              <Button asChild size="sm" variant="outline" className="border-amber-300 hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/30">
                <Link href="/merchant/api-webhooks">API &amp; Webhooks</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Store className="h-3.5 w-3.5" />
                Merchant Workspace
              </Badge>
              <Badge variant={statusTone(profile?.verification_status)}>
                {profile?.verification_status || "unknown"}
              </Badge>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                {profile?.business_name || "Merchant Overview"}
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Track collections, monitor wallet balances, and manage your settlement identity
                from one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div>
                <span className="block text-xs uppercase tracking-wide">Display Name</span>
                <span className="font-medium text-foreground">
                  {profile?.display_name || "N/A"}
                </span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wide">Display &amp; Settlement Currency</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center bg-muted rounded-lg p-0.5 border border-border shadow-inner">
                    <button
                      type="button"
                      disabled={updatingToken}
                      onClick={() => handleSwitchDefaultToken("NT")}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                        activeToken === "NT"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="View metrics in Naira Tokens (NT)"
                    >
                      NT (Naira)
                    </button>
                    <button
                      type="button"
                      disabled={updatingToken}
                      onClick={() => handleSwitchDefaultToken("CT")}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                        activeToken === "CT"
                          ? "bg-amber-600 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="View metrics in CFA Tokens (CT)"
                    >
                      CT (CFA)
                    </button>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {activeToken === "NT" ? "1 NT ≈ 0.37 CT" : "1 CT ≈ 2.7 NT"}
                  </span>
                </div>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wide">Settlement Wallet</span>
                <span className="font-mono text-xs text-foreground">
                  {profile?.settlement_wallet_id || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/merchant/collections">
                View Collections
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/merchant/payouts">
                <Send className="mr-2 h-4 w-4" />
                {isRentHub ? "Landlord Payouts" : "Vendor Payouts"}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/merchant/wallet-assets">Wallet Assets</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Successful Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-semibold">{summary?.total_collections ?? 0}</div>
                <p className="text-xs text-muted-foreground">Completed payment receipts</p>
              </div>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Collected Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-semibold flex items-baseline gap-1.5">
                  <span>{formatAmount(convertedMetrics.collectedVolume)}</span>
                  <span className="text-sm font-bold text-muted-foreground">{activeToken}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {activeToken === "CT" && isRentHub
                    ? "Converted from NT at 1 NT ≈ 0.37 CT"
                    : "Settled collection volume"}
                </p>
              </div>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isRentHub ? "Landlord Settlements" : "Vendor Settlements"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-semibold text-emerald-600 flex items-baseline gap-1.5">
                  <span>{formatAmount(convertedMetrics.payoutVolume)}</span>
                  <span className="text-sm font-bold text-emerald-600">{activeToken}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary?.total_payouts ?? 0} {isRentHub ? "landlord escrow release" : "vendor payout"}
                  {summary?.total_payouts === 1 ? "" : "s"}
                  {activeToken === "CT" && isRentHub ? " (converted from NT)" : ""}
                </p>
              </div>
              <Send className="h-4 w-4 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-purple-50/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-300">
              {isRentHub ? "RentHub Escrow Fee (2%)" : "Platform Fees (8%)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-semibold text-purple-700 dark:text-purple-300 flex items-baseline gap-1.5">
                  <span>{formatAmount(convertedMetrics.feeVolume)}</span>
                  <span className="text-sm font-bold">{activeToken}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isRentHub ? "Secured 2% guarantee fee" : "Accumulated 8% fee"}
                </p>
              </div>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-semibold">{summary?.pending_payments ?? 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting completion</p>
              </div>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tracked Wallet Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-semibold flex items-baseline gap-1.5">
                  <span>{formatAmount(convertedMetrics.walletBalance)}</span>
                  <span className="text-sm font-bold text-muted-foreground">{activeToken}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Converted total across {wallets.length || 0} token wallet{wallets.length === 1 ? "" : "s"}
                </p>
              </div>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent Collections</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Your latest merchant payment activity, ready for review.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/merchant/collections">
                See all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCollections.length ? (
              recentCollections.map((transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-lg border px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{formatAmount(transaction.amount)}</span>
                        <Badge variant="outline">{transaction.token_type}</Badge>
                        {transaction.token_type !== activeToken && (
                          <span className="text-xs font-mono text-muted-foreground">
                            ≈ {formatAmount(convertToken(Number(transaction.amount), transaction.token_type, activeToken))} {activeToken}
                          </span>
                        )}
                        <Badge variant={statusTone(transaction.status)}>{transaction.status}</Badge>
                      </div>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {transaction.reference}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.description || "Merchant collection transaction"}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {transaction.created_at
                        ? format(new Date(transaction.created_at), "MMM d, yyyy • h:mm a")
                        : "N/A"}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                No collections yet. As merchant payments start arriving, they will show up here.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settlement Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Business Email</span>
                  <span className="text-right">{profile?.business_email || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Business Phone</span>
                  <span className="text-right">{profile?.business_phone || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Location</span>
                  <span className="text-right">
                    {[profile?.city, profile?.country].filter(Boolean).join(", ") || "N/A"}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Settlement Wallet ID</span>
                  <span className="max-w-[220px] break-all text-right font-mono text-xs">
                    {profile?.settlement_wallet_id || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Settlement Token</span>
                  <span>{settlementWallet?.token_type || profile?.default_token_type || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Settlement Balance</span>
                  <span>{formatAmount(settlementWallet?.balance)} {settlementWallet?.token_type || ""}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Integration Path</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600 border-emerald-200">Path A</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wallet Mix</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(walletTotals).length ? (
                Object.entries(walletTotals).map(([token, balance]) => (
                  <div key={token} className="rounded-lg border px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{token}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatAmount(balance)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
                  Wallet balances will appear here once the merchant account has active wallets.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
