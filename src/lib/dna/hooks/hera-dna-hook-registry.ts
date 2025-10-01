/**
 * HERA DNA HOOK REGISTRY
 * Smart Code: HERA.DNA.HOOKS.REGISTRY.V1
 *
 * Centralized registry of all HERA DNA hooks organized by functionality
 * with CRUD patterns and smart codes for reusability
 */

import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useUniversalApi } from '@/hooks/useUniversalApi'

// ================================================================================
// AUTHENTICATION & AUTHORIZATION HOOKS
// ================================================================================

/**
 * Core Authentication Hook
 * Smart Code: HERA.DNA.HOOKS.AUTH.CORE.V1
 *
 * Usage:
 * const { user, organization, isAuthenticated, isLoading } = useHERAAuth()
 */
export { useHERAAuth } from '@/components/auth/HERAAuthProvider'

/**
 * Demo Organization Pattern
 * Smart Code: HERA.DNA.HOOKS.AUTH.DEMO.V1
 *
 * Usage:
 * const { organizationId, organizationName, orgLoading } = useDemoOrganization()
 */
export { useDemoOrganization } from '@/lib/dna/patterns/demo-org-pattern'

/**
 * Industry-Specific Auth Hooks
 * Smart Code: HERA.DNA.HOOKS.AUTH.INDUSTRY.V1
 */
export {
  useSalonAuth, // HERA.DNA.HOOKS.AUTH.SALON.V1
  useRestaurantAuth, // HERA.DNA.HOOKS.AUTH.RESTAURANT.V1
  useHealthcareAuth, // HERA.DNA.HOOKS.AUTH.HEALTHCARE.V1
  useManufacturingAuth // HERA.DNA.HOOKS.AUTH.MANUFACTURING.V1
} from '@/lib/dna/hooks/useHERAAuthDNA'

// ================================================================================
// DATA OPERATIONS HOOKS (CRUD)
// ================================================================================

/**
 * Universal API Hook - Core CRUD Operations
 * Smart Code: HERA.DNA.HOOKS.API.UNIVERSAL.V1
 *
 * Usage:
 * const api = useUniversalApi(organizationId)
 * await api.execute({
 *   table: 'core_entities',
 *   method: 'POST',
 *   data: { entity_type: 'customer', entity_name: 'John Doe' }
 * })
 */
export { useUniversalApi } from '@/hooks/useUniversalApi'

// ================================================================================
// CRUD PATTERN HOOKS
// ================================================================================

/**
 * CREATE Hook Pattern
 * Smart Code: HERA.DNA.HOOKS.CRUD.CREATE.V1
 */
export const useCreateEntity = () => {
  const { organization } = useHERAAuth()
  const api = useUniversalApi(organization?.id)

  return async (entityData: {
    entity_type: string
    entity_name: string
    smart_code: string
    metadata?: any
  }) => {
    return api.execute({
      table: 'core_entities',
      method: 'POST',
      data: {
        ...entityData,
        organization_id: organization?.id
      }
    })
  }
}

/**
 * READ Hook Pattern
 * Smart Code: HERA.DNA.HOOKS.CRUD.READ.V1
 */
export const useReadEntities = () => {
  const { organization } = useHERAAuth()
  const api = useUniversalApi(organization?.id)

  return async (filters?: { entity_type?: string; smart_code?: string; [key: string]: any }) => {
    return api.execute({
      table: 'core_entities',
      method: 'GET',
      filters: {
        ...filters,
        organization_id: organization?.id
      }
    })
  }
}

/**
 * UPDATE Hook Pattern
 * Smart Code: HERA.DNA.HOOKS.CRUD.UPDATE.V1
 */
export const useUpdateEntity = () => {
  const { organization } = useHERAAuth()
  const api = useUniversalApi(organization?.id)

  return async (
    entityId: string,
    updates: Partial<{
      entity_name: string
      smart_code: string
      metadata: any
    }>
  ) => {
    return api.execute({
      table: 'core_entities',
      method: 'PUT',
      data: {
        id: entityId,
        ...updates,
        organization_id: organization?.id
      }
    })
  }
}

/**
 * DELETE Hook Pattern
 * Smart Code: HERA.DNA.HOOKS.CRUD.DELETE.V1
 */
export const useDeleteEntity = () => {
  const { organization } = useHERAAuth()
  const api = useUniversalApi(organization?.id)

  return async (entityId: string) => {
    return api.execute({
      table: 'core_entities',
      method: 'DELETE',
      data: {
        id: entityId,
        organization_id: organization?.id
      }
    })
  }
}

// ================================================================================
// TRANSACTION HOOKS
// ================================================================================

/**
 * Create Transaction Hook
 * Smart Code: HERA.DNA.HOOKS.TXN.CREATE.V1
 */
export const useCreateTransaction = () => {
  const { organization } = useHERAAuth()
  const api = useUniversalApi(organization?.id)

  return async (transactionData: {
    transaction_type: string
    transaction_date: string
    total_amount: number
    smart_code: string
    metadata?: any
    source_entity_id?: string
    target_entity_id?: string
  }) => {
    return api.execute({
      table: 'universal_transactions',
      method: 'POST',
      data: {
        ...transactionData,
        organization_id: organization?.id,
        transaction_code: `TXN-${Date.now()}` // Auto-generate code
      }
    })
  }
}

/**
 * Create Transaction Lines Hook
 * Smart Code: HERA.DNA.HOOKS.TXN.LINES.CREATE.V1
 */
export const useCreateTransactionLines = () => {
  const { organization } = useHERAAuth()
  const api = useUniversalApi(organization?.id)

  return async (
    transactionId: string,
    lines: Array<{
      line_number: number
      line_entity_id?: string
      quantity?: number
      unit_price?: number
      line_amount: number
      smart_code: string
      metadata?: any
    }>
  ) => {
    return Promise.all(
      lines.map(line =>
        api.execute({
          table: 'universal_transaction_lines',
          method: 'POST',
          data: {
            ...line,
            transaction_id: transactionId,
            organization_id: organization?.id
          }
        })
      )
    )
  }
}

// ================================================================================
// DYNAMIC DATA HOOKS
// ================================================================================

/**
 * Set Dynamic Field Hook
 * Smart Code: HERA.DNA.HOOKS.DYNAMIC.SET.V1
 */
export const useSetDynamicField = () => {
  const { organization } = useHERAAuth()
  const api = useUniversalApi(organization?.id)

  return async (entityId: string, fieldName: string, value: any, smartCode: string) => {
    const fieldData: any = {
      entity_id: entityId,
      field_name: fieldName,
      smart_code: smartCode,
      organization_id: organization?.id
    }

    // Set appropriate field type based on value
    if (typeof value === 'string') {
      fieldData.field_value_text = value
    } else if (typeof value === 'number') {
      fieldData.field_value_number = value
    } else if (value instanceof Date) {
      fieldData.field_value_date = value.toISOString()
    } else {
      fieldData.metadata = value
    }

    return api.execute({
      table: 'core_dynamic_data',
      method: 'POST',
      data: fieldData
    })
  }
}

/**
 * Get Dynamic Fields Hook
 * Smart Code: HERA.DNA.HOOKS.DYNAMIC.GET.V1
 */
export const useGetDynamicFields = () => {
  const { organization } = useHERAAuth()
  const api = useUniversalApi(organization?.id)

  return async (entityId: string) => {
    return api.execute({
      table: 'core_dynamic_data',
      method: 'GET',
      filters: {
        entity_id: entityId,
        organization_id: organization?.id
      }
    })
  }
}

// ================================================================================
// RELATIONSHIP HOOKS
// ================================================================================

/**
 * Create Relationship Hook
 * Smart Code: HERA.DNA.HOOKS.REL.CREATE.V1
 */
export const useCreateRelationship = () => {
  const { organization } = useHERAAuth()
  const api = useUniversalApi(organization?.id)

  return async (relationshipData: {
    from_entity_id: string
    to_entity_id: string
    relationship_type: string
    smart_code: string
    metadata?: any
  }) => {
    return api.execute({
      table: 'core_relationships',
      method: 'POST',
      data: {
        ...relationshipData,
        organization_id: organization?.id
      }
    })
  }
}

/**
 * Get Entity Relationships Hook
 * Smart Code: HERA.DNA.HOOKS.REL.GET.V1
 */
export const useGetRelationships = () => {
  const { organization } = useHERAAuth()
  const api = useUniversalApi(organization?.id)

  return async (entityId: string, relationshipType?: string) => {
    const filters: any = {
      organization_id: organization?.id,
      $or: [{ from_entity_id: entityId }, { to_entity_id: entityId }]
    }

    if (relationshipType) {
      filters.relationship_type = relationshipType
    }

    return api.execute({
      table: 'core_relationships',
      method: 'GET',
      filters
    })
  }
}

// ================================================================================
// COMPOSITE HOOKS (COMMON PATTERNS)
// ================================================================================

/**
 * Create Entity with Status Hook
 * Smart Code: HERA.DNA.HOOKS.COMPOSITE.ENTITY.STATUS.V1
 *
 * Creates an entity and assigns initial status via relationship
 */
export const useCreateEntityWithStatus = () => {
  const createEntity = useCreateEntity()
  const createRelationship = useCreateRelationship()
  const { organization } = useHERAAuth()

  return async (entityData: Parameters<typeof createEntity>[0], statusEntityId: string) => {
    // Create the entity
    const entityResult = await createEntity(entityData)

    if (entityResult.data?.id) {
      // Create status relationship
      await createRelationship({
        from_entity_id: entityResult.data.id,
        to_entity_id: statusEntityId,
        relationship_type: 'has_status',
        smart_code: 'HERA.DNA.REL.STATUS.ASSIGN.V1',
        metadata: {
          assigned_at: new Date().toISOString(),
          assigned_by: organization?.id
        }
      })
    }

    return entityResult
  }
}

/**
 * Create Complete Transaction Hook
 * Smart Code: HERA.DNA.HOOKS.COMPOSITE.TXN.COMPLETE.V1
 *
 * Creates transaction header and lines in one operation
 */
export const useCreateCompleteTransaction = () => {
  const createTransaction = useCreateTransaction()
  const createTransactionLines = useCreateTransactionLines()

  return async (
    transactionData: Parameters<typeof createTransaction>[0],
    lines: Parameters<typeof createTransactionLines>[1]
  ) => {
    // Create transaction header
    const txnResult = await createTransaction(transactionData)

    if (txnResult.data?.id) {
      // Create transaction lines
      const linesResult = await createTransactionLines(txnResult.data.id, lines)

      return {
        transaction: txnResult.data,
        lines: linesResult
      }
    }

    return txnResult
  }
}
