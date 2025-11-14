/**
 * HERA DNA Enterprise Stats Card
 * Advanced metrics display with real-time updates, animations, and enterprise features
 */

'use client'

import React, { useEffect, useState } from 'react'
import { LucideIcon, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { EnterpriseCard } from './EnterpriseCard'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface MetricData {
  current: number | string
  previous?: number | string
  target?: number | string
  unit?: string
  format?: 'number' | 'currency' | 'percentage' | 'compact'
  precision?: number
}

export interface EnterpriseStatsCardProps {
  // Core props
  title: string
  metric: MetricData
  description?: string
  icon?: LucideIcon

  // Visual variants
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  layout?: 'horizontal' | 'vertical' | 'compact'

  // Enterprise features
  trend?: {
    value: number
    period?: string
    showArrow?: boolean
  }
  sparkline?: number[]
  comparison?: {
    label: string
    value: string
    type?: 'positive' | 'negative' | 'neutral'
  }
  badge?: {
    text: string
    variant?: 'default' | 'success' | 'warning' | 'danger'
  }

  // Interactivity
  onClick?: () => void
  href?: string
  tooltip?: string
  expandable?: boolean
  selectable?: boolean

  // Real-time features
  live?: boolean
  updateInterval?: number
  animate?: boolean

  // Glass effects (inherited from EnterpriseCard)
  glassIntensity?: 'subtle' | 'medium' | 'strong' | 'ultra'
  glow?: boolean
  shimmer?: boolean

  // Additional
  className?: string
  loading?: boolean
  error?: string
}

// Format metric based on type
function formatMetric(metric: MetricData): string {
  const { current, unit = '', format = 'number', precision = 0 } = metric

  if (typeof current === 'string') return current

  let formatted: string

  switch (format) {
    case 'currency':
      formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      }).format(current)
      break

    case 'percentage':
      formatted = `${current.toFixed(precision)}%`
      break

    case 'compact':
      formatted = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: precision
      }).format(current)
      break

    default:
      formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      }).format(current)
  }

  return `${formatted}${unit}`
}

// Calculate trend from metric data
function calculateTrend(metric: MetricData): number | null {
  if (
    !metric.previous ||
    typeof metric.current !== 'number' ||
    typeof metric.previous !== 'number'
  ) {
    return null
  }

  const change = ((metric.current - metric.previous) / metric.previous) * 100
  return Math.round(change * 10) / 10 // Round to 1 decimal
}

// Mini sparkline component
const Sparkline: React.FC<{ data: number[]; color?: string }> = ({
  data,
  color = 'currentColor'
}) => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 100
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export const EnterpriseStatsCard = React.forwardRef<HTMLDivElement, EnterpriseStatsCardProps>(
  (
    {
      title,
      metric,
      description,
      icon: Icon,
      variant = 'default',
      size = 'md',
      layout = 'vertical',
      trend,
      sparkline,
      comparison,
      badge,
      onClick,
      href,
      tooltip,
      expandable = false,
      selectable = false,
      live = false,
      updateInterval = 5000,
      animate = true,
      glassIntensity = 'medium',
      glow = false,
      shimmer = false,
      className,
      loading = false,
      error,
      ...props
    },
    ref
  ) => {
    const [isExpanded, setIsExpanded] = React.useState(false)
    const [isSelected, setIsSelected] = React.useState(false)
    const [currentValue, setCurrentValue] = React.useState(metric.current)

    // Auto-calculate trend if not provided
    const calculatedTrend = trend?.value ?? calculateTrend(metric)

    // Live updates simulation
    React.useEffect(() => {
      if (!live || typeof metric.current !== 'number') return

      const interval = setInterval(() => {
        // Simulate value change (±5%)
        const change = (Math.random() - 0.5) * 0.1
        setCurrentValue(prev => {
          const newVal = typeof prev === 'number' ? prev * (1 + change) : metric.current
          return newVal
        })
      }, updateInterval)

      return () => clearInterval(interval)
    }, [live, metric.current, updateInterval])

    // Size configurations
    const sizeConfig = {
      sm: {
        title: 'text-xs font-medium',
        value: 'text-lg font-semibold',
        icon: 'w-4 h-4',
        iconContainer: 'w-8 h-8',
        spacing: 'gap-2'
      },
      md: {
        title: 'text-sm font-medium',
        value: 'text-2xl font-bold',
        icon: 'w-5 h-5',
        iconContainer: 'w-10 h-10',
        spacing: 'gap-3'
      },
      lg: {
        title: 'text-base font-medium',
        value: 'text-3xl font-bold',
        icon: 'w-6 h-6',
        iconContainer: 'w-12 h-12',
        spacing: 'gap-4'
      },
      xl: {
        title: 'text-lg font-medium',
        value: 'text-4xl font-bold',
        icon: 'w-8 h-8',
        iconContainer: 'w-14 h-14',
        spacing: 'gap-4'
      }
    }

    const config = sizeConfig[size]

    // Variant styles
    const variantStyles = {
      default: {
        icon: 'text-primary bg-blue-100 dark:bg-blue-900/30',
        accent: 'text-primary',
        glow: 'rgba(59, 130, 246, 0.3)'
      },
      success: {
        icon: 'text-green-600 bg-green-100 dark:bg-green-900/30',
        accent: 'text-green-600',
        glow: 'rgba(34, 197, 94, 0.3)'
      },
      warning: {
        icon: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
        accent: 'text-amber-600',
        glow: 'rgba(251, 146, 60, 0.3)'
      },
      danger: {
        icon: 'text-red-600 bg-red-100 dark:bg-red-900/30',
        accent: 'text-red-600',
        glow: 'rgba(239, 68, 68, 0.3)'
      },
      info: {
        icon: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
        accent: 'text-purple-600',
        glow: 'rgba(168, 85, 247, 0.3)'
      }
    }

    const styles = variantStyles[variant]

    // Trend icon
    const TrendIcon =
      calculatedTrend && calculatedTrend > 0
        ? TrendingUp
        : calculatedTrend && calculatedTrend < 0
          ? TrendingDown
          : Minus

    const cardContent = (
      <EnterpriseCard
        ref={ref}
        className={cn(
          'group transition-all duration-300',
          onClick && 'cursor-pointer',
          isSelected && 'ring-2 ring-primary',
          className
        )}
        glassIntensity={glassIntensity}
        variant={variant === 'info' ? 'primary' : variant}
        glow={glow}
        shimmer={shimmer}
        selected={isSelected && selectable}
        interactive={!!onClick || expandable}
        loading={loading}
        animateOnMount={animate}
        style={{
          boxShadow: glow ? `0 0 30px ${styles.glow}` : undefined
        }}
        onClick={() => {
          if (selectable) setIsSelected(!isSelected)
          if (expandable) setIsExpanded(!isExpanded)
          onClick?.()
        }}
        compact
        {...props}
      >
        <div
          className={cn(
            'flex',
            layout === 'horizontal' ? 'flex-row items-center justify-between' : 'flex-col',
            config.spacing
          )}
        >
          {/* Header section */}
          <div
            className={cn('flex items-start', layout === 'horizontal' ? 'gap-3' : 'gap-3 w-full')}
          >
            {/* Icon */}
            {Icon && (
              <div
                className={cn(
                  'flex items-center justify-center rounded-lg shrink-0',
                  config.iconContainer,
                  styles.icon
                )}
              >
                <Icon className={config.icon} />
              </div>
            )}

            {/* Title and description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h3 className={cn('text-muted-foreground truncate', config.title)}>
                        {title}
                      </h3>
                    </TooltipTrigger>
                    {tooltip && (
                      <TooltipContent>
                        <p>{tooltip}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                {badge && (
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      badge.variant === 'success' && 'bg-green-100 text-green-800',
                      badge.variant === 'warning' && 'bg-amber-100 text-amber-800',
                      badge.variant === 'danger' && 'bg-red-100 text-red-800',
                      (!badge.variant || badge.variant === 'default') && 'bg-muted text-gray-800'
                    )}
                  >
                    {badge.text}
                  </span>
                )}
              </div>

              {description && !isExpanded && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
              )}
            </div>
          </div>

          {/* Metric section */}
          <div className={cn('flex items-baseline gap-2', layout === 'horizontal' ? '' : 'mt-2')}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentValue.toString()}
                initial={animate ? { opacity: 0, y: -10 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className={cn(config.value, 'tabular-nums')}
              >
                {formatMetric({ ...metric, current: currentValue })}
              </motion.div>
            </AnimatePresence>

            {/* Trend indicator */}
            {calculatedTrend !== null && (
              <div
                className={cn(
                  'flex items-center gap-1 text-sm font-medium',
                  calculatedTrend > 0
                    ? 'text-green-600'
                    : calculatedTrend < 0
                      ? 'text-red-600'
                      : 'text-muted-foreground'
                )}
              >
                {trend?.showArrow !== false && <TrendIcon className="w-3 h-3" />}
                <span>{Math.abs(calculatedTrend)}%</span>
                {trend?.period && (
                  <span className="text-xs text-muted-foreground">{trend.period}</span>
                )}
              </div>
            )}
          </div>

          {/* Sparkline */}
          {sparkline && (
            <div className="h-8 w-full mt-2">
              <Sparkline data={sparkline} color={styles.accent} />
            </div>
          )}

          {/* Comparison */}
          {comparison && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <span className="text-xs text-muted-foreground">{comparison.label}</span>
              <span
                className={cn(
                  'text-xs font-medium',
                  comparison.type === 'positive' && 'text-green-600',
                  comparison.type === 'negative' && 'text-red-600',
                  comparison.type === 'neutral' && 'text-muted-foreground'
                )}
              >
                {comparison.value}
              </span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex items-center gap-2 mt-2 text-xs text-red-600">
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && description && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border/50">
                {description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live indicator */}
        {live && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Live
              </span>
            </div>
          </div>
        )}
      </EnterpriseCard>
    )

    // Wrap with link if href provided
    if (href) {
      return (
        <a href={href} className="block no-underline">
          {cardContent}
        </a>
      )
    }

    return cardContent
  }
)

EnterpriseStatsCard.displayName = 'EnterpriseStatsCard'

// Stats grid for layout
export const StatsGrid: React.FC<{
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  className?: string
}> = ({ children, columns = 4, className }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  }

  return <div className={cn('grid gap-4', gridCols[columns], className)}>{children}</div>
}
