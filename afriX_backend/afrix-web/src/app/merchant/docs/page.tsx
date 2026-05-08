"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRightLeft,
  BookOpen,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Gauge,
  KeyRound,
  Layers3,
  ShieldCheck,
  Wallet,
  Webhook,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const gettingStarted = [
  "Complete merchant approval before expecting live collections or webhook traffic.",
  "Confirm your settlement wallet and default token before connecting an ecommerce platform.",
  "Set and verify your webhook URL before relying on automated order or ledger updates.",
  "Regenerate API keys only when connected systems are ready for the new credential.",
];

const integrationChecklist = [
  "Store the AfriExchange API base URL in your ecommerce backend.",
  "Store the merchant id that represents your business inside AfriExchange.",
  "Use the merchant API key for authenticated backend-to-backend requests.",
  "Configure a stable webhook endpoint and handle duplicate deliveries safely.",
  "Keep token choice explicit: CT is the current live Kaalis path; NT and USDT remain future-ready options.",
];

const tokenNotes = [
  {
    token: "CT",
    summary: "Current live practical token rail for the Kaalis XOF path.",
  },
  {
    token: "NT",
    summary: "Supported in the broader platform and ready for future merchant use cases.",
  },
  {
    token: "USDT",
    summary: "Supported for future treasury and settlement flexibility, but not the current live Kaalis default.",
  },
];

const supportStates = [
  {
    label: "Collections",
    description:
      "Incoming merchant payment activity. Use this for merchant-side transaction history and settlement tracking.",
    href: "/merchant/collections",
    icon: CreditCard,
  },
  {
    label: "Wallet Assets",
    description:
      "Settlement wallet inventory, balances, and copyable wallet identifiers by token.",
    href: "/merchant/wallet-assets",
    icon: Wallet,
  },
  {
    label: "Sell Through Agent",
    description:
      "Merchant token liquidation flow with escrow, fiat confirmation, dispute protection, and request history.",
    href: "/merchant/sell-through-agent",
    icon: ArrowRightLeft,
  },
  {
    label: "API & Webhooks",
    description:
      "Merchant integration workspace for webhook setup, API key rotation, readiness checks, and delivery health.",
    href: "/merchant/api-webhooks",
    icon: Webhook,
  },
];

const integrationValues = [
  {
    name: "Merchant ID",
    whereToGetIt: "API & Webhooks page inside the Merchant Portal.",
    whereToPlaceIt:
      "Store it in your ecommerce backend integration config so your system knows which AfriExchange merchant account it is operating against.",
  },
  {
    name: "Settlement Wallet ID",
    whereToGetIt: "API & Webhooks or Wallet Assets page.",
    whereToPlaceIt:
      "Usually this is reference-only for operators and reconciliation. It helps finance or engineering verify where settlement lands.",
  },
  {
    name: "Default Token",
    whereToGetIt: "API & Webhooks page and merchant Settings page.",
    whereToPlaceIt:
      "Use it in your ecommerce integration config and order/settlement assumptions so your platform knows which token rail is primary.",
  },
  {
    name: "Webhook URL",
    whereToGetIt: "You provide this from your ecommerce backend.",
    whereToPlaceIt:
      "Enter it in the Merchant Portal API & Webhooks page. This is the server endpoint AfriExchange will call with merchant event updates.",
  },
  {
    name: "API Key",
    whereToGetIt: "Regenerate it from the Merchant Portal API & Webhooks page.",
    whereToPlaceIt:
      "Store it only in your ecommerce backend or secret manager. Do not place it in frontend code or public environment files.",
  },
  {
    name: "API Base URL",
    whereToGetIt: "Shown in the Merchant Portal API & Webhooks page.",
    whereToPlaceIt:
      "Store it in your ecommerce backend environment configuration so server-to-server requests target the correct AfriExchange API.",
  },
];

const errorCatalog = [
  {
    code: "401",
    title: "Invalid or missing API key",
    trigger: "Request sent without an Authorization header, or with an expired/rotated key.",
    fix: "Regenerate the API key in API & Webhooks and update the key stored in your ecommerce backend environment.",
    severity: "auth",
  },
  {
    code: "401",
    title: "Merchant privileges required",
    trigger: "The authenticated user has not completed merchant registration, so the role is still 'user'.",
    fix: "Complete merchant registration via POST /api/v1/merchants/register with the authenticated user token before calling merchant-only routes.",
    severity: "auth",
  },
  {
    code: "403",
    title: "Merchant not verified",
    trigger: "The merchant account exists but admin approval is still pending. Some routes are blocked until approved.",
    fix: "Wait for admin approval or check verification status in the Merchant Portal. Submit KYC documents if not already done.",
    severity: "access",
  },
  {
    code: "400",
    title: "Invalid request payload",
    trigger: "Missing required fields, wrong token type value (not NT / CT / USDT), or an invalid webhook URL format.",
    fix: "Check the exact field name and value. Webhook URLs must start with https://. Token type must be exactly NT, CT, or USDT.",
    severity: "validation",
  },
  {
    code: "400",
    title: "No webhook URL configured",
    trigger: "Triggering a sandbox ping or expecting webhook delivery when no webhook URL is saved on the merchant profile.",
    fix: "Go to API & Webhooks and save a valid webhook URL before using sandbox testing or relying on live callbacks.",
    severity: "validation",
  },
  {
    code: "400",
    title: "Webhook signature mismatch",
    trigger: "Your endpoint is verifying the x-afriexchange-signature header but the computed HMAC does not match.",
    fix: "Ensure you are reading the raw request body (not parsed JSON) for HMAC computation. Use: sha256=HMAC-SHA256(secret, timestamp + '.' + rawBody). Secret is available from your integration settings.",
    severity: "webhook",
  },
  {
    code: "429",
    title: "Rate limit exceeded",
    trigger: "Too many requests in a short window. Read routes allow 60 req/min; write routes 20 req/min; sensitive routes 5 per 15 min.",
    fix: "Implement exponential backoff on 429 responses. Cache read results (profile, dashboard) locally instead of polling every request cycle.",
    severity: "rate",
  },
  {
    code: "2xx / timeout",
    title: "Duplicate webhook deliveries",
    trigger: "AfriExchange may retry webhook delivery if your endpoint does not respond within the timeout window, resulting in the same event arriving more than once.",
    fix: "Store and check the eventId field from every webhook payload before applying business logic. Use eventId as an idempotency key in your database.",
    severity: "webhook",
  },
];

const severityStyle: Record<string, string> = {
  auth: "border-rose-500/30 bg-rose-500/5",
  access: "border-orange-500/30 bg-orange-500/5",
  validation: "border-yellow-500/30 bg-yellow-500/5",
  webhook: "border-cyan-500/30 bg-cyan-500/5",
  rate: "border-purple-500/30 bg-purple-500/5",
};

const severityBadge: Record<string, string> = {
  auth: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  access: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  validation: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  webhook: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  rate: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const rateLimits = [
  {
    category: "Read endpoints",
    routes: "GET /profile, /dashboard, /transactions, /onboarding-status",
    limit: "60 req / min",
    icon: Gauge,
  },
  {
    category: "Write endpoints",
    routes: "PUT /profile, POST /payment-request, POST /verify, POST /kyc/upload, POST /sandbox/ping-webhook",
    limit: "20 req / min",
    icon: Zap,
  },
  {
    category: "Sensitive endpoints",
    routes: "POST /register, POST /regenerate-api-key",
    limit: "5 req / 15 min",
    icon: ShieldCheck,
  },
];

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

export default function MerchantDocsPage() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                Merchant Docs
              </Badge>
              <Badge variant="secondary">Operational Guide</Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Merchant Integration Guide</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              This page is the merchant-facing home for how AfriExchange works, how to connect an
              ecommerce platform, and how to operate collections, wallets, webhooks, and token sell
              flows without needing to dig through repo docs.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Kaalis proved the model for XOF collections with CT. This portal keeps that operating
            pattern reusable for future merchant partners too.
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-900 dark:text-emerald-300">Path A: Standard Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-emerald-800 dark:text-emerald-400">
            <p><strong>Use this if:</strong> You are a single business or brand selling directly to customers through your own website or app.</p>
            <p>Most merchants use Path A. It provides straightforward API access for payment requests and automatic settlement to your business wallet.</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-900 dark:text-amber-300">Path B: Platform Partner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-800 dark:text-amber-400">
            <p><strong>Use this if:</strong> You are a marketplace or multi-vendor platform (like Kaalis) that facilitates sales for many sub-merchants.</p>
            <p>Path B allows you to orchestrate payouts to various vendors and manage complex multi-tenant reconciliation. This path requires a platform agreement.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Who this is for</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            Ecommerce platform teams, merchant engineering teams, and technical merchants operating
            a connected business inside AfriExchange.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current live Kaalis rail</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">CT</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The practical current token path for the Kaalis XOF integration.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Integration anchors</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Merchant id, settlement wallet, default token, webhook URL, and API key are the core
            technical anchors every connected ecommerce platform should know.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Where to start</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Merchant approval first, then API & Webhooks setup, then collections and settlement
            operations.
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {gettingStarted.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-lg border p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <p className="text-sm text-muted-foreground">{item}</p>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full justify-between mt-2">
                <Link href="/merchant/integration-hub">
                  Go to Integration Hub
                  <Layers3 className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Integration Snippets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border bg-zinc-950 p-4 text-zinc-50 overflow-x-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Example: Create Payment Request (cURL)</span>
                  </div>
                  <pre className="text-xs font-mono">
{`curl -X POST "${apiBaseUrl}/merchants/payment-request" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": "5000",
    "token_type": "CT",
    "description": "Order #12345",
    "reference": "REF-UNIQUE-ID"
  }'`}
                  </pre>
                </div>

                <div className="rounded-lg border bg-zinc-950 p-4 text-zinc-50 overflow-x-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Node.js (Axios)</span>
                  </div>
                  <pre className="text-xs font-mono">
{`const axios = require('axios');

const createPayment = async () => {
  const response = await axios.post('${apiBaseUrl}/merchants/payment-request', {
    amount: '5000',
    token_type: 'CT',
    description: 'Order #12345',
    reference: 'REF-UNIQUE-ID'
  }, {
    headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
  });
  console.log('Payment URL:', response.data.data.payment_url);
};`}
                  </pre>
                </div>
                
                <p className="text-xs text-muted-foreground italic">
                  Note: Replace YOUR_API_KEY with the key from your <Link href="/merchant/api-webhooks" className="text-primary underline">API & Webhooks</Link> settings.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Connect Your Ecommerce</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {integrationChecklist.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-lg border p-3">
                  <Webhook className="mt-0.5 h-4 w-4 text-cyan-500" />
                  <p className="text-sm text-muted-foreground">{item}</p>
                </div>
              ))}

              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                The clean onboarding model is:
                <span className="ml-1 font-medium text-foreground">
                  merchant approval {"->"} API {"&"} Webhooks {"->"} collection flow {"->"} settlement flow.
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Where to Get Values and Where to Place Them</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {integrationValues.map((item) => (
                <div key={item.name} className="rounded-lg border p-4">
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Where to get it:</span> {item.whereToGetIt}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Where to place it:</span> {item.whereToPlaceIt}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Token Strategy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tokenNotes.map((item) => (
                <div key={item.token} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-semibold">{item.token}</p>
                    <Badge variant={item.token === "CT" ? "default" : "secondary"}>
                      {item.token === "CT" ? "Live for Kaalis" : "Future-ready"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Use the Right Workspace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {supportStates.map((item) => (
                <div key={item.href} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{item.label}</p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={item.href}>Open</Link>
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Merchant Basics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <KeyRound className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <p>
                  Your API key is for backend-to-backend trust. Rotate it only when your connected
                  systems are ready for the new credential.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <p>
                  Webhooks should be verified and handled idempotently. A delivered callback should
                  not be treated as proof that your downstream order logic already succeeded.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Wallet className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <p>
                  Settlement is token-based. Token choice affects treasury behavior, support
                  language, and off-ramp practicality, not just UI labels.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Developer Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="default" className="w-full justify-between">
                <a href="/AfriExchange_API.postman_collection.json" download>
                  Download Postman Collection
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download h-4 w-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/merchant/sandbox">
                  Open Integration Sandbox
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/merchant/api-webhooks">
                  Review API & Webhooks
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/merchant/settings">
                  Review Merchant Settings
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/merchant/sell-through-agent">
                  Review Sell Through Agent
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error Catalog */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Error Catalog &amp; Remediation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Common errors you may encounter when integrating with AfriExchange, with their root
            causes and the fastest path to resolution.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {errorCatalog.map((entry) => (
              <div
                key={entry.title}
                className={`rounded-lg border p-4 ${severityStyle[entry.severity]}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-sm">{entry.title}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      severityBadge[entry.severity]
                    }`}
                  >
                    {entry.code}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">When it happens: </span>
                  {entry.trigger}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Fix: </span>
                  {entry.fix}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            API Rate Limits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            All merchant-authenticated routes are rate-limited. Implement exponential backoff when
            you receive a{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">429</code> response. Do not
            poll read endpoints on every user request — cache profile and dashboard data locally.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {rateLimits.map((item) => (
              <div key={item.category} className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium text-sm">{item.category}</p>
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{item.limit}</p>
                <p className="mt-2 text-xs text-muted-foreground font-mono break-all">{item.routes}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            Rate limit headers are included in every response:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">RateLimit-Limit</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">RateLimit-Remaining</code>, and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">RateLimit-Reset</code>. Read
            these headers to implement smart throttling in your integration.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
