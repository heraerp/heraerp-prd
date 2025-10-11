/**
 * HERA Staff Hook
 *
 * Thin wrapper over useUniversalEntity for staff management
 * Provides staff-specific helpers and RPC integration
 */

import { useMemo } from 'react'
import { useUniversalEntity } from './useUniversalEntity'
import { STAFF_PRESET } from './entityPresets'
import type { DynamicFieldDef, RelationshipDef } from './useUniversalEntity'

export interface StaffMember {
  id: string
  entity_name: string
  entity_code?: string
  smart_code: string
  status: string
  entity_description?: string
  metadata?: any
  // Flattened dynamic fields (now directly accessible thanks to fixed useUniversalEntity)
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  role_title?: string
  hire_date?: string
  hourly_cost?: number
  display_rate?: number
  skills?: any[]
  bio?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface UseHeraStaffOptions {
  organizationId?: string
  includeArchived?: boolean
  userRole?: string
  enabled?: boolean // Add enabled flag to control fetching
  filters?: {
    include_dynamic?: boolean
    include_relationships?: boolean
    branch_id?: string
    limit?: number
    offset?: number
    status?: string
    search?: string
  }
}

export function useHeraStaff(options?: UseHeraStaffOptions) {
  const {
    entities: staff,
    isLoading,
    error,
    refetch,
    create: baseCreate,
    update: baseUpdate,
    delete: baseDelete,
    archive: baseArchive,
    restore: baseRestore,
    isCreating,
    isUpdating,
    isDeleting
  } = useUniversalEntity({
    entity_type: 'staff',
    organizationId: options?.organizationId,
    enabled: options?.enabled !== false, // Default to enabled, but allow disabling
    filters: {
      include_dynamic: true,
      include_relationships: true, // Enable relationships for branch filtering
      limit: 100,
      // Only filter by 'active' status when not including archived
      // When includeArchived is true, don't pass status to get all staff
      ...(options?.includeArchived ? {} : { status: 'active' }),
      ...options?.filters
    },
    dynamicFields: STAFF_PRESET.dynamicFields as DynamicFieldDef[],
    relationships: STAFF_PRESET.relationships as RelationshipDef[]
  })

  // Helper to create staff with proper smart codes and relationships
  const createStaff = async (data: {
    first_name: string
    last_name: string
    email: string
    phone?: string
    role_id?: string
    role_title?: string
    status?: string
    hire_date?: string
    hourly_cost?: number
    display_rate?: number
    skills?: any[]
    bio?: string
    avatar_url?: string
    service_ids?: string[]
    branch_ids?: string[] // Support for multiple branch assignments
    location_id?: string
    supervisor_id?: string
  }) => {
    const entity_name = `${data.first_name} ${data.last_name}`

    // Build dynamic_fields payload - following useHeraRoles pattern exactly
    const dynamic_fields: Record<string, any> = {}

    if (data.first_name !== undefined) {
      dynamic_fields.first_name = {
        value: data.first_name,
        type: 'text',
        smart_code: 'HERA.SALON.STAFF.FIELD.FIRST_NAME.V1'
      }
    }

    if (data.last_name !== undefined) {
      dynamic_fields.last_name = {
        value: data.last_name,
        type: 'text',
        smart_code: 'HERA.SALON.STAFF.FIELD.LAST_NAME.V1'
      }
    }

    if (data.email) {
      dynamic_fields.email = {
        value: data.email,
        type: 'text',
        smart_code: 'HERA.SALON.STAFF.FIELD.EMAIL.V1'
      }
    }

    if (data.phone) {
      dynamic_fields.phone = {
        value: data.phone,
        type: 'text',
        smart_code: 'HERA.SALON.STAFF.FIELD.PHONE.V1'
      }
    }

    if (data.role_title) {
      dynamic_fields.role_title = {
        value: data.role_title,
        type: 'text',
        smart_code: 'HERA.SALON.STAFF.FIELD.ROLE_TITLE.V1'
      }
    }

    if (data.hire_date) {
      dynamic_fields.hire_date = {
        value: data.hire_date,
        type: 'date',
        smart_code: 'HERA.SALON.STAFF.FIELD.HIRE_DATE.V1'
      }
    }

    if (data.hourly_cost !== undefined) {
      dynamic_fields.hourly_cost = {
        value: data.hourly_cost,
        type: 'number',
        smart_code: 'HERA.SALON.STAFF.FIELD.HOURLY_COST.V1'
      }
    }

    if (data.display_rate !== undefined) {
      dynamic_fields.display_rate = {
        value: data.display_rate,
        type: 'number',
        smart_code: 'HERA.SALON.STAFF.FIELD.DISPLAY_RATE.V1'
      }
    }

    if (data.skills && data.skills.length > 0) {
      dynamic_fields.skills = {
        value: data.skills,
        type: 'json',
        smart_code: 'HERA.SALON.STAFF.FIELD.SKILLS.V1'
      }
    }

    if (data.bio) {
      dynamic_fields.bio = {
        value: data.bio,
        type: 'text',
        smart_code: 'HERA.SALON.STAFF.FIELD.BIO.V1'
      }
    }

    // Build relationships payload for branches
    const relationships: Record<string, string[]> = {}
    if (data.branch_ids && data.branch_ids.length > 0) {
      relationships.STAFF_MEMBER_OF = data.branch_ids
    }

    return baseCreate({
      entity_type: 'staff',
      entity_name,
      smart_code: 'HERA.SALON.STAFF.ENTITY.PERSON.V1',
      status: data.status === 'inactive' ? 'archived' : 'active',
      dynamic_fields,
      metadata: {
        relationships
      }
    } as any)
  }

  // Helper to update staff
  const updateStaff = async (id: string, data: Partial<Parameters<typeof createStaff>[0]>) => {
    // Get existing staff member to build complete entity_name
    const staffMember = (staff as StaffMember[])?.find(s => s.id === id)

    const firstName = data.first_name ?? staffMember?.first_name ?? ''
    const lastName = data.last_name ?? staffMember?.last_name ?? ''
    const entity_name =
      firstName && lastName
        ? `${firstName} ${lastName}`.trim()
        : firstName
          ? firstName.trim()
          : lastName
            ? lastName.trim()
            : undefined

    // Build dynamic patch from provided fields - following useHeraRoles pattern
    const dynamic_patch: Record<string, any> = {}

    if (data.first_name !== undefined) {
      dynamic_patch.first_name = data.first_name
    }

    if (data.last_name !== undefined) {
      dynamic_patch.last_name = data.last_name
    }

    if (data.email !== undefined) {
      dynamic_patch.email = data.email
    }

    if (data.phone !== undefined) {
      dynamic_patch.phone = data.phone
    }

    if (data.role_title !== undefined) {
      dynamic_patch.role_title = data.role_title
    }

    if (data.hire_date !== undefined) {
      dynamic_patch.hire_date = data.hire_date
    }

    if (data.hourly_cost !== undefined) {
      dynamic_patch.hourly_cost = data.hourly_cost
    }

    if (data.display_rate !== undefined) {
      dynamic_patch.display_rate = data.display_rate
    }

    if (data.skills !== undefined) {
      dynamic_patch.skills = data.skills
    }

    if (data.bio !== undefined) {
      dynamic_patch.bio = data.bio
    }

    // Build relationships patch for branches
    const relationships_patch: Record<string, string[]> = {}
    if (data.branch_ids !== undefined) {
      // Support multiple branches - if array is empty, it removes all STAFF_MEMBER_OF relationships
      relationships_patch['STAFF_MEMBER_OF'] = data.branch_ids
    }

    const payload: any = {
      entity_id: id,
      ...(entity_name && { entity_name }),
      ...(Object.keys(dynamic_patch).length ? { dynamic_patch } : {}),
      ...(Object.keys(relationships_patch).length ? { relationships_patch } : {}),
      ...(data.status !== undefined && {
        status: data.status === 'inactive' ? 'archived' : 'active'
      })
    }

    return baseUpdate(payload)
  }

  // Helper to archive staff (soft delete)
  const archiveStaff = async (id: string) => {
    return baseArchive(id)
  }

  // Helper to restore staff (set status to active)
  const restoreStaff = async (id: string) => {
    return baseRestore(id)
  }

  // 🎯 ENTERPRISE PATTERN: Smart delete with automatic fallback to archive
  // Try hard delete first, but if staff is referenced in transactions, archive instead
  const deleteStaff = async (
    id: string,
    reason?: string
  ): Promise<{
    success: boolean
    archived: boolean
    message?: string
  }> => {
    const staffMember = (staff as StaffMember[])?.find(s => s.id === id)
    if (!staffMember) throw new Error('Staff member not found')

    try {
      // Attempt hard delete with cascade
      await baseDelete({
        entity_id: id,
        hard_delete: true,
        cascade: true,
        reason: reason || 'Permanently delete staff member',
        smart_code: 'HERA.SALON.STAFF.DELETE.V1'
      })

      // If we reach here, hard delete succeeded
      return {
        success: true,
        archived: false
      }
    } catch (error: any) {
      // 🎯 ENTERPRISE ERROR DETECTION: Match services pattern - simpler and more reliable
      const errorMessage = error.message || ''

      console.log('[useHeraStaff] Delete error caught:', {
        errorType: error.constructor.name,
        status: error.status || error.statusCode,
        code: error.code,
        message: errorMessage
      })

      // Check if error is due to foreign key constraint (referenced in transactions)
      // Matches services pattern - check error.message for key indicators
      const is409Conflict =
        errorMessage.includes('409') ||
        errorMessage.includes('Conflict') ||
        errorMessage.includes('referenced') ||
        errorMessage.includes('foreign key') ||
        errorMessage.includes('transaction') ||
        errorMessage.includes('Cannot delete')

      if (is409Conflict) {
        console.log('[useHeraStaff] Staff has references - fallback to archive')

        // Staff is referenced - fallback to archive with warning
        // 🎯 CRITICAL: DON'T throw, just archive and return success (matches services pattern)
        await baseUpdate({
          entity_id: id,
          entity_name: staffMember.entity_name,
          status: 'archived'
        })

        console.log('[useHeraStaff] Archive successful - returning success response')

        return {
          success: true,
          archived: true,
          message:
            'Staff member is referenced by other records (appointments, transactions, or schedules) and cannot be deleted. They have been archived instead.'
        }
      }

      // If it's a different error, re-throw it
      throw error
    }
  }

  // Helper to link role
  const linkRole = async (staffId: string, roleId: string) => {
    const staffMember = (staff as StaffMember[])?.find(s => s.id === staffId)
    if (staffMember) {
      return updateStaff(staffId, {
        role_id: roleId
      })
    }
    throw new Error('Staff member not found')
  }

  // Helper to link services
  const linkServices = async (staffId: string, serviceIds: string[]) => {
    const staffMember = (staff as StaffMember[])?.find(s => s.id === staffId)
    if (staffMember) {
      return updateStaff(staffId, {
        service_ids: serviceIds
      })
    }
    throw new Error('Staff member not found')
  }

  // Filter out sensitive fields based on role
  const filterSensitiveFields = (staffList: StaffMember[], userRole?: string) => {
    if (!userRole || ['owner', 'manager'].includes(userRole)) {
      return staffList
    }

    // Remove hourly_cost for non-managers
    return staffList.map(s => ({
      ...s,
      dynamic_fields: {
        ...s.dynamic_fields,
        hourly_cost: undefined
      }
    }))
  }

  // Filter staff by branch using STAFF_MEMBER_OF relationship
  const filteredStaff = useMemo(() => {
    if (!staff) return staff as StaffMember[]

    // If no branch filter, return all staff
    if (!options?.filters?.branch_id || options.filters.branch_id === 'all') {
      return staff as StaffMember[]
    }

    // Filter by STAFF_MEMBER_OF relationship
    return (staff as any[]).filter((s: any) => {
      const memberOfRels =
        s.relationships?.staff_member_of ||
        s.relationships?.STAFF_MEMBER_OF ||
        s.relationships?.member_of

      if (!memberOfRels) return false

      // Handle both array and single relationship formats
      if (Array.isArray(memberOfRels)) {
        return memberOfRels.some(rel => rel.to_entity?.id === options.filters?.branch_id)
      } else {
        return memberOfRels.to_entity?.id === options.filters?.branch_id
      }
    }) as StaffMember[]
  }, [staff, options?.filters?.branch_id])

  return {
    staff: filteredStaff,
    isLoading,
    error,
    refetch,
    createStaff,
    updateStaff,
    archiveStaff,
    restoreStaff,
    deleteStaff,
    linkRole,
    linkServices,
    filterSensitiveFields,
    isCreating,
    isUpdating,
    isDeleting
  }
}
