"use client";

import { useState } from "react";
import {
  FlaskConical,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Check,
  Webhook,
  ShieldCheck,
  Info,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import merchantApi from "@/lib/merchant-api";

type DeliveryResult = {
  delivered: boolean;
  httpStatus: number | null;
  error?: string;
  responseBody?: string | null;
  webhookUrl: string;
  timestamp: string;
  signature: string;
  payloadSent: object;
  verificationSnippet: { node: string };
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 gap-1.5 text-xs"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-muted/50">
      {label && (
        <div className="flex items-center justify-between border-b bg-muted/70 px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <CopyButton text={code} />
        </div>
      )}
      <pre className="overflow-x-auto max-w-full p-4 text-xs leading-relaxed text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function SandboxPage() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DeliveryResult | null>(null);
  const [error, setError] = useState("");

  const handleTest = async () => {
    setIsLoading(true);
    setResult(null);
    setError("");
    try {
      const res = await merchantApi.post("/merchants/sandbox/ping-webhook", {
        webhook_url: webhookUrl || undefined,
      });
      setResult(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || "Request failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <FlaskConical className="h-3.5 w-3.5" />
                Sandbox
              </Badge>
              <Badge variant="secondary">Test Environment</Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Integration Sandbox</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Fire real test webhooks to your endpoint, inspect the full signed payload, and verify
              your HMAC signature handler — before going live.
            </p>
          </div>
          <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0" />
              <span>Sandbox events are real HTTP requests but carry no financial effect.</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr] [&>*]:min-w-0">
        {/* Left: Test Trigger */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-4 w-4" />
                Test Webhook Delivery
              </CardTitle>
              <CardDescription>
                Sends a signed <code className="rounded bg-muted px-1 py-0.5 text-xs">sandbox.ping</code>{" "}
                event to your endpoint using your real HMAC secret. Leave the URL blank to use your
                configured webhook URL.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL (optional override)</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://yoursite.com/webhooks/afriexchange"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to use the URL saved in your API &amp; Webhooks settings.
                </p>
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleTest}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isLoading ? "Sending…" : "Send Test Webhook"}
              </Button>

              {error && (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Result card */}
          {result && (
            <Card className={result.delivered ? "border-emerald-500/40" : "border-destructive/40"}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {result.delivered ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  {result.delivered ? "Delivered Successfully" : "Delivery Failed"}
                  {result.httpStatus && (
                    <Badge
                      variant={result.delivered ? "outline" : "destructive"}
                      className="ml-auto text-xs"
                    >
                      HTTP {result.httpStatus}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border p-3">
                    <p className="font-medium text-muted-foreground">Sent to</p>
                    <p className="mt-1 truncate font-mono">{result.webhookUrl}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="font-medium text-muted-foreground">Timestamp</p>
                    <p className="mt-1 font-mono">{new Date(result.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>

                {result.error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                    <span className="font-medium">Error:</span> {result.error}
                  </div>
                )}

                {result.responseBody && (
                  <CodeBlock code={result.responseBody} label="Your endpoint responded with" />
                )}

                <CodeBlock
                  code={result.signature}
                  label="x-afriexchange-signature header sent"
                />

                <CodeBlock
                  code={JSON.stringify(result.payloadSent, null, 2)}
                  label="Full payload sent"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: How to verify */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                How to Simulate a Webhook
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                If you haven't built your backend endpoint yet, you can still see exactly how our
                webhooks behave using a free testing tool.
              </p>
              <ol className="ml-4 list-decimal space-y-2">
                <li>
                  Go to a service like{" "}
                  <a
                    href="https://webhook.site/"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    Webhook.site
                  </a>{" "}
                  or{" "}
                  <a
                    href="https://requestbin.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    RequestBin
                  </a>
                  .
                </li>
                <li>Copy the unique temporary URL they provide.</li>
                <li>Paste it into the <strong>Webhook URL</strong> field on the left.</li>
                <li>Click <strong>Send Test Webhook</strong>.</li>
                <li>
                  Watch the request hit your temporary URL in real time. You will be able to inspect
                  the <code className="text-xs">x-afriexchange-signature</code> header and the JSON body.
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                How to Verify the Signature
              </CardTitle>
              <CardDescription>
                Every webhook AfriExchange sends is HMAC-SHA256 signed. Verify it server-side
                before trusting the payload.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock
                label="Node.js / Express"
                code={`const crypto = require('crypto');

app.post('/webhooks/afriexchange', express.json(), (req, res) => {
  const secret    = process.env.AFRIX_WEBHOOK_SECRET;
  const signature = req.headers['x-afriexchange-signature'];
  const timestamp = req.headers['x-afriexchange-timestamp'];

  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(\`\${timestamp}.\${JSON.stringify(req.body)}\`)
    .digest('hex');

  if (signature !== expected) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { event, eventId, data } = req.body;

  if (event === 'collection.completed') {
    // fulfil order, update ledger, etc.
  }

  res.status(200).json({ received: true });
});`}
              />

              <CodeBlock
                label="Python / Flask"
                code={`import hmac, hashlib, json, os
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhooks/afriexchange', methods=['POST'])
def webhook():
    secret    = os.environ['AFRIX_WEBHOOK_SECRET'].encode()
    signature = request.headers.get('x-afriexchange-signature', '')
    timestamp = request.headers.get('x-afriexchange-timestamp', '')
    body      = request.get_data(as_text=True)

    expected = 'sha256=' + hmac.new(
        secret,
        f'{timestamp}.{body}'.encode(),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature, expected):
        return jsonify(error='Invalid signature'), 401

    payload = request.get_json()
    event   = payload.get('event')

    if event == 'collection.completed':
        pass  # fulfil order, update ledger, etc.

    return jsonify(received=True), 200`}
              />

              <CodeBlock
                label="PHP"
                code={`<?php
$secret    = getenv('AFRIX_WEBHOOK_SECRET');
$signature = $_SERVER['HTTP_X_AFRIEXCHANGE_SIGNATURE'] ?? '';
$timestamp = $_SERVER['HTTP_X_AFRIEXCHANGE_TIMESTAMP'] ?? '';
$body      = file_get_contents('php://input');

$expected  = 'sha256=' . hash_hmac('sha256', "{$timestamp}.{$body}", $secret);

if (!hash_equals($expected, $signature)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

$payload = json_decode($body, true);

if ($payload['event'] === 'collection.completed') {
    // fulfil order, update ledger, etc.
}

http_response_code(200);
echo json_encode(['received' => true]);`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Webhook Events Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  event: "payment.pending",
                  description: "Fired when a merchant creates a payment request and it is waiting for the customer to pay.",
                  badge: "Live",
                },
                {
                  event: "collection.completed",
                  description: "Fired when a customer successfully pays a payment request and the merchant's wallet is credited.",
                  badge: "Live",
                },
                {
                  event: "sandbox.ping",
                  description: "Only fired from the Sandbox tester. Safe to ignore in production logic.",
                  badge: "Sandbox",
                },
              ].map((item) => (
                <div key={item.event} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-medium">{item.event}</code>
                    <Badge
                      variant={item.badge === "Live" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {item.badge}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
