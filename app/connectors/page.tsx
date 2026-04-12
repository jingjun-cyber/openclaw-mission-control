"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, PageHeader } from "@/components/ui";

function StatusBadge({ state }: { state: string }) {
  const normalized = state.toLowerCase();
  const cls = normalized === "ok"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : normalized === "warn"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{state}</span>;
}

function OverallBadge({ state }: { state: string }) {
  const cls = state === "healthy"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : state === "warning"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{state}</span>;
}

export default function ConnectorsPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/connectors/status");
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    };

    load();
    const timer = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="Connector Health" subtitle="Status for gateway, Convex, and enabled communication channels." />

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm text-slate-600">Auto-refreshes every 30 seconds so you can spot degraded channels and runtime edges quickly.</div>
            <div className="mt-1 text-xs text-slate-500">Last checked: {data?.checkedAt ? new Date(data.checkedAt).toLocaleString() : "pending"}</div>
          </div>
          {data?.overall ? <OverallBadge state={data.overall} /> : null}
        </div>
      </Card>

      {data?.counts ? (
        <>
          <section className="grid gap-3 md:grid-cols-4">
            <Card><div className="text-xs uppercase tracking-wide text-slate-500">OK</div><div className="mt-2 text-2xl font-semibold text-emerald-700">{data.counts.ok}</div></Card>
            <Card><div className="text-xs uppercase tracking-wide text-slate-500">Warnings</div><div className="mt-2 text-2xl font-semibold text-amber-700">{data.counts.warn}</div></Card>
            <Card><div className="text-xs uppercase tracking-wide text-slate-500">Errors</div><div className="mt-2 text-2xl font-semibold text-red-700">{data.counts.error}</div></Card>
            <Card><div className="text-xs uppercase tracking-wide text-slate-500">Active issues</div><div className="mt-2 text-2xl font-semibold text-slate-900">{data.counts.warn + data.counts.error}</div><div className="mt-1 text-xs text-slate-500">Connectors needing review right now</div></Card>
          </section>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Operator actions</div>
                <div className="mt-1 text-sm text-slate-600">Use these shortcuts to fix configuration, runtime, or delivery issues faster.</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/settings" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Open settings</Link>
                <Link href="/sync" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Open sync</Link>
                <Link href="/incidents" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Open incidents</Link>
              </div>
            </div>
          </Card>
        </>
      ) : null}

      {error ? (
        <Card>
          <div className="text-sm text-red-700">Failed to load connector status: {error}</div>
        </Card>
      ) : null}

      <div className="grid gap-3">
        {data?.items?.map((item: any) => (
          <Card key={item.key}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium text-slate-900">{item.name}</div>
                <div className="mt-1 text-sm text-slate-600">{item.summary}</div>
              </div>
              <StatusBadge state={item.state} />
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
              <span>{item.key === "gateway" ? "Runtime connector" : item.key === "convex" ? "Config dependency" : "Channel connector"}</span>
              {item.state !== "OK" ? <span>Needs review</span> : <span>Healthy</span>}
            </div>
            <div className="mt-2 text-xs text-slate-500">{item.detail}</div>
            <div className="mt-1 text-xs text-slate-400">Checked: {item.checkedAt ? new Date(item.checkedAt).toLocaleString() : "unknown"}</div>
          </Card>
        ))}
        {!data && !error ? <Card><div className="text-sm text-slate-500">Loading connector status...</div></Card> : null}
      </div>
    </div>
  );
}
