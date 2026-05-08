"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  BookOpen,
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  Layers3,
  Wallet,
  Webhook,
} from "lucide-react";
import { toast } from "sonner";

import merchantApi from "@/lib/merchant-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MerchantProfile = {
  id?: string;
  business_name?: string;
  display_name?: string;
  default_token_type?: string;
  webhook_url?: string;
  settlement_wallet_id?: string;
  verification_status?: string;
  payment_fee_percent?: string | number;
  updated_at?: string;
  created_at?: string;
  integration_health?: {
    last_webhook_attempt_at?: string | null;
    last_webhook_event?: string | null;
    last_webhook_reference?: string | null;
    last_webhook_status?: string | null;
    last_webhook_http_status?: number | null;
    last_webhook_error?: string | null;
  } | null;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

const valuePlacementRows = [
  {
    key: "Merchant ID",
    source: "Shown below from your merchant account",
    destination:
      "Place in your ecommerce backend integration config so the platform knows which AfriExchange merchant it is operating against.",
  },
  {
    key: "Settlement Wallet ID",
    source: "Shown below from your merchant settlement setup",
    destination:
      "Usually reference-only for reconciliation, finance checks, and support debugging.",
  },
  {
    key: "Default Token",
    source: "Shown below from your merchant profile",
    destination:
      "Place in ecommerce integration assumptions and settlement logic so your platform uses the intended token rail.",
  },
  {
    key: "Webhook URL",
    source: "You provide this from your ecommerce backend",
    destination:
      "Save it in Merchant API & Webhooks so AfriExchange knows where to send merchant event callbacks.",
  },
  {
    key: "API Base URL",
    source: "Shown below from the live merchant frontend environment",
    destination:
      "Place in ecommerce backend environment config for server-to-server calls.",
  },
  {
    key: "API Key",
    source: "Regenerate from Merchant API & Webhooks when needed",
    destination:
      "Store only in backend secrets or a secret manager. Never put it in frontend or public env files.",
  },
];

export default function MerchantIntegrationHubPage() {
  const [profile, setProfile] = useState<MerchantProfile>({
    id: "",
    business_name: "",
    display_name: "",
    default_token_type: "CT",
    webhook_url: "",
    settlement_wallet_id: "",
    verification_status: "",
    payment_fee_percent: "",
    updated_at: "",
    created_at: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const response = await merchantApi.get("/merchants/profile");
        setProfile((current) => ({ ...current, ...response.data.data }));
      } catch (error) {
        console.error("Failed to load merchant integration hub:", error);
        toast.error("Failed to load merchant integration hub");
      }
    };

    load();
  }, []);

  const readiness = useMemo(
    () => [
      {
        label: "Integration path chosen",
        done: true, // Path A is default
      },
      {
        label: "Merchant approved",
        done: profile.verification_status === "approved",
      },
      {
        label: "Settlement wallet assigned",
        done: Boolean(profile.settlement_wallet_id),
      },
      {
        label: "Webhook URL configured",
        done: Boolean(profile.webhook_url?.trim()),
      },
      {
        label: "Default token chosen",
        done: Boolean(profile.default_token_type),
      },
    ],
    [profile]
  );

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch (error) {
      console.error(`Failed to copy ${label}:`, error);
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Layers3 className="h-3.5 w-3.5" />
                Integration Hub
              </Badge>
              <Badge variant="secondary">{profile.verification_status || "unknown"}</Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Merchant Integration Hub</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              One place to collect your merchant integration values, see readiness, know where each
              value belongs, and jump straight into the right setup or support workflow.
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            {profile.updated_at
              ? `Last updated ${format(new Date(profile.updated_at), "MMM d, yyyy • h:mm a")}`
              : "Integration summary ready"}
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-emerald-900 dark:text-emerald-300">
                Path A: Standard Integration
              </CardTitle>
              <Badge className="bg-emerald-600 hover:bg-emerald-600">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-emerald-800 dark:text-emerald-400">
              Best for single-store ecommerce, SaaS, or individual brand checkouts.
            </p>
            <ul className="space-y-2 text-xs text-emerald-700 dark:text-emerald-500">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Use standard Payment Request APIs
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Simple reference-based webhooks
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Direct settlement to one wallet
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="opacity-80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold text-muted-foreground">
                  Path B: Platform Partner
                </CardTitle>
                <p className="text-xs text-muted-foreground">For multi-vendor marketplaces (e.g. Kaalis)</p>
              </div>
              <Badge variant="outline" className="border-amber-200 text-amber-600 bg-amber-50">Coming Soon</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Requirements</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span><strong>Platform Agreement</strong>: Signed partner contract and technical review.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span><strong>Custom Webhooks</strong>: Bespoke event types (`payout.disbursed`, etc.) with shared secret signing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span><strong>Vendor Mapping</strong>: Mapping your internal vendor IDs to AfriExchange merchant IDs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span><strong>Payout Orchestration</strong>: Automated server-to-server vendor disbursements via Integration APIs.</span>
                </li>
              </ul>
            </div>
            <Button variant="secondary" size="sm" className="w-full text-xs" asChild>
              <Link href="/merchant/support">Request Path B Access</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Merchant ID</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="break-all font-mono text-sm">{profile.id || "N/A"}</p>
            {profile.id ? (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-auto p-0 text-xs"
                onClick={() => copyValue(profile.id || "", "Merchant ID")}
              >
                Copy merchant id
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Settlement Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="break-all font-mono text-sm">{profile.settlement_wallet_id || "N/A"}</p>
            {profile.settlement_wallet_id ? (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-auto p-0 text-xs"
                onClick={() => copyValue(profile.settlement_wallet_id || "", "Settlement wallet ID")}
              >
                Copy wallet id
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Default Token</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{profile.default_token_type || "N/A"}</p>
            <p className="mt-1 text-sm text-muted-foreground">CT is the current live Kaalis path.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Webhook URL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="break-all text-sm">{profile.webhook_url || "Not configured"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">API Base URL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="break-all text-sm">{apiBaseUrl}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-auto p-0 text-xs"
              onClick={() => copyValue(apiBaseUrl, "API base URL")}
            >
              Copy API base URL
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Where to Get It and Where to Place It</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {valuePlacementRows.map((item) => (
                <div key={item.key} className="rounded-lg border p-4">
                  <p className="font-medium">{item.key}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Where to get it:</span> {item.source}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Where to place it:</span> {item.destination}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Merchant Integration Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border p-4">
                <p className="font-medium">Last Kaalis webhook attempt</p>
                <p className="mt-2 text-muted-foreground">
                  {profile.integration_health?.last_webhook_attempt_at
                    ? format(new Date(profile.integration_health.last_webhook_attempt_at), "MMM d, yyyy • h:mm a")
                    : "No webhook attempt recorded yet"}
                </p>
                <p className="mt-2 text-muted-foreground">
                  Event: {profile.integration_health?.last_webhook_event || "Not available yet"}
                </p>
                <p className="mt-1 break-all text-xs text-muted-foreground">
                  Reference: {profile.integration_health?.last_webhook_reference || "Not available yet"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Status: {profile.integration_health?.last_webhook_status || "Not available yet"}
                </p>
                {profile.integration_health?.last_webhook_http_status ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    HTTP status: {profile.integration_health.last_webhook_http_status}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Readiness Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {readiness.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`h-4 w-4 ${item.done ? "text-emerald-500" : "text-muted-foreground"}`} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <Badge variant={item.done ? "default" : "secondary"}>
                    {item.done ? "Ready" : "Pending"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/merchant/api-webhooks">
                  Open API & Webhooks
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/merchant/settings">
                  Open Settings
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/merchant/docs">
                  Open Docs
                  <BookOpen className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operator Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <KeyRound className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <p>
                  API keys belong in backend secrets, never in frontend bundles or public env files.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Webhook className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <p>
                  Webhook delivery being recorded does not guarantee your downstream ecommerce
                  processing succeeded. Always keep handlers idempotent and observable.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Wallet className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <p>
                  Settlement wallet id is a strong debugging anchor whenever finance or support needs
                  to confirm where collections land.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
