import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AfriX | Move value. Move forward.",
  description: "The rails for a moving Africa. Send, receive, exchange, and accept value across African markets with AfriX.",
};

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner";

export default function RootLayout({
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
          <div className="min-h-screen w-full overflow-y-auto">
            {children}
          </div>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
