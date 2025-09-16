import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ================================================================================
// HERA MIDDLEWARE - MULTI-TENANT & DEMO ROUTING
// Smart Code: HERA.MIDDLEWARE.ROUTING.v2
// Handles public pages, demo pages with seed data, and customer subdomains
// ================================================================================

// Public pages that don't require authentication
const PUBLIC_PAGES = [
  '/',
  '/pricing',
  '/features',
  '/about',
  '/contact',
  '/blog',
  '/docs',
  '/privacy',
  '/terms',
]

// Demo routes with seed data (publicly accessible)
const DEMO_ROUTES = [
  'salon',
  'salon-data',
  'restaurant',
  'healthcare',
  'furniture',
  'retail',
]

// Reserved subdomains
const RESERVED_SUBDOMAINS = [
  'www',
  'app',
  'api',
  'admin',
  'dashboard',
  'auth',
  'demo',
  'staging',
  'blog',
  'docs',
  'support',
]

// Auth required pages (when on customer subdomain)
const AUTH_REQUIRED_PATHS = [
  '/dashboard',
  '/appointments',
  '/pos',
  '/customers',
  '/settings',
  '/reports',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || 'localhost:3000'
  
  // Skip API routes
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  // Parse subdomain
  const subdomain = getSubdomain(hostname)
  
  // Create response headers
  const requestHeaders = new Headers(request.headers)
  if (subdomain) {
    requestHeaders.set('x-hera-subdomain', subdomain)
  }

  // CASE 1: Main domain (no subdomain or www)
  if (!subdomain || subdomain === 'www') {
    // Check if it's a public page
    if (PUBLIC_PAGES.some(page => pathname === page || pathname.startsWith(page + '/'))) {
      return NextResponse.next({ headers: requestHeaders })
    }

    // Check if it's a demo route
    const firstSegment = pathname.split('/')[1]
    if (DEMO_ROUTES.includes(firstSegment)) {
      // Demo pages are publicly accessible with seed data
      requestHeaders.set('x-hera-demo-mode', 'true')
      requestHeaders.set('x-hera-demo-type', firstSegment)
      return NextResponse.next({ headers: requestHeaders })
    }

    // All other pages on main domain redirect to login
    if (pathname !== '/login' && pathname !== '/signup') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // CASE 2: App subdomain (central auth hub)
  if (subdomain === 'app') {
    const url = request.nextUrl.clone()
    url.pathname = `/auth${pathname}`
    return NextResponse.rewrite(url, { headers: requestHeaders })
  }

  // CASE 3: Demo subdomain (demo.heraerp.com)
  if (subdomain === 'demo') {
    requestHeaders.set('x-hera-demo-mode', 'true')
    const url = request.nextUrl.clone()
    url.pathname = `/demo${pathname}`
    return NextResponse.rewrite(url, { headers: requestHeaders })
  }

  // CASE 4: Customer subdomain (customer.heraerp.com)
  if (subdomain && !RESERVED_SUBDOMAINS.includes(subdomain)) {
    // This is a customer organization
    requestHeaders.set('x-hera-organization', subdomain)
    
    // Check if user is trying to access an auth-required page
    if (AUTH_REQUIRED_PATHS.some(path => pathname.startsWith(path))) {
      // These will be handled by auth guard in the app
      requestHeaders.set('x-hera-auth-required', 'true')
    }

    // Rewrite to organization-specific routes
    const url = request.nextUrl.clone()
    url.pathname = `/org${pathname}`
    return NextResponse.rewrite(url, { headers: requestHeaders })
  }

  return NextResponse.next({ headers: requestHeaders })
}

// Helper to extract subdomain
function getSubdomain(hostname: string): string | null {
  // Handle localhost with port
  if (hostname.includes('localhost')) {
    return null
  }

  // Remove port if present
  const host = hostname.split(':')[0]
  
  // Split by dots
  const parts = host.split('.')
  
  // Need at least subdomain.domain.tld
  if (parts.length >= 3) {
    return parts[0]
  }
  
  return null
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}