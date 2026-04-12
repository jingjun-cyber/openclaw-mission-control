"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, PageHeader } from "@/components/ui";

function Badge({ status }: { status: string }) {
  const cls =
    status === "pending"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : status === "approved"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : status === "executed"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-700 border-red-200";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{status}</span>;
}

export default function ApprovalsPage() {
  const summary = useQuery(api.approvals.summary, {});
  const approvals = useQuery(api.approvals.list, {});
  const createApproval = useMutation(api.approvals.create);
  const approve = useMutation(api.approvals.approve);
  const reject = useMutation(api.approvals.reject);
  const executeApproval = useMutation(api.approvals.execute);

  const [title, setTitle] = useState("");
  const [actionType, setActionType] = useState("delete");
  const [targetType, setTargetType] = useState("task");
  const [targetLabel, setTargetLabel] = useState("");
  const [riskLevel, setRiskLevel] = useState("high");
  const [rationale, setRationale] = useState("");

  return (
    <div className="space-y-5">
      <PageHeader title="Approvals" subtitle="Sensitive actions move through dry-run, approval, rejection, and execution states before side effects land." />

      <section className="grid gap-3 md:grid-cols-5">
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Pending</div><div className="mt-2 text-2xl font-semibold text-amber-700">{summary?.pending ?? 0}</div><div className="mt-1 text-xs text-slate-500">Waiting for operator decision</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Approved</div><div className="mt-2 text-2xl font-semibold text-blue-700">{summary?.approved ?? 0}</div><div className="mt-1 text-xs text-slate-500">Ready for execution</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Executed</div><div className="mt-2 text-2xl font-semibold text-emerald-700">{summary?.executed ?? 0}</div><div className="mt-1 text-xs text-slate-500">Already applied or simulated</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Rejected</div><div className="mt-2 text-2xl font-semibold text-red-700">{summary?.rejected ?? 0}</div><div className="mt-1 text-xs text-slate-500">Stopped by operator review</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">High-risk pending</div><div className="mt-2 text-2xl font-semibold text-slate-900">{summary?.highRiskPending ?? 0}</div><div className="mt-1 text-xs text-slate-500">Need fast review</div></Card>
      </section>

      <Card>
        <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">Request approval</div>
        <div className="grid gap-2 md:grid-cols-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="rounded border border-slate-300 px-3 py-2" />
          <input value={targetLabel} onChange={(e) => setTargetLabel(e.target.value)} placeholder="Target label" className="rounded border border-slate-300 px-3 py-2" />
          <select value={actionType} onChange={(e) => setActionType(e.target.value)} className="rounded border border-slate-300 px-3 py-2"><option value="delete">delete</option><option value="import">import</option><option value="sync">sync</option><option value="mutation">mutation</option><option value="deploy">deploy</option></select>
          <select value={targetType} onChange={(e) => setTargetType(e.target.value)} className="rounded border border-slate-300 px-3 py-2"><option value="task">task</option><option value="document">document</option><option value="session">session</option><option value="connector">connector</option><option value="system">system</option></select>
          <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className="rounded border border-slate-300 px-3 py-2"><option value="low">low</option><option value="medium">medium</option><option value="high">high</option></select>
          <input value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Why this action is needed" className="rounded border border-slate-300 px-3 py-2" />
        </div>
        <button
          type="button"
          className="mt-3 rounded bg-slate-900 px-3 py-2 text-white disabled:bg-slate-300"
          disabled={!title.trim() || !targetLabel.trim() || !rationale.trim()}
          onClick={async () => {
            await createApproval({
              title: title.trim(),
              actionType,
              targetType,
              targetLabel: targetLabel.trim(),
              rationale: rationale.trim(),
              requestedBy: "MacBot",
              riskLevel
            });
            setTitle("");
            setTargetLabel("");
            setRationale("");
          }}
        >
          Create approval request
        </button>
      </Card>

      <div className="space-y-3">
        {approvals?.map((item: any) => (
          <Card key={item._id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900">{item.title}</div>
                <div className="mt-1 text-sm text-slate-600">{item.actionType} • {item.targetType} • {item.targetLabel}</div>
              </div>
              <Badge status={item.status} />
            </div>
            <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
              <div className="rounded border border-slate-200 bg-slate-50 p-3"><div className="text-xs uppercase tracking-wide text-slate-500">Risk / requester</div><div className="mt-1">{item.riskLevel} • {item.requestedBy}</div></div>
              <div className="rounded border border-slate-200 bg-slate-50 p-3"><div className="text-xs uppercase tracking-wide text-slate-500">Dry run</div><div className="mt-1">{item.dryRunSummary ?? "No dry-run summary"}</div></div>
              <div className="rounded border border-slate-200 bg-slate-50 p-3 md:col-span-2"><div className="text-xs uppercase tracking-wide text-slate-500">Rationale</div><div className="mt-1">{item.rationale}</div></div>
              {item.executionSummary ? <div className="rounded border border-emerald-200 bg-emerald-50 p-3 md:col-span-2"><div className="text-xs uppercase tracking-wide text-emerald-700">Execution</div><div className="mt-1 text-emerald-900">{item.executionSummary}</div></div> : null}
              {item.rejectedReason ? <div className="rounded border border-red-200 bg-red-50 p-3 md:col-span-2"><div className="text-xs uppercase tracking-wide text-red-700">Rejected reason</div><div className="mt-1 text-red-900">{item.rejectedReason}</div></div> : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.status === "pending" ? (
                <>
                  <button type="button" className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800" onClick={() => approve({ approvalId: item._id, approvedBy: "Jay Jay" })}>Approve</button>
                  <button type="button" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" onClick={() => reject({ approvalId: item._id, rejectedBy: "Jay Jay", rejectedReason: "Rejected in Mission Control UI" })}>Reject</button>
                </>
              ) : null}
              {item.status === "approved" ? <button type="button" className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800" onClick={() => executeApproval({ approvalId: item._id, executedBy: "MacBot" })}>Execute</button> : null}
            </div>
          </Card>
        ))}
        {approvals?.length === 0 ? <Card><div className="text-sm text-slate-500">No approval requests yet.</div></Card> : null}
      </div>
    </div>
  );
}
