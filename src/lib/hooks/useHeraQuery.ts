/**
 * HERA Query Hook Wrapper
 * 
 * SWR-based data fetching with HERA-specific features:
 * - Automatic organization context injection
 * - Built-in error handling for HERA API errors
 * - Request deduplication and caching
 * - Authentication and membership validation
 */

'use client'

import { useMemo, useEffect, useCallback } from 'react'
import useSWR, { SWRConfiguration, SWRResponse } from 'swr'
import { useOrg } from './useOrg'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { HeraApiError } from '@/lib/hera/client'

export interface HeraQueryConfig extends SWRConfiguration {
  requireAuth?: boolean
  requireOrg?: boolean
  requireMembership?: boolean
}

export interface HeraQueryResult<T> extends Omit<SWRResponse<T, any>, 'error'> {
  error: HeraApiError | Error | null
  isAuthenticated: boolean
  hasOrgContext: boolean
  isValidMember: boolean
}

// Default fetcher that includes HERA authentication and org context
const heraFetcher = async (url: string): Promise<any> => {
  const token = typeof window !== 'undefined' ? 
    (window as any).__HERA_JWT__ : null
  const orgId = typeof window !== 'undefined' ? 
    (window as any).__ORG_ID__ : null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (orgId) {
    headers['X-Organization-Id'] = orgId
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
      rid: null
    }))
    
    const error = new HeraApiError(
      errorData.error || 'Request failed',
      errorData.rid,
      response.status,
      errorData.details
    )
    throw error
  }

  return response.json()
}

/**
 * Main HERA query hook with automatic context injection
 */
export function useHeraQuery<T = any>(
  key: string | null,
  config: HeraQueryConfig = {}
): HeraQueryResult<T> {
  const auth = useHERAAuth()
  const { orgId, isValidMember, isLoading: orgLoading } = useOrg()

  const {
    requireAuth = true,
    requireOrg = true,
    requireMembership = true,
    ...swrConfig
  } = config

  // Determine if query should be enabled
  const isAuthenticated = !!auth?.user
  const hasOrgContext = !!orgId
  const shouldFetch = useMemo(() => {
    if (!key) return false
    if (orgLoading) return false
    if (requireAuth && !isAuthenticated) return false
    if (requireOrg && !hasOrgContext) return false
    if (requireMembership && !isValidMember) return false
    return true
  }, [key, orgLoading, requireAuth, isAuthenticated, requireOrg, hasOrgContext, requireMembership, isValidMember])

  // Store auth data in window for fetcher access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__HERA_JWT__ = auth?.session?.access_token || null
    }
  }, [auth?.session?.access_token])

  const swrResult = useSWR<T>(
    shouldFetch ? key : null,
    heraFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      ...swrConfig
    }
  )

  return {
    ...swrResult,
    error: swrResult.error,
    isAuthenticated,
    hasOrgContext,
    isValidMember
  }
}

/**
 * Specialized hook for paginated HERA queries
 */
export function useHeraPaginatedQuery<T = any>(
  baseKey: string,
  params: {
    limit?: number
    offset?: number
    search?: string
    sort?: string
    order?: 'asc' | 'desc'
    [key: string]: any
  } = {},
  config: HeraQueryConfig = {}
): HeraQueryResult<{ data: T[]; total: number; has_more: boolean }> {
  const queryParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value))
    }
  })

  const key = queryParams.toString() ? 
    `${baseKey}?${queryParams.toString()}` : 
    baseKey

  return useHeraQuery(key, config)
}

/**
 * Hook for entity-specific queries with automatic Smart Code validation
 */
export function useHeraEntityQuery<T = any>(
  entityType: string,
  entityId?: string,
  config: HeraQueryConfig = {}
): HeraQueryResult<T> {
  const key = entityId ? 
    `/api/v2/${entityType.toLowerCase()}/${entityId}` : 
    null

  return useHeraQuery(key, {
    requireAuth: true,
    requireOrg: true,
    requireMembership: true,
    ...config
  })
}

/**
 * Hook for entity list queries with search and pagination
 */
export function useHeraEntityListQuery<T = any>(
  entityType: string,
  params: {
    search?: string
    limit?: number
    offset?: number
    sort?: string
    order?: 'asc' | 'desc'
    [key: string]: any
  } = {},
  config: HeraQueryConfig = {}
): HeraQueryResult<{ data: T[]; total: number; has_more: boolean }> {
  const baseKey = `/api/v2/${entityType.toLowerCase()}`
  
  return useHeraPaginatedQuery(baseKey, params, {
    requireAuth: true,
    requireOrg: true,
    requireMembership: true,
    ...config
  })
}

/**
 * Utility hook for prefetching HERA data
 */
export function useHeraPrefetch() {
  const { mutate } = useSWR()

  const prefetch = useCallback(async (key: string) => {
    return mutate(key, heraFetcher(key), false)
  }, [mutate])

  return { prefetch }
}

/**
 * Hook for manual cache invalidation
 */
export function useHeraCacheControl() {
  const { mutate } = useSWR()

  const invalidate = useCallback((keyPattern: string | RegExp) => {
    return mutate(
      key => {
        if (!key) return false
        if (typeof keyPattern === 'string') {
          return key.includes(keyPattern)
        }
        return keyPattern.test(key)
      },
      undefined,
      { revalidate: true }
    )
  }, [mutate])

  const invalidateEntity = useCallback((entityType: string, entityId?: string) => {
    const pattern = entityId ? 
      new RegExp(`/api/v2/${entityType.toLowerCase()}/${entityId}`) :
      new RegExp(`/api/v2/${entityType.toLowerCase()}`)
    return invalidate(pattern)
  }, [invalidate])

  return { invalidate, invalidateEntity }
}

// Re-export SWR utilities for convenience
export { useSWRConfig, preload } from 'swr'