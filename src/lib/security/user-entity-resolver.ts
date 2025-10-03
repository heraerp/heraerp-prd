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
    // 1. Find user entity using auth_user_id in metadata
    const { data: userEntities, error: entityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'user')
      .contains('metadata', { auth_user_id: authUserId })

    if (entityError) {
      return {
        success: false,
        error: {
          type: 'database_error',
          message: `Failed to query user entities: ${entityError.message}`,
          authUserId
        }
      }
    }

    if (!userEntities || userEntities.length === 0) {
      // For salon demo - create a virtual user entity for immediate working
      console.warn(
        `No HERA user entity found for auth user ID: ${authUserId}, creating virtual entity`
      )

      // Get default organization ID for salon demo
      const defaultOrgId =
        process.env.DEFAULT_ORGANIZATION_ID || 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944'

      return {
        success: true,
        data: {
          userId: authUserId,
          organizationId: defaultOrgId,
          entityId: `virtual-${authUserId}`,
          salonRole: 'owner', // Default to owner for salon demo
          permissions: ['salon:read:all', 'salon:write:all', 'salon:admin:full'],
          userEntity: {
            id: `virtual-${authUserId}`,
            organization_id: defaultOrgId,
            entity_type: 'user',
            entity_name: 'Demo User',
            metadata: { auth_user_id: authUserId, virtual: true }
          },
          dynamicData: {
            salon_role: { value: 'owner', type: 'text', smart_code: 'HERA.SALON.USER.ROLE.v1' },
            permissions: {
              value: ['salon:read:all', 'salon:write:all', 'salon:admin:full'],
              type: 'json',
              smart_code: 'HERA.SALON.USER.PERMISSIONS.v1'
            }
          }
        }
      }
    }

    if (userEntities.length > 1) {
      // In future, this could support multi-organization users
      // For now, take the first one (salon demo has one org per user)
      console.warn(`Multiple user entities found for auth ID ${authUserId}, using first one`)
    }

    const userEntity = userEntities[0]

    // 2. Get all dynamic data for this user entity
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, field_value_json, field_type, smart_code')
      .eq('entity_id', userEntity.id)
      .eq('organization_id', userEntity.organization_id)

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

    // 3. Build dynamic data map
    const dynamicDataMap: Record<string, any> = {}
    dynamicData?.forEach(field => {
      const value = field.field_type === 'json' ? field.field_value_json : field.field_value_text
      dynamicDataMap[field.field_name] = {
        value,
        type: field.field_type,
        smart_code: field.smart_code
      }
    })

    // 4. Extract business information from dynamic data
    const salonRole = dynamicDataMap.salon_role?.value || 'user'
    const permissions = dynamicDataMap.permissions?.value || []

    return {
      success: true,
      data: {
        userId: authUserId,
        organizationId: userEntity.organization_id,
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
