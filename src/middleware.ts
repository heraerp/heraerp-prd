// HERA API v2 Enforcement Middleware
// Blocks all non-v2 API routes to ensure universal architecture compliance

import { NextResponse, NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isApi = pathname.startsWith('/api/')
  const isV2 = pathname.startsWith('/api/v2/')

  // Allow Next.js internal routes
  if (pathname.startsWith('/api/_next/')) {
    return NextResponse.next()
  }

  // Block all non-v2 API routes
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
        status: 426, // Upgrade Required
        headers: {
          'content-type': 'application/json',
          'x-hera-api-version-required': 'v2'
        }
      }
    )
  }

  return NextResponse.next()
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    '/api/:path*',
    // Exclude Next.js internals
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
}
