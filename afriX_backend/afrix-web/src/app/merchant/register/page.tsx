"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";
import { AlertCircle, Loader2, Store } from "lucide-react";

import merchantApi from "@/lib/merchant-api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Store className="h-5 w-5" />
            <span className="text-sm font-medium">AfriExchange Merchant</span>
          </div>
          <CardTitle className="text-2xl">Create Merchant Profile</CardTitle>
          <CardDescription>
            Register your user profile and merchant business in one step, then continue into the merchant portal.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="grid gap-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    handleChange("email", e.target.value);
                    handleChange("business_email", e.target.value);
                  }}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Country</Label>
                <Select
                  value={form.country_code}
                  onValueChange={(value) => {
                    handleChange("country_code", value);
                    handleChange("country", value);
                    handleChange("default_token_type", value === "NG" ? "NT" : "CT");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="business_name">Business name</Label>
                <Input
                  id="business_name"
                  value={form.business_name}
                  onChange={(e) => handleChange("business_name", e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="display_name">Display name</Label>
                <Input
                  id="display_name"
                  value={form.display_name}
                  onChange={(e) => handleChange("display_name", e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Business type</Label>
                <Select value={form.business_type} onValueChange={(value) => handleChange("business_type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ecommerce">Ecommerce</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Default token</Label>
                <Select value={form.default_token_type} onValueChange={(value) => handleChange("default_token_type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CT">CT</SelectItem>
                    <SelectItem value="NT">NT</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="business_phone">Business phone</Label>
                <Input
                  id="business_phone"
                  value={form.business_phone}
                  onChange={(e) => handleChange("business_phone", e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                required
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Business description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" asChild>
              <Link href="/merchant/login">Already have a merchant profile? Sign in</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create merchant profile
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
