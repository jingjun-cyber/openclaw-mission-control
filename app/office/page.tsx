"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, PageHeader } from "@/components/ui";

function PresenceDot({ presence }: { presence: "idle" | "working" | "away" | "error" }) {
  const cls =
    presence === "working"
      ? "bg-emerald-500"
      : presence === "away"
        ? "bg-amber-500"
        : presence === "error"
          ? "bg-red-500"
          : "bg-slate-400";
  return <span className={`h-2.5 w-2.5 rounded-full ${cls}`} />;
}

function Avatar({ src, label }: { src?: string | null; label: string }) {
  if (src) {
    return <img src={src} alt={label} className="h-10 w-10 rounded-full border border-slate-200 object-cover" />;
  }
  const initials = label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700">
      {initials || "?"}
    </div>
  );
}

export default function OfficePage() {
  const desks = useQuery(api.office.listDesks, {});
  const createDesk = useMutation(api.office.createDesk);
  const initDesks = useMutation(api.office.initDefaultDesks);
  const setPresence = useMutation(api.office.setPresenceByCode);

  const [showAdmin, setShowAdmin] = useState(false);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [row, setRow] = useState(1);
  const [col, setCol] = useState(1);

  useEffect(() => {
    if (desks && desks.length === 0) {
      initDesks({});
    }
  }, [desks, initDesks]);

  const stats = useMemo(() => {
    const list = desks ?? [];
    const counts = { working: 0, idle: 0, away: 0, error: 0 } as Record<"working" | "idle" | "away" | "error", number>;
    for (const d of list) counts[d.presence] += 1;
    return { total: list.length, ...counts };
  }, [desks]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Office"
        subtitle={`Presence overview • working ${stats.working} • idle ${stats.idle} • away ${stats.away} • error ${stats.error}`}
        action={
          <div className="flex items-center gap-2">
            <button
              className="rounded border border-slate-300 px-3 py-2 text-sm"
              onClick={() => initDesks({})}
              type="button"
            >
              Init desks
            </button>
            <button
              className="rounded border border-slate-300 px-3 py-2 text-sm"
              onClick={() => setShowAdmin((v) => !v)}
              type="button"
            >
              {showAdmin ? "Hide admin" : "Admin"}
            </button>
          </div>
        }
      />

      {showAdmin ? (
        <Card>
          <div className="grid gap-2 md:grid-cols-[1fr_2fr_auto_auto_auto]">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="D11"
              className="rounded border border-slate-300 px-3 py-2"
            />
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Desk 1-1"
              className="rounded border border-slate-300 px-3 py-2"
            />
            <input
              type="number"
              value={row}
              onChange={(e) => setRow(Number(e.target.value || 1))}
              className="rounded border border-slate-300 px-3 py-2"
            />
            <input
              type="number"
              value={col}
              onChange={(e) => setCol(Number(e.target.value || 1))}
              className="rounded border border-slate-300 px-3 py-2"
            />
            <button
              className="rounded bg-blue-600 px-3 py-2 text-white"
              onClick={async () => {
                if (!code.trim() || !label.trim()) return;
                await createDesk({ code: code.trim(), label: label.trim(), row, col });
                setCode("");
                setLabel("");
              }}
              type="button"
            >
              Create
            </button>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {desks?.map((desk) => (
            <div
              key={desk._id}
              className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar src={desk.avatar} label={desk.agentName || desk.label} />
                  <div>
                    <div className="flex items-center gap-2">
                      <PresenceDot presence={desk.presence} />
                      <p className="font-semibold text-slate-900">{desk.agentName || "Unassigned"}</p>
                    </div>
                    <p className="text-xs text-slate-500">{desk.label} • {desk.code} • {desk.row},{desk.col}</p>
                  </div>
                </div>

                <Link
                  href={`/office/${desk._id}`}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                  Details
                </Link>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setPresence({ deskCode: desk.code, presence: "working" })}
                  className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-800"
                >
                  Working
                </button>
                <button
                  type="button"
                  onClick={() => setPresence({ deskCode: desk.code, presence: "idle" })}
                  className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                >
                  Idle
                </button>
                <button
                  type="button"
                  onClick={() => setPresence({ deskCode: desk.code, presence: "away" })}
                  className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800"
                >
                  Away
                </button>
                <button
                  type="button"
                  onClick={() => setPresence({ deskCode: desk.code, presence: "error" })}
                  className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800"
                >
                  Error
                </button>
              </div>
            </div>
          ))}
          {desks?.length === 0 ? <p className="text-sm text-slate-500">No desks yet.</p> : null}
        </div>
      </Card>
    </div>
  );
}
