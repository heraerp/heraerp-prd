'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package2,
  DollarSign
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface ValuationCardProps {
  branch_id: string
  branch_name: string
  total_items: number
  total_value: number
  low_stock_items: number
  out_of_stock_items: number
  valuation_method: 'WAC' | 'FIFO'
  last_updated: string
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    percentage: number
    period: string
  }
}

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  rose: '#E8B4B8',
  lightText: '#E0E0E0'
}

export function ValuationCard({
  branch_id,
  branch_name,
  total_items,
  total_value,
  low_stock_items,
  out_of_stock_items,
  valuation_method,
  last_updated,
  trend
}: ValuationCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `AED ${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `AED ${(amount / 1000).toFixed(1)}K`
    }
    return formatCurrency(amount)
  }

  const hasStockIssues = low_stock_items > 0 || out_of_stock_items > 0

  return (
    <div 
      className="rounded-xl border overflow-hidden"
      style={{ 
        backgroundColor: COLORS.charcoal,
        borderColor: COLORS.bronze + '33'
      }}
    >
      {/* Header */}
      <div className="p-6 border-b" style={{ borderColor: COLORS.bronze + '20' }}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-medium" style={{ color: COLORS.champagne }}>
              {branch_name}
            </h3>
            <p className="text-sm mt-1" style={{ color: COLORS.lightText, opacity: 0.7 }}>
              ID: {branch_id}
            </p>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-muted/30"
            style={{ color: COLORS.gold }}
          >
            {valuation_method}
          </Badge>
        </div>

        {/* Total Value */}
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-semibold" style={{ color: COLORS.champagne }}>
              {formatCompactCurrency(total_value)}
            </p>
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                trend.direction === 'up' ? 'text-green-500' : 
                trend.direction === 'down' ? 'text-red-500' : 
                'text-gray-500'
              )}>
                {trend.direction === 'up' ? <TrendingUp className="w-4 h-4" /> : 
                 trend.direction === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
                <span>{trend.percentage}%</span>
                <span className="text-xs font-normal opacity-70">vs {trend.period}</span>
              </div>
            )}
          </div>
          <p className="text-sm mt-1" style={{ color: COLORS.bronze }}>
            Total Inventory Value
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6 grid grid-cols-2 gap-4">
        {/* Active Items */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Package2 className="w-4 h-4" style={{ color: COLORS.bronze }} />
            <span className="text-xs uppercase tracking-wider" style={{ color: COLORS.bronze }}>
              Active Items
            </span>
          </div>
          <p className="text-2xl font-medium" style={{ color: COLORS.lightText }}>
            {total_items}
          </p>
        </div>

        {/* Average Value */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" style={{ color: COLORS.bronze }} />
            <span className="text-xs uppercase tracking-wider" style={{ color: COLORS.bronze }}>
              Avg Value
            </span>
          </div>
          <p className="text-2xl font-medium" style={{ color: COLORS.lightText }}>
            {total_items > 0 ? formatCurrency(total_value / total_items) : formatCurrency(0)}
          </p>
        </div>

        {/* Low Stock Alert */}
        {hasStockIssues && (
          <div className="col-span-2 mt-2 p-3 rounded-lg border"
               style={{ 
                 backgroundColor: '#DC2626' + '10',
                 borderColor: '#DC2626' + '30'
               }}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5" style={{ color: '#DC2626' }} />
              <div className="flex-1">
                <p className="font-medium" style={{ color: '#DC2626' }}>
                  Stock Alert
                </p>
                <div className="flex gap-4 mt-1 text-sm">
                  {low_stock_items > 0 && (
                    <span style={{ color: COLORS.lightText }}>
                      {low_stock_items} low stock
                    </span>
                  )}
                  {out_of_stock_items > 0 && (
                    <span style={{ color: COLORS.lightText }}>
                      {out_of_stock_items} out of stock
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t" style={{ 
        borderColor: COLORS.bronze + '20',
        backgroundColor: COLORS.black + '20'
      }}>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: COLORS.lightText, opacity: 0.7 }}>
            Last updated {formatDistanceToNow(new Date(last_updated), { addSuffix: true })}
          </span>
          <button 
            className="hover:underline transition-all"
            style={{ color: COLORS.gold }}
          >
            View Details →
          </button>
        </div>
      </div>
    </div>
  )
}