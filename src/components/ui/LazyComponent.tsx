/**
 * LazyComponent - Dynamic imports with proper loading states
 * For heavy components that shouldn't block initial paint
 */

'use client'

import dynamic from 'next/dynamic'
import { ComponentType, ReactNode } from 'react'
import { LUXE_COLORS } from '@/lib/constants/salon'

interface LazyComponentOptions {
  ssr?: boolean
  loading?: ComponentType
  fallback?: ReactNode
}

/**
 * Creates a lazily loaded component with salon-themed skeleton
 */
export function createLazyComponent<T extends {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: LazyComponentOptions = {}
) {
  const defaultLoading = () => (
    <div 
      className="h-64 animate-pulse rounded-2xl"
      style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80` }}
    />
  )

  return dynamic(importFn, {
    ssr: options.ssr ?? false,
    loading: options.loading ?? defaultLoading
  })
}

/**
 * Skeleton components for common layouts
 */
export const ChartSkeleton = () => (
  <div 
    className="h-64 animate-pulse rounded-2xl flex items-center justify-center"
    style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80` }}
  >
    <div 
      className="text-sm"
      style={{ color: LUXE_COLORS.bronze }}
    >
      Loading chart...
    </div>
  </div>
)

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div 
    className="rounded-2xl overflow-hidden"
    style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}60` }}
  >
    {/* Header */}
    <div className="p-4 border-b" style={{ borderColor: `${LUXE_COLORS.bronze}20` }}>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i}
            className="h-4 rounded animate-pulse"
            style={{ backgroundColor: `${LUXE_COLORS.bronze}30` }}
          />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="p-4 border-b" style={{ borderColor: `${LUXE_COLORS.bronze}10` }}>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, j) => (
            <div 
              key={j}
              className="h-4 rounded animate-pulse"
              style={{ backgroundColor: `${LUXE_COLORS.champagne}20` }}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
)

export const StatCardSkeleton = () => (
  <div 
    className="h-32 animate-pulse rounded-2xl flex flex-col justify-center p-4"
    style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80` }}
  >
    <div 
      className="h-4 w-20 rounded mb-2"
      style={{ backgroundColor: `${LUXE_COLORS.bronze}30` }}
    />
    <div 
      className="h-8 w-16 rounded"
      style={{ backgroundColor: `${LUXE_COLORS.gold}30` }}
    />
  </div>
)

/**
 * Pre-configured lazy components for common heavy imports
 */

// For chart libraries (Chart.js, Recharts, etc.)
export const LazyChart = createLazyComponent(
  () => import('./Chart'), // Replace with actual chart component
  { loading: ChartSkeleton }
)

// For data tables with complex features
export const LazyDataTable = createLazyComponent(
  () => import('./DataTable'), // Replace with actual table component
  { loading: () => <TableSkeleton rows={8} /> }
)

// For analytics panels
export const LazyAnalytics = createLazyComponent(
  () => import('./AnalyticsPanel'), // Replace with actual analytics component
  { 
    loading: () => (
      <div className="grid gap-4 md:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    )
  }
)