import { MerchantSidebar } from "@/components/merchant-sidebar";
import { MerchantHeader } from "@/components/merchant-header";

export default function MerchantLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid h-screen w-full overflow-hidden md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block sticky top-0 h-screen shrink-0">
        <div className="flex h-full flex-col gap-2 overflow-hidden">
          <div className="flex h-14 shrink-0 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <span className="flex items-center gap-2 font-semibold">
              AfriExchange Merchant
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
            <MerchantSidebar />
          </div>
        </div>
      </div>
      <div className="flex h-screen min-h-0 flex-col overflow-hidden">
        <MerchantHeader />
        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 no-scrollbar sm:p-5 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
