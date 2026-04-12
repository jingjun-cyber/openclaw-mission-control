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

function resolveOpenclawBin() {
  const configured = process.env.OPENCLAW_BIN;
  if (configured && existsSync(configured)) return configured;

  // Cron often runs with a minimal PATH on macOS, so prefer known locations.
  const candidates = ["/opt/homebrew/bin/openclaw", "/usr/local/bin/openclaw", "/usr/bin/openclaw"];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return "openclaw";
}

function extractJsonValue(output: string): any {
  const lines = output.split(/\r?\n/);
  const startLine = lines.findIndex((line) => {
    const trimmed = line.trim();
    return trimmed === "[" || trimmed === "{" || trimmed.startsWith("[{") || trimmed.startsWith("{");
  });

  if (startLine === -1) {
    throw new Error(`Could not locate JSON payload in openclaw output:\n${output}`);
  }

  const collected: string[] = [];
  let depth = 0;
  let started = false;

  for (const line of lines.slice(startLine)) {
    collected.push(line);
    for (const ch of line) {
      if (ch === "[" || ch === "{") {
        depth += 1;
        started = true;
      } else if (ch === "]" || ch === "}") {
        depth -= 1;
      }
    }
    if (started && depth === 0) break;
  }

  return JSON.parse(collected.join("\n").trim());
}

function readSessions(): Session[] {
  try {
    const openclawBin = resolveOpenclawBin();
    const output = execSync(`${openclawBin} sessions --json --all-agents`, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"]
    });

    const parsed = extractJsonValue(output) as any;
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
  } catch (err) {
    const file = process.argv[2] ?? path.resolve(process.cwd(), "openclaw-sessions.json");
    if (!existsSync(file)) {
      const hint = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Could not read sessions data via openclaw CLI (often PATH issue under cron). ${hint}\n` +
          `Provide JSON file path: npm run sync:sessions -- ./openclaw-sessions.json\n` +
          `Or set OPENCLAW_BIN=/opt/homebrew/bin/openclaw in the cron environment.`
      );
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
