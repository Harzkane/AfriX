"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Copy, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";

import merchantApi from "@/lib/merchant-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WalletAsset = {
  id: string;
  token_type: string;
  balance: string | number;
  created_at?: string;
};

type MerchantProfile = {
  settlement_wallet_id?: string;
  default_token_type?: string;
  verification_status?: string;
};

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function formatAmount(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  if (Number.isNaN(parsed)) return "0";
  return numberFormatter.format(parsed);
}

export default function MerchantWalletAssetsPage() {
  const [wallets, setWallets] = useState<WalletAsset[]>([]);
  const [profile, setProfile] = useState<MerchantProfile | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [walletResponse, profileResponse] = await Promise.all([
          merchantApi.get("/users/me"),
          merchantApi.get("/merchants/profile"),
        ]);
        setWallets(walletResponse.data.data?.wallets || []);
        setProfile(profileResponse.data.data || null);
      } catch (error) {
        console.error("Failed to load merchant wallets:", error);
      }
    };
    load();
  }, []);

  const balancesByToken = useMemo(() => {
    return wallets.reduce<Record<string, number>>((acc, wallet) => {
      acc[wallet.token_type] = Number(wallet.balance || 0);
      return acc;
    }, {});
  }, [wallets]);

  const settlementWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === profile?.settlement_wallet_id) || null,
    [profile?.settlement_wallet_id, wallets]
  );

  const copyText = async (value: string, label: string) => {
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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Wallet className="h-3.5 w-3.5" />
                Wallet Assets
              </Badge>
              <Badge variant={profile?.verification_status === "approved" ? "default" : "secondary"}>
                {profile?.verification_status || "unknown"}
              </Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Merchant Wallet Assets</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              View token balances, identify your settlement wallet, and copy wallet ids quickly
              for operational use.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["CT", "NT", "USDT"].map((token) => (
          <Card key={token}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{token} Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatAmount(balancesByToken[token])}</div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Settlement Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm font-medium">
              {settlementWallet?.token_type || profile?.default_token_type || "N/A"}
            </div>
            <p className="break-all font-mono text-xs text-muted-foreground">
              {profile?.settlement_wallet_id || "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {wallets.length ? (
          wallets.map((wallet) => {
            const isSettlement = wallet.id === profile?.settlement_wallet_id;
            return (
              <Card key={wallet.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{wallet.token_type} Wallet</CardTitle>
                      <div className="flex items-center gap-2">
                        {isSettlement ? (
                          <Badge className="gap-1">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Settlement
                          </Badge>
                        ) : (
                          <Badge variant="outline">Tracked</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyText(wallet.id, "Wallet ID")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Balance</p>
                    <p className="mt-1 text-2xl font-semibold">{formatAmount(wallet.balance)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Wallet ID</p>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                      {wallet.id}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Created</span>
                    <span>
                      {wallet.created_at
                        ? format(new Date(wallet.created_at), "MMM d, yyyy")
                        : "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No wallet assets found for this merchant account.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
