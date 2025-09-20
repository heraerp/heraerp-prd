import React from 'react'
import { cn } from '@/lib/utils'

export interface MiniStatCardDNAProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: string | number
    isPositive: boolean
  }
  className?: string
}

export function MiniStatCardDNA({
  label,
  value,
  icon,
  trend,
  className
}: MiniStatCardDNAProps) {
  return (
    <div className={cn(
      'p-4 rounded-lg bg-card border border-border',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold !text-gray-900 dark:!text-gray-100">{value}</p>
          {trend && (
            <p className={cn(
              'text-sm flex items-center gap-1',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{trend.value}</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

export default MiniStatCardDNA