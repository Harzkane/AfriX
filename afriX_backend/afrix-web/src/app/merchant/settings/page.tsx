"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { BookOpen, Copy, ShieldCheck, Webhook } from "lucide-react";
import { toast } from "sonner";

import merchantApi from "@/lib/merchant-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type MerchantProfile = {
  business_name?: string;
  display_name: string;
  business_type?: string;
  description?: string;
  business_email: string;
  business_phone: string;
  city: string;
  country?: string;
  address: string;
  default_token_type: string;
  webhook_url?: string;
  settlement_wallet_id?: string;
  verification_status?: string;
  payment_fee_percent?: string | number;
  updated_at?: string;
  created_at?: string;
};

const tokenOptions = ["NT", "CT", "USDT"];

export default function MerchantSettingsPage() {
  const [profile, setProfile] = useState<MerchantProfile>({
    business_name: "",
    display_name: "",
    business_type: "",
    description: "",
    business_email: "",
    business_phone: "",
    city: "",
    country: "",
    address: "",
    default_token_type: "NT",
    webhook_url: "",
    settlement_wallet_id: "",
    verification_status: "",
    payment_fee_percent: "",
    updated_at: "",
    created_at: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await merchantApi.get("/merchants/profile");
        setProfile((current) => ({ ...current, ...response.data.data }));
      } catch (error) {
        console.error("Failed to load merchant settings:", error);
      }
    };
    load();
  }, []);

  const workspaceStatus = useMemo(() => {
    return profile.verification_status === "approved" ? "default" : "secondary";
  }, [profile.verification_status]);

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      await merchantApi.put("/merchants/profile", {
        display_name: profile.display_name,
        description: profile.description,
        business_email: profile.business_email,
        business_phone: profile.business_phone,
        city: profile.city,
        address: profile.address,
        default_token_type: profile.default_token_type,
        // webhook_url is managed in API & Webhooks — not updated from Settings
      });
      toast.success("Merchant settings updated");
    } catch (error) {
      console.error("Failed to save merchant settings:", error);
      toast.error("Failed to update merchant settings");
    } finally {
      setIsSaving(false);
    }
  };

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch (error) {
      console.error(`Failed to copy ${label}:`, error);
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Merchant Settings
              </Badge>
              <Badge variant={workspaceStatus}>{profile.verification_status || "unknown"}</Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Workspace Settings</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Manage your merchant identity, default settlement preferences, webhook endpoint,
              and integration credentials from one place.
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            {profile.updated_at ? `Last updated ${format(new Date(profile.updated_at), "MMM d, yyyy • h:mm a")}` : "Settings ready"}
          </div>
        </div>

        <div className="border-t bg-muted/20 px-6 py-3">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/merchant/docs">
              <BookOpen className="h-4 w-4" />
              Open Docs
            </Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name</Label>
                <Input id="business_name" value={profile.business_name || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_type">Business Type</Label>
                <Input id="business_type" value={profile.business_type || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={profile.display_name || ""}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_email">Business Email</Label>
                <Input
                  id="business_email"
                  value={profile.business_email || ""}
                  onChange={(e) => setProfile({ ...profile, business_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_phone">Business Phone</Label>
                <Input
                  id="business_phone"
                  value={profile.business_phone || ""}
                  onChange={(e) => setProfile({ ...profile, business_phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_token_type">Default Token</Label>
                <Select
                  value={profile.default_token_type || "NT"}
                  onValueChange={(value) => setProfile({ ...profile, default_token_type: value })}
                >
                  <SelectTrigger id="default_token_type">
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent>
                    {tokenOptions.map((token) => (
                      <SelectItem key={token} value={token}>
                        {token}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profile.city || ""}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={profile.country || ""} disabled />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={profile.address || ""}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={profile.description || ""}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="md:col-span-2">
                <Button onClick={saveProfile} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>API & Webhooks</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use the dedicated integration workspace for webhook destination, default token,
                  and API credential operations.
                </p>
              </div>
              <Webhook className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                Merchant profile editing lives here. Integration controls now have their own home so
                the operational story stays clearer for merchants and partner teams.
              </div>
              <Button asChild variant="outline">
                <Link href="/merchant/api-webhooks">Open API & Webhooks</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Operational Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Verification</span>
                <Badge variant={workspaceStatus}>{profile.verification_status || "unknown"}</Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Default Token</span>
                <span>{profile.default_token_type || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Merchant Fee</span>
                <span>{profile.payment_fee_percent || "0"}%</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">Settlement Wallet</span>
                <div className="max-w-[220px] text-right">
                  <p className="break-all font-mono text-xs">{profile.settlement_wallet_id || "N/A"}</p>
                  {profile.settlement_wallet_id ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-auto p-0 text-xs"
                      onClick={() => copyValue(profile.settlement_wallet_id || "", "Settlement wallet ID")}
                    >
                      Copy wallet id
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Created</span>
                <span>{profile.created_at ? format(new Date(profile.created_at), "MMM d, yyyy") : "N/A"}</span>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
