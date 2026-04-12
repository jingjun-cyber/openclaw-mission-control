"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, DetailBackLink, PageHeader } from "@/components/ui";

export default function CalendarDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id as never;
  const event = useQuery(api.calendar.getEvent, { eventId });
  const updateEvent = useMutation(api.calendar.updateEvent);
  const taskOptions = useQuery(api.calendar.taskOptions, {});

  const [form, setForm] = useState({ title: "", description: "", date: "", time: "", type: "", linkedTaskId: "" });

  useEffect(() => {
    if (!event) return;
    setForm({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time ?? "",
      type: event.type ?? "",
      linkedTaskId: event.linkedTaskId ?? ""
    });
  }, [event]);

  if (event === undefined) return <p className="text-sm text-slate-600">Loading event...</p>;
  if (event === null) return <p className="text-sm text-red-600">Event not found.</p>;

  return (
    <div className="space-y-4">
      <PageHeader title="Calendar Event" subtitle="Update event details" action={<DetailBackLink href="/calendar" label="Back to calendar" />} />
      {event.linkedTask ? (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Linked task</div>
              <div className="mt-1 text-sm text-slate-600">{event.linkedTask.title}</div>
            </div>
            <Link href={`/tasks/${event.linkedTask._id}`} className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Open task</Link>
          </div>
        </Card>
      ) : null}
      <Card className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 md:col-span-2"><span className="text-sm">Title</span><input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label className="space-y-1"><span className="text-sm">Date</span><input type="date" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label className="space-y-1"><span className="text-sm">Time</span><input value={form.time} onChange={(e)=>setForm({...form,time:e.target.value})} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label className="space-y-1 md:col-span-2"><span className="text-sm">Type</span><input value={form.type} onChange={(e)=>setForm({...form,type:e.target.value})} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label className="space-y-1 md:col-span-2"><span className="text-sm">Linked task</span><select value={form.linkedTaskId} onChange={(e)=>setForm({...form,linkedTaskId:e.target.value})} className="w-full rounded border border-slate-300 px-3 py-2"><option value="">None</option>{taskOptions?.map((task) => <option key={task._id} value={task._id}>{task.title}{task.dueDate ? ` • ${task.dueDate}` : ""}</option>)}</select></label>
        <label className="space-y-1 md:col-span-2"><span className="text-sm">Description</span><textarea value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} className="h-40 w-full rounded border border-slate-300 px-3 py-2" /></label>
        <button className="rounded bg-blue-600 px-3 py-2 text-white md:col-span-2" onClick={() => updateEvent({ eventId, title: form.title, description: form.description, date: form.date, time: form.time || undefined, type: form.type || undefined, linkedTaskId: form.linkedTaskId || undefined })}>Save</button>
      </Card>
    </div>
  );
}
