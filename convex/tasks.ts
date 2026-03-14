import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const status = v.union(
  v.literal("Backlog"),
  v.literal("Doing"),
  v.literal("Review"),
  v.literal("Done"),
  v.literal("Blocked")
);

function createQuestionPool(title: string, description: string) {
  const text = `${title}\n${description}`.toLowerCase();
  const hasProductSignals = /(ui|ux|page|screen|component|design|tailwind|next\.js|app router)/.test(text);
  const hasDataSignals = /(convex|schema|migration|data|api|query|mutation|model)/.test(text);

  return Array.from(
    new Set(
      [
        "What concrete outcome should be true when this task is done?",
        "What constraints or non-goals should the implementation avoid?",
        hasProductSignals
          ? "Which user flow or screen state matters most for the first implementation?"
          : "Which part of the system should be treated as the primary surface for this work?",
        hasDataSignals
          ? "What existing data model or API contract must remain compatible?"
          : "What existing route, module, or behavior must remain unchanged?",
        "How should success be verified once the work is complete?"
      ].filter(Boolean)
    )
  ).slice(0, 5);
}

async function getPlanningSessionByTaskId(ctx: { db: any }, taskId: any) {
  return await ctx.db.query("planningSessions").withIndex("by_taskId", (q: any) => q.eq("taskId", taskId)).unique();
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("tasks").collect();
    return items.sort((a, b) => b.updatedAt - a.updatedAt);
  }
});

export const get = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  }
});

export const create = mutation({
  args: { title: v.string(), assignee: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: "",
      status: "Backlog",
      stage: "planning",
      assignee: args.assignee,
      dueDate: undefined,
      priority: "medium",
      plan: undefined,
      createdAt: now,
      updatedAt: now
    });

    const existingSession = await getPlanningSessionByTaskId(ctx, taskId);
    if (!existingSession) {
      await ctx.db.insert("planningSessions", {
        taskId,
        status: "active",
        stage: "planning",
        questions: createQuestionPool(args.title, ""),
        answers: [],
        currentIndex: 0,
        createdAt: now,
        updatedAt: now
      });
    }

    return taskId;
  }
});

export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.string(),
    description: v.string(),
    assignee: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    priority: v.optional(v.string()),
    status
  },
  handler: async (ctx, args) => {
    const { taskId, ...fields } = args;
    await ctx.db.patch(taskId, { ...fields, updatedAt: Date.now() });
  }
});

export const move = mutation({
  args: { taskId: v.id("tasks"), status },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, { status: args.status, updatedAt: Date.now() });
  }
});
