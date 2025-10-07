import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const HEALTH_PREFIXES = ['/api/health', '/api/healthz', '/api/v2/healthz']

export function middleware(req: NextRequest) {
  const url = req.nextUrl
  const pathname = url.pathname
  const method = req.method

  // Bypass health checks entirely (GET/HEAD/OPTIONS), allow any trailing segment/query
  if (
    (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') &&
    HEALTH_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
  ) {
    return NextResponse.next()
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

  // Allow Next.js internal API routes
  if (pathname.startsWith('/api/_next/')) {
    return NextResponse.next()
  }

  // API v2 enforcement
  const isApi = pathname.startsWith('/api/')
  const isV2 = pathname.startsWith('/api/v2/')

  // Block all non-v2 API routes (except the allowlisted ones above)
  if (isApi && !isV2) {
    // Keep middleware light: no async, small payload
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

  // (Auth/org resolution etc. can continue here)
  return NextResponse.next()
}

// Exclude health paths and static/public assets from the middleware matcher itself
export const config = {
  matcher: [
    // everything except health endpoints + static/public
    '/((?!api/health(?:/.*)?$|api/healthz(?:/.*)?$|api/v2/healthz(?:/.*)?$|_next/|favicon\\.ico$|robots\\.txt$|sitemap\\.xml$).*)',
  ],
}

