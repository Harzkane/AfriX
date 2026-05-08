"use client";

import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  LifeBuoy,
  Terminal,
  Webhook,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const apiErrors = [
  {
    code: "401 Unauthorized",
    cause: "Missing or invalid API key in the request header.",
    fix: "Ensure your backend sends the correct merchant API key. If you recently regenerated the key, update all connected systems. Regenerate from API & Webhooks if needed.",
    severity: "destructive",
  },
  {
    code: "403 Forbidden",
    cause: "Merchant account is not yet approved or your API key does not match the merchant.",
    fix: "Confirm your merchant verification status is 'approved' in the Overview. If still pending, contact the AfriExchange admin team to review your KYC submission.",
    severity: "secondary",
  },
  {
    code: "404 Merchant not found",
    cause: "The authenticated user does not have a merchant account registered.",
    fix: "Confirm you are calling the API with the credentials of the user who registered the merchant account — not a different user.",
    severity: "secondary",
  },
  {
    code: "400 — Wallet not found for token",
    cause: "The merchant or user does not have a wallet for the selected token type.",
    fix: "Open Wallet Assets to confirm which token wallets exist. Make sure your default token (e.g. CT) matches an active wallet before creating payment requests.",
    severity: "secondary",
  },
  {
    code: "400 — Validation error",
    cause: "The request payload is missing required fields or contains incorrect types.",
    fix: "Review the request body for the endpoint you're calling. For payment requests, ensure 'amount' is a positive number and 'reference' is a unique string per order.",
    severity: "secondary",
  },
  {
    code: "500 Internal Server Error",
    cause: "An unexpected server-side error occurred.",
    fix: "Retry once. If it persists, check the AfriExchange status channel and contact support with the request reference and timestamp.",
    severity: "outline",
  },
];

const webhookIssues = [
  {
    problem: "Signature mismatch / verification failing",
    detail:
      "Your webhook handler is rejecting callbacks because the HMAC signature does not match.",
    steps: [
      "Confirm the webhook secret stored in your backend matches the one configured in AfriExchange.",
      "Compute the HMAC-SHA256 of the raw request body — not the parsed JSON object.",
      "Compare against the value in the signature header before applying business logic.",
      "Never discard the raw body before verifying; JSON re-serialization can silently alter key order.",
    ],
  },
  {
    problem: "No webhook events arriving",
    detail:
      "AfriExchange is not delivering callbacks to your endpoint.",
    steps: [
      "Confirm the Webhook URL is saved in API & Webhooks (it will show as 'Not configured' if missing).",
      "Confirm your merchant account is approved — pending merchants may not trigger webhook delivery.",
      "Ensure the URL is publicly reachable (not localhost without a tunnel).",
      "For local dev, use a tunnel like ngrok or Cloudflare Tunnel (see Local Dev section below).",
    ],
  },
  {
    problem: "Duplicate webhook events",
    detail:
      "Your backend is processing the same event more than once.",
    steps: [
      "This is expected behaviour — AfriExchange may retry delivery if your endpoint returns a non-2xx response.",
      "Make your webhook handler idempotent: check if the transaction_id or reference has already been processed before applying changes.",
      "Store received transaction_ids and skip duplicates gracefully.",
      "Return HTTP 200 as quickly as possible; defer heavy processing to a background job.",
    ],
  },
  {
    problem: "Webhook URL not reachable (timeout / connection refused)",
    detail:
      "AfriExchange cannot reach your configured webhook endpoint.",
    steps: [
      "Confirm the URL is HTTPS (HTTP endpoints may be rejected).",
      "Confirm there is no firewall or IP allowlist blocking the AfriExchange server IP.",
      "For local development, your laptop's localhost is not reachable from the internet — see tunnel guidance below.",
    ],
  },
];

const localDevSteps = [
  {
    tool: "ngrok",
    command: "ngrok http 3000",
    note: "Replace 3000 with your local backend port. Use the HTTPS forwarding URL as your Webhook URL in API & Webhooks.",
  },
  {
    tool: "Cloudflare Tunnel (cloudflared)",
    command: "cloudflared tunnel --url http://localhost:3000",
    note: "Free, no account required for quick tunnels. Generates a stable HTTPS URL.",
  },
];

const goLiveChecklist = [
  "Merchant KYC submitted and admin-approved (verification_status: approved).",
  "Settlement wallet assigned and default token confirmed (visible in API & Webhooks).",
  "Merchant API key generated and stored securely in your backend secrets.",
  "Webhook URL configured and publicly reachable (confirmed by a test POST from your own backend).",
  "Payment request creation tested end-to-end (POST /merchants/payment-request → QR / payment URL returned).",
  "Webhook delivery confirmed: a real or simulated event reached your handler and updated your order state.",
  "Webhook handler handles duplicate events without double-processing (idempotency test).",
  "API base URL stored in your ecommerce backend environment — not hardcoded in frontend.",
  "Merchant ID stored in your ecommerce integration config for reconciliation.",
];

export default function MerchantSupportPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <LifeBuoy className="h-3.5 w-3.5" />
                Support
              </Badge>
              <Badge variant="secondary">Troubleshooting Guide</Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Merchant Support & Troubleshooting
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Common errors, webhook debugging steps, local dev setup, and the full go-live
              checklist — so you can diagnose and resolve integration issues without waiting
              on admin support.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/merchant/api-webhooks">
                API &amp; Webhooks
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/merchant/docs">
                Integration Guide
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Common API Errors */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Common API Errors</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Errors from <code className="rounded bg-muted px-1 text-xs">/api/v1/merchants/*</code> endpoints
            and what to do about them.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiErrors.map((err) => (
            <div key={err.code} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded bg-muted px-2 py-0.5 text-sm font-semibold">
                  {err.code}
                </code>
              </div>
              <p className="mt-2 text-sm">
                <span className="font-medium">Cause: </span>
                <span className="text-muted-foreground">{err.cause}</span>
              </p>
              <p className="mt-2 text-sm">
                <span className="font-medium">Fix: </span>
                <span className="text-muted-foreground">{err.fix}</span>
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Webhook Troubleshooting */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Webhook className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Webhook Troubleshooting</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Diagnose delivery problems, signature failures, and duplicate events.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {webhookIssues.map((issue) => (
            <div key={issue.problem} className="rounded-lg border p-4">
              <p className="font-semibold">{issue.problem}</p>
              <p className="mt-1 text-sm text-muted-foreground">{issue.detail}</p>
              <ul className="mt-3 space-y-2">
                {issue.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold text-foreground">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Local Dev Setup */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Terminal className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Local Development Setup</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            AfriExchange cannot reach your local machine directly. Use a tunnel to expose your
            webhook handler during development.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Recommended pattern</p>
            <ol className="mt-2 space-y-1">
              <li>1. Start your local backend (e.g. on port 5001).</li>
              <li>2. Open a tunnel to that port using ngrok or cloudflared.</li>
              <li>3. Copy the HTTPS tunnel URL and paste it as the Webhook URL in API &amp; Webhooks.</li>
              <li>4. Test a payment request — the webhook should arrive at your local handler.</li>
              <li>5. Before deploying, update the Webhook URL to your production endpoint.</li>
            </ol>
          </div>

          {localDevSteps.map((item) => (
            <div key={item.tool} className="rounded-lg border p-4">
              <p className="font-medium">{item.tool}</p>
              <code className="mt-2 block rounded bg-muted px-3 py-2 text-sm">
                {item.command}
              </code>
              <p className="mt-2 text-sm text-muted-foreground">{item.note}</p>
            </div>
          ))}

          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">API Base URL for local dev: </span>
              Use <code className="rounded bg-muted px-1">http://localhost:5001/api/v1</code> (or
              your configured backend port) in your ecommerce backend environment. Do not use
              the production URL during development.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Go-Live Checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <CardTitle>Go-Live Checklist</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Complete every item before pointing a real customer at your integration.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {goLiveChecklist.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
