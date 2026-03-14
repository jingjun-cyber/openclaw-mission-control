import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const taskStatus = v.union(
  v.literal("Backlog"),
  v.literal("Doing"),
  v.literal("Review"),
  v.literal("Done"),
  v.literal("Blocked")
);

const taskStage = v.union(v.literal("planning"), v.literal("execution"));

const planningStatus = v.union(
  v.literal("active"),
  v.literal("completed"),
  v.literal("cancelled")
);

const contentStage = v.union(
  v.literal("Idea"),
  v.literal("Outline"),
  v.literal("Draft"),
  v.literal("Edit"),
  v.literal("Publish"),
  v.literal("Archive")
);

const presence = v.union(v.literal("idle"), v.literal("working"), v.literal("away"), v.literal("error"));

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    status: taskStatus,
    stage: taskStage,
    assignee: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    priority: v.optional(v.string()),
    plan: v.optional(
      v.object({
        summary: v.string(),
        steps: v.array(v.string()),
        acceptanceCriteria: v.array(v.string()),
        generatedAt: v.number()
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_status", ["status"])
    .index("by_updatedAt", ["updatedAt"]),

  planningSessions: defineTable({
    taskId: v.id("tasks"),
    status: planningStatus,
    stage: taskStage,
    questions: v.array(v.string()),
    answers: v.array(v.string()),
    currentIndex: v.number(),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_taskId", ["taskId"])
    .index("by_status", ["status"])
    .index("by_updatedAt", ["updatedAt"]),

  contentItems: defineTable({
    // projectKey partitions pipeline items (e.g. mission-control, adas-hmi-ux)
    projectKey: v.optional(v.string()),
    title: v.string(),
    channel: v.string(),
    targetDate: v.string(),
    owner: v.string(),
    brief: v.string(),
    script: v.string(),
    stage: contentStage,
    attachmentIds: v.array(v.id("attachments")),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_project", ["projectKey"])
    .index("by_stage", ["stage"])
    .index("by_targetDate", ["targetDate"]),

  attachments: defineTable({
    contentItemId: v.id("contentItems"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    mimeType: v.string(),
    size: v.number(),
    createdAt: v.number()
  }).index("by_contentItem", ["contentItemId"]),

  calendarEvents: defineTable({
    title: v.string(),
    description: v.string(),
    date: v.string(),
    time: v.optional(v.string()),
    type: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_date", ["date"])
    .index("by_updatedAt", ["updatedAt"]),

  cronJobs: defineTable({
    key: v.string(),
    name: v.string(),
    schedule: v.string(),
    command: v.string(),
    status: v.string(),
    lastRunAt: v.optional(v.number()),
    nextRunAt: v.optional(v.number()),
    updatedAt: v.number()
  }).index("by_key", ["key"]),

  memoryDocs: defineTable({
    path: v.string(),
    title: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    sourceUpdatedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_path", ["path"])
    .index("by_updatedAt", ["updatedAt"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["title", "path"]
    }),

  teamRoles: defineTable({
    key: v.string(),
    name: v.string(),
    description: v.string(),
    defaultTools: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_key", ["key"]),

  teamAgents: defineTable({
    key: v.string(),
    name: v.string(),
    roleKey: v.string(),
    description: v.string(),
    typicalTasks: v.array(v.string()),
    modelPreference: v.optional(v.string()),
    enabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_key", ["key"])
    .index("by_role_key", ["roleKey"]),

  teamSessions: defineTable({
    sessionKey: v.string(),
    agentKey: v.optional(v.string()),
    label: v.string(),
    status: v.string(),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    lastMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_session_key", ["sessionKey"])
    .index("by_startedAt", ["startedAt"]),

  officeDesks: defineTable({
    code: v.string(),
    label: v.string(),
    row: v.number(),
    col: v.number(),
    agentName: v.optional(v.string()),
    avatar: v.optional(v.string()),
    presence,
    updatedAt: v.number()
  }).index("by_code", ["code"]),

  officePresenceEvents: defineTable({
    deskCode: v.string(),
    presence,
    note: v.optional(v.string()),
    createdAt: v.number()
  }).index("by_desk", ["deskCode"])
});
