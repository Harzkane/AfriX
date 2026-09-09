import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
    title: "Login - AfriExchange Admin",
    description: "Admin login for AfriExchange",
};

import { ThemeProvider } from "@/components/theme-provider"

export default function LoginLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="antialiased">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
