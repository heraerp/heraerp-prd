/**
 * HERA DNA Enterprise Dashboard Components
 * Modern, animated dashboard layouts with advanced data visualization
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { EnterpriseCard } from './EnterpriseCard'
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Target,
  Zap,
  Globe
} from 'lucide-react'

// Dashboard section with animated header
export const DashboardSection: React.FC<{
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
  icon?: React.ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
  className?: string
}> = ({
  title,
  subtitle,
  actions,
  children,
  icon,
  collapsible = false,
  defaultCollapsed = false,
  className
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('space-y-4', className)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>}
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {actions}
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-muted dark:hover:bg-muted rounded-lg transition-colors"
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

// KPI Card with mini chart
export const KPICard: React.FC<{
  title: string
  value: string | number
  change?: {
    value: number
    trend: 'up' | 'down' | 'neutral'
  }
  chart?: React.ReactNode
  icon?: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  glassIntensity?: 'subtle' | 'medium' | 'strong'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}> = ({
  title,
  value,
  change,
  chart,
  icon,
  variant = 'default',
  glassIntensity = 'medium',
  size = 'md',
  loading = false
}) => {
  const sizeConfig = {
    sm: { padding: 'p-4', value: 'text-2xl', title: 'text-sm' },
    md: { padding: 'p-6', value: 'text-3xl', title: 'text-base' },
    lg: { padding: 'p-8', value: 'text-4xl', title: 'text-lg' }
  }

  const config = sizeConfig[size]

  return (
    <EnterpriseCard
      glassIntensity={glassIntensity}
      variant={variant}
      animateOnMount
      animationPreset="slide"
      className={config.padding}
      loading={loading}
      glow={variant !== 'default'}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className={cn('font-medium text-muted-foreground', config.title)}>{title}</h3>
          {icon && <div className="text-muted-foreground opacity-50">{icon}</div>}
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <div className={cn('font-bold tabular-nums', config.value)}>{value}</div>

            {change && (
              <div
                className={cn(
                  'flex items-center gap-1 text-sm font-medium',
                  change.trend === 'up' && 'text-green-600',
                  change.trend === 'down' && 'text-red-600',
                  change.trend === 'neutral' && 'text-muted-foreground'
                )}
              >
                {change.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                {change.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                <span>{change.value}%</span>
              </div>
            )}
          </div>

          {chart && <div className="w-24 h-12 opacity-50">{chart}</div>}
        </div>
      </div>
    </EnterpriseCard>
  )
}

// Activity feed item
export const ActivityItem: React.FC<{
  icon?: React.ReactNode
  title: string
  description?: string
  timestamp: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
  onClick?: () => void
}> = ({ icon, title, description, timestamp, variant = 'default', onClick }) => {
  const variantStyles = {
    default: 'bg-muted dark:bg-muted text-muted-foreground',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-600'
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'flex gap-3 p-3 rounded-lg hover:bg-muted dark:hover:bg-muted/50 transition-colors',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {icon && (
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
            variantStyles[variant]
          )}
        >
          {icon}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>

      <time className="text-xs text-muted-foreground shrink-0">{timestamp}</time>
    </motion.div>
  )
}

// Chart placeholder with loading animation
export const ChartPlaceholder: React.FC<{
  type?: 'line' | 'bar' | 'donut' | 'area'
  height?: string
  loading?: boolean
}> = ({ type = 'line', height = '300px', loading = false }) => {
  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 dark:bg-muted-foreground/10 rounded-lg" style={{ height }} />
    )
  }

  return (
    <div
      className="flex items-center justify-center bg-muted dark:bg-background/50 rounded-lg border border-dashed border-border dark:border-border"
      style={{ height }}
    >
      <div className="text-center">
        <BarChart3 className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          {type.charAt(0).toUpperCase() + type.slice(1)} chart placeholder
        </p>
      </div>
    </div>
  )
}

// Metric tile for grid layouts
export const MetricTile: React.FC<{
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: number
  format?: (value: any) => string
  color?: string
  className?: string
}> = ({ label, value, icon, trend, format, color, className }) => {
  const formattedValue = format ? format(value) : value

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'p-4 rounded-lg bg-gradient-to-br hover:shadow-md transition-all cursor-pointer',
        color || 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
        className
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {icon && <div className="text-muted-foreground opacity-50">{icon}</div>}
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-bold tabular-nums">{formattedValue}</div>

        {trend !== undefined && (
          <div
            className={cn(
              'text-xs font-medium flex items-center gap-1',
              trend > 0 && 'text-green-600',
              trend < 0 && 'text-red-600',
              trend === 0 && 'text-muted-foreground'
            )}
          >
            {trend > 0 && '↑'}
            {trend < 0 && '↓'}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Progress indicator
export const ProgressIndicator: React.FC<{
  label: string
  value: number
  max: number
  showPercentage?: boolean
  variant?: 'default' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
}> = ({
  label,
  value,
  max,
  showPercentage = true,
  variant = 'default',
  size = 'md',
  animate = true
}) => {
  const percentage = Math.round((value / max) * 100)

  const variantColors = {
    default: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500'
  }

  const sizeConfig = {
    sm: { height: 'h-1', text: 'text-xs' },
    md: { height: 'h-2', text: 'text-sm' },
    lg: { height: 'h-3', text: 'text-base' }
  }

  const config = sizeConfig[size]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={cn('font-medium', config.text)}>{label}</span>
        {showPercentage && <span className={cn('tabular-nums', config.text)}>{percentage}%</span>}
      </div>

      <div
        className={cn(
          'w-full bg-gray-200 dark:bg-muted-foreground/10 rounded-full overflow-hidden',
          config.height
        )}
      >
        <motion.div
          initial={animate ? { width: 0 } : false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={cn(config.height, variantColors[variant])}
        />
      </div>
    </div>
  )
}

// Empty state for dashboards
export const DashboardEmptyState: React.FC<{
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}> = ({ icon = <Activity />, title, description, action }) => {
  return (
    <EnterpriseCard className="py-12" glassIntensity="subtle" animateOnMount>
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-muted dark:bg-muted flex items-center justify-center mx-auto text-muted-foreground">
          {icon}
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-medium">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
          )}
        </div>

        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    </EnterpriseCard>
  )
}

// Chevron icon component
const ChevronDown: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const TrendingDown: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
    />
  </svg>
)
