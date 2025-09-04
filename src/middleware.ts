import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Simple middleware that just passes through
  // This allows the build to complete without Edge Runtime issues
  
  const pathname = request.nextUrl.pathname
  const host = request.headers.get('host') || ''
  const subdomain = host.split('.')[0]
  
  // Create response with basic headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)
  requestHeaders.set('x-host', host)
  requestHeaders.set('x-subdomain', subdomain)
  
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - sw.js and sw-v2.js (service workers)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|sw\\.js|sw-v2\\.js).*)',
  ],
}