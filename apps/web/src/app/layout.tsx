import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { RootLayoutClient } from "@/components/layout/RootLayoutClient";

export const metadata: Metadata = {
  title: "SETU-ROUTE | Smart Logistics & Accessibility Intelligence",
  description: "SETU-ROUTE: AI-Based Smart Logistics and Accessibility Intelligence Platform for North Eastern Region (MDoNER)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground min-h-screen antialiased selection:bg-brand-500 selection:text-white">
        <Providers>
          <ToastProvider>
            <RootLayoutClient>
              {children}
            </RootLayoutClient>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
