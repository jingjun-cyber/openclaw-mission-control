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
    const output = execSync(`${openclawBin} security audit`, { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });

    const summaryLine = output.split(/\r?\n/).find((line) => line.startsWith("Summary:")) ?? "Summary: 0 critical · 0 warn · 0 info";
    const critical = Number(summaryLine.match(/(\d+) critical/i)?.[1] ?? 0);
    const warn = Number(summaryLine.match(/(\d+) warn/i)?.[1] ?? 0);
    const info = Number(summaryLine.match(/(\d+) info/i)?.[1] ?? 0);

    const findings = output
      .split(/\r?\n/)
      .filter((line) => /^(CRITICAL|WARN|INFO)\s/.test(line))
      .slice(0, 6)
      .map((line) => {
        const [, level, title] = line.match(/^(CRITICAL|WARN|INFO)\s+(.*)$/) ?? [];
        return { level: level?.toLowerCase() ?? "info", title: title ?? line };
      });

    const level = critical > 0 ? "critical" : warn > 0 ? "warning" : "healthy";
    const impact = critical > 0
      ? "High-risk configuration issues are present and should be addressed before treating the system as secure."
      : warn > 0
        ? "No critical issues detected, but current settings still expose meaningful operational risk."
        : "No major configuration risk surfaced in the current audit snapshot.";

    const guidance = [
      "Tighten Telegram groupPolicy from open to allowlist where possible.",
      "Reduce runtime and filesystem exposure in shared contexts.",
      "Turn on stricter sandboxing for agents that do not need full host access."
    ];

    return NextResponse.json({
      checkedAt: Date.now(),
      level,
      counts: { critical, warn, info },
      impact,
      findings,
      guidance
    });
  } catch (error) {
    return NextResponse.json({
      checkedAt: Date.now(),
      level: "critical",
      counts: { critical: 0, warn: 0, info: 0 },
      impact: "Security audit could not be completed.",
      findings: [],
      guidance: [error instanceof Error ? error.message : String(error)]
    }, { status: 500 });
  }
}
