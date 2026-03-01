"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, DetailBackLink, PageHeader } from "@/components/ui";
import { TASK_STATUSES, type TaskStatus } from "@/lib/tasks";

type Form = {
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  priority: string;
  status: TaskStatus;
};

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const taskId = params.id as never;
  const task = useQuery(api.tasks.get, { taskId });
  const updateTask = useMutation(api.tasks.update);
  const [form, setForm] = useState<Form | null>(null);

  useEffect(() => {
    if (!task) return;
    setForm({
      title: task.title,
      description: task.description,
      assignee: task.assignee ?? "",
      dueDate: task.dueDate ?? "",
      priority: task.priority ?? "medium",
      status: task.status
    });
  }, [task]);

  if (task === undefined || !form) return <p className="text-sm text-slate-600">Loading task...</p>;
  if (task === null) return <p className="text-sm text-red-600">Task not found.</p>;

  return (
    <div className="space-y-4">
      <PageHeader title="Task Detail" subtitle="Edit task fields and status" action={<DetailBackLink href="/tasks" label="Back to tasks" />} />
      <Card className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 md:col-span-2"><span className="text-sm">Title</span><input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label className="space-y-1"><span className="text-sm">Assignee</span><input value={form.assignee} onChange={(e)=>setForm({...form,assignee:e.target.value})} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label className="space-y-1"><span className="text-sm">Due date</span><input type="date" value={form.dueDate} onChange={(e)=>setForm({...form,dueDate:e.target.value})} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label className="space-y-1"><span className="text-sm">Priority</span><select value={form.priority} onChange={(e)=>setForm({...form,priority:e.target.value})} className="w-full rounded border border-slate-300 px-3 py-2"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        <label className="space-y-1"><span className="text-sm">Status</span><select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value as TaskStatus})} className="w-full rounded border border-slate-300 px-3 py-2">{TASK_STATUSES.map((s)=><option key={s} value={s}>{s}</option>)}</select></label>
        <label className="space-y-1 md:col-span-2"><span className="text-sm">Description</span><textarea value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} className="h-48 w-full rounded border border-slate-300 px-3 py-2" /></label>
        <button className="rounded bg-blue-600 px-3 py-2 text-white md:col-span-2" onClick={() => updateTask({ taskId, title: form.title, description: form.description, assignee: form.assignee || undefined, dueDate: form.dueDate || undefined, priority: form.priority || undefined, status: form.status })}>Save</button>
      </Card>
    </div>
  );
}
