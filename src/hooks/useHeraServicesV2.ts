/**
 * HERA Services Hook V2
 *
 * Thin wrapper over useUniversalEntity for service management
 * Provides service-specific helpers and relationship management
 */

import { useMemo } from 'react'
import { useUniversalEntity } from './useUniversalEntity'
import { SERVICE_PRESET } from './entityPresets'
import type { DynamicFieldDef, RelationshipDef } from './useUniversalEntity'

export interface ServiceEntity {
  id: string
  entity_name: string
  entity_code?: string
  smart_code: string
  dynamic_fields?: {
    price_market?: { value: number }
    duration_min?: { value: number }
    commission_rate?: { value: number }
    description?: { value: string }
    active?: { value: boolean }
  }
  relationships?: {
    category?: { to_entity: any }
    performed_by_roles?: { to_entity: any }[]
    required_products?: { to_entity: any }[]
  }
  created_at: string
  updated_at: string
}

export interface UseHeraServicesOptions {
  organizationId?: string
  filters?: {
    include_dynamic?: boolean
    include_relationships?: boolean
    limit?: number
    offset?: number
    status?: string
    search?: string
    branch_id?: string // Add branch filtering
    category_id?: string // Add category filtering
  }
}

export function useHeraServices(options?: UseHeraServicesOptions) {
  const {
    entities: services,
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
    entity_type: 'service',
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: true,
      // ⚡ PERFORMANCE: Only fetch relationships when filtering by branch or category
      // This significantly improves initial page load since relationships require expensive joins
      // Categories are needed for display, but we can fetch them separately if needed
      include_relationships: !!(options?.filters?.branch_id || options?.filters?.category_id),
      limit: 100,
      ...options?.filters
    },
    dynamicFields: SERVICE_PRESET.dynamicFields as DynamicFieldDef[],
    relationships: SERVICE_PRESET.relationships as RelationshipDef[]
  })

  // Map services to include category name from relationships
  const servicesWithCategory = useMemo(() => {
    if (!services) return services as ServiceEntity[]

    return (services as ServiceEntity[]).map(service => {
      // Extract category name from has_category relationship
      const categoryRels =
        service.relationships?.has_category ||
        service.relationships?.HAS_CATEGORY ||
        service.relationships?.category

      let categoryName = null
      if (Array.isArray(categoryRels) && categoryRels.length > 0) {
        categoryName = categoryRels[0].to_entity?.entity_name || null
      } else if (categoryRels?.to_entity?.entity_name) {
        categoryName = categoryRels.to_entity.entity_name
      }

      return {
        ...service,
        category: categoryName // Add category name for easy display
      }
    })
  }, [services])

  // Filter services by branch and category using HERA relationship patterns
  const filteredServices = useMemo(() => {
    if (!servicesWithCategory) return servicesWithCategory

    let filtered = servicesWithCategory

    // Filter by AVAILABLE_AT branch relationship (when branch is selected, not "All Locations")
    // When branch_id is null/undefined, no branch filter applied = show all services
    if (options?.filters?.branch_id) {
      filtered = filtered.filter(s => {
        // Check if service has AVAILABLE_AT relationship with the specified branch
        // Smart Code: HERA.SALON.SERVICE.REL.AVAILABLE_AT.V1
        const availableAtRelationships = s.relationships?.available_at
        if (!availableAtRelationships) return false

        // Handle both array and single relationship formats
        // Check both rel.to_entity?.id (populated) and rel.to_entity_id (raw) for compatibility
        if (Array.isArray(availableAtRelationships)) {
          return availableAtRelationships.some(
            rel => rel.to_entity?.id === options.filters?.branch_id || rel.to_entity_id === options.filters?.branch_id
          )
        } else {
          return availableAtRelationships.to_entity?.id === options.filters?.branch_id || availableAtRelationships.to_entity_id === options.filters?.branch_id
        }
      })
    }
    // When branch_id is null/undefined: no filtering, return all organization services

    // Filter by HAS_CATEGORY relationship if category filter provided
    if (options?.filters?.category_id) {
      filtered = filtered.filter(s => {
        const categoryRelationship =
          s.relationships?.has_category ||
          s.relationships?.HAS_CATEGORY ||
          s.relationships?.category
        if (!categoryRelationship) return false

        // Handle both array and single relationship formats
        // Check both rel.to_entity?.id (populated) and rel.to_entity_id (raw) for compatibility
        if (Array.isArray(categoryRelationship)) {
          return categoryRelationship.some(
            rel => rel.to_entity?.id === options.filters?.category_id || rel.to_entity_id === options.filters?.category_id
          )
        } else {
          return categoryRelationship.to_entity?.id === options.filters?.category_id || categoryRelationship.to_entity_id === options.filters?.category_id
        }
      })
    }

    return filtered
  }, [servicesWithCategory, options?.filters?.branch_id, options?.filters?.category_id])

  // Helper to create service with proper smart codes and relationships
  const createService = async (data: {
    name: string
    price_market: number
    duration_min: number
    commission_rate?: number
    description?: string
    active?: boolean
    requires_booking?: boolean
    category_id?: string
    performed_by_role_ids?: string[]
    required_product_ids?: string[]
    branch_ids?: string[] // Support multiple branches via AVAILABLE_AT relationships
  }) => {
    console.log('[useHeraServicesV2] createService called with data:', {
      ...data,
      category_id: data.category_id,
      category_id_type: typeof data.category_id,
      category_id_value: data.category_id ? `"${data.category_id}"` : 'undefined/empty'
    })

    // Map provided primitives to dynamic_fields payload using preset definitions
    const dynamic_fields: Record<string, any> = {}
    for (const def of SERVICE_PRESET.dynamicFields) {
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
      ...(data.category_id ? { HAS_CATEGORY: [data.category_id] } : {}),
      ...(data.performed_by_role_ids ? { PERFORMED_BY_ROLE: data.performed_by_role_ids } : {}),
      ...(data.required_product_ids ? { REQUIRES_PRODUCT: data.required_product_ids } : {}),
      // Add branch relationships - use AVAILABLE_AT for service availability at branches
      ...(data.branch_ids && data.branch_ids.length > 0 ? { AVAILABLE_AT: data.branch_ids } : {})
    }

    console.log('[useHeraServicesV2] Relationships object built:', {
      relationships,
      hasCategory: !!data.category_id,
      categoryValue: data.category_id
    })

    return baseCreate({
      entity_type: 'service',
      entity_name: data.name,
      smart_code: 'HERA.SALON.SERVICE.ENTITY.SERVICE.V1',
      dynamic_fields,
      metadata: { relationships }
    } as any)
  }

  // Helper to update service
  const updateService = async (
    id: string,
    data: Partial<Parameters<typeof createService>[0]> & { status?: string }
  ) => {
    // 🎯 ENTERPRISE PATTERN: Get entity to ensure entity_name is always passed (same as archive/restore)
    const service = (services as ServiceEntity[])?.find(s => s.id === id)
    if (!service) throw new Error('Service not found')

    // Build dynamic patch from provided fields
    const dynamic_patch: Record<string, any> = {}
    for (const def of SERVICE_PRESET.dynamicFields) {
      const key = def.name as keyof typeof data
      if (key in data && (data as any)[key] !== undefined) {
        dynamic_patch[def.name] = (data as any)[key]
      }
    }

    // Relationships patch
    const relationships_patch: Record<string, string[]> = {}
    if (data.category_id) relationships_patch['HAS_CATEGORY'] = [data.category_id]
    if (data.performed_by_role_ids)
      relationships_patch['PERFORMED_BY_ROLE'] = data.performed_by_role_ids
    if (data.required_product_ids)
      relationships_patch['REQUIRES_PRODUCT'] = data.required_product_ids
    if (data.branch_ids !== undefined) {
      // Support multiple branches - if array is empty, it removes all AVAILABLE_AT relationships
      relationships_patch['AVAILABLE_AT'] = data.branch_ids
    }

    // 🎯 ENTERPRISE PATTERN: Build payload like archive/restore (entity_name always required)
    const payload: any = {
      entity_id: id,
      entity_name: data.name || service.entity_name, // Always include entity_name
      ...(Object.keys(dynamic_patch).length ? { dynamic_patch } : {}),
      ...(Object.keys(relationships_patch).length ? { relationships_patch } : {}),
      // 🎯 CRITICAL: Status at entity level (NOT dynamic field) - same as archive/restore
      ...(data.status !== undefined && { status: data.status })
    }

    return baseUpdate(payload)
  }

  // Helper to archive service (soft delete)
  const archiveService = async (id: string) => {
    return baseArchive(id)
  }

  // Helper to restore service (set status to active)
  const restoreService = async (id: string) => {
    return baseRestore(id)
  }

  // 🎯 ENTERPRISE PATTERN: Smart delete with automatic fallback to archive
  // Try hard delete first, but if service is referenced in transactions, archive instead
  const deleteService = async (
    id: string,
    reason?: string
  ): Promise<{
    success: boolean
    archived: boolean
    message?: string
  }> => {
    const service = (services as ServiceEntity[])?.find(s => s.id === id)
    if (!service) throw new Error('Service not found')

    try {
      // Attempt hard delete with cascade
      await baseDelete({
        entity_id: id,
        hard_delete: true,
        cascade: true,
        reason: reason || 'Permanently delete service',
        smart_code: 'HERA.SALON.SERVICE.DELETE.V1'
      })

      // If we reach here, hard delete succeeded
      return {
        success: true,
        archived: false
      }
    } catch (error: any) {
      // Check if error is due to foreign key constraint (referenced in transactions)
      const is409Conflict =
        error.message?.includes('409') ||
        error.message?.includes('Conflict') ||
        error.message?.includes('referenced') ||
        error.message?.includes('foreign key')

      if (is409Conflict) {
        // Service is referenced - fallback to archive with warning
        await baseUpdate({
          entity_id: id,
          entity_name: service.entity_name,
          status: 'archived'
        })

        return {
          success: true,
          archived: true,
          message:
            'Service is used in appointments or transactions and cannot be deleted. It has been archived instead.'
        }
      }

      // If it's a different error, re-throw it
      throw error
    }
  }

  // Helper to link category
  const linkCategory = async (serviceId: string, categoryId: string) => {
    const service = (services as ServiceEntity[])?.find(s => s.id === serviceId)
    if (service) {
      return updateService(serviceId, {
        category_id: categoryId
      })
    }
    throw new Error('Service not found')
  }

  // Helper to link performed by roles
  const linkPerformedByRoles = async (serviceId: string, roleIds: string[]) => {
    const service = (services as ServiceEntity[])?.find(s => s.id === serviceId)
    if (service) {
      return updateService(serviceId, {
        performed_by_role_ids: roleIds
      })
    }
    throw new Error('Service not found')
  }

  // Helper to calculate service price with commission
  const calculateServicePrice = (service: ServiceEntity) => {
    const price = service.dynamic_fields?.price_market?.value || 0
    const commission = service.dynamic_fields?.commission_rate?.value || 0.5

    return {
      price,
      commission: price * commission,
      net: price * (1 - commission),
      commission_rate: commission
    }
  }

  return {
    services: filteredServices,
    isLoading,
    error,
    refetch,
    createService,
    updateService,
    archiveService,
    restoreService,
    deleteService,
    linkCategory,
    linkPerformedByRoles,
    calculateServicePrice,
    isCreating,
    isUpdating,
    isDeleting
  }
}
