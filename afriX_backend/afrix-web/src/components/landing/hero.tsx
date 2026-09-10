"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, MoveUpRight, Zap, Globe, Coins } from "lucide-react";
import CurrencyCalculator from "./currency-calculator";

export default function LandingHero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background visual atmosphere */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-emerald-600/15 via-teal-500/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-12 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid line overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Value Proposition & Hero Copy */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-8 text-left">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-emerald-500/30 backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-mono font-medium text-emerald-400 tracking-wide uppercase">
                Next-Gen Financial Infrastructure
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
                Move value. <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Settle instantly.
                </span>{" "}
                <br />
                Across borders.
              </h1>
              <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl">
                AfriX provides programmable settlement rails for African commerce. Transfer value between{" "}
                <strong className="text-emerald-400 font-semibold">NT (Naira)</strong>,{" "}
                <strong className="text-teal-400 font-semibold">CT (CFA Franc)</strong>, and{" "}
                <strong className="text-cyan-400 font-semibold">USDT</strong> through decentralized escrow,
                verified liquidity agents, and zero bank delays.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-[0_0_25px_rgba(52,211,153,0.35)] hover:shadow-[0_0_35px_rgba(52,211,153,0.5)] transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <span>Launch AfriX Portal</span>
                <ArrowRight size={16} className="stroke-[2.5]" />
              </Link>
              <Link
                href="#ecosystem"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-medium text-sm backdrop-blur-md transition-all duration-200"
              >
                <span>How the Rails Work</span>
                <MoveUpRight size={14} className="text-slate-400" />
              </Link>
            </div>

            {/* Trust Proof Points */}
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-4">
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                  &lt; 60<span className="text-emerald-400">s</span>
                </div>
                <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Average Settlement</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                  0.5<span className="text-emerald-400">%</span>
                </div>
                <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Low Flat P2P Fee</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                  100<span className="text-emerald-400">%</span>
                </div>
                <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Non-Custodial Escrow</div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Live Exchange Simulator */}
          <div className="lg:col-span-6 xl:col-span-6 relative">
            {/* Floating Badges */}
            <div className="absolute -top-4 -left-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-emerald-400 text-xs font-mono shadow-lg backdrop-blur-md">
              <Zap size={13} className="text-emerald-400" />
              <span>Real-time on-chain mint/burn</span>
            </div>

            <div className="absolute -bottom-4 -right-4 z-20 hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/95 border border-slate-700 text-slate-300 text-xs font-mono shadow-xl backdrop-blur-md">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>USDT Security Deposit Backed</span>
            </div>

            <CurrencyCalculator />
          </div>
        </div>
      </div>
    </section>
  );
}
