#!/usr/bin/env tsx

import path from "node:path";
import fs from "node:fs";
import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const TASKS = [
  "[Overview] Define overview information architecture",
  "[Overview] Design overview summary data model",
  "[Overview] Add Convex overview aggregation query",
  "[Overview] Calculate overall system health state",
  "[Overview] Build risk and attention cards",
  "[Overview] Build active work cards",
  "[Overview] Build operations metrics cards",
  "[Overview] Build sync health summary card",
  "[Overview] Create app/overview/page.tsx UI",
  "[Overview] Update navigation and default entry",
  "[Overview] Add drill-down links from overview cards",
  "[Overview] Rewrite overview copy for operator-first language",
  "[Overview] Add baseline tests for overview states"
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
      continue;
    }
    await client.mutation(api.tasks.create, { title, assignee: "MacBot" } as never);
    created += 1;
    console.log(`create: ${title}`);
  }
  console.log(`Done. created=${created}, skipped=${skipped}, total=${TASKS.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
