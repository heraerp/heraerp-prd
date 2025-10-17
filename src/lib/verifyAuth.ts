// src/lib/verifyAuth.ts
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Extract "Bearer <token>"
function getBearer(req: NextRequest): string {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!h) throw new Error("MISSING_AUTH_HEADER");
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  if (!m) throw new Error("INVALID_AUTH_HEADER");
  return m[1];
}

/**
 * Server-side auth verifier for API routes.
 * - Validates the Bearer token with Supabase Admin
 * - Returns user id + email (and the original access token, if you need to forward it)
 */
export async function verifyAuth(req: NextRequest): Promise<{
  userId: string;
  email: string | null;
  accessToken: string;
}> {
  const accessToken = getBearer(req);

  // Important: use SERVICE ROLE ONLY on the server
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data?.user?.id) {
    const reason = error?.message || "UNAUTHORIZED";
    throw new Error(`AUTH_FAILED:${reason}`);
  }

  return { userId: data.user.id, email: data.user.email ?? null, accessToken };
}