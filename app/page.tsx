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
  const summary = useQuery(api.stats.summary, {});

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
          subtitle={summary ? `${summary.tasks} tasks` : "Loading…"}
        >
          <MiniKanban labels={["Backlog", "Doing", "Review"]} counts={[0, 0, 0]} />
          <p className="mt-3 text-xs text-slate-500">Track work from backlog to done.</p>
        </Card>

        <Card
          title="Content Pipeline"
          href="/pipeline"
          subtitle={summary ? `${summary.pipeline} items` : "Loading…"}
        >
          <MiniKanban labels={["Idea", "Draft", "Publish"]} counts={[0, 0, 0]} />
          <p className="mt-3 text-xs text-slate-500">Ideas → scripts → assets → publish.</p>
        </Card>

        <Card
          title="Calendar"
          href="/calendar"
          subtitle={summary ? `${summary.events} events` : "Loading…"}
        >
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className={`h-6 rounded-md border border-slate-200 bg-white ${i === 8 ? "bg-blue-50 border-blue-200" : ""}`}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">All scheduled tasks + cron jobs live here.</p>
        </Card>

        <Card
          title="Memory Archive"
          href="/memory"
          subtitle={summary ? `${summary.docs} documents` : "Loading…"}
        >
          <div className="rounded-lg border border-slate-200 bg-white p-2">
            <div className="h-2 w-2/3 rounded bg-slate-200" />
            <div className="mt-2 h-2 w-1/2 rounded bg-slate-200" />
            <div className="mt-4 space-y-2">
              <div className="h-2 w-full rounded bg-slate-100" />
              <div className="h-2 w-11/12 rounded bg-slate-100" />
              <div className="h-2 w-10/12 rounded bg-slate-100" />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Beautiful docs + fast search across everything.</p>
        </Card>

        <Card
          title="Team Overview"
          href="/team"
          subtitle={summary ? `${summary.agents} agents` : "Loading…"}
        >
          <div className="flex -space-x-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-slate-200 to-slate-100"
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Roles, responsibilities, recent sessions.</p>
        </Card>

        <Card
          title="Virtual Office"
          href="/office"
          subtitle={summary ? `${summary.desks} desks` : "Loading…"}
        >
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-white p-2">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-6 rounded-full bg-slate-200" />
                  <div className={`h-2 w-2 rounded-full ${i % 3 === 0 ? "bg-green-500" : "bg-slate-300"}`} />
                </div>
                <div className="mt-2 h-2 w-4/5 rounded bg-slate-100" />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Who’s working right now, at a glance.</p>
        </Card>
      </section>
    </div>
  );
}
