import { NextResponse } from "next/server";

// Keep it fast and dependency-free.
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" }});
}

// Optional: support HEAD since some probes do that too.
export async function HEAD() {
  return new Response(null, { status: 200, headers: { "Cache-Control": "no-store" }});
}

// Optional: force Node runtime (avoid Edge surprises)
export const runtime = "nodejs";