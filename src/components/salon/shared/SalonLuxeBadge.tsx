'use client'

import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

interface SalonLuxeBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'skill' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  emphasis?: 'low' | 'medium' | 'high' // Controls background intensity
}

/**
 * SALON LUXE BADGE COMPONENT
 *
 * Enterprise-grade badge component with salon luxe theme.
 * Uses inline styles to prevent global CSS overrides.
 *
 * Variants:
 * - success: Green background with champagne text (e.g., "Available")
 * - warning: Gold background with dark text
 * - danger: Rose background with champagne text
 * - info: Charcoal background with gold text
 * - skill: Muted background with champagne text (for skill tags)
 * - gold: Gold border with gold text
 *
 * Emphasis:
 * - low: Subtle background (10-12% opacity)
 * - medium: Medium background (15-20% opacity)
 * - high: Strong background (20-30% opacity)
 *
 * @example
 * <SalonLuxeBadge variant="success" emphasis="medium">Available</SalonLuxeBadge>
 * <SalonLuxeBadge variant="skill" size="sm">Hair Styling</SalonLuxeBadge>
 */
export function SalonLuxeBadge({
  variant = 'info',
  size = 'md',
  emphasis = 'medium',
  className,
  children,
  ...props
}: SalonLuxeBadgeProps) {
  // Size styles
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  }

  // Get variant styles (inline to prevent CSS overrides)
  const getVariantStyles = (): React.CSSProperties => {
    const emphasisValues = {
      low: { bg: 0.1, border: 0.25 },
      medium: { bg: 0.15, border: 0.35 },
      high: { bg: 0.2, border: 0.4 },
    }

    const emp = emphasisValues[emphasis]

    switch (variant) {
      case 'success':
        return {
          backgroundColor: `rgba(15, 111, 92, ${emp.bg})`,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: `rgba(15, 111, 92, ${emp.border})`,
          color: emphasis === 'high' ? SALON_LUXE_COLORS.champagne.light : SALON_LUXE_COLORS.champagne.base,
          fontWeight: 700,
        }

      case 'warning':
        return {
          background: `linear-gradient(135deg, rgba(212, 175, 55, ${emp.bg + 0.05}) 0%, rgba(212, 175, 55, ${emp.bg}) 100%)`,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: `rgba(212, 175, 55, ${emp.border})`,
          color: SALON_LUXE_COLORS.gold.base,
          fontWeight: 600,
        }

      case 'danger':
        return {
          backgroundColor: `rgba(232, 180, 184, ${emp.bg})`,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: `rgba(232, 180, 184, ${emp.border})`,
          color: SALON_LUXE_COLORS.danger.base,
          fontWeight: 600,
        }

      case 'skill':
        return {
          backgroundColor: `rgba(48, 48, 48, ${emp.bg + 0.6})`, // Charcoal with higher base opacity
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: `rgba(212, 175, 55, ${emp.border - 0.1})`,
          color: SALON_LUXE_COLORS.text.secondary,
          fontWeight: 500,
        }

      case 'gold':
        return {
          backgroundColor: 'transparent',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: SALON_LUXE_COLORS.gold.base,
          color: SALON_LUXE_COLORS.gold.base,
          fontWeight: 600,
        }

      case 'info':
      default:
        return {
          backgroundColor: SALON_LUXE_COLORS.charcoal.light,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: SALON_LUXE_COLORS.border.muted,
          color: SALON_LUXE_COLORS.text.secondary,
          fontWeight: 500,
        }
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-all duration-200',
        sizeStyles[size],
        className
      )}
      style={getVariantStyles()}
      {...props}
    >
      {children}
    </span>
  )
}
