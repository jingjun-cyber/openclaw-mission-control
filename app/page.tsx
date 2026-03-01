"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function Card({
  title,
  href,
  subtitle,
  children
}: {
  title: string;
  href: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600 group-hover:bg-slate-900 group-hover:text-white">
          Open
        </span>
      </div>
      <div className="mt-4 rounded-xl bg-slate-50 p-3">{children}</div>
    </Link>
  );
}

function MiniKanban({ labels, counts }: { labels: string[]; counts: number[] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {labels.slice(0, 3).map((label, idx) => (
        <div key={label} className="rounded-lg border border-slate-200 bg-white p-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{counts[idx] ?? 0}</div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const summary = useQuery(api.stats.dashboard, {});

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Mission Control</h1>
        <p className="mt-1 text-sm text-slate-600">A unified command center for tasks, content, calendar, memory, team, and office.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card
          title="Tasks Board"
          href="/tasks"
          subtitle={summary ? `${summary.counts.tasks} tasks` : "Loading…"}
        >
          <MiniKanban
            labels={["Backlog", "Doing", "Review"]}
            counts={
              summary
                ? [summary.tasksByStatus.Backlog, summary.tasksByStatus.Doing, summary.tasksByStatus.Review]
                : [0, 0, 0]
            }
          />
          <p className="mt-3 text-xs text-slate-500">Track work from backlog to done.</p>
        </Card>

        <Card
          title="Content Pipeline"
          href="/pipeline"
          subtitle={summary ? `${summary.counts.pipeline} items` : "Loading…"}
        >
          <MiniKanban
            labels={["Idea", "Draft", "Publish"]}
            counts={
              summary
                ? [summary.pipelineByStage.Idea, summary.pipelineByStage.Draft, summary.pipelineByStage.Publish]
                : [0, 0, 0]
            }
          />
          <p className="mt-3 text-xs text-slate-500">Ideas → scripts → assets → publish.</p>
        </Card>

        <Card
          title="Calendar"
          href="/calendar"
          subtitle={summary ? `${summary.counts.events} events` : "Loading…"}
        >
          <div className="space-y-2">
            {summary?.upcomingEvents?.length ? (
              <div className="space-y-2">
                {summary.upcomingEvents.slice(0, 3).map((e: any) => (
                  <div key={e._id} className="rounded-lg border border-slate-200 bg-white p-2">
                    <div className="text-xs font-semibold text-slate-800">{e.title}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {e.date}
                      {e.time ? ` ${e.time}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-500">No upcoming events</div>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500">All scheduled tasks + cron jobs live here.</p>
        </Card>

        <Card
          title="Memory Archive"
          href="/memory"
          subtitle={summary ? `${summary.counts.docs} documents` : "Loading…"}
        >
          <div className="space-y-2">
            {summary?.recentDocs?.length ? (
              summary.recentDocs.slice(0, 4).map((d: any) => (
                <div key={d._id} className="rounded-lg border border-slate-200 bg-white p-2">
                  <div className="line-clamp-1 text-xs font-medium text-slate-800">{d.title}</div>
                  <div className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{d.path}</div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-500">No docs yet</div>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500">Beautiful docs + fast search across everything.</p>
        </Card>

        <Card
          title="Team Overview"
          href="/team"
          subtitle={summary ? `${summary.counts.agents} agents • ${summary.recentSessions.length} recent sessions` : "Loading…"}
        >
          <div className="space-y-2">
            {summary?.recentSessions?.length ? (
              summary.recentSessions.slice(0, 4).map((s: any) => (
                <div key={s.sessionKey} className="rounded-lg border border-slate-200 bg-white p-2">
                  <div className="line-clamp-1 text-xs font-medium text-slate-800">{s.label}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">{s.status}</div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-500">No sessions yet</div>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500">Roles, responsibilities, recent sessions.</p>
        </Card>

        <Card
          title="Virtual Office"
          href="/office"
          subtitle={summary ? `${summary.office.working} working • ${summary.counts.desks} desks` : "Loading…"}
        >
          <div className="grid grid-cols-4 gap-2">
            {summary ? (
              [
                { label: "Working", value: summary.office.working, color: "bg-green-500" },
                { label: "Idle", value: summary.office.idle, color: "bg-slate-400" },
                { label: "Away", value: summary.office.away, color: "bg-orange-500" },
                { label: "Error", value: summary.office.error, color: "bg-red-500" }
              ].map((b) => (
                <div key={b.label} className="rounded-lg border border-slate-200 bg-white p-2">
                  <div className="flex items-center justify-between">
                    <div className={`h-2 w-2 rounded-full ${b.color}`} />
                    <div className="text-sm font-semibold text-slate-900">{b.value}</div>
                  </div>
                  <div className="mt-2 text-[10px] font-medium text-slate-500">{b.label}</div>
                </div>
              ))
            ) : (
              <div className="col-span-4 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-500">Loading…</div>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500">Who’s working right now, at a glance.</p>
        </Card>
      </section>
    </div>
  );
}
