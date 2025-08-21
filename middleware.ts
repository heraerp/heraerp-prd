import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Reserved subdomains that should not be treated as organizations
const RESERVED_SUBDOMAINS = [
  'www',
  'app',
  'api',
  'admin',
  'dashboard',
  'auth',
  'login',
  'signup',
  'demo',
  'test',
  'staging',
  'production',
  'blog',
  'docs',
  'support',
  'help'
]

export function middleware(request: NextRequest) {
  // Get hostname (e.g., acme.heraerp.com, app.heraerp.com, localhost:3000)
  const hostname = request.headers.get('host') || 'localhost:3000'
  
  // For local development, we'll use subdomain simulation via paths
  const isLocalhost = hostname.includes('localhost')
  
  if (isLocalhost) {
    // Local development: simulate subdomains via paths
    // e.g., localhost:3000/~app/login → app subdomain
    // e.g., localhost:3000/~acme/dashboard → acme subdomain
    
    const pathname = request.nextUrl.pathname
    
    // Check for subdomain simulation pattern
    if (pathname.startsWith('/~')) {
      const pathParts = pathname.split('/')
      const subdomain = pathParts[1].substring(1) // Remove the ~
      const actualPath = '/' + pathParts.slice(2).join('/')
      
      // Set subdomain header
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-hera-subdomain', subdomain)
      
      // Route based on subdomain
      if (subdomain === 'app') {
        // Central auth hub routes
        const url = request.nextUrl.clone()
        url.pathname = `/auth${actualPath}`
        return NextResponse.rewrite(url, {
          headers: requestHeaders
        })
      } else if (!RESERVED_SUBDOMAINS.includes(subdomain)) {
        // Organization routes
        const url = request.nextUrl.clone()
        url.pathname = `/org${actualPath}`
        return NextResponse.rewrite(url, {
          headers: requestHeaders
        })
      }
    }
    
    // Regular localhost routes (no subdomain simulation)
    return NextResponse.next()
  }
  
  // Production: real subdomain handling
  const currentHost = hostname
    .replace(':3000', '')
    .replace('.heraerp.com', '')
    .replace('.localhost', '')
  
  // Extract subdomain
  const subdomain = currentHost.split('.')[0]
  
  // If no subdomain or www, continue to main site
  if (!subdomain || subdomain === hostname || subdomain === 'www') {
    return NextResponse.next()
  }
  
  // Set subdomain header for downstream use
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-hera-subdomain', subdomain)
  
  // Handle app subdomain (central auth)
  if (subdomain === 'app') {
    const url = request.nextUrl.clone()
    url.pathname = `/auth${request.nextUrl.pathname}`
    return NextResponse.rewrite(url, {
      headers: requestHeaders
    })
  }
  
  // Handle demo subdomain (progressive apps)
  if (subdomain === 'demo') {
    const url = request.nextUrl.clone()
    url.pathname = `/dashboard-progressive${request.nextUrl.pathname}`
    return NextResponse.rewrite(url, {
      headers: requestHeaders
    })
  }
  
  // Handle organization subdomains
  if (!RESERVED_SUBDOMAINS.includes(subdomain)) {
    const url = request.nextUrl.clone()
    url.pathname = `/org${request.nextUrl.pathname}`
    return NextResponse.rewrite(url, {
      headers: requestHeaders
    })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}