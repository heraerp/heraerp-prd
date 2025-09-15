/**
 * HERA Universal Stat Card Grid
 * Reusable component for displaying statistics in a responsive grid
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/universal-helpers'

export interface StatCardData {
  key: string
  title: string
  value: number | string
  subtitle?: string
  icon: LucideIcon
  format?: 'currency' | 'number' | 'percent'
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

interface StatCardGridProps {
  stats: StatCardData[]
  columns?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  loading?: boolean
}

export function StatCardGrid({
  stats,
  columns = { default: 1, sm: 2, md: 2, lg: 3, xl: 6 },
  loading = false
}: StatCardGridProps) {
  const getGridClasses = () => {
    const classes = ['grid', 'gap-4']

    if (columns.default) classes.push(`grid-cols-${columns.default}`)
    if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`)
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`)
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`)
    if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`)

    return classes.join(' ')
  }

  const formatValue = (stat: StatCardData): string => {
    if (typeof stat.value === 'string') return stat.value

    switch (stat.format) {
      case 'currency':
        return formatCurrency(stat.value)
      case 'percent':
        return `${stat.value.toFixed(1)}%`
      case 'number':
      default:
        return stat.value.toLocaleString()
    }
  }

  const getVariantClasses = (variant?: string) => {
    switch (variant) {
      case 'success':
        return 'border-green-500 dark:border-green-400'
      case 'warning':
        return 'border-yellow-500 dark:border-yellow-400'
      case 'danger':
        return 'border-red-500 dark:border-red-400'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className={getGridClasses()}>
        {[...Array(stats.length || 6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={getGridClasses()}>
      {stats.map(stat => {
        const Icon = stat.icon
        return (
          <Card key={stat.key} className={getVariantClasses(stat.variant)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold">{formatValue(stat)}</p>
                {stat.trend && (
                  <span
                    className={`text-sm ${
                      stat.trend.direction === 'up'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {stat.trend.direction === 'up' ? '↑' : '↓'} {stat.trend.value}%
                  </span>
                )}
              </div>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
