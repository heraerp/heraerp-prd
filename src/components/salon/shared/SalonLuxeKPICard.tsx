'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

interface SalonLuxeKPICardProps {
  /** Card title (e.g., "Total Services", "Active Staff") */
  title: string
  /** Main metric value to display */
  value: string | number
  /** Icon component from lucide-react */
  icon: LucideIcon
  /** Primary color for the card theme */
  color: string
  /** Optional gradient background override */
  gradient?: string
  /** Optional description text below the value */
  description?: string
  /** Optional percentage badge (e.g., "85%") */
  percentageBadge?: string
  /** Optional click handler */
  onClick?: () => void
  /** Animation delay in milliseconds */
  animationDelay?: number
}

/**
 * 🎨 SALON LUXE KPI CARD
 *
 * Enterprise-grade KPI card component matching Services page design.
 * Features from Services page:
 * - Icon badge in top-left corner
 * - Uppercase labels with wide letter-spacing (0.12em)
 * - Fixed 3xl font size for numbers
 * - Dot indicator + description text
 * - Shimmer animation on hover
 * - Multi-layer gradients and shadows
 * - 📱 Mobile-responsive sizing
 *
 * @example
 * <SalonLuxeKPICard
 *   title="Total Services"
 *   value={42}
 *   icon={Sparkles}
 *   color="#8C7853"
 *   description="Across all categories"
 * />
 */
export function SalonLuxeKPICard({
  title,
  value,
  icon: Icon,
  color,
  gradient,
  description,
  percentageBadge,
  onClick,
  animationDelay = 0
}: SalonLuxeKPICardProps) {
  const defaultGradient = `linear-gradient(135deg, ${color}25 0%, ${color}15 20%, ${SALON_LUXE_COLORS.charcoal.dark}dd 60%, ${SALON_LUXE_COLORS.charcoal.dark}cc 100%)`
  const finalGradient = gradient || defaultGradient

  // Generate shadow color from the main color (reduce opacity for shadow)
  const shadowColor = color + '30'

  return (
    <div
      className="group relative p-3 md:p-4 lg:p-5 rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-95 hover:shadow-2xl cursor-pointer animate-in fade-in slide-in-from-bottom-2"
      style={{
        background: finalGradient,
        border: `2px solid ${color}70`,
        boxShadow: `0 10px 40px rgba(0,0,0,0.6), inset 0 1px 0 ${shadowColor}`,
        animationDelay: `${animationDelay}ms`
      }}
      onClick={onClick}
    >
      {/* 🎨 ANIMATED SHIMMER on hover - SERVICES PAGE PATTERN */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${color}25 0%, transparent 50%)`
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2 md:mb-3">
          {/* Icon Badge - Top Left */}
          <div
            className="p-1.5 md:p-2 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
            style={{
              background: `linear-gradient(135deg, ${color}30 0%, ${color}15 100%)`,
              border: `1px solid ${color}60`,
              boxShadow: `0 4px 16px ${color}20`
            }}
          >
            <Icon className="h-3 w-3 md:h-4 md:w-4" style={{ color }} />
          </div>

          {/* Optional Percentage Badge - Top Right */}
          {percentageBadge && (
            <div
              className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
              style={{
                background: `linear-gradient(135deg, ${color}30 0%, ${color}18 100%)`,
                color,
                border: `1px solid ${color}50`
              }}
            >
              {percentageBadge}
            </div>
          )}
        </div>

        {/* Label - Uppercase with wide letter-spacing (Services page pattern) */}
        <p
          className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2"
          style={{
            color: SALON_LUXE_COLORS.champagne.base,
            letterSpacing: '0.12em',
            opacity: 0.95
          }}
        >
          {title}
        </p>

        {/* Value - Fixed 3xl size (Services page pattern) */}
        <p
          className="text-2xl md:text-3xl font-bold mb-0.5 md:mb-1 tracking-tight"
          style={{ color: SALON_LUXE_COLORS.champagne.base }}
        >
          {value}
        </p>

        {/* Description with dot indicator */}
        {description && (
          <div className="flex items-center gap-1 md:gap-1.5 mt-1 md:mt-2">
            <div
              className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <p
              className="text-[9px] md:text-xs font-medium"
              style={{ color: SALON_LUXE_COLORS.champagne.base, opacity: 0.8 }}
            >
              {description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
