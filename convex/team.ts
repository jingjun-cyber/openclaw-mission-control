import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listRoles = query({
  args: {},
  handler: async (ctx) => {
    const roles = await ctx.db.query("teamRoles").collect();
    return roles.sort((a, b) => a.name.localeCompare(b.name));
  }
});

export const listAgents = query({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query("teamAgents").collect();
    return agents.sort((a, b) => a.name.localeCompare(b.name));
  }
});

export const listSessions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const sessions = await ctx.db.query("teamSessions").collect();
    return sessions.sort((a, b) => b.startedAt - a.startedAt).slice(0, args.limit ?? 20);
  }
});

export const getAgent = query({
  args: { agentId: v.id("teamAgents") },
  handler: async (ctx, args) => await ctx.db.get(args.agentId)
});

export const createRole = mutation({
  args: { key: v.string(), name: v.string(), description: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("teamRoles", {
      key: args.key,
      name: args.name,
      description: args.description,
      defaultTools: [],
      createdAt: now,
      updatedAt: now
    });
  }
});

export const createAgent = mutation({
  args: { key: v.string(), name: v.string(), roleKey: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("teamAgents", {
      key: args.key,
      name: args.name,
      roleKey: args.roleKey,
      description: "",
      typicalTasks: [],
      enabled: true,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const updateAgent = mutation({
  args: {
    agentId: v.id("teamAgents"),
    name: v.string(),
    roleKey: v.string(),
    description: v.string(),
    typicalTasks: v.array(v.string()),
    modelPreference: v.optional(v.string()),
    enabled: v.boolean()
  },
  handler: async (ctx, args) => {
    const { agentId, ...fields } = args;
    await ctx.db.patch(agentId, { ...fields, updatedAt: Date.now() });
  }
});

export const upsertAgents = mutation({
  args: {
    agents: v.array(
      v.object({
        key: v.string(),
        name: v.string(),
        roleKey: v.string(),
        description: v.string(),
        typicalTasks: v.array(v.string()),
        modelPreference: v.optional(v.string()),
        enabled: v.boolean()
      })
    )
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const incomingKeys = new Set(args.agents.map((a) => a.key));

    // Upsert incoming
    let updated = 0;
    for (const agent of args.agents) {
      const existing = await ctx.db
        .query("teamAgents")
        .withIndex("by_key", (q) => q.eq("key", agent.key))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, { ...agent, updatedAt: now });
      } else {
        await ctx.db.insert("teamAgents", { ...agent, createdAt: now, updatedAt: now });
      }
      updated += 1;
    }

    // Remove agents that no longer exist locally (keeps Team count == local configured agents)
    const existingAll = await ctx.db.query("teamAgents").collect();
    let removed = 0;
    for (const a of existingAll) {
      if (!incomingKeys.has(a.key)) {
        await ctx.db.delete(a._id);
        removed += 1;
      }
    }

    return { updated, removed };
  }
});

export const upsertSessions = mutation({
  args: {
    sessions: v.array(
      v.object({
        sessionKey: v.string(),
        agentKey: v.optional(v.string()),
        label: v.string(),
        status: v.string(),
        startedAt: v.number(),
        endedAt: v.optional(v.number()),
        lastMessage: v.optional(v.string())
      })
    )
  },
  handler: async (ctx, args) => {
    let updated = 0;
    for (const session of args.sessions) {
      const existing = await ctx.db
        .query("teamSessions")
        .withIndex("by_session_key", (q) => q.eq("sessionKey", session.sessionKey))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, { ...session, updatedAt: Date.now() });
      } else {
        const now = Date.now();
        await ctx.db.insert("teamSessions", { ...session, createdAt: now, updatedAt: now });
      }
      updated += 1;
    }
    return { updated };
  }
});
