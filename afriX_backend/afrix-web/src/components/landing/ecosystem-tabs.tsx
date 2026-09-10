"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  Cpu,
  Globe2,
  Lock,
  QrCode,
  ShieldCheck,
  Smartphone,
  Store,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

type PersonaKey = "individuals" | "merchants" | "agents" | "enterprises";

interface PersonaConfig {
  id: PersonaKey;
  label: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  color: string;
  activeBorder: string;
  bgLight: string;
  metrics: { label: string; value: string }[];
  highlightSnippet: {
    title: string;
    details: { [key: string]: string };
  };
}

const PERSONAS: PersonaConfig[] = [
  {
    id: "individuals",
    label: "Individuals & Diaspora",
    badge: "Consumer Loop",
    title: "Send, spend, and swap without cross-border borders",
    subtitle: "Multi-Token Non-Custodial Experience",
    description:
      "Send money to family in Lagos or Abidjan in under a minute. Hold NT, CT, and USDT with full ownership, transparent 0.5% P2P transfer fees, and seamless cash-in/cash-out through local bank transfers and mobile money.",
    features: [
      "Send value instantly using email, wallet address, or QR code",
      "Request tokens with customizable expiration (1, 3, 7, 30 days, or never)",
      "Scan-to-pay via in-app camera for peer payment requests and merchant checkouts",
      "Instant token swaps between NT (Naira), CT (CFA Franc), and USDT",
      "Escrow protection on every cash-out with independent agents",
      "Biometric security and non-custodial cryptographic keys",
    ],
    ctaLabel: "Get Started as User",
    ctaHref: "/login",
    color: "emerald",
    activeBorder: "border-emerald-500",
    bgLight: "bg-emerald-500/10",
    metrics: [
      { label: "P2P Transfer Fee", value: "0.5%" },
      { label: "Settlement Speed", value: "< 60s" },
      { label: "Supported Currencies", value: "NT, CT, USDT" },
    ],
    highlightSnippet: {
      title: "Consumer Rails Overview",
      details: {
        "Transfer Protocol": "Direct Peer-to-Peer On-Chain Settlement",
        "Request & Scan-to-Pay": "Live in-app camera scanner + expiring payment links",
        "Cash-In / Cash-Out": "Local Bank & Mobile Money via Verified Agents",
        "Security Layer": "Non-Custodial Multi-Currency Vault",
        "Fee Transparency": "Flat 0.5% Send / 1.5% Swap (Zero Hidden FX Markup)",
      },
    },
  },
  {
    id: "merchants",
    label: "Merchants & Ecommerce",
    badge: "Path A Checkout",
    title: "Accept token payments with ~2% fees and instant settlement",
    subtitle: "Hosted Checkout & Merchant API",
    description:
      "Stop losing sales to expensive card declines, 5% processing fees, and multi-day settlement windows. Accept NT and CT on your website via hosted checkout (/pay/[id]) or direct API with instant settlement into your merchant wallet.",
    features: [
      "Drop-in hosted checkout page (/pay/[transactionId]) for web and mobile",
      "Instant settlement directly to your AfriX merchant wallet",
      "Flat ~2% collection fee—slashing traditional international card processing fees",
      "Production-proven: actively powering PlugNG Shop (plugng.shop)",
    ],
    ctaLabel: "Open Merchant Account",
    ctaHref: "/merchant/register",
    secondaryCtaLabel: "View Hosted Checkout Demo",
    secondaryCtaHref: "/pay/preview",
    color: "teal",
    activeBorder: "border-teal-500",
    bgLight: "bg-teal-500/10",
    metrics: [
      { label: "Merchant Collection Fee", value: "2.0%" },
      { label: "Card Processing Savings", value: "Up to 60%" },
      { label: "Settlement Window", value: "Instant" },
    ],
    highlightSnippet: {
      title: "Merchant Integration Spec",
      details: {
        "Integration Mode": "Path A: REST API + Hosted Pay + Webhooks",
        "Settlement Speed": "Immediate credited to Merchant Balance",
        "Customer Payment Flow": "One-click wallet debit or QR scan",
        "Live Reference": "PlugNG Shop (plugng.shop)",
      },
    },
  },
  {
    id: "agents",
    label: "Liquidity Agents",
    badge: "Independent Facilitators",
    title: "Earn 24/7 by providing liquidity to your community",
    subtitle: "Agent Mint / Burn Network",
    description:
      "Become an authorized liquidity provider. Mint and burn tokens for users cashing in or cashing out with bank transfer and mobile money. Your capacity is safely backed by a verified USDT security deposit, protected by automated escrow.",
    features: [
      "Earn consistent volume-based commission on every mint and burn exchange",
      "Capacity allocated strictly from your verified USDT security deposit",
      "Built-in escrow engine ensures zero counterparty risk for honest agents",
      "Tiered growth progression from Starter to Bronze, Silver, Gold, and Platinum",
    ],
    ctaLabel: "Become an Agent",
    ctaHref: "/login",
    color: "cyan",
    activeBorder: "border-cyan-500",
    bgLight: "bg-cyan-500/10",
    metrics: [
      { label: "Uptime Network", value: "24/7/365" },
      { label: "Security Backing", value: "100% USDT Deposit" },
      { label: "Risk Mitigation", value: "System-Locked Escrow" },
    ],
    highlightSnippet: {
      title: "Agent Operational Rules",
      details: {
        "Role": "Facilitate local fiat ↔ NT/CT exchanges",
        "Capacity Formula": "Directly proportional to USDT Security Balance",
        "Dispute Safeguard": "Admin arbitration with cryptographic receipt proofs",
        "Performance Tiers": "Starter → Bronze → Silver → Gold → Platinum",
      },
    },
  },
  {
    id: "enterprises",
    label: "Marketplaces & Partners",
    badge: "Path B Integration",
    title: "Dedicated settlement rails for high-volume platforms",
    subtitle: "Custom Partner Integrations",
    description:
      "Empower multi-vendor marketplaces, payroll platforms, and regional logistics networks with custom tokenized rails. Keep your catalog, orders, and business logic on your side while AfriX handles cross-border settlement and payouts.",
    features: [
      "Server-to-server integration with HMAC-signed webhooks",
      "Dedicated CT-first settlement rail for Francophone West Africa (XOF)",
      "Automated vendor payouts and programmable split payments",
      "Production-proven: powering Kaalis Store cross-border trade (bruthol.com)",
    ],
    ctaLabel: "Explore Partner APIs",
    ctaHref: "#developers",
    color: "blue",
    activeBorder: "border-blue-500",
    bgLight: "bg-blue-500/10",
    metrics: [
      { label: "API Availability", value: "99.99%" },
      { label: "Webhook Signature", value: "HMAC SHA-256" },
      { label: "Live Partner", value: "Kaalis Store (bruthol.com)" },
    ],
    highlightSnippet: {
      title: "Path B Architecture",
      details: {
        "Protocol": "Server-to-Server Integration API + Signed Webhooks",
        "Target Rail": "XOF Francophone Zone (CT-First Strategy)",
        "Use Case": "Marketplace Vendor Escrow & Cross-Border Payouts",
        "Live Case Study": "Kaalis Store at bruthol.com",
      },
    },
  },
];

export default function EcosystemTabs() {
  const [activeTab, setActiveTab] = useState<PersonaKey>("individuals");

  const current = PERSONAS.find((p) => p.id === activeTab) || PERSONAS[0];

  return (
    <section id="ecosystem" className="py-24 relative overflow-hidden bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-mono uppercase tracking-widest">
            One Platform • Four Power Engines
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Built for everyone moving value in Africa
          </h2>
          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            From the consumer sending support home, to the merchant accepting cross-border checkout,
            to the local agent fueling liquidity.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center justify-start sm:justify-center overflow-x-auto pb-4 gap-2 sm:gap-3 scrollbar-none">
          {PERSONAS.map((item) => {
            const isActive = item.id === activeTab;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 border ${
                  isActive
                    ? "bg-slate-900 text-white border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    : "bg-slate-950 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-400" : "bg-slate-600"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Box */}
        <div className="mt-6 sm:mt-8 rounded-2xl sm:rounded-3xl bg-slate-900/40 border border-slate-800/80 p-5 sm:p-10 lg:p-12 backdrop-blur-xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content Area */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-medium">
                {current.badge}
              </div>

              <h3 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug">
                {current.title}
              </h3>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {current.description}
              </p>

              {/* Feature Checklist */}
              <div className="space-y-2.5 sm:space-y-3 pt-1 sm:pt-2">
                {current.features.map((feat) => (
                  <div key={feat} className="flex items-start gap-3">
                    <div className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400 mt-1 flex-shrink-0">
                      <CheckCircle2 size={15} />
                    </div>
                    <span className="text-xs sm:text-sm text-slate-300 font-medium">{feat}</span>
                  </div>
                ))}
              </div>

              {/* Action Links */}
              <div className="pt-2 sm:pt-4 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  href={current.ctaHref}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all transform hover:-translate-y-0.5"
                >
                  <span>{current.ctaLabel}</span>
                  <ArrowRight size={15} className="stroke-[2.5]" />
                </Link>

                {current.secondaryCtaLabel && (
                  <Link
                    href={current.secondaryCtaHref || "#"}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/50 text-slate-300 hover:text-white text-sm font-medium transition-colors"
                  >
                    <span>{current.secondaryCtaLabel}</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Right Card / Technical Spec Preview */}
            <div className="lg:col-span-5 space-y-5 sm:space-y-6">
              {/* Metrics row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                {current.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-950/80 border border-slate-800 text-center flex sm:flex-col items-center justify-between sm:justify-center px-4 sm:px-2"
                  >
                    <div className="text-[11px] sm:text-xs text-slate-400 font-mono">{m.label}</div>
                    <div className="text-sm sm:text-lg font-bold text-emerald-400 sm:mt-1 font-mono">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Technical Spec Box */}
              <div className="rounded-2xl bg-slate-950/90 border border-slate-800/90 p-4 sm:p-5 font-mono text-[11px] sm:text-xs space-y-3.5 sm:space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-slate-300 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {current.highlightSnippet.title}
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    VERIFIED
                  </span>
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                  {Object.entries(current.highlightSnippet.details).map(([key, val]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-slate-500">{key}:</span>
                      <span className="text-slate-200 font-medium sm:text-right">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
