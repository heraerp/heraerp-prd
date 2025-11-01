/**
 * HERA Services Hook V3
 *
 * ✅ UPGRADED: Now uses useUniversalEntityV1 with RPC hera_entities_crud_v1
 * Thin wrapper over useUniversalEntityV1 for service management
 * Provides service-specific helpers and relationship management
 */

import { useMemo } from 'react'
import { useUniversalEntityV1 } from './useUniversalEntityV1'
import { SERVICE_PRESET } from './entityPresets'
import type { DynamicFieldDef, RelationshipDef } from './useUniversalEntityV1'

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
  // 🔍 DEBUG: Log what we're fetching
  if (process.env.NODE_ENV === 'development') {
    console.log('[useHeraServices] 🔍 Fetching services:', {
      organizationId: options?.organizationId,
      entity_type: 'SERVICE',
      filters: options?.filters
    })
  }

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
  } = useUniversalEntityV1({
    entity_type: 'SERVICE', // ✅ UPPERCASE for RPC pattern
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: true,
      limit: options?.filters?.limit || 50, // ✅ FIXED: Reduced from 100, use passed limit
      ...options?.filters
    },
    dynamicFields: SERVICE_PRESET.dynamicFields as DynamicFieldDef[],
    relationships: SERVICE_PRESET.relationships as RelationshipDef[]
  })

  // 🔍 DEBUG: Log what we got
  if (process.env.NODE_ENV === 'development') {
    console.log('[useHeraServices] 📦 Services loaded:', {
      count: services?.length || 0,
      isLoading,
      hasError: !!error,
      organizationId: options?.organizationId
    })
  }

  // ✅ ENTERPRISE FIX: Fetch categories separately to map IDs to names
  const { entities: categories } = useUniversalEntityV1({
    entity_type: 'SERVICE_CATEGORY',
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: false,
      include_relationships: false,
      limit: 100
    }
  })

  // Map services to include category name from relationships AND flatten dynamic fields
  const servicesWithCategory = useMemo(() => {
    if (!services) return services as ServiceEntity[]

    return (services as ServiceEntity[]).map(service => {
      // ✅ ENTERPRISE FIX: Extract category ID from relationship, then lookup name
      // ✅ HERA STANDARD: Use UPPERCASE relationship keys only
      const categoryRels = service.relationships?.HAS_CATEGORY

      let categoryName = null
      let categoryId = null

      // Get category ID from relationship
      if (Array.isArray(categoryRels) && categoryRels.length > 0) {
        categoryId = categoryRels[0].to_entity_id || categoryRels[0].to_entity?.id
      } else if (categoryRels?.to_entity_id || categoryRels?.to_entity?.id) {
        categoryId = categoryRels.to_entity_id || categoryRels.to_entity?.id
      }

      // Lookup category name from categories list
      if (categoryId && categories) {
        const category = (categories as any[]).find((c: any) => c.id === categoryId)
        categoryName = category?.entity_name || null
      }

      // ✅ ENTERPRISE: Start with base service fields
      const flattenedService: any = {
        ...service,
        category: categoryName
      }

      // ✅ CRITICAL: Force flatten dynamic_fields if they exist in nested format
      if (service.dynamic_fields && typeof service.dynamic_fields === 'object') {
        Object.entries(service.dynamic_fields).forEach(([key, field]) => {
          if (field && typeof field === 'object' && 'value' in field) {
            // Always set from dynamic_fields if value exists, even if already at top level
            flattenedService[key] = field.value
          }
        })
      }

      return flattenedService
    })
  }, [services, categories])

  // Filter services by branch and category using HERA relationship patterns
  const filteredServices = useMemo(() => {
    if (!servicesWithCategory) return servicesWithCategory

    let filtered = servicesWithCategory

    // Filter by AVAILABLE_AT branch relationship (when branch is selected, not "All Locations")
    // When branch_id is null/undefined, no branch filter applied = show all services
    if (options?.filters?.branch_id) {
      filtered = filtered.filter(s => {
        // Check if service has AVAILABLE_AT relationship with the specified branch
        // Smart Code: HERA.SALON.SERVICE.REL.AVAILABLE_AT.v1
        // ✅ HERA STANDARD: Use UPPERCASE relationship keys only
        const availableAtRelationships = s.relationships?.AVAILABLE_AT
        if (!availableAtRelationships) {
          return false
        }

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
        // ✅ HERA STANDARD: Use UPPERCASE relationship keys only
        const categoryRelationship = s.relationships?.HAS_CATEGORY
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
    code?: string // ✅ FIX: Add optional service code field
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
    // ✅ CRITICAL FIX: Map ALL provided fields to dynamic_fields, including those with different names
    // The preset uses 'duration_min' but the data might have 'duration_minutes', etc.
    const dynamic_fields: Record<string, any> = {}

    // Map each preset field definition to the corresponding data field
    for (const def of SERVICE_PRESET.dynamicFields) {
      let value = undefined

      // Check if the exact field name exists in data
      if (def.name in data && (data as any)[def.name] !== undefined) {
        value = (data as any)[def.name]
      }

      // Only add to dynamic_fields if we have a value
      if (value !== undefined) {
        dynamic_fields[def.name] = {
          value: value,
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

    return baseCreate({
      entity_type: 'SERVICE',
      entity_name: data.name,
      entity_code: data.code, // ✅ FIX: Include service code in entity creation
      smart_code: 'HERA.SALON.SERVICE.ENTITY.SERVICE.v1',
      dynamic_fields,
      relationships
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

    // ✅ CRITICAL FIX: Build dynamic patch from provided fields with proper field mapping
    // The preset uses 'duration_min' but the data might have 'duration_minutes', etc.
    const dynamic_patch: Record<string, any> = {}

    // Map each preset field definition to the corresponding data field
    for (const def of SERVICE_PRESET.dynamicFields) {
      let value = undefined

      // Check if the exact field name exists in data
      if (def.name in data && (data as any)[def.name] !== undefined) {
        value = (data as any)[def.name]
      }

      // Only add to dynamic_patch if we have a value
      if (value !== undefined) {
        dynamic_patch[def.name] = value
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
      ...(data.code !== undefined && { entity_code: data.code }), // ✅ FIX: Include service code in updates
      ...(Object.keys(dynamic_patch).length ? { dynamic_patch } : {}),
      ...(Object.keys(relationships_patch).length ? { relationships_patch } : {}),
      // 🎯 CRITICAL: Status at entity level (NOT dynamic field) - same as archive/restore
      ...(data.status !== undefined && { status: data.status })
    }

    return baseUpdate(payload)
  }

  // Helper to archive service (soft delete)
  const archiveService = async (id: string) => {
    const service = (services as ServiceEntity[])?.find(s => s.id === id)
    if (!service) throw new Error('Service not found')

    const result = await baseArchive(id)

    // ✅ NO REFETCH NEEDED: baseArchive updates cache automatically
    // The archive() function in useUniversalEntityV1 handles cache update (lines 1007-1018)

    return result
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
        smart_code: 'HERA.SALON.SERVICE.DELETE.v1'
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
        // Service is referenced - fallback to soft delete (status='deleted') with warning
        await baseUpdate({
          entity_id: id,
          entity_name: service.entity_name,
          status: 'deleted'  // ✅ CORRECT: Use 'deleted' status for hard delete fallback (distinct from archive)
        })

        // ✅ NO REFETCH NEEDED: updateMutation.onSuccess handles cache update automatically

        return {
          success: true,
          archived: true,
          message:
            'Service is used in appointments or transactions and cannot be deleted. It has been marked as deleted instead.'
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
  const calculateServicePrice = (service: any) => {
    // ✅ FIXED: Use flattened fields from servicesWithCategory transformation
    const price = service.price_market || 0
    const commission = service.commission_rate || 0.5

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
