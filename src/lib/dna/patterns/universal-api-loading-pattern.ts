/**
 * HERA DNA Pattern: Universal API Data Loading
 * 
 * CRITICAL LEARNINGS FROM FURNITURE MODULE:
 * 1. Universal API read() method doesn't support filter objects anymore
 * 2. Must use simple read() and filter in JavaScript
 * 3. Always set organization ID before API calls
 * 4. Handle loading states properly
 * 5. Log responses for debugging
 * 
 * This pattern prevents common Universal API mistakes
 */

import { useState, useEffect } from 'react'
import { universalApi } from '@/lib/universal-api'

export interface UniversalDataHookOptions<T> {
  table: string
  filter?: (item: any) => boolean
  sort?: (a: any, b: any) => number
  organizationId: string
  enabled?: boolean
}

export function useUniversalData<T = any>(options: UniversalDataHookOptions<T>) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!options.organizationId || !options.enabled) {
      setLoading(false)
      return
    }

    loadData()
  }, [options.organizationId, options.table, options.enabled])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // CRITICAL: Always set organization ID first
      universalApi.setOrganizationId(options.organizationId)
      
      // CRITICAL: Use simple read() - no filter parameter
      const response = await universalApi.read(options.table, undefined, options.organizationId)
      
      console.log(`Universal API response for ${options.table}:`, response)
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load data')
      }

      let processedData = response.data

      // Apply JavaScript filter if provided
      if (options.filter) {
        processedData = processedData.filter(options.filter)
      }

      // Apply JavaScript sort if provided
      if (options.sort) {
        processedData = processedData.sort(options.sort)
      }

      setData(processedData as T[])
    } catch (err) {
      console.error(`Failed to load ${options.table}:`, err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    if (options.organizationId && options.enabled !== false) {
      loadData()
    }
  }

  return { data, loading, error, refetch }
}

/**
 * Common filters for Universal API data
 */
export const universalFilters = {
  byEntityType: (type: string) => (item: any) => item.entity_type === type,
  
  byTransactionType: (type: string) => (item: any) => item.transaction_type === type,
  
  bySmartCodePrefix: (prefix: string) => (item: any) => 
    item.smart_code?.startsWith(prefix),
  
  byStatus: (status: string) => (item: any) => 
    item.status === status || item.metadata?.status === status,
  
  byDateRange: (start: Date, end: Date) => (item: any) => {
    const itemDate = new Date(item.created_at || item.transaction_date)
    return itemDate >= start && itemDate <= end
  }
}

/**
 * Common sorters for Universal API data
 */
export const universalSorters = {
  byCreatedDesc: (a: any, b: any) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  
  byCreatedAsc: (a: any, b: any) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  
  byAmount: (a: any, b: any) => 
    (b.total_amount || 0) - (a.total_amount || 0),
  
  byName: (a: any, b: any) => 
    (a.entity_name || a.transaction_code || '').localeCompare(
      b.entity_name || b.transaction_code || ''
    )
}

/**
 * Example usage pattern
 */
export const exampleUsage = `
// In your component:
const { data: products, loading, error } = useUniversalData({
  table: 'core_entities',
  filter: universalFilters.byEntityType('product'),
  sort: universalSorters.byName,
  organizationId: organizationId,
  enabled: !!organizationId
})

// For transactions:
const { data: salesOrders } = useUniversalData({
  table: 'universal_transactions',
  filter: (t) => 
    t.transaction_type === 'sales_order' && 
    t.smart_code?.includes('FURNITURE'),
  sort: universalSorters.byCreatedDesc,
  organizationId: organizationId,
  enabled: !!organizationId
})
`