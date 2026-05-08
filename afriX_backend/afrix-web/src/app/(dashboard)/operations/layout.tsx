"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AlertCircle, Lock, FileText } from "lucide-react";

const navItems = [
    {
        title: "Overview",
        href: "/operations",
        icon: FileText
    },
    {
        title: "Disputes",
        href: "/operations/disputes",
        icon: AlertCircle
    },
    {
        title: "Escrows",
        href: "/operations/escrows",
        icon: Lock
    },
    {
        title: "Requests",
        href: "/operations/requests",
        icon: FileText
    }
];

export default function OperationsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center space-x-4 border-b pb-1">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2",
                            pathname === item.href
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-primary"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                    </Link>
                ))}
            </div>
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
