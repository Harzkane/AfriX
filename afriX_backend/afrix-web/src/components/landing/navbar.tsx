"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Menu, ShieldCheck, Sparkles, X } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "Ecosystem", href: "#ecosystem" },
  { label: "Rates & Swap", href: "#calculator", badge: "Live" },
  { label: "For Merchants", href: "#merchants" },
  { label: "Liquidity Agents", href: "#agents" },
  { label: "Developers", href: "#developers" },
  { label: "Why AfriX", href: "#comparison" },
];

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#030712]/80 backdrop-blur-xl border-b border-emerald-500/15 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="#top" className="flex items-center gap-3 group flex-shrink-0">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-tr from-emerald-500/20 to-emerald-400/10 border border-emerald-500/30 flex items-center justify-center p-1 group-hover:border-emerald-400/60 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
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
              <span className="text-emerald-400 ml-0.5 relative">
                X
                <span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </span>
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 -mt-1">
              Settlement Rails
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 bg-slate-900/60 border border-slate-800/80 rounded-full px-2.5 xl:px-4 py-1.5 backdrop-blur-md shadow-inner whitespace-nowrap flex-shrink-0">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="relative px-2.5 xl:px-3.5 py-1.5 text-xs xl:text-sm font-medium text-slate-300 hover:text-white rounded-full transition-colors duration-200 flex items-center gap-1.5 group whitespace-nowrap"
            >
              <span>{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold group-hover:bg-emerald-500/25 transition-colors">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-3 flex-shrink-0 whitespace-nowrap">
          <Link
            href="/login"
            className="text-xs xl:text-sm font-medium text-slate-300 hover:text-white px-2.5 xl:px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
          >
            Sign in
          </Link>
          <Link
            href="/merchant/register"
            className="text-xs font-mono font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 px-3 xl:px-3.5 py-2 rounded-lg transition-all whitespace-nowrap"
          >
            Merchant Portal
          </Link>
          <Link
            href="#calculator"
            className="relative inline-flex items-center gap-2 px-3.5 xl:px-4 py-2 rounded-lg text-xs xl:text-sm font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 shadow-[0_0_20px_rgba(52,211,153,0.35)] hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            <span>Explore Rails</span>
            <ArrowRight size={14} className="stroke-[2.5]" />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#030712]/95 border-b border-slate-800 backdrop-blur-2xl px-6 py-6 transition-all duration-300">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2 text-base font-medium text-slate-200 hover:text-emerald-400 border-b border-slate-800/60"
              >
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight size={16} className="text-slate-500" />
                )}
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-slate-700 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/merchant/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-sm font-semibold text-emerald-400 hover:bg-emerald-900/50 transition-colors"
              >
                Open Merchant Account
              </Link>
              <Link
                href="#calculator"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(52,211,153,0.3)]"
              >
                Launch Exchange Simulator
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
