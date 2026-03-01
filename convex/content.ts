import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const stage = v.union(
  v.literal("Idea"),
  v.literal("Outline"),
  v.literal("Draft"),
  v.literal("Edit"),
  v.literal("Publish"),
  v.literal("Archive")
);

export const getBoard = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("contentItems").collect();
    const withPreview = await Promise.all(
      items.map(async (item) => {
        const latestAttachmentId = item.attachmentIds[item.attachmentIds.length - 1];
        if (!latestAttachmentId) return { ...item, previewUrl: null as string | null };
        const attachment = await ctx.db.get(latestAttachmentId);
        if (!attachment) return { ...item, previewUrl: null as string | null };
        const previewUrl = await ctx.storage.getUrl(attachment.storageId);
        return { ...item, previewUrl };
      })
    );
    return withPreview.sort((a, b) => b.updatedAt - a.updatedAt);
  }
});

export const getItem = query({
  args: { itemId: v.id("contentItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) return null;

    const attachments = await ctx.db
      .query("attachments")
      .withIndex("by_contentItem", (q) => q.eq("contentItemId", args.itemId))
      .collect();

    const withUrls = await Promise.all(
      attachments.map(async (attachment) => ({ ...attachment, url: await ctx.storage.getUrl(attachment.storageId) }))
    );

    return { ...item, attachments: withUrls };
  }
});

export const createItem = mutation({
  args: { title: v.string(), owner: v.optional(v.string()), channel: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("contentItems", {
      title: args.title,
      channel: args.channel ?? "Blog",
      targetDate: "",
      owner: args.owner ?? "",
      brief: "",
      script: "",
      stage: "Idea",
      attachmentIds: [],
      createdAt: now,
      updatedAt: now
    });
  }
});

export const updateItem = mutation({
  args: {
    itemId: v.id("contentItems"),
    title: v.string(),
    channel: v.string(),
    targetDate: v.string(),
    owner: v.string(),
    brief: v.string(),
    script: v.string(),
    stage
  },
  handler: async (ctx, args) => {
    const { itemId, ...fields } = args;
    await ctx.db.patch(itemId, { ...fields, updatedAt: Date.now() });
  }
});

export const moveStage = mutation({
  args: { itemId: v.id("contentItems"), stage },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.itemId, { stage: args.stage, updatedAt: Date.now() });
  }
});

export const getUploadUrl = mutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl()
});

export const attachImage = mutation({
  args: {
    itemId: v.id("contentItems"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    mimeType: v.string(),
    size: v.number()
  },
  handler: async (ctx, args) => {
    const attachmentId = await ctx.db.insert("attachments", {
      contentItemId: args.itemId,
      storageId: args.storageId,
      fileName: args.fileName,
      mimeType: args.mimeType,
      size: args.size,
      createdAt: Date.now()
    });

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Content item not found");

    await ctx.db.patch(args.itemId, {
      attachmentIds: [...item.attachmentIds, attachmentId],
      updatedAt: Date.now()
    });

    return attachmentId;
  }
});

export const removeAttachment = mutation({
  args: { itemId: v.id("contentItems"), attachmentId: v.id("attachments") },
  handler: async (ctx, args) => {
    const attachment = await ctx.db.get(args.attachmentId);
    if (attachment) {
      await ctx.storage.delete(attachment.storageId);
      await ctx.db.delete(args.attachmentId);
    }

    const item = await ctx.db.get(args.itemId);
    if (!item) return;

    await ctx.db.patch(args.itemId, {
      attachmentIds: item.attachmentIds.filter((id) => id !== args.attachmentId),
      updatedAt: Date.now()
    });
  }
});
