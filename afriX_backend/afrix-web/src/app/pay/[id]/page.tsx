"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
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

const formatAmount = (amount?: number | string, token = "CT") => {
  const numeric = Number(amount || 0);
  return `${numeric.toLocaleString()} ${token}`;
};

export default function HostedPaymentPage() {
  const params = useParams<{ id: string }>();
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

  const loadPayment = async () => {
    const paymentData = await hostedPaymentApi.getPaymentDetails(transactionId);
    setPayment(paymentData);
  };

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
          } catch (profileError) {
            clearStoredUserSession();
            setProfile(null);
          }
        }
      } catch (bootError: any) {
        setError(
          bootError?.response?.data?.message ||
            bootError?.message ||
            "Unable to load this payment request."
        );
      } finally {
        setIsBooting(false);
      }
    };

    if (transactionId) {
      bootstrap();
    }
  }, [transactionId]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setError("");

    try {
      await hostedPaymentApi.login(email, password);
      await loadProfile();
      setPassword("");
    } catch (loginError: any) {
      setError(
        loginError?.response?.data?.message ||
          loginError?.message ||
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
    } catch (profileError: any) {
      setError(
        profileError?.response?.data?.message ||
          profileError?.message ||
          "Unable to refresh your AfriExchange wallet profile."
      );
    } finally {
      setIsRefreshingProfile(false);
    }
  };

  const handlePay = async () => {
    if (!payment) return;

    setIsPaying(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await hostedPaymentApi.processPayment({
        transactionId: payment.id,
        amount: Number(payment.amount),
        tokenType: paymentTokenType,
        reference: payment.reference,
      });

      setSuccessMessage(
        `Payment completed successfully. Reference: ${
          result.reference || payment.reference
        }`
      );
      await loadPayment();
      await loadProfile();
    } catch (paymentError: any) {
      setError(
        paymentError?.response?.data?.message ||
          paymentError?.message ||
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
    setSuccessMessage("");
  };

  if (isBooting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <Loader2 className="h-8 w-8 animate-spin" />
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
              Review the hosted Path A payment details, then sign in with your
              AfriExchange buyer account to pay from your wallet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

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

        <Card>
          <CardHeader>
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <Lock className="h-5 w-5" />
              <span className="text-sm font-medium">
                Buyer Authentication
              </span>
            </div>
            <CardTitle className="text-2xl">
              {profile ? "Pay From Wallet" : "Buyer Sign In"}
            </CardTitle>
            <CardDescription>
              {profile
                ? "You are signed in as a buyer. Confirm your wallet balance, then complete this hosted payment."
                : "Sign in with your normal AfriExchange buyer account. Admin and merchant logins do not work here."}
            </CardDescription>
          </CardHeader>

          {!profile ? (
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
                <Button className="w-full" type="submit" disabled={isLoggingIn}>
                  {isLoggingIn && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign in as Buyer
                </Button>
              </CardFooter>
            </form>
          ) : (
            <>
              <CardContent className="space-y-4">
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

                {!buyerWallet && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Matching Wallet</AlertTitle>
                    <AlertDescription>
                      This buyer account does not currently have a{" "}
                      {paymentTokenType} wallet available for the hosted
                      checkout.
                    </AlertDescription>
                  </Alert>
                )}

                {buyerWallet && !hasSufficientBalance && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Insufficient Balance</AlertTitle>
                    <AlertDescription>
                      Your {paymentTokenType} wallet does not currently have
                      enough balance to complete this payment.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  className="w-full"
                  type="button"
                  disabled={
                    isPaying ||
                    payment.status === "completed" ||
                    !buyerWallet ||
                    !hasSufficientBalance
                  }
                  onClick={handlePay}
                >
                  {isPaying && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Pay {formatAmount(payment.amount, paymentTokenType)}
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  type="button"
                  disabled={isRefreshingProfile}
                  onClick={handleRefreshProfile}
                >
                  {isRefreshingProfile && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
