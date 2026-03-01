"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, PageHeader } from "@/components/ui";

export default function TeamPage() {
  const roles = useQuery(api.team.listRoles, {});
  const agents = useQuery(api.team.listAgents, {});
  const sessions = useQuery(api.team.listSessions, { limit: 12 });

  const createRole = useMutation(api.team.createRole);
  const createAgent = useMutation(api.team.createAgent);

  const [roleKey, setRoleKey] = useState("");
  const [roleName, setRoleName] = useState("");
  const [agentKey, setAgentKey] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentRoleKey, setAgentRoleKey] = useState("");

  return (
    <div className="space-y-5">
      <PageHeader title="Team" subtitle="Roles, agents, and recent sessions" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-2">
          <h2 className="font-semibold">Create Role</h2>
          <input value={roleKey} onChange={(e)=>setRoleKey(e.target.value)} placeholder="role_key" className="w-full rounded border border-slate-300 px-3 py-2" />
          <input value={roleName} onChange={(e)=>setRoleName(e.target.value)} placeholder="Role name" className="w-full rounded border border-slate-300 px-3 py-2" />
          <button className="rounded bg-blue-600 px-3 py-2 text-white" onClick={async () => {
            if (!roleKey.trim() || !roleName.trim()) return;
            await createRole({ key: roleKey.trim(), name: roleName.trim(), description: "" });
            setRoleKey("");
            setRoleName("");
          }}>Create role</button>
        </Card>
        <Card className="space-y-2">
          <h2 className="font-semibold">Create Agent</h2>
          <input value={agentKey} onChange={(e)=>setAgentKey(e.target.value)} placeholder="agent_key" className="w-full rounded border border-slate-300 px-3 py-2" />
          <input value={agentName} onChange={(e)=>setAgentName(e.target.value)} placeholder="Agent name" className="w-full rounded border border-slate-300 px-3 py-2" />
          <input value={agentRoleKey} onChange={(e)=>setAgentRoleKey(e.target.value)} placeholder="Role key" className="w-full rounded border border-slate-300 px-3 py-2" />
          <button className="rounded bg-blue-600 px-3 py-2 text-white" onClick={async () => {
            if (!agentKey.trim() || !agentName.trim() || !agentRoleKey.trim()) return;
            await createAgent({ key: agentKey.trim(), name: agentName.trim(), roleKey: agentRoleKey.trim() });
            setAgentKey("");
            setAgentName("");
            setAgentRoleKey("");
          }}>Create agent</button>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide">Roles</h3>
          <div className="space-y-2">{roles?.map((role) => <div key={role._id} className="rounded border border-slate-200 p-2"><p className="font-medium">{role.name}</p><p className="text-xs text-slate-600">{role.key}</p></div>)}</div>
        </Card>
        <Card>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide">Agents</h3>
          <div className="space-y-2">{agents?.map((agent) => <Link key={agent._id} href={`/team/agents/${agent._id}`} className="block rounded border border-slate-200 p-2 hover:bg-slate-50"><p className="font-medium">{agent.name}</p><p className="text-xs text-slate-600">{agent.key} • {agent.roleKey}</p></Link>)}</div>
        </Card>
        <Card>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide">Recent Sessions</h3>
          <div className="space-y-2">{sessions?.map((session) => <div key={session._id} className="rounded border border-slate-200 p-2"><p className="font-medium">{session.label}</p><p className="text-xs text-slate-600">{session.status} • {new Date(session.startedAt).toLocaleString()}</p></div>)}{sessions?.length === 0 ? <p className="text-sm text-slate-500">No sessions synced yet.</p> : null}</div>
        </Card>
      </div>
    </div>
  );
}
