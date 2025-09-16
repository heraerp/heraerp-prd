'use client'

import React from 'react'
import { Card } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { WealthEntity } from '@/src/lib/pwm/types'
import { cn } from '@/src/lib/utils'

interface Holding extends WealthEntity {
  value: number
  change24h: number
  change24hPercent: number
  allocation: number
  aiScore?: number
}

interface TopHoldingsGridProps {
  holdings: Holding[]
  currency: string
  onHoldingClick?: (holding: Holding) => void
}

export function TopHoldingsGrid({ holdings, currency, onHoldingClick }: TopHoldingsGridProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact',
      compactDisplay: 'short'
    }).format(value)
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />
    if (change < 0) return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const getAIScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    if (score >= 6) return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    if (score >= 4) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    return 'text-red-400 bg-red-400/10 border-red-400/20'
  }

  const getEntityTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      investment: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      real_estate: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      crypto: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      commodity: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      private_equity: 'bg-red-500/20 text-red-300 border-red-500/30',
      hedge_fund: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      default: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    }
    return colors[type] || colors.default
  }

  return (
    <Card className="p-6 bg-background/50 backdrop-blur-sm border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Top Holdings</h3>
        <span className="text-sm text-muted-foreground">By value</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {holdings.slice(0, 10).map((holding, index) => (
          <div
            key={holding.entity_id}
            onClick={() => onHoldingClick?.(holding)}
            className={cn(
              'p-4 rounded-xl border transition-all duration-200 cursor-pointer',
              'bg-muted/30 border-border/50',
              'hover:bg-muted/50 hover:border-input hover:shadow-lg'
            )}
          >
            {/* Holding Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-500">#{index + 1}</span>
                  <h4 className="font-semibold text-foreground truncate">{holding.entity_name}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn('text-xs', getEntityTypeColor(holding.entity_type))}
                  >
                    {holding.entity_type.replace('_', ' ')}
                  </Badge>
                  {holding.aiScore && (
                    <Badge
                      variant="outline"
                      className={cn('text-xs', getAIScoreColor(holding.aiScore))}
                    >
                      AI: {holding.aiScore}/10
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Value and Change */}
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Value</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(holding.value)}</p>
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-lg',
                    holding.change24h >= 0
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-red-500/10 text-red-400'
                  )}
                >
                  {getChangeIcon(holding.change24h)}
                  <span className="text-sm font-medium">
                    {holding.change24hPercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Allocation Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Portfolio allocation</span>
                  <span className="text-slate-300 font-medium">
                    {holding.allocation.toFixed(1)}%
                  </span>
                </div>
                <Progress value={holding.allocation} className="h-2 bg-slate-700" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      <button className="w-full mt-4 p-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors">
        View all holdings →
      </button>
    </Card>
  )
}
