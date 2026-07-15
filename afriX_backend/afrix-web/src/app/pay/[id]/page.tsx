"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Lock,
  RefreshCw,
  Shield,
  Smartphone,
  Store,
  Wallet,
} from "lucide-react";

import {
  clearStoredUserSession,
  getStoredUserToken,
  hostedPaymentApi,
  type HostedPaymentDetails,
  type HostedUserProfile,
} from "@/lib/customer-api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatAmount = (amount?: number | string, token = "CT") => {
  const numeric = Number(amount || 0);
  return `${numeric.toLocaleString()} ${token}`;
};

const decodeHtmlEntities = (value?: string | null) => {
  if (!value) return "";
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&amp;/g, "&");
};

const formatCountdown = (totalSeconds: number) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const getOrdersUrl = (returnUrl?: string) => {
  if (!returnUrl) return null;
  try {
    const url = new URL(returnUrl);
    return `${url.origin}/orders`;
  } catch (_) {
    return null;
  }
};

// ─── App store URLs (configurable via env) ───────────────────────────────────
const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL || "#";
const APP_STORE_URL =
  process.env.NEXT_PUBLIC_APP_STORE_URL || "#";

// ─── Component ───────────────────────────────────────────────────────────────

export default function HostedPaymentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const transactionId = String(params?.id || "");

  const [payment, setPayment] = useState<HostedPaymentDetails | null>(null);
  const [profile, setProfile] = useState<HostedUserProfile | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [paymentPassword, setPaymentPassword] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Countdown timer state (seconds remaining)
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const paymentTokenType = payment?.token_type || payment?.currency || "CT";

  const buyerWallet = useMemo(
    () =>
      profile?.wallets?.find(
        (wallet) => wallet.token_type === paymentTokenType
      ) || null,
    [profile, paymentTokenType]
  );

  const hasSufficientBalance =
    Number(buyerWallet?.balance || 0) >= Number(payment?.amount || 0);

  const returnUrl = decodeHtmlEntities(
    payment?.metadata?.return_url as string | undefined
  );

  const isExpired = timeLeft !== null && timeLeft <= 0;

  // ─── Data loading ──────────────────────────────────────────────────────────

  const loadPayment = useCallback(async () => {
    const paymentData = await hostedPaymentApi.getPaymentDetails(transactionId);
    setPayment(paymentData);
  }, [transactionId]);

  const loadProfile = async () => {
    const profileData = await hostedPaymentApi.getCurrentUserProfile();
    setProfile(profileData);
    setEmail(profileData.email || "");
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setError("");
        await loadPayment();
        if (getStoredUserToken()) {
          try {
            await loadProfile();
          } catch {
            clearStoredUserSession();
            setProfile(null);
          }
        }
      } catch (bootError: unknown) {
        const err = bootError as { response?: { data?: { message?: string } }; message?: string };
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load this payment request."
        );
      } finally {
        setIsBooting(false);
      }
    };

    if (transactionId) bootstrap();
  }, [transactionId, loadPayment]);

  // ─── Countdown timer ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!payment?.expires_at || payment.status === "completed") return;

    const expiresAt = new Date(payment.expires_at).getTime();

    const tick = () => {
      const secs = Math.floor((expiresAt - Date.now()) / 1000);
      setTimeLeft(secs > 0 ? secs : 0);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [payment?.expires_at, payment?.status]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setError("");
    try {
      await hostedPaymentApi.login(email, password);
      await loadProfile();
      setPassword("");
    } catch (loginError: unknown) {
      const err = loginError as { response?: { data?: { message?: string } }; message?: string };
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to sign in for hosted checkout."
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRefreshProfile = async () => {
    setIsRefreshingProfile(true);
    setError("");
    try {
      await loadProfile();
    } catch (profileError: unknown) {
      const err = profileError as { response?: { data?: { message?: string } }; message?: string };
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to refresh your AfriExchange wallet profile."
      );
    } finally {
      setIsRefreshingProfile(false);
    }
  };

  const handlePay = async () => {
    if (!payment) return;
    if (!paymentPassword) {
      setError("Please enter your account password to authorize this payment.");
      return;
    }

    setIsPaying(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await hostedPaymentApi.processPayment({
        transactionId: payment.id,
        amount: Number(payment.amount),
        tokenType: paymentTokenType,
        reference: payment.reference,
        password: paymentPassword,
      });

      setSuccessMessage(
        `Payment completed successfully. Reference: ${
          result.reference || payment.reference
        }`
      );
      setPaymentPassword("");
      await loadPayment();
      await loadProfile();

      const redirectUrl = new URL(
        returnUrl || `${window.location.origin}/`,
        window.location.origin
      );
      redirectUrl.searchParams.set(
        "reference",
        result.reference || payment.reference
      );
      redirectUrl.searchParams.set("provider", "afriexchange");

      window.setTimeout(() => {
        if (returnUrl) {
          window.location.assign(redirectUrl.toString());
          return;
        }
        router.push("/");
      }, 1200);
    } catch (paymentError: unknown) {
      const err = paymentError as { response?: { data?: { message?: string } }; message?: string };
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to complete this AfriExchange payment."
      );
    } finally {
      setIsPaying(false);
    }
  };

  const handleLogout = () => {
    clearStoredUserSession();
    setProfile(null);
    setPassword("");
    setPaymentPassword("");
    setSuccessMessage("");
  };

  // ─── Countdown badge ───────────────────────────────────────────────────────

  const CountdownBadge = () => {
    if (timeLeft === null || payment?.status === "completed") return null;

    if (isExpired) {
      const ordersUrl = getOrdersUrl(returnUrl);
      return (
        <Alert variant="destructive" className="mb-4">
          <Clock className="h-4 w-4" />
          <AlertTitle>Payment Link Expired</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              This payment link has expired. Go back to your order page and click{" "}
              <strong>&quot;Continue Payment&quot;</strong> — your order is saved
              and a fresh payment link will be generated instantly.
            </p>
            {ordersUrl && (
              <div className="pt-2">
                <a
                  href={ordersUrl}
                  className="inline-flex items-center gap-2 rounded-md bg-destructive/20 hover:bg-destructive/30 px-3 py-1.5 text-xs font-semibold border border-destructive/30 transition-colors text-white"
                >
                  Go to Orders Page
                </a>
              </div>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    const isWarning = timeLeft <= 300; // under 5 minutes
    return (
      <div
        className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${
          isWarning
            ? "border-amber-400 bg-amber-50 text-amber-700"
            : "border-green-400 bg-green-50 text-green-700"
        }`}
      >
        <Clock className="h-4 w-4 flex-shrink-0" />
        <span>
          Payment link expires in{" "}
          <span className="font-mono font-bold">
            {formatCountdown(timeLeft)}
          </span>
          {isWarning && " — act soon!"}
        </span>
      </div>
    );
  };

  // ─── Onboarding panel ─────────────────────────────────────────────────────

  const OnboardingPanel = () => (
    <div className="mt-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4">
      <button
        type="button"
        className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
        onClick={() => setShowOnboarding((v) => !v)}
      >
        <span className="flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          Don&apos;t have an AfriExchange account?
        </span>
        <span className="text-xs">{showOnboarding ? "▲ Hide" : "▼ Show"}</span>
      </button>

      {showOnboarding && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            You can pay with AfriExchange tokens in 4 easy steps. This payment
            link will remain open while you get set up.
          </p>

          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </span>
              <div>
                <p className="text-sm font-semibold">
                  Download the AfriExchange App
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    <Download className="h-3 w-3" />
                    Google Play
                  </a>
                  <a
                    href={APP_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    <Download className="h-3 w-3" />
                    App Store
                  </a>
                </div>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                2
              </span>
              <div>
                <p className="text-sm font-semibold">Create a free account</p>
                <p className="text-xs text-muted-foreground">
                  Register with your email. Verification takes under a minute.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                3
              </span>
              <div>
                <p className="text-sm font-semibold">
                  Buy {paymentTokenType} tokens
                </p>
                <p className="text-xs text-muted-foreground">
                  Top up your wallet inside the app. You need at least{" "}
                  <strong>
                    {formatAmount(payment?.amount, paymentTokenType)}
                  </strong>
                  .
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                4
              </span>
              <div>
                <p className="text-sm font-semibold">
                  Return here and sign in
                </p>
                <p className="text-xs text-muted-foreground">
                  Come back to this page and sign in above. If the link has
                  expired, go back to PlugNG and click{" "}
                  <strong>&quot;Continue Payment&quot;</strong> to get a fresh
                  link instantly — your order is always saved.
                </p>
              </div>
            </li>
          </ol>
        </div>
      )}
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  if (isBooting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading payment details…</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Payment Request Not Found</CardTitle>
            <CardDescription>
              We could not load this hosted AfriExchange payment request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* ── Left: Payment Details ── */}
        <Card>
          <CardHeader>
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <Store className="h-5 w-5" />
              <span className="text-sm font-medium">
                {payment.merchant?.display_name ||
                  payment.merchant?.business_name ||
                  "AfriExchange Merchant"}
              </span>
            </div>
            <CardTitle className="text-2xl">Complete Your Payment</CardTitle>
            <CardDescription>
              Review the hosted payment details, then sign in with your
              AfriExchange buyer account to pay from your wallet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Countdown timer */}
            <CountdownBadge />

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Payment Completed</AlertTitle>
                <AlertDescription>
                  {successMessage}
                  {returnUrl ? " Redirecting you back to the merchant now…" : ""}
                </AlertDescription>
              </Alert>
            )}

            {/* Payment summary */}
            <div className="rounded-lg border p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Reference
                  </p>
                  <p className="font-mono text-sm">{payment.reference}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Status
                  </p>
                  <p className="text-sm capitalize">{payment.status}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Amount
                  </p>
                  <p className="text-lg font-semibold">
                    {formatAmount(payment.amount, paymentTokenType)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Merchant
                  </p>
                  <p className="text-sm">
                    {payment.merchant?.business_name ||
                      payment.merchant?.display_name ||
                      "Merchant"}
                  </p>
                </div>
              </div>

              {payment.description && (
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Description
                  </p>
                  <p className="text-sm">{payment.description}</p>
                </div>
              )}
            </div>

            {payment.status === "completed" && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Already Paid</AlertTitle>
                <AlertDescription>
                  This payment request has already been completed.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* ── Right: Auth & Payment ── */}
        <Card>
          <CardHeader>
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <Lock className="h-5 w-5" />
              <span className="text-sm font-medium">Buyer Authentication</span>
            </div>
            <CardTitle className="text-2xl">
              {profile ? "Pay From Wallet" : "Buyer Sign In"}
            </CardTitle>
            <CardDescription>
              {profile
                ? "You are signed in. Authorize the payment with your account password to confirm."
                : "Sign in with your normal AfriExchange buyer account. Admin and merchant logins do not work here."}
            </CardDescription>
          </CardHeader>

          {!profile ? (
            <>
              <form onSubmit={handleLogin}>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    type="submit"
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn && (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Sign in as Buyer
                  </Button>
                </CardFooter>
              </form>

              {/* New user onboarding panel */}
              <CardContent className="pt-0">
                <OnboardingPanel />
              </CardContent>
            </>
          ) : (
            <>
              <CardContent className="space-y-4">
                {/* Account row */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{profile.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {profile.email}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                    >
                      Use another account
                    </Button>
                  </div>
                </div>

                {/* Wallet balance */}
                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <p className="text-sm font-semibold">
                      {paymentTokenType} Wallet
                    </p>
                  </div>
                  <p className="text-2xl font-semibold">
                    {formatAmount(buyerWallet?.balance, paymentTokenType)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Required: {formatAmount(payment.amount, paymentTokenType)}
                  </p>
                </div>

                {/* No wallet */}
                {!buyerWallet && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Matching Wallet</AlertTitle>
                    <AlertDescription>
                      This buyer account does not have a {paymentTokenType}{" "}
                      wallet. Open the AfriExchange app to activate one.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Insufficient balance */}
                {buyerWallet && !hasSufficientBalance && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Insufficient Balance</AlertTitle>
                    <AlertDescription>
                      Your {paymentTokenType} wallet balance is too low. Open
                      the AfriExchange app to buy more tokens, then tap{" "}
                      <strong>Refresh Wallet Balance</strong> below to continue.
                    </AlertDescription>
                  </Alert>
                )}

                {/* ── Password Authorization ── */}
                {buyerWallet && hasSufficientBalance && !isExpired && payment.status !== "completed" && (
                  <div className="rounded-lg border border-dashed p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Shield className="h-4 w-4 text-primary" />
                      Authorize Payment
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Re-enter your account password to confirm this transaction.
                    </p>
                    <div className="grid gap-1.5">
                      <Label htmlFor="paymentPassword" className="sr-only">
                        Authorization password
                      </Label>
                      <Input
                        id="paymentPassword"
                        type="password"
                        placeholder="Enter your account password…"
                        value={paymentPassword}
                        onChange={(e) => setPaymentPassword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handlePay();
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button
                  className="w-full"
                  type="button"
                  disabled={
                    isPaying ||
                    isExpired ||
                    payment.status === "completed" ||
                    !buyerWallet ||
                    !hasSufficientBalance ||
                    !paymentPassword
                  }
                  onClick={handlePay}
                >
                  {isPaying && (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isExpired
                    ? "Link Expired — Go Back to PlugNG"
                    : `Pay ${formatAmount(payment.amount, paymentTokenType)}`}
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  type="button"
                  disabled={isRefreshingProfile}
                  onClick={handleRefreshProfile}
                >
                  {isRefreshingProfile && (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Refresh Wallet Balance
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
