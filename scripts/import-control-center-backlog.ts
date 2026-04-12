#!/usr/bin/env tsx

import path from "node:path";
import fs from "node:fs";
import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const TASKS = [
  "Add Overview dashboard for Mission Control",
  "Add usage and spend analytics page",
  "Add connector health status panel",
  "Add context pressure monitoring for active sessions",
  "Add multi-agent collaboration hall",
  "Add live runtime stream to collaboration and task views",
  "Add execution queue and handoff flow for agent collaboration",
  "Add evidence thread view for task execution artifacts",
  "Add approval workflow and gated action controls",
  "Add source-backed documents workbench",
  "Add memory health and searchability status",
  "Improve staff page to separate active, queued, idle, blocked states",
  "Add connection health diagnostics card in settings",
  "Add security risk summary in settings",
  "Add version/update status card",
  "Add read-only mode and mutation safety gates",
  "Add local token authentication for protected actions",
  "Upgrade content pipeline from basic stages to operational workflow",
  "Deepen calendar-task linkage",
  "Add cron timeline visualization in calendar",
  "Improve AI planning workflow for tasks",
  "Add explicit planning-to-execution transition management",
  "Expand task export formats and scope",
  "Improve office presence with session-based and webhook-based fusion",
  "Enrich agent profiles with capabilities, tools, channels, and workload",
  "Add sync health dashboard for seed, memory, sessions, and cron",
  "Add operator daily summary page inside Mission Control",
  "Review and close task-board gaps versus control-center tasks",
  "Review and close memory workbench gaps versus control-center",
  "Review and close team/staff visualization gaps",
  "Review and close office visualization gaps",
  "Review and close settings observability gaps"
];

async function main() {
  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL");

  const client = new ConvexHttpClient(convexUrl);
  const existing = await client.query(api.tasks.list, {} as never);
  const existingTitles = new Set((existing ?? []).map((t: any) => t.title));

  let created = 0;
  let skipped = 0;

  for (const title of TASKS) {
    if (existingTitles.has(title)) {
      skipped += 1;
      console.log(`skip: ${title}`);
      continue;
    }
    await client.mutation(api.tasks.create, { title, assignee: "MacBot" } as never);
    created += 1;
    console.log(`create: ${title}`);
  }

  console.log(`\nDone. created=${created}, skipped=${skipped}, total=${TASKS.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
