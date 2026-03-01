"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Card, DetailBackLink, PageHeader } from "@/components/ui";

export default function OfficeDeskDetailPage() {
  const params = useParams<{ id: string }>();
  const deskId = params.id as never;
  const desk = useQuery(api.office.getDesk, { deskId });
  const updateDesk = useMutation(api.office.updateDesk);

  const [form, setForm] = useState({ label: "", row: 1, col: 1, agentName: "", avatar: "", presence: "idle" as "idle" | "working" | "away" | "error" });

  useEffect(() => {
    if (!desk) return;
    setForm({
      label: desk.label,
      row: desk.row,
      col: desk.col,
      agentName: desk.agentName ?? "",
      avatar: desk.avatar ?? "",
      presence: desk.presence
    });
  }, [desk]);

  if (desk === undefined) return <p className="text-sm text-slate-600">Loading desk...</p>;
  if (desk === null) return <p className="text-sm text-red-600">Desk not found.</p>;

  return (
    <div className="space-y-4">
      <PageHeader title="Desk Detail" subtitle={desk.code} action={<DetailBackLink href="/office" label="Back to office" />} />
      <Card className="space-y-3">
        <label className="space-y-1 block"><span className="text-sm">Label</span><input value={form.label} onChange={(e)=>setForm({...form,label:e.target.value})} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
        <div className="grid gap-2 md:grid-cols-2">
          <label className="space-y-1 block"><span className="text-sm">Row</span><input type="number" value={form.row} onChange={(e)=>setForm({...form,row:Number(e.target.value || 1)})} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
          <label className="space-y-1 block"><span className="text-sm">Col</span><input type="number" value={form.col} onChange={(e)=>setForm({...form,col:Number(e.target.value || 1)})} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
        </div>
        <label className="space-y-1 block"><span className="text-sm">Agent name</span><input value={form.agentName} onChange={(e)=>setForm({...form,agentName:e.target.value})} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label className="space-y-1 block"><span className="text-sm">Avatar</span><input value={form.avatar} onChange={(e)=>setForm({...form,avatar:e.target.value})} placeholder="e.g. avatar text" className="w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label className="space-y-1 block"><span className="text-sm">Presence</span><select value={form.presence} onChange={(e)=>setForm({...form,presence:e.target.value as typeof form.presence})} className="w-full rounded border border-slate-300 px-3 py-2"><option value="idle">idle</option><option value="working">working</option><option value="away">away</option><option value="error">error</option></select></label>
        <button className="rounded bg-blue-600 px-3 py-2 text-white" onClick={() => updateDesk({ deskId, label: form.label, row: form.row, col: form.col, agentName: form.agentName || undefined, avatar: form.avatar || undefined, presence: form.presence })}>Save</button>
      </Card>
    </div>
  );
}
