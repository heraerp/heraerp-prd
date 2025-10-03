/**
 * Auth verification for API routes
 * Supports both demo sessions and real JWT tokens
 */

import { NextRequest } from 'next/server'
import { jwtService, type JWTPayload } from './jwt-service'

export interface AuthUser {
  id: string
  email?: string
  organizationId?: string
  roles?: string[]
  permissions?: string[]
}

/**
 * Verify authentication from request headers
 */
export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Get auth token from headers
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)

    // Handle demo tokens
    if (token === 'demo-token-salon-receptionist') {
      return {
        id: '00000000-0000-0000-0000-000000000001', // Demo salon receptionist UUID
        email: 'demo@herasalon.com',
        organizationId: '0fd09e31-d257-4329-97eb-7d7f522ed6f0', // Hair Talkz Salon
        roles: ['receptionist'],
        permissions: ['read:services', 'write:services']
      }
    }

    if (token === 'demo-token-jewelry-admin') {
      return {
        id: '00000000-0000-0000-0000-000000000002', // Demo jewelry admin UUID
        email: 'admin@luxejewelry.com',
        organizationId: '80e6659c-3dfb-4fc8-b13a-70423ac4a9ce', // Luxe Jewelry Boutique
        roles: ['admin'],
        permissions: ['*']
      }
    }

    // Verify real JWT token
    const validation = await jwtService.validateToken(token)

    if (!validation.valid || !validation.payload) {
      console.warn('[verifyAuth] Token validation failed:', validation.error)
      return null
    }

    const payload = validation.payload

    console.log('[verifyAuth] Token validated successfully:', {
      userId: payload.sub,
      email: payload.email,
      organizationId: payload.organization_id,
      hasOrganizationId: !!payload.organization_id,
      role: payload.role
    })

    return {
      id: payload.sub,
      email: payload.email,
      organizationId: payload.organization_id,
      roles: payload.role ? [payload.role] : [],
      permissions: payload.permissions || []
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

/**
 * Require authentication for an API route
 */
export function requireAuth(handler: (req: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (req: NextRequest) => {
    const user = await verifyAuth(req)

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    return handler(req, user)
  }
}
