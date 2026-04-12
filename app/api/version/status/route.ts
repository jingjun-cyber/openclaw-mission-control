import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { NextResponse } from "next/server";

function resolveOpenclawBin() {
  const configured = process.env.OPENCLAW_BIN;
  if (configured && existsSync(configured)) return configured;
  const candidates = ["/opt/homebrew/bin/openclaw", "/usr/local/bin/openclaw", "/usr/bin/openclaw"];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return "openclaw";
}

export async function GET() {
  try {
    const openclawBin = resolveOpenclawBin();
    const output = execSync(`${openclawBin} status`, { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
    const lines = output.split(/\r?\n/);
    const osLine = lines.find((line) => line.includes("│ OS ")) ?? "";
    const updateLine = lines.find((line) => line.includes("│ Update ")) ?? "";
    const channelLine = lines.find((line) => line.includes("│ Channel ")) ?? "";

    const os = osLine.split("│")[2]?.trim() ?? "unknown";
    const update = updateLine.split("│")[2]?.trim() ?? "unknown";
    const channel = channelLine.split("│")[2]?.trim() ?? "unknown";

    const level = /up to date/i.test(update) ? "healthy" : "warning";

    return NextResponse.json({
      checkedAt: Date.now(),
      level,
      os,
      channel,
      update,
      guidance: /up to date/i.test(update)
        ? "Runtime is on the current known release line."
        : "Review current install version and update channel alignment."
    });
  } catch (error) {
    return NextResponse.json({
      checkedAt: Date.now(),
      level: "warning",
      os: "unknown",
      channel: "unknown",
      update: "unavailable",
      guidance: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
