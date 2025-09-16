// ================================================================================
// UNIVERSAL REPORTS HOOK
// Smart Code: HERA.HOOK.REPORTS.UNIVERSAL.v1
// Financial reports from universal_transactions with organization filtering
// ================================================================================

'use client'

import { useState, useCallback } from 'react'
import { useOrganization } from '@/src/components/organization/OrganizationProvider'

interface ReportFilters {
  start_date?: string
  end_date?: string
  transaction_types?: string[]
  entity_ids?: string[]
  smart_code_pattern?: string
}

interface UseUniversalReportsReturn {
  isLoading: boolean
  error: string | null
  data: any
  getTrialBalance: (filters?: ReportFilters) => Promise<any>
  getProfitLoss: (filters?: ReportFilters) => Promise<any>
  getBalanceSheet: (filters?: ReportFilters) => Promise<any>
  getCashFlow: (filters?: ReportFilters) => Promise<any>
  getTransactionReport: (filters?: ReportFilters) => Promise<any>
  clearError: () => void
}

export function useUniversalReports(): UseUniversalReportsReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const { currentOrganization } = useOrganization()

  const executeReport = useCallback(async (reportType: string, filters: ReportFilters = {}) => {
    if (!currentOrganization?.id) {
      throw new Error('Organization context required for reports')
    }

    setIsLoading(true)
    setError(null)

    try {
      // Build query parameters
      const params = new URLSearchParams()
      
      // Always add organization filter (guardrail)
      params.append('organization_id', currentOrganization.id)
      
      // Add date filters
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      
      // Add other filters
      if (filters.transaction_types?.length) {
        params.append('transaction_types', filters.transaction_types.join(','))
      }
      if (filters.entity_ids?.length) {
        params.append('entity_ids', filters.entity_ids.join(','))
      }
      if (filters.smart_code_pattern) {
        params.append('smart_code_pattern', filters.smart_code_pattern)
      }

      const url = `/api/v1/reports/${reportType}?${params.toString()}`
      
      console.log(`Fetching ${reportType} report:`, url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to generate ${reportType} report`)
      }

      const result = await response.json()
      setData(result)
      
      console.log(`${reportType} report data:`, result)
      return result

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Report generation failed'
      setError(errorMessage)
      console.error('Report error:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization?.id])

  const getTrialBalance = useCallback((filters: ReportFilters = {}) => {
    return executeReport('trial-balance', filters)
  }, [executeReport])

  const getProfitLoss = useCallback((filters: ReportFilters = {}) => {
    return executeReport('profit-loss', filters)
  }, [executeReport])

  const getBalanceSheet = useCallback((filters: ReportFilters = {}) => {
    return executeReport('balance-sheet', filters)
  }, [executeReport])

  const getCashFlow = useCallback((filters: ReportFilters = {}) => {
    return executeReport('cash-flow', filters)
  }, [executeReport])

  const getTransactionReport = useCallback((filters: ReportFilters = {}) => {
    return executeReport('transactions', filters)
  }, [executeReport])

  const clearError = () => {
    setError(null)
  }

  return {
    isLoading,
    error,
    data,
    getTrialBalance,
    getProfitLoss,
    getBalanceSheet,
    getCashFlow,
    getTransactionReport,
    clearError
  }
}

// Specialized hook for real-time dashboard metrics
export function useUniversalMetrics() {
  const reports = useUniversalReports()
  
  const getTodayMetrics = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    return reports.getTransactionReport({
      start_date: today,
      end_date: today,
      transaction_types: ['pos_sale', 'appointment', 'payment']
    })
  }, [reports])

  const getMonthMetrics = useCallback(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const today = now.toISOString().split('T')[0]
    
    return reports.getTransactionReport({
      start_date: startOfMonth,
      end_date: today
    })
  }, [reports])

  const getRevenueTrend = useCallback((days: number = 30) => {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))
    
    return reports.getTransactionReport({
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      smart_code_pattern: 'HERA.SALON.POS.SALE%'
    })
  }, [reports])

  return {
    ...reports,
    getTodayMetrics,
    getMonthMetrics,
    getRevenueTrend
  }
}