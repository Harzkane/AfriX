"use client";

import { useState, useMemo } from "react";
import { ArrowDownUp, ArrowRight, CheckCircle, Clock, Info, ShieldCheck, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

type TokenType = "NT" | "CT" | "USDT";

interface TokenInfo {
  code: TokenType;
  name: string;
  symbol: string;
  flag: string;
  unitValueInUsd: number; // reference peg: 1 USDT = 1.0, 1 NT = 1/1500 USD, 1 CT = 1/600 USD
  description: string;
}

const TOKENS: Record<TokenType, TokenInfo> = {
  NT: {
    code: "NT",
    name: "AfriX Naira Token",
    symbol: "₦",
    flag: "🇳🇬",
    unitValueInUsd: 1 / 1500,
    description: "1 NT ≈ 1 Nigerian Naira (NGN)",
  },
  CT: {
    code: "CT",
    name: "AfriX CFA Franc Token",
    symbol: "CFA",
    flag: "🇨🇮",
    unitValueInUsd: 1 / 600,
    description: "1 CT ≈ 1 West/Central African CFA Franc (XOF)",
  },
  USDT: {
    code: "USDT",
    name: "Tether USD",
    symbol: "$",
    flag: "🌐",
    unitValueInUsd: 1.0,
    description: "Global US Dollar Stablecoin",
  },
};

export default function CurrencyCalculator() {
  const [fromToken, setFromToken] = useState<TokenType>("NT");
  const [toToken, setToToken] = useState<TokenType>("CT");
  const [sendAmount, setSendAmount] = useState<string>("250000");

  const numSend = parseFloat(sendAmount) || 0;

  // Rate calculation
  const exchangeRate = useMemo(() => {
    const fromUsd = TOKENS[fromToken].unitValueInUsd;
    const toUsd = TOKENS[toToken].unitValueInUsd;
    return fromUsd / toUsd;
  }, [fromToken, toToken]);

  // Fee calculation (1.5% swap fee, 0.5% P2P fee)
  const swapFeePercent = 1.5;
  const feeAmount = (numSend * swapFeePercent) / 100;
  const netSend = Math.max(0, numSend - feeAmount);
  const receiveAmount = netSend * exchangeRate;

  const handleSwap = () => {
    const currentFrom = fromToken;
    setFromToken(toToken);
    setToToken(currentFrom);
  };

  const handlePreset = (val: string) => {
    setSendAmount(val);
  };

  return (
    <div
      id="calculator"
      className="relative rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-800/80 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.6)] overflow-hidden"
    >
      {/* Subtle glowing orb behind the card */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header of widget */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800/80">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Exchange Simulator
          </span>
          <h3 className="text-xl font-bold text-white mt-1.5">
            Instant Cross-Border Settlement
          </h3>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Settlement Time</div>
          <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1 justify-end">
            <Clock size={13} /> &lt; 60 seconds
          </div>
        </div>
      </div>

      {/* Currency conversion area */}
      <div className="mt-6 space-y-4">
        {/* 'You Send' Field */}
        <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 transition-all focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase font-mono tracking-wider">
              You Send
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {TOKENS[fromToken].description}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <input
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-white placeholder-slate-600 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0.00"
            />

            {/* Token Selector */}
            <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/80 rounded-xl p-1.5 shadow-inner">
              {(["NT", "CT", "USDT"] as TokenType[]).map((tok) => (
                <button
                  key={tok}
                  type="button"
                  onClick={() => {
                    if (tok === toToken) handleSwap();
                    else setFromToken(tok);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    fromToken === tok
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <span>{TOKENS[tok].flag}</span>
                  <span>{tok}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/60">
            <span className="text-[11px] text-slate-500 font-mono">Presets:</span>
            {(fromToken === "USDT" ? ["50", "100", "500", "1000"] : ["50000", "100000", "250000", "500000"]).map(
              (val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePreset(val)}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
                    sendAmount === val
                      ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                      : "border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  {Number(val).toLocaleString()} {fromToken}
                </button>
              )
            )}
          </div>
        </div>

        {/* Swap Direction Divider Button */}
        <div className="relative flex items-center justify-center my-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800/80" />
          </div>
          <button
            type="button"
            onClick={handleSwap}
            className="relative z-10 p-2.5 rounded-full bg-slate-800 hover:bg-emerald-500 text-slate-300 hover:text-slate-950 border border-slate-700 hover:border-emerald-400 transition-all duration-200 shadow-lg hover:shadow-emerald-500/30 transform hover:rotate-180"
            title="Swap currency direction"
          >
            <ArrowDownUp size={16} />
          </button>
        </div>

        {/* 'Recipient Receives' Field */}
        <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-emerald-400 uppercase font-mono tracking-wider flex items-center gap-1">
              <Sparkles size={13} />
              Recipient Receives
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {TOKENS[toToken].description}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 truncate">
              {receiveAmount > 0
                ? receiveAmount.toLocaleString("en-US", {
                    maximumFractionDigits: toToken === "USDT" ? 2 : 2,
                    minimumFractionDigits: 2,
                  })
                : "0.00"}
            </div>

            {/* To Token Selector */}
            <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/80 rounded-xl p-1.5 shadow-inner">
              {(["NT", "CT", "USDT"] as TokenType[]).map((tok) => (
                <button
                  key={tok}
                  type="button"
                  onClick={() => {
                    if (tok === fromToken) handleSwap();
                    else setToToken(tok);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    toToken === tok
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <span>{TOKENS[tok].flag}</span>
                  <span>{tok}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fee & Rate Summary Breakdown */}
      <div className="mt-5 p-4 rounded-xl bg-slate-950/50 border border-slate-800/70 space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5">
            <Info size={13} className="text-slate-500" />
            Indicative Rate
          </span>
          <span className="text-slate-200 font-semibold">
            1 {fromToken} ≈ {exchangeRate.toFixed(4)} {toToken}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-400">
          <span>Platform Fee ({swapFeePercent}% transparent)</span>
          <span className="text-slate-200">
            {feeAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })} {fromToken}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-800/60">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <ShieldCheck size={14} /> Escrow Protection
          </span>
          <span className="text-emerald-400 font-semibold">Guaranteed by Agent USDT Deposit</span>
        </div>
      </div>

      {/* Call to action */}
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/login"
          className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-sm text-center shadow-[0_0_25px_rgba(52,211,153,0.35)] hover:shadow-[0_0_35px_rgba(52,211,153,0.5)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          <span>Start Instant Transfer</span>
          <ArrowRight size={16} className="stroke-[2.5]" />
        </Link>
        <Link
          href="#merchants"
          className="w-full sm:w-auto py-3.5 px-5 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-900/60 text-slate-300 hover:text-white font-medium text-xs text-center transition-colors"
        >
          Accept on Your Store
        </Link>
      </div>
    </div>
  );
}
