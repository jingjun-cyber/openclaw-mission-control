import { query } from "./_generated/server";

const taskStatuses = ["Backlog", "Doing", "Review", "Done", "Blocked"] as const;
const pipelineStages = ["Idea", "Outline", "Draft", "Edit", "Publish", "Archive"] as const;

export const summary = query({
  args: {},
  handler: async (ctx) => {
    const [tasks, pipeline, events, docs, agents, desks] = await Promise.all([
      ctx.db.query("tasks").collect(),
      ctx.db.query("contentItems").collect(),
      ctx.db.query("calendarEvents").collect(),
      ctx.db.query("memoryDocs").collect(),
      ctx.db.query("teamAgents").collect(),
      ctx.db.query("officeDesks").collect()
    ]);

    return {
      tasks: tasks.length,
      pipeline: pipeline.length,
      events: events.length,
      docs: docs.length,
      agents: agents.length,
      desks: desks.length
    };
  }
});

export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    const [tasks, pipeline, events, docs, agents, desks, sessions] = await Promise.all([
      ctx.db.query("tasks").collect(),
      ctx.db.query("contentItems").collect(),
      ctx.db.query("calendarEvents").collect(),
      ctx.db.query("memoryDocs").collect(),
      ctx.db.query("teamAgents").collect(),
      ctx.db.query("officeDesks").collect(),
      ctx.db.query("teamSessions").collect()
    ]);

    const tasksByStatus = Object.fromEntries(taskStatuses.map((s) => [s, 0])) as Record<(typeof taskStatuses)[number], number>;
    for (const t of tasks) {
      const s = (t as any).status as (typeof taskStatuses)[number];
      if (s in tasksByStatus) tasksByStatus[s] += 1;
    }

    const pipelineByStage = Object.fromEntries(pipelineStages.map((s) => [s, 0])) as Record<(typeof pipelineStages)[number], number>;
    for (const item of pipeline) {
      const s = (item as any).stage as (typeof pipelineStages)[number];
      if (s in pipelineByStage) pipelineByStage[s] += 1;
    }

    const today = new Date().toISOString().slice(0, 10);
    const upcomingEvents = events
      .filter((e: any) => e.date >= today)
      .sort((a: any, b: any) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")))
      .slice(0, 5);

    const recentDocs = docs
      .slice()
      .sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .slice(0, 5)
      .map((d: any) => ({ _id: d._id, title: d.title, path: d.path, updatedAt: d.updatedAt }));

    const workingDesks = desks.filter((d: any) => d.presence === "working");

    const recentSessions = sessions
      .slice()
      .sort((a: any, b: any) => (b.startedAt ?? 0) - (a.startedAt ?? 0))
      .slice(0, 10);

    return {
      counts: {
        tasks: tasks.length,
        pipeline: pipeline.length,
        events: events.length,
        docs: docs.length,
        agents: agents.length,
        desks: desks.length
      },
      tasksByStatus,
      pipelineByStage,
      upcomingEvents,
      recentDocs,
      office: {
        working: workingDesks.length,
        idle: desks.filter((d: any) => d.presence === "idle").length,
        away: desks.filter((d: any) => d.presence === "away").length,
        error: desks.filter((d: any) => d.presence === "error").length
      },
      recentSessions
    };
  }
});
