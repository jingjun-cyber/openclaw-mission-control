import { NextResponse } from "next/server";

export async function GET() {
  const readOnly = process.env.MISSION_CONTROL_READ_ONLY === "1" || process.env.MISSION_CONTROL_READ_ONLY === "true";
  const mutationGuard = process.env.MISSION_CONTROL_MUTATION_GUARD !== "0";
  const localToken = process.env.MISSION_CONTROL_LOCAL_TOKEN;
  const requireToken = localToken && localToken.length >= 16;

  return NextResponse.json({
    readOnly,
    mutationGuard,
    requireToken: !!requireToken,
    checkedAt: new Date().toISOString(),
    message: readOnly
      ? "Mission Control is in read-only mode. Mutations are blocked in the UI."
      : mutationGuard
        ? "Mutation guard is enabled. Risky write actions should stay gated."
        : "Writes are enabled."
  });
}
