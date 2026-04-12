"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, PageHeader } from "@/components/ui";

function fmtCost(value: number) {
  return `$${value.toFixed(value >= 1 ? 2 : 4)}`;
}

function fmtTokens(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </Card>
  );
}

function MiniBars({ items, color }: { items: Array<{ day: string; cost: number; tokens: number; sessions: number }>; color: string }) {
  const max = useMemo(() => Math.max(...items.map((item) => item.cost), 0.0001), [items]);
  return (
    <div className="flex items-end gap-2">
      {items.map((item) => {
        const height = Math.max(10, Math.round((item.cost / max) * 120));
        return (
          <div key={item.day} className="flex-1">
            <div className="group relative flex h-36 items-end">
              <div className={`w-full rounded-t-md ${color}`} style={{ height }} />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-40 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 shadow group-hover:block">
                <div className="font-medium text-slate-900">{item.day}</div>
                <div>Cost: {fmtCost(item.cost)}</div>
                <div>Tokens: {fmtTokens(item.tokens)}</div>
                <div>Sessions: {item.sessions}</div>
              </div>
            </div>
            <div className="mt-2 text-center text-[11px] text-slate-500">{item.day.slice(5)}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function UsagePage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/usage", { cache: "no-store" });
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
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Usage" subtitle="Token, spend, model mix, and high-cost session outliers from local OpenClaw session telemetry." />

      {error ? <Card><div className="text-sm text-red-700">Failed to load usage analytics: {error}</div></Card> : null}
      {!data && !error ? <Card><div className="text-sm text-slate-500">Loading usage analytics...</div></Card> : null}

      {data ? (
        <>
          <section className="grid gap-3 md:grid-cols-4">
            <Metric label="Today spend" value={fmtCost(data.summary.todayCost)} hint="Assistant usage cost in the last 24 hours" />
            <Metric label="7 day spend" value={fmtCost(data.summary.cost7)} hint="Rolling spend across recent sessions" />
            <Metric label="30 day spend" value={fmtCost(data.summary.cost30)} hint="Longer usage baseline" />
            <Metric label="Sessions scanned" value={String(data.summary.sessionsScanned)} hint="Recent session files with usage telemetry" />
          </section>

          <section className="grid gap-3 md:grid-cols-3">
            <Metric label="Today tokens" value={fmtTokens(data.summary.todayTokens)} hint="Total prompt + completion + cache reads" />
            <Metric label="7 day tokens" value={fmtTokens(data.summary.tokens7)} hint="Recent working-set token volume" />
            <Metric label="30 day tokens" value={fmtTokens(data.summary.tokens30)} hint="Longer-term token usage" />
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-slate-900">7 day spend trend</div>
                  <div className="mt-1 text-sm text-slate-600">Quick view of cost movement by day.</div>
                </div>
                <div className="text-xs text-slate-500">Updated {new Date(data.checkedAt).toLocaleString()}</div>
              </div>
              <div className="mt-5"><MiniBars items={data.trend7} color="bg-slate-900" /></div>
            </Card>

            <Card>
              <div className="text-lg font-semibold text-slate-900">30 day spend trend</div>
              <div className="mt-1 text-sm text-slate-600">Use this to spot weekly spikes or drift.</div>
              <div className="mt-5"><MiniBars items={data.trend30} color="bg-emerald-600" /></div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <div className="text-lg font-semibold text-slate-900">By agent</div>
              <div className="mt-4 space-y-3 text-sm">
                {data.byAgent.map((row: any) => (
                  <div key={row.key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3"><div className="font-medium text-slate-900">{row.key}</div><div>{fmtCost(row.cost)}</div></div>
                    <div className="mt-1 text-xs text-slate-500">{fmtTokens(row.tokens)} tokens • {row.sessions} sessions</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="text-lg font-semibold text-slate-900">By source</div>
              <div className="mt-4 space-y-3 text-sm">
                {data.bySource.map((row: any) => (
                  <div key={row.key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3"><div className="font-medium capitalize text-slate-900">{row.key}</div><div>{fmtCost(row.cost)}</div></div>
                    <div className="mt-1 text-xs text-slate-500">{fmtTokens(row.tokens)} tokens • {row.sessions} sessions</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="text-lg font-semibold text-slate-900">Model mix</div>
              <div className="mt-4 space-y-3 text-sm">
                {data.byModel.slice(0, 8).map((row: any) => (
                  <div key={`${row.provider}/${row.key}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="font-medium text-slate-900">{row.key}</div>
                    <div className="mt-1 text-xs text-slate-500">{row.provider}</div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-600"><span>{fmtTokens(row.tokens)} tokens • {row.sessions} sessions</span><span>{fmtCost(row.cost)}</span></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-slate-900">High-cost outliers</div>
                <div className="mt-1 text-sm text-slate-600">Largest sessions by total cost, useful for anomaly review.</div>
              </div>
              <div className="text-xs text-slate-500">Top {data.outliers.length}</div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="pb-2 pr-4">Agent</th>
                    <th className="pb-2 pr-4">Source</th>
                    <th className="pb-2 pr-4">Model</th>
                    <th className="pb-2 pr-4">Cost</th>
                    <th className="pb-2 pr-4">Tokens</th>
                    <th className="pb-2 pr-4">Runs</th>
                    <th className="pb-2 pr-4">Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {data.outliers.map((row: any) => (
                    <tr key={row.sessionId} className="border-t border-slate-100">
                      <td className="py-3 pr-4 font-medium text-slate-900">{row.agent}</td>
                      <td className="py-3 pr-4 capitalize">{row.source}</td>
                      <td className="py-3 pr-4">{row.model}</td>
                      <td className="py-3 pr-4">{fmtCost(row.totalCost)}</td>
                      <td className="py-3 pr-4">{fmtTokens(row.totalTokens)}</td>
                      <td className="py-3 pr-4">{row.runs}</td>
                      <td className="py-3 pr-4 text-xs text-slate-500">{row.ageHours}h ago</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
