"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "What are NT and CT tokens?",
    answer:
      "NT (AfriX Naira Token) and CT (AfriX CFA Franc Token) are digital settlement tokens with reference pegs: 1 NT ≈ 1 Nigerian Naira (NGN), and 1 CT ≈ 1 West/Central African CFA Franc (XOF). They allow value to move instantly across currency zones 24/7 without waiting for traditional banking clearance windows or expensive correspondent bank routing.",
  },
  {
    question: "How do independent liquidity agents protect my money?",
    answer:
      "All authorized liquidity agents must maintain a verified USDT security deposit with AfriX. An agent's transactional capacity is strictly capped by their available collateral. When you sell tokens (burn/cash-out), your tokens are securely held in automated escrow and are only released once you explicitly confirm that the fiat has safely arrived in your local bank or mobile money account.",
  },
  {
    question: "What are the fees on the platform?",
    answer:
      "AfriX operates with complete fee transparency: Peer-to-peer (P2P) transfers carry a flat 0.5% network fee. In-app token swaps (e.g., NT ↔ CT or USDT) carry a 1.5% fee. Merchant payment collections carry a flat ~2.0% fee—up to 60% cheaper than traditional cross-border card processors. There are no hidden foreign exchange markups or surprise maintenance deductions.",
  },
  {
    question: "How do merchants accept payments (Path A vs. Path B)?",
    answer:
      "Merchants can choose between two proven paths: Path A (Standard Merchant) lets ecommerce stores create payment links, redirect buyers to our hosted checkout page (/pay/[id]), and receive real-time HMAC-signed webhooks. Path B (Marketplace Partner) offers custom server-to-server integration for multi-vendor platforms (such as Kaalis Store) to handle vendor collections, splits, and programmable payouts.",
  },
  {
    question: "Is AfriX a bank?",
    answer:
      "No. AfriX is a commerce technology infrastructure provider and decentralized settlement network—not a fractional reserve bank. We build the non-custodial software rails, smart escrow engines, and verification protocols that connect users, merchants, and independent peer agents.",
  },
  {
    question: "How do 'Request Tokens' and in-app Scan-to-Pay work?",
    answer:
      "You can request tokens from anyone by setting an amount, token type (NT, CT, or USDT), note, and optional expiration window (1, 3, 7, 30 days, or never). AfriX generates a shareable payment link and QR code. The payer can scan the QR code using their AfriX in-app camera or open the hosted payment page on the web to pay instantly from their wallet with automated status verification.",
  },
  {
    question: "How do I get started as a developer?",
    answer:
      "You can sign up for the Merchant Portal to generate API keys, test in our sandbox environment, and download our complete Postman Collection. Integration takes less than 30 minutes with our RESTful endpoints and HMAC-SHA256 webhook specifications.",
  },
];

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16 space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-mono uppercase tracking-widest">
            <HelpCircle size={13} />
            Got Questions?
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Everything you need to know about the rails, tokens, security, and integration paths.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3 sm:space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-slate-700"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full py-4 px-4 sm:py-5 sm:px-6 text-left flex items-center justify-between gap-3 sm:gap-4 font-semibold text-slate-200 hover:text-white transition-colors"
                >
                  <span className="text-sm sm:text-lg pr-2">{faq.question}</span>
                  <div
                    className={`p-1.5 rounded-full bg-slate-800 text-slate-400 transform transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? "rotate-180 text-emerald-400" : ""
                    }`}
                  >
                    <ChevronDown size={17} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 sm:px-6 sm:pb-6 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 font-normal">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
