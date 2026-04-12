import { query } from "./_generated/server";

const DAY_MS = 24 * 60 * 60 * 1000;

type AttentionItem = {
  level: "critical" | "warning" | "info";
  title: string;
  detail: string;
  href: string;
};

export const summary = query({
  args: {},
  handler: async (ctx) => {
    const [tasks, pipeline, docs, agents, desks, sessions, cronJobs, events] = await Promise.all([
      ctx.db.query("tasks").collect(),
      ctx.db.query("contentItems").collect(),
      ctx.db.query("memoryDocs").collect(),
      ctx.db.query("teamAgents").collect(),
      ctx.db.query("officeDesks").collect(),
      ctx.db.query("teamSessions").collect(),
      ctx.db.query("cronJobs").collect(),
      ctx.db.query("calendarEvents").collect()
    ]);

    const now = Date.now();
    const activeWindow = 6 * 60 * 60 * 1000;
    const activeSessions = sessions.filter((s: any) => {
      const t = s.endedAt ?? s.updatedAt ?? s.startedAt ?? 0;
      return now - t <= activeWindow;
    });

    const blockedTasks = tasks.filter((t: any) => t.status === "Blocked");
    const doingTasks = tasks.filter((t: any) => t.status === "Doing");
    const reviewTasks = tasks.filter((t: any) => t.status === "Review");
    const backlogTasks = tasks.filter((t: any) => t.status === "Backlog");
    const executionReadyTasks = tasks.filter((t: any) => (t.stage ?? "execution") === "execution" && t.status !== "Done");
    const planningTasks = tasks.filter((t: any) => (t.stage ?? "execution") === "planning" && t.status !== "Done");
    const errorDesks = desks.filter((d: any) => d.presence === "error");
    const workingDesks = desks.filter((d: any) => d.presence === "working");
    const failingCrons = cronJobs.filter((j: any) => j.status?.toLowerCase() === "error");
    const staleDocsList = docs.filter((d: any) => now - (d.sourceUpdatedAt ?? d.updatedAt ?? 0) > 7 * DAY_MS);
    const docsUpdatedRecently = docs.filter((d: any) => now - (d.updatedAt ?? 0) <= DAY_MS).length;
    const searchableDocs = docs.filter((d: any) => d.content?.trim().length > 0);
    const emptyDocs = docs.filter((d: any) => !d.content?.trim().length);

    const criticalCount = errorDesks.length;
    const warningCount = failingCrons.length + blockedTasks.length + (staleDocsList.length > 0 ? 1 : 0);
    const severity = criticalCount > 0 ? "critical" : warningCount > 0 ? "warning" : "healthy";

    const attention: AttentionItem[] = [
      ...errorDesks.slice(0, 3).map((desk: any) => ({
        level: "critical" as const,
        title: `Desk ${desk.code} is reporting an error state`,
        detail: `${desk.agentName ?? desk.label} needs a quick check in Office.`,
        href: "/office"
      })),
      ...failingCrons.slice(0, 3).map((job: any) => ({
        level: "warning" as const,
        title: `Cron job ${job.name} is failing`,
        detail: `Schedule ${job.schedule}. Check recent runs and delivery settings.`,
        href: "/calendar"
      })),
      ...blockedTasks.slice(0, 3).map((task: any) => ({
        level: "warning" as const,
        title: `Blocked task needs intervention`,
        detail: `${task.title} • ${task.assignee ?? "Unassigned"}`,
        href: "/tasks"
      }))
    ];

    if (staleDocsList.length > 0) {
      attention.push({
        level: "info",
        title: `${staleDocsList.length} memory docs look stale`,
        detail: "Useful if you want the overview to reflect more recent project context.",
        href: "/memory"
      });
    }

    if (doingTasks.length === 0 && reviewTasks.length === 0 && backlogTasks.length > 0) {
      attention.push({
        level: "info",
        title: "Work is queued but nothing is actively moving",
        detail: `${backlogTasks.length} tasks are in backlog with no task currently doing or in review.`,
        href: "/tasks"
      });
    }

    const upcomingEvents = events
      .filter((e: any) => e.date >= new Date().toISOString().slice(0, 10))
      .sort((a: any, b: any) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")))
      .slice(0, 4);

    return {
      headline: {
        status: severity,
        title:
          severity === "healthy"
            ? "Mission Control looks steady"
            : severity === "critical"
              ? "Mission Control needs immediate attention"
              : "Mission Control needs a quick review",
        detail:
          severity === "healthy"
            ? "Core systems, current work, and automations look stable right now."
            : severity === "critical"
              ? "At least one area is signaling failure and should be checked before treating the system as green."
              : "There are warning signs worth checking so small issues do not pile up."
      },
      metrics: {
        tasks: tasks.length,
        doingTasks: doingTasks.length,
        reviewTasks: reviewTasks.length,
        blockedTasks: blockedTasks.length,
        executionReadyTasks: executionReadyTasks.length,
        planningTasks: planningTasks.length,
        pipeline: pipeline.length,
        docs: docs.length,
        searchableDocs: searchableDocs.length,
        emptyDocs: emptyDocs.length,
        agents: agents.length,
        desks: desks.length,
        workingDesks: workingDesks.length,
        activeSessions: activeSessions.length,
        cronJobs: cronJobs.length,
        failingCrons: failingCrons.length,
        staleDocs: staleDocsList.length
      },
      activeWork: {
        doingTasks: doingTasks.slice(0, 5),
        reviewTasks: reviewTasks.slice(0, 5),
        activeSessions: activeSessions
          .slice()
          .sort((a: any, b: any) => (b.updatedAt ?? b.startedAt ?? 0) - (a.updatedAt ?? a.startedAt ?? 0))
          .slice(0, 5),
        workingDesks: workingDesks.slice(0, 5),
        errorDesks: errorDesks.slice(0, 5)
      },
      sync: {
        cronHealthy: failingCrons.length === 0,
        failingCrons: failingCrons.length,
        staleDocs: staleDocsList.length,
        docsUpdatedRecently,
        searchReady: searchableDocs.length > 0,
        emptyDocs: emptyDocs.length
      },
      attention: attention.slice(0, 6),
      upcomingEvents
    };
  }
});
