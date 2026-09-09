"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Globe2,
  Menu,
  MoveUpRight,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import "./landing.css";

const navItems = [
  ["Product", "#product"],
  ["For agents", "#agents"],
  ["For businesses", "#businesses"],
  ["Why AfriX", "#why-afrix"],
];

const capabilities = [
  {
    number: "01",
    title: "A complete money loop",
    text: "Buy, send, receive, swap, and sell NT, CT, and USDT from one non-custodial wallet.",
    tag: "Individuals",
    color: "cream",
  },
  {
    number: "02",
    title: "A liquidity business",
    text: "Agents mint and burn tokens, grow capacity from a verified USDT deposit, and earn on volume.",
    tag: "Agents",
    color: "orange",
  },
  {
    number: "03",
    title: "Commerce that connects",
    text: "Accept token payments, settle to a wallet, and plug into hosted checkout, APIs, or webhooks.",
    tag: "Merchants",
    color: "blue",
  },
];

const platformFeatures = [
  ["Wallets", "Multi-token wallets for NT, CT, USDT, and more."],
  ["P2P movement", "Send and receive by email, wallet address, or QR."],
  ["Swap engine", "Exchange between tokens with visible rates and fees."],
  ["Buy & mint", "Buy tokens through local agents using bank or mobile money."],
  ["Sell & burn", "Cash out through escrow-backed agent settlement."],
  ["Escrow & disputes", "Protected transactions with evidence-based review."],
  ["Merchant portal", "Collections, settlement wallets, API keys, sandbox, and docs."],
  ["Partner rails", "Path A checkout or Path B marketplace APIs with signed webhooks."],
  ["Trust layer", "KYC, 2FA, biometrics, notifications, education, and auditability."],
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [from, setFrom] = useState("NGN");
  const [to, setTo] = useState("XOF");

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <main className="landing-page">
      <nav className="site-nav shell">
        <a className="wordmark" href="#top" aria-label="AfriX home">
          <span className="wordmark-mark">✳</span>
          <span>Afri<span>X</span></span>
        </a>
        <div className={`nav-links ${menuOpen ? "is-open" : ""}`}>
          {navItems.map(([label, href]) => (
            <a href={href} key={label} onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
          <a className="nav-login mobile-login" href="/login">Sign in <ArrowRight size={15} /></a>
        </div>
        <div className="nav-actions">
          <a className="nav-login" href="/login">Sign in <ArrowRight size={15} /></a>
          <a className="button button-small" href="#get-started">Get started <MoveUpRight size={14} /></a>
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> The rails for a moving Africa</div>
          <h1>Move value.<br /><em>Move forward.</em></h1>
          <p className="hero-lede">AfriX makes it easier to send, receive, exchange, and accept value across African markets. One trusted platform. More ways to move.</p>
          <div className="hero-ctas" id="get-started">
            <a className="button" href="/login">Explore AfriX <ArrowRight size={17} /></a>
            <a className="text-link" href="#product">See how it works <span>↓</span></a>
          </div>
          <div className="hero-note"><ShieldCheck size={16} /> Non-custodial infrastructure. Independent agents. Built for African commerce.</div>
        </div>

        <div className="hero-visual" aria-label="AfriX transfer preview">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="hero-glow" />
          <div className="transfer-card">
            <div className="card-topline"><span>Quick exchange</span><span className="live-dot">● Live</span></div>
            <div className="currency-row">
              <div><span className="field-label">You send</span><strong>250,000</strong><span className="currency">{from}</span></div>
              <button className="swap-button" onClick={swap} aria-label="Swap currencies"><ArrowRight size={17} /></button>
              <div className="align-right"><span className="field-label">They receive</span><strong>1,465.84</strong><span className="currency">{to}</span></div>
            </div>
            <div className="rate-line"><span>Indicative rate</span><span>1 {from} = 0.00586 {to}</span></div>
            <div className="route-line"><span className="route-icon"><Globe2 size={15} /></span><span>Across borders, without the friction</span><Zap size={15} /></div>
            <button className="card-button">Start a transfer <ArrowRight size={15} /></button>
          </div>
          <div className="floating-pill pill-top"><Sparkles size={14} /> One platform, many possibilities</div>
          <div className="floating-pill pill-bottom"><span className="avatar-stack"><i /><i /><i /></span> Trusted by people building across borders</div>
        </div>
      </section>

      <section className="signal-bar"><div className="shell signal-inner"><span>Designed for how Africa moves</span><span className="signal-line" /><span>One platform. Three powerful paths.</span></div></section>

      <section className="intro shell" id="why-afrix">
        <div className="section-kicker">A better way forward</div>
        <div className="intro-grid"><h2>Financial movement<br /><em>without the maze.</em></h2><p>From the first naira to the final settlement, AfriX connects the people, agents, and businesses that make cross-border value flow. We are building the infrastructure for a more connected continent.</p></div>
      </section>

      <section className="capabilities shell" id="product">
        {capabilities.map((item) => <article className={`capability-card ${item.color}`} key={item.number}><div className="capability-number">{item.number}</div><div className="capability-body"><span className="card-tag">{item.tag}</span><h3>{item.title}</h3><p>{item.text}</p><a href={item.tag === "Merchants" ? "#businesses" : "#get-started"}>Discover more <ArrowUpRight size={15} /></a></div></article>)}
      </section>

      <section className="visual-proof shell"><div className="section-kicker light-kicker">See the ecosystem in motion</div><h2>One platform.<br /><em>Many possibilities.</em></h2><div className="ecosystem-board"><div className="ecosystem-lines" /><div className="ecosystem-center"><span className="mini-x">X</span><strong>AfriX</strong><small>Secure · Transparent<br />Scalable · Trusted</small></div><div className="ecosystem-node node-users"><span>●</span><strong>Individuals</strong><small>Send · Receive · Swap</small></div><div className="ecosystem-node node-agents"><span>◉</span><strong>Agents</strong><small>Provide liquidity · Earn</small></div><div className="ecosystem-node node-merchants"><span>▣</span><strong>Merchants</strong><small>Accept payments · Grow</small></div><div className="ecosystem-node node-partners"><span>◆</span><strong>Partners</strong><small>Integrate · Expand</small></div><div className="ecosystem-caption">The infrastructure for African commerce</div></div><div className="built-flows"><article><span className="flow-icon flow-green">↗</span><div><strong>Consumer wallet</strong><p>Multi-token movement, designed for everyday life.</p></div></article><article><span className="flow-icon flow-blue">◌</span><div><strong>Agent network</strong><p>Independent liquidity with trust built in.</p></div></article><article><span className="flow-icon flow-purple">⌘</span><div><strong>Merchant rails</strong><p>Payments, settlement, APIs, and webhooks.</p></div></article></div></section>

      <section className="feature-matrix shell"><div className="section-kicker">The AfriX operating system</div><div className="feature-heading"><h2>Everything needed<br /><em>to move value.</em></h2><p>One connected layer for the people making payments, providing liquidity, accepting commerce, and building the next African marketplace.</p></div><div className="feature-grid">{platformFeatures.map(([title, text], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><strong>{title}</strong><p>{text}</p></article>)}</div></section>

      <section className="agents-section" id="agents"><div className="shell split-section"><div><div className="section-kicker light">For independent liquidity providers</div><h2>Liquidity is<br /><em>opportunity.</em></h2><p>Become the trusted local rail in your community. Complete KYC, activate with a verified USDT security deposit, then serve buy and sell requests with capacity, ratings, and clear rules behind you.</p><a className="button button-light" href="/login">Explore agent mode <ArrowRight size={17} /></a></div><div className="agent-stat"><span className="stat-label">The AfriX network</span><strong>24/7</strong><span className="stat-caption">mint, burn, earn<br />and grow your reputation</span><div className="stat-bars"><i /><i /><i /><i /><i /></div></div></div></section>

      <section className="business-section shell" id="businesses"><div className="business-heading"><div className="section-kicker">For merchants and partner platforms</div><h2>Commerce that<br /><em>keeps moving.</em></h2><p className="business-lede">From a single store to a multi-vendor marketplace, choose the path that fits your business.</p><a className="text-link dark-link" href="/merchant/register">Build with AfriX <ArrowRight size={16} /></a></div><div className="business-panel"><div className="panel-orb" /><div className="panel-content"><span className="card-tag">Two ways to integrate</span><h3>One payment layer.<br />Your way.</h3><ul><li><Check size={15} /> Path A: hosted checkout, API, portal, and webhooks</li><li><Check size={15} /> Path B: marketplace collections, payouts, and partner APIs</li><li><Check size={15} /> Settlement wallets, sandbox, docs, and operations</li></ul></div><div className="api-chip"><span>POST</span> /v1/integrations</div></div></section>

      <footer className="site-footer"><div className="shell footer-top"><div><a className="wordmark footer-mark" href="#top"><span className="wordmark-mark">✳</span><span>Afri<span>X</span></span></a><p>The rails for a moving Africa.</p></div><div className="footer-links"><div><span>Explore</span><a href="#product">Product</a><a href="#agents">Agents</a><a href="#businesses">Businesses</a></div><div><span>Company</span><a href="#why-afrix">Why AfriX</a><a href="/login">Sign in</a><a href="mailto:hello@afrix.app">Contact</a></div></div></div><div className="shell footer-bottom"><span>© 2026 AfriX. Built for movement.</span><span>Secure by design <ShieldCheck size={14} /></span></div></footer>
    </main>
  );
}
