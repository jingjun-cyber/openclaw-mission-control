#!/usr/bin/env tsx

import { spawn } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";
import dotenv from "dotenv";

// Load env from .env.local if present so scripts can run non-interactively.
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

type Step = { name: string; command: string; args: string[] };

const steps: Step[] = [
  { name: "seed:defaults", command: "npm", args: ["run", "seed:defaults"] },
  { name: "sync:agents", command: "npm", args: ["run", "sync:agents"] },
  { name: "sync:memory", command: "npm", args: ["run", "sync:memory"] },
  { name: "sync:sessions", command: "npm", args: ["run", "sync:sessions"] },
  { name: "sync:cron", command: "npm", args: ["run", "sync:cron"] }
];

function runStep(step: Step) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(step.command, step.args, {
      stdio: "inherit",
      env: process.env
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${step.name} failed with exit code ${code}`));
      }
    });
  });
}

async function main() {
  console.log("[mission-control] sync-all starting");
  for (const step of steps) {
    console.log(`\n[mission-control] ${step.name}...`);
    await runStep(step);
  }
  console.log("\n[mission-control] sync-all done");
}

main().catch((err) => {
  console.error("[mission-control] sync-all failed:", err);
  process.exit(1);
});
