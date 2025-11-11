/**
 * Fiori++ UI Primitives
 * 
 * Reusable enterprise components with glassmorphism design
 * Ready-wired for HERA hooks and responsive behavior
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { glassStyles, fadeIn, fadeSlide } from './design-tokens'
import { cn } from '@/lib/utils'

// Glass Card - Foundation component
export function GlassCard({ 
  children, 
  className = "", 
  hover = false,
  ...props 
}: { 
  children: React.ReactNode
  className?: string
  hover?: boolean
  [key: string]: any
}) {
  return (
    <motion.div 
      className={cn(
        glassStyles.card,
        hover && glassStyles.cardHover,
        className
      )}
      initial={fadeIn.initial}
      animate={fadeIn.animate}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Dynamic Page Shell - Main layout container
export function DynamicPage({
  title,
  subtitle,
  actions,
  headerExtras,
  children,
  footer,
  className = ""
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  headerExtras?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      <GlassCard className="p-4 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <motion.div {...fadeSlide(0)}>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm md:text-base opacity-70 mt-1">
                {subtitle}
              </p>
            )}
          </motion.div>
          {actions && (
            <motion.div 
              className="flex flex-wrap gap-2"
              {...fadeSlide(0.1)}
            >
              {actions}
            </motion.div>
          )}
        </div>
        {headerExtras && (
          <motion.div className="mt-4" {...fadeSlide(0.2)}>
            {headerExtras}
          </motion.div>
        )}
      </GlassCard>

      {/* Main Content */}
      <motion.div className="min-h-[60vh]" {...fadeSlide(0.3)}>
        <GlassCard className="p-2 md:p-4">
          {children}
        </GlassCard>
      </motion.div>

      {/* Footer */}
      {footer && (
        <motion.div className="mt-2" {...fadeSlide(0.4)}>
          {footer}
        </motion.div>
      )}
    </div>
  )
}

// Page Toolbar - Actions and controls
export function PageToolbar({
  left,
  right,
  className = ""
}: {
  left?: React.ReactNode
  right?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(
      "flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-2 md:p-4",
      glassStyles.toolbar,
      "rounded-xl mb-4",
      className
    )}>
      <div className="flex-1 w-full md:w-auto">
        {left}
      </div>
      <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
        {right}
      </div>
    </div>
  )
}

// Filter Bar - Responsive filter grid
export function FilterBar({ 
  children,
  className = ""
}: { 
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-3",
      glassStyles.section,
      "rounded-xl",
      className
    )}>
      {children}
    </div>
  )
}

// Section - Content grouping with glassmorphism
export function Section({ 
  title, 
  children, 
  actions,
  className = "",
  collapsible = false
}: { 
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
  collapsible?: boolean
}) {
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  return (
    <motion.div 
      className={cn(glassStyles.section, "rounded-2xl", className)}
      {...fadeSlide()}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-black/10 rounded transition-colors"
            >
              <motion.div
                animate={{ rotate: isCollapsed ? -90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▼
              </motion.div>
            </button>
          )}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        {actions && (
          <div className="flex gap-2">
            {actions}
          </div>
        )}
      </div>
      
      <motion.div
        initial={false}
        animate={{ 
          height: isCollapsed ? 0 : 'auto',
          opacity: isCollapsed ? 0 : 1
        }}
        transition={{ duration: 0.2 }}
        style={{ overflow: 'hidden' }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

// KPI Card - Dashboard metrics
export function KPI({ 
  label, 
  value, 
  sub, 
  trend,
  icon,
  color = "blue",
  className = ""
}: { 
  label: string
  value: string
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  color?: string
  className?: string
}) {
  return (
    <GlassCard 
      className={cn("p-4 md:p-6", className)}
      hover
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm opacity-60 font-medium mb-1">
            {label}
          </div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </div>
          {sub && (
            <div className="text-xs opacity-60 mt-1">
              {sub}
            </div>
          )}
          {trend && (
            <div className={cn(
              "text-xs font-medium mt-2 flex items-center gap-1",
              trend === 'up' && "text-green-600",
              trend === 'down' && "text-red-600", 
              trend === 'neutral' && "text-gray-600"
            )}>
              {trend === 'up' && '↗'}
              {trend === 'down' && '↘'}
              {trend === 'neutral' && '→'}
              {sub}
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            `bg-${color}-100 text-${color}-600`
          )}>
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  )
}

// Status Badge - Glassmorphic status indicators
export function StatusBadge({ 
  status, 
  variant = "default",
  className = ""
}: { 
  status: string
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  className?: string
}) {
  const variants = {
    default: "bg-gray-100/80 text-gray-700 border-gray-200",
    success: "bg-green-100/80 text-green-700 border-green-200",
    warning: "bg-yellow-100/80 text-yellow-700 border-yellow-200", 
    error: "bg-red-100/80 text-red-700 border-red-200",
    info: "bg-blue-100/80 text-blue-700 border-blue-200"
  }

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      "backdrop-blur-sm border",
      variants[variant],
      className
    )}>
      {status}
    </span>
  )
}

// Loading Skeleton - Glassmorphic loading states
export function LoadingSkeleton({ 
  className = "",
  lines = 1 
}: { 
  className?: string
  lines?: number
}) {
  return (
    <div className={cn("animate-pulse", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i}
          className="h-4 bg-gray-200/60 dark:bg-gray-700/40 rounded-lg mb-2 last:mb-0 backdrop-blur-sm"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  )
}

// Empty State - Friendly empty states
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = ""
}: {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <motion.div 
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
      {...fadeSlide()}
    >
      <div className="w-16 h-16 rounded-2xl bg-gray-100/80 dark:bg-gray-800/60 flex items-center justify-center mb-4 backdrop-blur-sm">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          {description}
        </p>
      )}
      {action && action}
    </motion.div>
  )
}