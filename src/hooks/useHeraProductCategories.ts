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
import { createHeraCode } from '@/lib/smart-codes'
import { ProductCategory, ProductCategoryFormValues } from '@/types/salon-product-category'

interface UseHeraProductCategoriesOptions {
  organizationId?: string
  includeArchived?: boolean
}

const CATEGORY_ENTITY_TYPE = 'product_category'
const CATEGORY_ENTITY_SMART_CODE_FALLBACK = 'DEFAULT'
const CATEGORY_DYNAMIC_SMART_CODE = 'HERA.SALON.PROD.CATEGORY.FIELD.V1'
const DEFAULT_COLOR = '#D4AF37'
const DEFAULT_ICON = 'Tag'

function buildCategorySmartCode(source?: string) {
  const cleaned = source?.trim() || CATEGORY_ENTITY_SMART_CODE_FALLBACK
  const normalized = cleaned.replace(/[^A-Za-z0-9]+/g, '_') || CATEGORY_ENTITY_SMART_CODE_FALLBACK
  return createHeraCode(['SALON', 'PROD', 'CATEGORY', normalized])
}

function resolveEntityId(response: any): string | undefined {
  return (
    response?.entity_id ||
    response?.data?.entity_id ||
    response?.data?.id ||
    response?.id ||
    response?.data?.data?.entity_id
  )
}

export function useHeraProductCategories({
  organizationId,
  includeArchived = false
}: UseHeraProductCategoriesOptions = {}) {
  const queryClient = useQueryClient()

  const {
    data: categories,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['product-categories', organizationId, { includeArchived }],
    enabled: !!organizationId,
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required')

      const result = await getEntities('', {
        p_organization_id: organizationId,
        p_entity_type: CATEGORY_ENTITY_TYPE,
        p_status: includeArchived ? undefined : 'active'
      })

      // Defensive: ensure result is an array
      const entities = Array.isArray(result) ? result : []

      console.log('[useHeraProductCategories] Fetched categories:', {
        isArray: Array.isArray(result),
        count: entities.length,
        organizationId,
        resultType: typeof result,
        resultKeys: result ? Object.keys(result).slice(0, 5) : []
      })

      const enriched = await Promise.all(
        entities.map(async (entity: any) => {
          let dynamicFields: any[] = []
          try {
            const response = await getDynamicData('', {
              p_organization_id: organizationId,
              p_entity_id: entity.id
            })
            // getDynamicData returns { data: [...] }, so extract the array
            dynamicFields = Array.isArray(response?.data) ? response.data :
                           Array.isArray(response) ? response : []
          } catch (fetchError) {
            console.warn('[useHeraProductCategories] Failed to load dynamic data', {
              entityId: entity.id,
              error: fetchError
            })
          }

          const dynamicMap: Record<string, any> = {}
          if (Array.isArray(dynamicFields)) {
            dynamicFields.forEach(field => {
              if (!field?.field_name) return

              switch (field.field_type) {
                case 'number':
                  dynamicMap[field.field_name] = field.field_value_number ?? null
                  break
                case 'boolean':
                  dynamicMap[field.field_name] = field.field_value_boolean ?? null
                  break
                case 'date':
                case 'datetime':
                  dynamicMap[field.field_name] = field.field_value_date ?? null
                  break
                case 'json':
                  dynamicMap[field.field_name] = field.field_value_json ?? null
                  break
                default:
                  dynamicMap[field.field_name] = field.field_value_text ?? null
              }
            })
          }

          const category: ProductCategory = {
            id: entity.id,
            entity_name: entity.entity_name,
            entity_code: entity.entity_code || null,
            status: entity.status === 'archived' ? 'archived' : 'active',
            smart_code: entity.smart_code,
            description: dynamicMap.description ?? entity.entity_description ?? null,
            color: (dynamicMap.color as string | null) || DEFAULT_COLOR,
            icon: (dynamicMap.icon as string | null) || DEFAULT_ICON,
            sort_order:
              typeof dynamicMap.sort_order === 'number' ? dynamicMap.sort_order : Number(dynamicMap.sort_order) || 0,
            product_count:
              typeof dynamicMap.product_count === 'number'
                ? dynamicMap.product_count
                : Number(dynamicMap.product_count) || 0,
            created_at: entity.created_at || null,
            updated_at: entity.updated_at || null
          }

          return category
        })
      )

      return enriched.sort((a, b) => a.sort_order - b.sort_order)
    }
  })

  const createMutation = useMutation({
    mutationFn: async (payload: ProductCategoryFormValues) => {
      if (!organizationId) throw new Error('Organization ID required')

      console.log('[useHeraProductCategories] Creating category:', payload)

      const smartCode = buildCategorySmartCode(payload.code || payload.name)

      const entityResponse = await upsertEntity('', {
        p_organization_id: organizationId,
        p_entity_type: CATEGORY_ENTITY_TYPE,
        p_entity_name: payload.name,
        p_entity_code: payload.code || null,
        p_smart_code: smartCode,
        p_status: 'active'
        // p_entity_description omitted - goes in dynamic data instead
      })

      console.log('[useHeraProductCategories] Entity created:', entityResponse)

      const entityId = resolveEntityId(entityResponse)
      if (!entityId) {
        throw new Error('Failed to create product category: missing entity id')
      }

      const dynamicFields: DynamicFieldInput[] = [
        { field_name: 'description', field_type: 'text', field_value: payload.description || null },
        { field_name: 'color', field_type: 'text', field_value: payload.color || DEFAULT_COLOR },
        { field_name: 'icon', field_type: 'text', field_value: payload.icon || DEFAULT_ICON },
        {
          field_name: 'sort_order',
          field_type: 'number',
          field_value_number: payload.sort_order ?? 0
        },
        {
          field_name: 'product_count',
          field_type: 'number',
          field_value_number: 0
        }
      ]

      await setDynamicDataBatch('', {
        p_organization_id: organizationId,
        p_entity_id: entityId,
        p_smart_code: CATEGORY_DYNAMIC_SMART_CODE,
        p_fields: dynamicFields
      })

      console.log('[useHeraProductCategories] Category created successfully:', entityId)

      return entityId
    },
    onSuccess: () => {
      // Invalidate ALL category queries for this organization (both active and all)
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'product-categories' &&
          query.queryKey[1] === organizationId
      })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      category,
      payload
    }: {
      category: ProductCategory
      payload: ProductCategoryFormValues
    }) => {
      if (!organizationId) throw new Error('Organization ID required')

      await upsertEntity('', {
        p_organization_id: organizationId,
        p_entity_type: CATEGORY_ENTITY_TYPE,
        p_entity_id: category.id,
        p_entity_name: payload.name,
        p_entity_code: payload.code || category.entity_code || null,
        p_smart_code: category.smart_code
        // p_status and p_entity_description omitted to avoid RPC bug
      })

      const dynamicFields: DynamicFieldInput[] = [
        { field_name: 'description', field_type: 'text', field_value: payload.description || null },
        { field_name: 'color', field_type: 'text', field_value: payload.color || category.color || DEFAULT_COLOR },
        { field_name: 'icon', field_type: 'text', field_value: payload.icon || category.icon || DEFAULT_ICON },
        {
          field_name: 'sort_order',
          field_type: 'number',
          field_value_number: payload.sort_order ?? category.sort_order ?? 0
        }
      ]

      await setDynamicDataBatch('', {
        p_organization_id: organizationId,
        p_entity_id: category.id,
        p_smart_code: CATEGORY_DYNAMIC_SMART_CODE,
        p_fields: dynamicFields
      })
    },
    onSuccess: () => {
      // Invalidate ALL category queries for this organization
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'product-categories' &&
          query.queryKey[1] === organizationId
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      if (!organizationId) throw new Error('Organization ID required')

      await deleteEntity('', {
        p_organization_id: organizationId,
        p_entity_id: categoryId
      })
    },
    onSuccess: () => {
      // Invalidate ALL category queries for this organization
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'product-categories' &&
          query.queryKey[1] === organizationId
      })
    }
  })

  const archiveMutation = useMutation({
    mutationFn: async ({
      category,
      archived
    }: {
      category: ProductCategory
      archived: boolean
    }) => {
      if (!organizationId) throw new Error('Organization ID required')

      await upsertEntity('', {
        p_organization_id: organizationId,
        p_entity_type: CATEGORY_ENTITY_TYPE,
        p_entity_id: category.id,
        p_entity_name: category.entity_name,
        p_entity_code: category.entity_code || null,
        p_smart_code: category.smart_code
        // p_status and p_entity_description omitted to avoid RPC bug
        // Status managed via dynamic data or relationships
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories', organizationId] })
    }
  })

  const memoizedCategories = useMemo(() => categories || [], [categories])

  return {
    categories: memoizedCategories,
    isLoading,
    error: (error as Error | null)?.message,
    refetch,
    createCategory: (payload: ProductCategoryFormValues) => createMutation.mutateAsync(payload),
    updateCategory: (category: ProductCategory, payload: ProductCategoryFormValues) =>
      updateMutation.mutateAsync({ category, payload }),
    deleteCategory: (categoryId: string) => deleteMutation.mutateAsync(categoryId),
    archiveCategory: (category: ProductCategory, archived: boolean) =>
      archiveMutation.mutateAsync({ category, archived }),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isArchiving: archiveMutation.isPending
  }
}
