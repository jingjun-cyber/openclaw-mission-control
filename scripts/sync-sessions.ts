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

type Session = {
  sessionKey: string;
  agentKey?: string;
  label: string;
  status: string;
  startedAt: number;
  endedAt?: number;
  lastMessage?: string;
};

function readSessions(): Session[] {
  try {
    const output = execSync("openclaw sessions --json --all-agents", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
    const parsed = JSON.parse(output) as any;
    const sessions = Array.isArray(parsed) ? parsed : (parsed.sessions ?? []);
    return sessions.map((s: any, i: number) => {
      const key = s.key ?? s.sessionKey ?? s.id ?? `session-${i}`;
      const agentId = s.agentId;
      const kind = s.kind ?? "";
      const label = s.label ?? s.name ?? key;
      const status = s.abortedLastRun ? "aborted" : (s.systemSent ? "active" : "unknown");

      // Map OpenClaw main agent to our roster key
      const agentKey = agentId === "main" ? "macbot" : undefined;

      return {
        sessionKey: key,
        agentKey,
        label,
        status,
        startedAt: s.updatedAt ?? Date.now(),
        endedAt: undefined,
        lastMessage: `${kind}${agentId ? ` • agent=${agentId}` : ""}`
      };
    });
  } catch {
    const file = process.argv[2] ?? path.resolve(process.cwd(), "openclaw-sessions.json");
    if (!existsSync(file)) {
      throw new Error("Could not read sessions data via `openclaw sessions --json`. Provide JSON file path: npm run sync:sessions -- ./openclaw-sessions.json");
    }
    return JSON.parse(readFileSync(file, "utf-8")) as Session[];
  }
}

async function main() {
  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL");

  const client = new ConvexHttpClient(convexUrl);
  const sessions = readSessions();
  const result = await client.mutation(api.team.upsertSessions, { sessions });
  console.log(`Synced ${result.updated} sessions`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
