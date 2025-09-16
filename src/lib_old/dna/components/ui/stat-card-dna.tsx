'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * HERA DNA Stat Card Component
 *
 * A reusable statistics card component that automatically handles dark mode text visibility
 * using the !important modifier to override global CSS rules.
 *
 * Features:
 * - Automatic dark mode text visibility fix
 * - Consistent styling across all stat cards
 * - Icon support with gradient backgrounds
 * - Optional trend indicators
 * - Responsive design
 *
 * @example
 * ```tsx
 * <StatCardDNA
 *   title="Total Revenue"
 *   value="₹1,234,567"
 *   change="+12.5% from last month"
 *   changeType="positive"
 *   icon={DollarSign}
 *   iconGradient="from-green-500 to-emerald-500"
 * />
 * ```
 */

export interface StatCardDNAProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: LucideIcon
  iconGradient?: string
  className?: string
  valueClassName?: string
  titleClassName?: string
  changeClassName?: string
}

export function StatCardDNA({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconGradient = 'from-blue-500 to-purple-500',
  className,
  valueClassName,
  titleClassName,
  changeClassName
}: StatCardDNAProps) {
  // Determine change text color based on type
  const changeColorClass = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-muted-foreground dark:text-muted-foreground'
  }[changeType]

  return (
    <Card
      className={cn(
        'backdrop-blur-xl bg-background/95 dark:bg-background/95',
        'border-purple-200/50 dark:border-purple-800/50',
        'shadow-lg hover:shadow-xl transition-shadow',
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p
              className={cn(
                'text-sm font-medium text-muted-foreground dark:text-gray-300',
                'uppercase tracking-wide',
                titleClassName
              )}
            >
              {title}
            </p>
            <p
              className={cn(
                'text-3xl font-bold mt-2',
                '!text-gray-900 dark:!text-gray-100', // Force text visibility with !important
                valueClassName
              )}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {change && (
              <p className={cn('text-xs mt-1 font-medium', changeColorClass, changeClassName)}>
                {change}
              </p>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg',
                'bg-gradient-to-br',
                iconGradient
              )}
            >
              <Icon className="w-7 h-7 text-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * HERA DNA Mini Stat Card Component
 *
 * A smaller variant of the stat card for compact displays
 */
export function MiniStatCardDNA({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-500',
  className,
  valueClassName,
  titleClassName
}: {
  title: string
  value: string | number
  icon?: LucideIcon
  iconColor?: string
  className?: string
  valueClassName?: string
  titleClassName?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4',
        'bg-background/80 dark:bg-background/80 rounded-lg',
        'border border-border dark:border-border',
        className
      )}
    >
      <div>
        <p className={cn('text-sm text-muted-foreground dark:text-muted-foreground', titleClassName)}>{title}</p>
        <p
          className={cn(
            'text-2xl font-bold mt-1',
            '!text-gray-900 dark:!text-gray-100', // Force text visibility
            valueClassName
          )}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
      {Icon && <Icon className={cn('w-8 h-8', iconColor)} />}
    </div>
  )
}

/**
 * HERA DNA Stat Card Grid
 *
 * A responsive grid container for stat cards
 */
export function StatCardGrid({
  children,
  columns = 4,
  className
}: {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  className?: string
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6'
  }[columns]

  return <div className={cn('grid gap-4', gridCols, className)}>{children}</div>
}

// Export all components
export default {
  StatCard: StatCardDNA,
  MiniStatCard: MiniStatCardDNA,
  StatCardGrid
}
