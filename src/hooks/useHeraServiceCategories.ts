'use client'

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getEntities,
  getDynamicData,
  setDynamicDataBatch,
  upsertEntity,
  deleteEntity
} from '@/lib/universal-api-v2-client'
import { ServiceCategory, ServiceCategoryFormValues } from '@/types/salon-service'

export function useHeraServiceCategories({
  organizationId,
  includeArchived = false
}: {
  organizationId?: string
  includeArchived?: boolean
}) {
  const queryClient = useQueryClient()

  // Fetch service categories
  const {
    data: entities,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['serviceCategories', organizationId, { includeArchived }],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required')

      console.log('[useHeraServiceCategories] Fetching categories for org:', organizationId)

      const result = await getEntities('', {
        p_organization_id: organizationId,
        p_entity_type: 'service_category',
        p_status: includeArchived ? undefined : 'active'
      })

      const entities = Array.isArray(result) ? result : []

      console.log('[useHeraServiceCategories] Fetched categories:', {
        count: entities.length,
        categories: entities.map(e => e.entity_name)
      })

      // ✅ PERFORMANCE OPTIMIZATION: Batch fetch dynamic data (NOT N+1)
      // Fetch ALL dynamic data in ONE API call instead of N separate calls
      const entityIds = entities.map(e => e.id)
      let allDynamicData: any[] = []

      if (entityIds.length > 0) {
        try {
          // Batch endpoint: /api/v2/dynamic-data?p_entity_ids=id1,id2,id3
          const response = await fetch(`/api/v2/dynamic-data?p_entity_ids=${entityIds.join(',')}`, {
            headers: {
              'Content-Type': 'application/json',
              'x-hera-api-version': 'v2'
            }
          })

          if (response.ok) {
            const result = await response.json()
            allDynamicData = result.data || []
            console.log('[useHeraServiceCategories] Batch fetched dynamic data:', {
              entities: entityIds.length,
              fields: allDynamicData.length
            })
          }
        } catch (error) {
          console.error('[useHeraServiceCategories] Failed to batch fetch dynamic data:', error)
        }
      }

      // Group dynamic data by entity_id
      const dynamicDataByEntity = new Map<string, any[]>()
      allDynamicData.forEach((field: any) => {
        if (!dynamicDataByEntity.has(field.entity_id)) {
          dynamicDataByEntity.set(field.entity_id, [])
        }
        dynamicDataByEntity.get(field.entity_id)!.push(field)
      })

      // Merge dynamic data into categories
      const categoriesWithDynamicData = entities.map((entity: any) => {
        const dynamicData = dynamicDataByEntity.get(entity.id) || []
        const mergedMetadata = { ...entity.metadata }

        dynamicData.forEach((field: any) => {
          if (field.field_type === 'number') {
            mergedMetadata[field.field_name] = field.field_value_number
          } else if (field.field_type === 'boolean') {
            mergedMetadata[field.field_name] = field.field_value_boolean
          } else if (field.field_type === 'text') {
            mergedMetadata[field.field_name] = field.field_value_text
          } else if (field.field_type === 'json') {
            mergedMetadata[field.field_name] = field.field_value_json
          } else if (field.field_type === 'date') {
            mergedMetadata[field.field_name] = field.field_value_date
          } else {
            // Fallback for unknown types
            mergedMetadata[field.field_name] =
              field.field_value_text ||
              field.field_value_number ||
              field.field_value_boolean ||
              field.field_value_json ||
              field.field_value_date
          }
        })

        return {
          ...entity,
          metadata: mergedMetadata,
          color: mergedMetadata.color || '#D4AF37',
          description: mergedMetadata.description || '',
          service_count: mergedMetadata.service_count || 0
        }
      })

      return categoriesWithDynamicData
    },
    enabled: !!organizationId,
    // ✅ PERFORMANCE OPTIMIZATION: Smart caching (30s staleTime)
    // Categories rarely change - 30s cache provides excellent balance
    staleTime: 30000, // 30 seconds - reduces API calls significantly
    gcTime: 300000, // 5 minutes - keep in cache for 5 min after last use
    refetchOnWindowFocus: false // No unnecessary refetches on tab switch
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
        predicate: query =>
          query.queryKey[0] === 'serviceCategories' && query.queryKey[1] === organizationId
      })
    }
  })

  // Delete mutation - Enhanced RPC implementation
  // Defaults to soft delete (archive) for safety
  const deleteEntityMutation = useMutation({
    mutationFn: async (params: { id: string; hard_delete?: boolean; reason?: string }) => {
      if (!organizationId) throw new Error('Organization ID required')
      return await deleteEntity('', {
        p_organization_id: organizationId,
        p_entity_id: params.id,
        hard_delete: params.hard_delete ?? false, // Soft delete by default
        cascade: true, // Always cascade relationships
        reason: params.reason || 'Archive service category',
        smart_code: 'HERA.SALON.SERVICE.CATEGORY.DELETE.V1'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: query =>
          query.queryKey[0] === 'serviceCategories' && query.queryKey[1] === organizationId
      })
    }
  })

  // Process categories
  const categories = useMemo(() => {
    if (!entities) return []

    return entities.filter(entity => {
      if (!includeArchived && entity.status === 'archived') return false
      return true
    })
  }, [entities, includeArchived])

  // Create category
  const createCategory = async (categoryData: ServiceCategoryFormValues) => {
    if (!organizationId) throw new Error('Organization ID required')

    console.log('[useHeraServiceCategories] Creating category:', categoryData)

    // 1. Create entity
    await createEntity.mutateAsync({
      p_entity_type: 'service_category',
      p_entity_name: categoryData.name,
      p_entity_code: categoryData.name.toUpperCase().replace(/\s+/g, '_'),
      p_smart_code: 'HERA.SALON.SERVICE.CATEGORY.STANDARD.V1',
      p_entity_description: categoryData.description || null,
      p_status: 'active'
    })

    // 2. Get the newly created category
    const allCategories = await getEntities('', {
      p_organization_id: organizationId,
      p_entity_type: 'service_category'
    })

    const newCategory = Array.isArray(allCategories)
      ? allCategories.find(c => c.entity_name === categoryData.name)
      : null

    if (!newCategory) throw new Error('Failed to create category')

    // 3. Save dynamic fields
    const dynamicFields = [
      { field_name: 'color', field_type: 'text', field_value: categoryData.color },
      {
        field_name: 'description',
        field_type: 'text',
        field_value: categoryData.description || ''
      },
      { field_name: 'service_count', field_type: 'number', field_value_number: 0 }
    ]

    await setDynamicDataBatch('', {
      p_organization_id: organizationId,
      p_entity_id: newCategory.id,
      p_smart_code: 'HERA.SALON.SVC.CAT.FIELD.DATA.V1',
      p_fields: dynamicFields as any
    })

    // 4. Invalidate cache
    queryClient.invalidateQueries({
      predicate: query =>
        query.queryKey[0] === 'serviceCategories' && query.queryKey[1] === organizationId
    })

    console.log('[useHeraServiceCategories] Category created successfully')
  }

  // Update category
  const updateCategory = async (categoryId: string, categoryData: ServiceCategoryFormValues) => {
    if (!organizationId) throw new Error('Organization ID required')

    console.log('[useHeraServiceCategories] Updating category:', { categoryId, categoryData })

    const category = entities?.find(c => c.id === categoryId)
    if (!category) throw new Error('Category not found')

    // 1. Update entity
    await updateEntity.mutateAsync({
      id: categoryId,
      updates: {
        p_entity_type: 'service_category',
        p_entity_name: categoryData.name,
        p_entity_code: categoryData.name.toUpperCase().replace(/\s+/g, '_'),
        p_smart_code: 'HERA.SALON.SERVICE.CATEGORY.STANDARD.V1',
        p_entity_description: categoryData.description || null,
        p_status: 'active'
      }
    })

    // 2. Update dynamic fields
    const dynamicFields = [
      { field_name: 'color', field_type: 'text', field_value: categoryData.color },
      { field_name: 'description', field_type: 'text', field_value: categoryData.description || '' }
    ]

    await setDynamicDataBatch('', {
      p_organization_id: organizationId,
      p_entity_id: categoryId,
      p_smart_code: 'HERA.SALON.SVC.CAT.FIELD.DATA.V1',
      p_fields: dynamicFields as any
    })

    // 3. Invalidate cache
    queryClient.invalidateQueries({
      predicate: query =>
        query.queryKey[0] === 'serviceCategories' && query.queryKey[1] === organizationId
    })

    console.log('[useHeraServiceCategories] Category updated successfully')
  }

  // Delete category
  // PRODUCTION PATTERN: Soft delete by default, hard delete only for cleanup
  const deleteCategory = async (
    categoryId: string,
    options?: { hard_delete?: boolean; reason?: string }
  ) => {
    if (!organizationId) throw new Error('Organization ID required')

    const category = entities?.find(c => c.id === categoryId)
    if (!category) throw new Error('Category not found')

    // Check if category has services
    if (category.service_count > 0) {
      throw new Error(
        `Cannot delete category "${category.entity_name}" because it has ${category.service_count} service(s). Please reassign or delete those services first.`
      )
    }

    console.log('[useHeraServiceCategories] Deleting category:', {
      categoryId,
      mode: options?.hard_delete ? 'HARD' : 'SOFT',
      reason: options?.reason
    })

    await deleteEntityMutation.mutateAsync({
      id: categoryId,
      hard_delete: options?.hard_delete,
      reason: options?.reason || `Delete category: ${category.entity_name}`
    })

    console.log('[useHeraServiceCategories] Category deleted successfully')
  }

  // Archive category
  const archiveCategory = async (categoryId: string, archive: boolean = true) => {
    if (!organizationId) throw new Error('Organization ID required')

    const category = entities?.find(c => c.id === categoryId)
    if (!category) throw new Error('Category not found')

    console.log('[useHeraServiceCategories] Archiving category:', { categoryId, archive })

    await updateEntity.mutateAsync({
      id: categoryId,
      updates: {
        p_entity_type: 'service_category',
        p_entity_name: category.entity_name,
        p_entity_code: category.entity_code,
        p_smart_code: category.smart_code,
        p_entity_description: category.entity_description || null,
        p_status: archive ? 'archived' : 'active'
      }
    })
  }

  return {
    categories,
    isLoading,
    error,
    refetch,
    createCategory,
    updateCategory,
    deleteCategory,
    archiveCategory,
    isCreating: createEntity.isPending,
    isUpdating: updateEntity.isPending,
    isDeleting: deleteEntityMutation.isPending
  }
}
