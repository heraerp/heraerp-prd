'use client'

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as universalApi from '@/lib/universal-api-v2-client'
import { Category } from '@/types/salon-category'

export function useHeraCategories({
  includeArchived = false,
  organizationId
}: {
  includeArchived?: boolean
  organizationId?: string
} = {}) {
  const queryClient = useQueryClient()

  // Fetch all category entities using Universal API v2
  const {
    data: entities,
    isLoading,
    error: fetchError,
    refetch
  } = useQuery({
    queryKey: ['categories', organizationId, { includeArchived }],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required')

      const result = await universalApi.getEntities({
        orgId: organizationId,
        entityType: 'service_category',
        status: includeArchived ? undefined : 'active'
      })

      console.log('[useHeraCategories] Fetched categories:', {
        count: result.length,
        organizationId
      })

      return result
    },
    enabled: !!organizationId
  })

  const error = fetchError?.message

  // Transform entities to Category format
  const categories = useMemo(() => {
    if (!entities) return []

    return entities
      .filter(entity => {
        // Filter by status
        if (!includeArchived && entity.status === 'archived') {
          return false
        }
        return true
      })
      .map(entity => {
        // Transform to Category type
        const category: Category = {
          id: entity.id,
          entity_code: entity.entity_code || '',
          entity_name: entity.entity_name,
          entity_type: entity.entity_type,
          organization_id: entity.organization_id,
          classification: entity.classification || 'service_category',
          status: entity.status || 'active',
          created_at: entity.created_at,
          updated_at: entity.updated_at,
          metadata: entity.metadata || {},
          // Category specific fields
          description: entity.metadata?.description || '',
          display_order: parseInt(entity.metadata?.display_order || '0'),
          color_code: entity.metadata?.color_code || '#374151'
        }
        return category
      })
      .sort((a, b) => a.display_order - b.display_order)
  }, [entities, includeArchived])

  return {
    categories,
    isLoading,
    error,
    refetch
  }
}
