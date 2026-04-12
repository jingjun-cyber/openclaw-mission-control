"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, PageHeader } from "@/components/ui";

function SyncBadge({ status }: { status: string }) {
  const cls = status === "healthy"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : status === "critical"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-amber-50 text-amber-800 border-amber-200";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{status}</span>;
}

export default function SyncPage() {
  const sync = useQuery(api.sync.dashboard, {});

  return (
    <div className="space-y-5">
      <PageHeader title="Sync Health" subtitle="Operational view for seed, agent, memory, session, and cron synchronization." />

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Overall status</h2>
            <p className="text-sm text-slate-600">Use this page to see whether background sync and seed flows are fresh, stale, or failing.</p>
          </div>
          {sync ? <SyncBadge status={sync.status} /> : null}
        </div>
      </Card>

      <section className="grid gap-3 md:grid-cols-4">
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Agents</div><div className="mt-2 text-2xl font-semibold">{sync?.counts.agents ?? 0}</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Memory docs</div><div className="mt-2 text-2xl font-semibold">{sync?.counts.docs ?? 0}</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Sessions</div><div className="mt-2 text-2xl font-semibold">{sync?.counts.sessions ?? 0}</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Cron jobs</div><div className="mt-2 text-2xl font-semibold">{sync?.counts.cronJobs ?? 0}</div></Card>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Active issues</div><div className="mt-2 text-2xl font-semibold text-red-700">{sync?.counts.activeIssues ?? 0}</div><div className="mt-1 text-xs text-slate-500">Pipelines in warning or critical state</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Stale pipelines</div><div className="mt-2 text-2xl font-semibold text-amber-700">{sync?.counts.stalePipelines ?? 0}</div><div className="mt-1 text-xs text-slate-500">Pipelines not currently healthy</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Cron errors</div><div className="mt-2 text-2xl font-semibold text-red-700">{sync?.counts.cronErrors ?? 0}</div><div className="mt-1 text-xs text-slate-500">Scheduled jobs currently failing</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Overall</div><div className="mt-2 text-2xl font-semibold text-slate-900">{sync?.status ?? "-"}</div><div className="mt-1 text-xs text-slate-500">Top-level sync health signal</div></Card>
      </section>

      {sync ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Operator response</div>
              <div className="mt-1 text-sm text-slate-600">Jump directly to the surface most likely to explain or clear unhealthy sync state.</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/settings" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Open settings</Link>
              <Link href="/memory" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Open memory</Link>
              <Link href="/team" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Open team</Link>
              <Link href="/incidents" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Open incidents</Link>
            </div>
          </div>
          {sync.counts.activeIssues > 0 ? (
            <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {sync.counts.activeIssues} sync pipelines currently need attention. Prioritize cron errors first, then stale agent/session/memory feeds.
            </div>
          ) : (
            <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              All tracked sync pipelines are currently healthy.
            </div>
          )}
        </Card>
      ) : null}

      <Card>
        <h2 className="text-lg font-semibold">Sync pipelines</h2>
        <div className="mt-4 space-y-3">
          {sync ? sync.items.map((item: any) => (
            <div key={item.key} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-900">{item.label}</div>
                  <div className="mt-1 text-sm text-slate-600">{item.detail}</div>
                </div>
                <SyncBadge status={item.status} />
              </div>
              <div className="mt-2 text-xs text-slate-500">Last updated: {item.lastUpdatedAt ? new Date(item.lastUpdatedAt).toLocaleString() : "unknown"} • freshness: {item.ageLabel}</div>
            </div>
          )) : <p className="text-sm text-slate-500">Loading sync health...</p>}
        </div>
      </Card>
    </div>
  );
}
