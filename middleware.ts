import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtDecode } from 'jwt-decode'

interface JWTPayload {
  sub: string
  email: string
  organization_id?: string
  user_metadata?: {
    organization_id?: string
  }
  [key: string]: any
}

export async function middleware(request: NextRequest) {
  // Skip API routes and Next.js internal routes
  if (request.nextUrl.pathname.startsWith('/api') || 
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  // Extract organization context and inject headers
  try {
    const organizationId = await resolveOrganizationContext(request)
    
    if (organizationId) {
      // Set organization context in response headers for client-side access
      response.headers.set('X-Organization-Context', organizationId)
      
      // Add organization ID to request headers for API calls
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('X-Organization-Id', organizationId)
      
      // Create new request with organization headers
      const newRequest = new Request(request.url, {
        method: request.method,
        headers: requestHeaders,
        body: request.body
      })
      
      // Pass the enhanced request to the next handler
      return NextResponse.next({
        request: {
          headers: requestHeaders
        }
      })
    }
  } catch (error) {
    console.warn('Organization context resolution failed:', error)
    // Continue without organization context
  }

  return response
}

// Resolve organization context from multiple sources
async function resolveOrganizationContext(request: NextRequest): Promise<string | null> {
  // Priority 1: X-Organization-Id header (explicit)
  const explicitOrgId = request.headers.get('X-Organization-Id')
  if (explicitOrgId) {
    return explicitOrgId
  }

  // Priority 2: URL parameters (for org-specific routes)
  const urlOrgId = request.nextUrl.searchParams.get('org')
  if (urlOrgId) {
    return urlOrgId
  }

  // Priority 3: JWT token claims
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7)
      const payload = jwtDecode<JWTPayload>(token)
      
      // Check direct organization_id claim
      if (payload.organization_id) {
        return payload.organization_id
      }
      
      // Check user_metadata.organization_id
      if (payload.user_metadata?.organization_id) {
        return payload.user_metadata.organization_id
      }
      
      // TODO: Fall back to membership resolution via RPC
      // This would require calling resolve_user_identity_v1 RPC
      // For now, we'll let the client handle membership resolution
      
    } catch (error) {
      console.warn('JWT decode failed:', error)
    }
  }

  // Priority 4: Session cookies (for browser-based sessions)
  const sessionCookie = request.cookies.get('sb-access-token')?.value ||
                       request.cookies.get('supabase-auth-token')?.value
  
  if (sessionCookie) {
    try {
      const payload = jwtDecode<JWTPayload>(sessionCookie)
      
      if (payload.organization_id) {
        return payload.organization_id
      }
      
      if (payload.user_metadata?.organization_id) {
        return payload.user_metadata.organization_id
      }
    } catch (error) {
      console.warn('Session cookie decode failed:', error)
    }
  }

  return null
}

// Enhanced matcher to include organization-aware routes
export const config = {
  matcher: [
    // Include all routes except API and Next.js internals
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    // Specifically include retail customers route
    '/retail/customers/:path*',
    // Include other multi-tenant routes
    '/crm/:path*',
    '/enterprise/:path*'
  ],
}