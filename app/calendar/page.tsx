"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, PageHeader } from "@/components/ui";
import { daysInMonth, firstWeekday, padDate } from "@/lib/calendar";

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(now.toISOString().slice(0, 10));

  const monthEvents = useQuery(api.calendar.listMonth, { year, month });
  const upcoming = useQuery(api.calendar.listUpcoming, { limit: 8 });
  const jobs = useQuery(api.calendar.listJobs, {});
  const createEvent = useMutation(api.calendar.createEvent);

  const byDate = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const event of monthEvents ?? []) {
      const dateKey = event.date ?? "";
      if (!dateKey) continue;
      const arr = map.get(dateKey) ?? [];
      arr.push(event);
      map.set(dateKey, arr);
    }
    return map;
  }, [monthEvents]);

  const days = daysInMonth(year, month);
  const startOffset = firstWeekday(year, month);

  return (
    <div className="space-y-5">
      <PageHeader title="Calendar" subtitle="Month grid, task milestones, upcoming events, and cron jobs" />
      <Card>
        <div className="grid gap-2 md:grid-cols-[2fr_1fr_auto]">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className="rounded border border-slate-300 px-3 py-2" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded border border-slate-300 px-3 py-2" />
          <button className="rounded bg-blue-600 px-3 py-2 text-white" onClick={async () => {
            if (!title.trim() || !date) return;
            await createEvent({ title: title.trim(), date });
            setTitle("");
          }}>Create</button>
        </div>
      </Card>

      <section className="grid gap-3 md:grid-cols-4">
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Upcoming events</div><div className="mt-2 text-2xl font-semibold text-slate-900">{upcoming?.length ?? 0}</div><div className="mt-1 text-xs text-slate-500">Scheduled items ahead</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Cron jobs</div><div className="mt-2 text-2xl font-semibold text-slate-900">{jobs?.length ?? 0}</div><div className="mt-1 text-xs text-slate-500">Synced automation schedules</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Failing crons</div><div className="mt-2 text-2xl font-semibold text-red-700">{jobs?.filter((job) => job.status?.toLowerCase() === "error").length ?? 0}</div><div className="mt-1 text-xs text-slate-500">Need operator attention</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Task milestones</div><div className="mt-2 text-2xl font-semibold text-emerald-700">{monthEvents?.filter((event: any) => event.type === "task-milestone").length ?? 0}</div><div className="mt-1 text-xs text-slate-500">Tasks projected from due dates</div></Card>
      </section>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <button className="rounded border border-slate-300 px-2 py-1" onClick={() => setMonth((m) => (m === 1 ? 12 : m - 1))}>Prev</button>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value || now.getFullYear()))} className="w-24 rounded border border-slate-300 px-2 py-1" />
            <input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value || now.getMonth() + 1))} className="w-20 rounded border border-slate-300 px-2 py-1" />
            <button className="rounded border border-slate-300 px-2 py-1" onClick={() => setMonth((m) => (m === 12 ? 1 : m + 1))}>Next</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-xs text-slate-500">
            {"Sun Mon Tue Wed Thu Fri Sat".split(" ").map((d) => <div key={d} className="px-2 py-1 font-semibold">{d}</div>)}
            {Array.from({ length: startOffset }).map((_, i) => <div key={`blank-${i}`} className="h-24 rounded border border-dashed border-slate-200" />)}
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1;
              const key = padDate(year, month, day);
              const events = byDate.get(key) ?? [];
              return (
                <div key={key} className="h-24 overflow-hidden rounded border border-slate-200 bg-white p-1">
                  <div className="text-xs font-semibold">{day}</div>
                  <div className="mt-1 space-y-1">
                    {events.slice(0, 2).map((event: any) => (
                      event.type === "task-milestone" ? (
                        <Link key={event._id} href={`/tasks/${event.linkedTaskId}`} className="block truncate rounded bg-emerald-100 px-1 text-xs text-emerald-900 hover:bg-emerald-200">{event.title}</Link>
                      ) : (
                        <Link key={event._id} href={`/calendar/${event._id}`} className="block truncate rounded bg-slate-100 px-1 text-xs hover:bg-slate-200">{event.title}</Link>
                      )
                    ))}
                    {events.length > 2 ? <div className="text-[10px] text-slate-500">+{events.length - 2} more</div> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">Upcoming</h2>
            <div className="space-y-2">
              {upcoming?.map((event) => (
                <Link key={event._id} href={`/calendar/${event._id}`} className="block rounded border border-slate-200 p-2 hover:bg-slate-50">
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-slate-600">{event.date} {event.time ?? ""}</p>
                </Link>
              ))}
              {upcoming?.length === 0 ? <p className="text-sm text-slate-500">No upcoming events</p> : null}
            </div>
          </Card>

          <Card>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">Cron Timeline</h2>
            <div className="space-y-2">
              {jobs?.map((job) => (
                <div key={job._id} className={`rounded border p-3 text-xs ${job.status?.toLowerCase() === "error" ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900">{job.name}</span>
                    <span className={job.status?.toLowerCase() === "error" ? "text-red-700" : "text-slate-600"}>{job.status}</span>
                  </div>
                  <div className="mt-1 text-slate-600">{job.schedule}</div>
                  <div className="mt-1 text-slate-500">Last run: {job.lastRunAt ? new Date(job.lastRunAt).toLocaleString() : "unknown"}</div>
                  <div className="text-slate-500">Next run: {job.nextRunAt ? new Date(job.nextRunAt).toLocaleString() : "unknown"}</div>
                </div>
              ))}
              {jobs?.length === 0 ? <p className="py-2 text-sm text-slate-500">No jobs synced yet</p> : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
