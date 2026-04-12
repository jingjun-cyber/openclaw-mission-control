"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, PageHeader } from "@/components/ui";

function Avatar({ name }: { name: string }) {
  const initials = name
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

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">{children}</span>;
}

function StateBadge({ state }: { state: string }) {
  const cls =
    state === "active"
      ? "bg-emerald-100 text-emerald-700"
      : state === "queued"
        ? "bg-amber-100 text-amber-700"
        : state === "blocked"
          ? "bg-red-100 text-red-700"
          : "bg-slate-100 text-slate-700";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{state}</span>;
}

function PressureBadge({ level, score }: { level: string; score: number }) {
  const cls =
    level === "critical"
      ? "bg-red-100 text-red-700"
      : level === "warning"
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{level} • {score}</span>;
}

export default function TeamPage() {
  const roles = useQuery(api.team.listRoles, {});
  const agents = useQuery(api.team.listAgents, {});
  const sessions = useQuery(api.team.listSessions, { limit: 12 });
  const queue = useQuery(api.execution.listQueue, {});
  const queueSummary = useQuery(api.execution.queueSummary, {});
  const assignTask = useMutation(api.execution.assignTask);
  const startTask = useMutation(api.execution.startTask);

  const createRole = useMutation(api.team.createRole);
  const createAgent = useMutation(api.team.createAgent);

  const [pressure, setPressure] = useState<any>(null);
  const [pressureError, setPressureError] = useState<string | null>(null);

  const [adminOpen, setAdminOpen] = useState(false);
  const [roleKey, setRoleKey] = useState("");
  const [roleName, setRoleName] = useState("");
  const [agentKey, setAgentKey] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentRoleKey, setAgentRoleKey] = useState("");

  const agentsByState = useMemo(() => {
    const grouped = new Map<string, any[]>();
    for (const agent of agents ?? []) {
      const state = agent.activityState ?? "idle";
      const list = grouped.get(state) ?? [];
      list.push(agent);
      grouped.set(state, list);
    }
    return grouped;
  }, [agents]);

  const agentsByRole = useMemo(() => {
    const grouped = new Map<string, any[]>();
    for (const a of agents ?? []) {
      const list = grouped.get(a.roleKey) ?? [];
      list.push(a);
      grouped.set(a.roleKey, list);
    }
    return grouped;
  }, [agents]);

  const stateCounts = {
    active: agentsByState.get("active")?.length ?? 0,
    queued: agentsByState.get("queued")?.length ?? 0,
    idle: agentsByState.get("idle")?.length ?? 0,
    blocked: agentsByState.get("blocked")?.length ?? 0
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/context-pressure", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) {
          setPressure(json);
          setPressureError(null);
        }
      } catch (err) {
        if (!cancelled) setPressureError(err instanceof Error ? err.message : String(err));
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team"
        subtitle={`Roles ${roles?.length ?? 0} • Agents ${agents?.length ?? 0} • Recent sessions ${sessions?.length ?? 0}`}
        action={
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            onClick={() => setAdminOpen((v) => !v)}
          >
            {adminOpen ? "Hide admin" : "Admin"}
          </button>
        }
      />

      {adminOpen ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-2">
            <h2 className="font-semibold">Create Role</h2>
            <input
              value={roleKey}
              onChange={(e) => setRoleKey(e.target.value)}
              placeholder="role_key"
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
            <input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Role name"
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
            <button
              className="rounded bg-blue-600 px-3 py-2 text-white"
              onClick={async () => {
                if (!roleKey.trim() || !roleName.trim()) return;
                await createRole({ key: roleKey.trim(), name: roleName.trim(), description: "" });
                setRoleKey("");
                setRoleName("");
              }}
              type="button"
            >
              Create role
            </button>
          </Card>
          <Card className="space-y-2">
            <h2 className="font-semibold">Create Agent</h2>
            <input
              value={agentKey}
              onChange={(e) => setAgentKey(e.target.value)}
              placeholder="agent_key"
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
            <input
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Agent name"
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
            <input
              value={agentRoleKey}
              onChange={(e) => setAgentRoleKey(e.target.value)}
              placeholder="Role key"
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
            <button
              className="rounded bg-blue-600 px-3 py-2 text-white"
              onClick={async () => {
                if (!agentKey.trim() || !agentName.trim() || !agentRoleKey.trim()) return;
                await createAgent({ key: agentKey.trim(), name: agentName.trim(), roleKey: agentRoleKey.trim() });
                setAgentKey("");
                setAgentName("");
                setAgentRoleKey("");
              }}
              type="button"
            >
              Create agent
            </button>
          </Card>
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-4">
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Active</div><div className="mt-2 text-2xl font-semibold text-emerald-700">{stateCounts.active}</div><div className="mt-1 text-xs text-slate-500">Agents doing live work right now</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Queued</div><div className="mt-2 text-2xl font-semibold text-amber-700">{stateCounts.queued}</div><div className="mt-1 text-xs text-slate-500">Agents with recent work but not currently active</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Idle</div><div className="mt-2 text-2xl font-semibold text-slate-700">{stateCounts.idle}</div><div className="mt-1 text-xs text-slate-500">Agents with no recent runtime signal</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Blocked</div><div className="mt-2 text-2xl font-semibold text-red-700">{stateCounts.blocked}</div><div className="mt-1 text-xs text-slate-500">Disabled or unavailable agents</div></Card>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Pressure critical</div><div className="mt-2 text-2xl font-semibold text-red-700">{pressure?.counts?.critical ?? 0}</div><div className="mt-1 text-xs text-slate-500">Active sessions near context or cost risk</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Pressure warning</div><div className="mt-2 text-2xl font-semibold text-amber-700">{pressure?.counts?.warning ?? 0}</div><div className="mt-1 text-xs text-slate-500">Sessions that should probably be summarized soon</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Pressure healthy</div><div className="mt-2 text-2xl font-semibold text-emerald-700">{pressure?.counts?.healthy ?? 0}</div><div className="mt-1 text-xs text-slate-500">Recently active sessions that still have headroom</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Telemetry refresh</div><div className="mt-2 text-sm font-semibold text-slate-900">{pressure?.checkedAt ? new Date(pressure.checkedAt).toLocaleString() : "pending"}</div><div className="mt-1 text-xs text-slate-500">Local session telemetry snapshot time</div></Card>
      </section>

      <section className="grid gap-3 md:grid-cols-5">
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Queue queued</div><div className="mt-2 text-2xl font-semibold text-slate-900">{queueSummary?.queued ?? 0}</div><div className="mt-1 text-xs text-slate-500">Waiting for agent assignment</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Queue assigned</div><div className="mt-2 text-2xl font-semibold text-blue-700">{queueSummary?.assigned ?? 0}</div><div className="mt-1 text-xs text-slate-500">Assigned but not started</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">In progress</div><div className="mt-2 text-2xl font-semibold text-emerald-700">{queueSummary?.inProgress ?? 0}</div><div className="mt-1 text-xs text-slate-500">Actively executing</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Handoffs</div><div className="mt-2 text-2xl font-semibold text-purple-700">{queueSummary?.handoff ?? 0}</div><div className="mt-1 text-xs text-slate-500">Needs transfer or follow-up</div></Card>
        <Card><div className="text-xs uppercase tracking-wide text-slate-500">Blocked queue</div><div className="mt-2 text-2xl font-semibold text-red-700">{queueSummary?.blocked ?? 0}</div><div className="mt-1 text-xs text-slate-500">Execution items requiring intervention</div></Card>
      </section>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr_360px]">
        <Card>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">Roles</h3>
          <div className="space-y-2">
            {roles?.map((role) => (
              <div key={role._id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{role.name}</p>
                  <Badge>{agentsByRole.get(role.key)?.length ?? 0}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-600">{role.key}</p>
                {role.description ? <p className="mt-2 text-xs text-slate-600">{role.description}</p> : null}
              </div>
            ))}
            {roles?.length === 0 ? <p className="text-sm text-slate-500">No roles yet.</p> : null}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">Staff States</h3>
          <div className="space-y-3">
            {[
              ["active", "Active"],
              ["queued", "Queued"],
              ["idle", "Idle"],
              ["blocked", "Blocked"]
            ].map(([key, label]) => {
              const list = agentsByState.get(key) ?? [];
              return (
                <div key={key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{label}</span>
                      <StateBadge state={key} />
                    </div>
                    <span className="text-xs text-slate-500">{list.length}</span>
                  </div>
                  <div className="mt-2 space-y-2 text-xs text-slate-600">
                    {list.length ? list.map((agent) => (
                      <div key={agent._id} className="rounded border border-slate-200 bg-white p-2">
                        <div className="font-medium text-slate-900">{agent.name}</div>
                        <div>{agent.currentWork ?? "No recent work context"}</div>
                        {agent.recentOutput ? <div className="mt-1 line-clamp-2 text-slate-500">{agent.recentOutput}</div> : null}
                      </div>
                    )) : <div>No agents in this state.</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">Agents</h3>
          <div className="space-y-4">
            {(roles ?? []).map((role) => {
              const list = agentsByRole.get(role.key) ?? [];
              if (list.length === 0) return null;
              return (
                <section key={role.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">{role.name}</h4>
                    <span className="text-xs text-slate-500">{list.length}</span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {list.map((agent) => (
                      <Link
                        key={agent._id}
                        href={`/team/agents/${agent._id}`}
                        className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <Avatar name={agent.name} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-semibold text-slate-900">{agent.name}</p>
                            {!agent.enabled ? <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px]">disabled</span> : null}
                            <StateBadge state={agent.activityState ?? "idle"} />
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">workload: {agent.workloadLevel ?? "medium"}</span>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">active: {agent.activeSessions ?? 0}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600">{agent.key}</p>
                          {agent.modelPreference ? (
                            <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">model: {agent.modelPreference}</p>
                          ) : null}
                          {(agent.capabilities?.length ?? 0) > 0 ? (
                            <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">capabilities: {agent.capabilities.join(", ")}</p>
                          ) : null}
                          {(agent.channels?.length ?? 0) > 0 ? (
                            <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">channels: {agent.channels.join(", ")}</p>
                          ) : null}
                          {agent.currentWork ? (
                            <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">current: {agent.currentWork}</p>
                          ) : null}
                          {agent.recentOutput ? (
                            <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">output: {agent.recentOutput}</p>
                          ) : null}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}

            {agents?.length === 0 ? <p className="text-sm text-slate-500">No agents yet.</p> : null}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">Recent Sessions</h3>
          <div className="space-y-2">
            {sessions?.map((session) => (
              <div key={session._id} className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="line-clamp-1 font-medium text-slate-900">{session.label}</p>
                <p className="mt-1 text-xs text-slate-600">{session.status}{session.lastMessage ? ` • ${session.lastMessage}` : ""}</p>
                <p className="mt-1 text-[11px] text-slate-500">{new Date(session.startedAt).toLocaleString()}</p>
              </div>
            ))}
            {sessions?.length === 0 ? <p className="text-sm text-slate-500">No sessions synced yet.</p> : null}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">Execution Queue</h3>
          <div className="space-y-3">
            {queue?.slice(0, 8).map((item: any) => (
              <div key={item._id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{item.task?.title ?? "Unknown task"}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{item.status} • assigned: {item.assignedAgentKey ?? "unassigned"} • requested by {item.requestedBy}</p>
                  </div>
                  <Badge>{item.priority ?? "normal"}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {agents?.slice(0, 4).map((agent) => (
                    <button key={`${item._id}-${agent.key}`} type="button" className="rounded border border-slate-300 px-2 py-1 text-xs" onClick={() => assignTask({ taskId: item.taskId, agentKey: agent.key })}>{agent.key}</button>
                  ))}
                  <button type="button" className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-800" onClick={() => startTask({ taskId: item.taskId, agentKey: item.assignedAgentKey ?? "main" })}>Start</button>
                  {item.task?._id ? <Link href={`/tasks/${item.task._id}`} className="rounded border border-slate-300 px-2 py-1 text-xs">Open</Link> : null}
                </div>
                {item.handoffNote ? <div className="mt-2 text-xs text-slate-600">handoff: {item.handoffNote}</div> : null}
              </div>
            ))}
            {queue?.length === 0 ? <p className="text-sm text-slate-500">No queued execution items.</p> : null}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">Context Pressure</h3>
          {pressureError ? <p className="text-sm text-red-700">Failed to load pressure telemetry: {pressureError}</p> : null}
          <div className="space-y-3">
            {pressure?.sessions?.map((session: any) => (
              <div key={session.sessionId} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="line-clamp-1 font-medium text-slate-900">{session.agent} • {session.model}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{session.sourceHint} • {new Date(session.lastAt).toLocaleString()}</p>
                  </div>
                  <PressureBadge level={session.level} score={session.score} />
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                  {session.reasons?.map((reason: string) => <Badge key={reason}>{reason}</Badge>)}
                </div>
                <div className="mt-2 text-xs text-slate-600">{Math.round(session.totalTokens / 1000)}k tokens • {session.runs} usage turns • ${session.totalCost.toFixed(4)}</div>
                {session.advice?.length ? <div className="mt-2 text-xs text-slate-500">Next: {session.advice[0]}</div> : null}
              </div>
            ))}
            {!pressure && !pressureError ? <p className="text-sm text-slate-500">Loading pressure telemetry...</p> : null}
            {pressure?.sessions?.length === 0 ? <p className="text-sm text-slate-500">No recently active sessions with telemetry.</p> : null}
          </div>
        </Card>
      </div>

      {/* If roles list is empty, still show agents */}
      {roles?.length === 0 && (agents?.length ?? 0) > 0 ? (
        <Card>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">Agents (ungrouped)</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {agents?.map((agent) => (
              <Link
                key={agent._id}
                href={`/team/agents/${agent._id}`}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3"
              >
                <Avatar name={agent.name} />
                <div>
                  <p className="font-semibold text-slate-900">{agent.name}</p>
                  <p className="text-xs text-slate-600">{agent.key} • {agent.roleKey}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      ) : null}

      {roles?.length === 0 && agents?.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-600">
            Team is empty. Run <code>npm run seed:defaults</code> (or wait for the auto sync) to initialize roles and agents.
          </p>
        </Card>
      ) : null}

      {/* Small footer hint */}
      <p className="text-xs text-slate-500">
        Tip: Agent roster is seeded automatically by <code>seed:defaults</code>. Edit any agent in its detail page.
      </p>
    </div>
  );
}
