import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const presence = v.union(v.literal("idle"), v.literal("working"), v.literal("away"), v.literal("error"));

export const listDesks = query({
  args: {},
  handler: async (ctx) => {
    const desks = await ctx.db.query("officeDesks").collect();
    return desks.sort((a, b) => (a.row - b.row) || (a.col - b.col));
  }
});

export const getDesk = query({
  args: { deskId: v.id("officeDesks") },
  handler: async (ctx, args) => await ctx.db.get(args.deskId)
});

export const createDesk = mutation({
  args: {
    code: v.string(),
    label: v.string(),
    row: v.number(),
    col: v.number(),
    agentName: v.optional(v.string()),
    avatar: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("officeDesks", {
      ...args,
      presence: "idle",
      updatedAt: Date.now()
    });
  }
});

export const updateDesk = mutation({
  args: {
    deskId: v.id("officeDesks"),
    label: v.string(),
    row: v.number(),
    col: v.number(),
    agentName: v.optional(v.string()),
    avatar: v.optional(v.string()),
    presence
  },
  handler: async (ctx, args) => {
    const { deskId, ...fields } = args;
    await ctx.db.patch(deskId, { ...fields, updatedAt: Date.now() });
  }
});

export const setPresenceByCode = mutation({
  args: {
    deskCode: v.string(),
    presence,
    note: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const desk = await ctx.db
      .query("officeDesks")
      .withIndex("by_code", (q) => q.eq("code", args.deskCode))
      .unique();

    if (!desk) {
      throw new Error(`Desk not found: ${args.deskCode}`);
    }

    await ctx.db.patch(desk._id, { presence: args.presence, updatedAt: Date.now() });
    await ctx.db.insert("officePresenceEvents", {
      deskCode: args.deskCode,
      presence: args.presence,
      note: args.note,
      createdAt: Date.now()
    });
  }
});

export const initDefaultDesks = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("officeDesks").collect();
    if (existing.length > 0) return { created: 0, message: "Already initialized" };

    const created: string[] = [];
    for (let row = 1; row <= 3; row += 1) {
      for (let col = 1; col <= 4; col += 1) {
        const code = `D${row}${col}`;
        await ctx.db.insert("officeDesks", {
          code,
          label: `Desk ${row}-${col}`,
          row,
          col,
          agentName: undefined,
          avatar: undefined,
          presence: "idle",
          updatedAt: Date.now()
        });
        created.push(code);
      }
    }

    return { created: created.length, desks: created };
  }
});
