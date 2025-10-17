// src/app/api/v2/bearer-test/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/verifyAuth";

export async function GET(req: NextRequest) {
  try {
    const { userId, email } = await verifyAuth(req);
    return NextResponse.json({ ok: true, userId, email });
  } catch (e: any) {
    const msg = String(e?.message ?? "Authentication failed");
    const status = msg.startsWith("MISSING_") || msg.startsWith("INVALID_") ? 401 :
                   msg.startsWith("AUTH_FAILED") ? 401 : 500;
    return NextResponse.json(
      { error: "Authentication failed", message: msg, timestamp: new Date().toISOString() },
      { status }
    );
  }
}