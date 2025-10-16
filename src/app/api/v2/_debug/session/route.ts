import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET() {
  const c = cookies();
  const h = headers();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(url, key, {
    cookies: { get: (k) => c.get(k)?.value }
  });

  const { data: { session }, error } = await supabase.auth.getSession();

  return NextResponse.json({
    ok: !error && !!session,
    hasSession: !!session,
    authUserId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    xOrgId: h.get('x-organization-id') ?? null,
    cookieKeys: c.getAll().map(k => k.name).sort(),
    projectUrlPrefix: url?.slice(0, 40),
    anonKeyPrefix: key?.slice(0, 12),
    error: error?.message ?? null,
    timestamp: new Date().toISOString()
  });
}