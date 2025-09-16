'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Progress } from '@/src/components/ui/progress'
import {
  Activity,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingBag,
  Target,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { cn } from '@/src/lib/utils'

interface Metric {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  change?: number
  progress?: number
  target?: string
  color: string
}

interface TodaysMetricsProps {
  className?: string
}

export function TodaysMetrics({ className }: TodaysMetricsProps) {
  const metrics: Metric[] = [
    {
      icon: DollarSign,
      label: 'Revenue',
      value: '$12,450',
      change: 12.5,
      progress: 78,
      target: '$16,000',
      color: 'from-green-600 to-emerald-600'
    },
    {
      icon: Users,
      label: 'Customers',
      value: 246,
      change: 8.2,
      progress: 92,
      target: '267',
      color: 'from-blue-600 to-cyan-600'
    },
    {
      icon: ShoppingBag,
      label: 'Orders',
      value: 52,
      change: -3.1,
      progress: 65,
      target: '80',
      color: 'from-purple-600 to-pink-600'
    },
    {
      icon: Target,
      label: 'Conversion',
      value: '15.2%',
      change: 5.0,
      progress: 85,
      target: '18%',
      color: 'from-orange-600 to-red-600'
    }
  ]

  return (
    <Card className={cn('border-purple-200 dark:border-purple-800 shadow-sm', className)}>
      <CardHeader className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
            <Activity className="h-4 w-4 text-foreground" />
          </div>
          Today's Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon
          return (
            <div
              key={idx}
              className="p-3 rounded-lg bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/50 dark:to-pink-950/50 border border-purple-100 dark:border-purple-900 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-md bg-gradient-to-br flex items-center justify-center',
                      metric.color
                    )}
                  >
                    <Icon className="h-3 w-3 text-foreground" />
                  </div>
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                {metric.change !== undefined && (
                  <div
                    className={cn(
                      'flex items-center gap-1 text-xs font-medium',
                      metric.change > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {metric.change > 0 ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    {Math.abs(metric.change)}%
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-end justify-between">
                  <span className="text-lg font-bold">{metric.value}</span>
                  {metric.target && (
                    <span className="text-xs text-muted-foreground">of {metric.target}</span>
                  )}
                </div>
                {metric.progress !== undefined && (
                  <Progress value={metric.progress} className="h-1.5" />
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
