// ================================================================================
// UNIVERSAL API CLIENT HOOK
// Smart Code: HERA.HOOK.UNIVERSAL.API.V1
// React hook for Sacred Six table operations with org filtering
// ================================================================================

'use client'

import { useState, useCallback } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

interface UniversalApiOptions {
  table:
    | 'core_entities'
    | 'universal_transactions'
    | 'universal_transaction_lines'
    | 'core_dynamic_data'
    | 'core_relationships'
    | 'core_organizations'
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  filters?: Record<string, any>
}

interface UseUniversalApiReturn {
  isLoading: boolean
  error: string | null
  data: any
  execute: (options: UniversalApiOptions) => Promise<any>
  clearError: () => void
}

export function useUniversalApi(organizationId?: string): UseUniversalApiReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  // Use provided organizationId or try to get from context
  let contextOrgId: string | null = organizationId || null

  // Only try context if no organizationId is provided
  if (!organizationId) {
    try {
      // Try HERA auth
      const { organization } = useHERAAuth()
      if (organization?.id) {
        contextOrgId = organization.id
      }
    } catch (e) {
      // HERA auth not available - this is expected in some contexts
    }
  }

  const execute = useCallback(
    async (options: UniversalApiOptions) => {
      if (!contextOrgId) {
        throw new Error('Organization context required for Universal API access')
      }

      setIsLoading(true)
      setError(null)

      try {
        const { table, method, data: requestData, filters } = options

        // Build URL with table
        let url = `/api/v1/universal/${table}`

        // Add filters for GET requests
        if (method === 'GET' && filters) {
          const params = new URLSearchParams()

          // Always add organization filter (guardrail)
          params.append('organization_id', contextOrgId)

          // Add additional filters
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, String(value))
            }
          })

          url += `?${params.toString()}`
        }

        // Prepare request body for POST/PUT
        let body: string | undefined
        if (method !== 'GET' && requestData) {
          // Always inject organization_id (guardrail)
          const dataWithOrg = {
            ...requestData,
            organization_id: contextOrgId
          }
          body = JSON.stringify(dataWithOrg)
        }

        console.log(`Universal API ${method} ${url}`, requestData)

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `API request failed: ${response.status}`)
        }

        const result = await response.json()
        setData(result)

        console.log('Universal API response:', result)
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'API request failed'
        setError(errorMessage)
        console.error('Universal API error:', err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [contextOrgId]
  )

  const clearError = () => {
    setError(null)
  }

  return {
    isLoading,
    error,
    data,
    execute,
    clearError
  }
}

// Specialized hooks for common operations
export function useUniversalEntities() {
  const api = useUniversalApi()

  const getEntities = useCallback(
    (entityType?: string, filters?: Record<string, any>) => {
      const apiFilters = { ...filters }
      if (entityType) {
        apiFilters.entity_type = entityType
      }

      return api.execute({
        table: 'core_entities',
        method: 'GET',
        filters: apiFilters
      })
    },
    [api]
  )

  const createEntity = useCallback(
    (entityData: any) => {
      return api.execute({
        table: 'core_entities',
        method: 'POST',
        data: entityData
      })
    },
    [api]
  )

  return {
    ...api,
    getEntities,
    createEntity
  }
}

export function useUniversalTransactions() {
  const api = useUniversalApi()

  const getTransactions = useCallback(
    (transactionType?: string, filters?: Record<string, any>) => {
      const apiFilters = { ...filters }
      if (transactionType) {
        apiFilters.transaction_type = transactionType
      }

      return api.execute({
        table: 'universal_transactions',
        method: 'GET',
        filters: apiFilters
      })
    },
    [api]
  )

  const createTransaction = useCallback(
    (transactionData: any) => {
      return api.execute({
        table: 'universal_transactions',
        method: 'POST',
        data: transactionData
      })
    },
    [api]
  )

  return {
    ...api,
    getTransactions,
    createTransaction
  }
}
