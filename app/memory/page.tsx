"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, PageHeader } from "@/components/ui";

export default function MemoryPage() {
  const [query, setQuery] = useState("");
  const [path, setPath] = useState("");
  const [title, setTitle] = useState("");

  const search = useQuery(api.memory.search, { query });
  const createDoc = useMutation(api.memory.create);

  const docs = useMemo(() => search ?? [], [search]);

  return (
    <div className="space-y-5">
      <PageHeader title="Memory" subtitle="Markdown memory documents with search" />
      <Card>
        <div className="grid gap-2 md:grid-cols-[2fr_1fr]">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search content..." className="rounded border border-slate-300 px-3 py-2" />
          <span className="self-center text-xs text-slate-500">{docs.length} results</span>
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
              <p className="font-medium">{doc.title}</p>
              <p className="text-xs text-slate-600">{doc.path}</p>
            </Link>
          ))}
          {docs.length === 0 ? <p className="text-sm text-slate-500">No documents found.</p> : null}
        </div>
      </Card>
    </div>
  );
}
