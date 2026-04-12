import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { NextResponse } from "next/server";

type ConnectorState = "OK" | "WARN" | "ERROR";

function resolveOpenclawBin() {
  const configured = process.env.OPENCLAW_BIN;
  if (configured && existsSync(configured)) return configured;
  const candidates = ["/opt/homebrew/bin/openclaw", "/usr/local/bin/openclaw", "/usr/bin/openclaw"];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return "openclaw";
}

function normalizeState(state: string): ConnectorState {
  const value = state.trim().toUpperCase();
  if (["OK", "HEALTHY", "UP"].includes(value)) return "OK";
  if (["WARN", "WARNING", "DEGRADED"].includes(value)) return "WARN";
  return "ERROR";
}

function summarizeDetail(name: string, state: ConnectorState, detail: string) {
  if (name === "Telegram" && state === "WARN") return "Telegram is configured, but the current setup has a security or delivery warning.";
  if (name === "Feishu" && state === "OK") return "Feishu is configured and currently looks healthy.";
  if (name.toLowerCase().includes("weixin") && state === "OK") return "WeChat connector is loaded and available.";
  if (name === "Gateway" && state === "OK") return "Gateway RPC probe is healthy and the local service is reachable.";
  if (name === "Convex" && state === "OK") return "Convex environment is configured for Mission Control.";
  if (state === "ERROR") return `${name} needs attention.`;
  if (state === "WARN") return `${name} is available, but there is a warning to review.`;
  return detail;
}

function parseChannels(output: string) {
  const lines = output.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === "Channels");
  if (start === -1) return [];

  const items: Array<{ name: string; enabled: string; state: string; detail: string }> = [];
  for (const line of lines.slice(start + 3)) {
    if (!line.startsWith("│")) continue;
    const cols = line.split("│").map((s) => s.trim()).filter(Boolean);
    if (cols.length < 4) continue;
    if (cols[0] === "Channel") continue;
    items.push({
      name: cols[0],
      enabled: cols[1],
      state: cols[2],
      detail: cols.slice(3).join(" | ")
    });
  }
  return items;
}

export async function GET() {
  try {
    const openclawBin = resolveOpenclawBin();
    const gateway = execSync(`${openclawBin} gateway status`, { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
    const status = execSync(`${openclawBin} status`, { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });

    const channels = parseChannels(status);
    const gatewayOk = /RPC probe:\s+ok/i.test(gateway);
    const gatewayPid = gateway.match(/pid\s+(\d+)/i)?.[1] ?? "unknown";
    const convexConfigured = Boolean(process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL);

    const checkedAt = Date.now();

    const items = [
      {
        key: "gateway",
        name: "Gateway",
        state: normalizeState(gatewayOk ? "OK" : "WARN"),
        detail: `RPC ${gatewayOk ? "reachable" : "not reachable"}, pid ${gatewayPid}`
      },
      {
        key: "convex",
        name: "Convex",
        state: normalizeState(convexConfigured ? "OK" : "WARN"),
        detail: convexConfigured ? "Convex URL configured" : "Convex URL missing"
      },
      ...channels.map((c) => ({
        key: c.name.toLowerCase(),
        name: c.name,
        state: normalizeState(c.state),
        detail: c.detail
      }))
    ].map((item) => ({
      ...item,
      summary: summarizeDetail(item.name, item.state, item.detail),
      checkedAt
    }));

    const counts = {
      ok: items.filter((item) => item.state === "OK").length,
      warn: items.filter((item) => item.state === "WARN").length,
      error: items.filter((item) => item.state === "ERROR").length
    };

    const overall = counts.error > 0 ? "critical" : counts.warn > 0 ? "warning" : "healthy";

    return NextResponse.json({ overall, counts, checkedAt, items });
  } catch (error) {
    return NextResponse.json({
      overall: "critical",
      items: [],
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
