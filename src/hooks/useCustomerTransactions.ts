/**
 * useCustomerTransactions Hook
 *
 * Enterprise-grade hook for fetching and calculating customer transaction metrics
 * Wraps useUniversalTransactionV1 with customer-specific filtering and KPI calculations
 *
 * Features:
 * - Filter transactions by customer ID (source_entity_id)
 * - Calculate KPIs: Lifetime Value, Visit Count, Average Order Value, Last Visit
 * - Date range filtering support
 * - 5-minute cache for performance
 * - Include transaction lines for detailed analysis
 */

import { useMemo } from 'react'
import { useUniversalTransactionV1 } from './useUniversalTransactionV1'

export interface CustomerKPIs {
  lifetimeValue: number
  visitCount: number
  averageOrderValue: number
  lastVisitDate: string | null
  totalTransactions: number
  completedTransactions: number
}

export interface UseCustomerTransactionsOptions {
  customerId: string
  organizationId: string
  dateFrom?: string
  dateTo?: string
  transactionType?: string
  transactionStatus?: string
  enabled?: boolean
}

export function useCustomerTransactions(options: UseCustomerTransactionsOptions) {
  const {
    customerId,
    organizationId,
    dateFrom,
    dateTo,
    transactionType = 'SALE', // Default to POS sales
    transactionStatus,
    enabled = true
  } = options

  // Fetch transactions using universal hook
  const {
    transactions = [],
    isLoading,
    error,
    refetch
  } = useUniversalTransactionV1({
    organizationId,
    filters: {
      source_entity_id: customerId, // Filter by customer
      include_lines: true, // Include transaction line items
      transaction_type: transactionType,
      transaction_status: transactionStatus,
      date_from: dateFrom,
      date_to: dateTo
    },
    cacheConfig: {
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      refetchOnMount: true,
      enabled: enabled && !!customerId // Only fetch if enabled and has customer ID
    }
  })

  // Debug logging
  console.log('🔍 [useCustomerTransactions] Fetching transactions for customer:', {
    customerId,
    organizationId,
    transactionType,
    transactionCount: transactions?.length || 0,
    dateFrom,
    dateTo
  })

  // Calculate KPIs from transactions
  const kpis = useMemo((): CustomerKPIs => {
    if (!transactions || transactions.length === 0) {
      return {
        lifetimeValue: 0,
        visitCount: 0,
        averageOrderValue: 0,
        lastVisitDate: null,
        totalTransactions: 0,
        completedTransactions: 0
      }
    }

    // Filter completed transactions for accurate metrics
    const completedTransactions = transactions.filter(
      txn => txn.transaction_status === 'completed'
    )

    // Calculate lifetime value (sum of completed transaction amounts)
    const lifetimeValue = completedTransactions.reduce(
      (sum, txn) => sum + (txn.total_amount || 0),
      0
    )

    // Visit count is number of completed transactions
    const visitCount = completedTransactions.length

    // Average order value
    const averageOrderValue = visitCount > 0 ? lifetimeValue / visitCount : 0

    // Last visit date (most recent completed transaction)
    const sortedTransactions = [...completedTransactions].sort(
      (a, b) =>
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    )
    const lastVisitDate = sortedTransactions[0]?.transaction_date || null

    return {
      lifetimeValue,
      visitCount,
      averageOrderValue,
      lastVisitDate,
      totalTransactions: transactions.length,
      completedTransactions: completedTransactions.length
    }
  }, [transactions])

  // Format currency helper
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Get recent transactions (last 5)
  const recentTransactions = useMemo(() => {
    return [...(transactions || [])]
      .sort(
        (a, b) =>
          new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      )
      .slice(0, 5)
  }, [transactions])

  return {
    transactions: transactions || [],
    recentTransactions,
    kpis,
    isLoading,
    error,
    refetch,
    formatCurrency
  }
}
