'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { supabase } from '@/lib/supabase/client'

// Universal entity type definition
export interface UniversalEntity {
  entity_type: string
  entity_name: string
  entity_code?: string
  smart_code: string
  metadata?: Record<string, any>
  dynamic_fields?: Record<
    string,
    {
      value: any
      type: 'text' | 'number' | 'boolean' | 'date' | 'json'
      smart_code: string
    }
  >
}

// Hook configuration
interface UseUniversalEntityConfig {
  entity_type: string
  filters?: {
    status?: string
    limit?: number
    offset?: number
    include_dynamic?: boolean
  }
}

// Helper to get authentication headers
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  
  console.log('🔐 Session debug:', { 
    hasSession: !!session, 
    hasAccessToken: !!session?.access_token,
    tokenPreview: session?.access_token ? session.access_token.substring(0, 20) + '...' : 'none'
  })
  
  if (session?.access_token) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    }
    console.log('🚀 Using Supabase token for API call')
    return headers
  }
  
  // Fallback to demo token for Hair Talkz salon
  console.log('⚠️ Using fallback demo token')
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer demo-token-salon-receptionist'
  }
}

/**
 * Universal hook for ANY entity type
 * Works with products, services, customers, vendors, employees, etc.
 */
export function useUniversalEntity(config: UseUniversalEntityConfig) {
  const { organization } = useHERAAuth()
  const queryClient = useQueryClient()
  const organizationId = organization?.id

  const { entity_type, filters = {} } = config

  // Build query key
  const queryKey = ['entities', entity_type, organizationId, filters]

  // Fetch entities
  const {
    data: entitiesData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        entity_type,
        ...filters,
        limit: (filters.limit || 100).toString(),
        offset: (filters.offset || 0).toString(),
        include_dynamic: (filters.include_dynamic !== false).toString()
      })

      const headers = await getAuthHeaders()
      const response = await fetch(`/api/v2/entities?${params}`, {
        headers
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch entities')
      }
      return response.json()
    },
    enabled: !!organizationId
  })

  // Create entity mutation
  const createMutation = useMutation({
    mutationFn: async (entity: UniversalEntity) => {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/v2/entities', {
        method: 'POST',
        headers,
        body: JSON.stringify(entity)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create entity')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', entity_type] })
    }
  })

  // Update entity mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      entity_id,
      ...updates
    }: Partial<UniversalEntity> & { entity_id: string }) => {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/v2/entities', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ entity_id, ...updates })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update entity')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', entity_type] })
    }
  })

  // Delete entity mutation
  const deleteMutation = useMutation({
    mutationFn: async ({
      entity_id,
      hard_delete = false
    }: {
      entity_id: string
      hard_delete?: boolean
    }) => {
      const params = new URLSearchParams({
        hard_delete: hard_delete.toString()
      })

      const headers = await getAuthHeaders()
      const response = await fetch(`/api/v2/entities/${entity_id}?${params}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete entity')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', entity_type] })
    }
  })

  return {
    // Data
    entities: entitiesData?.data || [],
    pagination: entitiesData?.pagination,
    isLoading,
    error: error?.message,
    refetch,

    // Mutations
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    archive: (entity_id: string) => deleteMutation.mutateAsync({ entity_id, hard_delete: false }),

    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  }
}
