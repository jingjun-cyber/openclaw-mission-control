import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const queueStatus = v.union(v.literal("queued"), v.literal("assigned"), v.literal("in_progress"), v.literal("handoff"), v.literal("done"), v.literal("blocked"));

export const listQueue = query({
  args: {},
  handler: async (ctx) => {
    const [items, tasks] = await Promise.all([
      ctx.db.query("executionQueue").collect(),
      ctx.db.query("tasks").collect()
    ]);
    const taskMap = new Map(tasks.map((task) => [String(task._id), task]));
    return items
      .map((item) => ({ ...item, task: taskMap.get(String(item.taskId)) ?? null }))
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  }
});

export const queueSummary = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("executionQueue").collect();
    return {
      queued: items.filter((item) => item.status === "queued").length,
      assigned: items.filter((item) => item.status === "assigned").length,
      inProgress: items.filter((item) => item.status === "in_progress").length,
      handoff: items.filter((item) => item.status === "handoff").length,
      blocked: items.filter((item) => item.status === "blocked").length
    };
  }
});

export const getTaskQueue = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.query("executionQueue").withIndex("by_taskId", (q) => q.eq("taskId", args.taskId)).unique();
  }
});

export const listTaskHandoffs = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("taskHandoffs").withIndex("by_taskId", (q) => q.eq("taskId", args.taskId)).collect();
    return items.sort((a, b) => b.createdAt - a.createdAt);
  }
});

export const enqueueTask = mutation({
  args: { taskId: v.id("tasks"), requestedBy: v.string(), priority: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("executionQueue").withIndex("by_taskId", (q) => q.eq("taskId", args.taskId)).unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { status: "queued", priority: args.priority, requestedBy: args.requestedBy, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("executionQueue", {
      taskId: args.taskId,
      status: "queued",
      assignedAgentKey: undefined,
      priority: args.priority,
      requestedBy: args.requestedBy,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const assignTask = mutation({
  args: { taskId: v.id("tasks"), agentKey: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("executionQueue").withIndex("by_taskId", (q) => q.eq("taskId", args.taskId)).unique();
    const now = Date.now();
    if (!existing) throw new Error("Queue item not found.");
    await ctx.db.patch(existing._id, { status: "assigned", assignedAgentKey: args.agentKey, updatedAt: now });
    await ctx.db.patch(args.taskId, { assignee: args.agentKey, updatedAt: now });
  }
});

export const startTask = mutation({
  args: { taskId: v.id("tasks"), agentKey: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("executionQueue").withIndex("by_taskId", (q) => q.eq("taskId", args.taskId)).unique();
    const now = Date.now();
    if (!existing) throw new Error("Queue item not found.");
    await ctx.db.patch(existing._id, { status: "in_progress", assignedAgentKey: args.agentKey, startedAt: existing.startedAt ?? now, updatedAt: now });
    await ctx.db.patch(args.taskId, { assignee: args.agentKey, status: "Doing", updatedAt: now });
  }
});

export const handoffTask = mutation({
  args: { taskId: v.id("tasks"), fromAgentKey: v.optional(v.string()), toAgentKey: v.optional(v.string()), note: v.string(), createdBy: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("executionQueue").withIndex("by_taskId", (q) => q.eq("taskId", args.taskId)).unique();
    const now = Date.now();
    if (!existing) throw new Error("Queue item not found.");
    await ctx.db.insert("taskHandoffs", { taskId: args.taskId, fromAgentKey: args.fromAgentKey, toAgentKey: args.toAgentKey, note: args.note, createdBy: args.createdBy, createdAt: now });
    await ctx.db.patch(existing._id, {
      status: "handoff",
      handoffFrom: args.fromAgentKey,
      handoffTo: args.toAgentKey,
      handoffNote: args.note,
      assignedAgentKey: args.toAgentKey,
      updatedAt: now
    });
    await ctx.db.patch(args.taskId, { assignee: args.toAgentKey, updatedAt: now });
  }
});

export const completeTask = mutation({
  args: { taskId: v.id("tasks"), agentKey: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("executionQueue").withIndex("by_taskId", (q) => q.eq("taskId", args.taskId)).unique();
    const now = Date.now();
    if (!existing) throw new Error("Queue item not found.");
    await ctx.db.patch(existing._id, { status: "done", assignedAgentKey: args.agentKey, completedAt: now, updatedAt: now });
    await ctx.db.patch(args.taskId, { status: "Done", updatedAt: now });
  }
});

export const blockTask = mutation({
  args: { taskId: v.id("tasks"), note: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("executionQueue").withIndex("by_taskId", (q) => q.eq("taskId", args.taskId)).unique();
    const now = Date.now();
    if (!existing) throw new Error("Queue item not found.");
    await ctx.db.patch(existing._id, { status: "blocked", handoffNote: args.note, updatedAt: now });
    await ctx.db.patch(args.taskId, { status: "Blocked", updatedAt: now });
  }
});
