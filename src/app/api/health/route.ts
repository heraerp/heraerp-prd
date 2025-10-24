import { NextResponse } from "next/server";

// Keep it fast and dependency-free.
export async function GET() {
  try {
    return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" }});
  } catch (error) {
    console.error('[HEALTH] Error:', error)
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// Optional: support HEAD since some probes do that too.
export async function HEAD() {
  try {
    return new Response(null, { status: 200, headers: { "Cache-Control": "no-store" }});
  } catch (error) {
    console.error('[HEALTH HEAD] Error:', error)
    return new Response(null, { status: 500 });
  }
}

// Optional: force Node runtime (avoid Edge surprises)
export const runtime = "nodejs";