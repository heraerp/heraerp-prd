/**
 * HERA Organization Resolver Service
 * Smart Code: HERA.AUTH.ORG_RESOLVER.PRODUCTION.v1
 * 
 * Centralized organization management using HERA RPC functions:
 * - hera_auth_introspect_v1: Get user organizations with roles
 * - hera_organization_crud_v1: Get detailed organization information
 */

import { getSupabaseService } from '@/lib/supabase-service'

export interface HERAUserContext {
  user_entity_id: string
  user_name: string
  primary_role: string
  organization_count: number
  default_organization_id: string
  is_platform_admin: boolean
  organizations: HERAOrganizationMembership[]
}

export interface HERAOrganizationMembership {
  id: string
  code: string
  name: string
  status: string
  joined_at: string
  primary_role: string
  roles: string[]
  is_owner: boolean
  is_admin: boolean
  entity_id: string
  industry_type?: string
  org_type?: string
}

export interface HERAOrganizationDetails {
  id: string
  entity_id: string
  name: string
  code: string
  org_type: string
  industry_type: string
  status: string
  metadata?: any
  settings?: any
}

/**
 * Handle HERA RPC calls with error handling
 */
async function handleRPCCall<T>(rpcName: string, params: any): Promise<T> {
  try {
    const supabaseService = getSupabaseService()
    const { data, error } = await supabaseService.rpc(rpcName, params)
    
    if (error) {
      console.error(`[${rpcName}] RPC Error:`, error)
      throw new Error(`${rpcName} failed: ${error.message}`)
    }
    
    return data
  } catch (error) {
    console.error(`[${rpcName}] Unexpected error:`, error)
    throw error
  }
}

/**
 * Resolve all organizations for a user with complete context
 */
export async function resolveUserOrganizations(actorUserId: string): Promise<{
  organizations: HERAOrganizationDetails[]
  defaultOrganization: HERAOrganizationDetails | null
  userContext: HERAUserContext
}> {
  console.log('🏢 [ORG_RESOLVER] Resolving organizations for user:', actorUserId)

  // Step 1: Get user context and organizations via hera_auth_introspect_v1
  const authContext: HERAUserContext = await handleRPCCall('hera_auth_introspect_v1', {
    p_actor_user_id: actorUserId
  })

  if (!authContext || !authContext.organizations || authContext.organizations.length === 0) {
    console.warn('🏢 [ORG_RESOLVER] No organizations found for user:', actorUserId)
    return {
      organizations: [],
      defaultOrganization: null,
      userContext: authContext
    }
  }

  console.log(`🏢 [ORG_RESOLVER] Found ${authContext.organizations.length} organizations for user`)

  // Step 2: Get detailed organization info for each membership
  const organizations: HERAOrganizationDetails[] = []
  
  for (const membership of authContext.organizations) {
    try {
      console.log(`🏢 [ORG_RESOLVER] Getting details for organization: ${membership.id}`)
      
      const orgDetails = await handleRPCCall('hera_organization_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: actorUserId,
        p_organization_id: membership.id,
        p_options: { 
          include_metadata: true,
          include_settings: true
        }
      })

      if (orgDetails?.organization) {
        organizations.push({
          id: orgDetails.organization.id,
          entity_id: orgDetails.organization.entity_id || orgDetails.organization.id,
          name: orgDetails.organization.name,
          code: orgDetails.organization.code,
          org_type: orgDetails.organization.org_type || 'business',
          industry_type: orgDetails.organization.industry_type || 'general',
          status: orgDetails.organization.status || 'active',
          metadata: orgDetails.organization.metadata,
          settings: orgDetails.organization.settings
        })
        
        console.log(`✅ [ORG_RESOLVER] Organization details loaded: ${orgDetails.organization.name}`)
      } else {
        console.warn(`⚠️ [ORG_RESOLVER] No details returned for organization: ${membership.id}`)
      }
    } catch (error) {
      console.error(`❌ [ORG_RESOLVER] Failed to get details for organization ${membership.id}:`, error)
      // Continue with other organizations even if one fails
    }
  }

  // Step 3: Determine default organization
  const defaultOrgId = authContext.default_organization_id || 
                      (authContext.organizations.length > 0 ? authContext.organizations[0].id : null)
  
  const defaultOrganization = defaultOrgId 
    ? organizations.find(org => org.id === defaultOrgId) || organizations[0] || null
    : null

  console.log(`✅ [ORG_RESOLVER] Resolution complete. Default org: ${defaultOrganization?.name || 'None'}`)

  return {
    organizations,
    defaultOrganization,
    userContext: authContext
  }
}

/**
 * Get organization details by ID for a specific user
 */
export async function getOrganizationDetails(
  actorUserId: string, 
  organizationId: string
): Promise<HERAOrganizationDetails | null> {
  console.log('🏢 [ORG_RESOLVER] Getting organization details:', organizationId)

  try {
    const orgDetails = await handleRPCCall('hera_organization_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: actorUserId,
      p_organization_id: organizationId,
      p_options: { 
        include_metadata: true,
        include_settings: true
      }
    })

    if (!orgDetails?.organization) {
      console.warn('🏢 [ORG_RESOLVER] No organization found with ID:', organizationId)
      return null
    }

    const organization: HERAOrganizationDetails = {
      id: orgDetails.organization.id,
      entity_id: orgDetails.organization.entity_id || orgDetails.organization.id,
      name: orgDetails.organization.name,
      code: orgDetails.organization.code,
      org_type: orgDetails.organization.org_type || 'business',
      industry_type: orgDetails.organization.industry_type || 'general',
      status: orgDetails.organization.status || 'active',
      metadata: orgDetails.organization.metadata,
      settings: orgDetails.organization.settings
    }

    console.log('✅ [ORG_RESOLVER] Organization details retrieved:', organization.name)
    return organization

  } catch (error) {
    console.error('❌ [ORG_RESOLVER] Failed to get organization details:', error)
    return null
  }
}

/**
 * Check if user has access to specific organization
 */
export async function hasOrganizationAccess(
  actorUserId: string, 
  organizationId: string
): Promise<boolean> {
  try {
    const authContext = await handleRPCCall('hera_auth_introspect_v1', {
      p_actor_user_id: actorUserId
    })

    return authContext?.organizations?.some((org: any) => org.id === organizationId) || false
  } catch (error) {
    console.error('❌ [ORG_RESOLVER] Failed to check organization access:', error)
    return false
  }
}

/**
 * Get user's role in specific organization
 */
export async function getUserOrganizationRole(
  actorUserId: string,
  organizationId: string
): Promise<{
  role: string | null
  roles: string[]
  isOwner: boolean
  isAdmin: boolean
}> {
  try {
    const authContext = await handleRPCCall('hera_auth_introspect_v1', {
      p_actor_user_id: actorUserId
    })

    const membership = authContext?.organizations?.find((org: any) => org.id === organizationId)
    
    if (!membership) {
      return {
        role: null,
        roles: [],
        isOwner: false,
        isAdmin: false
      }
    }

    return {
      role: membership.primary_role,
      roles: membership.roles || [],
      isOwner: membership.is_owner || false,
      isAdmin: membership.is_admin || false
    }
  } catch (error) {
    console.error('❌ [ORG_RESOLVER] Failed to get user organization role:', error)
    return {
      role: null,
      roles: [],
      isOwner: false,
      isAdmin: false
    }
  }
}