import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
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
    const output = execSync("openclaw sessions list --json", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
    const parsed = JSON.parse(output) as any[];
    return parsed.map((s, i) => ({
      sessionKey: s.sessionKey ?? s.id ?? `session-${i}`,
      agentKey: s.agentKey,
      label: s.label ?? s.name ?? `Session ${i + 1}`,
      status: s.status ?? "unknown",
      startedAt: s.startedAt ?? Date.now(),
      endedAt: s.endedAt,
      lastMessage: s.lastMessage
    }));
  } catch {
    const file = process.argv[2] ?? path.resolve(process.cwd(), "openclaw-sessions.json");
    if (!existsSync(file)) {
      throw new Error("Could not read sessions data. Provide JSON file path: npm run sync:sessions -- ./openclaw-sessions.json");
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
