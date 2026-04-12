import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function monthPrefix(year: number, month: number) {
  const mm = String(month).padStart(2, "0");
  return `${year}-${mm}`;
}

export const listMonth = query({
  args: { year: v.number(), month: v.number() },
  handler: async (ctx, args) => {
    const prefix = monthPrefix(args.year, args.month);
    const [events, tasks] = await Promise.all([
      ctx.db.query("calendarEvents").collect(),
      ctx.db.query("tasks").collect()
    ]);
    const monthEvents = events.filter((event) => event.date.startsWith(prefix));
    const taskMilestones = tasks
      .filter((task) => task.dueDate && task.dueDate.startsWith(prefix))
      .map((task) => ({
        _id: `task-${task._id}`,
        title: task.title,
        description: task.description,
        date: task.dueDate,
        time: undefined,
        type: "task-milestone",
        linkedTaskId: task._id,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        source: "task"
      }));
    return [...monthEvents, ...taskMilestones].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  }
});

export const listUpcoming = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().slice(0, 10);
    const limit = args.limit ?? 10;
    const events = await ctx.db.query("calendarEvents").collect();
    return events
      .filter((event) => event.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, limit);
  }
});

export const listJobs = query({
  args: {},
  handler: async (ctx) => {
    const jobs = await ctx.db.query("cronJobs").collect();
    return jobs.sort((a, b) => a.name.localeCompare(b.name));
  }
});

export const getEvent = query({
  args: { eventId: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;
    const linkedTask = event.linkedTaskId ? await ctx.db.get(event.linkedTaskId) : null;
    return { ...event, linkedTask };
  }
});

export const taskOptions = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    return tasks
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .slice(0, 100)
      .map((task) => ({ _id: task._id, title: task.title, dueDate: task.dueDate, status: task.status }));
  }
});

export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    date: v.string(),
    time: v.optional(v.string()),
    type: v.optional(v.string()),
    linkedTaskId: v.optional(v.id("tasks"))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("calendarEvents", {
      title: args.title,
      description: args.description ?? "",
      date: args.date,
      time: args.time,
      type: args.type,
      linkedTaskId: args.linkedTaskId,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const updateEvent = mutation({
  args: {
    eventId: v.id("calendarEvents"),
    title: v.string(),
    description: v.string(),
    date: v.string(),
    time: v.optional(v.string()),
    type: v.optional(v.string()),
    linkedTaskId: v.optional(v.id("tasks"))
  },
  handler: async (ctx, args) => {
    const { eventId, ...fields } = args;
    await ctx.db.patch(eventId, { ...fields, updatedAt: Date.now() });
  }
});

export const upsertJobs = mutation({
  args: {
    jobs: v.array(
      v.object({
        key: v.string(),
        name: v.string(),
        schedule: v.string(),
        command: v.string(),
        status: v.optional(v.string()),
        lastRunAt: v.optional(v.number()),
        nextRunAt: v.optional(v.number())
      })
    )
  },
  handler: async (ctx, args) => {
    let updated = 0;
    for (const job of args.jobs) {
      const existing = await ctx.db
        .query("cronJobs")
        .withIndex("by_key", (q) => q.eq("key", job.key))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          name: job.name,
          schedule: job.schedule,
          command: job.command,
          status: job.status ?? existing.status,
          lastRunAt: job.lastRunAt,
          nextRunAt: job.nextRunAt,
          updatedAt: Date.now()
        });
      } else {
        await ctx.db.insert("cronJobs", {
          key: job.key,
          name: job.name,
          schedule: job.schedule,
          command: job.command,
          status: job.status ?? "active",
          lastRunAt: job.lastRunAt,
          nextRunAt: job.nextRunAt,
          updatedAt: Date.now()
        });
      }
      updated += 1;
    }
    return { updated };
  }
});
