"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  ArrowRightLeft,
  Settings,
  Webhook,
  Layers3,
  BookOpen,
  LifeBuoy,
  FlaskConical,
  Menu,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const routes = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    href: "/merchant",
    matches: ["/merchant"],
  },
  {
    label: "Collections",
    icon: CreditCard,
    href: "/merchant/collections",
    matches: ["/merchant/collections"],
  },
  {
    label: "Wallet Assets",
    icon: Wallet,
    href: "/merchant/wallet-assets",
    matches: ["/merchant/wallet-assets"],
  },
  {
    label: "Sell Through Agent",
    icon: ArrowRightLeft,
    href: "/merchant/sell-through-agent",
    matches: ["/merchant/sell-through-agent"],
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/merchant/settings",
    matches: ["/merchant/settings"],
  },
  {
    label: "API & Webhooks",
    icon: Webhook,
    href: "/merchant/api-webhooks",
    matches: ["/merchant/api-webhooks"],
  },
  {
    label: "Integration Hub",
    icon: Layers3,
    href: "/merchant/integration-hub",
    matches: ["/merchant/integration-hub"],
  },
  {
    label: "Integration Guide",
    icon: BookOpen,
    href: "/merchant/docs",
    matches: ["/merchant/docs"],
  },
  {
    label: "Sandbox",
    icon: FlaskConical,
    href: "/merchant/sandbox",
    matches: ["/merchant/sandbox"],
  },
  {
    label: "Support",
    icon: LifeBuoy,
    href: "/merchant/support",
    matches: ["/merchant/support"],
  },
];

interface MerchantSidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function MerchantSidebar({ className }: MerchantSidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Merchant Portal
          </h2>
          <div className="space-y-1">
            {routes.map((route) => {
              const active = route.matches.some(
                (match) => pathname === match || pathname.startsWith(`${match}/`)
              );
              return (
                <Button
                  key={route.href}
                  variant={active ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={route.href}>
                    <route.icon className="mr-2 h-4 w-4" />
                    {route.label}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MerchantMobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <MerchantSidebar className="w-full" />
      </SheetContent>
    </Sheet>
  );
}
