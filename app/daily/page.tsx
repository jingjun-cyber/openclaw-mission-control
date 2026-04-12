"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, PageHeader } from "@/components/ui";

function TonePill({ label, tone }: { label: string; tone: "emerald" | "amber" | "red" | "slate" }) {
  const cls =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "red"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-slate-200 bg-slate-50 text-slate-700";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span>;
}

export default function DailySummaryPage() {
  const overview = useQuery(api.overview.summary, {});
  const sync = useQuery(api.sync.dashboard, {});
  const incidents = useQuery(api.incidents.dashboard, {});

  return (
    <div className="space-y-5">
      <PageHeader title="Daily Summary" subtitle="Operator-first daily review of health, work, sync state, and anomalies." />

      <section className="grid gap-3 md:grid-cols-4">
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">System health</div><div className="mt-2 text-2xl font-semibold text-slate-900">{overview?.headline.status ?? "-"}</div><div className="mt-1 text-xs text-slate-500">Top-level mission control state</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Active work</div><div className="mt-2 text-2xl font-semibold text-emerald-700">{overview?.metrics.doingTasks ?? 0}</div><div className="mt-1 text-xs text-slate-500">Tasks actively moving today</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Active incidents</div><div className="mt-2 text-2xl font-semibold text-red-700">{incidents?.activeIncidentCount ?? 0}</div><div className="mt-1 text-xs text-slate-500">Issues needing operator attention</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Sync issues</div><div className="mt-2 text-2xl font-semibold text-amber-700">{sync?.counts.activeIssues ?? 0}</div><div className="mt-1 text-xs text-slate-500">Pipelines in warning or critical state</div></Card>
      </section>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Daily headline</div>
            <div className="mt-1 text-sm text-slate-600">{overview?.headline.detail ?? "Loading daily summary..."}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <TonePill label={`Overview ${overview?.headline.status ?? "pending"}`} tone={overview?.headline.status === "healthy" ? "emerald" : overview?.headline.status === "critical" ? "red" : "amber"} />
            <TonePill label={`Sync ${sync?.status ?? "pending"}`} tone={sync?.status === "healthy" ? "emerald" : sync?.status === "critical" ? "red" : "amber"} />
            <TonePill label={`Incidents ${incidents?.headline ?? "pending"}`} tone={incidents?.headline === "healthy" ? "emerald" : incidents?.headline === "critical" ? "red" : "amber"} />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">What to look at first</h2>
            <Link href="/overview" className="text-sm text-slate-500 hover:underline">Open overview</Link>
          </div>
          <div className="mt-4 space-y-3">
            {overview?.attention?.length ? overview.attention.map((item: any, index: number) => (
              <Link key={`${item.title}-${index}`} href={item.href} className="block rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-slate-900">{item.title}</div>
                  <TonePill label={item.level} tone={item.level === "critical" ? "red" : item.level === "warning" ? "amber" : "slate"} />
                </div>
                <div className="mt-1 text-xs text-slate-500">{item.detail}</div>
              </Link>
            )) : <p className="text-sm text-slate-500">Nothing urgent is on top right now.</p>}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Operational snapshot</h2>
            <Link href="/sync" className="text-sm text-slate-500 hover:underline">Open sync</Link>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">Blocked tasks: {overview?.metrics.blockedTasks ?? 0}</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">Execution-ready tasks: {overview?.metrics.executionReadyTasks ?? 0}</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">Stale memory docs: {overview?.metrics.staleDocs ?? 0}</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">Cron jobs failing: {sync?.counts.cronErrors ?? 0}</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">Error desks: {incidents?.sources?.office ?? 0}</div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Active work</h2>
            <Link href="/tasks" className="text-sm text-slate-500 hover:underline">Open tasks</Link>
          </div>
          <div className="mt-4 space-y-2">
            {overview?.activeWork?.doingTasks?.length ? overview.activeWork.doingTasks.map((task: any) => (
              <Link key={task._id} href="/tasks" className="block rounded-lg border border-slate-200 p-2 text-sm hover:bg-slate-50">{task.title}</Link>
            )) : <p className="text-sm text-slate-500">No active tasks right now.</p>}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upcoming events</h2>
            <Link href="/calendar" className="text-sm text-slate-500 hover:underline">Open calendar</Link>
          </div>
          <div className="mt-4 space-y-2">
            {overview?.upcomingEvents?.length ? overview.upcomingEvents.map((event: any) => (
              <Link key={event._id} href="/calendar" className="block rounded-lg border border-slate-200 p-2 text-sm hover:bg-slate-50">{event.title} <span className="text-xs text-slate-500">{event.date}</span></Link>
            )) : <p className="text-sm text-slate-500">No upcoming events.</p>}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quick actions</h2>
            <Link href="/incidents" className="text-sm text-slate-500 hover:underline">Open incidents</Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/overview" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Overview</Link>
            <Link href="/sync" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Sync</Link>
            <Link href="/memory" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Memory</Link>
            <Link href="/office" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Office</Link>
            <Link href="/team" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Team</Link>
            <Link href="/connectors" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Connectors</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
