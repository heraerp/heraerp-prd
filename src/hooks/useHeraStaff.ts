/**
 * HERA Staff Hook
 *
 * Thin wrapper over useUniversalEntity for staff management
 * Provides staff-specific helpers and RPC integration
 */

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
  filters?: {
    include_dynamic?: boolean
    include_relationships?: boolean
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
    isCreating,
    isUpdating,
    isDeleting
  } = useUniversalEntity({
    entity_type: 'staff',
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: false,
      limit: 100,
      // Only filter by 'active' status when not including archived
      // When includeArchived is true, don't pass status to get all staff
      ...(options?.includeArchived ? {} : { status: 'active' }),
      ...options?.filters
    },
    dynamicFields: STAFF_PRESET.dynamicFields as DynamicFieldDef[]
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

    return baseCreate({
      entity_type: 'staff',
      entity_name,
      smart_code: 'HERA.SALON.STAFF.ENTITY.PERSON.V1',
      status: data.status === 'inactive' ? 'archived' : 'active',
      dynamic_fields
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

  // Helper to archive staff (soft delete) - following useHeraProducts pattern
  const archiveStaff = async (id: string) => {
    const staffMember = (staff as StaffMember[])?.find(s => s.id === id)
    if (!staffMember) throw new Error('Staff member not found')

    console.log('[useHeraStaff] Archiving staff:', { id })

    return baseUpdate({
      entity_id: id,
      entity_name: staffMember.entity_name,
      status: 'archived' // ← Set status to archived using UPDATE, not DELETE
    })
  }

  // Helper to delete staff (hard delete)
  const deleteStaff = async (id: string, hardDelete = false) => {
    if (!hardDelete) {
      return archiveStaff(id)
    }
    return baseDelete({ entity_id: id, hard_delete: true })
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

  return {
    staff: staff as StaffMember[],
    isLoading,
    error,
    refetch,
    createStaff,
    updateStaff,
    archiveStaff,
    deleteStaff,
    linkRole,
    linkServices,
    filterSensitiveFields,
    isCreating,
    isUpdating,
    isDeleting
  }
}
