/**
 * HERA Employee Roles Hook
 *
 * 🎯 ENTERPRISE-GRADE ROLE DIFFERENTIATION:
 * - USER roles: System/authentication roles (managed separately)
 * - EMPLOYEE_ROLE: Staff job positions (Stylist, Manager, Receptionist, etc.)
 *
 * This hook manages EMPLOYEE_ROLE entities only.
 * Uses useUniversalEntity with automatic entity type normalization.
 */

'use client'

import { useUniversalEntity } from './useUniversalEntity'
import { ROLE_PRESET } from './entityPresets'
import type { DynamicFieldDef } from './useUniversalEntity'

/**
 * Enterprise Role Type Differentiation
 */
export type RoleType = 'EMPLOYEE_ROLE' | 'USER_ROLE'

export interface Role {
  id: string
  entity_name: string
  entity_code?: string
  smart_code: string
  status: string
  entity_description?: string
  metadata?: any
  // Flattened dynamic fields (now directly accessible thanks to fixed useUniversalEntity)
  title?: string
  description?: string
  permissions?: any[]
  rank?: number
  active?: boolean
  created_at: string
  updated_at: string
}

export interface RoleFormValues {
  title: string
  description?: string
  permissions?: any[]
  rank?: number
  active?: boolean
  status?: string
}

export interface UseHeraRolesOptions {
  /**
   * Include inactive/archived roles in results
   * @default false
   */
  includeInactive?: boolean

  /**
   * Organization ID for multi-tenant filtering
   * @required
   */
  organizationId?: string

  /**
   * User role for permission-based filtering (future use)
   */
  userRole?: string

  /**
   * Role type to query
   * @default 'EMPLOYEE_ROLE' - Staff job positions
   */
  roleType?: RoleType
}

export function useHeraRoles(options?: UseHeraRolesOptions) {
  // 🎯 ENTERPRISE: Use EMPLOYEE_ROLE for staff job positions
  // Will be automatically normalized to uppercase by useUniversalEntity
  const roleEntityType = options?.roleType || 'EMPLOYEE_ROLE'

  const {
    entities: roles,
    isLoading,
    error,
    refetch,
    create: baseCreate,
    update: baseUpdate,
    delete: baseDelete,
    archive: baseArchive,
    restore,
    isCreating,
    isUpdating,
    isDeleting
  } = useUniversalEntity({
    entity_type: roleEntityType, // 🎯 EMPLOYEE_ROLE (normalized to uppercase automatically)
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: false,
      limit: 100,
      ...(options?.includeInactive ? {} : { status: 'active' })
    },
    dynamicFields: ROLE_PRESET.dynamicFields as DynamicFieldDef[]
  })

  // Helper to create employee role with proper structure
  const createRole = async (data: RoleFormValues) => {
    const entity_name = data.title

    // 🎯 ENTERPRISE: Use EMPLOYEE_ROLE smart codes for staff job positions
    const dynamic_fields: Record<string, any> = {
      title: {
        value: data.title,
        type: 'text',
        smart_code: 'HERA.SALON.EMPLOYEE.ROLE.FIELD.TITLE.V1'
      },
      active: {
        value: data.active !== false,
        type: 'boolean',
        smart_code: 'HERA.SALON.EMPLOYEE.ROLE.FIELD.ACTIVE.V1'
      }
    }

    if (data.description) {
      dynamic_fields.description = {
        value: data.description,
        type: 'text',
        smart_code: 'HERA.SALON.EMPLOYEE.ROLE.FIELD.DESC.V1'
      }
    }

    if (data.permissions && data.permissions.length > 0) {
      dynamic_fields.permissions = {
        value: data.permissions,
        type: 'json',
        smart_code: 'HERA.SALON.EMPLOYEE.ROLE.FIELD.PERMS.V1'
      }
    }

    if (data.rank !== undefined) {
      dynamic_fields.rank = {
        value: data.rank,
        type: 'number',
        smart_code: 'HERA.SALON.EMPLOYEE.ROLE.FIELD.RANK.V1'
      }
    }

    return baseCreate({
      entity_type: roleEntityType, // 🎯 EMPLOYEE_ROLE (auto-normalized)
      entity_name,
      smart_code: 'HERA.SALON.EMPLOYEE.ROLE.ENTITY.POSITION.V1',
      status: data.status === 'inactive' ? 'archived' : 'active',
      dynamic_fields
    } as any)
  }

  // Helper to update employee role
  const updateRole = async (id: string, data: Partial<RoleFormValues>) => {
    const entity_name = data.title

    // Build dynamic patch from provided fields
    const dynamic_patch: Record<string, any> = {}

    if (data.title) {
      dynamic_patch.title = data.title
    }

    if (data.description !== undefined) {
      dynamic_patch.description = data.description
    }

    if (data.permissions) {
      dynamic_patch.permissions = data.permissions
    }

    if (data.rank !== undefined) {
      dynamic_patch.rank = data.rank
    }

    if (data.active !== undefined) {
      dynamic_patch.active = data.active
    }

    const payload: any = {
      entity_id: id,
      ...(entity_name && { entity_name }),
      ...(Object.keys(dynamic_patch).length ? { dynamic_patch } : {}),
      ...(data.status !== undefined && {
        status: data.status === 'inactive' ? 'archived' : 'active'
      })
    }

    return baseUpdate(payload)
  }

  /**
   * Archive employee role (soft delete)
   * Sets status to 'archived', preserving data for audit trail
   */
  const archiveRole = async (id: string) => {
    return baseArchive(id)
  }

  /**
   * Restore archived employee role
   * Sets status back to 'active'
   */
  const restoreRole = async (id: string) => {
    return restore(id)
  }

  /**
   * Delete employee role
   * @param id - Role entity ID
   * @param hardDelete - If false, archives instead of deleting (default: false)
   */
  const deleteRole = async (id: string, hardDelete = false) => {
    if (!hardDelete) {
      return archiveRole(id)
    }
    return baseDelete({ entity_id: id, hard_delete: true })
  }

  // Helper to get active roles
  const getActiveRoles = () => {
    return (roles as Role[])?.filter(r => r.active !== false && r.status !== 'archived') || []
  }

  // Helper to get role by title
  const getRoleByTitle = (title: string) => {
    return (roles as Role[])?.find(r => r.title === title)
  }

  // Helper to check if a permission is in a role
  const hasPermission = (roleId: string, permission: string) => {
    const role = (roles as Role[])?.find(r => r.id === roleId)
    if (!role || !role.permissions) return false

    const permissions = role.permissions
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
    restoreRole,
    deleteRole,
    getActiveRoles,
    getRoleByTitle,
    hasPermission,
    isCreating,
    isUpdating,
    isDeleting
  }
}
