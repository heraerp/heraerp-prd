/**
 * HERA Universal Data Hook
 * Simplifies data loading with proper error handling and response extraction
 */

import { useState, useEffect, useCallback } from 'react'
import { universalApi, ApiResponse } from '@/lib/universal-api'
import { extractData } from '@/lib/universal-helpers'

interface UseUniversalDataOptions {
  organizationId?: string
  autoLoad?: boolean
  onError?: (error: Error) => void
}

interface UseUniversalDataReturn<T> {
  data: T[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  setData: (data: T[]) => void
}

/**
 * Hook for loading entities with proper error handling
 */
export function useEntities(
  entityType?: string,
  options: UseUniversalDataOptions = {}
): UseUniversalDataReturn<any> {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (options.organizationId) {
        universalApi.setOrganizationId(options.organizationId)
      }
      
      const response = await universalApi.getEntities()
      let entities = extractData(response)
      
      if (entityType) {
        entities = entities.filter(e => e.entity_type === entityType)
      }
      
      setData(entities)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load entities')
      setError(error.message)
      if (options.onError) options.onError(error)
    } finally {
      setLoading(false)
    }
  }, [entityType, options.organizationId])
  
  useEffect(() => {
    if (options.autoLoad !== false) {
      loadData()
    }
  }, [loadData, options.autoLoad])
  
  return { data, loading, error, reload: loadData, setData }
}

/**
 * Hook for loading transactions with proper error handling
 */
export function useTransactions(
  transactionType?: string,
  options: UseUniversalDataOptions = {}
): UseUniversalDataReturn<any> {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (options.organizationId) {
        universalApi.setOrganizationId(options.organizationId)
      }
      
      const response = await universalApi.getTransactions()
      let transactions = extractData(response)
      
      if (transactionType) {
        transactions = transactions.filter(t => t.transaction_type === transactionType)
      }
      
      setData(transactions)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load transactions')
      setError(error.message)
      if (options.onError) options.onError(error)
    } finally {
      setLoading(false)
    }
  }, [transactionType, options.organizationId])
  
  useEffect(() => {
    if (options.autoLoad !== false) {
      loadData()
    }
  }, [loadData, options.autoLoad])
  
  return { data, loading, error, reload: loadData, setData }
}

/**
 * Hook for loading today's statistics
 */
export function useTodayStats(
  organizationId?: string
) {
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    avgOrder: 0,
    payments: 0,
    refunds: 0,
    tips: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (organizationId) {
        universalApi.setOrganizationId(organizationId)
      }
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0]
      
      // Load all transactions
      const txResponse = await universalApi.getTransactions()
      const allTransactions = extractData(txResponse)
      
      // Filter today's transactions by type
      const todayTransactions = allTransactions.filter(t => 
        t.transaction_date && t.transaction_date.startsWith(today)
      )
      
      const sales = todayTransactions.filter(t => t.transaction_type === 'sale')
      const payments = todayTransactions.filter(t => t.transaction_type === 'payment')
      const refunds = todayTransactions.filter(t => t.transaction_type === 'refund')
      
      // Calculate stats
      const revenue = sales.reduce((sum, t) => sum + (t.total_amount || 0), 0)
      const paymentTotal = payments.reduce((sum, t) => sum + (t.total_amount || 0), 0)
      const refundTotal = refunds.reduce((sum, t) => sum + (t.total_amount || 0), 0)
      const tipTotal = payments.reduce((sum, t) => sum + (((t.metadata as any)?.tip_amount as number) || 0), 0)
      
      setStats({
        revenue,
        orders: sales.length,
        avgOrder: sales.length > 0 ? revenue / sales.length : 0,
        payments: paymentTotal,
        refunds: refundTotal,
        tips: tipTotal
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load statistics')
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [organizationId])
  
  useEffect(() => {
    loadStats()
  }, [loadStats])
  
  return { stats, loading, error, reload: loadStats }
}

/**
 * Generic hook for any API operation
 */
export function useApiOperation<T = any>(
  operation: () => Promise<ApiResponse<T> | T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const execute = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await operation()
      
      // Handle both direct data and ApiResponse format
      if (result && typeof result === 'object' && 'success' in result) {
        if (result.success) {
          setData(result.data || null)
        } else {
          throw new Error(result.error || 'Operation failed')
        }
      } else {
        setData(result)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Operation failed')
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, deps)
  
  return { data, loading, error, execute }
}