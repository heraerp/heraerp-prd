import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// Note: Database operations and Node.js modules cannot run in Edge Runtime
// Using simplified tenant resolver for Edge Runtime compatibility

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

// Demo app routes that use demo user authentication
const DEMO_ROUTES = [
  'salon',
  'salon-data',
  'icecream',
  'restaurant',
  'healthcare',
  'furniture'
]

export async function middleware(request: NextRequest) {
  // Database operations cannot run in Edge Runtime
  // Tenant resolution should be handled in individual API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }
  
  // Get hostname (e.g., acme.heraerp.com, app.heraerp.com, localhost:3000)
  const hostname = request.headers.get('host') || 'localhost:3000'
  
  // For local development, we'll use subdomain simulation via paths
  const isLocalhost = hostname.includes('localhost')
  
  if (isLocalhost) {
    // Local development: simulate subdomains via paths
    // e.g., localhost:3000/~app/login → app subdomain
    // e.g., localhost:3000/~acme/dashboard → acme subdomain
    
    const pathname = request.nextUrl.pathname
    
    // Check if this is a demo route (e.g., /salon, /icecream)
    const firstSegment = pathname.split('/')[1]
    if (DEMO_ROUTES.includes(firstSegment)) {
      // Demo routes use demo user authentication
      // No rewriting needed - let them pass through
      return NextResponse.next()
    }
    
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
    .replace('.lvh.me', '') // Add support for lvh.me domains
  
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
  
  // Handle demo subdomain (redirect to apps)
  if (subdomain === 'demo') {
    const url = request.nextUrl.clone()
    url.pathname = `/apps${request.nextUrl.pathname}`
    return NextResponse.rewrite(url, {
      headers: requestHeaders
    })
  }
  
  // Handle demo-specific subdomains (e.g., demo-salon.heraerp.com)
  if (subdomain.startsWith('demo-')) {
    const demoType = subdomain.replace('demo-', '')
    if (DEMO_ROUTES.includes(demoType)) {
      const url = request.nextUrl.clone()
      url.pathname = `/${demoType}${request.nextUrl.pathname}`
      return NextResponse.rewrite(url, {
        headers: requestHeaders
      })
    }
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