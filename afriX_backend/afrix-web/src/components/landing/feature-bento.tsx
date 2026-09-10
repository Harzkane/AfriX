"use client";

import {
  Coins,
  Cpu,
  Fingerprint,
  Layers,
  Lock,
  QrCode,
  Scale,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";

export default function FeatureBento() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-teal-400 text-xs font-mono uppercase tracking-widest">
            Architecture & Protocols
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Engineered for trust. Built for scale.
          </h2>
          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Every layer of AfriX is purpose-built to eliminate the historical barriers of cross-border
            remittance and fragmented commerce across the African continent.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Multi-Token Engine (Large span) */}
          <div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-slate-800/80 p-8 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Coins size={24} />
              </div>
              <div>
                <span className="text-xs font-mono text-emerald-400 font-medium uppercase tracking-wider">
                  Triple Asset Rail
                </span>
                <h3 className="text-xl font-bold text-white">NT, CT, & USDT Interoperability</h3>
              </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed mb-6 max-w-xl">
              Hold and swap between the Nigerian Naira digital token (NT), Francophone West African CFA
              digital token (CT), and global Tether (USDT). Programmatic liquidity bridges local economies
              directly without traditional correspondent banking friction.
            </p>

            {/* Visual Token Badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
                <span className="text-xl">🇳🇬</span>
                <div>
                  <div className="text-xs font-bold text-white font-mono">NT (Naira)</div>
                  <div className="text-[10px] text-slate-400 font-mono">1 NT ≈ 1 NGN</div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
                <span className="text-xl">🇨🇮</span>
                <div>
                  <div className="text-xs font-bold text-white font-mono">CT (CFA)</div>
                  <div className="text-[10px] text-slate-400 font-mono">1 CT ≈ 1 XOF</div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
                <span className="text-xl">🌐</span>
                <div>
                  <div className="text-xs font-bold text-white font-mono">USDT</div>
                  <div className="text-[10px] text-slate-400 font-mono">Global Dollar</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Smart Escrow Safeguard */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-8 relative overflow-hidden group hover:border-teal-500/40 transition-all duration-300">
            <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 w-fit mb-6">
              <ShieldCheck size={24} />
            </div>

            <span className="text-xs font-mono text-teal-400 font-medium uppercase tracking-wider block mb-1">
              Zero Counterparty Risk
            </span>
            <h3 className="text-xl font-bold text-white mb-3">Smart Lock Escrow</h3>

            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              When cashing out or trading, tokens are programmatically locked into escrow. They are released only
              after the recipient explicitly verifies fiat receipt.
            </p>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs font-mono text-slate-400 space-y-1.5">
              <div className="text-teal-400 font-bold flex items-center gap-1.5">
                <Lock size={12} /> Escrow State Machine
              </div>
              <div>Initiate → Token Lock → Fiat Transfer → Confirm & Release</div>
            </div>
          </div>

          {/* Card 3: 24/7 Agent Mint/Burn Network */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-8 relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 w-fit mb-6">
              <Zap size={24} />
            </div>

            <span className="text-xs font-mono text-cyan-400 font-medium uppercase tracking-wider block mb-1">
              Localized Liquidity
            </span>
            <h3 className="text-xl font-bold text-white mb-3">24/7 Independent Agents</h3>

            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Authorized local agents facilitate cash-in and cash-out via local bank rails and mobile money
              networks, operating whenever you need them.
            </p>

            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-3 border-t border-slate-800">
              <span>Security Collateral:</span>
              <span className="text-emerald-400 font-bold">100% USDT Backed</span>
            </div>
          </div>

          {/* Card 4: Developer-First Commerce API (Large span) */}
          <div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-slate-800/80 p-8 relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Cpu size={24} />
              </div>
              <div>
                <span className="text-xs font-mono text-blue-400 font-medium uppercase tracking-wider">
                  Two Integration Paths
                </span>
                <h3 className="text-xl font-bold text-white">Path A Checkout & Path B Marketplace Rails</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="text-sm font-bold text-white flex items-center justify-between">
                  <span>Path A: Standard Merchant</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    PlugNG Shop
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Single-merchant ecommerce. Create payment links, redirect customers to /pay/[id], receive
                  instant callbacks via HMAC webhooks.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="text-sm font-bold text-white flex items-center justify-between">
                  <span>Path B: Marketplace Rail</span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                    Kaalis Store
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Multi-vendor marketplace infrastructure. Collect payments and execute programmable vendor payouts
                  with custom settlement logic.
                </p>
              </div>
            </div>
          </div>

          {/* Card 5: Institutional Security */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-8 relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 w-fit mb-6">
              <Fingerprint size={24} />
            </div>

            <span className="text-xs font-mono text-purple-400 font-medium uppercase tracking-wider block mb-1">
              Account Hardening
            </span>
            <h3 className="text-xl font-bold text-white mb-3">Biometrics & 2FA</h3>

            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Time-based OTPs, biometric lock mechanisms, tier-based KYC validation, and immutable transaction audit
              trails protect every transfer.
            </p>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Arbitration Review:</span>
              <span className="text-purple-400 font-semibold">Evidence-Based</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
