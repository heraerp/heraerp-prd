/**
 * 🏢 ENTERPRISE-GRADE DASHBOARD FILTER CONTEXT
 *
 * Manages global and component-level filters with clear hierarchy:
 * - Global filters apply to all sections by default
 * - Components can override with local filters
 * - Clear UI indication when overrides are active
 * - Centralized state management for scalability
 *
 * @see /docs/architecture/DASHBOARD-FILTER-ARCHITECTURE.md
 */

'use client'

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export type TimePeriod = 'today' | 'last7Days' | 'last30Days' | 'yearToDate' | 'allTime'

export interface ComponentFilter {
  componentId: string
  period: TimePeriod
  isOverride: boolean // true if different from global filter
}

export interface DashboardFilterState {
  globalPeriod: TimePeriod
  componentOverrides: Map<string, TimePeriod>
}

export interface DashboardFilterContextValue {
  // Global filter
  globalPeriod: TimePeriod
  setGlobalPeriod: (period: TimePeriod) => void

  // Component-level filters
  getComponentPeriod: (componentId: string) => TimePeriod
  setComponentOverride: (componentId: string, period: TimePeriod | null) => void
  hasOverride: (componentId: string) => boolean
  clearComponentOverride: (componentId: string) => void
  clearAllOverrides: () => void

  // Metadata
  getOverrideCount: () => number
  getAllOverrides: () => ComponentFilter[]
}

// ============================================================================
// CONTEXT
// ============================================================================

const DashboardFilterContext = createContext<DashboardFilterContextValue | null>(null)

// ============================================================================
// PROVIDER
// ============================================================================

interface DashboardFilterProviderProps {
  children: React.ReactNode
  defaultPeriod?: TimePeriod
}

export function DashboardFilterProvider({
  children,
  defaultPeriod = 'allTime'
}: DashboardFilterProviderProps) {
  // State
  const [globalPeriod, setGlobalPeriodState] = useState<TimePeriod>(defaultPeriod)
  const [componentOverrides, setComponentOverrides] = useState<Map<string, TimePeriod>>(
    new Map()
  )

  // ========================================================================
  // GLOBAL FILTER MANAGEMENT
  // ========================================================================

  const setGlobalPeriod = useCallback((period: TimePeriod) => {
    setGlobalPeriodState(period)
    console.log('[DashboardFilter] Global period changed:', period)
  }, [])

  // ========================================================================
  // COMPONENT-LEVEL FILTER MANAGEMENT
  // ========================================================================

  /**
   * Get the effective period for a component
   * Returns override if exists, otherwise global period
   */
  const getComponentPeriod = useCallback(
    (componentId: string): TimePeriod => {
      const override = componentOverrides.get(componentId)
      return override ?? globalPeriod
    },
    [componentOverrides, globalPeriod]
  )

  /**
   * Set a component-level filter override
   * Pass null to clear the override
   */
  const setComponentOverride = useCallback(
    (componentId: string, period: TimePeriod | null) => {
      setComponentOverrides((prev) => {
        const next = new Map(prev)
        if (period === null || period === globalPeriod) {
          // Clear override if null or same as global
          next.delete(componentId)
          console.log('[DashboardFilter] Override cleared for:', componentId)
        } else {
          next.set(componentId, period)
          console.log('[DashboardFilter] Override set for:', componentId, period)
        }
        return next
      })
    },
    [globalPeriod]
  )

  /**
   * Check if a component has an active override
   */
  const hasOverride = useCallback(
    (componentId: string): boolean => {
      return componentOverrides.has(componentId)
    },
    [componentOverrides]
  )

  /**
   * Clear a specific component's override
   */
  const clearComponentOverride = useCallback((componentId: string) => {
    setComponentOverrides((prev) => {
      const next = new Map(prev)
      next.delete(componentId)
      console.log('[DashboardFilter] Override cleared for:', componentId)
      return next
    })
  }, [])

  /**
   * Clear all component overrides
   */
  const clearAllOverrides = useCallback(() => {
    setComponentOverrides(new Map())
    console.log('[DashboardFilter] All overrides cleared')
  }, [])

  // ========================================================================
  // METADATA QUERIES
  // ========================================================================

  /**
   * Get count of active overrides
   */
  const getOverrideCount = useCallback((): number => {
    return componentOverrides.size
  }, [componentOverrides])

  /**
   * Get all active overrides with metadata
   */
  const getAllOverrides = useCallback((): ComponentFilter[] => {
    const overrides: ComponentFilter[] = []
    componentOverrides.forEach((period, componentId) => {
      overrides.push({
        componentId,
        period,
        isOverride: period !== globalPeriod
      })
    })
    return overrides
  }, [componentOverrides, globalPeriod])

  // ========================================================================
  // CONTEXT VALUE
  // ========================================================================

  const contextValue = useMemo<DashboardFilterContextValue>(
    () => ({
      globalPeriod,
      setGlobalPeriod,
      getComponentPeriod,
      setComponentOverride,
      hasOverride,
      clearComponentOverride,
      clearAllOverrides,
      getOverrideCount,
      getAllOverrides
    }),
    [
      globalPeriod,
      setGlobalPeriod,
      getComponentPeriod,
      setComponentOverride,
      hasOverride,
      clearComponentOverride,
      clearAllOverrides,
      getOverrideCount,
      getAllOverrides
    ]
  )

  return (
    <DashboardFilterContext.Provider value={contextValue}>
      {children}
    </DashboardFilterContext.Provider>
  )
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access dashboard filter context
 * @throws Error if used outside provider
 */
export function useDashboardFilter(): DashboardFilterContextValue {
  const context = useContext(DashboardFilterContext)
  if (!context) {
    throw new Error('useDashboardFilter must be used within DashboardFilterProvider')
  }
  return context
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get human-readable label for a time period
 */
export function getPeriodLabel(period: TimePeriod): string {
  const labels: Record<TimePeriod, string> = {
    today: 'Today',
    last7Days: 'Last 7 Days',
    last30Days: 'Last 30 Days',
    yearToDate: 'Year to Date',
    allTime: 'All Time'
  }
  return labels[period]
}

/**
 * Get short label for compact display
 */
export function getPeriodShortLabel(period: TimePeriod): string {
  const labels: Record<TimePeriod, string> = {
    today: 'Today',
    last7Days: '7D',
    last30Days: '30D',
    yearToDate: 'YTD',
    allTime: 'All'
  }
  return labels[period]
}
