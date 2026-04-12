"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, PageHeader } from "@/components/ui";

function HealthPill({ label, tone = "slate" }: { label: string; tone?: "slate" | "emerald" | "amber" | "red" }) {
  const cls =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "red"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-slate-200 bg-slate-50 text-slate-700";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span>;
}

export default function MemoryPage() {
  const [query, setQuery] = useState("");
  const [path, setPath] = useState("");
  const [title, setTitle] = useState("");
  const [view, setView] = useState<"all" | "stale" | "empty">("all");

  const search = useQuery(api.memory.search, { query });
  const health = useQuery(api.memory.health, {});
  const createDoc = useMutation(api.memory.create);

  const docs = useMemo(() => {
    const list = search ?? [];
    if (view === "stale") {
      const weekMs = 1000 * 60 * 60 * 24 * 7;
      return list.filter((doc) => Date.now() - (doc.sourceUpdatedAt ?? doc.updatedAt ?? 0) > weekMs);
    }
    if (view === "empty") {
      return list.filter((doc) => !doc.content?.trim().length);
    }
    return list;
  }, [search, view]);
  const freshnessTone = health?.freshnessState === "fresh" ? "emerald" : health?.freshnessState === "mixed" ? "amber" : "red";
  const searchTone = health?.searchReady ? "emerald" : "red";

  return (
    <div className="space-y-5">
      <PageHeader title="Memory" subtitle="Markdown memory documents with search, freshness, and index readiness" />

      <section className="grid gap-3 md:grid-cols-4">
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Documents</div><div className="mt-2 text-2xl font-semibold text-slate-900">{health?.totalDocs ?? "-"}</div><div className="mt-1 text-xs text-slate-500">Total memory docs tracked</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Searchable</div><div className="mt-2 text-2xl font-semibold text-emerald-700">{health?.searchableDocs ?? "-"}</div><div className="mt-1 text-xs text-slate-500">Docs with content available to search</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Stale</div><div className="mt-2 text-2xl font-semibold text-amber-700">{health?.staleDocs ?? "-"}</div><div className="mt-1 text-xs text-slate-500">Docs older than 7 days by source/update time</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Empty</div><div className="mt-2 text-2xl font-semibold text-red-700">{health?.withoutContent ?? "-"}</div><div className="mt-1 text-xs text-slate-500">Docs created without searchable content</div></Card>
      </section>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-900">Memory health</div>
            <div className="flex flex-wrap gap-2">
              <HealthPill label={health?.searchReady ? "Search ready" : "Search not ready"} tone={searchTone} />
              <HealthPill label={health?.freshnessState === "fresh" ? "Fresh" : health?.freshnessState === "mixed" ? "Mixed freshness" : "Stale"} tone={freshnessTone} />
            </div>
          </div>
          <div className="grid gap-1 text-xs text-slate-500">
            <span>Latest app update: {health?.latestUpdatedAt ? new Date(health.latestUpdatedAt).toLocaleString() : "unknown"}</span>
            <span>Latest source update: {health?.latestSourceUpdatedAt ? new Date(health.latestSourceUpdatedAt).toLocaleString() : "unknown"}</span>
          </div>
        </div>
        {health && (!health.searchReady || health.staleDocs > 0 || health.withoutContent > 0) ? (
          <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {!health.searchReady ? "No searchable memory content is available yet. " : ""}
            {health.staleDocs > 0 ? `${health.staleDocs} stale docs need refresh. ` : ""}
            {health.withoutContent > 0 ? `${health.withoutContent} docs are empty and won't appear meaningfully in search.` : ""}
          </div>
        ) : null}
      </Card>

      <Card>
        <div className="grid gap-3 md:grid-cols-[2fr_auto_auto_auto_1fr] md:items-center">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search content..." className="rounded border border-slate-300 px-3 py-2" />
          <button type="button" onClick={() => setView("all")} className={`rounded px-3 py-2 text-sm ${view === "all" ? "bg-slate-900 text-white" : "border border-slate-300"}`}>All</button>
          <button type="button" onClick={() => setView("stale")} className={`rounded px-3 py-2 text-sm ${view === "stale" ? "bg-amber-600 text-white" : "border border-slate-300"}`}>Stale</button>
          <button type="button" onClick={() => setView("empty")} className={`rounded px-3 py-2 text-sm ${view === "empty" ? "bg-red-600 text-white" : "border border-slate-300"}`}>Empty</button>
          <span className="justify-self-end self-center text-xs text-slate-500">{docs.length} results</span>
        </div>
      </Card>

      <Card>
        <div className="grid gap-2 md:grid-cols-[1.5fr_1.5fr_auto]">
          <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="docs/path.md" className="rounded border border-slate-300 px-3 py-2" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" className="rounded border border-slate-300 px-3 py-2" />
          <button className="rounded bg-blue-600 px-3 py-2 text-white" onClick={async () => {
            if (!path.trim() || !title.trim()) return;
            await createDoc({ path: path.trim(), title: title.trim(), content: "", tags: [] });
            setPath("");
            setTitle("");
          }}>Create</button>
        </div>
      </Card>

      <Card>
        <div className="space-y-2">
          {docs.map((doc) => (
            <Link key={doc._id} href={`/memory/${doc._id}`} className="block rounded border border-slate-200 p-3 hover:bg-slate-50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{doc.title}</p>
                  <p className="text-xs text-slate-600">{doc.path}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{doc.content?.trim() ? doc.content.slice(0, 160) : "No content yet"}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-[11px]">
                  <HealthPill label={doc.content?.trim() ? "searchable" : "empty"} tone={doc.content?.trim() ? "emerald" : "red"} />
                  <span className="text-slate-400">{doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : "unknown"}</span>
                </div>
              </div>
            </Link>
          ))}
          {docs.length === 0 ? <p className="text-sm text-slate-500">No documents found.</p> : null}
        </div>
      </Card>
    </div>
  );
}
