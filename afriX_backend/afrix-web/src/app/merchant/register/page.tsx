"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe2,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Store,
  User,
} from "lucide-react";

import merchantApi from "@/lib/merchant-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

type RegisterForm = {
  full_name: string;
  email: string;
  password: string;
  country_code: string;
  business_name: string;
  display_name: string;
  business_type: string;
  description: string;
  business_email: string;
  business_phone: string;
  country: string;
  city: string;
  address: string;
  default_token_type: string;
};

const INITIAL_FORM: RegisterForm = {
  full_name: "",
  email: "",
  password: "",
  country_code: "NG",
  business_name: "",
  display_name: "",
  business_type: "ecommerce",
  description: "",
  business_email: "",
  business_phone: "",
  country: "NG",
  city: "",
  address: "",
  default_token_type: "CT",
};

const XOF_COUNTRIES = [
  { value: "SN", label: "Senegal (SN)" },
  { value: "CI", label: "Cote d'Ivoire (CI)" },
  { value: "BJ", label: "Benin (BJ)" },
  { value: "BF", label: "Burkina Faso (BF)" },
  { value: "ML", label: "Mali (ML)" },
  { value: "NE", label: "Niger (NE)" },
  { value: "TG", label: "Togo (TG)" },
  { value: "GW", label: "Guinea-Bissau (GW)" },
];

const NIGERIA = { value: "NG", label: "Nigeria (NG)" };

export default function MerchantRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field: keyof RegisterForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const authResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        country_code: form.country_code,
      });

      const authData = authResponse.data?.data;
      const token = authData?.tokens?.access_token;
      const user = authData?.user;

      if (!token || !user) {
        throw new Error("Registration completed but no login token was returned");
      }

      await merchantApi.post(
        "/merchants/register",
        {
          business_name: form.business_name,
          display_name: form.display_name,
          business_type: form.business_type,
          description: form.description,
          business_email: form.business_email,
          business_phone: form.business_phone,
          country: form.country,
          city: form.city,
          address: form.address,
          default_token_type: form.default_token_type,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const merchantUser = { ...user, role: "merchant" };
      Cookies.set("merchant_token", token, { expires: 7 });
      localStorage.setItem("merchant_token", token);
      localStorage.setItem("merchant_user", JSON.stringify(merchantUser));

      router.push("/merchant");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error?.message ||
          err.message ||
          "Unable to create merchant profile"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#030712] text-slate-100 overflow-hidden font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Background ambient lighting */}
      <div className="absolute top-1/6 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-emerald-600/15 via-teal-500/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Navbar Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-slate-900 border border-emerald-500/30 flex items-center justify-center p-1 group-hover:border-emerald-400/60 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
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
              <span className="text-emerald-400 ml-0.5">X</span>
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 -mt-1">
              Merchant Registration
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Landing</span>
        </Link>
      </header>

      {/* Main Registration Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-3xl">
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/95 border border-slate-800/90 p-6 sm:p-10 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.7)] relative overflow-hidden">
            {/* Top radiant glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

            <div className="space-y-8">
              {/* Header inside card */}
              <div className="space-y-2 text-center max-w-xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-medium">
                  <Sparkles size={13} />
                  <span>Two-in-One Instant Onboarding</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                  Open Merchant Account
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Register your user credentials and merchant profile in one seamless flow. Start accepting cross-border NT and CT payments immediately.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="bg-rose-950/50 border-rose-800/80 text-rose-200">
                    <AlertCircle className="h-4 w-4 text-rose-400" />
                    <AlertTitle className="text-xs font-bold font-mono">Registration Incomplete</AlertTitle>
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Section 1: User & Credentials */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    <User size={14} />
                    <span>Step 1: User Account Credentials</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="full_name" className="text-xs font-mono text-slate-300">
                        Full Name
                      </Label>
                      <Input
                        id="full_name"
                        placeholder="Amara Kone"
                        value={form.full_name}
                        onChange={(e) => handleChange("full_name", e.target.value)}
                        required
                        className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 rounded-xl h-11 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-mono text-slate-300">
                        Personal / Account Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="amara@business.com"
                        value={form.email}
                        onChange={(e) => {
                          handleChange("email", e.target.value);
                          handleChange("business_email", e.target.value);
                        }}
                        required
                        className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 rounded-xl h-11 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-xs font-mono text-slate-300">
                        Account Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••••••"
                        value={form.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        required
                        className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 rounded-xl h-11 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-mono text-slate-300">
                        Operating Country
                      </Label>
                      <Select
                        value={form.country_code}
                        onValueChange={(value) => {
                          handleChange("country_code", value);
                          handleChange("country", value);
                          handleChange("default_token_type", value === "NG" ? "NT" : "CT");
                        }}
                      >
                        <SelectTrigger className="bg-slate-950/80 border-slate-800 text-white focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 rounded-xl h-11 text-sm">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                          <SelectItem value={NIGERIA.value}>{NIGERIA.label}</SelectItem>
                          {XOF_COUNTRIES.map((country) => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Merchant Business Details */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs font-mono font-bold text-teal-400 uppercase tracking-wider">
                    <Building2 size={14} />
                    <span>Step 2: Commercial Entity & Payment Rails</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="business_name" className="text-xs font-mono text-slate-300">
                        Legal Business Name
                      </Label>
                      <Input
                        id="business_name"
                        placeholder="Abidjan Trade Corp"
                        value={form.business_name}
                        onChange={(e) => handleChange("business_name", e.target.value)}
                        required
                        className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 rounded-xl h-11 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="display_name" className="text-xs font-mono text-slate-300">
                        Customer Display Name (on Checkout)
                      </Label>
                      <Input
                        id="display_name"
                        placeholder="Abidjan Goods"
                        value={form.display_name}
                        onChange={(e) => handleChange("display_name", e.target.value)}
                        required
                        className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 rounded-xl h-11 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-mono text-slate-300">Industry / Business Type</Label>
                      <Select
                        value={form.business_type}
                        onValueChange={(value) => handleChange("business_type", value)}
                      >
                        <SelectTrigger className="bg-slate-950/80 border-slate-800 text-white focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 rounded-xl h-11 text-sm">
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                          <SelectItem value="ecommerce">Ecommerce & Online Store</SelectItem>
                          <SelectItem value="retail">Retail & Wholesaler</SelectItem>
                          <SelectItem value="service">B2B Professional Services</SelectItem>
                          <SelectItem value="food">Food & Agriculture</SelectItem>
                          <SelectItem value="travel">Travel & Logistics</SelectItem>
                          <SelectItem value="education">EdTech & Training</SelectItem>
                          <SelectItem value="entertainment">Entertainment & Media</SelectItem>
                          <SelectItem value="other">Other Commercial Sector</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-mono text-slate-300">Default Settlement Token</Label>
                      <Select
                        value={form.default_token_type}
                        onValueChange={(value) => handleChange("default_token_type", value)}
                      >
                        <SelectTrigger className="bg-slate-950/80 border-slate-800 text-white focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 rounded-xl h-11 text-sm">
                          <SelectValue placeholder="Select token" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                          <SelectItem value="CT">CT (CFA Franc - 1 CT ≈ 1 XOF)</SelectItem>
                          <SelectItem value="NT">NT (Naira - 1 NT ≈ 1 NGN)</SelectItem>
                          <SelectItem value="USDT">USDT (Tether USD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="business_phone" className="text-xs font-mono text-slate-300">
                        Business Telephone
                      </Label>
                      <Input
                        id="business_phone"
                        placeholder="+225 07 12 34 56"
                        value={form.business_phone}
                        onChange={(e) => handleChange("business_phone", e.target.value)}
                        required
                        className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 rounded-xl h-11 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="city" className="text-xs font-mono text-slate-300">
                        Operating City
                      </Label>
                      <Input
                        id="city"
                        placeholder="Abidjan / Lagos"
                        value={form.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                        required
                        className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 rounded-xl h-11 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <Label htmlFor="address" className="text-xs font-mono text-slate-300">
                      Physical Business Address
                    </Label>
                    <Textarea
                      id="address"
                      placeholder="Street address, district, suite number..."
                      value={form.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      required
                      rows={2}
                      className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-xs font-mono text-slate-300">
                      Business Description & Products
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Brief overview of goods or services sold..."
                      value={form.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      rows={3}
                      className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 space-y-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-extrabold text-sm shadow-[0_0_30px_rgba(52,211,153,0.35)] hover:shadow-[0_0_40px_rgba(52,211,153,0.55)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-950" />
                    ) : (
                      <Store className="mr-2 h-4 w-4 text-slate-950" />
                    )}
                    Complete Registration & Enter Merchant Portal
                  </Button>

                  <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-2 pt-2 border-t border-slate-800/80">
                    <span>Already have a merchant profile?</span>
                    <Link
                      href="/merchant/login"
                      className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                    >
                      <span>Sign in to Merchant Portal</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Security footnote */}
          <div className="text-center mt-6 text-[11px] font-mono text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Path A Standard & Path B Marketplace Rails • Instant API Secret Provisioning</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-600 font-mono border-t border-slate-900">
        AfriExchange (AfriX) Merchant Services &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
