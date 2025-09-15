/**
 * HERA DNA Pattern: Universal API Endpoint Data Loading
 *
 * This pattern uses API endpoints that bypass RLS using service role keys.
 * Use this when client-side Universal API calls are blocked by RLS.
 *
 * CRITICAL LEARNINGS:
 * 1. RLS blocks client-side data access in production
 * 2. API endpoints with service role keys bypass RLS
 * 3. Maintain caching for performance
 * 4. Handle errors gracefully
 * 5. Support filtering and sorting in JavaScript
 */

import { useState, useEffect, useCallback } from 'react'

export interface UniversalEndpointHookOptions<T> {
  endpoint: string // API endpoint URL
  filter?: (item: any) => boolean
  sort?: (a: any, b: any) => number
  organizationId: string
  enabled?: boolean
  dataKey?: string // Key to extract data from response (default: 'data')
}

// Cache to store data between component remounts
const dataCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useUniversalEndpointData<T = any>(options: UniversalEndpointHookOptions<T>) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!options.organizationId || !options.enabled) {
      setLoading(false)
      return
    }

    // Check cache first
    const cacheKey = `${options.endpoint}-${options.organizationId}`
    const cached = dataCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      let processedData = cached.data

      // If the data should be filtered/sorted, it must be an array
      if (options.filter || options.sort) {
        if (!Array.isArray(processedData)) {
          processedData = []
        }

        // Apply JavaScript filter if provided
        if (options.filter) {
          processedData = processedData.filter(options.filter)
        }

        // Apply JavaScript sort if provided
        if (options.sort) {
          processedData = processedData.sort(options.sort)
        }
      }

      setData(processedData)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Build URL with organization ID
      const url = new URL(options.endpoint, window.location.origin)
      url.searchParams.set('organizationId', options.organizationId)

      const response = await fetch(url.toString())

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || 'Failed to fetch data')
      }

      const responseData = await response.json()

      // Extract data using the specified key or default to entire response
      let rawData = options.dataKey ? responseData[options.dataKey] : responseData

      // Cache the raw data
      dataCache.set(cacheKey, { data: rawData, timestamp: Date.now() })

      // If the data should be filtered/sorted, it must be an array
      if (options.filter || options.sort) {
        // Ensure we have an array for filtering/sorting
        if (!Array.isArray(rawData)) {
          console.warn(`Expected array data for filtering/sorting, got:`, rawData)
          rawData = []
        }

        let processedData = rawData

        // Apply JavaScript filter if provided
        if (options.filter) {
          processedData = processedData.filter(options.filter)
        }

        // Apply JavaScript sort if provided
        if (options.sort) {
          processedData = processedData.sort(options.sort)
        }

        setData(processedData as T[])
      } else {
        // No filtering/sorting needed, return data as-is
        setData(rawData as T[])
      }
    } catch (err) {
      console.error(`Failed to load from ${options.endpoint}:`, err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [
    options.organizationId,
    options.endpoint,
    options.enabled,
    options.filter,
    options.sort,
    options.dataKey
  ])

  useEffect(() => {
    loadData()
  }, [loadData])

  const refresh = useCallback(() => {
    // Clear cache and reload
    const cacheKey = `${options.endpoint}-${options.organizationId}`
    dataCache.delete(cacheKey)
    loadData()
  }, [options.endpoint, options.organizationId, loadData])

  return { data, loading, error, refresh }
}

/**
 * Helper to convert from table-based pattern to endpoint-based pattern
 */
export function useProductionData(organizationId: string, enabled = true) {
  const {
    data: responseData,
    loading,
    error,
    refresh
  } = useUniversalEndpointData<any>({
    endpoint: '/api/furniture/production',
    organizationId,
    enabled,
    dataKey: undefined // We want the full response object, not a specific key
  })

  // The response is an object with properties, not an array
  const responseObj = Array.isArray(responseData) ? {} : responseData || {}

  // Transform the response to match the expected structure
  const transactions = responseObj.transactions || []
  const entities = responseObj.entities || []
  const lines = responseObj.lines || []
  const relationships = responseObj.relationships || []

  return {
    productionOrders: transactions
      .filter(
        (t: any) =>
          t.transaction_type === 'production_order' &&
          (t.smart_code?.includes('HERA.MFG.PROD') || t.smart_code?.includes('HERA.FURNITURE'))
      )
      .sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    workCenters: entities.filter((e: any) => e.entity_type === 'work_center'),
    products: entities.filter((e: any) => e.entity_type === 'product'),
    statusEntities: entities.filter((e: any) => e.entity_type === 'workflow_status'),
    transactionLines: lines,
    relationships,
    loading,
    error,
    refresh
  }
}
