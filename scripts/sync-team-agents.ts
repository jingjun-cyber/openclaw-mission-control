#!/usr/bin/env tsx

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

type OpenClawAgent = {
  id: string;
  name?: string;
  identityName?: string;
  model?: string;
  isDefault?: boolean;
};

function resolveOpenclawBin() {
  const configured = process.env.OPENCLAW_BIN;
  if (configured && fs.existsSync(configured)) return configured;
  const candidates = ["/opt/homebrew/bin/openclaw", "/usr/local/bin/openclaw", "/usr/bin/openclaw"];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return "openclaw";
}

function readAgents(): OpenClawAgent[] {
  const openclawBin = resolveOpenclawBin();
  const output = execSync(`${openclawBin} agents list --json`, {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  const lines = output.split(/\r?\n/);
  const startLine = lines.findIndex((line) => {
    const trimmed = line.trim();
    return trimmed === "[" || trimmed.startsWith("[{" );
  });

  if (startLine === -1) {
    throw new Error(`Could not locate JSON array in openclaw output:\n${output}`);
  }

  const collected: string[] = [];
  let depth = 0;
  let started = false;

  for (const line of lines.slice(startLine)) {
    collected.push(line);
    for (const ch of line) {
      if (ch === "[") {
        depth += 1;
        started = true;
      } else if (ch === "]") {
        depth -= 1;
      }
    }
    if (started && depth === 0) break;
  }

  const cleaned = collected.join("\n").trim();
  return JSON.parse(cleaned) as OpenClawAgent[];
}

function roleForAgent(a: OpenClawAgent): string {
  if (a.id === "main" || a.isDefault) return "operator";
  if (a.id.toLowerCase().includes("dev")) return "developer";
  return "operator";
}

async function main() {
  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL");

  const agents = readAgents();
  const payload = agents.map((a) => ({
    key: a.id,
    name: a.identityName || a.name || a.id,
    roleKey: roleForAgent(a),
    description: "",
    typicalTasks: [],
    capabilities: a.id === "main" ? ["routing", "ops", "coordination"] : ["execution", "specialized work"],
    tools: ["openclaw", "convex", "nextjs"],
    channels: ["telegram", "local"],
    specializationHints: a.id === "main" ? ["primary operator", "task triage"] : ["implementation", "focused execution"],
    workloadLevel: "medium",
    workloadNotes: "Synced from configured agents",
    modelPreference: a.model,
    enabled: true
  }));

  const client = new ConvexHttpClient(convexUrl);
  const result = await client.mutation(api.team.upsertAgents, { agents: payload });
  console.log(`Synced ${result.updated} agents (removed ${result.removed})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
