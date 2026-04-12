"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, PageHeader } from "@/components/ui";

function MetricCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </div>
  );
}

function AttentionBadge({ level }: { level: string }) {
  const cls = level === "critical"
    ? "bg-red-50 text-red-700 border-red-200"
    : level === "warning"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-slate-50 text-slate-700 border-slate-200";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{level}</span>;
}

export default function OverviewPage() {
  const summary = useQuery(api.overview.summary, {});

  if (summary === undefined) {
    return <p className="text-sm text-slate-500">Loading overview...</p>;
  }

  const statusCls = summary.headline.status === "healthy"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : summary.headline.status === "critical"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle="One place to see whether Mission Control is healthy, busy, blocked, or drifting."
      />

      <Card>
        <div className={`rounded-2xl border p-5 ${statusCls}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide">{summary.headline.status}</p>
              <h2 className="mt-1 text-xl font-semibold">{summary.headline.title}</h2>
              <p className="mt-2 text-sm opacity-90">{summary.headline.detail}</p>
            </div>
            <Link href="/settings" className="rounded-lg border border-current px-3 py-2 text-sm">Open settings</Link>
          </div>
        </div>
      </Card>

      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Active sessions" value={summary.metrics.activeSessions} hint="Sessions that were active in the recent work window" />
        <MetricCard label="Doing tasks" value={summary.metrics.doingTasks} hint="Tasks currently in execution" />
        <MetricCard label="Blocked tasks" value={summary.metrics.blockedTasks} hint="Items that need intervention before they can move" />
        <MetricCard label="Failing cron jobs" value={summary.metrics.failingCrons} hint="Automations currently reporting an error state" />
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Execution-ready" value={summary.metrics.executionReadyTasks} hint="Tasks already moved out of planning" />
        <MetricCard label="Planning tasks" value={summary.metrics.planningTasks} hint="Tasks that still need clarification or scoping" />
        <MetricCard label="Searchable memory" value={summary.metrics.searchableDocs} hint="Memory docs with content available to search" />
        <MetricCard label="Empty memory docs" value={summary.metrics.emptyDocs} hint="Docs created without usable searchable content" />
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">What needs attention</h2>
            <Link href="/tasks" className="text-sm text-slate-500 hover:underline">Open tasks</Link>
          </div>
          <div className="mt-4 space-y-3">
            {summary.attention.length ? summary.attention.map((item: any, idx: number) => (
              <Link key={idx} href={item.href} className="block rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-slate-900">{item.title}</div>
                  <AttentionBadge level={item.level} />
                </div>
                <div className="mt-1 text-xs text-slate-500">{item.detail}</div>
              </Link>
            )) : <p className="text-sm text-slate-500">Nothing urgent is on top right now.</p>}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sync and runtime</h2>
            <Link href="/calendar" className="text-sm text-slate-500 hover:underline">Open calendar</Link>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">Automation health: {summary.sync.cronHealthy ? "stable" : "needs review"}</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">Cron jobs currently failing: {summary.sync.failingCrons}</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">Memory docs updated in the last 24 hours: {summary.sync.docsUpdatedRecently}</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">Memory docs older than 7 days: {summary.sync.staleDocs}</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">Memory search readiness: {summary.sync.searchReady ? "ready" : "not ready"}</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">Empty memory docs: {summary.sync.emptyDocs}</div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Coverage at a glance</h2>
          <Link href="/overview" className="text-sm text-slate-500 hover:underline">Refresh overview</Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Link href="/tasks" className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100">
            <div className="text-sm font-medium text-slate-900">Tasks</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{summary.metrics.tasks}</div>
            <div className="mt-1 text-xs text-slate-500">{summary.metrics.executionReadyTasks} ready, {summary.metrics.blockedTasks} blocked</div>
          </Link>
          <Link href="/memory" className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100">
            <div className="text-sm font-medium text-slate-900">Memory</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{summary.metrics.docs}</div>
            <div className="mt-1 text-xs text-slate-500">{summary.metrics.searchableDocs} searchable, {summary.metrics.staleDocs} stale</div>
          </Link>
          <Link href="/team" className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100">
            <div className="text-sm font-medium text-slate-900">Team</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{summary.metrics.agents}</div>
            <div className="mt-1 text-xs text-slate-500">{summary.metrics.activeSessions} active sessions right now</div>
          </Link>
          <Link href="/collab" className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100">
            <div className="text-sm font-medium text-slate-900">Collaboration</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{summary.metrics.activeSessions}</div>
            <div className="mt-1 text-xs text-slate-500">Runtime, queue, and handoff overview</div>
          </Link>
          <Link href="/sync" className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100">
            <div className="text-sm font-medium text-slate-900">Automation</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{summary.metrics.cronJobs}</div>
            <div className="mt-1 text-xs text-slate-500">{summary.metrics.failingCrons} failing jobs to review</div>
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Active work</h2>
            <Link href="/team" className="text-sm text-slate-500 hover:underline">Open team</Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div>
              <div className="mb-2 text-sm font-medium text-slate-700">Tasks in execution</div>
              <div className="space-y-2">
                {summary.activeWork.doingTasks.length ? summary.activeWork.doingTasks.map((task: any) => (
                  <Link key={task._id} href="/tasks" className="block rounded-lg border border-slate-200 p-2 text-sm hover:bg-slate-50">{task.title}</Link>
                )) : <p className="text-sm text-slate-500">No tasks are actively moving right now.</p>}
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-slate-700">Tasks in review</div>
              <div className="space-y-2">
                {summary.activeWork.reviewTasks.length ? summary.activeWork.reviewTasks.map((task: any) => (
                  <Link key={task._id} href="/tasks" className="block rounded-lg border border-slate-200 p-2 text-sm hover:bg-slate-50">{task.title}</Link>
                )) : <p className="text-sm text-slate-500">Nothing is waiting in review.</p>}
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-slate-700">Recent active sessions</div>
              <div className="space-y-2">
                {summary.activeWork.activeSessions.length ? summary.activeWork.activeSessions.map((session: any) => (
                  <Link key={session.sessionKey} href="/team" className="block rounded-lg border border-slate-200 p-2 text-sm hover:bg-slate-50">{session.label}</Link>
                )) : <p className="text-sm text-slate-500">No recent active sessions.</p>}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Office and upcoming events</h2>
            <Link href="/office" className="text-sm text-slate-500 hover:underline">Open office</Link>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-medium text-slate-700">Working desks</div>
              <div className="space-y-2">
                {summary.activeWork.workingDesks.length ? summary.activeWork.workingDesks.map((desk: any) => (
                  <Link key={desk._id} href="/office" className="block rounded-lg border border-slate-200 p-2 text-sm hover:bg-slate-50">{desk.code} • {desk.agentName ?? desk.label}</Link>
                )) : <p className="text-sm text-slate-500">No desks are marked as working.</p>}
              </div>
              {summary.activeWork.errorDesks.length ? (
                <div className="mt-4">
                  <div className="mb-2 text-sm font-medium text-slate-700">Desks with errors</div>
                  <div className="space-y-2">
                    {summary.activeWork.errorDesks.map((desk: any) => (
                      <Link key={desk._id} href="/office" className="block rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800 hover:bg-red-100">{desk.code} • {desk.agentName ?? desk.label}</Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-slate-700">Upcoming events</div>
              <div className="space-y-2">
                {summary.upcomingEvents.length ? summary.upcomingEvents.map((event: any) => (
                  <Link key={event._id} href="/calendar" className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                    <div className="text-sm font-medium text-slate-900">{event.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{event.date}{event.time ? ` ${event.time}` : ""}</div>
                  </Link>
                )) : <p className="text-sm text-slate-500">No upcoming events are scheduled.</p>}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
