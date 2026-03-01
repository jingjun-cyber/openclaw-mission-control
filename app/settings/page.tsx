"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, PageHeader } from "@/components/ui";

export default function SettingsPage() {
  const summary = useQuery(api.stats.summary, {});

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Environment and module summary" />
      <Card>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">Environment</h2>
        <p className="text-sm text-slate-700">`NEXT_PUBLIC_CONVEX_URL`: {process.env.NEXT_PUBLIC_CONVEX_URL ? "configured" : "missing"}</p>
        <p className="text-sm text-slate-700">`OFFICE_WEBHOOK_SECRET`: configured in server env</p>
      </Card>
      <Card>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">Data Summary</h2>
        {summary ? (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <li className="rounded border border-slate-200 p-2">Tasks: {summary.tasks}</li>
            <li className="rounded border border-slate-200 p-2">Pipeline items: {summary.pipeline}</li>
            <li className="rounded border border-slate-200 p-2">Events: {summary.events}</li>
            <li className="rounded border border-slate-200 p-2">Memory docs: {summary.docs}</li>
            <li className="rounded border border-slate-200 p-2">Agents: {summary.agents}</li>
            <li className="rounded border border-slate-200 p-2">Desks: {summary.desks}</li>
          </ul>
        ) : (
          <p className="text-sm text-slate-600">Loading summary...</p>
        )}
      </Card>
    </div>
  );
}
