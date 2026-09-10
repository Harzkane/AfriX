"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, KeyRound, ShieldCheck, Smartphone } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import api from "@/lib/api";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-rose-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white">Reset Token Missing or Expired</h3>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xs mx-auto leading-relaxed">
            Please request a new password recovery link from the AfriX mobile application or sign in.
          </p>
        </div>
        <div className="w-full pt-2">
          <Button
            variant="outline"
            className="w-full rounded-xl border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800 hover:text-white text-xs font-mono"
            asChild
          >
            <Link href="/login">Back to Portal Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white">Password Updated Successfully</h3>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xs mx-auto leading-relaxed">
            Your cryptographic credentials have been refreshed. You can now authenticate with your new password.
          </p>
        </div>
        <div className="w-full pt-2 space-y-3">
          <Button
            className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs font-mono shadow-[0_0_20px_rgba(52,211,153,0.3)]"
            asChild
          >
            <Link href="/login">Go to Operator Sign In</Link>
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-xl border-slate-800 bg-slate-950/60 text-slate-300 hover:text-white text-xs font-mono"
            asChild
          >
            <Link href="/merchant/login">Go to Merchant Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/reset-password", {
        token,
        new_password: password,
      });

      if (response.data.success) {
        setSuccess(true);
      } else {
        throw new Error(response.data.message || "Failed to reset password.");
      }
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to reset password. The link may have expired or is invalid."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleReset} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="bg-rose-950/50 border-rose-800/80 text-rose-200">
          <AlertCircle className="h-4 w-4 text-rose-400" />
          <AlertTitle className="text-xs font-bold font-mono">Reset Error</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Mobile App Deep Link Notice */}
      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs flex items-start gap-2.5 text-emerald-300">
        <Smartphone className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-white">Using a mobile device?</span> You can reset directly in the native app.{" "}
          <a
            href={`afrix://reset-password?token=${token}`}
            className="underline font-mono font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Open in AfriX App
          </a>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-mono text-slate-300">
          New Password
        </Label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          placeholder="••••••••••••"
          onChange={(e) => setPassword(e.target.value)}
          className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 rounded-xl h-11 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-xs font-mono text-slate-300">
          Confirm New Password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          required
          value={confirmPassword}
          placeholder="••••••••••••"
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 rounded-xl h-11 text-sm"
        />
      </div>

      <div className="pt-2">
        <Button
          className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-[0_0_25px_rgba(52,211,153,0.35)] hover:shadow-[0_0_35px_rgba(52,211,153,0.5)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
          type="submit"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-950" />}
          Update Password & Secure Account
        </Button>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#030712] text-slate-100 overflow-hidden font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-emerald-600/15 via-teal-500/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
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
              Security Portal
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

      {/* Main Center Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/95 border border-slate-800/90 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.7)] relative overflow-hidden">
            {/* Top gradient glow line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-medium">
                  <KeyRound size={13} />
                  <span>Credential Reset</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Choose New Password
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Enter your replacement password below to regain full access to your account.
                </p>
              </div>

              <Suspense
                fallback={
                  <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 font-mono text-xs text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                    <p>Validating reset session...</p>
                  </div>
                }
              >
                <ResetPasswordContent />
              </Suspense>
            </div>
          </div>

          {/* Security footnote */}
          <div className="text-center mt-6 text-[11px] font-mono text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Cryptographic Session Validation • 256-Bit TLS</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-600 font-mono border-t border-slate-900">
        AfriExchange (AfriX) Security Services &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
