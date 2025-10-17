import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';

/**
 * Debug endpoint to check session and authentication status
 * GET /api/v2/debug/session
 * 
 * Production-safe version that works with Supabase SSR cookies
 */
export async function GET() {
  try {
    const c = await cookies();
    const h = await headers();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Basic endpoint info
    const basicInfo = {
      endpoint: '/api/v2/debug/session',
      status: 'working',
      timestamp: new Date().toISOString(),
      hasUrl: !!url,
      hasKey: !!key,
      cookieCount: c.getAll().length,
      headers: {
        userAgent: h.get('user-agent')?.slice(0, 50) || 'none',
        xOrgId: h.get('x-organization-id') || 'none',
        host: h.get('host') || 'none'
      }
    };

    // List all cookies for debugging (non-sensitive)
    const cookieInfo = c.getAll().map(cookie => ({
      name: cookie.name,
      hasValue: !!cookie.value,
      valueLength: cookie.value?.length || 0
    }));

    // Try Supabase SSR client with proper cookie handling
    try {
      const { createServerClient } = await import('@supabase/ssr');
      
      const supabase = createServerClient(url, key, {
        cookies: {
          get: (name: string) => c.get(name)?.value,
          set: (name: string, value: string, options: any) => {
            // Production-safe cookie settings
            c.set({
              name,
              value,
              ...options,
              secure: true,
              sameSite: 'none',
              domain: process.env.NODE_ENV === 'production' ? '.heraerp.com' : undefined
            });
          },
          remove: (name: string, options: any) => {
            c.set({
              name,
              value: '',
              ...options,
              maxAge: 0
            });
          }
        }
      });

      const { data: { session }, error } = await supabase.auth.getSession();

      return NextResponse.json({
        ...basicInfo,
        cookies: cookieInfo,
        session: {
          ok: !error && !!session,
          session_present: !!session,
          user: session?.user ? {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
            aud: session.user.aud
          } : null,
          error: error?.message || null,
          expires_at: session?.expires_at || null
        }
      });
    } catch (supabaseError: any) {
      return NextResponse.json({
        ...basicInfo,
        cookies: cookieInfo,
        session: {
          ok: false,
          session_present: false,
          error: 'Failed to create Supabase SSR client',
          details: supabaseError.message
        }
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug session endpoint failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}