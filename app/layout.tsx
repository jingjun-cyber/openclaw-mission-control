import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { AppNav } from "@/components/nav";
import { SafetyProvider } from "@/components/safety-provider";

export const metadata: Metadata = {
  title: "Mission Control",
  description: "Unified workspace for tasks, pipeline, calendar, memory, team, and office"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>
          <SafetyProvider>
            <AppNav />
            <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
          </SafetyProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
