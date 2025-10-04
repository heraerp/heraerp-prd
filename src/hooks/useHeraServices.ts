'use client'

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getEntities,
  getDynamicData,
  setDynamicDataBatch,
  upsertEntity,
  deleteEntity,
  DynamicFieldInput
} from '@/lib/universal-api-v2-client'
import { Service, ServiceFormValues } from '@/types/salon-service'

export function useHeraServices({
  includeArchived = false,
  searchQuery = '',
  categoryFilter = '',
  organizationId
}: {
  includeArchived?: boolean
  searchQuery?: string
  categoryFilter?: string
  organizationId?: string
}) {
  const queryClient = useQueryClient()

  // Fetch services with dynamic data
  const {
    data: entities,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['services', organizationId, { includeArchived }],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required')

      console.log('[useHeraServices] Fetching services for org:', organizationId)

      const result = await getEntities('', {
        p_organization_id: organizationId,
        p_entity_type: 'service',
        p_status: includeArchived ? null : 'active'
      })

      const entities = Array.isArray(result) ? result : []

      console.log('[useHeraServices] Fetched services:', {
        count: entities.length,
        isArray: Array.isArray(result)
      })

      // Fetch dynamic data for each service
      const servicesWithDynamicData = await Promise.all(
        entities.map(async (entity: any, index: number) => {
          try {
            const response = await getDynamicData('', {
              p_organization_id: organizationId,
              p_entity_id: entity.id
            })

            const dynamicData = Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response)
                ? response
                : []

            // Log first service dynamic data
            if (index === 0) {
              console.log('[useHeraServices] First service dynamic data:', {
                entityId: entity.id,
                entityName: entity.entity_name,
                dynamicDataCount: dynamicData.length,
                fields: dynamicData.map((f: any) => ({
                  name: f.field_name,
                  type: f.field_type,
                  value: f.field_value_text || f.field_value_number || f.field_value_boolean
                }))
              })
            }

            // Merge dynamic data into metadata
            const mergedMetadata = { ...entity.metadata }
            dynamicData.forEach((field: any) => {
              if (field.field_type === 'number') {
                mergedMetadata[field.field_name] = field.field_value_number
              } else if (field.field_type === 'boolean') {
                mergedMetadata[field.field_name] = field.field_value_boolean
              } else {
                // Try both field_value and field_value_text for text fields
                mergedMetadata[field.field_name] = field.field_value || field.field_value_text || ''
              }
            })

            // Extract to top level for easy access
            const service = {
              ...entity,
              metadata: mergedMetadata,
              category: mergedMetadata.category || '',
              price: parseFloat(mergedMetadata.price || '0'),
              cost: parseFloat(mergedMetadata.cost || '0'),
              duration_minutes: parseInt(mergedMetadata.duration_minutes || '0'),
              commission_amount: parseFloat(mergedMetadata.commission_amount || '0'),
              commission_type: mergedMetadata.commission_type || 'fixed',
              requires_booking: mergedMetadata.requires_booking === true,
              color: mergedMetadata.color || '#D4AF37',
              currency: mergedMetadata.currency || 'AED'
            }

            // Calculate margin
            if (service.price && service.cost) {
              service.margin = service.price - service.cost
              service.margin_percent = (service.margin / service.price) * 100
            }

            return service
          } catch (error) {
            console.error('[useHeraServices] Failed to fetch dynamic data:', error)
            return entity
          }
        })
      )

      return servicesWithDynamicData
    },
    enabled: !!organizationId
  })

  // Create mutation
  const createEntity = useMutation({
    mutationFn: async (data: any) => {
      if (!organizationId) throw new Error('Organization ID required')
      return await upsertEntity('', {
        p_organization_id: organizationId,
        ...data
      })
    }
  })

  // Update mutation
  const updateEntity = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      if (!organizationId) throw new Error('Organization ID required')
      return await upsertEntity('', {
        p_organization_id: organizationId,
        p_entity_id: id,
        ...updates
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === 'services' && query.queryKey[1] === organizationId
      })
    }
  })

  // Delete mutation
  const deleteEntityMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!organizationId) throw new Error('Organization ID required')
      return await deleteEntity('', {
        p_organization_id: organizationId,
        p_entity_id: id
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === 'services' && query.queryKey[1] === organizationId
      })
    }
  })

  // Transform and filter services
  const services = useMemo(() => {
    if (!entities) return []

    return entities.filter(entity => {
      // Status filter
      if (!includeArchived && entity.status === 'archived') return false

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          entity.entity_name?.toLowerCase().includes(query) ||
          entity.entity_code?.toLowerCase().includes(query) ||
          entity.category?.toLowerCase().includes(query)
        )
      }

      // Category filter
      if (categoryFilter && entity.category !== categoryFilter) return false

      return true
    })
  }, [entities, includeArchived, searchQuery, categoryFilter])

  // Create service
  const createService = async (serviceData: ServiceFormValues) => {
    if (!organizationId) throw new Error('Organization ID required')

    console.log('[useHeraServices] Creating service:', serviceData)

    // 1. Create entity
    await createEntity.mutateAsync({
      p_entity_type: 'service',
      p_entity_name: serviceData.name,
      p_entity_code: serviceData.code || serviceData.name.toUpperCase().replace(/\s+/g, '_'),
      p_smart_code: 'HERA.SALON.SVC.ENT.STANDARD.V1',
      p_entity_description: serviceData.description || null,
      p_status: 'active'
    })

    // 2. Get the newly created service
    const allServices = await getEntities('', {
      p_organization_id: organizationId,
      p_entity_type: 'service'
    })

    const newService = Array.isArray(allServices)
      ? allServices.find(s => s.entity_name === serviceData.name)
      : null

    if (!newService) throw new Error('Failed to create service')

    // 3. Save dynamic fields
    const fields = [
      { name: 'category', value: serviceData.category, type: 'text' },
      { name: 'price', value: serviceData.price, type: 'number' },
      { name: 'duration_minutes', value: serviceData.duration_minutes, type: 'number' },
      { name: 'requires_booking', value: serviceData.requires_booking, type: 'boolean' },
      { name: 'currency', value: serviceData.currency || 'AED', type: 'text' }
    ]

    const dynamicFields = fields
      .filter(f => {
        // For booleans, always include (even if false)
        if (f.type === 'boolean') return true
        // For numbers and text, exclude only if truly null/undefined
        // Allow empty strings for text fields (e.g., clearing a category)
        return f.value !== undefined && f.value !== null
      })
      .map(f => {
        if (f.type === 'number') {
          return { field_name: f.name, field_type: 'number', field_value_number: Number(f.value) }
        } else if (f.type === 'boolean') {
          return {
            field_name: f.name,
            field_type: 'boolean',
            field_value_boolean: Boolean(f.value)
          }
        } else {
          return { field_name: f.name, field_type: 'text', field_value: String(f.value) }
        }
      })

    if (dynamicFields.length > 0) {
      await setDynamicDataBatch('', {
        p_organization_id: organizationId,
        p_entity_id: newService.id,
        p_smart_code: 'HERA.SALON.SVC.FIELD.DATA.V1',
        p_fields: dynamicFields as any
      })
    }

    // 4. Invalidate cache
    queryClient.invalidateQueries({
      predicate: query => query.queryKey[0] === 'services' && query.queryKey[1] === organizationId
    })

    console.log('[useHeraServices] Service created successfully')
  }

  // Update service
  const updateService = async (serviceId: string, serviceData: ServiceFormValues) => {
    if (!organizationId) throw new Error('Organization ID required')

    console.log('[useHeraServices] Updating service:', { serviceId, serviceData })

    // 1. Update entity
    await updateEntity.mutateAsync({
      id: serviceId,
      updates: {
        p_entity_type: 'service',
        p_entity_name: serviceData.name,
        p_entity_code: serviceData.code || serviceData.name.toUpperCase().replace(/\s+/g, '_'),
        p_smart_code: 'HERA.SALON.SVC.ENT.STANDARD.V1',
        p_entity_description: serviceData.description || null,
        p_status: serviceData.status || 'active'
      }
    })

    // 2. Update dynamic fields
    const fields = [
      { name: 'category', value: serviceData.category, type: 'text' },
      { name: 'price', value: serviceData.price, type: 'number' },
      { name: 'duration_minutes', value: serviceData.duration_minutes, type: 'number' },
      { name: 'requires_booking', value: serviceData.requires_booking, type: 'boolean' },
      { name: 'currency', value: serviceData.currency || 'AED', type: 'text' }
    ]

    const dynamicFields = fields
      .filter(f => {
        // For booleans, always include (even if false)
        if (f.type === 'boolean') return true
        // For numbers and text, exclude only if truly null/undefined
        // Allow empty strings for text fields (e.g., clearing a category)
        return f.value !== undefined && f.value !== null
      })
      .map(f => {
        if (f.type === 'number') {
          return { field_name: f.name, field_type: 'number', field_value_number: Number(f.value) }
        } else if (f.type === 'boolean') {
          return {
            field_name: f.name,
            field_type: 'boolean',
            field_value_boolean: Boolean(f.value)
          }
        } else {
          return { field_name: f.name, field_type: 'text', field_value: String(f.value) }
        }
      })

    if (dynamicFields.length > 0) {
      await setDynamicDataBatch('', {
        p_organization_id: organizationId,
        p_entity_id: serviceId,
        p_smart_code: 'HERA.SALON.SVC.FIELD.DATA.V1',
        p_fields: dynamicFields as any
      })

      // CRITICAL: Invalidate cache after dynamic data update
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === 'services' && query.queryKey[1] === organizationId
      })
    }

    console.log('[useHeraServices] Service updated successfully')
  }

  // Delete service
  const deleteService = async (serviceId: string) => {
    if (!organizationId) throw new Error('Organization ID required')

    console.log('[useHeraServices] Deleting service:', serviceId)

    await deleteEntityMutation.mutateAsync(serviceId)

    console.log('[useHeraServices] Service deleted successfully')
  }

  // Archive service
  const archiveService = async (serviceId: string, archive: boolean = true) => {
    if (!organizationId) throw new Error('Organization ID required')

    const service = entities?.find(s => s.id === serviceId)
    if (!service) throw new Error('Service not found')

    console.log('[useHeraServices] Archiving service:', { serviceId, archive })

    await updateEntity.mutateAsync({
      id: serviceId,
      updates: {
        p_entity_type: 'service',
        p_entity_name: service.entity_name,
        p_entity_code: service.entity_code,
        p_smart_code: service.smart_code,
        p_entity_description: service.entity_description || null,
        p_status: archive ? 'archived' : 'active'
      }
    })
  }

  return {
    services,
    isLoading,
    error,
    refetch,
    createService,
    updateService,
    deleteService,
    archiveService,
    isCreating: createEntity.isPending,
    isUpdating: updateEntity.isPending,
    isDeleting: deleteEntityMutation.isPending
  }
}
