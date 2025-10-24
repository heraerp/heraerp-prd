/**
 * HERA Branches Hook
 *
 * ✅ Migrated to useUniversalEntityV1 - Uses hera_entities_crud_v1 orchestrator RPC
 * ✅ Single atomic call for entity + dynamic fields + relationships
 * ✅ Enterprise security: actor + membership + smart code validation
 * ✅ Provides branch-specific helpers with GPS location support
 */

import { useMemo } from 'react'
import { useUniversalEntityV1 } from './useUniversalEntityV1'
import type { DynamicFieldDef, RelationshipDef } from './useUniversalEntityV1'

export interface BranchEntity {
  id: string
  entity_name: string
  entity_code?: string
  smart_code: string
  status: string
  entity_description?: string
  metadata?: any
  // Flattened dynamic fields
  address?: string
  city?: string
  phone?: string
  email?: string
  manager_name?: string
  opening_time?: string
  closing_time?: string
  timezone?: string
  // GPS Location fields
  gps_latitude?: number
  gps_longitude?: number
  gps_accuracy?: number
  gps_updated_at?: string
  created_at: string
  updated_at: string
}

export interface UseHeraBranchesOptions {
  organizationId?: string
  includeArchived?: boolean
  filters?: {
    include_dynamic?: boolean
    include_relationships?: boolean
    limit?: number
    offset?: number
    status?: string
    search?: string
  }
}

// Branch dynamic fields definition
const BRANCH_DYNAMIC_FIELDS: DynamicFieldDef[] = [
  {
    name: 'address',
    type: 'text',
    smart_code: 'HERA.SALON.BRANCH.FIELD.ADDRESS.V1',
    required: false
  },
  {
    name: 'city',
    type: 'text',
    smart_code: 'HERA.SALON.BRANCH.FIELD.CITY.V1',
    required: false
  },
  {
    name: 'phone',
    type: 'text',
    smart_code: 'HERA.SALON.BRANCH.FIELD.PHONE.V1',
    required: false
  },
  {
    name: 'email',
    type: 'text',
    smart_code: 'HERA.SALON.BRANCH.FIELD.EMAIL.V1',
    required: false
  },
  {
    name: 'manager_name',
    type: 'text',
    smart_code: 'HERA.SALON.BRANCH.FIELD.MANAGER.V1',
    required: false
  },
  {
    name: 'opening_time',
    type: 'text',
    smart_code: 'HERA.SALON.BRANCH.FIELD.OPENING_TIME.V1',
    required: false
  },
  {
    name: 'closing_time',
    type: 'text',
    smart_code: 'HERA.SALON.BRANCH.FIELD.CLOSING_TIME.V1',
    required: false
  },
  {
    name: 'timezone',
    type: 'text',
    smart_code: 'HERA.SALON.BRANCH.FIELD.TIMEZONE.V1',
    required: false
  },
  // 🎯 ENTERPRISE GPS LOCATION FIELDS
  {
    name: 'gps_latitude',
    type: 'number',
    smart_code: 'HERA.SALON.BRANCH.FIELD.GPS.LATITUDE.V1',
    required: false
  },
  {
    name: 'gps_longitude',
    type: 'number',
    smart_code: 'HERA.SALON.BRANCH.FIELD.GPS.LONGITUDE.V1',
    required: false
  },
  {
    name: 'gps_accuracy',
    type: 'number',
    smart_code: 'HERA.SALON.BRANCH.FIELD.GPS.ACCURACY.V1',
    required: false
  },
  {
    name: 'gps_updated_at',
    type: 'text',
    smart_code: 'HERA.SALON.BRANCH.FIELD.GPS.UPDATED_AT.V1',
    required: false
  }
]

export function useHeraBranches(options?: UseHeraBranchesOptions) {
  const {
    entities: branches,
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
  } = useUniversalEntityV1({
    entity_type: 'BRANCH',
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: true,
      limit: 100,
      // Only filter by 'active' status when not including archived
      ...(options?.includeArchived ? {} : { status: 'active' }),
      ...options?.filters
    },
    dynamicFields: BRANCH_DYNAMIC_FIELDS,
    relationships: []
  })

  // 🎯 ENTERPRISE PATTERN: Create branch with comprehensive dynamic data storage
  const createBranch = async (data: {
    name: string
    code?: string
    description?: string
    address?: string
    city?: string
    phone?: string
    email?: string
    manager_name?: string
    opening_time?: string
    closing_time?: string
    timezone?: string
    gps_latitude?: number
    gps_longitude?: number
    gps_accuracy?: number
    status?: string
  }) => {
    console.log('[useHeraBranches] Creating branch with data:', data)

    // Build dynamic_fields payload with all non-empty values
    const dynamic_fields: Record<string, any> = {}
    let dynamicFieldCount = 0

    if (data.address) {
      dynamic_fields.address = {
        value: data.address,
        type: 'text',
        smart_code: 'HERA.SALON.BRANCH.FIELD.ADDRESS.V1'
      }
      dynamicFieldCount++
    }

    if (data.city) {
      dynamic_fields.city = {
        value: data.city,
        type: 'text',
        smart_code: 'HERA.SALON.BRANCH.FIELD.CITY.V1'
      }
      dynamicFieldCount++
    }

    if (data.phone) {
      dynamic_fields.phone = {
        value: data.phone,
        type: 'text',
        smart_code: 'HERA.SALON.BRANCH.FIELD.PHONE.V1'
      }
      dynamicFieldCount++
    }

    if (data.email) {
      dynamic_fields.email = {
        value: data.email,
        type: 'text',
        smart_code: 'HERA.SALON.BRANCH.FIELD.EMAIL.V1'
      }
      dynamicFieldCount++
    }

    if (data.manager_name) {
      dynamic_fields.manager_name = {
        value: data.manager_name,
        type: 'text',
        smart_code: 'HERA.SALON.BRANCH.FIELD.MANAGER.V1'
      }
      dynamicFieldCount++
    }

    if (data.opening_time) {
      dynamic_fields.opening_time = {
        value: data.opening_time,
        type: 'text',
        smart_code: 'HERA.SALON.BRANCH.FIELD.OPENING_TIME.V1'
      }
      dynamicFieldCount++
    }

    if (data.closing_time) {
      dynamic_fields.closing_time = {
        value: data.closing_time,
        type: 'text',
        smart_code: 'HERA.SALON.BRANCH.FIELD.CLOSING_TIME.V1'
      }
      dynamicFieldCount++
    }

    if (data.timezone) {
      dynamic_fields.timezone = {
        value: data.timezone,
        type: 'text',
        smart_code: 'HERA.SALON.BRANCH.FIELD.TIMEZONE.V1'
      }
      dynamicFieldCount++
    }

    // 🎯 ENTERPRISE GPS LOCATION FIELDS
    if (data.gps_latitude !== undefined && data.gps_latitude !== null) {
      dynamic_fields.gps_latitude = {
        value: data.gps_latitude,
        type: 'number',
        smart_code: 'HERA.SALON.BRANCH.FIELD.GPS.LATITUDE.V1'
      }
      dynamicFieldCount++
    }

    if (data.gps_longitude !== undefined && data.gps_longitude !== null) {
      dynamic_fields.gps_longitude = {
        value: data.gps_longitude,
        type: 'number',
        smart_code: 'HERA.SALON.BRANCH.FIELD.GPS.LONGITUDE.V1'
      }
      dynamicFieldCount++
    }

    if (data.gps_accuracy !== undefined && data.gps_accuracy !== null) {
      dynamic_fields.gps_accuracy = {
        value: data.gps_accuracy,
        type: 'number',
        smart_code: 'HERA.SALON.BRANCH.FIELD.GPS.ACCURACY.V1'
      }
      dynamicFieldCount++
    }

    // Auto-add GPS timestamp when coordinates are provided
    if (data.gps_latitude !== undefined && data.gps_longitude !== undefined) {
      dynamic_fields.gps_updated_at = {
        value: new Date().toISOString(),
        type: 'text',
        smart_code: 'HERA.SALON.BRANCH.FIELD.GPS.UPDATED_AT.V1'
      }
      dynamicFieldCount++
    }

    console.log('[useHeraBranches] Dynamic fields prepared:', {
      count: dynamicFieldCount,
      fields: Object.keys(dynamic_fields),
      hasGPS: !!(data.gps_latitude && data.gps_longitude),
      gpsCoordinates: data.gps_latitude && data.gps_longitude ? `${data.gps_latitude}, ${data.gps_longitude}` : null
    })

    // Determine status
    const finalStatus = data.status === 'inactive' ? 'archived' : 'active'

    console.log('[useHeraBranches] Creating branch entity:', {
      entity_name: data.name,
      entity_code: data.code || `BR-${Date.now()}`,
      status: finalStatus,
      dynamicFieldCount
    })

    try {
      const result = await baseCreate({
        entity_type: 'BRANCH',
        entity_name: data.name,
        entity_code: data.code || `BR-${Date.now()}`,
        entity_description: data.description,
        smart_code: 'HERA.SALON.BRANCH.ENTITY.LOCATION.V1',
        status: finalStatus,
        dynamic_fields
      } as any)

      console.log('[useHeraBranches] Branch created successfully:', result)

      // ✅ FIXED: Let useUniversalEntityV1's onSuccess handler update cache automatically
      // Don't manually refetch - this was causing "no entity in response" error
      // The cache is updated optimistically by the hook's onSuccess callback

      return result
    } catch (error: any) {
      console.error('[useHeraBranches] Branch creation failed:', {
        error: error.message,
        data: data
      })
      throw new Error(error.message || 'Failed to create branch')
    }
  }

  // 🎯 ENTERPRISE PATTERN: Update branch with comprehensive dynamic data handling
  const updateBranch = async (
    id: string,
    data: Partial<Parameters<typeof createBranch>[0]>
  ) => {
    console.log('[useHeraBranches] Updating branch:', { id, data })

    // Get existing branch to build complete entity_name
    const branch = (branches as BranchEntity[])?.find(b => b.id === id)
    if (!branch) throw new Error('Branch not found')

    console.log('[useHeraBranches] Found existing branch:', {
      id: branch.id,
      current_status: branch.status,
      entity_name: branch.entity_name
    })

    // Build dynamic patch from provided fields
    const dynamic_patch: Record<string, any> = {}
    let dynamicFieldUpdateCount = 0

    if (data.address !== undefined) {
      dynamic_patch.address = data.address
      dynamicFieldUpdateCount++
    }
    if (data.city !== undefined) {
      dynamic_patch.city = data.city
      dynamicFieldUpdateCount++
    }
    if (data.phone !== undefined) {
      dynamic_patch.phone = data.phone
      dynamicFieldUpdateCount++
    }
    if (data.email !== undefined) {
      dynamic_patch.email = data.email
      dynamicFieldUpdateCount++
    }
    if (data.manager_name !== undefined) {
      dynamic_patch.manager_name = data.manager_name
      dynamicFieldUpdateCount++
    }
    if (data.opening_time !== undefined) {
      dynamic_patch.opening_time = data.opening_time
      dynamicFieldUpdateCount++
    }
    if (data.closing_time !== undefined) {
      dynamic_patch.closing_time = data.closing_time
      dynamicFieldUpdateCount++
    }
    if (data.timezone !== undefined) {
      dynamic_patch.timezone = data.timezone
      dynamicFieldUpdateCount++
    }

    // 🎯 ENTERPRISE GPS LOCATION FIELDS
    if (data.gps_latitude !== undefined) {
      dynamic_patch.gps_latitude = data.gps_latitude
      dynamicFieldUpdateCount++
    }
    if (data.gps_longitude !== undefined) {
      dynamic_patch.gps_longitude = data.gps_longitude
      dynamicFieldUpdateCount++
    }
    if (data.gps_accuracy !== undefined) {
      dynamic_patch.gps_accuracy = data.gps_accuracy
      dynamicFieldUpdateCount++
    }

    // Auto-update GPS timestamp when coordinates change
    if (data.gps_latitude !== undefined || data.gps_longitude !== undefined) {
      dynamic_patch.gps_updated_at = new Date().toISOString()
      dynamicFieldUpdateCount++
    }

    // Determine final status
    const finalStatus =
      data.status !== undefined
        ? data.status === 'inactive'
          ? 'archived'
          : 'active'
        : undefined

    console.log('[useHeraBranches] Update payload:', {
      entity_id: id,
      entity_name: data.name || branch.entity_name,
      status_update: finalStatus ? `${branch.status} → ${finalStatus}` : 'unchanged',
      dynamicFieldUpdateCount,
      dynamic_fields: Object.keys(dynamic_patch)
    })

    const payload: any = {
      entity_id: id,
      ...(data.name && { entity_name: data.name }),
      ...(data.code && { entity_code: data.code }),
      ...(data.description !== undefined && { entity_description: data.description }),
      ...(Object.keys(dynamic_patch).length ? { dynamic_patch } : {}),
      ...(finalStatus && { status: finalStatus })
    }

    try {
      const result = await baseUpdate(payload)

      console.log('[useHeraBranches] Branch updated successfully:', result)

      // ✅ FIXED: Let useUniversalEntityV1's onSuccess handler update cache automatically
      // Don't manually refetch - the cache is updated optimistically by the hook

      return result
    } catch (error: any) {
      console.error('[useHeraBranches] Branch update failed:', {
        error: error.message,
        id,
        data
      })
      throw new Error(error.message || 'Failed to update branch')
    }
  }

  // 🎯 ENTERPRISE PATTERN: Archive branch with explicit refetch
  const archiveBranch = async (id: string) => {
    const branch = (branches as BranchEntity[])?.find(b => b.id === id)
    if (!branch) throw new Error('Branch not found')

    console.log('[useHeraBranches] Archiving branch:', {
      id,
      current_status: branch.status,
      entity_name: branch.entity_name
    })

    try {
      // Use baseArchive which is specifically designed for archiving
      const result = await baseArchive(id)

      console.log('[useHeraBranches] Archive successful:', result)

      // ✅ FIXED: Let useUniversalEntityV1's onSuccess handler update cache automatically
      // Don't manually refetch - the cache is updated optimistically by the hook

      return result
    } catch (error: any) {
      console.error('[useHeraBranches] Archive failed:', error)
      throw new Error(error.message || 'Failed to archive branch')
    }
  }

  // 🎯 ENTERPRISE PATTERN: Restore branch with explicit refetch
  const restoreBranch = async (id: string) => {
    const branch = (branches as BranchEntity[])?.find(b => b.id === id)
    if (!branch) throw new Error('Branch not found')

    console.log('[useHeraBranches] Restoring branch:', {
      id,
      current_status: branch.status,
      entity_name: branch.entity_name
    })

    try {
      // Use baseRestore which is specifically designed for restoring
      const result = await baseRestore(id)

      console.log('[useHeraBranches] Restore successful:', result)

      // ✅ FIXED: Let useUniversalEntityV1's onSuccess handler update cache automatically
      // Don't manually refetch - the cache is updated optimistically by the hook

      return result
    } catch (error: any) {
      console.error('[useHeraBranches] Restore failed:', error)
      throw new Error(error.message || 'Failed to restore branch')
    }
  }

  // 🎯 ENTERPRISE PATTERN: Smart delete with automatic fallback to archive
  const deleteBranch = async (
    id: string,
    reason?: string
  ): Promise<{
    success: boolean
    archived: boolean
    message?: string
  }> => {
    const branch = (branches as BranchEntity[])?.find(b => b.id === id)
    if (!branch) throw new Error('Branch not found')

    try {
      // Attempt hard delete with cascade
      await baseDelete({
        entity_id: id,
        hard_delete: true,
        cascade: true,
        reason: reason || 'Permanently delete branch',
        smart_code: 'HERA.SALON.BRANCH.DELETE.V1'
      })

      // If we reach here, hard delete succeeded
      return {
        success: true,
        archived: false
      }
    } catch (error: any) {
      // Check if error is due to foreign key constraint (referenced in transactions)
      const errorMessage = error.message || ''
      const is409Conflict =
        errorMessage.includes('409') ||
        errorMessage.includes('Conflict') ||
        errorMessage.includes('referenced') ||
        errorMessage.includes('foreign key') ||
        errorMessage.includes('transaction') ||
        errorMessage.includes('Cannot delete')

      if (is409Conflict) {
        // Branch is referenced - fallback to archive with warning
        await baseUpdate({
          entity_id: id,
          entity_name: branch.entity_name,
          status: 'archived'
        })

        return {
          success: true,
          archived: true,
          message:
            'Branch is referenced by other records (staff, services, or appointments) and cannot be deleted. It has been archived instead.'
        }
      }

      // If it's a different error, re-throw it
      throw error
    }
  }

  return {
    branches: branches as BranchEntity[],
    isLoading,
    error,
    refetch,
    createBranch,
    updateBranch,
    archiveBranch,
    restoreBranch,
    deleteBranch,
    isCreating,
    isUpdating,
    isDeleting
  }
}
