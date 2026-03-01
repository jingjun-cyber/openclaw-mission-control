import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const expected = process.env.OFFICE_WEBHOOK_SECRET;

  if (!expected) {
    return NextResponse.json({ error: "OFFICE_WEBHOOK_SECRET is not configured" }, { status: 500 });
  }

  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    deskCode: string;
    presence: "idle" | "working" | "away" | "error";
    note?: string;
  };

  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json({ error: "Missing Convex URL env" }, { status: 500 });
  }

  const client = new ConvexHttpClient(convexUrl);
  await client.mutation(api.office.setPresenceByCode, body);
  return NextResponse.json({ ok: true });
}
