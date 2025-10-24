/**
 * JWT Fast-Path Resolver
 * Skips service calls when JWT already has organization context
 */

import { supabase } from '@/lib/supabase'
import { bearerFetch } from '@/lib/api'

interface JWTPayload {
  sub?: string
  email?: string
  organizationId?: string
  organization_id?: string
  roles?: string[]
  userId?: string
  user_id?: string
}

interface UserResolution {
  userEntityId: string
  organizationId: string
  roles: string[]
  source: 'jwt' | 'service'
}

/**
 * Parse JWT payload safely
 */
function parseJwt(token: string): JWTPayload | null {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    return decoded
  } catch (error) {
    console.warn('Failed to parse JWT:', error)
    return null
  }
}

/**
 * Fast user entity resolution - checks JWT first, calls service only if needed
 */
export async function resolveUserEntity(): Promise<UserResolution> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  
  if (!token) {
    throw new Error('No access token available')
  }
  
  const jwt = parseJwt(token)
  const organizationId = jwt?.organizationId || jwt?.organization_id
  
  // Fast path: JWT already has org context
  if (organizationId && jwt?.sub) {
    console.log('✅ JWT fast-path - org context already available:', {
      userId: jwt.sub,
      organizationId,
      roles: jwt.roles,
      source: 'jwt'
    })
    
    return {
      userEntityId: jwt.sub,
      organizationId,
      roles: jwt.roles ?? ['USER'],
      source: 'jwt'
    }
  }

  // Slow path: call service with bearer token
  console.log('🔧 JWT missing org context, calling resolve-membership service...')
  
  const res = await bearerFetch('/api/v2/auth/resolve-membership')
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`resolve-membership failed: ${res.status} ${text}`)
  }
  
  const body = await res.json()
  
  if (!body.success) {
    throw new Error('resolve-membership returned unsuccessful response')
  }
  
  console.log('✅ Service resolution successful:', {
    userEntityId: body.user_entity_id,
    organizationId: body.membership.organization_id,
    roles: body.membership.roles,
    source: 'service'
  })
  
  return {
    userEntityId: body.user_entity_id,
    organizationId: body.membership.organization_id,
    roles: body.membership.roles ?? ['USER'],
    source: 'service'
  }
}

/**
 * Legacy compatibility - adapts to existing resolver interface
 */
export async function createSecurityContextFromAuth(authUserId: string) {
  try {
    const result = await resolveUserEntity()
    
    return {
      success: true,
      securityContext: {
        userId: authUserId,
        orgId: result.organizationId,
        role: result.roles[0]?.toLowerCase() || 'user',
        authMode: 'supabase' as const
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: {
        type: 'database_error' as const,
        message: error.message,
        authUserId
      }
    }
  }
}