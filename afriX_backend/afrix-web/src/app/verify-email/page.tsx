"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import api from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email address...");
  const hasRequested = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing or invalid. Please check your link.");
      return;
    }

    if (hasRequested.current) return;
    hasRequested.current = true;

    const verify = async () => {
      try {
        const response = await api.post("/auth/verify-email", { token });
        if (response.data.success) {
          setStatus("success");
          setMessage("Email verified successfully! You can now log into your account on the AfriX platform or mobile app.");
        } else {
          throw new Error(response.data.message || "Failed to verify email.");
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            err.message ||
            "Invalid or expired verification token. Please request a new link in the app."
        );
      }
    };

    verify();
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center space-y-6">
      {status === "loading" && (
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            </div>
          </div>
          <p className="text-slate-300 font-medium text-sm max-w-xs">{message}</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center space-y-4 w-full">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Email Confirmed</h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto">
              {message}
            </p>
          </div>
          <div className="w-full pt-4 space-y-3">
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
      )}

      {status === "error" && (
        <div className="flex flex-col items-center space-y-4 w-full">
          <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-rose-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Verification Failed</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto">
              {message}
            </p>
          </div>
          <div className="w-full pt-4">
            <Button
              variant="outline"
              className="w-full rounded-xl border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800 hover:text-white text-xs font-mono"
              asChild
            >
              <Link href="/login">Back to Sign In</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#030712] text-slate-100 overflow-hidden font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-emerald-600/15 via-teal-500/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />
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
              Account Verification
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
                  <MailCheck size={13} />
                  <span>Email Verification</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Identity Confirmation
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Authenticating cryptographic email token with AfriX settlement network.
                </p>
              </div>

              <Suspense
                fallback={
                  <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 font-mono text-xs text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                    <p>Loading verification context...</p>
                  </div>
                }
              >
                <VerifyEmailContent />
              </Suspense>
            </div>
          </div>

          {/* Security footnote */}
          <div className="text-center mt-6 text-[11px] font-mono text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Cryptographic Proof Verification • 256-Bit SSL</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-600 font-mono border-t border-slate-900">
        AfriExchange (AfriX) Identity Infrastructure &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
