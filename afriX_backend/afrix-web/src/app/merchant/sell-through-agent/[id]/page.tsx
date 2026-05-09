"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRightLeft,
  Banknote,
  ChevronDown,
  ExternalLink,
  Loader2,
  ShieldCheck,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type BurnRequest = {
  id: string;
  agent_id: string;
  amount: string | number;
  token_type: string;
  status: string;
  created_at: string;
  expires_at?: string;
  escrow_id?: string;
  fiat_proof_url?: string;
  bank_account?: Record<string, unknown>;
  latest_dispute?: {
    id?: string;
    status?: string;
    reason?: string;
    details?: string;
    created_at?: string;
  } | null;
  agent?: {
    id: string;
    tier?: string;
    rating?: number;
    phone_number?: string | null;
    user?: {
      full_name?: string;
      email?: string;
    };
  };
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
    case "confirmed":
      return "default";
    case "escrowed":
    case "pending":
    case "fiat_sent":
      return "secondary";
    case "rejected":
    case "expired":
    case "disputed":
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

function getStatusLabel(status?: string) {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "Request Created";
    case "escrowed":
      return "Tokens Locked in Escrow";
    case "fiat_sent":
      return "Agent Marked Fiat Sent";
    case "confirmed":
      return "Completed";
    case "disputed":
      return "Under Dispute";
    case "rejected":
      return "Rejected";
    case "expired":
      return "Expired";
    case "cancelled":
      return "Cancelled";
    default:
      return status || "Unknown";
  }
}

function getStatusDescription(status?: string) {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "The request is still being prepared before escrow is fully active.";
    case "escrowed":
      return "Your tokens are locked while the selected agent prepares fiat settlement.";
    case "fiat_sent":
      return "The agent says fiat has been sent. Verify receipt before confirming.";
    case "confirmed":
      return "You confirmed receipt and the escrow has been finalized.";
    case "disputed":
      return "This request is under review and should no longer be confirmed from your side.";
    case "rejected":
      return "This request was rejected and should not continue in the current flow.";
    case "expired":
      return "This request timed out before completion.";
    case "cancelled":
      return "This request was cancelled before completion.";
    default:
      return "Review the request details to understand its current state.";
  }
}

function formatTimestamp(value?: string) {
  if (!value) return "N/A";
  try {
    return format(new Date(value), "MMM d, yyyy • h:mm a");
  } catch {
    return "N/A";
  }
}

function canResolveFiatRequest(request?: BurnRequest | null) {
  return (request?.status || "").toLowerCase() === "fiat_sent";
}

export default function MerchantSellRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<BurnRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDetails, setDisputeDetails] = useState("");
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const id = params?.id as string;

  const loadRequest = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await merchantApi.get(`/requests/burn/${id}`);
      setRequest(response.data.data || null);
    } catch (error: any) {
      console.error("Failed to load merchant sell request:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to load sell request details"
      );
      setRequest(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequest();
  }, [id]);

  const handleConfirmReceipt = async () => {
    if (!request) return;
    try {
      await merchantApi.post("/requests/burn/confirm", {
        request_id: request.id,
      });
      toast.success("Receipt confirmed and escrow finalized");
      await loadRequest();
    } catch (error: any) {
      console.error("Failed to confirm burn receipt:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to confirm receipt"
      );
    }
  };

  const handleSubmitDispute = async () => {
    if (!request?.escrow_id) {
      toast.error("This request cannot be disputed because no escrow record was found");
      return;
    }

    if (!disputeReason.trim()) {
      toast.error("Please provide a dispute reason");
      return;
    }

    setIsSubmittingDispute(true);
    try {
      await merchantApi.post("/disputes", {
        escrowId: request.escrow_id,
        agentId: request.agent_id,
        reason: disputeReason.trim(),
        details: disputeDetails.trim() || undefined,
      });
      toast.success("Dispute opened successfully");
      setShowDisputeDialog(false);
      setDisputeReason("");
      setDisputeDetails("");
      await loadRequest();
    } catch (error: any) {
      console.error("Failed to open dispute:", error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to open dispute";

      if (message === "A dispute is already open for this request") {
        setShowDisputeDialog(false);
        await loadRequest();
      }

      toast.error(message);
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/merchant/sell-through-agent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sell Through Agent
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Sell request not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/merchant/sell-through-agent">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sell Through Agent
        </Link>
      </Button>

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Sell Request
              </Badge>
              <Badge variant={statusTone(request.status)}>{getStatusLabel(request.status)}</Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {formatAmount(request.amount)} {request.token_type}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {getStatusDescription(request.status)}
            </p>
            <div className="inline-flex max-w-full flex-col rounded-md border border-amber-300/60 bg-amber-50 px-3 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-100">
              <span className="flex items-center gap-2 font-medium">
                <ChevronDown className="h-4 w-4 animate-bounce" />
                More content below
              </span>
              <span className="mt-1 text-xs text-amber-900/80 dark:text-amber-100/80">
                Scroll down for payout proof, settlement details, and final confirmation actions.
              </span>
            </div>
            <p className="font-mono text-xs text-muted-foreground break-all">{request.id}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="min-w-[150px]">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p>
                <p className="mt-2 text-sm font-semibold">{formatTimestamp(request.created_at)}</p>
              </CardContent>
            </Card>
            <Card className="min-w-[150px]">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Expires</p>
                <p className="mt-2 text-sm font-semibold">{formatTimestamp(request.expires_at)}</p>
              </CardContent>
            </Card>
            <Card className="min-w-[150px]">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Agent</p>
                <p className="mt-2 text-sm font-semibold">
                  {request.agent?.user?.full_name || "Agent"}
                </p>
              </CardContent>
            </Card>
            <Card className="min-w-[150px]">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Escrow</p>
                <p className="mt-2 text-sm font-semibold">
                  {request.escrow_id ? "Linked" : "Not linked"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {canResolveFiatRequest(request) ? (
        <Card className="border-amber-400/40 bg-amber-50/60 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle>Merchant Confirmation Required</CardTitle>
            <CardDescription>
              The agent says fiat has been sent. Review the proof below and only confirm after the
              fiat amount has actually landed in your account or mobile wallet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => setShowDisputeDialog(true)}>
              I Didn&apos;t Receive It
            </Button>
            <Button onClick={handleConfirmReceipt}>Yes, I Received It</Button>
            <p className="text-sm text-muted-foreground">
              Confirming here finalizes the escrow and completes the token burn.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {request.latest_dispute ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Dispute on File</CardTitle>
            <CardDescription>
              This payout has already been escalated for support review.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="mt-1 font-medium">{request.latest_dispute.status || "Open"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Opened</p>
              <p className="mt-1 font-medium">
                {formatTimestamp(request.latest_dispute.created_at)}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">Reason</p>
              <p className="mt-1 font-medium">
                {request.latest_dispute.reason || "A payout dispute has been opened."}
              </p>
            </div>
            {request.latest_dispute.details ? (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Details submitted</p>
                <p className="mt-1 text-sm">{request.latest_dispute.details}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Settlement Details</CardTitle>
            <CardDescription>
              Review the payout destination and the agent proof before taking any final action.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Payout destination</p>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs">
                {JSON.stringify(request.bank_account || {}, null, 2)}
              </pre>
            </div>

            {request.fiat_proof_url ? (
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Agent payment proof</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button variant="outline" size="sm" asChild>
                    <a href={request.fiat_proof_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open proof image
                    </a>
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Confirm receipt only if the fiat amount actually landed.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                The agent has not uploaded fiat payment proof yet.
              </div>
            )}

            {canResolveFiatRequest(request) ? (
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => setShowDisputeDialog(true)}>
                  I Didn&apos;t Receive It
                </Button>
                <Button onClick={handleConfirmReceipt}>Yes, I Received It</Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent</CardTitle>
              <CardDescription>Who is handling this fiat settlement.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{request.agent?.user?.full_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">
                  {request.agent?.user?.email || "Agent contact email is not available on this request"}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Tier</p>
                  <p className="font-medium">{request.agent?.tier || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="font-medium">
                    {typeof request.agent?.rating === "number"
                      ? request.agent.rating.toFixed(1)
                      : "N/A"}
                  </p>
                </div>
              </div>
              {request.agent?.phone_number ? (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{request.agent.phone_number}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How This Status Works</CardTitle>
              <CardDescription>What should happen next from the merchant side.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="font-medium">1. Escrowed</p>
                <p className="mt-1 text-muted-foreground">
                  Tokens are locked while the agent prepares fiat settlement.
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="font-medium">2. Fiat Sent</p>
                <p className="mt-1 text-muted-foreground">
                  Review the proof and your payout destination before confirming receipt.
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="font-medium">3. Confirmed or Disputed</p>
                <p className="mt-1 text-muted-foreground">
                  Confirm only when fiat has landed. Open a dispute when payment did not arrive.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Open Dispute</DialogTitle>
            <DialogDescription>
              Tell support what went wrong with this payout so they can investigate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dispute_reason">Reason</Label>
              <Textarea
                id="dispute_reason"
                value={disputeReason}
                onChange={(event) => setDisputeReason(event.target.value)}
                placeholder="For example: I have not received the fiat payment in my account."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispute_details">Additional Details</Label>
              <Textarea
                id="dispute_details"
                value={disputeDetails}
                onChange={(event) => setDisputeDetails(event.target.value)}
                placeholder="Add any timing, payout, or account details that will help support review the case."
                rows={4}
              />
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDisputeDialog(false)}
                disabled={isSubmittingDispute}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitDispute} disabled={isSubmittingDispute}>
                {isSubmittingDispute ? "Submitting..." : "Submit Dispute"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
