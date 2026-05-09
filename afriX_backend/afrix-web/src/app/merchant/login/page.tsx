"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { AlertCircle, Loader2, Store } from "lucide-react";

import merchantApi from "@/lib/merchant-api";
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

export default function MerchantLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await merchantApi.post("/auth/login", { email, password });
      const { tokens, user } = response.data.data;
      const token = tokens.access_token;

      if (user.role !== "merchant") {
        throw new Error("Access denied: Merchant privileges required");
      }

      Cookies.set("merchant_token", token, { expires: 7 });
      localStorage.setItem("merchant_token", token);
      localStorage.setItem("merchant_user", JSON.stringify(user));

      router.push("/merchant");
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Unable to sign in"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Store className="h-5 w-5" />
            <span className="text-sm font-medium">AfriExchange Merchant</span>
          </div>
          <CardTitle className="text-2xl">Merchant Login</CardTitle>
          <CardDescription>
            Sign in to manage your collections, wallet assets, and merchant settings.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="merchant@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full space-y-3">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/merchant/register">Create merchant profile</Link>
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
