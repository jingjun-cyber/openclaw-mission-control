import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("memoryDocs").collect();
    return docs.sort((a, b) => b.updatedAt - a.updatedAt);
  }
});

export const get = query({
  args: { docId: v.id("memoryDocs") },
  handler: async (ctx, args) => await ctx.db.get(args.docId)
});

export const health = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("memoryDocs").collect();
    const now = Date.now();
    const totalDocs = docs.length;
    const withContent = docs.filter((doc) => doc.content.trim().length > 0).length;
    const searchableDocs = withContent;
    const withoutContent = totalDocs - withContent;
    const latestUpdatedAt = docs.reduce((max, doc) => Math.max(max, doc.updatedAt ?? 0), 0);
    const latestSourceUpdatedAt = docs.reduce((max, doc) => Math.max(max, doc.sourceUpdatedAt ?? 0), 0);
    const staleThresholdMs = 1000 * 60 * 60 * 24 * 7;
    const staleDocs = docs.filter((doc) => now - (doc.sourceUpdatedAt ?? doc.updatedAt ?? 0) > staleThresholdMs).length;

    return {
      totalDocs,
      searchableDocs,
      withoutContent,
      staleDocs,
      latestUpdatedAt: latestUpdatedAt || null,
      latestSourceUpdatedAt: latestSourceUpdatedAt || null,
      searchReady: searchableDocs > 0,
      freshnessState: staleDocs > 0 ? (staleDocs === totalDocs ? "stale" : "mixed") : "fresh"
    };
  }
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) {
      const docs = await ctx.db.query("memoryDocs").collect();
      return docs.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 50);
    }

    const docs = await ctx.db
      .query("memoryDocs")
      .withSearchIndex("search_content", (q) => q.search("content", args.query))
      .take(50);
    return docs;
  }
});

export const create = mutation({
  args: { path: v.string(), title: v.string(), content: v.string(), tags: v.array(v.string()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("memoryDocs", {
      path: args.path,
      title: args.title,
      content: args.content,
      tags: args.tags,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const update = mutation({
  args: {
    docId: v.id("memoryDocs"),
    title: v.string(),
    content: v.string(),
    tags: v.array(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.docId, {
      title: args.title,
      content: args.content,
      tags: args.tags,
      updatedAt: Date.now()
    });
  }
});

export const upsertDocs = mutation({
  args: {
    docs: v.array(
      v.object({
        path: v.string(),
        title: v.string(),
        content: v.string(),
        tags: v.array(v.string()),
        sourceUpdatedAt: v.optional(v.number())
      })
    )
  },
  handler: async (ctx, args) => {
    let updated = 0;
    for (const doc of args.docs) {
      const existing = await ctx.db
        .query("memoryDocs")
        .withIndex("by_path", (q) => q.eq("path", doc.path))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          title: doc.title,
          content: doc.content,
          tags: doc.tags,
          sourceUpdatedAt: doc.sourceUpdatedAt,
          updatedAt: Date.now()
        });
      } else {
        const now = Date.now();
        await ctx.db.insert("memoryDocs", {
          ...doc,
          createdAt: now,
          updatedAt: now
        });
      }
      updated += 1;
    }
    return { updated };
  }
});
