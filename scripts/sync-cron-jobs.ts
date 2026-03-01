import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import fs from "node:fs";
import dotenv from "dotenv";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

type CronJob = {
  key: string;
  name: string;
  schedule: string;
  command: string;
  status?: string;
  lastRunAt?: number;
  nextRunAt?: number;
};

function formatEvery(ms: number) {
  const s = Math.round(ms / 1000);
  if (s % 86400 === 0) return `${s / 86400}d`;
  if (s % 3600 === 0) return `${s / 3600}h`;
  if (s % 60 === 0) return `${s / 60}m`;
  return `${s}s`;
}

function normalizeSchedule(raw: any): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;

  // OpenClaw schedule object: {kind: 'every'|'cron'|'at', ...}
  const kind = raw.kind;
  if (kind === "every" && typeof raw.everyMs === "number") {
    return `every ${formatEvery(raw.everyMs)}`;
  }
  if (kind === "cron" && typeof raw.expr === "string") {
    const tz = typeof raw.tz === "string" && raw.tz ? ` tz=${raw.tz}` : "";
    return `cron ${raw.expr}${tz}`;
  }
  if (kind === "at") {
    const at = raw.at ?? raw.atMs;
    if (typeof at === "string") return `at ${at}`;
    if (typeof at === "number") return `at ${new Date(at).toISOString()}`;
    return `at ${JSON.stringify(raw)}`;
  }

  return JSON.stringify(raw);
}

function normalizeCommand(job: any): string {
  if (!job) return "";
  if (typeof job.command === "string") return job.command;
  if (typeof job.payload?.message === "string") return job.payload.message;
  if (typeof job.payload?.text === "string") return job.payload.text;
  if (typeof job.payload === "string") return job.payload;
  return JSON.stringify(job.payload ?? job.command ?? "");
}

function normalizeStatus(job: any): string {
  if (typeof job.status === "string") return job.status;
  if (typeof job.enabled === "boolean") return job.enabled ? "enabled" : "disabled";
  if (typeof job.state?.lastRunStatus === "string") return job.state.lastRunStatus;
  return "unknown";
}

function readJobs(): CronJob[] {
  try {
    const output = execSync("openclaw cron list --json", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
    const parsed = JSON.parse(output) as any;
    const jobs = Array.isArray(parsed) ? parsed : (parsed.jobs ?? []);
    return jobs.map((j: any, i: number) => ({
      key: j.key ?? j.id ?? `job-${i}`,
      name: j.name ?? j.key ?? `Job ${i + 1}`,
      schedule: normalizeSchedule(j.schedule) || "(unspecified)",
      command: normalizeCommand(j),
      status: normalizeStatus(j),
      lastRunAt: j.state?.lastRunAtMs ?? j.lastRunAt,
      nextRunAt: j.state?.nextRunAtMs ?? j.nextRunAt
    }));
  } catch {
    const file = process.argv[2] ?? path.resolve(process.cwd(), "openclaw-cron.json");
    if (!existsSync(file)) {
      throw new Error("Could not read cron data. Provide JSON file path: npm run sync:cron -- ./openclaw-cron.json");
    }
    const parsed = JSON.parse(readFileSync(file, "utf-8")) as CronJob[];
    return parsed;
  }
}

async function main() {
  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL");

  const jobs = readJobs();
  const client = new ConvexHttpClient(convexUrl);
  const result = await client.mutation(api.calendar.upsertJobs, { jobs });
  console.log(`Synced ${result.updated} cron jobs`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
