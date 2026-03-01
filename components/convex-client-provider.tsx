"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useMemo } from "react";

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const client = useMemo(() => (convexUrl ? new ConvexReactClient(convexUrl) : null), [convexUrl]);

  if (!convexUrl || !client) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Mission Control</h1>
        <p className="mt-4 rounded border border-amber-200 bg-amber-50 p-4 text-amber-900">
          Missing <code>NEXT_PUBLIC_CONVEX_URL</code>. Copy <code>.env.local.example</code> to
          <code> .env.local</code> and set this value from <code>npm run convex:dev</code>.
        </p>
      </main>
    );
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
