/**
 * Entity CRUD Hook Template
 *
 * Description: Reusable hook for entity Create, Read, Update, Delete operations
 * with React Query integration, optimistic updates, and error handling.
 *
 * Usage:
 * ```typescript
 * const { entities, isLoading, createEntity, updateEntity, deleteEntity } = useEntityCRUD({
 *   entity_type: 'CUSTOMER',
 *   organizationId: org.id
 * })
 * ```
 *
 * Features:
 * - Complete CRUD operations with Universal API v2
 * - React Query caching and invalidation
 * - Optimistic updates with rollback
 * - Loading and error states
 * - Toast notifications
 *
 * Related Documentation:
 * - /docs/salon/technical/HOOKS.md - Custom hooks reference
 * - /docs/salon/technical/API-ROUTES.md - API patterns
 * - /docs/salon/technical/DATA-MODELS.md - Entity structure
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEntities, upsertEntity, deleteEntity as deleteEntityAPI } from '@/lib/universal-api-v2-client'
import { toast } from 'sonner'

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

interface EntityCRUDOptions {
  entity_type: string          // Entity type (e.g., 'CUSTOMER', 'SERVICE')
  organizationId?: string      // Organization context (required)
  filters?: {
    include_dynamic?: boolean  // Include dynamic fields
    include_relationships?: boolean  // Include relationships
    status?: string            // Filter by status
    limit?: number             // Page size
    offset?: number            // Pagination offset
    [key: string]: any         // Additional filters
  }
  enabled?: boolean            // Enable/disable query
}

interface CreateEntityInput {
  entity_type: string
  entity_name: string
  smart_code: string
  organization_id: string
  entity_code?: string
  entity_description?: string
  metadata?: any
  dynamic_fields?: Array<{
    field_name: string
    field_value: any
    field_type: string
    smart_code?: string
  }>
  relationships?: Array<{
    to_entity_id: string
    relationship_type: string
    relationship_data?: any
  }>
}

interface UpdateEntityInput extends Partial<CreateEntityInput> {
  p_entity_id: string
  organization_id: string
}

interface DeleteEntityInput {
  entity_id: string
  organization_id: string
  hard_delete?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useEntityCRUD(options: EntityCRUDOptions) {
  const queryClient = useQueryClient()
  const { entity_type, organizationId, filters = {}, enabled = true } = options

  // Query key for caching
  const queryKey = ['entities', entity_type, organizationId, filters]

  // ───────────────────────────────────────────────────────────────────────────
  // READ: Fetch entities
  // ───────────────────────────────────────────────────────────────────────────
  const {
    data: entities = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      const { data } = await getEntities('', {
        p_organization_id: organizationId,
        p_entity_type: entity_type,
        p_status: filters.status || null,
        p_include_dynamic: filters.include_dynamic ?? true,
        p_include_relationships: filters.include_relationships ?? false,
        ...filters
      })

      return data || []
    },
    enabled: enabled && !!organizationId,
    staleTime: 5 * 60 * 1000,    // 5 minutes - data stays fresh
    cacheTime: 10 * 60 * 1000,   // 10 minutes - cache persists
    refetchOnWindowFocus: false, // Don't refetch on tab switch
  })

  // ───────────────────────────────────────────────────────────────────────────
  // CREATE: Add new entity
  // ───────────────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (input: CreateEntityInput) => {
      return upsertEntity('', input)
    },
    onMutate: async (newEntity) => {
      // Cancel outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey })

      // Snapshot the previous value
      const previousEntities = queryClient.getQueryData(queryKey)

      // Optimistically update cache
      queryClient.setQueryData(queryKey, (old: any[] = []) => {
        return [...old, {
          ...newEntity,
          id: 'temp-' + Date.now(), // Temporary ID
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]
      })

      // Return context for rollback
      return { previousEntities }
    },
    onError: (err, newEntity, context) => {
      // Rollback on error
      if (context?.previousEntities) {
        queryClient.setQueryData(queryKey, context.previousEntities)
      }

      console.error('Failed to create entity:', err)
      toast.error('Failed to create item. Please try again.')
    },
    onSuccess: (data) => {
      toast.success('Item created successfully!')
    },
    onSettled: () => {
      // Refetch to ensure cache consistency
      queryClient.invalidateQueries({ queryKey })
    }
  })

  // ───────────────────────────────────────────────────────────────────────────
  // UPDATE: Modify existing entity
  // ───────────────────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async (input: UpdateEntityInput) => {
      return upsertEntity('', input)
    },
    onMutate: async (updatedEntity) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot the previous value
      const previousEntities = queryClient.getQueryData(queryKey)

      // Optimistically update cache
      queryClient.setQueryData(queryKey, (old: any[] = []) => {
        return old.map(entity =>
          entity.id === updatedEntity.p_entity_id
            ? { ...entity, ...updatedEntity, updated_at: new Date().toISOString() }
            : entity
        )
      })

      // Return context for rollback
      return { previousEntities }
    },
    onError: (err, updatedEntity, context) => {
      // Rollback on error
      if (context?.previousEntities) {
        queryClient.setQueryData(queryKey, context.previousEntities)
      }

      console.error('Failed to update entity:', err)
      toast.error('Failed to update item. Please try again.')
    },
    onSuccess: () => {
      toast.success('Item updated successfully!')
    },
    onSettled: () => {
      // Refetch to ensure cache consistency
      queryClient.invalidateQueries({ queryKey })
    }
  })

  // ───────────────────────────────────────────────────────────────────────────
  // DELETE: Remove entity (soft delete by default)
  // ───────────────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (input: DeleteEntityInput) => {
      return deleteEntityAPI('', input)
    },
    onMutate: async (deletedEntity) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot the previous value
      const previousEntities = queryClient.getQueryData(queryKey)

      // Optimistically update cache (remove from list)
      queryClient.setQueryData(queryKey, (old: any[] = []) => {
        return old.filter(entity => entity.id !== deletedEntity.entity_id)
      })

      // Return context for rollback
      return { previousEntities }
    },
    onError: (err, deletedEntity, context) => {
      // Rollback on error
      if (context?.previousEntities) {
        queryClient.setQueryData(queryKey, context.previousEntities)
      }

      console.error('Failed to delete entity:', err)
      toast.error('Failed to delete item. Please try again.')
    },
    onSuccess: () => {
      toast.success('Item deleted successfully!')
    },
    onSettled: () => {
      // Refetch to ensure cache consistency
      queryClient.invalidateQueries({ queryKey })
    }
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Return Hook API
  // ───────────────────────────────────────────────────────────────────────────
  return {
    // Data
    entities,
    isLoading,
    error,

    // Actions
    refetch,
    createEntity: createMutation.mutateAsync,
    updateEntity: updateMutation.mutateAsync,
    deleteEntity: deleteMutation.mutateAsync,

    // Mutation states
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isMutating: createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE EXAMPLES
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Example 1: Basic Customer Management
export function useCustomerManagement(organizationId: string) {
  return useEntityCRUD({
    entity_type: 'CUSTOMER',
    organizationId,
    filters: {
      include_dynamic: true,
      status: 'active'
    }
  })
}

// Example 2: Service Catalog with Relationships
export function useServiceCatalog(organizationId: string) {
  return useEntityCRUD({
    entity_type: 'SERVICE',
    organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: true, // Include category relationships
      status: 'active'
    }
  })
}

// Example 3: Product Management with Branch Filtering
export function useProductManagement(organizationId: string, branchId?: string) {
  return useEntityCRUD({
    entity_type: 'PRODUCT',
    organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: !!branchId, // Only fetch relationships when filtering by branch
      branch_id: branchId,
      status: 'active'
    }
  })
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * COMPONENT USAGE EXAMPLE
 * ─────────────────────────────────────────────────────────────────────────────
 */

/*
function CustomerPage() {
  const { organization } = useHERAAuth()
  const {
    entities: customers,
    isLoading,
    createEntity,
    updateEntity,
    deleteEntity
  } = useCustomerManagement(organization?.id)

  const handleCreateCustomer = async (formData: any) => {
    await createEntity({
      entity_type: 'CUSTOMER',
      entity_name: formData.name,
      smart_code: 'HERA.SALON.CUSTOMER.v1',
      organization_id: organization.id,
      dynamic_fields: [
        {
          field_name: 'phone',
          field_value: formData.phone,
          field_type: 'text',
          smart_code: 'HERA.SALON.CUSTOMER.FIELD.PHONE.v1'
        },
        {
          field_name: 'email',
          field_value: formData.email,
          field_type: 'email',
          smart_code: 'HERA.SALON.CUSTOMER.FIELD.EMAIL.v1'
        }
      ]
    })
  }

  const handleUpdateCustomer = async (customerId: string, formData: any) => {
    await updateEntity({
      p_entity_id: customerId,
      entity_name: formData.name,
      organization_id: organization.id,
      dynamic_fields: [
        {
          field_name: 'phone',
          field_value: formData.phone,
          field_type: 'text'
        }
      ]
    })
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm('Are you sure?')) {
      await deleteEntity({
        entity_id: customerId,
        organization_id: organization.id,
        hard_delete: false // Soft delete
      })
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <button onClick={() => handleCreateCustomer(formData)}>
        Create Customer
      </button>
      {customers.map(customer => (
        <div key={customer.id}>
          <span>{customer.entity_name}</span>
          <button onClick={() => handleUpdateCustomer(customer.id, formData)}>
            Edit
          </button>
          <button onClick={() => handleDeleteCustomer(customer.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}
*/

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TESTING EXAMPLE
 * ─────────────────────────────────────────────────────────────────────────────
 */

/*
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

describe('useEntityCRUD', () => {
  const queryClient = new QueryClient()
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  it('should fetch entities', async () => {
    const { result } = renderHook(
      () => useEntityCRUD({
        entity_type: 'CUSTOMER',
        organizationId: 'org-123'
      }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.entities).toBeInstanceOf(Array)
  })

  it('should create entity with optimistic update', async () => {
    const { result } = renderHook(
      () => useEntityCRUD({
        entity_type: 'CUSTOMER',
        organizationId: 'org-123'
      }),
      { wrapper }
    )

    await result.current.createEntity({
      entity_type: 'CUSTOMER',
      entity_name: 'Test Customer',
      smart_code: 'HERA.SALON.CUSTOMER.v1',
      organization_id: 'org-123'
    })

    await waitFor(() => {
      expect(result.current.entities).toContainEqual(
        expect.objectContaining({ entity_name: 'Test Customer' })
      )
    })
  })
})
*/

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PERFORMANCE NOTES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * - React Query caching reduces API calls (5-minute staleTime)
 * - Optimistic updates provide instant UI feedback
 * - Automatic cache invalidation ensures data consistency
 * - Query deduplication prevents duplicate requests
 * - Smart relationship fetching (only when needed)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CUSTOMIZATION GUIDE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. Add Entity-Specific Validation:
 *    - Add Zod schemas for create/update inputs
 *    - Validate before mutation
 *
 * 2. Add Pagination Support:
 *    - Use useInfiniteQuery for infinite scroll
 *    - Add offset/limit to filters
 *
 * 3. Add Search/Filtering:
 *    - Add search parameter to filters
 *    - Debounce search input
 *    - Consider server-side filtering for large datasets
 *
 * 4. Add Sorting:
 *    - Add sort_by and sort_order to filters
 *    - Update query key to include sort params
 *
 * 5. Add Batch Operations:
 *    - Create bulkCreate, bulkUpdate, bulkDelete mutations
 *    - Handle optimistic updates for multiple items
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */
