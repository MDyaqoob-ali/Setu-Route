import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { RealtimeAlertTicker } from "@/components/alerts/RealtimeAlertTicker";

export const metadata: Metadata = {
  title: "NE-ROUTE | MDoNER Logistics & Accessibility Intelligence",
  description: "AI-Based Smart Logistics and Accessibility Intelligence Platform for North Eastern Region (MDoNER)",
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
            <div className="min-h-screen flex flex-col bg-[#F5F7FA]">
              <Sidebar />
              <Header />
              <div className="md:pl-16 lg:pl-64 pt-16 transition-all duration-300">
                <RealtimeAlertTicker />
              </div>
              <main className="flex-1 md:pl-16 lg:pl-64 p-4 sm:p-6 lg:p-8 transition-all duration-300 max-w-[1600px] w-full mx-auto">
                {children}
              </main>
            </div>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}

