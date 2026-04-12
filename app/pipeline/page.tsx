"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, PageHeader } from "@/components/ui";
import { STAGES, type Stage } from "@/lib/stages";
import { WORKFLOW_STATES, DEFAULT_CHECKLISTS, getProgress, type WorkflowState } from "@/lib/workflow";

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
  const setWorkflowState = useMutation(api.content.setWorkflowState);
  const updateChecklist = useMutation(api.content.updateChecklist);

  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

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

  const toggleChecklistItem = async (itemId: string, currentChecklist: any[], checkId: string) => {
    const updated = currentChecklist.map((c) =>
      c.id === checkId ? { ...c, done: !c.done } : c
    );
    await updateChecklist({ itemId: itemId as never, checklist: updated });
  };

  const initChecklist = async (itemId: string, stage: Stage) => {
    const defaults = DEFAULT_CHECKLISTS[stage];
    await updateChecklist({ itemId: itemId as never, checklist: defaults.map((d) => ({ ...d, done: false })) });
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
                {grouped[stage].map((item) => {
                  const ws = (item.workflowState ?? "new") as WorkflowState;
                  const wsInfo = WORKFLOW_STATES[ws];
                  const progress = getProgress(item.checklist);
                  const isExpanded = expandedItem === item._id;

                  return (
                    <article key={item._id} className="rounded border border-slate-200 p-2">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/pipeline/${item._id}`} className="font-medium hover:underline">{item.title}</Link>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] ${wsInfo.color}`}>{wsInfo.label}</span>
                      </div>
                      <p className="text-xs text-slate-600">{item.owner || "Unassigned"} • {item.channel}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                        <span>Scope: {item.sourceScope}</span>
                        <span>Files: {item.attachmentCount ?? 0}</span>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {item.previewUrl ? <img src={item.previewUrl} alt={item.title} className="mt-2 h-24 w-full rounded object-cover" /> : null}
                      <div className="mt-2 flex flex-wrap gap-1 text-xs">
                        <button onClick={() => shift(item._id, item.stage, -1)} className="rounded border border-slate-300 px-2 py-1">Prev</button>
                        <button onClick={() => shift(item._id, item.stage, 1)} className="rounded border border-slate-300 px-2 py-1">Next</button>
                        <button
                          onClick={() => setExpandedItem(isExpanded ? null : item._id)}
                          className="rounded border border-slate-300 px-2 py-1"
                        >
                          {isExpanded ? "Close" : "Checklist"}
                        </button>
                      </div>
                      {/* Checklist expansion */}
                      {isExpanded ? (
                        <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                          {item.checklist && item.checklist.length > 0 ? (
                            <>
                              {item.checklist.map((c: any) => (
                                <label key={c.id} className="flex items-center gap-2 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={c.done}
                                    onChange={() => toggleChecklistItem(item._id, item.checklist, c.id)}
                                    className="rounded"
                                  />
                                  <span className={c.done ? "line-through text-slate-400" : ""}>{c.label}</span>
                                </label>
                              ))}
                              <div className="mt-1 text-[10px] text-slate-500">{progress}% complete</div>
                            </>
                          ) : (
                            <button
                              onClick={() => initChecklist(item._id, item.stage)}
                              className="text-xs text-blue-600 hover:underline"
                              type="button"
                            >
                              Initialize checklist
                            </button>
                          )}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
