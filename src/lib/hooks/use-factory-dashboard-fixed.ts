/**
 * Factory Dashboard React hook - Fixed Version
 * Manages data fetching and state
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { createClient, type DashboardFilters } from '../api/factory-dashboard'
import { MockAdapter } from '../api/mock-adapter'
import type {
  UniversalTransaction,
  UniversalTransactionLine,
  ModuleEntity,
  RelationshipRow,
  FiscalPeriod,
  KPISet
} from '../types/factory'
import { calculateModuleKPIs } from '../metrics/kpi'
import { summarize, getOverallSeverity } from '../metrics/guardrail'

interface DashboardData {
  transactions: UniversalTransaction[]
  modules: ModuleEntity[]
  relationships: RelationshipRow[]
  fiscalPeriods: FiscalPeriod[]
  transactionLines: Map<string, UniversalTransactionLine[]>
  kpis: KPISet
  loading: boolean
  error: Error | null
}

interface DashboardActions {
  refresh: () => void
  createWaiver: (transactionId: string, policy: string, reason: string) => Promise<boolean>
  updateFilters: (filters: Partial<DashboardFilters>) => void
}

export function useFactoryDashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({
    organization_id: process.env.NEXT_PUBLIC_ORG_ID || 'ORG-DEMO-001',
    from_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    to_date: new Date().toISOString()
  })

  const isMockMode = process.env.NEXT_PUBLIC_MOCK === '1' || !process.env.NEXT_PUBLIC_API_BASE
  const client = useMemo(
    () =>
      isMockMode
        ? MockAdapter
        : createClient({
            baseUrl: process.env.NEXT_PUBLIC_API_BASE || '',
            token: process.env.NEXT_PUBLIC_API_TOKEN
          }),
    [isMockMode]
  )

  // Fetch transactions
  const {
    data: transactions = [],
    error: txnError,
    mutate: mutateTxns
  } = useSWR(
    ['transactions', filters],
    () =>
      client.getTransactions(
        filters.organization_id,
        filters.from_date!,
        filters.to_date!,
        filters
      ),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  )

  // Fetch modules
  const {
    data: modules = [],
    error: modError,
    mutate: mutateModules
  } = useSWR(
    ['modules', filters.organization_id],
    () => client.getModules(filters.organization_id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  )

  // Fetch relationships
  const { data: relationships = [], error: relError } = useSWR(
    ['relationships', filters.organization_id],
    () => client.getRelationships(filters.organization_id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  )

  // Fetch fiscal periods
  const { data: fiscalPeriods = [], error: fiscalError } = useSWR(
    ['fiscal-periods', filters.organization_id],
    () => client.getFiscalPeriods(filters.organization_id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  )

  // Fetch transaction lines for all transactions
  const { data: allLines = [], error: linesError } = useSWR(
    ['transaction-lines', transactions.map(t => t.id).join(',')],
    async () => {
      if (!transactions.length) return []
      const txnIds = transactions.map(t => t.id)
      return await client.getAllTransactionLines(filters.organization_id, txnIds)
    },
    {
      refreshInterval: 30000, // Refresh every 30 seconds for running pipelines
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  )

  // Group transaction lines by transaction ID
  const transactionLines = useMemo(() => {
    const map = new Map<string, UniversalTransactionLine[]>()
    allLines.forEach(line => {
      if (!map.has(line.transaction_id)) {
        map.set(line.transaction_id, [])
      }
      map.get(line.transaction_id)!.push(line)
    })
    return map
  }, [allLines])

  // Calculate KPIs
  const kpis = useMemo(
    () => calculateModuleKPIs(transactions, allLines, fiscalPeriods),
    [transactions, allLines, fiscalPeriods]
  )

  // Actions
  const refresh = useCallback(() => {
    mutateTxns()
    mutateModules()
  }, [mutateTxns, mutateModules])

  const createWaiver = useCallback(
    async (transactionId: string, policy: string, reason: string): Promise<boolean> => {
      try {
        const result = await client.postWaiver(filters.organization_id, {
          transaction_id: transactionId,
          policy,
          reason
        })

        if (result.ok) {
          refresh()
        }

        return result.ok
      } catch (error) {
        console.error('Failed to create waiver:', error)
        return false
      }
    },
    [filters.organization_id, client, refresh]
  )

  const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const loading = !transactions && !txnError
  const error = txnError || modError || relError || fiscalError || linesError

  return {
    filters,
    data: {
      transactions,
      modules,
      relationships,
      fiscalPeriods,
      transactionLines,
      kpis,
      loading,
      error
    } as DashboardData,
    actions: {
      refresh,
      createWaiver,
      updateFilters
    } as DashboardActions
  }
}

// Create a separate function for module details to avoid circular dependencies
export function getModuleDetails(moduleId: string, data: DashboardData) {
  const module = data.modules.find(m => m.id === moduleId)
  const moduleTransactions = data.transactions.filter(t => t.smart_code === module?.smart_code)

  const moduleLines: UniversalTransactionLine[] = []
  moduleTransactions.forEach(txn => {
    const lines = data.transactionLines.get(txn.id) || []
    moduleLines.push(...lines)
  })

  const guardrailResults = summarize(moduleLines)
  const guardrailSeverity = getOverallSeverity(guardrailResults)

  const dependencies = data.relationships.filter(
    r => r.from_entity_id === moduleId && r.relationship_type === 'DEPENDS_ON'
  )

  const dependents = data.relationships.filter(
    r => r.to_entity_id === moduleId && r.relationship_type === 'DEPENDS_ON'
  )

  return {
    module,
    transactions: moduleTransactions,
    lines: moduleLines,
    guardrailResults,
    guardrailSeverity,
    dependencies,
    dependents
  }
}
