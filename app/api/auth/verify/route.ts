import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const localToken = process.env.MISSION_CONTROL_LOCAL_TOKEN;
  const requireToken = localToken && localToken.length >= 16;

  const authHeader = req.headers.get("authorization") || "";
  const providedToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const valid = requireToken ? providedToken === localToken : true;

  return NextResponse.json({
    requireToken: !!requireToken,
    authenticated: valid,
    hint: requireToken ? "Local token is required for protected operations." : "Token authentication is not enforced.",
    checkedAt: new Date().toISOString()
  });
}
