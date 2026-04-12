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
  const recentEvents = useQuery(api.office.getRecentPresenceEvents, { limit: 50 });
  const createDesk = useMutation(api.office.createDesk);
  const initDesks = useMutation(api.office.initDefaultDesks);
  const setPresence = useMutation(api.office.setPresenceByCode);
  const refreshFromSessions = useMutation(api.presence.refreshOfficeFromSessions);

  const [showAdmin, setShowAdmin] = useState(false);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [row, setRow] = useState(1);
  const [col, setCol] = useState(1);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  useEffect(() => {
    if (desks && desks.length === 0) {
      initDesks({});
    }
  }, [desks, initDesks]);

  const stats = useMemo(() => {
    const list = desks ?? [];
    const counts = { working: 0, idle: 0, away: 0, error: 0 } as Record<"working" | "idle" | "away" | "error", number>;
    for (const d of list) counts[d.presence] += 1;
    const unassigned = list.filter((d) => !d.agentName).length;
    return { total: list.length, unassigned, ...counts };
  }, [desks]);

  // Map desk code -> most recent event note (source)
  const deskSource = useMemo(() => {
    const map = new Map<string, string>();
    if (!recentEvents) return map;
    for (const e of recentEvents) {
      if (!map.has(e.deskCode)) map.set(e.deskCode, e.note ?? "manual");
    }
    return map;
  }, [recentEvents]);

  const errorDesks = (desks ?? []).filter((desk) => desk.presence === "error");
  const awayDesks = (desks ?? []).filter((desk) => desk.presence === "away");

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
              onClick={async () => {
                const result = await refreshFromSessions({ withinMinutes: 5 });
                setLastRefresh(`Updated ${result.updated} desks from ${result.activeAgentKeys.length} active sessions`);
              }}
              type="button"
            >
              Auto refresh
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

      {lastRefresh ? (
        <Card>
          <div className="text-sm text-slate-600">{lastRefresh}</div>
        </Card>
      ) : null}

      <section className="grid gap-3 md:grid-cols-5">
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Total desks</div><div className="mt-2 text-2xl font-semibold text-slate-900">{stats.total}</div><div className="mt-1 text-xs text-slate-500">Tracked office seats</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Working</div><div className="mt-2 text-2xl font-semibold text-emerald-700">{stats.working}</div><div className="mt-1 text-xs text-slate-500">Active desks right now</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Away</div><div className="mt-2 text-2xl font-semibold text-amber-700">{stats.away}</div><div className="mt-1 text-xs text-slate-500">Temporarily away desks</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Errors</div><div className="mt-2 text-2xl font-semibold text-red-700">{stats.error}</div><div className="mt-1 text-xs text-slate-500">Desks needing operator review</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Unassigned</div><div className="mt-2 text-2xl font-semibold text-slate-900">{stats.unassigned}</div><div className="mt-1 text-xs text-slate-500">Seats without mapped agent</div></Card>
      </section>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Presence guide</div>
            <div className="mt-1 text-sm text-slate-600">Working means active now, idle means available but quiet, away means temporarily unavailable, error means presence needs attention.</div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-800">working</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">idle</span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-800">away</span>
            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-red-800">error</span>
          </div>
        </div>
      </Card>

      {(errorDesks.length > 0 || awayDesks.length > 0) ? (
        <section className="grid gap-3 lg:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Desks needing attention</h2>
              <span className="text-xs text-slate-500">{errorDesks.length} error</span>
            </div>
            <div className="mt-3 space-y-2">
              {errorDesks.length ? errorDesks.map((desk) => (
                <Link key={desk._id} href={`/office/${desk._id}`} className="block rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 hover:bg-red-100">
                  {desk.code} • {desk.agentName || desk.label}
                </Link>
              )) : <p className="text-sm text-slate-500">No desks are currently in error.</p>}
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Away desks</h2>
              <span className="text-xs text-slate-500">{awayDesks.length} away</span>
            </div>
            <div className="mt-3 space-y-2">
              {awayDesks.length ? awayDesks.map((desk) => (
                <Link key={desk._id} href={`/office/${desk._id}`} className="block rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 hover:bg-amber-100">
                  {desk.code} • {desk.agentName || desk.label}
                </Link>
              )) : <p className="text-sm text-slate-500">No desks are marked away.</p>}
            </div>
          </Card>
        </section>
      ) : null}

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
                    <p className="text-[10px] text-slate-400">via {deskSource.get(desk.code) ?? "manual"}</p>
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
