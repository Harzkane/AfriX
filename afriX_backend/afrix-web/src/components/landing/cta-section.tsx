"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Store, Users, Zap } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-14 sm:py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-teal-950/80 border border-emerald-500/30 p-6 sm:p-12 lg:p-16 overflow-hidden shadow-[0_20px_80px_rgba(16,185,129,0.15)] text-center">
          {/* Radiant background blur circles */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-10 w-72 h-72 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-4 sm:mb-6">
            <Sparkles size={13} />
            The Rails for a Moving Africa
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight max-w-3xl mx-auto leading-tight">
            Start moving value today. Instant, secure, borderless.
          </h2>

          <p className="text-slate-300 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto mt-3 sm:mt-4 mb-6 sm:mb-8 leading-relaxed">
            Join the merchants, independent liquidity providers, and individuals building frictionless African
            trade on AfriX.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-extrabold text-sm shadow-[0_0_30px_rgba(52,211,153,0.4)] hover:shadow-[0_0_40px_rgba(52,211,153,0.6)] transition-all transform hover:-translate-y-0.5"
            >
              <span>Launch AfriX Portal</span>
              <ArrowRight size={16} className="stroke-[2.5]" />
            </Link>

            <Link
              href="/merchant/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-4 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-900/80 hover:bg-slate-800 text-white font-semibold text-sm transition-colors"
            >
              <Store size={16} className="text-emerald-400" />
              <span>Register as Merchant</span>
            </Link>
          </div>

          {/* Proof checkmarks */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-10 mt-8 sm:mt-10 text-[11px] sm:text-xs font-mono text-slate-400 pt-6 sm:pt-8 border-t border-slate-800/80">
            <span className="flex items-center gap-1.5 sm:gap-2">
              <ShieldCheck size={14} className="text-emerald-400" /> Non-Custodial Security
            </span>
            <span className="flex items-center gap-1.5 sm:gap-2">
              <Zap size={14} className="text-emerald-400" /> Sub-60s Settlement
            </span>
            <span className="flex items-center gap-1.5 sm:gap-2">
              <Users size={14} className="text-emerald-400" /> 24/7 Agent Availability
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
