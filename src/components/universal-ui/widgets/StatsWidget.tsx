'use client'

import React, { useEffect, useState } from 'react'
import { Widget } from '@/lib/universal-ui/view-meta-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { universalApi } from '@/lib/universal-api'
import { cn } from '@/lib/utils'

interface StatsWidgetProps {
  widget: Widget
  entityId?: string
  organizationId: string
  onAction?: (action: any) => void
}

interface StatData {
  label: string
  value: number | string
  change?: number
  changeLabel?: string
  prefix?: string
  suffix?: string
  trend?: 'up' | 'down' | 'neutral'
}

export function StatsWidget({ widget, entityId, organizationId }: StatsWidgetProps) {
  const [stats, setStats] = useState<StatData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [entityId, organizationId])

  const loadStats = async () => {
    try {
      setLoading(true)

      const source = widget.data_source
      if (!source) {
        // Use default stats if no data source specified
        setStats(getDefaultStats())
        return
      }

      if (source.type === 'calculated' && source.calculations) {
        // For BOM stats, calculate based on entity data
        const calculatedStats = await calculateStats(source.calculations)
        setStats(calculatedStats)
      } else if (source.type === 'aggregate' && source.aggregations) {
        // Run aggregation queries
        const aggregatedStats = await aggregateStats(source.aggregations)
        setStats(aggregatedStats)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
      setStats(getDefaultStats())
    } finally {
      setLoading(false)
    }
  }

  const getDefaultStats = (): StatData[] => {
    // Default stats for BOM overview
    return [
      {
        label: 'Total Cost',
        value: '$2,456.00',
        change: 12.5,
        changeLabel: 'from last revision',
        trend: 'up',
        prefix: '$'
      },
      {
        label: 'Component Count',
        value: 24,
        change: 0,
        changeLabel: 'components',
        trend: 'neutral'
      },
      {
        label: 'Lead Time',
        value: '14 days',
        change: -2,
        changeLabel: 'days improvement',
        trend: 'down'
      },
      {
        label: 'Current Revision',
        value: 'B',
        changeLabel: 'Released',
        trend: 'neutral'
      }
    ]
  }

  const calculateStats = async (calculations: any[]): Promise<StatData[]> => {
    // In a real implementation, this would run calculations based on entity data
    // For now, return sample data
    return calculations.map(calc => ({
      label: calc.alias.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: Math.floor(Math.random() * 1000),
      change: Math.random() * 20 - 10,
      trend: Math.random() > 0.5 ? 'up' : 'down'
    }))
  }

  const aggregateStats = async (aggregations: any[]): Promise<StatData[]> => {
    const stats: StatData[] = []

    for (const agg of aggregations) {
      // Query the appropriate table based on the aggregation
      let tableName = 'core_entities'
      if (agg.table) {
        tableName = agg.table
      }

      const result = await universalApi.query(tableName, {
        organization_id: organizationId
      })

      if (result.data) {
        let value = 0

        switch (agg.function) {
          case 'count':
            value = result.data.length
            break
          case 'sum':
            value = result.data.reduce(
              (acc: number, row: any) => acc + (Number(row[agg.field]) || 0),
              0
            )
            break
          case 'avg':
            const sum = result.data.reduce(
              (acc: number, row: any) => acc + (Number(row[agg.field]) || 0),
              0
            )
            value = result.data.length > 0 ? sum / result.data.length : 0
            break
          case 'min':
            value = Math.min(...result.data.map((row: any) => Number(row[agg.field]) || 0))
            break
          case 'max':
            value = Math.max(...result.data.map((row: any) => Number(row[agg.field]) || 0))
            break
        }

        stats.push({
          label: agg.alias.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: Math.round(value * 100) / 100,
          trend: 'neutral'
        })
      }
    }

    return stats
  }

  const formatValue = (stat: StatData): string => {
    if (typeof stat.value === 'string') {
      return stat.value
    }

    let formatted = stat.value.toLocaleString()
    if (stat.prefix) formatted = stat.prefix + formatted
    if (stat.suffix) formatted = formatted + stat.suffix

    return formatted
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />
      case 'down':
        return <TrendingDown className="h-4 w-4" />
      default:
        return <Minus className="h-4 w-4" />
    }
  }

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400'
      case 'down':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-muted-foreground'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-muted-foreground/10 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 dark:bg-muted-foreground/10 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{formatValue(stat)}</p>
              {(stat.change !== undefined || stat.changeLabel) && (
                <div className={cn('flex items-center gap-1 text-sm', getTrendColor(stat.trend))}>
                  {getTrendIcon(stat.trend)}
                  {stat.change !== undefined && (
                    <span>
                      {stat.change > 0 ? '+' : ''}
                      {stat.change}%
                    </span>
                  )}
                  {stat.changeLabel && <span>{stat.changeLabel}</span>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
