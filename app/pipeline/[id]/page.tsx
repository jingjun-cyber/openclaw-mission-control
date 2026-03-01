"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CHANNELS, STAGES, type Stage } from "@/lib/stages";

type FormState = {
  title: string;
  channel: string;
  targetDate: string;
  owner: string;
  brief: string;
  script: string;
  stage: Stage;
};

export default function ItemPage() {
  const params = useParams<{ id: string }>();
  const itemId = params.id as never;

  const item = useQuery(api.content.getItem, { itemId });
  const updateItem = useMutation(api.content.updateItem);
  const moveStage = useMutation(api.content.moveStage);
  const getUploadUrl = useMutation(api.content.getUploadUrl);
  const attachImage = useMutation(api.content.attachImage);
  const removeAttachment = useMutation(api.content.removeAttachment);

  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    if (!item) return;
    setForm({
      title: item.title,
      channel: item.channel,
      targetDate: item.targetDate,
      owner: item.owner,
      brief: item.brief,
      script: item.script,
      stage: item.stage
    });
  }, [item]);

  if (item === undefined || form === null) return <p className="text-sm text-slate-600">Loading item...</p>;
  if (item === null) return <p className="text-sm text-red-600">Item not found.</p>;

  const onChange = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => (prev ? { ...prev, [field]: event.target.value } : prev));
  };

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadUrl = await getUploadUrl({});
    const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
    const data = (await result.json()) as { storageId: string };
    await attachImage({ itemId, storageId: data.storageId as never, fileName: file.name, mimeType: file.type, size: file.size });
    event.target.value = "";
  };

  return (
    <main className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <Link className="text-sm text-blue-600 hover:underline" href="/pipeline">← Back to pipeline</Link>
          <h1 className="mt-1 text-2xl font-semibold">Edit Content Item</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={async () => {
            const idx = STAGES.indexOf(form.stage);
            const next = STAGES[idx - 1];
            if (!next) return;
            setForm({ ...form, stage: next });
            await moveStage({ itemId, stage: next });
          }} className="rounded border border-slate-300 px-3 py-2 text-sm">Previous Stage</button>
          <button type="button" onClick={async () => {
            const idx = STAGES.indexOf(form.stage);
            const next = STAGES[idx + 1];
            if (!next) return;
            setForm({ ...form, stage: next });
            await moveStage({ itemId, stage: next });
          }} className="rounded border border-slate-300 px-3 py-2 text-sm">Next Stage</button>
          <button type="button" onClick={() => updateItem({ itemId, ...form })} className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white">Save</button>
        </div>
      </header>

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2">
        <label className="space-y-1"><span className="text-sm font-medium">Title</span><input value={form.title} onChange={onChange("title")} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label className="space-y-1"><span className="text-sm font-medium">Owner</span><input value={form.owner} onChange={onChange("owner")} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label className="space-y-1"><span className="text-sm font-medium">Channel</span><select value={form.channel} onChange={onChange("channel")} className="w-full rounded border border-slate-300 px-3 py-2">{CHANNELS.map((channel) => (<option key={channel} value={channel}>{channel}</option>))}</select></label>
        <label className="space-y-1"><span className="text-sm font-medium">Target Date</span><input type="date" value={form.targetDate} onChange={onChange("targetDate")} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label className="space-y-1 md:col-span-2"><span className="text-sm font-medium">Stage</span><select value={form.stage} onChange={onChange("stage")} className="w-full rounded border border-slate-300 px-3 py-2">{STAGES.map((s) => (<option key={s} value={s}>{s}</option>))}</select></label>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <label className="space-y-1"><span className="text-sm font-medium">Brief</span><textarea value={form.brief} onChange={onChange("brief")} className="h-28 w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label className="space-y-1"><span className="text-sm font-medium">Script</span><textarea value={form.script} onChange={onChange("script")} className="h-[420px] w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm" /></label>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Image Attachments</h2>
          <label className="cursor-pointer rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700">Upload Image<input type="file" accept="image/*" onChange={onUpload} className="hidden" /></label>
        </div>

        {item.attachments.length === 0 ? <p className="text-sm text-slate-500">No images attached.</p> : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {item.attachments.map((attachment: any) => (
              <figure key={attachment._id} className="rounded border border-slate-200 p-2">
                {attachment.url ? <img src={attachment.url} alt={attachment.fileName} className="h-28 w-full rounded object-cover" /> : null}
                <figcaption className="mt-2 line-clamp-1 text-xs text-slate-600">{attachment.fileName}</figcaption>
                <button className="mt-2 rounded border border-red-200 px-2 py-1 text-xs text-red-700" onClick={() => removeAttachment({ itemId, attachmentId: attachment._id })}>Remove</button>
              </figure>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
