"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingCart,
    Users,
    Settings,
    BarChart3,
    Wallet,
    AlertCircle,
    Menu,
    Package,
    GraduationCap,
    ShieldAlert,
    Briefcase,
    Globe,
    FileText,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();

    const routes = [
        {
            label: "Overview",
            icon: LayoutDashboard,
            href: "/",
            active: pathname === "/",
        },
        {
            label: "User Management",
            icon: Users,
            href: "/users",
            active: pathname === "/users",
        },
        {
            label: "Agent Hub",
            icon: Briefcase,
            href: "/agents",
            active: pathname === "/agents",
        },
        {
            label: "Financials",
            icon: Wallet,
            href: "/financials",
            active: pathname === "/financials",
        },
        {
            label: "Merchants",
            icon: Wallet,
            href: "/merchants",
            active: pathname === "/merchants",
        },
        {
            label: "Operations",
            icon: Globe,
            href: "/operations",
            active: pathname === "/operations",
        },
        {
            label: "Disputes",
            icon: Globe,
            href: "/disputes",
            active: pathname === "/disputes",
        },
        {
            label: "Security",
            icon: ShieldAlert,
            href: "/security",
            active: pathname === "/security",
        },
        {
            label: "Education",
            icon: GraduationCap,
            href: "/education",
            active: pathname === "/education",
        },
        {
            label: "Withdrawals",
            icon: FileText,
            href: "/withdrawals",
            active: pathname === "/withdrawals",
        },
    ];

    return (
        <div className={cn("pb-12", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        AfriExchange
                    </h2>
                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Button
                                key={route.href}
                                variant={route.active ? "secondary" : "ghost"}
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href={route.href}>
                                    <route.icon className="mr-2 h-4 w-4" />
                                    {route.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Financial Insights
                    </h2>
                    <div className="space-y-1">
                        <Button
                            variant={pathname === "/financials/transactions" ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            asChild
                        >
                            <Link href="/financials/transactions">
                                <FileText className="mr-2 h-4 w-4" />
                                Transaction History
                            </Link>
                        </Button>
                        <Button
                            variant={pathname === "/financials/wallets" ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            asChild
                        >
                            <Link href="/financials/wallets">
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Wallet Assets
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function MobileSidebar() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
                <Sidebar className="w-full" />
            </SheetContent>
        </Sheet>
    );
}
