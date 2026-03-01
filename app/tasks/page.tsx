"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, PageHeader } from "@/components/ui";
import { TASK_STATUSES, type TaskStatus } from "@/lib/tasks";

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">{children}</span>;
}

function StatusPill({ status }: { status: TaskStatus }) {
  const cls =
    status === "Doing"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : status === "Review"
        ? "bg-purple-50 text-purple-700 border-purple-200"
        : status === "Done"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : status === "Blocked"
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-slate-50 text-slate-700 border-slate-200";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{status}</span>;
}

function PriorityPill({ priority }: { priority?: string }) {
  if (!priority) return null;
  const p = priority.toUpperCase();
  const cls =
    p === "P0" ? "bg-red-50 text-red-700 border-red-200" : p === "P1" ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-slate-50 text-slate-700 border-slate-200";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{p}</span>;
}

export default function TasksPage() {
  const tasks = useQuery(api.tasks.list, {});
  const createTask = useMutation(api.tasks.create);
  const moveTask = useMutation(api.tasks.move);

  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const list = tasks ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((t: any) => `${t.title}\n${t.description ?? ""}\n${t.assignee ?? ""}`.toLowerCase().includes(q));
  }, [tasks, query]);

  const grouped = useMemo(() => {
    const out = Object.fromEntries(TASK_STATUSES.map((s) => [s, [] as any[]])) as Record<TaskStatus, any[]>;
    for (const task of filtered) out[task.status as TaskStatus].push(task);
    for (const status of TASK_STATUSES) {
      out[status].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    }
    return out;
  }, [filtered]);

  const onCreate = async () => {
    if (!title.trim()) return;
    await createTask({ title: title.trim(), assignee: assignee.trim() || undefined });
    setTitle("");
    setAssignee("");
  };

  const shift = async (taskId: string, current: TaskStatus, dir: -1 | 1) => {
    const idx = TASK_STATUSES.indexOf(current);
    const next = TASK_STATUSES[idx + dir];
    if (!next) return;
    await moveTask({ taskId: taskId as never, status: next });
  };

  const total = filtered.length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tasks Board"
        subtitle={total ? `${total} tasks • search + quick move` : "Kanban board for work execution"}
        action={<div className="flex items-center gap-2"><Badge>Backlog {grouped.Backlog.length}</Badge><Badge>Doing {grouped.Doing.length}</Badge><Badge>Review {grouped.Review.length}</Badge><Badge>Done {grouped.Done.length}</Badge></div>}
      />

      <Card>
        <div className="grid gap-2 md:grid-cols-[2fr_1fr_auto]">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="rounded border border-slate-300 px-3 py-2"
          />
          <input
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="Assignee"
            className="rounded border border-slate-300 px-3 py-2"
          />
          <button
            onClick={onCreate}
            disabled={!title.trim()}
            className="rounded bg-blue-600 px-3 py-2 text-white disabled:bg-slate-300"
            type="button"
          >
            Create
          </button>
        </div>
        <div className="mt-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title/description/assignee"
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
      </Card>

      <div className="overflow-x-auto">
        <div className="grid min-w-[1100px] grid-cols-5 gap-3">
          {TASK_STATUSES.map((status) => (
            <section key={status} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{status}</h2>
                <Badge>{grouped[status].length}</Badge>
              </div>

              <div className="space-y-2">
                {tasks === undefined ? <p className="text-sm text-slate-500">Loading...</p> : null}
                {tasks !== undefined && grouped[status].length === 0 ? <p className="text-sm text-slate-500">No tasks</p> : null}

                {grouped[status].map((task: any) => (
                  <article
                    key={task._id}
                    className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/tasks/${task._id}`} className="line-clamp-2 font-semibold text-slate-900 hover:underline">
                          {task.title}
                        </Link>
                        <p className="mt-1 text-xs text-slate-600">{task.assignee || "Unassigned"}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusPill status={task.status as TaskStatus} />
                        <PriorityPill priority={task.priority} />
                      </div>
                    </div>

                    {task.description ? (
                      <p className="mt-2 line-clamp-2 text-xs text-slate-600">{task.description}</p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => shift(task._id, task.status as TaskStatus, -1)}
                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                        disabled={TASK_STATUSES.indexOf(task.status as TaskStatus) === 0}
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => shift(task._id, task.status as TaskStatus, 1)}
                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                        disabled={TASK_STATUSES.indexOf(task.status as TaskStatus) === TASK_STATUSES.length - 1}
                      >
                        Next
                      </button>
                      {task.status !== "Done" ? (
                        <button
                          type="button"
                          onClick={() => moveTask({ taskId: task._id as never, status: "Done" as any })}
                          className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-800"
                        >
                          Mark done
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
