"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, PageHeader } from "@/components/ui";
import { STAGES, type Stage } from "@/lib/stages";

const PROJECTS = [
  { key: "mission-control", label: "Mission Control" },
  { key: "adas-hmi-ux", label: "ADAS HMI" }
] as const;

type ProjectKey = (typeof PROJECTS)[number]["key"];

export default function PipelinePage() {
  const [projectKey, setProjectKey] = useState<ProjectKey>("mission-control");
  const items = useQuery(api.content.getBoard, { projectKey });
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
      <PageHeader
        title="Documents Workbench"
        subtitle="Source-backed working documents and content assets from idea to archive"
        action={
          <div className="flex items-center gap-2">
            {PROJECTS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setProjectKey(p.key)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  projectKey === p.key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />
      <section className="grid gap-3 md:grid-cols-4">
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Documents</div><div className="mt-2 text-2xl font-semibold text-slate-900">{items?.length ?? 0}</div><div className="mt-1 text-xs text-slate-500">Source-backed items in this workspace</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Attachments</div><div className="mt-2 text-2xl font-semibold text-emerald-700">{items?.reduce((sum, item) => sum + (item.attachmentCount ?? 0), 0) ?? 0}</div><div className="mt-1 text-xs text-slate-500">Files attached to working docs</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Drafting</div><div className="mt-2 text-2xl font-semibold text-amber-700">{items?.filter((item) => ["Outline","Draft","Edit"].includes(item.stage)).length ?? 0}</div><div className="mt-1 text-xs text-slate-500">Docs still being actively written</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Published</div><div className="mt-2 text-2xl font-semibold text-blue-700">{items?.filter((item) => item.stage === "Publish").length ?? 0}</div><div className="mt-1 text-xs text-slate-500">Ready or already shipped docs</div></Card>
      </section>

      <Card>
        <div className="grid gap-2 md:grid-cols-[2fr_1fr_auto]">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Item title" className="rounded border border-slate-300 px-3 py-2" />
          <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner" className="rounded border border-slate-300 px-3 py-2" />
          <button className="rounded bg-blue-600 px-3 py-2 text-white" onClick={async () => {
            if (!title.trim()) return;
            await createItem({ title: title.trim(), owner: owner.trim() || undefined, projectKey });
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
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                      <span>Scope: {item.sourceScope}</span>
                      <span>Files: {item.attachmentCount ?? 0}</span>
                    </div>
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
