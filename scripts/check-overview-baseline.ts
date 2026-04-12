#!/usr/bin/env tsx

import path from "node:path";
import fs from "node:fs";
import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL");

  const client = new ConvexHttpClient(convexUrl);
  const summary: any = await client.query(api.overview.summary, {} as never);

  assert(summary, "overview summary missing");
  assert(summary.headline?.status, "headline status missing");
  assert(summary.headline?.title, "headline title missing");
  assert(summary.metrics && typeof summary.metrics.tasks === "number", "metrics.tasks missing");
  assert(Array.isArray(summary.attention), "attention list missing");
  assert(summary.activeWork && Array.isArray(summary.activeWork.doingTasks), "activeWork.doingTasks missing");
  assert(Array.isArray(summary.activeWork.reviewTasks), "activeWork.reviewTasks missing");
  assert(Array.isArray(summary.activeWork.activeSessions), "activeWork.activeSessions missing");
  assert(Array.isArray(summary.activeWork.workingDesks), "activeWork.workingDesks missing");
  assert(summary.sync && typeof summary.sync.failingCrons === "number", "sync.failingCrons missing");
  assert(Array.isArray(summary.upcomingEvents), "upcomingEvents missing");
  assert(["healthy", "warning", "critical"].includes(summary.headline.status), "unexpected headline status");

  console.log("overview baseline OK");
  console.log(JSON.stringify({
    status: summary.headline.status,
    tasks: summary.metrics.tasks,
    failingCrons: summary.sync.failingCrons,
    attentionItems: summary.attention.length,
    activeSessions: summary.metrics.activeSessions
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
