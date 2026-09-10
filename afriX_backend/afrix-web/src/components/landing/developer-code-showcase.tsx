"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Terminal, ExternalLink, Code2, Download } from "lucide-react";

type CodeLang = "curl" | "node" | "webhook";

export default function DeveloperCodeShowcase() {
  const [activeTab, setActiveTab] = useState<CodeLang>("curl");
  const [copied, setCopied] = useState(false);

  const codeSnippets: Record<CodeLang, { title: string; filename: string; code: string }> = {
    curl: {
      title: "cURL",
      filename: "create-payment.sh",
      code: `curl -X POST https://api.afrix.io/api/v1/payments \\
  -H "Authorization: Bearer afx_live_sec_99a8b..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 25000,
    "token": "CT",
    "customer_email": "amara.kone@abidjan-commerce.ci",
    "description": "Invoice #INV-4921: Premium Coffee Beans",
    "callback_url": "https://merchant.com/checkout/callback",
    "metadata": {
      "order_id": "ORD-8392",
      "zone": "WAEMU_XOF"
    }
  }'`,
    },
    node: {
      title: "Node.js / TypeScript",
      filename: "afrix-client.ts",
      code: `import { AfriXClient } from "@afrix/sdk";

const afrix = new AfriXClient({
  apiKey: process.env.AFRIX_SECRET_KEY,
  environment: "production",
});

// Create an instant checkout request (Path A)
const payment = await afrix.payments.create({
  amount: 25000,
  token: "CT", // CFA Franc token (1 CT ≈ 1 XOF)
  customerEmail: "amara.kone@abidjan-commerce.ci",
  description: "Invoice #INV-4921",
  expiresInDays: 7,
});

console.log("Hosted Payment URL:", payment.paymentUrl);
// Returns: https://app.afrix.io/pay/RQST-8F3A7K?amount=25000&token=CT`,
    },
    webhook: {
      title: "Webhook Verification",
      filename: "webhook-handler.js",
      code: `// Secure HMAC-SHA256 signature verification
app.post("/api/webhooks/afrix", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-afrix-signature"];
  const isValid = afrix.webhooks.verifySignature(
    req.body,
    signature,
    process.env.AFRIX_WEBHOOK_SECRET
  );

  if (!isValid) return res.status(401).send("Invalid Signature");

  const event = JSON.parse(req.body);
  if (event.event === "payment.completed") {
    const { transaction_id, amount, token } = event.data;
    console.log(\`Received \${amount} \${token} for Tx \${transaction_id}\`);
    // Fulfill customer order immediately
  }

  res.status(200).json({ received: true });
});`,
    },
  };

  const currentSnippet = codeSnippets[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="developers" className="py-24 relative overflow-hidden bg-slate-950">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Developer Overview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-blue-400 text-xs font-mono uppercase tracking-widest">
              <Code2 size={13} />
              Developer Rails
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              One API to unlock cross-border settlement
            </h2>

            <p className="text-slate-300 text-base leading-relaxed">
              Integrate AfriX payment requests, hosted checkouts, and real-time webhook listeners into your
              application with just a few lines of code. Built with strict idempotency, cryptographic webhook
              signing, and comprehensive sandbox environments.
            </p>

            {/* Feature List */}
            <div className="space-y-3 pt-2 text-sm text-slate-300 font-medium">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>RESTful JSON API with authenticated Bearer tokens</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                <span>HMAC-SHA256 signature verification on all webhook callbacks</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Full Postman collection and sandbox test fixtures available</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/AfriExchange_API.postman_collection.json"
                download
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white text-xs font-mono font-medium transition-colors"
              >
                <Download size={14} className="text-emerald-400" />
                <span>Download Postman Collection</span>
              </Link>
              <Link
                href="/merchant/register"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
              >
                <span>Generate API Keys in Merchant Portal</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>

          {/* Right Column: Code Terminal Mockup */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-[#090d16] border border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
              {/* Terminal Window Header */}
              <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="text-xs font-mono text-slate-400 ml-2 hidden sm:inline-block">
                    {currentSnippet.filename}
                  </span>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                  {(["curl", "node", "webhook"] as CodeLang[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                        activeTab === tab
                          ? "bg-slate-800 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {codeSnippets[tab].title}
                    </button>
                  ))}
                </div>

                {/* Copy button */}
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-mono"
                  title="Copy code"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span className="text-emerald-400 text-[11px]">Copied</span>
                    </>
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>

              {/* Code block */}
              <div className="p-6 font-mono text-xs leading-relaxed overflow-x-auto text-slate-300 scrollbar-thin scrollbar-thumb-slate-800">
                <pre className="text-slate-300">
                  <code>{currentSnippet.code}</code>
                </pre>
              </div>

              {/* Status footer bar */}
              <div className="px-5 py-2.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>api.afrix.io (HTTP 200 OK)</span>
                </div>
                <span>REST / v1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
