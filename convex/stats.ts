import { query } from "./_generated/server";

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
