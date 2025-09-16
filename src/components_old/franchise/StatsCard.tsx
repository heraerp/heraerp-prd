'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string
  description?: string
  trend?: {
    value: string
    direction: 'up' | 'down'
  }
  icon?: LucideIcon
  variant?: 'default' | 'success' | 'warning' | 'info'
  className?: string
}

export function StatsCard({
  title,
  value,
  description,
  trend,
  icon: Icon,
  variant = 'default',
  className
}: StatsCardProps) {
  const variants = {
    default: {
      card: 'bg-background dark:bg-muted border-border dark:border-border',
      icon: 'text-primary bg-blue-100 dark:bg-blue-900/30',
      value: 'text-foreground dark:text-foreground',
      title: 'text-muted-foreground dark:text-muted-foreground',
      trend: 'text-primary'
    },
    success: {
      card: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      icon: 'text-green-600 bg-green-100 dark:bg-green-900/30',
      value: 'text-green-900 dark:text-green-100',
      title: 'text-green-700 dark:text-green-300',
      trend: 'text-green-600'
    },
    warning: {
      card: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
      value: 'text-yellow-900 dark:text-yellow-100',
      title: 'text-yellow-700 dark:text-yellow-300',
      trend: 'text-yellow-600'
    },
    info: {
      card: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      icon: 'text-primary bg-blue-100 dark:bg-blue-900/30',
      value: 'text-blue-900 dark:text-blue-100',
      title: 'text-blue-700 dark:text-blue-300',
      trend: 'text-primary'
    }
  }

  const currentVariant = variants[variant]

  return (
    <div
      className={cn(
        'rounded-xl border p-6 shadow-sm transition-all duration-200 hover:shadow-md',
        currentVariant.card,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={cn('text-sm font-medium', currentVariant.title)}>{title}</p>
          <div className="flex items-baseline mt-1">
            <p className={cn('text-3xl font-bold', currentVariant.value)}>{value}</p>
            {trend && (
              <span
                className={cn(
                  'ml-2 text-sm font-medium',
                  trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.direction === 'up' ? '↗' : '↘'} {trend.value}
              </span>
            )}
          </div>
          {description && <p className={cn('text-sm mt-1', currentVariant.title)}>{description}</p>}
        </div>

        {Icon && (
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-lg',
              currentVariant.icon
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  )
}

interface StatsGridProps {
  stats: Array<{
    title: string
    value: string
    description?: string
    trend?: {
      value: string
      direction: 'up' | 'down'
    }
    icon?: LucideIcon
    variant?: 'default' | 'success' | 'warning' | 'info'
  }>
  className?: string
}

export function StatsGrid({ stats, className }: StatsGridProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  )
}
