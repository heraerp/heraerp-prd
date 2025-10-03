/**
 * HERA Roles Hook
 * 
 * Thin wrapper over useUniversalEntity for role management
 * Provides role-specific helpers and RPC integration
 */

import { useUniversalEntity } from './useUniversalEntity'
import { ROLE_PRESET } from './entityPresets'
import type { DynamicFieldDef } from './useUniversalEntity'

export interface Role {
  id: string
  entity_name: string
  entity_code?: string
  smart_code: string
  dynamic_fields?: {
    title?: { value: string }
    description?: { value: string }
    permissions?: { value: any }
    rank?: { value: number }
    active?: { value: boolean }
  }
  created_at: string
  updated_at: string
}

export interface UseHeraRolesOptions {
  filters?: {
    include_dynamic?: boolean
    include_relationships?: boolean
    limit?: number
    offset?: number
    status?: string
  }
}

export function useHeraRoles(options?: UseHeraRolesOptions) {
  const {
    entities: roles,
    isLoading,
    error,
    refetch,
    create: baseCreate,
    update: baseUpdate,
    delete: baseDelete,
    archive: baseArchive,
    isCreating,
    isUpdating,
    isDeleting
  } = useUniversalEntity({
    entity_type: 'ROLE',
    filters: {
      include_dynamic: true,
      include_relationships: false,
      limit: 50,
      ...options?.filters
    },
    dynamicFields: ROLE_PRESET.dynamicFields as DynamicFieldDef[]
  })

  // Helper to create role with proper smart codes
  const createRole = async (data: {
    title: string
    description?: string
    permissions?: any[]
    rank?: number
    active?: boolean
  }) => {
    return baseCreate({
      entity_name: data.title,
      smart_code: 'HERA.SALON.ROLE.ENTITY.POSITION.V1',
      ...data
    })
  }

  // Helper to update role
  const updateRole = async (id: string, data: Partial<Parameters<typeof createRole>[0]>) => {
    return baseUpdate(id, {
      ...(data.title && { entity_name: data.title }),
      ...data
    })
  }

  // Helper to archive role (soft delete)
  const archiveRole = async (id: string) => {
    return baseArchive(id)
  }

  // Helper to delete role (hard delete)
  const deleteRole = async (id: string, hardDelete = false) => {
    if (!hardDelete) {
      return archiveRole(id)
    }
    return baseDelete(id)
  }

  // Helper to get active roles
  const getActiveRoles = () => {
    return (roles as Role[])?.filter(r => 
      r.dynamic_fields?.active?.value !== false
    ) || []
  }

  // Helper to get role by title
  const getRoleByTitle = (title: string) => {
    return (roles as Role[])?.find(r => 
      r.dynamic_fields?.title?.value === title
    )
  }

  // Helper to check if a permission is in a role
  const hasPermission = (roleId: string, permission: string) => {
    const role = (roles as Role[])?.find(r => r.id === roleId)
    if (!role || !role.dynamic_fields?.permissions?.value) return false
    
    const permissions = role.dynamic_fields.permissions.value
    return Array.isArray(permissions) && permissions.includes(permission)
  }

  return {
    roles: roles as Role[],
    isLoading,
    error,
    refetch,
    createRole,
    updateRole,
    archiveRole,
    deleteRole,
    getActiveRoles,
    getRoleByTitle,
    hasPermission,
    isCreating,
    isUpdating,
    isDeleting
  }
}