'use client'

import { ButtonHTMLAttributes, forwardRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HERAButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'outline' | 'ghost' | 'tile'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

/**
 * HERA BUTTON COMPONENT
 *
 * Enterprise-grade button component with HERA platform theme.
 * Uses inline styles to prevent global CSS overrides.
 *
 * Variants:
 * - primary: Solid indigo-to-purple gradient (high visibility, primary CTA)
 * - danger: Red/rose for destructive actions
 * - outline: Transparent with border
 * - ghost: Minimal styling
 * - tile: Glassmorphism tile style with indigo borders
 *
 * @example
 * <HERAButton variant="primary">Confirm</HERAButton>
 * <HERAButton variant="danger">Cancel</HERAButton>
 * <HERAButton variant="outline" icon={<Save />}>Save</HERAButton>
 * <HERAButton variant="tile">Dashboard Tile</HERAButton>
 */
export const HERAButton = forwardRef<HTMLButtonElement, HERAButtonProps>(
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
        transitionProperty: 'all',
        transitionDuration: '300ms',
        transitionTimingFunction: 'ease',
        fontWeight: variant === 'primary' ? 700 : 600,
      }

      if (disabled) {
        return {
          ...baseStyle,
          backgroundColor: 'rgba(51, 65, 85, 0.6)',
          color: 'rgba(148, 163, 184, 0.6)',
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
                // Brighter indigo-purple gradient on hover
                background: `linear-gradient(135deg, #6366F1 0%, #A855F7 100%)`,
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: '#818CF8',
                color: '#FFFFFF',
                fontWeight: 700,
                boxShadow: `0 4px 16px rgba(99, 102, 241, 0.50), inset 0 1px 0 rgba(255, 255, 255, 0.25)`,
                transform: 'translateY(-2px) scale(1.02)',
              }
            : {
                ...baseStyle,
                // Strong indigo-purple gradient for primary CTA
                background: `linear-gradient(135deg, #4F46E5 0%, #9333EA 100%)`,
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'rgba(99, 102, 241, 0.70)',
                color: '#FFFFFF',
                fontWeight: 700,
                boxShadow: `0 2px 12px rgba(99, 102, 241, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.20)`,
              }

        case 'danger':
          return isHovered
            ? {
                ...baseStyle,
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                borderWidth: '2px',
                borderColor: 'rgba(239, 68, 68, 0.5)',
                color: '#F87171',
                boxShadow: `0 2px 12px rgba(239, 68, 68, 0.25)`,
              }
            : {
                ...baseStyle,
                backgroundColor: 'rgba(239, 68, 68, 0.10)',
                borderWidth: '2px',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
              }

        case 'outline':
          return isHovered
            ? {
                ...baseStyle,
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                borderWidth: '2px',
                borderColor: 'rgba(99, 102, 241, 0.4)',
                color: '#A5B4FC',
                boxShadow: `0 2px 8px rgba(99, 102, 241, 0.15)`,
              }
            : {
                ...baseStyle,
                backgroundColor: 'transparent',
                borderWidth: '2px',
                borderColor: 'rgba(148, 163, 184, 0.2)',
                color: '#E2E8F0',
              }

        case 'ghost':
          return isHovered
            ? {
                ...baseStyle,
                backgroundColor: 'rgba(51, 65, 85, 0.5)',
                color: '#F1F5F9',
              }
            : {
                ...baseStyle,
                backgroundColor: 'transparent',
                color: '#CBD5E1',
              }

        case 'tile':
          return isHovered
            ? {
                ...baseStyle,
                // Subtle hover - minimal brightness change
                background: `linear-gradient(135deg, rgba(99, 102, 241, 0.13) 0%, rgba(147, 51, 234, 0.17) 100%)`,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'rgba(99, 102, 241, 0.55)',
                borderRadius: '16px',
                color: '#E0E7FF',
                fontWeight: 700,
                letterSpacing: '0.02em',
                boxShadow: '0 10px 30px rgba(99, 102, 241, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                transform: 'translateY(-1px)',
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // spring animation
                position: 'relative' as const,
                overflow: 'hidden' as const,
              }
            : {
                ...baseStyle,
                background: `linear-gradient(135deg, rgba(99, 102, 241, 0.10) 0%, rgba(147, 51, 234, 0.15) 100%)`,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'rgba(99, 102, 241, 0.50)',
                borderRadius: '16px',
                color: '#C7D2FE',
                fontWeight: 700,
                letterSpacing: '0.02em',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
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
          'inline-flex items-center justify-center rounded-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500',
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

HERAButton.displayName = 'HERAButton'
