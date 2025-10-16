import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';

export async function GET() {
  try {
    const c = cookies();
    const h = headers();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Basic info without Supabase client first
    const basicInfo = {
      endpoint: 'working',
      timestamp: new Date().toISOString(),
      hasUrl: !!url,
      hasKey: !!key,
      cookieCount: c.getAll().length,
      headers: {
        userAgent: h.get('user-agent')?.slice(0, 50) || 'none',
        xOrgId: h.get('x-organization-id') || 'none'
      }
    };

    // Try Supabase client
    try {
      const { createServerClient } = await import('@supabase/ssr');
      const supabase = createServerClient(url, key, {
        cookies: { get: (k) => c.get(k)?.value }
      });

      const { data: { session }, error } = await supabase.auth.getSession();

      return NextResponse.json({
        ...basicInfo,
        supabase: {
          ok: !error && !!session,
          hasSession: !!session,
          authUserId: session?.user?.id ?? null,
          email: session?.user?.email ?? null,
          error: error?.message ?? null
        }
      });
    } catch (supabaseError: any) {
      return NextResponse.json({
        ...basicInfo,
        supabase: {
          error: 'Failed to create Supabase client',
          details: supabaseError.message
        }
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}