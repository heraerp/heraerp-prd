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
  userId: string
  organizationId: string
  entityId: string
  salonRole: string
  permissions: string[]
  userEntity: any
  dynamicData: Record<string, any>
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
export async function resolveUserEntity(authUserId: string): Promise<{
  success: boolean
  data?: UserEntityInfo
  error?: UserResolutionError
}> {
  try {
    // 1. Find USER entity (id = auth user id, in platform org)
    const { data: userEntity, error: entityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', authUserId)
      .or('entity_type.eq.USER,entity_type.eq.user')
      .maybeSingle()

    if (entityError) {
      return {
        success: false,
        error: {
          type: 'database_error',
          message: `Failed to query user entity: ${entityError.message}`,
          authUserId
        }
      }
    }

    if (!userEntity) {
      console.warn(`No USER entity found for: ${authUserId}`)
      return {
        success: false,
        error: {
          type: 'not_found',
          message: 'User entity not found',
          authUserId
        }
      }
    }

    // 2. Find organization via USER_MEMBER_OF_ORG relationship
    const { data: relationship, error: relError } = await supabase
      .from('core_relationships')
      .select('to_entity_id, organization_id')
      .eq('from_entity_id', authUserId)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .maybeSingle()

    if (relError || !relationship) {
      console.warn(`No USER_MEMBER_OF_ORG relationship for: ${authUserId}`)
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

    // 3. Get all dynamic data for this user entity in the tenant org
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, field_value_json, field_type, smart_code')
      .eq('entity_id', userEntity.id)
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

    return {
      success: true,
      data: {
        userId: authUserId,
        organizationId,
        entityId: userEntity.id,
        salonRole,
        permissions: Array.isArray(permissions) ? permissions : [],
        userEntity,
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
export async function createSecurityContextFromAuth(authUserId: string): Promise<{
  success: boolean
  securityContext?: SecurityContext
  error?: UserResolutionError
}> {
  const resolution = await resolveUserEntity(authUserId)

  if (!resolution.success || !resolution.data) {
    return {
      success: false,
      error: resolution.error
    }
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
