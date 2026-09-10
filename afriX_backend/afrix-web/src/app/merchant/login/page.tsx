"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, Lock, ShieldCheck, Store } from "lucide-react";

import merchantApi from "@/lib/merchant-api";
import { Button } from "@/components/ui/button";
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
    <div className="relative min-h-screen flex flex-col justify-between bg-[#030712] text-slate-100 overflow-hidden font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-emerald-600/15 via-teal-500/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 left-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Navbar Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-slate-900 border border-emerald-500/30 flex items-center justify-center p-1 group-hover:border-emerald-400/60 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Image
              src="/afrix-logo.png"
              alt="AfriX Logo"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white flex items-center">
              Afri
              <span className="text-emerald-400 ml-0.5">X</span>
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 -mt-1">
              Merchant Portal
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Landing</span>
        </Link>
      </header>

      {/* Center Auth Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/95 border border-slate-800/90 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.7)] relative overflow-hidden">
            {/* Card subtle top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

            <div className="space-y-6">
              {/* Header inside card */}
              <div className="space-y-2 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-medium">
                  <Store size={13} />
                  <span>Merchant Settlement</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Merchant Sign In
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Access your collections, payment links, webhook secrets, and token balances.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="bg-rose-950/50 border-rose-800/80 text-rose-200">
                    <AlertCircle className="h-4 w-4 text-rose-400" />
                    <AlertTitle className="text-xs font-bold font-mono">Sign In Failed</AlertTitle>
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-mono text-slate-300">
                    Merchant Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="merchant@store.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 rounded-xl h-11 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-mono text-slate-300">
                      Password
                    </Label>
                    <Link
                      href="/reset-password"
                      className="text-[11px] font-mono text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 rounded-xl h-11 text-sm"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-[0_0_25px_rgba(52,211,153,0.35)] hover:shadow-[0_0_35px_rgba(52,211,153,0.5)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-950" />
                    ) : (
                      <Lock className="mr-2 h-4 w-4 text-slate-950" />
                    )}
                    Sign In to Merchant Console
                  </Button>
                </div>
              </form>

              {/* Secondary Links */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <div>
                    <span className="text-slate-300 font-medium block">New to AfriX Commerce?</span>
                    <span className="text-[11px] text-slate-500">Instant checkout & API integration</span>
                  </div>
                  <Link
                    href="/merchant/register"
                    className="text-xs font-mono font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 flex-shrink-0 ml-2"
                  >
                    <span>Register</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-1 pt-1">
                  <span>System operator?</span>
                  <Link href="/login" className="hover:text-slate-300 transition-colors">
                    Admin Sign In &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Security footnote */}
          <div className="text-center mt-6 text-[11px] font-mono text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>256-Bit SSL Encrypted • Direct Wallet Settlement</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-600 font-mono border-t border-slate-900">
        AfriExchange (AfriX) Merchant Services &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
