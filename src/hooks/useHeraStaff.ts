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
  dynamic_fields?: {
    first_name?: { value: string }
    last_name?: { value: string }
    email?: { value: string }
    phone?: { value: string }
    role_title?: { value: string }
    status?: { value: string }
    hire_date?: { value: string }
    hourly_cost?: { value: number }
    display_rate?: { value: number }
    skills?: { value: any }
    bio?: { value: string }
    avatar_url?: { value: string }
  }
  relationships?: {
    role?: { to_entity: any }
    services?: { to_entity: any }[]
    location?: { to_entity: any }
    supervisor?: { to_entity: any }
  }
  created_at: string
  updated_at: string
}

export interface UseHeraStaffOptions {
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
    entity_type: 'STAFF',
    filters: {
      include_dynamic: true,
      include_relationships: true,
      limit: 100,
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
    location_id?: string
    supervisor_id?: string
  }) => {
    const entity_name = `${data.first_name} ${data.last_name}`

    // Map provided primitives to dynamic_fields payload using preset definitions
    const dynamic_fields: Record<string, any> = {}
    for (const def of STAFF_PRESET.dynamicFields) {
      const key = def.name as keyof typeof data
      if (key in data && (data as any)[key] !== undefined) {
        dynamic_fields[def.name] = {
          value: (data as any)[key],
          type: def.type,
          smart_code: def.smart_code
        }
      }
    }

    // Relationships map according to preset relationship types
    const relationships: Record<string, string[] | undefined> = {
      ...(data.role_id ? { STAFF_HAS_ROLE: [data.role_id] } : {}),
      ...(data.service_ids ? { STAFF_CAN_SERVICE: data.service_ids } : {}),
      ...(data.location_id ? { STAFF_MEMBER_OF: [data.location_id] } : {}),
      ...(data.supervisor_id ? { STAFF_REPORTS_TO: [data.supervisor_id] } : {})
    }

    return baseCreate({
      entity_type: 'STAFF',
      entity_name,
      smart_code: 'HERA.SALON.STAFF.ENTITY.PERSON.V1',
      dynamic_fields,
      metadata: { relationships }
    } as any)
  }

  // Helper to update staff
  const updateStaff = async (id: string, data: Partial<Parameters<typeof createStaff>[0]>) => {
    const entity_name = data.first_name && data.last_name
      ? `${data.first_name} ${data.last_name}`
      : undefined

    // Build dynamic patch from provided fields
    const dynamic_patch: Record<string, any> = {}
    for (const def of STAFF_PRESET.dynamicFields) {
      const key = def.name as keyof typeof data
      if (key in data && (data as any)[key] !== undefined) {
        dynamic_patch[def.name] = (data as any)[key]
      }
    }

    // Relationships patch
    const relationships_patch: Record<string, string[]> = {}
    if (data.role_id) relationships_patch['STAFF_HAS_ROLE'] = [data.role_id]
    if (data.service_ids) relationships_patch['STAFF_CAN_SERVICE'] = data.service_ids
    if (data.location_id) relationships_patch['STAFF_MEMBER_OF'] = [data.location_id]
    if (data.supervisor_id) relationships_patch['STAFF_REPORTS_TO'] = [data.supervisor_id]

    const payload: any = {
      entity_id: id,
      ...(entity_name && { entity_name }),
      ...(Object.keys(dynamic_patch).length ? { dynamic_patch } : {}),
      ...(Object.keys(relationships_patch).length ? { relationships_patch } : {})
    }

    return baseUpdate(payload)
  }

  // Helper to archive staff (soft delete)
  const archiveStaff = async (id: string) => {
    return baseArchive(id)
  }

  // Helper to delete staff (hard delete)
  const deleteStaff = async (id: string, hardDelete = false) => {
    if (!hardDelete) {
      return archiveStaff(id)
    }
    return baseDelete(id)
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
