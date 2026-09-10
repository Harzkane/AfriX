"use client";

import { Check, X, Minus, ShieldCheck, Sparkles } from "lucide-react";

interface ComparisonRow {
  feature: string;
  afrix: string;
  banks: string;
  remittance: string;
  isAfrixWinner: boolean;
}

const COMPARISON_DATA: ComparisonRow[] = [
  {
    feature: "Cross-Border Settlement Time",
    afrix: "Under 60 seconds (Instant)",
    banks: "2 to 5 business days",
    remittance: "1 to 24 hours",
    isAfrixWinner: true,
  },
  {
    feature: "P2P / Transfer Fee",
    afrix: "0.5% transparent flat fee",
    banks: "$25 - $50 + hidden FX spreads",
    remittance: "7% - 14% high fee margins",
    isAfrixWinner: true,
  },
  {
    feature: "Merchant Processing Fee",
    afrix: "~2.0% direct to wallet",
    banks: "3.5% - 5.0% + cross-border surcharges",
    remittance: "Not built for ecommerce",
    isAfrixWinner: true,
  },
  {
    feature: "24/7/365 Weekend Operation",
    afrix: "Always live (Independent Agents)",
    banks: "Strict banking hours only",
    remittance: "Physical branch hours",
    isAfrixWinner: true,
  },
  {
    feature: "Transaction Protection",
    afrix: "Automated Smart Escrow + Arbitration",
    banks: "Irreversible wire transfers",
    remittance: "Manual receipt verification",
    isAfrixWinner: true,
  },
  {
    feature: "Modern Developer APIs & Webhooks",
    afrix: "Instant REST APIs + HMAC webhooks",
    banks: "Legacy batch files & paper forms",
    remittance: "No merchant API",
    isAfrixWinner: true,
  },
  {
    feature: "Asset Custody Standard",
    afrix: "Non-custodial user wallets",
    banks: "Centralized fractional accounts",
    remittance: "Third-party holding",
    isAfrixWinner: true,
  },
];

export default function ComparisonTable() {
  return (
    <section id="comparison" className="py-16 sm:py-24 relative overflow-hidden bg-slate-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-mono uppercase tracking-widest">
            The New Benchmark
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Why Africa is moving to AfriX
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-slate-300 font-normal leading-relaxed">
            See how programmable token settlement compares against legacy wire transfers and traditional
            remittance kiosks.
          </p>
        </div>

        {/* Mobile Swipe Hint */}
        <div className="sm:hidden flex items-center justify-end gap-1.5 text-[11px] font-mono text-slate-400 mb-2.5 px-1">
          <span>Scroll horizontally</span>
          <span className="text-emerald-400 font-bold">→</span>
        </div>

        {/* Table Container */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800">
            <table className="w-full min-w-[640px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80">
                  <th className="py-4 sm:py-5 px-4 sm:px-6 text-xs sm:text-sm font-semibold text-slate-300 w-1/3">
                    Feature & Capabilities
                  </th>
                  <th className="py-4 sm:py-5 px-4 sm:px-6 text-xs sm:text-sm font-bold text-emerald-400 bg-emerald-500/10 border-x border-emerald-500/20 w-1/4">
                    <div className="flex items-center gap-2">
                      <Sparkles size={15} className="text-emerald-400" />
                      <span>AfriX Rails</span>
                    </div>
                  </th>
                  <th className="py-4 sm:py-5 px-4 sm:px-6 text-xs sm:text-sm font-medium text-slate-400 w-1/5">
                    Traditional Banks
                  </th>
                  <th className="py-4 sm:py-5 px-4 sm:px-6 text-xs sm:text-sm font-medium text-slate-400 w-1/5">
                    Legacy Remittance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
                {COMPARISON_DATA.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={`hover:bg-slate-900/50 transition-colors ${
                      idx % 2 === 0 ? "bg-transparent" : "bg-slate-950/30"
                    }`}
                  >
                    <td className="py-3.5 sm:py-4 px-4 sm:px-6 font-medium text-slate-200">
                      {row.feature}
                    </td>
                    <td className="py-3.5 sm:py-4 px-4 sm:px-6 font-semibold text-emerald-400 bg-emerald-500/5 border-x border-emerald-500/15">
                      <div className="flex items-center gap-2">
                        <Check size={15} className="text-emerald-400 flex-shrink-0" />
                        <span>{row.afrix}</span>
                      </div>
                    </td>
                    <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-slate-400 font-mono text-[11px] sm:text-xs">
                      {row.banks}
                    </td>
                    <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-slate-400 font-mono text-[11px] sm:text-xs">
                      {row.remittance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
