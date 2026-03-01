import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const status = v.union(
  v.literal("Backlog"),
  v.literal("Doing"),
  v.literal("Review"),
  v.literal("Done"),
  v.literal("Blocked")
);

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
    return await ctx.db.insert("tasks", {
      title: args.title,
      description: "",
      status: "Backlog",
      assignee: args.assignee,
      dueDate: undefined,
      priority: "medium",
      createdAt: now,
      updatedAt: now
    });
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
