import { useState, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import type {
  EntityUpsertBody,
  EntityReadQuery,
  DynamicSetBody,
  DynamicBatchBody,
  DynamicGetQuery,
  RelationshipUpsertBody,
  RelationshipQuery,
  TxnEmitBody,
  TxnSearchQuery
} from './schemas'

const API_BASE = '/api/universal'

interface UseUniversalApiOptions {
  onError?: (error: Error) => void
  onSuccess?: (data: any) => void
}

export function useUniversalApi(options?: UseUniversalApiOptions) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const request = useCallback(
    async (path: string, options: RequestInit = {}) => {
      setLoading(true)
      setError(null)

      try {
        const headers = new Headers(options.headers)
        if (user?.organization_id) {
          headers.set('x-organization-id', user.organization_id)
        }

        const response = await fetch(`${API_BASE}${path}`, {
          ...options,
          headers
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Request failed')
        }

        options?.onSuccess?.(data)
        return data
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        options?.onError?.(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [user?.organization_id, options]
  )

  // Entity operations
  const entities = {
    upsert: (data: EntityUpsertBody) =>
      request('/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),

    read: (query: EntityReadQuery) => {
      const params = new URLSearchParams()
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
      return request(`/entities?${params.toString()}`)
    },

    get: (id: string) => request(`/entities/${id}`),

    delete: (id: string) => request(`/entities/${id}`, { method: 'DELETE' }),

    recover: (id: string) => request(`/entities/${id}/recover`, { method: 'POST' })
  }

  // Dynamic data operations
  const dynamicData = {
    set: (data: DynamicSetBody) =>
      request('/dynamic-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),

    batch: (data: DynamicBatchBody) =>
      request('/dynamic-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),

    get: (query: DynamicGetQuery) => {
      const params = new URLSearchParams()
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
      return request(`/dynamic-data/get?${params.toString()}`)
    },

    delete: (data: { p_organization_id: string; p_entity_id: string; p_field_names: string[] }) =>
      request('/dynamic-data/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
  }

  // Relationship operations
  const relationships = {
    upsert: (data: RelationshipUpsertBody) =>
      request('/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),

    batch: (data: RelationshipUpsertBody[]) =>
      request('/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),

    query: (query: RelationshipQuery) => {
      const params = new URLSearchParams()
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
      return request(`/relationships/query?${params.toString()}`)
    },

    delete: (id: string) => request(`/relationships/${id}`, { method: 'DELETE' })
  }

  // Transaction operations
  const transactions = {
    emit: (data: TxnEmitBody) =>
      request('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),

    batch: (data: TxnEmitBody[]) =>
      request('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),

    get: (id: string) => request(`/transactions/${id}`),

    getLines: (id: string) => request(`/transactions/${id}/lines`),

    search: (query: TxnSearchQuery) => {
      const params = new URLSearchParams()
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
      return request(`/transactions/search?${params.toString()}`)
    },

    void: (id: string, data: { p_reason: string; p_user_id: string }) =>
      request(`/transactions/${id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),

    reverse: (
      id: string,
      data: { p_reason: string; p_user_id: string; p_reversal_date?: string }
    ) =>
      request(`/transactions/${id}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),

    validate: (id: string) => request(`/transactions/${id}/validate`, { method: 'POST' }),

    delete: (id: string) => request(`/transactions/${id}`, { method: 'DELETE' })
  }

  return {
    loading,
    error,
    entities,
    dynamicData,
    relationships,
    transactions
  }
}
