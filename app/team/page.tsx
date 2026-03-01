"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

export default function TeamPage() {
  const roles = useQuery(api.team.listRoles, {});
  const agents = useQuery(api.team.listAgents, {});
  const sessions = useQuery(api.team.listSessions, { limit: 12 });

  const createRole = useMutation(api.team.createRole);
  const createAgent = useMutation(api.team.createAgent);

  const [adminOpen, setAdminOpen] = useState(false);
  const [roleKey, setRoleKey] = useState("");
  const [roleName, setRoleName] = useState("");
  const [agentKey, setAgentKey] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentRoleKey, setAgentRoleKey] = useState("");

  const roleByKey = useMemo(() => {
    const map = new Map<string, any>();
    for (const r of roles ?? []) map.set(r.key, r);
    return map;
  }, [roles]);

  const agentsByRole = useMemo(() => {
    const grouped = new Map<string, any[]>();
    for (const a of agents ?? []) {
      const list = grouped.get(a.roleKey) ?? [];
      list.push(a);
      grouped.set(a.roleKey, list);
    }
    return grouped;
  }, [agents]);

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
                          </div>
                          <p className="mt-1 text-xs text-slate-600">{agent.key}</p>
                          {agent.modelPreference ? (
                            <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">model: {agent.modelPreference}</p>
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
                <p className="mt-1 text-xs text-slate-600">{session.status}</p>
                <p className="mt-1 text-[11px] text-slate-500">{new Date(session.startedAt).toLocaleString()}</p>
              </div>
            ))}
            {sessions?.length === 0 ? <p className="text-sm text-slate-500">No sessions synced yet.</p> : null}
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
