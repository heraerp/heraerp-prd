import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const method = req.method

  // Always allow Railway/infra healthcheck and static assets
  // Health endpoints: return 200 directly to be robust even if route wasn't compiled
  if (pathname === '/api/health' || pathname === '/api/healthz') {
    if (method === 'HEAD') return new NextResponse(null, { status: 200 })
    return new NextResponse('ok', { status: 200, headers: { 'content-type': 'text/plain' } })
  }

  // Always let static/public assets through
  if (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next()
  }

  // Preserve existing API v2 enforcement (only for API routes)
  const isApi = pathname.startsWith('/api/')
  const isV2 = pathname.startsWith('/api/v2/')

  // Allow Next.js internal API routes
  if (pathname.startsWith('/api/_next/')) {
    return NextResponse.next()
  }

  // Block all non-v2 API routes (except the allowed ones above)
  if (isApi && !isV2) {
    console.warn(`[API v2 Enforcement] Blocked legacy API call: ${pathname}`)
    return new NextResponse(
      JSON.stringify({
        error: 'Use API v2. Prefix routes with /api/v2.',
        details: {
          attempted_path: pathname,
          required_prefix: '/api/v2/',
          documentation: '/docs/api-v2-migration'
        }
      }),
      {
        status: 426,
        headers: {
          'content-type': 'application/json',
          'x-hera-api-version-required': 'v2'
        }
      }
    )
  }

  // Existing logic (auth redirects, tenant resolution, etc.) could go here
  return NextResponse.next()
}

// Belt-and-suspenders: ensure matcher excludes allowed paths above
export const config = {
  // Run on everything except static/public assets so health paths get handled here
  matcher: ['/((?!_next/|favicon.ico|robots.txt|sitemap.xml).*)']
}
