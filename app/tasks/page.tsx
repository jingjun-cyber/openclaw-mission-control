"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, PageHeader } from "@/components/ui";
import { TASK_STATUSES, type TaskStatus } from "@/lib/tasks";

export default function TasksPage() {
  const tasks = useQuery(api.tasks.list, {});
  const createTask = useMutation(api.tasks.create);
  const moveTask = useMutation(api.tasks.move);

  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");

  const grouped = useMemo(() => {
    const out = Object.fromEntries(TASK_STATUSES.map((s) => [s, [] as any[]])) as Record<TaskStatus, any[]>;
    for (const task of tasks ?? []) out[task.status as TaskStatus].push(task);
    return out;
  }, [tasks]);

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

  return (
    <div className="space-y-5">
      <PageHeader title="Tasks Board" subtitle="Kanban board for work execution" />
      <Card>
        <div className="grid gap-2 md:grid-cols-[2fr_1fr_auto]">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className="rounded border border-slate-300 px-3 py-2" />
          <input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Assignee" className="rounded border border-slate-300 px-3 py-2" />
          <button onClick={onCreate} disabled={!title.trim()} className="rounded bg-blue-600 px-3 py-2 text-white disabled:bg-slate-300">Create</button>
        </div>
      </Card>

      <div className="overflow-x-auto">
        <div className="grid min-w-[1000px] grid-cols-5 gap-3">
          {TASK_STATUSES.map((status) => (
            <Card key={status} className="p-3">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">{status} <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{grouped[status].length}</span></h2>
              <div className="space-y-2">
                {tasks === undefined ? <p className="text-sm text-slate-500">Loading...</p> : null}
                {tasks !== undefined && grouped[status].length === 0 ? <p className="text-sm text-slate-500">No tasks</p> : null}
                {grouped[status].map((task) => (
                  <article key={task._id} className="rounded border border-slate-200 p-2">
                    <Link href={`/tasks/${task._id}`} className="font-medium hover:underline">{task.title}</Link>
                    <p className="text-xs text-slate-600">{task.assignee || "Unassigned"}</p>
                    <div className="mt-2 flex gap-2 text-xs">
                      <button onClick={() => shift(task._id, task.status, -1)} className="rounded border border-slate-300 px-2 py-1">Prev</button>
                      <button onClick={() => shift(task._id, task.status, 1)} className="rounded border border-slate-300 px-2 py-1">Next</button>
                    </div>
                  </article>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
