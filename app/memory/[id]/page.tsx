"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, DetailBackLink, PageHeader } from "@/components/ui";

export default function MemoryDetailPage() {
  const params = useParams<{ id: string }>();
  const docId = params.id as never;
  const doc = useQuery(api.memory.get, { docId });
  const updateDoc = useMutation(api.memory.update);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!doc) return;
    setTitle(doc.title);
    setContent(doc.content);
    setTags(doc.tags.join(", "));
  }, [doc]);

  if (doc === undefined) return <p className="text-sm text-slate-600">Loading document...</p>;
  if (doc === null) return <p className="text-sm text-red-600">Document not found.</p>;

  return (
    <div className="space-y-4">
      <PageHeader title="Memory Document" subtitle={doc.path} action={<DetailBackLink href="/memory" label="Back to memory" />} />
      <Card className="space-y-3">
        <label className="space-y-1 block"><span className="text-sm">Title</span><input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label className="space-y-1 block"><span className="text-sm">Tags (comma-separated)</span><input value={tags} onChange={(e)=>setTags(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label className="space-y-1 block"><span className="text-sm">Markdown Content</span><textarea value={content} onChange={(e)=>setContent(e.target.value)} className="h-[480px] w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm" /></label>
        <button className="rounded bg-blue-600 px-3 py-2 text-white" onClick={() => updateDoc({ docId, title, content, tags: tags.split(",").map((x) => x.trim()).filter(Boolean) })}>Save</button>
      </Card>
    </div>
  );
}
