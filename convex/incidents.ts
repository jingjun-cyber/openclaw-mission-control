import { query } from "./_generated/server";

const HOUR_MS = 60 * 60 * 1000;

function ageLabel(ts: number | undefined) {
  if (!ts) return "unknown";
  const ageMs = Date.now() - ts;
  const ageHours = Math.round(ageMs / HOUR_MS);
  if (ageHours < 1) return "<1h ago";
  if (ageHours < 24) return `${ageHours}h ago`;
  return `${Math.round(ageHours / 24)}d ago`;
}

export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    const [cronJobs, desks, tasks, sessions] = await Promise.all([
      ctx.db.query("cronJobs").collect(),
      ctx.db.query("officeDesks").collect(),
      ctx.db.query("tasks").collect(),
      ctx.db.query("teamSessions").collect()
    ]);

    const failingCrons = cronJobs
      .filter((job: any) => job.status?.toLowerCase() === "error")
      .map((job: any) => ({
        key: `cron-${job._id}`,
        source: "cron",
        level: "critical",
        title: `${job.name} is failing`,
        detail: `Schedule ${job.schedule}`,
        updatedAt: job.updatedAt,
        ageLabel: ageLabel(job.updatedAt),
        href: "/calendar"
      }));

    const deskErrors = desks
      .filter((desk: any) => desk.presence === "error")
      .map((desk: any) => ({
        key: `desk-${desk._id}`,
        source: "office",
        level: "critical",
        title: `Desk ${desk.code} is in error state`,
        detail: desk.agentName ?? desk.label,
        updatedAt: desk.updatedAt,
        ageLabel: ageLabel(desk.updatedAt),
        href: "/office"
      }));

    const blockedTasks = tasks
      .filter((task: any) => task.status === "Blocked")
      .map((task: any) => ({
        key: `task-${task._id}`,
        source: "tasks",
        level: "warning",
        title: `Blocked task needs attention`,
        detail: task.title,
        updatedAt: task.updatedAt,
        ageLabel: ageLabel(task.updatedAt),
        href: "/tasks"
      }));

    const staleSessions = sessions
      .filter((session: any) => {
        const t = session.updatedAt ?? session.startedAt ?? 0;
        return Date.now() - t > 24 * HOUR_MS;
      })
      .slice(0, 5)
      .map((session: any) => ({
        key: `session-${session._id}`,
        source: "sessions",
        level: "info",
        title: `Older session still visible`,
        detail: session.label,
        updatedAt: session.updatedAt ?? session.startedAt,
        ageLabel: ageLabel(session.updatedAt ?? session.startedAt),
        href: "/team"
      }));

    const items = [...failingCrons, ...deskErrors, ...blockedTasks, ...staleSessions]
      .sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .slice(0, 20);

    return {
      headline: items.length
        ? items.some((item: any) => item.level === "critical")
          ? "critical"
          : items.some((item: any) => item.level === "warning")
            ? "warning"
            : "healthy"
        : "healthy",
      counts: {
        total: items.length,
        critical: items.filter((item: any) => item.level === "critical").length,
        warning: items.filter((item: any) => item.level === "warning").length,
        info: items.filter((item: any) => item.level === "info").length
      },
      sources: {
        cron: failingCrons.length,
        office: deskErrors.length,
        tasks: blockedTasks.length,
        sessions: staleSessions.length
      },
      activeIncidentCount: failingCrons.length + deskErrors.length + blockedTasks.length,
      items
    };
  }
});
