'use client'

import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

interface SalonLuxeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'outline' | 'ghost' | 'tile'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

/**
 * SALON LUXE BUTTON COMPONENT
 *
 * Enterprise-grade button component with salon luxe theme.
 * Uses inline styles to prevent global CSS overrides.
 *
 * Variants:
 * - primary: Solid gold gradient with dark text (high visibility, primary CTA)
 * - danger: Rose/pink for destructive actions
 * - outline: Transparent with border
 * - ghost: Minimal styling
 * - tile: Glassmorphism tile style with golden borders (appointments page style)
 *
 * @example
 * <SalonLuxeButton variant="primary">Confirm</SalonLuxeButton>
 * <SalonLuxeButton variant="danger">Cancel</SalonLuxeButton>
 * <SalonLuxeButton variant="outline" icon={<Save />}>Save</SalonLuxeButton>
 * <SalonLuxeButton variant="tile">Appointments Tile</SalonLuxeButton>
 */
export const SalonLuxeButton = forwardRef<HTMLButtonElement, SalonLuxeButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, icon, children, className, disabled, ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false)

    // Size styles
    const sizeStyles = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-12 px-6 text-base',
      lg: 'h-14 px-8 text-lg',
    }

    // Get variant styles (inline to prevent CSS overrides)
    const getVariantStyles = () => {
      const baseStyle: React.CSSProperties = {
        // Use separate transition properties to avoid conflicts
        transitionProperty: 'all',
        transitionDuration: '300ms',
        transitionTimingFunction: 'ease',
        fontWeight: variant === 'primary' ? 700 : 600,
      }

      if (disabled) {
        return {
          ...baseStyle,
          backgroundColor: 'rgba(48, 48, 48, 0.6)',
          color: 'rgba(154, 163, 174, 0.6)',
          borderWidth: '2px',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          cursor: 'not-allowed',
          opacity: 0.7,
        }
      }

      switch (variant) {
        case 'primary':
          return isHovered
            ? {
                ...baseStyle,
                // ✨ ENHANCED: Brighter gold gradient with excellent visibility
                background: `linear-gradient(135deg, #E3C75F 0%, #D4AF37 100%)`,
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: '#F0D584',
                // Dark text for maximum contrast on bright gold
                color: '#0F0F0F',
                fontWeight: 700,
                boxShadow: `0 4px 16px rgba(212, 175, 55, 0.50), inset 0 1px 0 rgba(255, 255, 255, 0.25)`,
                transform: 'translateY(-2px) scale(1.02)',
              }
            : {
                ...baseStyle,
                // ✨ ENHANCED: Strong gold presence for primary CTA
                background: `linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)`,
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'rgba(212, 175, 55, 0.70)',
                // Dark text for excellent readability
                color: '#0F0F0F',
                fontWeight: 700,
                boxShadow: `0 2px 12px rgba(212, 175, 55, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.20)`,
              }

        case 'danger':
          return isHovered
            ? {
                ...baseStyle,
                backgroundColor: SALON_LUXE_COLORS.danger.light,
                borderWidth: '2px',
                borderColor: SALON_LUXE_COLORS.danger.border,
                color: SALON_LUXE_COLORS.danger.base,
                boxShadow: `0 2px 12px ${SALON_LUXE_COLORS.shadow.danger}`,
              }
            : {
                ...baseStyle,
                backgroundColor: SALON_LUXE_COLORS.danger.lighter,
                borderWidth: '2px',
                borderColor: SALON_LUXE_COLORS.danger.borderLight,
                color: SALON_LUXE_COLORS.danger.base,
              }

        case 'outline':
          return isHovered
            ? {
                ...baseStyle,
                backgroundColor: 'rgba(212, 175, 55, 0.05)', // Reduced from 0.08
                borderWidth: '2px',
                borderColor: 'rgba(212, 175, 55, 0.4)', // Reduced from 0.5
                color: SALON_LUXE_COLORS.champagne.base,
                boxShadow: `0 2px 8px rgba(212, 175, 55, 0.10)`, // Reduced from 0.15
              }
            : {
                ...baseStyle,
                backgroundColor: 'transparent',
                borderWidth: '2px',
                borderColor: SALON_LUXE_COLORS.border.base,
                color: SALON_LUXE_COLORS.text.primary,
              }

        case 'ghost':
          return isHovered
            ? {
                ...baseStyle,
                backgroundColor: SALON_LUXE_COLORS.charcoal.light,
                color: SALON_LUXE_COLORS.text.primary,
              }
            : {
                ...baseStyle,
                backgroundColor: 'transparent',
                color: SALON_LUXE_COLORS.text.secondary,
              }

        case 'tile':
          return isHovered
            ? {
                ...baseStyle,
                // Very subtle hover - minimal brightness change
                background: `linear-gradient(135deg, rgba(212, 175, 55, 0.13) 0%, rgba(184, 134, 11, 0.17) 100%)`,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'rgba(212, 175, 55, 0.55)',
                borderRadius: '16px',
                // Darker text for better readability - using darker bronze
                color: SALON_LUXE_COLORS.bronze.base,
                fontWeight: 700,
                letterSpacing: '0.02em',
                boxShadow: '0 10px 30px rgba(212, 175, 55, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                transform: 'translateY(-1px)',
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // spring animation
                position: 'relative' as const,
                overflow: 'hidden' as const,
              }
            : {
                ...baseStyle,
                background: `linear-gradient(135deg, rgba(212, 175, 55, 0.10) 0%, rgba(184, 134, 11, 0.15) 100%)`,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'rgba(212, 175, 55, 0.50)',
                borderRadius: '16px',
                color: SALON_LUXE_COLORS.champagne.base,
                fontWeight: 700,
                letterSpacing: '0.02em',
                boxShadow: '0 8px 24px rgba(212, 175, 55, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // spring animation
                position: 'relative' as const,
                overflow: 'hidden' as const,
              }

        default:
          return baseStyle
      }
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          sizeStyles[size],
          className
        )}
        style={getVariantStyles()}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {children}
          </>
        ) : (
          <>
            {icon && <span className="mr-2 flex items-center">{icon}</span>}
            {children}
          </>
        )}
      </button>
    )
  }
)

SalonLuxeButton.displayName = 'SalonLuxeButton'
