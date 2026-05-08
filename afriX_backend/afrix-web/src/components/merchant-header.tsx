"use client";

import { useEffect, useState } from "react";
import { Bell, Store, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MerchantMobileSidebar } from "@/components/merchant-sidebar";

export function MerchantHeader() {
  const router = useRouter();
  const [merchantUser, setMerchantUser] = useState<any>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("merchant_user");
      setMerchantUser(storedUser ? JSON.parse(storedUser) : null);
    } catch (error) {
      console.error("Failed to load merchant user from storage:", error);
      setMerchantUser(null);
    }
  }, []);

  const initials = merchantUser?.full_name
    ? merchantUser.full_name
        .split(" ")
        .map((part: string) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "MP";

  const handleLogout = () => {
    Cookies.remove("merchant_token");
    localStorage.removeItem("merchant_token");
    localStorage.removeItem("merchant_user");
    router.push("/merchant/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background px-4 sm:px-6">
      <MerchantMobileSidebar />
      <div className="flex flex-1 items-center gap-3">
        <Store className="h-5 w-5 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-sm font-semibold">Merchant Workspace</p>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Collections, wallet assets, and liquidity operations
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {merchantUser?.full_name || "Merchant Account"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/merchant/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/merchant")}>
              Overview
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
