'use client'

/**
 * HERA DNA Migration Version
 * Original: src/components/franchise/StatsCard.tsx
 * Enhanced with HERA DNA glass effects and improved dark mode visibility
 */

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGlassEffect } from '@/lib/dna/design-system/glass-effects-2.0'

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
  // DNA enhancements
  glassIntensity?: 'subtle' | 'medium' | 'strong' | 'ultra'
  enableDNA?: boolean
}

export function StatsCard({
  title,
  value,
  description,
  trend,
  icon: Icon,
  variant = 'default',
  className,
  glassIntensity = 'medium',
  enableDNA = true
}: StatsCardProps) {
  // Map variants to DNA glass variants
  const dnaVariantMap = {
    default: 'default',
    success: 'success',
    warning: 'warning',
    info: 'primary'
  } as const

  // Use glass effects if DNA is enabled
  const { className: glassClassName } = useGlassEffect({
    intensity: glassIntensity,
    variant: dnaVariantMap[variant],
    enableShine: false,
    enableParticles: false,
    enableDepth: false
  })

  // Enhanced color variants with better dark mode support
  const variants = {
    default: {
      card: enableDNA ? '' : 'bg-background dark:bg-muted border-border dark:border-border',
      icon: 'text-primary bg-blue-100/80 dark:bg-blue-900/30',
      value: '!text-foreground dark:!text-foreground', // Force color with !important
      title: 'text-muted-foreground dark:text-slate-300',
      trend: 'text-primary dark:text-blue-400'
    },
    success: {
      card: enableDNA
        ? ''
        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      icon: 'text-green-600 bg-green-100/80 dark:bg-green-900/30',
      value: '!text-green-900 dark:!text-green-100', // Force color with !important
      title: 'text-green-700 dark:text-green-300',
      trend: 'text-green-600 dark:text-green-400'
    },
    warning: {
      card: enableDNA
        ? ''
        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-600 bg-yellow-100/80 dark:bg-yellow-900/30',
      value: '!text-yellow-900 dark:!text-yellow-100', // Force color with !important
      title: 'text-yellow-700 dark:text-yellow-300',
      trend: 'text-yellow-600 dark:text-yellow-400'
    },
    info: {
      card: enableDNA ? '' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      icon: 'text-primary bg-blue-100/80 dark:bg-blue-900/30',
      value: '!text-blue-900 dark:!text-blue-100', // Force color with !important
      title: 'text-blue-700 dark:text-blue-300',
      trend: 'text-primary dark:text-blue-400'
    }
  }

  const currentVariant = variants[variant]

  return (
    <div
      className={cn(
        'rounded-xl border p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
        enableDNA ? glassClassName : currentVariant.card,
        'relative overflow-hidden', // For glass effects
        className
      )}
    >
      {/* Optional shine effect for DNA cards */}
      {enableDNA && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      )}

      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1">
          <p className={cn('text-sm font-medium', currentVariant.title)}>{title}</p>
          <div className="flex items-baseline mt-1">
            <p className={cn('text-3xl font-bold', currentVariant.value)}>{value}</p>
            {trend && (
              <span
                className={cn(
                  'ml-2 text-sm font-medium',
                  trend.direction === 'up'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
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
              enableDNA ? 'backdrop-blur-sm' : '',
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
  // DNA enhancements
  glassIntensity?: 'subtle' | 'medium' | 'strong' | 'ultra'
  enableDNA?: boolean
}

export function StatsGrid({
  stats,
  className,
  glassIntensity = 'medium',
  enableDNA = true
}: StatsGridProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} glassIntensity={glassIntensity} enableDNA={enableDNA} />
      ))}
    </div>
  )
}
