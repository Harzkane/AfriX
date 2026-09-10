"use client";

import { CheckCircle2, Clock, Globe, ShieldCheck, Sparkles, Zap, Lock, Store } from "lucide-react";

export default function SignalTicker() {
  const signals = [
    {
      icon: Clock,
      label: "Sub-60s Settlement",
      detail: "Instant P2P & merchant checkout",
      color: "text-emerald-400",
    },
    {
      icon: ShieldCheck,
      label: "Non-Custodial Escrow",
      detail: "Agent capacity secured by USDT",
      color: "text-teal-400",
    },
    {
      icon: Store,
      label: "Live Merchant Rails",
      detail: "PlugNG Shop & Kaalis Store active",
      color: "text-blue-400",
    },
    {
      icon: Globe,
      label: "Pan-African Liquidity",
      detail: "NGN (NT) ↔ XOF (CT) ↔ USDT",
      color: "text-amber-400",
    },
    {
      icon: Lock,
      label: "Audited Protocols",
      detail: "2FA, biometrics & dispute proofs",
      color: "text-purple-400",
    },
  ];

  return (
    <div className="w-full border-y border-slate-800/80 bg-slate-950/60 backdrop-blur-md relative overflow-hidden py-4">
      {/* Background ambient gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 items-center">
          {signals.map((sig, idx) => {
            const Icon = sig.icon;
            return (
              <div
                key={sig.label}
                className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/30 border border-slate-800/40 hover:border-emerald-500/30 hover:bg-slate-900/60 transition-all duration-200 group"
              >
                <div className={`p-2 rounded-lg bg-slate-800/80 ${sig.color} group-hover:scale-110 transition-transform duration-200 shadow-sm`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                    {sig.label}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate font-mono">
                    {sig.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
