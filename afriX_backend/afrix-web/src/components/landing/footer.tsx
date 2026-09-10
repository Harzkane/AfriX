"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUp, Github, Globe, Mail, ShieldCheck } from "lucide-react";

export default function LandingFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-slate-800 bg-[#030712] relative text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 pb-10 sm:pb-12 border-b border-slate-800/80">
          {/* Col 1: Brand & Bio */}
          <div className="sm:col-span-2 space-y-4">
            <Link href="#top" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-900 border border-emerald-500/30 flex items-center justify-center p-1">
                <Image
                  src="/afrix-logo.png"
                  alt="AfriX"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Afri<span className="text-emerald-400">X</span>
              </span>
            </Link>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              The programmable financial rails for African commerce. Enabling users, merchants, agents,
              and partner platforms to settle value instantly using non-custodial digital asset protocols.
            </p>

            <div className="pt-2 flex items-center gap-3 text-slate-400">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300">All Systems Operational</span>
              </div>
            </div>
          </div>

          {/* Col 2: Solutions */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">Solutions</div>
            <ul className="grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-2.5">
              <li>
                <Link href="#ecosystem" className="hover:text-emerald-400 transition-colors">
                  Consumer Wallet
                </Link>
              </li>
              <li>
                <Link href="#merchants" className="hover:text-emerald-400 transition-colors">
                  Merchant Hosted Pay
                </Link>
              </li>
              <li>
                <Link href="#agents" className="hover:text-emerald-400 transition-colors">
                  Liquidity Agents
                </Link>
              </li>
              <li>
                <Link href="#ecosystem" className="hover:text-emerald-400 transition-colors">
                  Marketplace Rails (Path B)
                </Link>
              </li>
              <li className="col-span-2 sm:col-span-1">
                <Link href="#calculator" className="hover:text-emerald-400 transition-colors">
                  Instant Exchange Simulator
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Developers & APIs */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">Developers</div>
            <ul className="grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-2.5">
              <li>
                <Link href="#developers" className="hover:text-emerald-400 transition-colors">
                  REST API Endpoints
                </Link>
              </li>
              <li>
                <Link href="/AfriExchange_API.postman_collection.json" download className="hover:text-emerald-400 transition-colors">
                  Postman Collection
                </Link>
              </li>
              <li>
                <Link href="#developers" className="hover:text-emerald-400 transition-colors">
                  HMAC Webhook Specs
                </Link>
              </li>
              <li>
                <Link href="/merchant/register" className="hover:text-emerald-400 transition-colors">
                  Sandbox API Keys
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform & Security */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">Governance</div>
            <ul className="grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-2.5">
              <li>
                <Link href="#comparison" className="hover:text-emerald-400 transition-colors">
                  Why AfriX
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-400 transition-colors">
                  Operator Login
                </Link>
              </li>
              <li>
                <Link href="/merchant/login" className="hover:text-emerald-400 transition-colors">
                  Merchant Sign In
                </Link>
              </li>
              <li>
                <a href="mailto:support@afrix.io" className="hover:text-emerald-400 transition-colors">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer & Regulatory Note */}
        <div className="py-6 border-b border-slate-800/60 text-[11px] text-slate-500 leading-relaxed">
          <p>
            <strong>Disclaimer:</strong> AfriExchange (AfriX) is a technology infrastructure platform and
            software marketplace connecting users, independent liquidity agents, and commercial merchants.
            Digital assets (NT, CT) represent cryptographic settlement units pegged to reference currency rates
            and are not sovereign legal tender. AfriX is non-custodial and does not engage in fractional reserve
            banking activities.
          </p>
        </div>

        {/* Bottom copyright & Scroll To Top */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-xs">
          <div>© {new Date().getFullYear()} AfriExchange Protocol. Built for a moving Africa.</div>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <span>Back to top</span>
            <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </footer>
  );
}
