import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="grid h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] overflow-hidden">
            <div className="hidden border-r bg-muted/40 md:block sticky top-0 h-screen shrink-0">
                <div className="flex h-full flex-col gap-2 overflow-hidden">
                    <div className="flex h-14 shrink-0 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <span className="flex items-center gap-2 font-semibold">
                            AfriExchange Admin
                        </span>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                        <Sidebar className="" />
                    </div>
                </div>
            </div>
            <div className="flex flex-col h-screen overflow-y-auto no-scrollbar">
                <Header />
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
