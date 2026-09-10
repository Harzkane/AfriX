"use client";

import { ShieldCheck, Lock, Scale, AlertCircle, FileCheck, CheckCircle2 } from "lucide-react";

export default function TrustSecurity() {
  const securityPillars = [
    {
      icon: Lock,
      title: "USDT Collateral Backing",
      desc: "Every liquidity agent is strictly bound to their verified USDT security deposit. An agent cannot accept mint or burn orders exceeding their liquid collateral limit.",
    },
    {
      icon: ShieldCheck,
      title: "Smart Escrow Protocol",
      desc: "During token sell and cash-out operations, digital tokens remain securely locked in the smart contract until the user confirms fiat receipt in their local bank or mobile money account.",
    },
    {
      icon: Scale,
      title: "Evidence-Based Dispute Resolution",
      desc: "If any disagreement arises between a user and an agent, our administrative arbitration system reviews cryptographic proof and bank receipts to release funds safely.",
    },
    {
      icon: FileCheck,
      title: "Non-Custodial Infrastructure",
      desc: "AfriX is a technology protocol and settlement network—not a fractional reserve bank. You maintain custody and programmatic control over your digital token balances.",
    },
  ];

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden bg-slate-900/30 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-slate-800 p-5 sm:p-10 lg:p-16 relative overflow-hidden shadow-2xl">
          {/* Subtle glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
            {/* Left intro */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-widest">
                <ShieldCheck size={14} />
                Trust & Security Architecture
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Built to eliminate fraud and preserve certainty
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Traditional cash-for-crypto exchanges suffer from chargebacks, counterparty defaults, and
                ghosting. AfriX resolves this through mathematical escrow and required capital collateral.
              </p>

              {/* Compliance Notice */}
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] sm:text-xs text-slate-400 leading-relaxed flex items-start gap-2.5 sm:gap-3">
                <AlertCircle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">Legal Architecture Note:</strong> AfriX tokens (NT, CT)
                  are digital settlement vouchers pegged to local currency reference rates. AfriX does not operate
                  as a commercial bank; all fiat exchanges are fulfilled by independent, licensed peer agents.
                </span>
              </div>
            </div>

            {/* Right Pillars Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
              {securityPillars.map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.title}
                    className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/30 transition-all duration-200 space-y-2.5 sm:space-y-3"
                  >
                    <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
                      <Icon size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white">{p.title}</h3>
                    <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
