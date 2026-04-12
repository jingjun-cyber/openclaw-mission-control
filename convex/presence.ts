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
  args: {
    withinMinutes: v.optional(v.number()),
    awayAfterMinutes: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const within = (args.withinMinutes ?? 5) * 60 * 1000;
    const awayThreshold = (args.awayAfterMinutes ?? 15) * 60 * 1000;
    const now = Date.now();

    // Get all recent sessions
    const sessions = await ctx.db.query("teamSessions").collect();
    const agentLastActive = new Map<string, number>();
    for (const s of sessions as any[]) {
      const agentKey = s.agentKey as string | undefined;
      const t = s.startedAt ?? s.updatedAt;
      if (agentKey && t) {
        agentLastActive.set(agentKey, Math.max(agentLastActive.get(agentKey) ?? 0, t));
      }
    }

    // Update all desks based on their assigned agent
    const desks = await ctx.db.query("officeDesks").collect();
    let updated = 0;
    const updates: { code: string; agentName: string | undefined; presence: string; source: string }[] = [];

    for (const desk of desks as any[]) {
      if (!desk.agentName) continue;

      const agentKey = desk.agentName.toLowerCase();
      const lastActive = agentLastActive.get(agentKey);

      let nextPresence = "idle";
      let source = "session-auto";

      if (lastActive) {
        const elapsed = now - lastActive;
        if (elapsed <= within) {
          nextPresence = "working";
          source = "session-active";
        } else if (elapsed <= awayThreshold) {
          nextPresence = "idle";
          source = "session-idle";
        } else {
          nextPresence = "away";
          source = "session-away";
        }
      }

      if (desk.presence !== nextPresence) {
        await ctx.db.patch(desk._id, { presence: nextPresence as any, updatedAt: now });
        await ctx.db.insert("officePresenceEvents", {
          deskCode: desk.code,
          presence: nextPresence as any,
          note: source,
          createdAt: now
        });
        updated += 1;
        updates.push({ code: desk.code, agentName: desk.agentName, presence: nextPresence, source });
      }
    }

    return { updated, activeAgentKeys: Array.from(agentLastActive.keys()), updates };
  }
});

export const bulkSetPresence = mutation({
  args: {
    updates: v.array(v.object({
      deskCode: v.string(),
      presence,
      note: v.optional(v.string()),
      source: v.optional(v.string())
    }))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let updated = 0;

    for (const u of args.updates) {
      const desk = await ctx.db
        .query("officeDesks")
        .withIndex("by_code", (q) => q.eq("code", u.deskCode))
        .unique();

      if (desk) {
        await ctx.db.patch(desk._id, { presence: u.presence, updatedAt: now });
        await ctx.db.insert("officePresenceEvents", {
          deskCode: u.deskCode,
          presence: u.presence,
          note: u.note,
          createdAt: now
        });
        updated += 1;
      }
    }

    return { updated, processed: args.updates.length };
  }
});

