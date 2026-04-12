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
    // Single update (backward compatible)
    deskCode?: string;
    presence?: "idle" | "working" | "away" | "error";
    note?: string;
    source?: string;
    // Bulk update
    updates?: Array<{
      deskCode: string;
      presence: "idle" | "working" | "away" | "error";
      note?: string;
      source?: string;
    }>;
  };

  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json({ error: "Missing Convex URL env" }, { status: 500 });
  }

  const client = new ConvexHttpClient(convexUrl);

  // Bulk mode
  if (body.updates && Array.isArray(body.updates)) {
    const result = await client.mutation(api.presence.bulkSetPresence, {
      updates: body.updates.map((u) => ({
        deskCode: u.deskCode,
        presence: u.presence,
        note: u.note,
        source: u.source ?? "webhook"
      }))
    });
    return NextResponse.json({ ok: true, mode: "bulk", ...result });
  }

  // Single mode (backward compatible)
  if (body.deskCode && body.presence) {
    await client.mutation(api.office.setPresenceByCode, {
      deskCode: body.deskCode,
      presence: body.presence,
      note: body.note
    });
    return NextResponse.json({ ok: true, mode: "single" });
  }

  return NextResponse.json({ error: "Missing deskCode/presence or updates array" }, { status: 400 });
}
