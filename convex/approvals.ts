import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const approvalStatus = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("executed")
);

export const list = query({
  args: {},
  handler: async (ctx) => {
    const approvals = await ctx.db.query("approvals").collect();
    return approvals.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  }
});

export const summary = query({
  args: {},
  handler: async (ctx) => {
    const approvals = await ctx.db.query("approvals").collect();
    const pending = approvals.filter((item) => item.status === "pending");
    const approved = approvals.filter((item) => item.status === "approved");
    const rejected = approvals.filter((item) => item.status === "rejected");
    const executed = approvals.filter((item) => item.status === "executed");

    return {
      total: approvals.length,
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      executed: executed.length,
      highRiskPending: pending.filter((item) => item.riskLevel.toLowerCase() === "high").length,
      recent: approvals
        .slice()
        .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
        .slice(0, 8)
    };
  }
});

export const create = mutation({
  args: {
    title: v.string(),
    actionType: v.string(),
    targetType: v.string(),
    targetLabel: v.string(),
    rationale: v.string(),
    requestedBy: v.string(),
    riskLevel: v.string()
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const dryRunSummary = `Dry run only: ${args.actionType} on ${args.targetType} (${args.targetLabel}) would require explicit approval before side effects are allowed.`;
    return await ctx.db.insert("approvals", {
      ...args,
      status: "pending",
      dryRunSummary,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const approve = mutation({
  args: { approvalId: v.id("approvals"), approvedBy: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.approvalId, {
      status: "approved",
      approvedBy: args.approvedBy,
      approvedAt: Date.now(),
      updatedAt: Date.now()
    });
  }
});

export const reject = mutation({
  args: { approvalId: v.id("approvals"), rejectedBy: v.string(), rejectedReason: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.approvalId, {
      status: "rejected",
      rejectedBy: args.rejectedBy,
      rejectedReason: args.rejectedReason,
      rejectedAt: Date.now(),
      updatedAt: Date.now()
    });
  }
});

export const execute = mutation({
  args: { approvalId: v.id("approvals"), executedBy: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.approvalId);
    if (!existing) throw new Error("Approval not found.");
    if (existing.status !== "approved") throw new Error("Only approved actions can be executed.");

    await ctx.db.patch(args.approvalId, {
      status: "executed",
      executedBy: args.executedBy,
      executedAt: Date.now(),
      executionSummary: `Execution placeholder completed by ${args.executedBy}. Real side effects can be wired into this action later.`,
      updatedAt: Date.now()
    });
  }
});
