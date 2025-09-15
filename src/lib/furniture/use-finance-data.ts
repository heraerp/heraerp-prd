'use client'

import { useState, useEffect, useCallback } from 'react'

interface FinanceMetrics {
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  totalRevenue: number
  totalExpenses: number
  netProfit: number
}

interface GLAccount {
  id: string
  entity_code: string
  entity_name: string
  current_balance: number
  balance_type: 'Dr' | 'Cr'
  debit_total: number
  credit_total: number
  metadata?: any
  [key: string]: any
}

interface FinanceData {
  glAccounts: GLAccount[]
  metrics: FinanceMetrics
  loading: boolean
  error: string | null
}

// Cache to store data between component remounts
const dataCache = new Map<string, { data: FinanceData; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useFinanceData(organizationId: string | null) {
  const [data, setData] = useState<FinanceData>({
    glAccounts: [],
    metrics: {
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0
    },
    loading: true,
    error: null
  })

  const loadFinanceData = useCallback(async () => {
    if (!organizationId) {
      setData(prev => ({ ...prev, loading: false }))
      return
    }

    // Check cache first
    const cacheKey = `finance-${organizationId}`
    const cached = dataCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setData(cached.data)
      return
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }))

      // Use the finance API endpoint that bypasses RLS
      const response = await fetch(`/api/furniture/finance?organizationId=${organizationId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch finance data')
      }

      const { entities, transactionLines, dynamicData } = await response.json()

      // Filter for GL accounts
      const accounts = entities?.filter((e: any) => e.entity_type === 'gl_account') || []

      // Sort by account code
      accounts.sort((a: any, b: any) => a.entity_code.localeCompare(b.entity_code))

      // Calculate balances from transaction lines
      const balancesByAccount: Record<string, { debit: number; credit: number; balance: number }> =
        {}

      if (transactionLines) {
        transactionLines.forEach((line: any) => {
          if (line.entity_id && line.line_data) {
            if (!balancesByAccount[line.entity_id]) {
              balancesByAccount[line.entity_id] = { debit: 0, credit: 0, balance: 0 }
            }
            balancesByAccount[line.entity_id].debit += line.line_data?.debit_amount || 0
            balancesByAccount[line.entity_id].credit += line.line_data?.credit_amount || 0
          }
        })

        // Calculate net balance
        Object.keys(balancesByAccount).forEach(accountId => {
          const account = balancesByAccount[accountId]
          account.balance = account.debit - account.credit
        })
      }

      // Enhance accounts with balance information
      const accountsWithBalances = accounts.map((account: any) => {
        const balance = balancesByAccount[account.id] || { debit: 0, credit: 0, balance: 0 }
        return {
          ...account,
          current_balance: Math.abs(balance.balance),
          balance_type: balance.balance >= 0 ? 'Dr' : 'Cr',
          debit_total: balance.debit,
          credit_total: balance.credit
        }
      })

      // Calculate summary metrics from actual balances
      let totalAssets = 0
      let totalLiabilities = 0
      let totalEquity = 0
      let totalRevenue = 0
      let totalExpenses = 0

      accountsWithBalances.forEach((account: any) => {
        const balance = account.current_balance || 0
        const accountCode = account.entity_code

        if (accountCode.startsWith('1')) {
          // Assets (debit balance is positive)
          totalAssets += account.balance_type === 'Dr' ? balance : -balance
        } else if (accountCode.startsWith('2')) {
          // Liabilities (credit balance is positive)
          totalLiabilities += account.balance_type === 'Cr' ? balance : -balance
        } else if (accountCode.startsWith('3')) {
          // Equity (credit balance is positive)
          totalEquity += account.balance_type === 'Cr' ? balance : -balance
        } else if (accountCode.startsWith('4')) {
          // Revenue (credit balance is positive)
          totalRevenue += account.balance_type === 'Cr' ? balance : -balance
        } else if (accountCode.startsWith('5')) {
          // Expenses (debit balance is positive)
          totalExpenses += account.balance_type === 'Dr' ? balance : -balance
        }
      })

      const netProfit = totalRevenue - totalExpenses

      const newData: FinanceData = {
        glAccounts: accountsWithBalances,
        metrics: {
          totalAssets,
          totalLiabilities,
          totalEquity: totalEquity || totalAssets - totalLiabilities, // Calculate if not directly available
          totalRevenue,
          totalExpenses,
          netProfit
        },
        loading: false,
        error: null
      }

      // Update cache
      dataCache.set(cacheKey, { data: newData, timestamp: Date.now() })
      setData(newData)
    } catch (error) {
      console.error('Failed to load finance data:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load finance data'
      }))
    }
  }, [organizationId])

  useEffect(() => {
    loadFinanceData()
  }, [loadFinanceData])

  const refresh = useCallback(() => {
    if (organizationId) {
      // Clear cache and reload
      const cacheKey = `finance-${organizationId}`
      dataCache.delete(cacheKey)
      loadFinanceData()
    }
  }, [organizationId, loadFinanceData])

  return {
    ...data,
    refresh
  }
}
