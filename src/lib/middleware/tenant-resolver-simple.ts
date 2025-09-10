/**
 * 🏢 HERA Tenant Resolver Middleware (Edge Runtime Compatible)
 * 
 * Simple subdomain-based tenant resolution for Edge Runtime
 * Actual database lookups should happen in API routes
 */

import { NextRequest, NextResponse } from 'next/server'

export interface TenantContext {
  organizationId: string
  organizationCode: string
  organizationName: string
  subdomain: string
  modules: ModuleEntitlement[]
  settings: Record<string, any>
}

export interface ModuleEntitlement {
  moduleId: string
  moduleName: string
  smartCode: string
  version: string
  enabled: boolean
  expiresAt?: string
  configuration?: Record<string, any>
}

/**
 * Middleware to pass subdomain to API routes
 * Actual tenant resolution happens in API routes where database access is available
 */
export async function tenantResolverMiddleware(request: NextRequest) {
  const subdomain = request.headers.get('x-hera-subdomain')
  
  if (!subdomain) {
    return NextResponse.next()
  }
  
  // For API routes, add subdomain to headers for downstream processing
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-hera-subdomain', subdomain)
  
  // Return response with subdomain header
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  })
}

/**
 * Extract subdomain from hostname
 */
export function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split('.')
  
  // Handle localhost with port
  if (hostname.includes('localhost')) {
    return null
  }
  
  // Handle production domains (subdomain.heraerp.com)
  if (parts.length >= 3) {
    return parts[0]
  }
  
  return null
}