import { query } from "./_generated/server";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function freshness(ts: number | undefined, warnAfterMs: number, criticalAfterMs: number) {
  if (!ts) return { status: "critical", ageLabel: "unknown", stale: true };
  const ageMs = Date.now() - ts;
  const ageHours = Math.round(ageMs / HOUR_MS);
  const ageLabel = ageHours < 1 ? "<1h ago" : ageHours < 24 ? `${ageHours}h ago` : `${Math.round(ageHours / 24)}d ago`;
  if (ageMs > criticalAfterMs) return { status: "critical", ageLabel, stale: true };
  if (ageMs > warnAfterMs) return { status: "warning", ageLabel, stale: true };
  return { status: "healthy", ageLabel, stale: false };
}

export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    const [docs, sessions, agents, cronJobs, tasks] = await Promise.all([
      ctx.db.query("memoryDocs").collect(),
      ctx.db.query("teamSessions").collect(),
      ctx.db.query("teamAgents").collect(),
      ctx.db.query("cronJobs").collect(),
      ctx.db.query("tasks").collect()
    ]);

    const latestDoc = docs.slice().sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];
    const latestSession = sessions.slice().sort((a: any, b: any) => (b.updatedAt ?? b.startedAt ?? 0) - (a.updatedAt ?? a.startedAt ?? 0))[0];
    const latestCron = cronJobs.slice().sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];
    const latestTask = tasks.slice().sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];
    const latestAgent = agents.slice().sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];

    const docFreshness = freshness(latestDoc?.updatedAt, DAY_MS, 7 * DAY_MS);
    const sessionFreshness = freshness(latestSession?.updatedAt ?? latestSession?.startedAt, 12 * HOUR_MS, 2 * DAY_MS);
    const cronFreshness = freshness(latestCron?.updatedAt, 12 * HOUR_MS, 2 * DAY_MS);
    const taskFreshness = freshness(latestTask?.updatedAt, DAY_MS, 7 * DAY_MS);
    const agentFreshness = freshness(latestAgent?.updatedAt, DAY_MS, 7 * DAY_MS);

    const cronErrors = cronJobs.filter((j: any) => j.status?.toLowerCase() === "error");

    const items = [
      {
        key: "seed",
        label: "Seed defaults",
        status: tasks.length > 0 && agents.length > 0 ? taskFreshness.status : "critical",
        lastUpdatedAt: latestTask?.updatedAt,
        ageLabel: taskFreshness.ageLabel,
        detail: tasks.length > 0 ? `Tasks present: ${tasks.length}` : "Seed data looks incomplete"
      },
      {
        key: "agents",
        label: "Agent sync",
        status: agents.length > 0 ? agentFreshness.status : "critical",
        lastUpdatedAt: latestAgent?.updatedAt,
        ageLabel: agentFreshness.ageLabel,
        detail: agents.length > 0 ? `Agents synced: ${agents.length}` : "No agents synced yet"
      },
      {
        key: "memory",
        label: "Memory sync",
        status: docs.length === 0 ? "critical" : docFreshness.status,
        lastUpdatedAt: latestDoc?.updatedAt,
        ageLabel: docFreshness.ageLabel,
        detail: docs.length > 0 ? `Docs synced: ${docs.length}` : "No memory docs synced yet"
      },
      {
        key: "sessions",
        label: "Session sync",
        status: sessions.length === 0 ? "critical" : sessionFreshness.status,
        lastUpdatedAt: latestSession?.updatedAt ?? latestSession?.startedAt,
        ageLabel: sessionFreshness.ageLabel,
        detail: sessions.length > 0 ? `Sessions synced: ${sessions.length}` : "No sessions synced yet"
      },
      {
        key: "cron",
        label: "Cron sync",
        status: cronErrors.length > 0 ? "critical" : cronJobs.length > 0 ? cronFreshness.status : "critical",
        lastUpdatedAt: latestCron?.updatedAt,
        ageLabel: cronFreshness.ageLabel,
        detail: cronJobs.length > 0 ? `Cron jobs synced: ${cronJobs.length}, failing: ${cronErrors.length}` : "No cron jobs synced yet"
      }
    ];

    const status = items.some((i) => i.status === "critical")
      ? "critical"
      : items.some((i) => i.status === "warning")
        ? "warning"
        : "healthy";

    return {
      status,
      items,
      counts: {
        docs: docs.length,
        sessions: sessions.length,
        agents: agents.length,
        cronJobs: cronJobs.length,
        cronErrors: cronErrors.length,
        activeIssues: items.filter((i) => i.status === "critical" || i.status === "warning").length,
        stalePipelines: items.filter((i: any) => i.status !== "healthy").length
      }
    };
  }
});
