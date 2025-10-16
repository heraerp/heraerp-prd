/**
 * HERA DNA SECURITY: User Entity Resolution Helper
 * Core DNA Component: HERA.DNA.SECURITY.USER.RESOLVER.v1
 *
 * Resolves user organization and role information from HERA entities
 * following proper field placement policy (dynamic data for business logic).
 */

import { supabase } from '@/lib/supabase'
import type { SecurityContext } from './database-context'

export interface UserEntityInfo {
  userId: string           // Supabase UID (for session management)
  userEntityId: string     // ✅ HERA USER entity ID (canonical)
  entityId: string         // Legacy compatibility (alias for userEntityId)
  organizationId: string   // Tenant organization row ID
  orgEntityId: string      // ✅ HERA ORG entity ID (canonical)
  salonRole: string
  permissions: string[]
  userEntity: any
  dynamicData: Record<string, any>
}

// HERA v2.2 canonical service response type
interface ServiceResponse {
  success: boolean
  user_entity_id: string    // USER entity uuid in tenant
  membership: {
    organization_id: string // tenant org uuid (row id)
    org_entity_id: string   // ORG entity uuid in tenant
    relationship_id: string // for audit trace
    relationship_type: 'MEMBER_OF'
    roles: string[]
    is_active: boolean
  }
}

export interface UserResolutionError {
  type: 'not_found' | 'multiple_found' | 'invalid_data' | 'database_error'
  message: string
  authUserId?: string
}

/**
 * Resolve user's organization and business data from HERA entities
 * Uses proper HERA architecture: auth ID → core_entities → core_dynamic_data
 */
// Prevent infinite loops during resolution
const resolverAttempts = new Map<string, number>()

export async function resolveUserEntity(authUserId: string): Promise<{
  success: boolean
  data?: UserEntityInfo
  error?: UserResolutionError
}> {
  // Check for too many attempts to prevent infinite loops
  const attempts = resolverAttempts.get(authUserId) || 0
  if (attempts >= 3) {
    console.warn(`🚨 Too many resolution attempts for ${authUserId}, using fallback`)
    resolverAttempts.delete(authUserId)
    return {
      success: false,
      error: {
        type: 'not_found',
        message: 'Too many resolution attempts, user may need to re-authenticate',
        authUserId
      }
    }
  }
  
  resolverAttempts.set(authUserId, attempts + 1)

  try {
    console.log(`🔍 Resolving user entity for: ${authUserId} (attempt #${attempts})`)
    
    // 1) Find organization via MEMBER_OF relationship (tenant-scoped and RLS-friendly)
    const { data: relationship, error: relError } = await supabase
      .from('core_relationships')
      .select('to_entity_id, organization_id')
      .eq('from_entity_id', authUserId)
      .eq('relationship_type', 'MEMBER_OF')
      .maybeSingle()
      
    console.log(`🔍 Direct relationship query result:`, { relationship, relError })

    if (relError || !relationship) {
      console.warn(`No MEMBER_OF relationship for: ${authUserId}`)
      
      // ENHANCED FIX: Use service role proxy to resolve membership
      console.log('🔧 Attempting membership resolution via service endpoint...')
      
      try {
        // Skip aggressive cache clearing to prevent loops
        console.log('🔧 Using service endpoint for membership resolution (attempt #' + attempts + ')')
        
        // Get current session to use for authenticated request
        const { data: { session } } = await supabase.auth.getSession()
        console.log('🔍 Current session user:', session?.user?.id, session?.user?.email)
        
        if (session?.access_token) {
          const response = await fetch('/api/v2/auth/resolve-membership', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'x-force-refresh': 'true'
            }
          })
          
          if (response.ok) {
            const serviceData: ServiceResponse = await response.json()
            console.log('✅ Service endpoint resolved membership successfully')
            console.log('🔍 Canonical service response:', JSON.stringify(serviceData, null, 2))
            
            if (!serviceData.success) {
              throw new Error('Service returned unsuccessful response')
            }

            // ✅ Use canonical HERA v2.2 entity IDs
            const userEntityId = serviceData.user_entity_id
            const orgEntityId = serviceData.membership.org_entity_id
            const organizationId = serviceData.membership.organization_id
            const roles = serviceData.membership.roles
            const salonRole = roles[0]?.toLowerCase() || 'user'
            const permissions = roles.includes('OWNER') ? ['*'] : roles

            console.log(`✅ Canonical IDs resolved:`, {
              userEntityId,
              orgEntityId,
              organizationId,
              roles,
              salonRole,
              permissions
            })

            // Get dynamic data using USER entity ID in tenant org
            const { data: dynamicFields } = await supabase
              .from('core_dynamic_data')
              .select('field_name, field_value_text, field_value_number, field_value_boolean, field_value_date')
              .eq('entity_id', userEntityId)
              .eq('organization_id', organizationId)

            const dynamicData: Record<string, any> = {}
            dynamicFields?.forEach(field => {
              const value = field.field_value_text || field.field_value_number || field.field_value_boolean || field.field_value_date
              if (value !== null) {
                dynamicData[field.field_name] = value
              }
            })

            // Success! Clear attempts counter
            resolverAttempts.delete(authUserId)
            
            return {
              success: true,
              data: {
                userId: authUserId,        // Supabase UID (for session)
                userEntityId,              // ✅ HERA USER entity ID (canonical)
                entityId: userEntityId,    // Legacy compatibility
                organizationId,            // Tenant organization row ID
                orgEntityId,               // ✅ HERA ORG entity ID (canonical)
                salonRole,
                permissions,
                userEntity: { id: userEntityId }, // minimal entity object
                dynamicData
              }
            }
          }
        }
      } catch (serviceError) {
        console.warn('Service endpoint fallback failed:', serviceError)
      }
      
      return {
        success: false,
        error: {
          type: 'not_found',
          message: 'User organization membership not found',
          authUserId
        }
      }
    }

    const organizationId = relationship.organization_id

    // 2) Get all dynamic data for this user entity in the tenant org
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, field_value_json, field_type, smart_code')
      .eq('entity_id', authUserId)
      .eq('organization_id', organizationId)

    if (dynamicError) {
      return {
        success: false,
        error: {
          type: 'database_error',
          message: `Failed to query dynamic data: ${dynamicError.message}`,
          authUserId
        }
      }
    }

    // 4. Build dynamic data map
    const dynamicDataMap: Record<string, any> = {}
    dynamicData?.forEach(field => {
      const value = field.field_type === 'json' ? field.field_value_json : field.field_value_text
      dynamicDataMap[field.field_name] = {
        value,
        type: field.field_type,
        smart_code: field.smart_code
      }
    })

    // 5. Extract business information from dynamic data
    const salonRole = dynamicDataMap.salon_role?.value || 'user'
    const permissions = dynamicDataMap.permissions?.value || []

    // Success! Clear attempts counter
    resolverAttempts.delete(authUserId)
    
    return {
      success: true,
      data: {
        userId: authUserId,        // Supabase UID (for session)
        userEntityId: authUserId,  // Legacy: assume USER entity ID = Supabase UID
        entityId: authUserId,      // Legacy compatibility
        organizationId,            // Tenant organization row ID
        orgEntityId: organizationId, // Legacy: assume ORG entity ID = organization row ID
        salonRole,
        permissions: Array.isArray(permissions) ? permissions : [],
        userEntity: undefined,
        dynamicData: dynamicDataMap
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: {
        type: 'database_error',
        message: `Unexpected error resolving user entity: ${error.message}`,
        authUserId
      }
    }
  }
}

/**
 * Create security context from user entity resolution
 * Compatible with HERA DNA SECURITY framework
 */
export async function createSecurityContextFromAuth(
  authUserId: string,
  options?: { accessToken?: string; retries?: number }
): Promise<{
  success: boolean
  securityContext?: SecurityContext
  error?: UserResolutionError
}> {
  const retries = Math.max(0, options?.retries ?? 0)

  const attachAndRetry = async (remaining: number) => {
    if (remaining <= 0) return resolveUserEntity(authUserId)

    // If we have an access token, nudge the server to ensure membership
    if (options?.accessToken) {
      try {
        await fetch('/api/v2/auth/attach', {
          method: 'POST',
          headers: { Authorization: `Bearer ${options.accessToken}` },
          credentials: 'include'
        })
      } catch {
        // ignore
      }
    }

    // brief backoff
    await new Promise(r => setTimeout(r, 300))
    return resolveUserEntity(authUserId)
  }

  let resolution = await resolveUserEntity(authUserId)

  // Retry flow only for membership-not-found
  if ((!resolution.success || !resolution.data) && resolution.error?.type === 'not_found') {
    resolution = await attachAndRetry(retries)
  }

  if (!resolution.success || !resolution.data) {
    return { success: false, error: resolution.error }
  }

  const { data } = resolution

  const securityContext: SecurityContext = {
    userId: data.userId,
    orgId: data.organizationId,
    role: data.salonRole,
    authMode: 'supabase'
  }

  return {
    success: true,
    securityContext
  }
}

/**
 * Get user's salon role and permissions from dynamic data
 * Fallback-safe for demo environments
 */
export async function getUserSalonRole(authUserId: string): Promise<{
  role: string
  permissions: string[]
}> {
  const resolution = await resolveUserEntity(authUserId)

  if (resolution.success && resolution.data) {
    return {
      role: resolution.data.salonRole,
      permissions: resolution.data.permissions
    }
  }

  // Fallback for demo - extract from email pattern
  console.warn(`Could not resolve user entity for ${authUserId}, using email fallback`)

  // This is a fallback for demo purposes only
  return {
    role: 'user',
    permissions: ['salon:read:basic']
  }
}
