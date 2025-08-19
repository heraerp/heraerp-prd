import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { heraMetrics } from '@/lib/monitoring/prometheus-metrics'
import { geoAnalytics } from '@/lib/monitoring/geo-analytics'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const startTime = Date.now()

  // Track visitor analytics for all requests (before auth checks)
  trackVisitorAnalytics(request, pathname)

  // Skip auth for public routes
  if (shouldSkipAuth(pathname)) {
    const response = NextResponse.next()
    trackResponseMetrics(request, pathname, 200, startTime)
    return response
  }

  // For API routes, check for valid Supabase session
  if (pathname.startsWith('/api/v1/')) {
    // Most API routes require authentication
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return res
  }

  // For protected routes (dashboard, salon, etc), check Supabase session
  const protectedRoutes = ['/dashboard', '/salon', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (isProtectedRoute) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
      
      return res
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
}

function shouldSkipAuth(pathname: string): boolean {
  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/login-supabase', 
    '/register-supabase',
    '/auth/login',
    '/auth/register',
    '/auth/callback',
    '/salon-auth',           // Combined login/register page
    '/test-auth-tokens',
    '/dashboard-simple',    // For testing
    '/dashboard-progressive' // Public progressive apps showcase
  ]
  
  // Static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/health') ||
    pathname.includes('.')
  ) {
    return true
  }
  
  // Progressive apps (public demos)
  if (pathname.endsWith('-progressive')) {
    return true
  }
  
  return publicRoutes.some(route => pathname === route || pathname.startsWith(route))
}

/**
 * Track visitor analytics for all requests
 */
function trackVisitorAnalytics(request: NextRequest, pathname: string) {
  try {
    const businessType = detectBusinessType(pathname)
    
    // Enhanced geographic tracking
    geoAnalytics.trackUserLocation(request, pathname, businessType)
    
    // Original page view tracking
    heraMetrics.trackPageView(request, pathname)
    
    // Track subdomain activity
    const host = request.headers.get('host') || ''
    const subdomain = host.split('.')[0]
    
    if (subdomain && subdomain !== 'heraerp' && subdomain !== 'www') {
      // This is a business subdomain
      heraMetrics.trackSubdomainActivity(subdomain, 'page_view', businessType)
    }
    
    // Track progressive app usage with geo data
    if (pathname.endsWith('-progressive')) {
      const progressiveBusinessType = pathname.split('/')[1]?.replace('-progressive', '') || 'unknown'
      heraMetrics.trackProgressiveBehavior('page_view', progressiveBusinessType, 0)
      
      // Track geographic trial engagement
      geoAnalytics.trackGeoConversion(request, 'trial_started', progressiveBusinessType, true)
    }
    
  } catch (error) {
    // Silent fail for analytics - don't break the request
    console.error('Analytics tracking error:', error)
  }
}

/**
 * Track response metrics
 */
function trackResponseMetrics(request: NextRequest, pathname: string, statusCode: number, startTime: number) {
  try {
    const duration = Date.now() - startTime
    const method = request.method
    
    heraMetrics.trackAPICall(pathname, method, statusCode, duration)
    
  } catch (error) {
    console.error('Response metrics error:', error)
  }
}

/**
 * Detect business type from pathname
 */
function detectBusinessType(pathname: string): string {
  if (pathname.includes('salon')) return 'salon'
  if (pathname.includes('restaurant')) return 'restaurant'
  if (pathname.includes('clinic') || pathname.includes('healthcare')) return 'healthcare'
  if (pathname.includes('retail') || pathname.includes('store')) return 'retail'
  if (pathname.includes('manufacturing')) return 'manufacturing'
  if (pathname.includes('jewelry')) return 'jewelry'
  if (pathname.includes('airline')) return 'airline'
  if (pathname.includes('crm')) return 'crm'
  if (pathname.includes('financial')) return 'financial'
  return 'general'
}

export const config = {
  matcher: [
    // Monitor all routes for analytics
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}