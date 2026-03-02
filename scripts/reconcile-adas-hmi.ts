#!/usr/bin/env tsx

import path from "node:path";
import fs from "node:fs";
import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

type TaskStatus = "Backlog" | "Doing" | "Review" | "Done" | "Blocked";

type PlanTask = {
  title: string;
  status: TaskStatus;
  priority?: string;
  assignee?: string;
  description?: string;
};

async function ensureTask(
  client: ConvexHttpClient,
  existingByTitle: Map<string, any>,
  t: PlanTask
) {
  const found = existingByTitle.get(t.title);
  if (found) {
    await client.mutation(api.tasks.update, {
      taskId: found._id,
      title: t.title,
      description: t.description ?? found.description ?? "",
      assignee: t.assignee ?? found.assignee,
      dueDate: found.dueDate,
      priority: t.priority ?? found.priority,
      status: t.status
    } as any);
    return { id: found._id, existed: true };
  }

  const id = await client.mutation(api.tasks.create, {
    title: t.title,
    assignee: t.assignee
  } as any);

  await client.mutation(api.tasks.update, {
    taskId: id,
    title: t.title,
    description: t.description ?? "",
    assignee: t.assignee,
    dueDate: undefined,
    priority: t.priority ?? "P2",
    status: t.status
  } as any);

  return { id, existed: false };
}

async function main() {
  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL");

  const client = new ConvexHttpClient(convexUrl);
  const tasks = await client.query(api.tasks.list, {});
  const existingByTitle = new Map<string, any>();
  for (const t of tasks as any[]) existingByTitle.set(t.title, t);

  // 1) Backfill / record work done on Mission Control
  const doneLog: PlanTask[] = [
    {
      title: "[Mission Control] Stabilize sync-all + dashboard previews",
      status: "Done",
      priority: "P0",
      description:
        "Completed:\n- Unified Mission Control app (single Next.js + Convex)\n- Dashboard 6-card home with live mini previews\n- sync:all automation (seed + memory + sessions + cron)\n- Fixed OpenClaw cron schedule object -> string normalization\n- Notification policy: fail-only + daily 09:00 summary"
    },
    {
      title: "[Mission Control] Seed defaults (team/office/tasks/pipeline/calendar)",
      status: "Done",
      priority: "P0",
      description: "Implemented seed:defaults and wired into sync:all so app never shows empty state."
    },
    {
      title: "[Mission Control] Cron notify policy: fail-only + daily summary",
      status: "Done",
      priority: "P1",
      description:
        "Updated mission-control-sync to delivery=none (silent success) and created mission-control-sync-daily-summary at 09:00 Asia/Shanghai."
    }
  ];

  for (const t of doneLog) {
    await ensureTask(client, existingByTitle, t);
  }

  // 2) ADAS HMI: convert the two existing tasks into epics (keep titles stable but add [Epic])
  const epics: PlanTask[] = [
    {
      title: "[ADAS HMI][Epic] Status main screen – component breakdown",
      status: "Doing",
      priority: "P1",
      assignee: "Designer",
      description:
        "Goal: deliver a componentized spec for the status main screen.\nReferences:\n- projects/adas-hmi-ux/ui/status-main.html\n- projects/adas-hmi-ux/WORKING_STATE.md"
    },
    {
      title: "[ADAS HMI][Epic] Align Figma components/tokens with design system",
      status: "Backlog",
      priority: "P1",
      assignee: "Designer",
      description:
        "Goal: align Figma components/tokens to the design system and ensure dev handoff is consistent."
    }
  ];

  // If old epic titles exist (without [Epic]), mark them Done and create the new epic versions.
  const oldTitles = [
    "[ADAS HMI] Status main screen – component breakdown",
    "[ADAS HMI] Align Figma components/tokens with design system"
  ];
  for (const ot of oldTitles) {
    const found = existingByTitle.get(ot);
    if (found) {
      await client.mutation(api.tasks.update, {
        taskId: found._id,
        title: found.title,
        description: (found.description ?? "") + "\n\n(Archived: replaced by [Epic] tasks)",
        assignee: found.assignee,
        dueDate: found.dueDate,
        priority: found.priority,
        status: "Done"
      } as any);
    }
  }

  for (const t of epics) {
    await ensureTask(client, existingByTitle, t);
  }

  // 3) ADAS HMI decomposition tasks
  const subtasks: PlanTask[] = [
    {
      title: "[ADAS HMI] Define information architecture for Status Main",
      status: "Doing",
      priority: "P1",
      assignee: "Designer",
      description: "Clarify regions: top bar, ADAS status, speed, road viz, nav card, capability boundary, alerts."
    },
    {
      title: "[ADAS HMI] Component inventory (Status Main) — list + states",
      status: "Doing",
      priority: "P1",
      assignee: "Designer",
      description: "Produce component list + variants (active/ready/limited/warn) and data bindings."
    },
    {
      title: "[ADAS HMI] Token plan — colors/typography/spacing",
      status: "Backlog",
      priority: "P2",
      assignee: "Designer",
      description: "Derive tokens from assets/figma-structure.md and map to UI elements."
    },
    {
      title: "[ADAS HMI] Figma setup — pages/components/frame templates",
      status: "Backlog",
      priority: "P2",
      assignee: "Designer",
      description: "Set up file structure: Colors, Typography, Components, Screens, Prototypes."
    },
    {
      title: "[ADAS HMI] Produce Status Main screen in Figma (v1)",
      status: "Backlog",
      priority: "P1",
      assignee: "Designer",
      description: "Create the actual screen in Figma based on IA + components + tokens."
    },
    {
      title: "[ADAS HMI] Dev handoff checklist + spec doc",
      status: "Backlog",
      priority: "P2",
      assignee: "Writer",
      description: "Generate a handoff doc: components, props, states, interactions, accessibility notes."
    }
  ];

  for (const t of subtasks) {
    await ensureTask(client, existingByTitle, t);
  }

  console.log("Reconciled tasks + started ADAS HMI work.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
