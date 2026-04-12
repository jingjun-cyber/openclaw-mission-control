import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

type UsageLine = {
  timestamp?: string;
  message?: {
    api?: string;
    provider?: string;
    model?: string;
    usage?: {
      input?: number;
      output?: number;
      cacheRead?: number;
      cacheWrite?: number;
      totalTokens?: number;
      cost?: {
        input?: number;
        output?: number;
        cacheRead?: number;
        cacheWrite?: number;
        total?: number;
      };
    };
    content?: Array<{ type?: string; text?: string }>;
    role?: string;
  };
};

type SessionAggregate = {
  sessionId: string;
  agent: string;
  source: string;
  model: string;
  provider: string;
  startedAt: string;
  lastAt: string;
  runs: number;
  totalTokens: number;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_FILES = 400;

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

function ymd(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

function emptyDay(day: string) {
  return { day, cost: 0, tokens: 0, sessions: 0 };
}

function classifySource(firstUserText: string | null) {
  if (!firstUserText) return "direct";
  if (firstUserText.startsWith("[cron:")) return "cron";
  if (firstUserText.includes("heartbeat")) return "heartbeat";
  return "direct";
}

async function parseSession(file: string, agent: string): Promise<SessionAggregate | null> {
  const raw = await fs.readFile(file, "utf8").catch(() => null);
  if (!raw) return null;

  const lines = raw.split("\n").filter(Boolean);
  let firstUserText: string | null = null;
  let sessionId = path.basename(file, ".jsonl");
  let startedAt = "";
  let lastAt = "";
  let provider = "unknown";
  let model = "unknown";
  let totalTokens = 0;
  let totalCost = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheReadTokens = 0;
  let runs = 0;

  for (const line of lines) {
    try {
      const row = JSON.parse(line) as UsageLine & { type?: string; id?: string; timestamp?: string; modelId?: string; provider?: string };
      if (row.type === "session") {
        sessionId = row.id ?? sessionId;
        startedAt = row.timestamp ?? startedAt;
        lastAt = row.timestamp ?? lastAt;
      }
      if (row.type === "model_change") {
        provider = row.provider ?? provider;
        model = row.modelId ?? model;
      }
      if (row.type === "message") {
        lastAt = row.timestamp ?? lastAt;
        const role = row.message?.role;
        if (!firstUserText && role === "user") {
          firstUserText = row.message?.content?.find((part) => part.type === "text")?.text ?? null;
        }
        const usage = row.message?.usage;
        if (usage) {
          runs += 1;
          provider = row.message?.provider ?? provider;
          model = row.message?.model ?? model;
          totalTokens += usage.totalTokens ?? 0;
          inputTokens += usage.input ?? 0;
          outputTokens += usage.output ?? 0;
          cacheReadTokens += usage.cacheRead ?? 0;
          totalCost += usage.cost?.total ?? 0;
        }
      }
    } catch {
      continue;
    }
  }

  if (!startedAt || !lastAt || (totalTokens === 0 && totalCost === 0 && runs === 0)) return null;

  return {
    sessionId,
    agent,
    source: classifySource(firstUserText),
    model,
    provider,
    startedAt,
    lastAt,
    runs,
    totalTokens,
    totalCost,
    inputTokens,
    outputTokens,
    cacheReadTokens
  };
}

export async function GET() {
  const root = path.join(os.homedir(), ".openclaw");
  const files = await listSessionFiles(root);
  const sessions = (await Promise.all(files.map(({ file, agent }) => parseSession(file, agent)))).filter(Boolean) as SessionAggregate[];

  const now = Date.now();
  const last7 = Array.from({ length: 7 }, (_, i) => ymd(now - (6 - i) * DAY_MS));
  const last30 = Array.from({ length: 30 }, (_, i) => ymd(now - (29 - i) * DAY_MS));
  const trend7 = Object.fromEntries(last7.map((day) => [day, emptyDay(day)])) as Record<string, ReturnType<typeof emptyDay>>;
  const trend30 = Object.fromEntries(last30.map((day) => [day, emptyDay(day)])) as Record<string, ReturnType<typeof emptyDay>>;

  const byAgent = new Map<string, { key: string; cost: number; tokens: number; sessions: number }>();
  const bySource = new Map<string, { key: string; cost: number; tokens: number; sessions: number }>();
  const byModel = new Map<string, { key: string; provider: string; cost: number; tokens: number; sessions: number }>();

  let todayCost = 0;
  let todayTokens = 0;
  let cost7 = 0;
  let tokens7 = 0;
  let cost30 = 0;
  let tokens30 = 0;

  for (const session of sessions) {
    const day = session.lastAt.slice(0, 10);
    const age = now - new Date(session.lastAt).getTime();

    if (trend7[day]) {
      trend7[day].cost += session.totalCost;
      trend7[day].tokens += session.totalTokens;
      trend7[day].sessions += 1;
    }
    if (trend30[day]) {
      trend30[day].cost += session.totalCost;
      trend30[day].tokens += session.totalTokens;
      trend30[day].sessions += 1;
    }

    if (age <= DAY_MS) {
      todayCost += session.totalCost;
      todayTokens += session.totalTokens;
    }
    if (age <= 7 * DAY_MS) {
      cost7 += session.totalCost;
      tokens7 += session.totalTokens;
    }
    if (age <= 30 * DAY_MS) {
      cost30 += session.totalCost;
      tokens30 += session.totalTokens;
    }

    const agentRow = byAgent.get(session.agent) ?? { key: session.agent, cost: 0, tokens: 0, sessions: 0 };
    agentRow.cost += session.totalCost;
    agentRow.tokens += session.totalTokens;
    agentRow.sessions += 1;
    byAgent.set(session.agent, agentRow);

    const sourceRow = bySource.get(session.source) ?? { key: session.source, cost: 0, tokens: 0, sessions: 0 };
    sourceRow.cost += session.totalCost;
    sourceRow.tokens += session.totalTokens;
    sourceRow.sessions += 1;
    bySource.set(session.source, sourceRow);

    const modelKey = `${session.provider}/${session.model}`;
    const modelRow = byModel.get(modelKey) ?? { key: session.model, provider: session.provider, cost: 0, tokens: 0, sessions: 0 };
    modelRow.cost += session.totalCost;
    modelRow.tokens += session.totalTokens;
    modelRow.sessions += 1;
    byModel.set(modelKey, modelRow);
  }

  const outliers = sessions
    .slice()
    .sort((a, b) => b.totalCost - a.totalCost || b.totalTokens - a.totalTokens)
    .slice(0, 8)
    .map((session) => ({
      ...session,
      ageHours: Math.max(1, Math.round((now - new Date(session.lastAt).getTime()) / (60 * 60 * 1000)))
    }));

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    summary: {
      sessionsScanned: sessions.length,
      todayCost,
      todayTokens,
      cost7,
      tokens7,
      cost30,
      tokens30
    },
    trend7: Object.values(trend7),
    trend30: Object.values(trend30),
    byAgent: Array.from(byAgent.values()).sort((a, b) => b.cost - a.cost || b.tokens - a.tokens),
    bySource: Array.from(bySource.values()).sort((a, b) => b.cost - a.cost || b.tokens - a.tokens),
    byModel: Array.from(byModel.values()).sort((a, b) => b.cost - a.cost || b.tokens - a.tokens),
    outliers
  });
}
