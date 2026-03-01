"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, PageHeader } from "@/components/ui";
import { STAGES, type Stage } from "@/lib/stages";

export default function PipelinePage() {
  const items = useQuery(api.content.getBoard, {});
  const createItem = useMutation(api.content.createItem);
  const moveStage = useMutation(api.content.moveStage);
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");

  const grouped = useMemo(() => {
    const byStage = Object.fromEntries(STAGES.map((s) => [s, [] as any[]])) as Record<Stage, any[]>;
    for (const item of items ?? []) byStage[item.stage as Stage].push(item);
    return byStage;
  }, [items]);

  const shift = async (id: string, current: Stage, dir: -1 | 1) => {
    const idx = STAGES.indexOf(current);
    const next = STAGES[idx + dir];
    if (!next) return;
    await moveStage({ itemId: id as never, stage: next });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Content Pipeline" subtitle="Idea to archive workflow" />
      <Card>
        <div className="grid gap-2 md:grid-cols-[2fr_1fr_auto]">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Item title" className="rounded border border-slate-300 px-3 py-2" />
          <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner" className="rounded border border-slate-300 px-3 py-2" />
          <button className="rounded bg-blue-600 px-3 py-2 text-white" onClick={async () => {
            if (!title.trim()) return;
            await createItem({ title: title.trim(), owner: owner.trim() || undefined });
            setTitle("");
            setOwner("");
          }}>Create</button>
        </div>
      </Card>
      <div className="overflow-x-auto">
        <div className="grid min-w-[1200px] grid-cols-6 gap-3">
          {STAGES.map((stage) => (
            <Card key={stage} className="p-3">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">{stage} <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{grouped[stage].length}</span></h2>
              <div className="space-y-2">
                {items === undefined ? <p className="text-sm text-slate-500">Loading...</p> : null}
                {items !== undefined && grouped[stage].length === 0 ? <p className="text-sm text-slate-500">No items</p> : null}
                {grouped[stage].map((item) => (
                  <article key={item._id} className="rounded border border-slate-200 p-2">
                    <Link href={`/pipeline/${item._id}`} className="font-medium hover:underline">{item.title}</Link>
                    <p className="text-xs text-slate-600">{item.owner || "Unassigned"} • {item.channel}</p>
                    {item.previewUrl ? <img src={item.previewUrl} alt={item.title} className="mt-2 h-24 w-full rounded object-cover" /> : null}
                    <div className="mt-2 flex gap-2 text-xs">
                      <button onClick={() => shift(item._id, item.stage, -1)} className="rounded border border-slate-300 px-2 py-1">Prev</button>
                      <button onClick={() => shift(item._id, item.stage, 1)} className="rounded border border-slate-300 px-2 py-1">Next</button>
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
