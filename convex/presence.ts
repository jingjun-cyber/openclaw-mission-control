import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const presence = v.union(v.literal("idle"), v.literal("working"), v.literal("away"), v.literal("error"));

export const workingNow = query({
  args: { withinMinutes: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const within = (args.withinMinutes ?? 5) * 60 * 1000;
    const now = Date.now();

    // Working if there is a recent session for that agentKey
    const sessions = await ctx.db.query("teamSessions").collect();
    const byAgent = new Map<string, number>();
    for (const s of sessions as any[]) {
      const agentKey = s.agentKey as string | undefined;
      if (!agentKey) continue;
      const t = s.startedAt ?? s.updatedAt;
      if (!t) continue;
      if (now - t <= within) {
        byAgent.set(agentKey, Math.max(byAgent.get(agentKey) ?? 0, t));
      }
    }

    const desks = await ctx.db.query("officeDesks").collect();
    const working = desks
      .filter((d: any) => d.agentName && byAgent.has(d.agentName.toLowerCase()))
      .map((d: any) => ({ code: d.code, agentName: d.agentName, last: byAgent.get(d.agentName.toLowerCase()) }));

    return { byAgent: Array.from(byAgent.entries()), working };
  }
});

export const refreshOfficeFromSessions = mutation({
  args: { withinMinutes: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const within = (args.withinMinutes ?? 5) * 60 * 1000;
    const now = Date.now();

    const sessions = await ctx.db.query("teamSessions").collect();
    const activeAgentKeys = new Set<string>();
    for (const s of sessions as any[]) {
      const agentKey = s.agentKey as string | undefined;
      const t = s.startedAt ?? s.updatedAt;
      if (agentKey && t && now - t <= within) activeAgentKeys.add(agentKey);
    }

    // Minimal mapping: macbot -> D11 (seed assigns MacBot there)
    const desk = await ctx.db.query("officeDesks").withIndex("by_code", (q) => q.eq("code", "D11")).unique();
    if (desk) {
      const next = activeAgentKeys.has("macbot") ? "working" : "idle";
      await ctx.db.patch(desk._id, { presence: next as any, updatedAt: now });
      await ctx.db.insert("officePresenceEvents", { deskCode: "D11", presence: next as any, note: "auto-from-sessions", createdAt: now });
    }

    return { updated: desk ? 1 : 0, activeAgentKeys: Array.from(activeAgentKeys) };
  }
});
