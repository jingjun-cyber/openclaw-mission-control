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

async function main() {
  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL");

  const client = new ConvexHttpClient(convexUrl);

  const tasks = await client.query(api.tasks.list, {});
  const total = tasks.length;
  const alreadyDone = tasks.filter((t) => t.status === "Done").length;

  // Move everything to Done.
  let changed = 0;
  for (const t of tasks) {
    if (t.status === "Done") continue;
    await client.mutation(api.tasks.move, { taskId: t._id, status: "Done" });
    changed++;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        total,
        alreadyDone,
        changed,
        doneNow: alreadyDone + changed,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
