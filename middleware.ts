import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ================================================================================
// HERA MIDDLEWARE - MULTI-TENANT & DEMO ROUTING
// Smart Code: HERA.MIDDLEWARE.ROUTING.v2
// Handles public pages, demo pages with seed data, and customer subdomains
// ================================================================================

// Demo organization ID from environment - use salon demo org for consistency
const DEMO_ORG_ID = process.env['NEXT_PUBLIC_DEMO_ORG_ID'] || '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

// Public pages that don't require authentication
const PUBLIC_PAGES = [
  '/',
  '/demo',  // Demo gallery page
  '/pricing',
  '/features',
  '/about',
  '/contact',
  '/blog',
  '/docs',
  '/privacy',
  '/terms',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/landing',
]

// Demo routes with seed data (publicly accessible) - EXCLUDING salon-data
const DEMO_ROUTES = [
  'salon',
  'restaurant',
  'healthcare',
  'furniture',
  'retail',
]

// Salon app routes that should use demo mode
const SALON_DEMO_ROUTES = [
  '/salon',
  '/dashboard',
  '/appointments', 
  '/pos',
  '/customers',
  '/settings',
  '/reports',
  '/whatsapp',
  '/inventory',
  '/finance',
  '/admin',
  '/accountant',
  '/customer',
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
  
  // Create response headers with org mode
  const requestHeaders = new Headers(request.headers)
  
  // Skip API routes and static files (do not process middleware for these)
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }
  
  // Ensure /demo page is accessible without redirect
  if (pathname === '/demo') {
    console.log('🎯 Middleware: Allowing direct access to /demo page')
    return NextResponse.next({ headers: requestHeaders })
  }

  // Handle localhost development with path-based routing (e.g., localhost:3000/~hairtalkz/salon)
  if (hostname.includes('localhost')) {
    if (pathname.startsWith('/~hairtalkz')) {
      // Set hairtalkz organization context
      requestHeaders.set('x-hera-organization', 'hairtalkz')
      requestHeaders.set('x-hera-org-id', '378f24fb-d496-4ff7-8afa-ea34895a0eb8')
      requestHeaders.set('x-hera-org-mode', 'tenant')
      
      // Rewrite URL to remove the ~hairtalkz prefix
      const url = request.nextUrl.clone()
      url.pathname = pathname.replace('/~hairtalkz', '')
      return NextResponse.rewrite(url, { headers: requestHeaders })
    }
  }

  // Parse subdomain
  const subdomain = getSubdomain(hostname)
  
  // Set organization mode based on subdomain
  if (!subdomain || subdomain === 'www' || subdomain === 'demo' || subdomain === 'app') {
    // Demo mode
    requestHeaders.set('x-hera-org-mode', 'demo')
    requestHeaders.set('x-hera-org-id', DEMO_ORG_ID)
  } else if (!RESERVED_SUBDOMAINS.includes(subdomain)) {
    // Tenant mode
    requestHeaders.set('x-hera-org-mode', 'tenant')
    requestHeaders.set('x-hera-tenant-slug', subdomain)
  }
  
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
    const secondSegment = pathname.split('/')[2]
    
    if (firstSegment === 'demo' && secondSegment && DEMO_ROUTES.includes(secondSegment)) {
      // Handle /demo/salon, /demo/restaurant, etc. - let route handler take over
      requestHeaders.set('x-hera-demo-mode', 'true')
      requestHeaders.set('x-hera-demo-type', secondSegment)
      return NextResponse.next({ headers: requestHeaders })
    }
    
    if (firstSegment && DEMO_ROUTES.includes(firstSegment)) {
      // Demo pages are publicly accessible with seed data
      requestHeaders.set('x-hera-demo-mode', 'true')
      requestHeaders.set('x-hera-demo-type', firstSegment)
      return NextResponse.next({ headers: requestHeaders })
    }
    
    // Check if it's a salon demo route (for direct /dashboard, /appointments access)
    if (SALON_DEMO_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
      // These are salon app routes in demo mode
      requestHeaders.set('x-hera-demo-mode', 'true')
      requestHeaders.set('x-hera-demo-type', 'salon')
      requestHeaders.set('x-hera-org-id', DEMO_ORG_ID)
      return NextResponse.next({ headers: requestHeaders })
    }

    // All other pages on main domain redirect to login
    if (!pathname.startsWith('/auth/') && pathname !== '/') {
      return NextResponse.redirect(new URL('/auth/login', request.url))
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
    
    // Special handling for hairtalkz subdomain
    if (subdomain === 'hairtalkz') {
      requestHeaders.set('x-hera-org-id', '378f24fb-d496-4ff7-8afa-ea34895a0eb8')
      requestHeaders.set('x-hera-org-mode', 'tenant')
      
      // If accessing root path on hairtalkz subdomain, redirect to /salon
      if (pathname === '/' || pathname === '') {
        const url = request.nextUrl.clone()
        url.pathname = '/salon'
        return NextResponse.redirect(url)
      }
      
      // For hairtalkz, route /salon to the salon app
      if (pathname === '/salon' || pathname.startsWith('/salon/')) {
        const url = request.nextUrl.clone()
        url.pathname = pathname
        return NextResponse.rewrite(url, { headers: requestHeaders })
      }
    }
    
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
  // Remove port if present
  const host = hostname.split(':')[0]
  
  // Handle subdomain.localhost pattern
  if (host && host.includes('.localhost')) {
    const parts = host.split('.')
    if (parts.length >= 2 && parts[0]) {
      return parts[0] // Return subdomain from subdomain.localhost
    }
  }
  
  // Split by dots for production domains
  const parts = host ? host.split('.') : []
  
  // Need at least subdomain.domain.tld
  if (parts.length >= 3 && parts[0]) {
    return parts[0]
  }
  
  return null
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api routes (API endpoints)
     * - /_next (Next.js internals)
     * - Static files (images, fonts, etc.)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
}