import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
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

function readJobs(): CronJob[] {
  try {
    const output = execSync("openclaw cron list --json", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
    const parsed = JSON.parse(output) as any[];
    return parsed.map((j, i) => ({
      key: j.key ?? j.id ?? `job-${i}`,
      name: j.name ?? j.key ?? `Job ${i + 1}`,
      schedule: j.schedule ?? "* * * * *",
      command: j.command ?? "",
      status: j.status,
      lastRunAt: j.lastRunAt,
      nextRunAt: j.nextRunAt
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
