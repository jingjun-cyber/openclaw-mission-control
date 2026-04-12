"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, DetailBackLink, PageHeader } from "@/components/ui";

export default function AgentDetailPage() {
  const params = useParams<{ id: string }>();
  const agentId = params.id as never;
  const agent = useQuery(api.team.getAgent, { agentId });
  const updateAgent = useMutation(api.team.updateAgent);

  const [name, setName] = useState("");
  const [roleKey, setRoleKey] = useState("");
  const [description, setDescription] = useState("");
  const [typicalTasks, setTypicalTasks] = useState("");
  const [capabilities, setCapabilities] = useState("");
  const [tools, setTools] = useState("");
  const [channels, setChannels] = useState("");
  const [specializationHints, setSpecializationHints] = useState("");
  const [workloadLevel, setWorkloadLevel] = useState("medium");
  const [workloadNotes, setWorkloadNotes] = useState("");
  const [modelPreference, setModelPreference] = useState("");
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!agent) return;
    setName(agent.name);
    setRoleKey(agent.roleKey);
    setDescription(agent.description);
    setTypicalTasks(agent.typicalTasks.join("\n"));
    setCapabilities((agent.capabilities ?? []).join("\n"));
    setTools((agent.tools ?? []).join("\n"));
    setChannels((agent.channels ?? []).join("\n"));
    setSpecializationHints((agent.specializationHints ?? []).join("\n"));
    setWorkloadLevel(agent.workloadLevel ?? "medium");
    setWorkloadNotes(agent.workloadNotes ?? "");
    setModelPreference(agent.modelPreference ?? "");
    setEnabled(agent.enabled);
  }, [agent]);

  if (agent === undefined) return <p className="text-sm text-slate-600">Loading agent...</p>;
  if (agent === null) return <p className="text-sm text-red-600">Agent not found.</p>;

  return (
    <div className="space-y-4">
      <PageHeader title="Agent Detail" subtitle={agent.key} action={<DetailBackLink href="/team" label="Back to team" />} />
      <Card className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 block"><span className="text-sm">Name</span><input value={name} onChange={(e)=>setName(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
          <label className="space-y-1 block"><span className="text-sm">Role key</span><input value={roleKey} onChange={(e)=>setRoleKey(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
          <label className="space-y-1 block"><span className="text-sm">Model preference</span><input value={modelPreference} onChange={(e)=>setModelPreference(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
          <label className="space-y-1 block"><span className="text-sm">Workload level</span><select value={workloadLevel} onChange={(e)=>setWorkloadLevel(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2"><option value="low">low</option><option value="medium">medium</option><option value="high">high</option></select></label>
        </div>
        <label className="space-y-1 block"><span className="text-sm">Typical tasks (one per line)</span><textarea value={typicalTasks} onChange={(e)=>setTypicalTasks(e.target.value)} className="h-24 w-full rounded border border-slate-300 px-3 py-2" /></label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 block"><span className="text-sm">Capabilities</span><textarea value={capabilities} onChange={(e)=>setCapabilities(e.target.value)} className="h-24 w-full rounded border border-slate-300 px-3 py-2" /></label>
          <label className="space-y-1 block"><span className="text-sm">Tools</span><textarea value={tools} onChange={(e)=>setTools(e.target.value)} className="h-24 w-full rounded border border-slate-300 px-3 py-2" /></label>
          <label className="space-y-1 block"><span className="text-sm">Channels</span><textarea value={channels} onChange={(e)=>setChannels(e.target.value)} className="h-24 w-full rounded border border-slate-300 px-3 py-2" /></label>
          <label className="space-y-1 block"><span className="text-sm">Specialization hints</span><textarea value={specializationHints} onChange={(e)=>setSpecializationHints(e.target.value)} className="h-24 w-full rounded border border-slate-300 px-3 py-2" /></label>
        </div>
        <label className="space-y-1 block"><span className="text-sm">Workload notes</span><textarea value={workloadNotes} onChange={(e)=>setWorkloadNotes(e.target.value)} className="h-24 w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label className="space-y-1 block"><span className="text-sm">Description</span><textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="h-32 w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={enabled} onChange={(e)=>setEnabled(e.target.checked)} /><span className="text-sm">Enabled</span></label>
        <button className="rounded bg-blue-600 px-3 py-2 text-white" onClick={() => updateAgent({ agentId, name, roleKey, description, typicalTasks: typicalTasks.split("\n").map((x)=>x.trim()).filter(Boolean), capabilities: capabilities.split("\n").map((x)=>x.trim()).filter(Boolean), tools: tools.split("\n").map((x)=>x.trim()).filter(Boolean), channels: channels.split("\n").map((x)=>x.trim()).filter(Boolean), specializationHints: specializationHints.split("\n").map((x)=>x.trim()).filter(Boolean), workloadLevel: workloadLevel || undefined, workloadNotes: workloadNotes || undefined, modelPreference: modelPreference || undefined, enabled })}>Save</button>
      </Card>
    </div>
  );
}
