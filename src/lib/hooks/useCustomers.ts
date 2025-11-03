/**
 * Customer Entity Hooks
 * 
 * Provides complete CRUD operations for customers with:
 * - RLS-scoped reads via API routes
 * - API v2 command writes with actor stamping
 * - Smart Code validation built-in
 * - Automatic cache invalidation on mutations
 */

'use client'

import { useCallback, useState, useEffect } from 'react'
import { useHeraEntityListQuery, useHeraEntityQuery, useHeraCacheControl, useHeraQuery } from './useHeraQuery'
import { heraCommand } from '@/lib/hera/client'
import { useOrg } from './useOrg'
import { getFieldConfiguration, validateFormData, formDataToDynamicFields } from '@/lib/field-config'

export interface Customer {
  entity_id: string
  entity_name: string
  entity_type: 'CUSTOMER'
  smart_code: string
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
  dynamic_fields: Record<string, {
    field_value_text?: string
    field_value_number?: number
    field_value_boolean?: boolean
    field_value_json?: any
    smart_code: string
  }>
  relationships?: Array<{
    relationship_type: string
    target_entity_id: string
    target_entity_name: string
  }>
}

export interface CustomersListParams {
  search?: string
  limit?: number
  offset?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface CreateCustomerInput {
  entity_name: string
  dynamic_fields?: Record<string, any>
}

export interface UpdateCustomerInput {
  entity_name?: string
  dynamic_fields?: Record<string, any>
}

/**
 * Hook for listing customers with search and pagination
 * Uses RLS-scoped API endpoint for secure data access
 */
export function useCustomers(params: CustomersListParams = {}) {
  return useHeraEntityListQuery<Customer>(
    'customers',
    {
      search: params.search || '',
      limit: params.limit || 50,
      offset: params.offset || 0,
      sort: params.sort || 'entity_name',
      order: params.order || 'asc'
    },
    {
      requireAuth: true,
      requireOrg: true,
      requireMembership: true,
      revalidateOnFocus: false,
      dedupingInterval: 30000 // Cache for 30 seconds
    }
  )
}

/**
 * Hook for fetching a single customer by ID
 * Uses RLS-scoped API endpoint
 */
export function useCustomer(customerId?: string) {
  return useHeraEntityQuery<Customer>(
    'customers',
    customerId,
    {
      requireAuth: true,
      requireOrg: true,
      requireMembership: true,
      revalidateOnFocus: false,
      dedupingInterval: 60000 // Cache for 1 minute
    }
  )
}

/**
 * Hook for customer mutation operations (CREATE/UPDATE/DELETE)
 * All operations go through API v2 command interface with actor stamping
 */
export function useCustomerMutations() {
  const { orgId } = useOrg()
  const { invalidateEntity } = useHeraCacheControl()

  /**
   * Create a new customer
   * Validates fields against org configuration before submitting
   */
  const createCustomer = useCallback(async (input: CreateCustomerInput) => {
    if (!orgId) {
      throw new Error('No organization context available')
    }

    // Get field configuration for validation
    const token = typeof window !== 'undefined' ? 
      (window as any).__HERA_JWT__ : ''
    const fieldConfig = await getFieldConfiguration('CUSTOMER', orgId, token)
    
    // Validate form data
    const formData = {
      entity_name: input.entity_name,
      ...input.dynamic_fields
    }
    const errors = validateFormData(fieldConfig.fields, formData)
    
    if (Object.keys(errors).length > 0) {
      throw new Error(`Validation failed: ${Object.values(errors).join(', ')}`)
    }

    // Convert to dynamic fields format
    const dynamicFields = formDataToDynamicFields(fieldConfig.fields, formData)

    // Prepare API v2 command
    const payload = {
      op: "entities" as const,
      p_operation: "CREATE" as const,
      p_data: {
        entity_type: "CUSTOMER",
        entity_name: input.entity_name,
        smart_code: "HERA.RETAIL.CUSTOMER.v1",
        organization_id: orgId,
        dynamic_fields: dynamicFields
      }
    }

    const result = await heraCommand(payload, { orgId })

    // Invalidate cache
    await invalidateEntity('customers')

    return result
  }, [orgId, invalidateEntity])

  /**
   * Update an existing customer
   * Validates fields and merges with existing data
   */
  const updateCustomer = useCallback(async (
    customerId: string, 
    input: UpdateCustomerInput
  ) => {
    if (!orgId) {
      throw new Error('No organization context available')
    }

    // Get field configuration for validation
    const token = typeof window !== 'undefined' ? 
      (window as any).__HERA_JWT__ : ''
    const fieldConfig = await getFieldConfiguration('CUSTOMER', orgId, token)
    
    // Validate form data
    const formData = {
      ...(input.entity_name && { entity_name: input.entity_name }),
      ...input.dynamic_fields
    }
    const errors = validateFormData(fieldConfig.fields, formData)
    
    if (Object.keys(errors).length > 0) {
      throw new Error(`Validation failed: ${Object.values(errors).join(', ')}`)
    }

    // Convert to dynamic fields format
    const dynamicFields = formDataToDynamicFields(fieldConfig.fields, formData)

    // Prepare API v2 command
    const payload = {
      op: "entities" as const,
      p_operation: "UPDATE" as const,
      p_data: {
        entity_id: customerId,
        entity_type: "CUSTOMER",
        smart_code: "HERA.RETAIL.CUSTOMER.v1",
        organization_id: orgId,
        ...(input.entity_name && { entity_name: input.entity_name }),
        ...(dynamicFields.length > 0 && { dynamic_fields: dynamicFields })
      }
    }

    const result = await heraCommand(payload, { orgId })

    // Invalidate cache
    await invalidateEntity('customers', customerId)
    await invalidateEntity('customers') // Also invalidate list

    return result
  }, [orgId, invalidateEntity])

  /**
   * Delete a customer
   * Soft delete via API v2 command
   */
  const deleteCustomer = useCallback(async (customerId: string) => {
    if (!orgId) {
      throw new Error('No organization context available')
    }

    // Prepare API v2 command
    const payload = {
      op: "entities" as const,
      p_operation: "DELETE" as const,
      p_data: {
        entity_id: customerId,
        entity_type: "CUSTOMER",
        smart_code: "HERA.RETAIL.CUSTOMER.v1",
        organization_id: orgId
      }
    }

    const result = await heraCommand(payload, { orgId })

    // Invalidate cache
    await invalidateEntity('customers', customerId)
    await invalidateEntity('customers') // Also invalidate list

    return result
  }, [orgId, invalidateEntity])

  return {
    createCustomer,
    updateCustomer,
    deleteCustomer
  }
}

/**
 * Hook for customer search with debouncing
 * Optimized for real-time search interfaces
 */
export function useCustomerSearch(searchTerm: string, debounceMs: number = 300) {
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [searchTerm, debounceMs])

  return useCustomers({
    search: debouncedSearch,
    limit: 10 // Smaller limit for search suggestions
  })
}

/**
 * Hook for customer field configuration
 * Returns org-specific field definitions for forms
 */
export function useCustomerFieldConfig() {
  const { orgId } = useOrg()
  const [fieldConfig, setFieldConfig] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!orgId) return

    let isCancelled = false
    setIsLoading(true)
    setError(null)

    const loadConfig = async () => {
      try {
        const token = typeof window !== 'undefined' ? 
          (window as any).__HERA_JWT__ : ''
        const config = await getFieldConfiguration('CUSTOMER', orgId, token)
        
        if (!isCancelled) {
          setFieldConfig(config)
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load field configuration')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadConfig()

    return () => {
      isCancelled = true
    }
  }, [orgId])

  return { fieldConfig, isLoading, error }
}

/**
 * Hook for customer analytics and metrics
 * Provides dashboard-ready data
 */
export function useCustomerMetrics() {
  return useHeraQuery('/api/v2/customers/metrics', {
    requireAuth: true,
    requireOrg: true,
    requireMembership: true,
    revalidateOnFocus: false,
    refreshInterval: 300000 // Refresh every 5 minutes
  })
}