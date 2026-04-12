"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, PageHeader } from "@/components/ui";

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">{children}</span>;
}

export default function CollaborationHallPage() {
  const agents = useQuery(api.team.listAgents, {});
  const runtimeFeed = useQuery(api.team.runtimeFeed, { limit: 20 });
  const queue = useQuery(api.execution.listQueue, {});
  const queueSummary = useQuery(api.execution.queueSummary, {});
  const sessions = useQuery(api.team.listSessions, { limit: 16 });

  const activeAgents = (agents ?? []).filter((agent: any) => agent.activityState === "active");
  const queuedAgents = (agents ?? []).filter((agent: any) => agent.activityState === "queued");
  const blockedAgents = (agents ?? []).filter((agent: any) => agent.activityState === "blocked");
  const handoffQueue = (queue ?? []).filter((item: any) => item.status === "handoff");
  const inProgressQueue = (queue ?? []).filter((item: any) => item.status === "in_progress");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Collaboration Hall"
        subtitle="One view for agent workload, execution queue, handoffs, and live runtime movement."
        action={<div className="flex flex-wrap gap-2"><Pill>active {activeAgents.length}</Pill><Pill>queue {queue?.length ?? 0}</Pill><Pill>handoff {handoffQueue.length}</Pill></div>}
      />

      <section className="grid gap-3 md:grid-cols-5">
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Active agents</div><div className="mt-2 text-2xl font-semibold text-emerald-700">{activeAgents.length}</div><div className="mt-1 text-xs text-slate-500">Agents with live session activity</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Queued agents</div><div className="mt-2 text-2xl font-semibold text-amber-700">{queuedAgents.length}</div><div className="mt-1 text-xs text-slate-500">Agents with recent but non-live work</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Blocked agents</div><div className="mt-2 text-2xl font-semibold text-red-700">{blockedAgents.length}</div><div className="mt-1 text-xs text-slate-500">Disabled or unavailable contributors</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Queue in progress</div><div className="mt-2 text-2xl font-semibold text-blue-700">{queueSummary?.inProgress ?? 0}</div><div className="mt-1 text-xs text-slate-500">Execution items being worked right now</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Queue handoff</div><div className="mt-2 text-2xl font-semibold text-purple-700">{queueSummary?.handoff ?? 0}</div><div className="mt-1 text-xs text-slate-500">Items waiting on collaboration transfer</div></Card>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.95fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Live runtime wall</h2>
            <Link href="/team" className="text-sm text-slate-500 hover:underline">Open team</Link>
          </div>
          <div className="mt-3 space-y-3">
            {runtimeFeed?.map((session: any) => (
              <div key={session._id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{session.label}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{session.agentKey ?? "unknown agent"} • {session.runtimeState} • {new Date(session.touchedAt).toLocaleString()}</p>
                  </div>
                  <Pill>{session.status}</Pill>
                </div>
                <p className="mt-2 text-sm text-slate-700 line-clamp-3">{session.runtimeSummary}</p>
              </div>
            ))}
            {runtimeFeed?.length === 0 ? <p className="text-sm text-slate-500">No runtime activity available.</p> : null}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Execution lanes</h2>
            <Link href="/tasks" className="text-sm text-slate-500 hover:underline">Open tasks</Link>
          </div>
          <div className="mt-3 space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">In progress</div>
              <div className="mt-2 space-y-2">
                {inProgressQueue.slice(0, 6).map((item: any) => (
                  <Link key={item._id} href={`/tasks/${item.taskId}`} className="block rounded border border-slate-200 bg-white p-2 text-sm hover:bg-slate-50">
                    {item.task?.title ?? "Unknown task"} • {item.assignedAgentKey ?? "unassigned"}
                  </Link>
                ))}
                {inProgressQueue.length === 0 ? <p className="text-sm text-slate-500">No tasks in progress.</p> : null}
              </div>
            </div>

            <div className="rounded-lg border border-purple-200 bg-purple-50/40 p-3">
              <div className="text-xs uppercase tracking-wide text-purple-700">Needs handoff</div>
              <div className="mt-2 space-y-2">
                {handoffQueue.slice(0, 6).map((item: any) => (
                  <Link key={item._id} href={`/tasks/${item.taskId}`} className="block rounded border border-purple-200 bg-white p-2 text-sm hover:bg-purple-50">
                    {item.task?.title ?? "Unknown task"} • {item.handoffFrom ?? "?"} → {item.handoffTo ?? "?"}
                  </Link>
                ))}
                {handoffQueue.length === 0 ? <p className="text-sm text-slate-500">No active handoff items.</p> : null}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Agent floor</h2>
            <Pill>{agents?.length ?? 0} total</Pill>
          </div>
          <div className="mt-3 space-y-2">
            {agents?.map((agent: any) => (
              <Link key={agent._id} href={`/team/agents/${agent._id}`} className="block rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{agent.name}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{agent.key} • {agent.roleKey}</p>
                  </div>
                  <Pill>{agent.activityState ?? "idle"}</Pill>
                </div>
                <p className="mt-2 text-xs text-slate-600 line-clamp-2">{agent.currentWork ?? "No current work context"}</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Queue board</h2>
            <Pill>{queue?.length ?? 0} items</Pill>
          </div>
          <div className="mt-3 space-y-2">
            {queue?.slice(0, 10).map((item: any) => (
              <Link key={item._id} href={`/tasks/${item.taskId}`} className="block rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{item.task?.title ?? "Unknown task"}</p>
                  <Pill>{item.status}</Pill>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">assigned: {item.assignedAgentKey ?? "unassigned"} • priority: {item.priority ?? "n/a"}</p>
              </Link>
            ))}
            {queue?.length === 0 ? <p className="text-sm text-slate-500">No queue items.</p> : null}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Recent sessions</h2>
            <Pill>{sessions?.length ?? 0}</Pill>
          </div>
          <div className="mt-3 space-y-2">
            {sessions?.map((session: any) => (
              <div key={session._id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-900 line-clamp-1">{session.label}</p>
                  <Pill>{session.status}</Pill>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{session.agentKey ?? "unknown agent"} • {new Date(session.startedAt).toLocaleString()}</p>
                {session.lastMessage ? <p className="mt-2 text-xs text-slate-600 line-clamp-2">{session.lastMessage}</p> : null}
              </div>
            ))}
            {sessions?.length === 0 ? <p className="text-sm text-slate-500">No recent sessions.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
