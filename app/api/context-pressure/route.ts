import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

type UsageLine = {
  type?: string;
  id?: string;
  timestamp?: string;
  message?: {
    role?: string;
    provider?: string;
    model?: string;
    usage?: {
      input?: number;
      output?: number;
      cacheRead?: number;
      cacheWrite?: number;
      totalTokens?: number;
      cost?: { total?: number };
    };
    content?: Array<{ type?: string; text?: string }>;
  };
};

const MAX_FILES = 300;
const ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000;

async function listSessionFiles(root: string) {
  const agentsDir = path.join(root, "agents");
  const agentNames = await fs.readdir(agentsDir).catch(() => [] as string[]);
  const files: { file: string; agent: string; mtimeMs: number }[] = [];

  for (const agent of agentNames) {
    const sessionsDir = path.join(agentsDir, agent, "sessions");
    const entries = await fs.readdir(sessionsDir).catch(() => [] as string[]);
    for (const entry of entries) {
      if (!entry.endsWith(".jsonl")) continue;
      const file = path.join(sessionsDir, entry);
      const stat = await fs.stat(file).catch(() => null);
      if (!stat?.isFile()) continue;
      files.push({ file, agent, mtimeMs: stat.mtimeMs });
    }
  }

  return files.sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, MAX_FILES);
}

function levelFromScore(score: number) {
  if (score >= 80) return "critical";
  if (score >= 55) return "warning";
  return "healthy";
}

function adviceFor(score: number, runs: number, tokens: number, cacheRead: number) {
  const advice: string[] = [];
  if (tokens >= 2_000_000) advice.push("Split this thread or start a fresh session before the next large task.");
  if (runs >= 80) advice.push("Summarize the thread state and carry forward only the active execution context.");
  if (cacheRead >= 500_000) advice.push("Context reuse is very high, trim historical chatter to reduce drag.");
  if (score < 55) advice.push("Pressure is manageable, keep watching if the session stays active.");
  return advice;
}

async function parseSession(file: string, agent: string) {
  const raw = await fs.readFile(file, "utf8").catch(() => null);
  if (!raw) return null;

  const lines = raw.split("\n").filter(Boolean);
  let sessionId = path.basename(file, ".jsonl");
  let firstAt = "";
  let lastAt = "";
  let model = "unknown";
  let provider = "unknown";
  let totalTokens = 0;
  let totalCost = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheRead = 0;
  let runs = 0;
  let messages = 0;
  let firstUserText = "";

  for (const line of lines) {
    try {
      const row = JSON.parse(line) as UsageLine;
      if (row.type === "session") {
        sessionId = row.id ?? sessionId;
        firstAt = row.timestamp ?? firstAt;
        lastAt = row.timestamp ?? lastAt;
      }
      if (row.type === "message") {
        if (!firstAt) firstAt = row.timestamp ?? firstAt;
        lastAt = row.timestamp ?? lastAt;
        messages += 1;
        if (!firstUserText && row.message?.role === "user") {
          firstUserText = row.message?.content?.find((part) => part.type === "text")?.text ?? "";
        }
        const usage = row.message?.usage;
        if (usage) {
          runs += 1;
          provider = row.message?.provider ?? provider;
          model = row.message?.model ?? model;
          totalTokens += usage.totalTokens ?? 0;
          totalCost += usage.cost?.total ?? 0;
          inputTokens += usage.input ?? 0;
          outputTokens += usage.output ?? 0;
          cacheRead += usage.cacheRead ?? 0;
        }
      }
    } catch {
      continue;
    }
  }

  if (!lastAt) return null;

  const ageMs = Date.now() - new Date(lastAt).getTime();
  const isActive = ageMs <= ACTIVE_WINDOW_MS;
  if (!isActive) return null;

  const tokenScore = Math.min(40, totalTokens / 75_000);
  const runScore = Math.min(25, runs * 0.45);
  const cacheScore = Math.min(20, cacheRead / 50_000);
  const ageScore = Math.max(0, 15 - ageMs / (60 * 60 * 1000));
  const score = Math.round(tokenScore + runScore + cacheScore + ageScore);

  const reasons = [
    totalTokens >= 500_000 ? `${Math.round(totalTokens / 1000)}k total tokens` : null,
    runs >= 25 ? `${runs} usage-bearing turns` : null,
    cacheRead >= 250_000 ? `${Math.round(cacheRead / 1000)}k cache-read tokens` : null,
    ageMs <= 2 * 60 * 60 * 1000 ? `active in the last ${Math.max(1, Math.round(ageMs / (60 * 60 * 1000)))}h` : null
  ].filter(Boolean);

  return {
    sessionId,
    agent,
    provider,
    model,
    firstAt,
    lastAt,
    messages,
    runs,
    totalTokens,
    totalCost,
    inputTokens,
    outputTokens,
    cacheRead,
    score,
    level: levelFromScore(score),
    reasons,
    advice: adviceFor(score, runs, totalTokens, cacheRead),
    sourceHint: firstUserText.startsWith("[cron:") ? "cron" : "direct"
  };
}

export async function GET() {
  const root = path.join(os.homedir(), ".openclaw");
  const files = await listSessionFiles(root);
  const sessions = (await Promise.all(files.map(({ file, agent }) => parseSession(file, agent)))).filter(Boolean) as any[];

  const sorted = sessions.sort((a, b) => b.score - a.score || b.totalTokens - a.totalTokens);
  const counts = {
    critical: sorted.filter((s) => s.level === "critical").length,
    warning: sorted.filter((s) => s.level === "warning").length,
    healthy: sorted.filter((s) => s.level === "healthy").length
  };

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    counts,
    sessions: sorted.slice(0, 20)
  });
}
