import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { authenticateBearer } from '@/lib/auth/bearer-middleware';

/**
 * Debug endpoint to check session and authentication status
 * GET /api/v2/debug/session
 * 
 * Support both Bearer tokens (Track B) and SSR cookies (Track A)
 */
export async function GET(req: NextRequest) {
  // Add CORS headers for cookieless auth
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://heraerp.com',
    'Access-Control-Allow-Headers': 'content-type, authorization, x-organization-id, x-orgid',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'false',
    'Vary': 'Origin'
  };

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const c = await cookies();
    const h = await headers();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Check Bearer token authentication first (Track B)
    let bearerAuth = null;
    try {
      bearerAuth = await authenticateBearer(req);
    } catch (bearerError) {
      // Bearer auth failed, will try cookie auth below
    }

    // Basic endpoint info
    const basicInfo = {
      endpoint: '/api/v2/debug/session',
      status: 'working',
      timestamp: new Date().toISOString(),
      hasUrl: !!url,
      hasKey: !!key,
      cookieCount: c.getAll().length,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isProduction: process.env.NODE_ENV === 'production',
        isVercel: !!process.env.VERCEL,
        isRailway: !!process.env.RAILWAY_ENVIRONMENT
      },
      headers: {
        userAgent: h.get('user-agent')?.slice(0, 50) || 'none',
        xOrgId: h.get('x-organization-id') || 'none',
        host: h.get('host') || 'none',
        origin: h.get('origin') || 'none',
        referer: h.get('referer') || 'none'
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

      // Combine Bearer and Cookie auth results
      const authResult = {
        bearer: bearerAuth ? {
          authenticated: true,
          user_id: bearerAuth.actor_user_id,
          email: bearerAuth.email,
          org_id: bearerAuth.org_id
        } : null,
        cookie: {
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
      };

      const response = NextResponse.json({
        ...basicInfo,
        cookies: cookieInfo,
        authentication: authResult,
        // Legacy format for backward compatibility
        session: authResult.cookie
      });

      // Add CORS headers
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
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