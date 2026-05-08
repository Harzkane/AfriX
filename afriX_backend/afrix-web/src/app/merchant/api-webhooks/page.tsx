"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Activity, BookOpen, CheckCircle2, Copy, Eye, KeyRound, RefreshCcw, ShieldCheck, Webhook, XCircle } from "lucide-react";
import { toast } from "sonner";

import merchantApi from "@/lib/merchant-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

type DeliveryLogEntry = {
  attempted_at: string;
  event: string;
  reference: string;
  status: "delivered" | "failed" | string;
  http_status: number | null;
  error: string;
  webhook_url: string;
  payload?: any;
};

const tokenOptions = ["CT", "NT", "USDT"];
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

export default function MerchantApiWebhooksPage() {
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
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [deliveryLog, setDeliveryLog] = useState<DeliveryLogEntry[]>([]);
  const [selectedLogEntry, setSelectedLogEntry] = useState<DeliveryLogEntry | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await merchantApi.get("/merchants/profile");
        setProfile((current) => ({ ...current, ...response.data.data }));
      } catch (error) {
        console.error("Failed to load merchant integration profile:", error);
        toast.error("Failed to load merchant integration settings");
      }
      try {
        const logRes = await merchantApi.get("/merchants/webhook-delivery-log");
        setDeliveryLog(logRes.data.data?.log ?? []);
      } catch {
        // Non-fatal — log section stays empty
      }
    };

    load();
  }, []);

  const verificationVariant = useMemo(
    () => (profile.verification_status === "approved" ? "default" : "secondary"),
    [profile.verification_status]
  );

  const integrationStatus = useMemo(() => {
    const hasWebhook = Boolean(profile.webhook_url?.trim());
    const hasWallet = Boolean(profile.settlement_wallet_id);
    const approved = profile.verification_status === "approved";

    if (approved && hasWebhook && hasWallet) {
      return {
        label: "Ready",
        description: "Merchant identity, settlement wallet, and webhook destination are all in place.",
      };
    }

    if (approved || hasWebhook || hasWallet) {
      return {
        label: "Needs attention",
        description: "Some integration pieces are set, but the full operating picture is still incomplete.",
      };
    }

    return {
      label: "Setup incomplete",
      description: "Finish merchant approval, settlement, and webhook setup before relying on live callbacks.",
    };
  }, [profile]);

  const checklist = useMemo(
    () => [
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

  const saveIntegrationSettings = async () => {
    setIsSaving(true);
    try {
      await merchantApi.put("/merchants/profile", {
        default_token_type: profile.default_token_type,
        webhook_url: profile.webhook_url,
      });
      toast.success("Merchant API and webhook settings updated");
    } catch (error) {
      console.error("Failed to update merchant integration settings:", error);
      toast.error("Failed to update merchant API and webhook settings");
    } finally {
      setIsSaving(false);
    }
  };

  const regenerateApiKey = async () => {
    setIsRegenerating(true);
    try {
      const response = await merchantApi.post("/merchants/regenerate-api-key");
      setApiKey(response.data.data?.api_key || "");
      setShowRegenerateDialog(false);
      toast.success("Merchant API key regenerated");
    } catch (error) {
      console.error("Failed to regenerate merchant API key:", error);
      toast.error("Failed to regenerate merchant API key");
    } finally {
      setIsRegenerating(false);
    }
  };

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
                <Webhook className="h-3.5 w-3.5" />
                API & Webhooks
              </Badge>
              <Badge variant={verificationVariant}>{profile.verification_status || "unknown"}</Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Merchant API & Webhooks</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Keep your merchant integration values visible, stable, and easy to operate. This is
              the merchant-side mirror of the Kaalis AfriExchange integration settings.
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            {profile.updated_at
              ? `Last updated ${format(new Date(profile.updated_at), "MMM d, yyyy • h:mm a")}`
              : "Integration workspace ready"}
          </div>
        </div>

        <div className="border-t bg-muted/20 px-6 py-3">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/merchant/docs">
              <BookOpen className="h-4 w-4" />
              Open Docs
            </Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Integration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{integrationStatus.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{integrationStatus.description}</p>
          </CardContent>
        </Card>

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
                onClick={() =>
                  copyValue(profile.settlement_wallet_id || "", "Settlement wallet ID")
                }
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
            <p className="mt-1 text-sm text-muted-foreground">
              Current settlement preference for merchant collection flows.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Merchant Webhook</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold">
              {profile.integration_health?.last_webhook_attempt_at
                ? format(new Date(profile.integration_health.last_webhook_attempt_at), "MMM d, yyyy • h:mm a")
                : "No webhook attempt recorded yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {profile.integration_health?.last_webhook_event || "No merchant event recorded yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connection Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="merchant_name">Merchant</Label>
                  <Input
                    id="merchant_name"
                    value={profile.display_name || profile.business_name || ""}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_base_url">API Base URL</Label>
                  <Input id="api_base_url" value={apiBaseUrl} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_token_type">Default Token</Label>
                <Select
                  value={profile.default_token_type || "CT"}
                  onValueChange={(value) =>
                    setProfile((current) => ({ ...current, default_token_type: value }))
                  }
                >
                  <SelectTrigger id="default_token_type">
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent>
                    {tokenOptions.map((token) => (
                      <SelectItem key={token} value={token}>
                        {token}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_url">Webhook URL</Label>
                <Input
                  id="webhook_url"
                  placeholder="https://your-domain.com/webhooks/afrix"
                  value={profile.webhook_url || ""}
                  onChange={(e) =>
                    setProfile((current) => ({ ...current, webhook_url: e.target.value }))
                  }
                />
              </div>

              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                Keep your webhook endpoint stable, verify incoming requests before applying business
                logic, and rotate API credentials deliberately.
              </div>

              <Button onClick={saveIntegrationSettings} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save API & Webhook Settings"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Treat this page as the merchant-side home for the same integration story Kaalis now
                shows in Platform Settings.
              </p>
              <ul className="space-y-2">
                <li>Collection callbacks should be verified before updating order or ledger state.</li>
                <li>Use a stable webhook URL and idempotent event handling for retries.</li>
                <li>Default token choice should match the merchant treasury and settlement plan.</li>
                <li>Rotate API keys only when connected systems are ready for the new credential.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {checklist.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <span className="text-sm">{item.label}</span>
                  <Badge variant={item.done ? "default" : "secondary"}>
                    {item.done ? "Ready" : "Pending"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>API Key</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Regenerate only when you are ready to rotate credentials in connected systems.
                </p>
              </div>
              <KeyRound className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setShowRegenerateDialog(true)}
              >
                <RefreshCcw className="h-4 w-4" />
                Regenerate API Key
              </Button>

              {apiKey ? (
                <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    Copy and store this key now. Treat it like a secret.
                  </p>
                  <div className="break-all rounded-md border bg-background p-3 font-mono text-sm">
                    {apiKey}
                  </div>
                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={() => copyValue(apiKey, "API key")}
                  >
                    <Copy className="h-4 w-4" />
                    Copy API Key
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No key is shown by default. Regenerate to reveal a fresh merchant API key.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Merchant Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Verification</span>
                <Badge variant={verificationVariant}>{profile.verification_status || "unknown"}</Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Merchant Fee</span>
                <span>{profile.payment_fee_percent || "0"}%</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Created</span>
                <span>
                  {profile.created_at ? format(new Date(profile.created_at), "MMM d, yyyy") : "N/A"}
                </span>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="font-medium">Webhook delivery health</p>
                <p className="mt-1 text-muted-foreground">
                  Status: {profile.integration_health?.last_webhook_status || "No delivery status yet"}
                </p>
                <p className="mt-1 break-all text-xs text-muted-foreground">
                  Reference: {profile.integration_health?.last_webhook_reference || "Not available yet"}
                </p>
                {profile.integration_health?.last_webhook_http_status ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    HTTP status: {profile.integration_health.last_webhook_http_status}
                  </p>
                ) : null}
                {profile.integration_health?.last_webhook_error ? (
                  <p className="mt-1 text-xs text-rose-500">
                    Last error: {profile.integration_health.last_webhook_error}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Webhook Delivery Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Webhook Delivery Log
            {deliveryLog.length > 0 && (
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                {deliveryLog.length} attempt{deliveryLog.length !== 1 ? "s" : ""}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deliveryLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
              <Webhook className="h-8 w-8 opacity-30" />
              <p>No webhook deliveries recorded yet.</p>
              <p className="text-xs">
                Fire a test from the{" "}
                <Link href="/merchant/sandbox" className="underline underline-offset-2">
                  Integration Sandbox
                </Link>{" "}
                to see entries appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Event</th>
                    <th className="pb-2 pr-4 font-medium">HTTP</th>
                    <th className="pb-2 pr-4 font-medium">Destination</th>
                    <th className="pb-2 pr-4 font-medium">Time</th>
                    <th className="pb-2 pr-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {deliveryLog.map((entry, i) => (
                    <tr key={`${entry.attempted_at}-${i}`} className="align-top">
                      <td className="py-2 pr-4">
                        {entry.status === "delivered" ? (
                          <span className="flex items-center gap-1 text-emerald-500">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Delivered
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-destructive">
                            <XCircle className="h-3.5 w-3.5" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        <code className="rounded bg-muted px-1 py-0.5">{entry.event || "—"}</code>
                      </td>
                      <td className="py-2 pr-4">
                        {entry.http_status ? (
                          <span className={entry.http_status >= 200 && entry.http_status < 300 ? "text-emerald-500" : "text-destructive"}>
                            {entry.http_status}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="max-w-[200px] truncate py-2 pr-4 font-mono text-muted-foreground">
                        {entry.webhook_url || "—"}
                      </td>
                      <td className="whitespace-nowrap py-2 pr-4 text-muted-foreground">
                        {entry.attempted_at ? format(new Date(entry.attempted_at), "MMM d • h:mm:ss a") : "—"}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setSelectedLogEntry(entry)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="sr-only">View Payload</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate merchant API key?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces the current key used by your integrations. Make sure you are ready to
              update connected systems immediately after regeneration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRegenerating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isRegenerating}
              onClick={(e) => {
                e.preventDefault();
                regenerateApiKey();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRegenerating ? "Regenerating..." : "Regenerate Key"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!selectedLogEntry} onOpenChange={(open) => !open && setSelectedLogEntry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Webhook Delivery Details</DialogTitle>
            <DialogDescription>
              Attempted on {selectedLogEntry?.attempted_at ? format(new Date(selectedLogEntry.attempted_at), "PPPP 'at' p") : "Unknown time"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground font-medium">Event Type</p>
                <code className="rounded bg-muted px-1 py-0.5">{selectedLogEntry?.event || "—"}</code>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-medium">HTTP Status</p>
                <p className={selectedLogEntry?.http_status && selectedLogEntry.http_status >= 200 && selectedLogEntry.http_status < 300 ? "text-emerald-500" : "text-destructive"}>
                  {selectedLogEntry?.http_status || "No response"}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Payload Sent</p>
              <pre className="max-h-[300px] overflow-auto rounded-lg border bg-muted/30 p-4 font-mono text-xs">
                {selectedLogEntry?.payload 
                  ? JSON.stringify(selectedLogEntry.payload, null, 2)
                  : "No payload recorded for this attempt."}
              </pre>
            </div>

            {selectedLogEntry?.error && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-rose-500">Error Trace</p>
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 font-mono text-xs text-rose-700 dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-rose-400">
                  {selectedLogEntry.error}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
