"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, PageHeader } from "@/components/ui";
import { useLocalToken } from "@/components/use-local-token";

function SyncBadge({ status }: { status: string }) {
  const cls = status === "healthy"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : status === "critical"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-amber-50 text-amber-800 border-amber-200";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{status}</span>;
}

export default function SettingsPage() {
  const summary = useQuery(api.stats.summary, {});
  const sync = useQuery(api.sync.dashboard, {});
  const approvals = useQuery(api.approvals.summary, {});
  const localToken = useLocalToken();
  const [security, setSecurity] = useState<any>(null);
  const [connectors, setConnectors] = useState<any>(null);
  const [version, setVersion] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [securityRes, connectorsRes, versionRes, safetyRes] = await Promise.all([
          fetch("/api/security/status"),
          fetch("/api/connectors/status"),
          fetch("/api/version/status"),
          fetch("/api/safety/status")
        ]);
        const [securityJson, connectorsJson, versionJson, safetyJson] = await Promise.all([
          securityRes.json(),
          connectorsRes.json(),
          versionRes.json(),
          safetyRes.json()
        ]);
        if (!cancelled) {
          setSecurity(securityJson);
          setConnectors(connectorsJson);
          setVersion({ ...versionJson, safety: safetyJson });
        }
      } catch {}
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Environment and module summary" />
      <Card>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">Environment</h2>
        <p className="text-sm text-slate-700">`NEXT_PUBLIC_CONVEX_URL`: {process.env.NEXT_PUBLIC_CONVEX_URL ? "configured" : "missing"}</p>
        <p className="text-sm text-slate-700">`OFFICE_WEBHOOK_SECRET`: configured in server env</p>
      </Card>
      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Security Risk</h2>
          {security ? <SyncBadge status={security.level} /> : null}
        </div>
        {security ? (
          <div className="space-y-3">
            <div className="text-sm text-slate-700">{security.impact}</div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded border border-slate-200 p-2 text-sm">Critical: {security.counts.critical}</div>
              <div className="rounded border border-slate-200 p-2 text-sm">Warnings: {security.counts.warn}</div>
              <div className="rounded border border-slate-200 p-2 text-sm">Info: {security.counts.info}</div>
            </div>
            <div className="space-y-2">
              {security.findings.map((item: any, idx: number) => (
                <div key={`${item.title}-${idx}`} className="rounded border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-900">{item.title}</div>
                    <SyncBadge status={item.level === "critical" ? "critical" : item.level === "warn" ? "warning" : "healthy"} />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">Recommended next steps</div>
              <ul className="space-y-1 text-sm text-slate-600">
                {security.guidance.map((item: string, idx: number) => <li key={idx}>• {item}</li>)}
              </ul>
            </div>
            <div className="text-xs text-slate-500">Last checked: {security.checkedAt ? new Date(security.checkedAt).toLocaleString() : "unknown"}</div>
          </div>
        ) : <p className="text-sm text-slate-600">Loading security summary...</p>}
      </Card>
      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Connection Health</h2>
          <div className="flex items-center gap-3">
            <Link href="/connectors" className="text-sm text-slate-500 hover:underline">Open connector dashboard</Link>
            {connectors ? <SyncBadge status={connectors.overall} /> : null}
          </div>
        </div>
        {connectors ? (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded border border-slate-200 p-2 text-sm">OK: {connectors.counts.ok}</div>
              <div className="rounded border border-slate-200 p-2 text-sm">Warnings: {connectors.counts.warn}</div>
              <div className="rounded border border-slate-200 p-2 text-sm">Errors: {connectors.counts.error}</div>
            </div>
            <div className="space-y-2">
              {connectors.items.slice(0, 5).map((item: any) => (
                <div key={item.key} className="rounded border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <SyncBadge status={item.state === "OK" ? "healthy" : item.state === "WARN" ? "warning" : "critical"} />
                  </div>
                  <div className="mt-1 text-sm text-slate-600">{item.summary}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">Next-step guidance</div>
              <ul className="space-y-1 text-sm text-slate-600">
                {connectors.items.filter((item: any) => item.state !== "OK").length ? connectors.items.filter((item: any) => item.state !== "OK").slice(0, 3).map((item: any) => (
                  <li key={item.key}>• {item.name}: review connector dashboard details and current runtime config.</li>
                )) : <li>• All tracked connectors look healthy right now.</li>}
              </ul>
            </div>
            <div className="text-xs text-slate-500">Last checked: {connectors.checkedAt ? new Date(connectors.checkedAt).toLocaleString() : "unknown"}</div>
          </div>
        ) : <p className="text-sm text-slate-600">Loading connection health...</p>}
      </Card>
      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Version / Update</h2>
          {version ? <SyncBadge status={version.level} /> : null}
        </div>
        {version ? (
          <div className="space-y-2 text-sm text-slate-700">
            <div className="rounded border border-slate-200 p-3">OS: {version.os}</div>
            <div className="rounded border border-slate-200 p-3">Channel: {version.channel}</div>
            <div className="rounded border border-slate-200 p-3">Update: {version.update}</div>
            <div className="rounded border border-slate-200 p-3">Safety: {version.safety?.readOnly ? "read-only" : version.safety?.mutationGuard ? "guarded writes" : "writes enabled"}</div>
            <div className="rounded border border-slate-200 p-3">Token: {version.safety?.requireToken ? (localToken.token ? "set" : "required") : "not enforced"}</div>
            <div className="text-slate-600">{version.guidance}</div>
            <div className="text-xs text-slate-500">Last checked: {version.checkedAt ? new Date(version.checkedAt).toLocaleString() : "unknown"}</div>
          </div>
        ) : <p className="text-sm text-slate-600">Loading version status...</p>}
      </Card>
      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Approval Controls</h2>
          <div className="flex items-center gap-3">
            <Link href="/approvals" className="text-sm text-slate-500 hover:underline">Open approvals</Link>
            {approvals ? <SyncBadge status={approvals.pending > 0 ? "warning" : "healthy"} /> : null}
          </div>
        </div>
        {approvals ? (
          <div className="space-y-2 text-sm text-slate-700">
            <div className="rounded border border-slate-200 p-3">Pending approvals: {approvals.pending}</div>
            <div className="rounded border border-slate-200 p-3">High-risk pending: {approvals.highRiskPending}</div>
            <div className="rounded border border-slate-200 p-3">Approved waiting execution: {approvals.approved}</div>
            <div className="text-slate-600">Sensitive actions now flow through pending, approved, rejected, and executed states with dry-run summaries attached.</div>
          </div>
        ) : <p className="text-sm text-slate-600">Loading approval controls...</p>}
      </Card>
      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Sync Health</h2>
          <div className="flex items-center gap-3">
            <Link href="/sync" className="text-sm text-slate-500 hover:underline">Open sync dashboard</Link>
            {sync ? <SyncBadge status={sync.status} /> : null}
          </div>
        </div>
        {sync ? (
          <div className="space-y-2">
            {sync.items.map((item: any) => (
              <div key={item.key} className="rounded border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-slate-900">{item.label}</div>
                  <SyncBadge status={item.status} />
                </div>
                <div className="mt-1 text-sm text-slate-600">{item.detail}</div>
                <div className="mt-1 text-xs text-slate-500">Last updated: {item.lastUpdatedAt ? new Date(item.lastUpdatedAt).toLocaleString() : "unknown"} • freshness: {item.ageLabel}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">Loading sync health...</p>
        )}
      </Card>
      <Card>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">Local Token</h2>
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            {localToken.required
              ? "A local token is required for protected operations. Set it below to enable writes."
              : "Token authentication is not enforced for this deployment."}
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Enter local token"
              value={localToken.token ?? ""}
              onChange={(e) => localToken.saveToken(e.target.value)}
              className="flex-1 rounded border border-slate-300 px-3 py-2"
            />
            <button
              onClick={() => localToken.clearToken()}
              className="rounded border border-slate-300 px-3 py-2"
              type="button"
            >
              Clear
            </button>
          </div>
          {localToken.token && localToken.required ? <p className="text-emerald-700">Token is set. Protected operations should be available.</p> : null}
          {!localToken.token && localToken.required ? <p className="text-amber-700">No token set. Protected operations may be blocked.</p> : null}
        </div>
      </Card>
      <Card>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">Data Summary</h2>
        {summary ? (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <li className="rounded border border-slate-200 p-2">Tasks: {summary.tasks}</li>
            <li className="rounded border border-slate-200 p-2">Pipeline items: {summary.pipeline}</li>
            <li className="rounded border border-slate-200 p-2">Events: {summary.events}</li>
            <li className="rounded border border-slate-200 p-2">Memory docs: {summary.docs}</li>
            <li className="rounded border border-slate-200 p-2">Agents: {summary.agents}</li>
            <li className="rounded border border-slate-200 p-2">Desks: {summary.desks}</li>
          </ul>
        ) : (
          <p className="text-sm text-slate-600">Loading summary...</p>
        )}
      </Card>
    </div>
  );
}
