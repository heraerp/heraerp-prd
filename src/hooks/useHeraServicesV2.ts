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
    branch_id?: string  // Add branch filtering
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
    isCreating,
    isUpdating,
    isDeleting
  } = useUniversalEntity({
    entity_type: 'service',
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: true,
      limit: 100,
      ...options?.filters
    },
    dynamicFields: SERVICE_PRESET.dynamicFields as DynamicFieldDef[],
    relationships: SERVICE_PRESET.relationships as RelationshipDef[]
  })

  // Filter services by branch if branch_id is provided
  const filteredServices = useMemo(() => {
    if (!services) return services as ServiceEntity[]
    
    let filtered = services as ServiceEntity[]
    
    // Filter by branch relationship
    if (options?.filters?.branch_id) {
      filtered = filtered.filter(s => {
        // Check if service has AVAILABLE_AT relationship with the specified branch
        const availableAtRelationships = s.relationships?.available_at
        if (!availableAtRelationships) return false
        
        if (Array.isArray(availableAtRelationships)) {
          return availableAtRelationships.some(rel => rel.to_entity?.id === options.filters?.branch_id)
        } else {
          return availableAtRelationships.to_entity?.id === options.filters?.branch_id
        }
      })
    }
    
    // Filter by category if provided
    if (options?.filters?.category_id) {
      filtered = filtered.filter(s => {
        const categoryRelationship = s.relationships?.category
        if (!categoryRelationship) return false
        
        if (Array.isArray(categoryRelationship)) {
          return categoryRelationship.some(rel => rel.to_entity?.id === options.filters?.category_id)
        } else {
          return categoryRelationship.to_entity?.id === options.filters?.category_id
        }
      })
    }
    
    return filtered
  }, [services, options?.filters?.branch_id, options?.filters?.category_id])

  // Helper to create service with proper smart codes and relationships
  const createService = async (data: {
    name: string
    price_market: number
    duration_min: number
    commission_rate?: number
    description?: string
    active?: boolean
    category_id?: string
    performed_by_role_ids?: string[]
    required_product_ids?: string[]
    branch_id?: string  // Add branch support
  }) => {
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
      // Add branch relationship - use AVAILABLE_AT for service availability at branches
      ...(data.branch_id ? { AVAILABLE_AT: [data.branch_id] } : {})
    }

    return baseCreate({
      entity_type: 'service',
      entity_name: data.name,
      smart_code: 'HERA.SALON.SERVICE.ENTITY.SERVICE.V1',
      dynamic_fields,
      metadata: { relationships }
    } as any)
  }

  // Helper to update service
  const updateService = async (id: string, data: Partial<Parameters<typeof createService>[0]>) => {
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
    if (data.performed_by_role_ids) relationships_patch['PERFORMED_BY_ROLE'] = data.performed_by_role_ids
    if (data.required_product_ids) relationships_patch['REQUIRES_PRODUCT'] = data.required_product_ids
    if (data.branch_id) relationships_patch['AVAILABLE_AT'] = [data.branch_id]

    const payload: any = {
      entity_id: id,
      ...(data.name && { entity_name: data.name }),
      ...(Object.keys(dynamic_patch).length ? { dynamic_patch } : {}),
      ...(Object.keys(relationships_patch).length ? { relationships_patch } : {})
    }

    return baseUpdate(payload)
  }

  // Helper to archive service (soft delete)
  const archiveService = async (id: string) => {
    return baseArchive(id)
  }

  // Helper to delete service (hard delete)
  const deleteService = async (id: string, hardDelete = false) => {
    if (!hardDelete) {
      return archiveService(id)
    }
    return baseDelete(id)
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
    deleteService,
    linkCategory,
    linkPerformedByRoles,
    calculateServicePrice,
    isCreating,
    isUpdating,
    isDeleting
  }
}