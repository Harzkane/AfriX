"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ArrowRightLeft,
  Banknote,
  Clock3,
  Search,
  ShieldCheck,
  Smartphone,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import merchantApi from "@/lib/merchant-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type MerchantProfile = {
  country?: string;
  default_token_type?: string;
};

type Agent = {
  id: string;
  country?: string;
  city?: string | null;
  currency?: string;
  tier?: string;
  rating?: number;
  is_verified?: boolean;
  is_online?: boolean;
  available_capacity?: number;
  response_time_minutes?: number;
  commission_rate?: number;
  bank_name?: string | null;
  account_name?: string | null;
  mobile_money_provider?: string | null;
  mobile_money_number?: string | null;
  user?: {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string | null;
  };
};

type BurnRequest = {
  id: string;
  type?: string;
  agent_id: string;
  amount: string | number;
  token_type: string;
  status: string;
  created_at: string;
  expires_at?: string;
  escrow_id?: string;
  bank_account?: Record<string, unknown>;
  fiat_proof_url?: string;
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
    user?: {
      full_name?: string;
      email?: string;
    };
  };
};

type PaymentMethod = "bank" | "mobile_money";

const tokenOptions = ["NT", "CT"];

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
    default:
      return status || "Unknown";
  }
}

function getStatusDescription(status?: string) {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "The request is being prepared before escrow is fully active.";
    case "escrowed":
      return "Your tokens are locked while the selected agent prepares fiat settlement.";
    case "fiat_sent":
      return "The agent says fiat has been sent. Verify receipt before confirming.";
    case "confirmed":
      return "You confirmed receipt and the escrow has been finalized.";
    case "disputed":
      return "This request needs support attention before it can be resolved.";
    case "rejected":
      return "The request was rejected and should not proceed further.";
    case "expired":
      return "The request timed out before completion.";
    default:
      return "Review the request details to understand its current state.";
  }
}

function canResolveFiatRequest(request?: BurnRequest | null) {
  return (request?.status || "").toLowerCase() === "fiat_sent";
}

function formatDisputeTimestamp(value?: string) {
  if (!value) return "N/A";
  try {
    return format(new Date(value), "MMM d, yyyy • h:mm a");
  } catch {
    return "N/A";
  }
}

export default function MerchantSellThroughAgentPage() {
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [requests, setRequests] = useState<BurnRequest[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [search, setSearch] = useState("");
  const [tokenType, setTokenType] = useState("CT");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank");
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [mobileProvider, setMobileProvider] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BurnRequest | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDetails, setDisputeDetails] = useState("");
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  const loadPage = async () => {
    try {
      const [profileRes, requestsRes] = await Promise.all([
        merchantApi.get("/merchants/profile"),
        merchantApi.get("/requests/user"),
      ]);

      const nextProfile = profileRes.data.data || null;
      setProfile(nextProfile);

      const burnRequests = (requestsRes.data.data || []).filter(
        (request: BurnRequest) => request.type === "burn" || request.bank_account
      );
      setRequests(burnRequests);

      const country = nextProfile?.country;
      if (country) {
        const agentRes = await merchantApi.get(`/users/find-agents?country=${country}&limit=20`);
        setAgents(agentRes.data.data || []);
      } else {
        setAgents([]);
      }
    } catch (error: any) {
      console.error("Failed to load sell-through-agent workspace:", error);
      if (error?.response?.status !== 404) {
        toast.error("Failed to load agent liquidity workspace");
      }
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const haystack = [
        agent.user?.full_name,
        agent.user?.email,
        agent.city,
        agent.country,
        agent.bank_name,
        agent.mobile_money_provider,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !search || haystack.includes(search.toLowerCase());
    });
  }, [agents, search]);

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) || null,
    [agents, selectedAgentId]
  );

  const activeRequests = useMemo(
    () =>
      requests.filter((request) =>
        ["pending", "escrowed", "fiat_sent"].includes((request.status || "").toLowerCase())
      ),
    [requests]
  );

  const escrowedTokenAmount = useMemo(() => {
    return activeRequests
      .filter((request) => ["escrowed", "fiat_sent"].includes((request.status || "").toLowerCase()))
      .reduce((sum, request) => sum + Number(request.amount || 0), 0);
  }, [activeRequests]);

  const returnedOrStoppedRequests = useMemo(
    () =>
      requests.filter((request) =>
        ["rejected", "expired", "cancelled"].includes((request.status || "").toLowerCase())
      ),
    [requests]
  );

  const returnedOrStoppedTokenAmount = useMemo(() => {
    return returnedOrStoppedRequests.reduce(
      (sum, request) => sum + Number(request.amount || 0),
      0
    );
  }, [returnedOrStoppedRequests]);

  const handleCreateRequest = async () => {
    if (!selectedAgentId || !amount || Number(amount) <= 0) {
      toast.error("Choose an agent and enter a valid amount");
      return;
    }

    const bank_account =
      paymentMethod === "bank"
        ? {
            type: "bank",
            bank_name: bankName,
            account_number: accountNumber,
            account_name: accountName,
          }
        : {
            type: "mobile_money",
            provider: mobileProvider,
            phone_number: mobileNumber,
            account_name: accountName,
          };

    if (
      !accountName ||
      (paymentMethod === "bank" && (!bankName || !accountNumber)) ||
      (paymentMethod === "mobile_money" && (!mobileProvider || !mobileNumber))
    ) {
      toast.error("Complete the payout details before creating the request");
      return;
    }

    setIsSubmitting(true);
    try {
      await merchantApi.post("/requests/burn", {
        agent_id: selectedAgentId,
        amount,
        token_type: tokenType,
        bank_account,
      });

      toast.success("Sell request created");
      setAmount("");
      setSelectedAgentId("");
      setPaymentMethod("bank");
      setAccountName("");
      setBankName("");
      setAccountNumber("");
      setMobileProvider("");
      setMobileNumber("");
      await loadPage();
    } catch (error: any) {
      console.error("Failed to create burn request:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to create sell request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReceipt = async (requestId: string) => {
    try {
      await merchantApi.post("/requests/burn/confirm", {
        request_id: requestId,
      });
      toast.success("Receipt confirmed and escrow finalized");
      setSelectedRequest(null);
      await loadPage();
    } catch (error: any) {
      console.error("Failed to confirm burn receipt:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to confirm receipt"
      );
    }
  };

  const handleOpenDispute = () => {
    setDisputeReason("");
    setDisputeDetails("");
    setShowDisputeDialog(true);
  };

  const handleOpenRequestDetails = async (request: BurnRequest) => {
    try {
      const response = await merchantApi.get(`/requests/burn/${request.id}`);
      setSelectedRequest(response.data.data || request);
    } catch (error) {
      console.error("Failed to load latest burn request details:", error);
      setSelectedRequest(request);
      toast.error("Showing the saved request snapshot because the latest details could not be loaded");
    }
  };

  const handleSubmitDispute = async () => {
    if (!selectedRequest?.escrow_id) {
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
        escrowId: selectedRequest.escrow_id,
        agentId: selectedRequest.agent_id,
        reason: disputeReason.trim(),
        details: disputeDetails.trim() || undefined,
      });
      toast.success("Dispute opened successfully");
      setShowDisputeDialog(false);
      setSelectedRequest(null);
      await loadPage();
    } catch (error: any) {
      console.error("Failed to open dispute:", error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to open dispute";

      if (message === "A dispute is already open for this request") {
        setShowDisputeDialog(false);
        setSelectedRequest(null);
        await loadPage();
        toast.error("A dispute is already open for this request");
        return;
      }

      toast.error(message);
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const payoutSummary =
    paymentMethod === "bank"
      ? {
          typeLabel: "Bank transfer",
          line1: bankName || "No bank selected",
          line2: accountNumber || "No account number",
          line3: accountName || "No account name",
        }
      : {
          typeLabel: "Mobile money",
          line1: mobileProvider || "No provider selected",
          line2: mobileNumber || "No mobile number",
          line3: accountName || "No account name",
        };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Sell Through Agent
              </Badge>
              {profile?.country ? <Badge variant="secondary">{profile.country}</Badge> : null}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Sell Through Agent</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Turn merchant token balances into local settlement through verified agents in your
              operating region.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="min-w-[150px]">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Available Agents</p>
                <p className="mt-2 text-2xl font-semibold">{filteredAgents.length}</p>
              </CardContent>
            </Card>
            <Card className="min-w-[150px]">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Requests</p>
                <p className="mt-2 text-2xl font-semibold">{activeRequests.length}</p>
              </CardContent>
            </Card>
            <Card className="min-w-[150px]">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Tokens in Escrow</p>
                <p className="mt-2 text-2xl font-semibold">{formatAmount(escrowedTokenAmount)}</p>
              </CardContent>
            </Card>
            <Card className="min-w-[150px]">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Returned / Stopped
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatAmount(returnedOrStoppedTokenAmount)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {returnedOrStoppedRequests.length} requests rejected, expired, or cancelled
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create Sell Request</CardTitle>
            <CardDescription>
              Choose an agent, decide how you want fiat delivered, and create a burn request that
              locks tokens in escrow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Token</Label>
                <Select value={tokenType} onValueChange={setTokenType}>
                  <SelectTrigger>
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
                <Label>Amount</Label>
                <Input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Enter token amount"
                  type="number"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Agent</Label>
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an agent" />
                </SelectTrigger>
                <SelectContent>
                  {filteredAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.user?.full_name || "Agent"} • {agent.country || "N/A"} • {agent.tier || "starter"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAgent ? (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{selectedAgent.user?.full_name || "Agent"}</span>
                  <Badge variant="outline">{selectedAgent.tier || "starter"}</Badge>
                  {selectedAgent.is_verified ? <Badge>Verified</Badge> : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" />
                    {(selectedAgent.rating ?? 0).toFixed(1)}
                  </span>
                  <span>Capacity: {formatAmount(selectedAgent.available_capacity)} USD</span>
                  <span>Response: ~{selectedAgent.response_time_minutes ?? 0} min</span>
                </div>
              </div>
            ) : null}

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === "bank" ? "default" : "outline"}
                  className="gap-2"
                  onClick={() => setPaymentMethod("bank")}
                >
                  <Banknote className="h-4 w-4" />
                  Bank Transfer
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === "mobile_money" ? "default" : "outline"}
                  className="gap-2"
                  onClick={() => setPaymentMethod("mobile_money")}
                >
                  <Smartphone className="h-4 w-4" />
                  Mobile Money
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input
                    value={accountName}
                    onChange={(event) => setAccountName(event.target.value)}
                    placeholder="Recipient account name"
                  />
                </div>

                {paymentMethod === "bank" ? (
                  <>
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input
                        value={bankName}
                        onChange={(event) => setBankName(event.target.value)}
                        placeholder="Recipient bank"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input
                        value={accountNumber}
                        onChange={(event) => setAccountNumber(event.target.value)}
                        placeholder="Recipient account number"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Provider</Label>
                      <Input
                        value={mobileProvider}
                        onChange={(event) => setMobileProvider(event.target.value)}
                        placeholder="Orange Money, Wave, MTN MoMo..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mobile Number</Label>
                      <Input
                        value={mobileNumber}
                        onChange={(event) => setMobileNumber(event.target.value)}
                        placeholder="Recipient mobile money number"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={isSubmitting || !selectedAgentId}
            >
              {isSubmitting ? "Creating..." : "Create Sell Request"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Agents</CardTitle>
            <CardDescription>
              Agents are matched to your merchant country so settlement stays locally practical.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search agent, city, bank, or mobile money provider"
              />
            </div>

            <div className="space-y-3">
              {filteredAgents.length ? (
                filteredAgents.map((agent) => {
                  const active = selectedAgentId === agent.id;
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={`w-full rounded-lg border p-4 text-left transition-colors ${
                        active ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{agent.user?.full_name || "Agent"}</span>
                            <Badge variant="outline">{agent.tier || "starter"}</Badge>
                            {agent.is_verified ? (
                              <Badge className="gap-1">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Verified
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {[agent.city, agent.country].filter(Boolean).join(", ") || "Region not set"}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span>Rating {(agent.rating ?? 0).toFixed(1)}</span>
                            <span>Capacity {formatAmount(agent.available_capacity)} USD</span>
                            <span>~{agent.response_time_minutes ?? 0} min</span>
                          </div>
                        </div>
                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  No active agents match this merchant region yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How This Process Works</CardTitle>
          <CardDescription>
            Merchants should be able to see when tokens are locked and what the next expected step is.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 font-medium">
              <Clock3 className="h-4 w-4" />
              Escrowed
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Your selected token amount is locked while the agent prepares fiat settlement.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 font-medium">
              <Banknote className="h-4 w-4" />
              Fiat Sent
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              The agent marked fiat as sent. Review the request details and confirm receipt only when it is true.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4" />
              Confirmed or Disputed
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Completed requests close the flow. Disputed requests should be escalated and tracked carefully.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sell Requests</CardTitle>
          <CardDescription>
            Track the escrow and fiat-settlement handshake after each merchant liquidation request.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length ? (
            requests.map((request) => (
              <div
                key={request.id}
                className="rounded-lg border px-4 py-3 transition-colors hover:bg-muted/30"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {formatAmount(request.amount)} {request.token_type}
                      </span>
                      <Badge variant={statusTone(request.status)}>
                        {getStatusLabel(request.status)}
                      </Badge>
                      {request.agent?.tier ? <Badge variant="outline">{request.agent.tier}</Badge> : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {request.agent?.user?.full_name || "Agent"}
                      {request.agent?.tier ? ` • ${request.agent.tier}` : ""}
                      {typeof request.agent?.rating === "number"
                        ? ` • ${request.agent.rating.toFixed(1)} rating`
                        : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getStatusDescription(request.status)}
                    </p>
                    {request.latest_dispute ? (
                      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
                        <p className="font-medium text-destructive">Dispute Open</p>
                        <p className="mt-1 text-muted-foreground">
                          {request.latest_dispute.reason || "A payout dispute is being reviewed."}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Opened {formatDisputeTimestamp(request.latest_dispute.created_at)}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground">
                      {request.created_at
                        ? format(new Date(request.created_at), "MMM d, yyyy • h:mm a")
                        : "N/A"}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/merchant/sell-through-agent/${request.id}`}>Open</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenRequestDetails(request)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              No sell requests yet.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sell Request Details</DialogTitle>
            <DialogDescription>
              Review the request state, agent pairing, and payout details for this merchant sell flow.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardContent className="space-y-3 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={statusTone(selectedRequest.status)}>
                      {getStatusLabel(selectedRequest.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">
                      {formatAmount(selectedRequest.amount)} {selectedRequest.token_type}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Request ID</p>
                    <p className="mt-1 break-all font-mono text-xs">{selectedRequest.id}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p>
                    <p className="mt-1">
                      {selectedRequest.created_at
                        ? format(new Date(selectedRequest.created_at), "MMM d, yyyy • h:mm a")
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Expires</p>
                    <p className="mt-1">
                      {selectedRequest.expires_at
                        ? format(new Date(selectedRequest.expires_at), "MMM d, yyyy • h:mm a")
                        : "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-3 p-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Agent</p>
                    <p className="mt-1 font-medium">
                      {selectedRequest.agent?.user?.full_name || "N/A"}
                    </p>
                    <p className="text-muted-foreground">
                      {selectedRequest.agent?.user?.email ||
                        "Agent contact email is not available on this request"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tier</span>
                    <span>{selectedRequest.agent?.tier || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rating</span>
                    <span>{selectedRequest.agent?.rating?.toFixed?.(1) || "N/A"}</span>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock3 className="h-4 w-4" />
                      Payout Details
                    </div>
                    <pre className="mt-2 overflow-auto text-xs">
                      {JSON.stringify(selectedRequest.bank_account || {}, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {selectedRequest.fiat_proof_url ? (
                <Card className="sm:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Agent Payment Proof</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <a
                      href={selectedRequest.fiat_proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-muted/50"
                    >
                      Open proof image
                    </a>
                    <a
                      href={selectedRequest.fiat_proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-lg border"
                    >
                      <img
                        src={selectedRequest.fiat_proof_url}
                        alt="Agent uploaded payment proof"
                        className="h-40 w-full object-cover"
                      />
                    </a>
                    <p className="text-sm text-muted-foreground">
                      Review this proof carefully and confirm receipt only if the fiat payment has
                      actually landed in your account or mobile money wallet.
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              <Card className="sm:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">What This Status Means</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-lg border p-3">
                    <p className="font-medium">{getStatusLabel(selectedRequest.status)}</p>
                    <p className="mt-1 text-muted-foreground">
                      {getStatusDescription(selectedRequest.status)}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border p-3">
                      <p className="font-medium">1. Escrowed</p>
                      <p className="mt-1 text-muted-foreground">
                        Tokens are locked safely while the agent works on fiat settlement.
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="font-medium">2. Fiat Sent</p>
                      <p className="mt-1 text-muted-foreground">
                        The agent marked payment as sent. Review your payout destination carefully.
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="font-medium">3. Confirmed</p>
                      <p className="mt-1 text-muted-foreground">
                        You confirmed receipt and the token escrow is finalized.
                      </p>
                    </div>
                  </div>

                  {canResolveFiatRequest(selectedRequest) ? (
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" onClick={handleOpenDispute}>
                        I Didn&apos;t Receive It
                      </Button>
                      <Button onClick={() => handleConfirmReceipt(selectedRequest.id)}>
                        Yes, I Received It
                      </Button>
                      <p className="self-center text-sm text-muted-foreground">
                        Confirm only after the fiat amount has actually landed.
                      </p>
                    </div>
                  ) : null}

                  {selectedRequest.latest_dispute ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                      <p className="font-medium text-destructive">Dispute on File</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedRequest.latest_dispute.reason ||
                          "A payout dispute has already been opened for this request."}
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Dispute status</p>
                          <p className="font-medium">
                            {selectedRequest.latest_dispute.status || "Open"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Opened</p>
                          <p className="font-medium">
                            {formatDisputeTimestamp(selectedRequest.latest_dispute.created_at)}
                          </p>
                        </div>
                      </div>
                      {selectedRequest.latest_dispute.details ? (
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground">Details submitted</p>
                          <p className="mt-1 text-sm">{selectedRequest.latest_dispute.details}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" asChild>
                      <Link href={`/merchant/sell-through-agent/${selectedRequest.id}`}>
                        Open full request page
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Sell Request</AlertDialogTitle>
            <AlertDialogDescription>
              This is the final step before your tokens are locked in escrow for the selected
              agent settlement flow.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Agent</span>
                <span className="font-medium">{selectedAgent?.user?.full_name || "N/A"}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-muted-foreground">Token</span>
                <span>{tokenType}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{formatAmount(amount)} {tokenType}</span>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <p className="font-medium">{payoutSummary.typeLabel}</p>
              <p className="mt-2 text-muted-foreground">{payoutSummary.line1}</p>
              <p className="text-muted-foreground">{payoutSummary.line2}</p>
              <p className="text-muted-foreground">{payoutSummary.line3}</p>
            </div>

            <p className="text-sm text-muted-foreground">
              After confirmation, the selected token amount will be locked while the agent completes fiat settlement.
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateRequest} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Confirm and Sell"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
