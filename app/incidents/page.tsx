"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, PageHeader } from "@/components/ui";

function LevelBadge({ level }: { level: string }) {
  const cls = level === "critical"
    ? "bg-red-50 text-red-700 border-red-200"
    : level === "warning"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-slate-50 text-slate-700 border-slate-200";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{level}</span>;
}

function HeadlineBadge({ state }: { state: string }) {
  const cls = state === "critical"
    ? "bg-red-50 text-red-700 border-red-200"
    : state === "warning"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{state}</span>;
}

export default function IncidentsPage() {
  const data = useQuery(api.incidents.dashboard, {});

  return (
    <div className="space-y-5">
      <PageHeader title="Recent Incidents" subtitle="Recent failures, warnings, and operational anomalies across Mission Control." />

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-slate-600">This view pulls together cron failures, office desk errors, blocked tasks, and older lingering sessions.</div>
          {data ? <HeadlineBadge state={data.headline} /> : null}
        </div>
      </Card>

      {data ? (
        <section className="grid gap-3 md:grid-cols-4">
          <Card><div className="text-xs uppercase tracking-wide text-slate-500">Total</div><div className="mt-2 text-2xl font-semibold">{data.counts.total}</div></Card>
          <Card><div className="text-xs uppercase tracking-wide text-slate-500">Critical</div><div className="mt-2 text-2xl font-semibold text-red-700">{data.counts.critical}</div></Card>
          <Card><div className="text-xs uppercase tracking-wide text-slate-500">Warnings</div><div className="mt-2 text-2xl font-semibold text-amber-700">{data.counts.warning}</div></Card>
          <Card><div className="text-xs uppercase tracking-wide text-slate-500">Active incidents</div><div className="mt-2 text-2xl font-semibold text-slate-900">{data.activeIncidentCount}</div></Card>
        </section>
      ) : null}

      {data ? (
        <section className="grid gap-3 md:grid-cols-4">
          <Card><div className="text-xs uppercase tracking-wide text-slate-500">Cron</div><div className="mt-2 text-2xl font-semibold text-red-700">{data.sources.cron}</div><div className="mt-1 text-xs text-slate-500">Failing scheduled jobs</div></Card>
          <Card><div className="text-xs uppercase tracking-wide text-slate-500">Office</div><div className="mt-2 text-2xl font-semibold text-red-700">{data.sources.office}</div><div className="mt-1 text-xs text-slate-500">Desk states reporting errors</div></Card>
          <Card><div className="text-xs uppercase tracking-wide text-slate-500">Tasks</div><div className="mt-2 text-2xl font-semibold text-amber-700">{data.sources.tasks}</div><div className="mt-1 text-xs text-slate-500">Blocked tasks needing intervention</div></Card>
          <Card><div className="text-xs uppercase tracking-wide text-slate-500">Sessions</div><div className="mt-2 text-2xl font-semibold text-slate-700">{data.sources.sessions}</div><div className="mt-1 text-xs text-slate-500">Older lingering visible sessions</div></Card>
        </section>
      ) : null}

      {data ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Fast response</div>
              <div className="mt-1 text-sm text-slate-600">Jump straight to the surface most likely to clear the current incident queue.</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/sync" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Open sync</Link>
              <Link href="/office" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Open office</Link>
              <Link href="/tasks" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Open tasks</Link>
              <Link href="/team" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Open team</Link>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-3">
        {data ? data.items.map((item: any) => (
          <Card key={item.key}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-slate-900">{item.title}</div>
                <div className="mt-1 text-sm text-slate-600">{item.detail}</div>
                <div className="mt-2 text-xs text-slate-500">Source: {item.source} • Seen {item.ageLabel}</div>
              </div>
              <LevelBadge level={item.level} />
            </div>
            <div className="mt-3">
              <Link href={item.href} className="text-sm text-blue-600 hover:underline">Open related view</Link>
            </div>
          </Card>
        )) : <Card><div className="text-sm text-slate-500">Loading incidents…</div></Card>}
      </div>
    </div>
  );
}
