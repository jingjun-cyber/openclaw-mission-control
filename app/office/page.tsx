"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Card, PageHeader } from "@/components/ui";

export default function OfficePage() {
  const desks = useQuery(api.office.listDesks, {});
  const createDesk = useMutation(api.office.createDesk);
  const initDesks = useMutation(api.office.initDefaultDesks);

  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [row, setRow] = useState(1);
  const [col, setCol] = useState(1);

  return (
    <div className="space-y-5">
      <PageHeader title="Office" subtitle="Desk grid and agent presence" action={<button className="rounded border border-slate-300 px-3 py-2 text-sm" onClick={() => initDesks({})}>Init default desks</button>} />

      <Card>
        <div className="grid gap-2 md:grid-cols-[1fr_2fr_auto_auto_auto]">
          <input value={code} onChange={(e)=>setCode(e.target.value)} placeholder="D11" className="rounded border border-slate-300 px-3 py-2" />
          <input value={label} onChange={(e)=>setLabel(e.target.value)} placeholder="Desk 1-1" className="rounded border border-slate-300 px-3 py-2" />
          <input type="number" value={row} onChange={(e)=>setRow(Number(e.target.value || 1))} className="rounded border border-slate-300 px-3 py-2" />
          <input type="number" value={col} onChange={(e)=>setCol(Number(e.target.value || 1))} className="rounded border border-slate-300 px-3 py-2" />
          <button className="rounded bg-blue-600 px-3 py-2 text-white" onClick={async () => {
            if (!code.trim() || !label.trim()) return;
            await createDesk({ code: code.trim(), label: label.trim(), row, col });
            setCode("");
            setLabel("");
          }}>Create</button>
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {desks?.map((desk) => (
            <Link key={desk._id} href={`/office/${desk._id}`} className="rounded border border-slate-200 p-3 hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <p className="font-medium">{desk.label}</p>
                <span className={`rounded px-2 py-0.5 text-xs ${
                  desk.presence === "working" ? "bg-emerald-100 text-emerald-700" :
                  desk.presence === "away" ? "bg-amber-100 text-amber-700" :
                  desk.presence === "error" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                }`}>{desk.presence}</span>
              </div>
              <p className="text-xs text-slate-600">{desk.code} • {desk.row},{desk.col}</p>
              <p className="mt-1 text-sm text-slate-700">{desk.avatar ? `${desk.avatar} ` : ""}{desk.agentName || "Unassigned"}</p>
            </Link>
          ))}
          {desks?.length === 0 ? <p className="text-sm text-slate-500">No desks yet.</p> : null}
        </div>
      </Card>
    </div>
  );
}
