'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface PremiumCardProps {
  children: React.ReactNode
  className?: string
  /** Card elevation level */
  elevation?: 'flat' | 'low' | 'medium' | 'high'
  /** Interactive card (adds hover/active states) */
  interactive?: boolean
  /** Click handler */
  onClick?: () => void
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

/**
 * 📱 PREMIUM CARD
 *
 * Native iOS-style card with depth and shadows.
 * Inspired by Apple Card, Instagram stories, Airbnb listings.
 *
 * Features:
 * - Subtle shadows (no heavy borders)
 * - Frosted glass background
 * - Smooth scale animations
 * - Clean and minimal
 * - Proper depth hierarchy
 */
export function PremiumCard({
  children,
  className,
  elevation = 'medium',
  interactive = false,
  onClick,
  padding = 'md'
}: PremiumCardProps) {
  const shadows = {
    flat: 'none',
    low: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    medium:
      '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
    high: '0 8px 24px rgba(0, 0, 0, 0.25), 0 4px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
  }

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl backdrop-blur-xl transition-all duration-300',
        paddings[padding],
        interactive && 'cursor-pointer active:scale-[0.98] hover:scale-[1.01]',
        className
      )}
      style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(15, 15, 15, 0.95) 100%)',
        border: '0.5px solid rgba(212, 175, 55, 0.12)',
        boxShadow: shadows[elevation],
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
    >
      {children}
    </div>
  )
}

/**
 * 📱 PREMIUM STAT CARD
 *
 * Premium stats card with large numbers and subtle design.
 */
interface PremiumStatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  color?: string
}

export function PremiumStatCard({ label, value, icon, trend, color = '#D4AF37' }: PremiumStatCardProps) {
  return (
    <PremiumCard elevation="low" padding="md" className="relative overflow-hidden group">
      {/* Background Glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${color}15 0%, transparent 70%)`
        }}
      />

      <div className="relative z-10">
        {/* Icon & Label */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{
              color: '#8C7853',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
            }}
          >
            {label}
          </span>
          {icon && (
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: `${color}15`,
                border: `0.5px solid ${color}30`
              }}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-2">
          <span
            className="text-[32px] font-bold tracking-tight"
            style={{
              color: '#F5E6C8',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
              letterSpacing: '-0.03em'
            }}
          >
            {value}
          </span>

          {/* Trend */}
          {trend && (
            <span
              className="text-sm font-semibold"
              style={{
                color: trend.direction === 'up' ? '#0F6F5C' : '#E8B4B8'
              }}
            >
              {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
      </div>
    </PremiumCard>
  )
}

/**
 * 📱 PREMIUM LIST ITEM
 *
 * Clean list item with chevron and tap feedback.
 */
interface PremiumListItemProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  badge?: string | number
  onClick?: () => void
  rightContent?: React.ReactNode
}

export function PremiumListItem({
  title,
  subtitle,
  icon,
  badge,
  onClick,
  rightContent
}: PremiumListItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 active:scale-[0.98] transition-transform duration-200 text-left"
      style={{
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
    >
      {/* Icon */}
      {icon && (
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)',
            border: '0.5px solid rgba(212, 175, 55, 0.2)'
          }}
        >
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className="font-semibold text-base truncate"
            style={{
              color: '#F5E6C8',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
            }}
          >
            {title}
          </p>
          {badge && (
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{
                backgroundColor: 'rgba(212, 175, 55, 0.2)',
                color: '#D4AF37'
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p
            className="text-sm mt-0.5 truncate"
            style={{
              color: '#8C7853'
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Right Content */}
      {rightContent || (
        <svg
          className="w-5 h-5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="#8C7853"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  )
}
