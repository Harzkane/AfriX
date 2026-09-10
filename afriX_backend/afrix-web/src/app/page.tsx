"use client";

import "./landing.css";
import LandingNavbar from "@/components/landing/navbar";
import LandingHero from "@/components/landing/hero";
import SignalTicker from "@/components/landing/signal-ticker";
import EcosystemTabs from "@/components/landing/ecosystem-tabs";
import FeatureBento from "@/components/landing/feature-bento";
import DeveloperCodeShowcase from "@/components/landing/developer-code-showcase";
import ComparisonTable from "@/components/landing/comparison-table";
import TrustSecurity from "@/components/landing/trust-security";
import FAQAccordion from "@/components/landing/faq-accordion";
import CTASection from "@/components/landing/cta-section";
import LandingFooter from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans antialiased">
      {/* Sticky Glassmorphic Navbar */}
      <LandingNavbar />

      {/* Main Content Sections */}
      <main id="top" className="flex flex-col">
        {/* 1. Hero with Value Prop & Interactive Live Simulator */}
        <LandingHero />

        {/* 2. Proof & Signals Strip */}
        <SignalTicker />

        {/* 3. Core Ecosystem Personas: Individuals, Merchants, Agents, Enterprise */}
        <div id="merchants">
          <div id="agents">
            <EcosystemTabs />
          </div>
        </div>

        {/* 4. Bento Feature Matrix */}
        <FeatureBento />

        {/* 5. Developer API & Code Showcase */}
        <DeveloperCodeShowcase />

        {/* 6. Comparison Table (AfriX vs Traditional Banks vs Legacy Remittance) */}
        <ComparisonTable />

        {/* 7. Trust, Non-Custodial Safeguards & Escrow Security */}
        <TrustSecurity />

        {/* 8. Interactive FAQ Accordion */}
        <FAQAccordion />

        {/* 9. Final Radiant Call to Action */}
        <CTASection />
      </main>

      {/* Comprehensive Fintech Footer */}
      <LandingFooter />
    </div>
  );
}
