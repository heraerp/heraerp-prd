import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip auth for public routes
  if (shouldSkipAuth(pathname)) {
    return NextResponse.next()
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

  // For dashboard routes, check Supabase session
  if (pathname.startsWith('/dashboard')) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return NextResponse.redirect(new URL('/login-supabase', request.url))
      }
      
      return res
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.redirect(new URL('/login-supabase', request.url))
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
    '/auth/callback',
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

export const config = {
  matcher: [
    '/api/v1/:path*',
    '/dashboard/:path*'
  ]
}