'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TotalWealthCardProps {
  totalWealth: number
  currency: string
  dailyChange: number
  dailyChangePercent: number
  lastUpdated: string
  isLoading?: boolean
}

export function TotalWealthCard({
  totalWealth,
  currency,
  dailyChange,
  dailyChangePercent,
  lastUpdated,
  isLoading = false
}: TotalWealthCardProps) {
  const isPositive = dailyChange >= 0

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatLargeNumber = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`
    return value.toFixed(2)
  }

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-0 p-8 md:p-12">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-slate-700 rounded mb-4" />
          <div className="h-16 w-64 bg-slate-700 rounded mb-6" />
          <div className="h-6 w-48 bg-slate-700 rounded" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-0 p-8 md:p-12 shadow-2xl">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, #D4AF37 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, #1B365D 0%, transparent 50%),
                           radial-gradient(circle at 40% 40%, #50C878 0%, transparent 50%)`
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-muted-foreground">Total Net Worth</h2>
          <div className="text-sm ink-muted">
            {new Date(lastUpdated).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        {/* Wealth Display */}
        <div className="mb-8">
          <div className="flex items-baseline gap-4">
            <span className="text-5xl md:text-7xl font-bold text-foreground tracking-tight">
              {formatCurrency(totalWealth).split('.')[0]}
            </span>
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            {formatLargeNumber(totalWealth)} {currency}
          </div>
        </div>

        {/* Daily Change */}
        <div
          className={cn(
            'flex items-center gap-3 p-4 rounded-xl',
            isPositive
              ? 'bg-emerald-500/10 border border-emerald-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          )}
        >
          <div className={cn('p-2 rounded-lg', isPositive ? 'bg-emerald-500/20' : 'bg-red-500/20')}>
            {isPositive ? (
              <TrendingUp className={cn('h-5 w-5', 'text-emerald-400')} />
            ) : (
              <TrendingDown className={cn('h-5 w-5', 'text-red-400')} />
            )}
          </div>

          <div className="flex-1">
            <div
              className={cn(
                'text-2xl font-semibold',
                isPositive ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {isPositive ? '+' : ''}
              {formatCurrency(dailyChange)}
            </div>
            <div className="text-sm text-muted-foreground">
              {isPositive ? '+' : ''}
              {dailyChangePercent.toFixed(2)}% today
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-xs ink-muted mb-1">24h High</div>
            <div className="text-sm font-semibold text-slate-300">
              {formatCurrency(totalWealth * 1.002)}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-xs ink-muted mb-1">24h Low</div>
            <div className="text-sm font-semibold text-slate-300">
              {formatCurrency(totalWealth * 0.998)}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-xs ink-muted mb-1">24h Volume</div>
            <div className="text-sm font-semibold text-slate-300">
              {formatCurrency(Math.abs(dailyChange) * 10)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
