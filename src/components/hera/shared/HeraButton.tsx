'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { HERA_THEME_GRADIENTS, HERA_THEME_COLORS, withOpacity } from '@/lib/constants/hera-theme-colors'

interface HeraButtonProps {
  children: ReactNode
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost'
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Disabled state */
  disabled?: boolean
  /** Loading state */
  loading?: boolean
  /** Click handler */
  onClick?: () => void
  /** Custom className */
  className?: string
  /** Button type */
  type?: 'button' | 'submit' | 'reset'
}

/**
 * HERA BUTTON COMPONENT
 *
 * Animated button with gradient backgrounds and hover effects
 * Consistent with HERA theme's indigo/purple/cyan palette
 *
 * Features:
 * - Gradient backgrounds with shimmer effects
 * - Smooth scale and shadow transitions
 * - Loading state with spinner
 * - Multiple variants and sizes
 * - Fully accessible
 *
 * @example
 * <HeraButton variant="primary" size="lg">
 *   Get Started
 * </HeraButton>
 */
export function HeraButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className,
  type = 'button',
}: HeraButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-xl',
  }

  const baseClasses =
    'group relative overflow-hidden font-medium transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900'

  const variantStyles = {
    primary: (
      <>
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: HERA_THEME_GRADIENTS.buttonPrimary,
          }}
        />

        {/* Hover overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
          }}
        />

        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute inset-0 animate-hera-shimmer">
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                transform: 'translateX(-100%)',
              }}
            />
          </div>
        </div>

        {/* Border */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            border: `1px solid ${HERA_THEME_COLORS.border.base}`,
          }}
        />
      </>
    ),

    secondary: (
      <>
        {/* Background */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: withOpacity(HERA_THEME_COLORS.background.base, 0.5),
            border: `1px solid ${HERA_THEME_COLORS.border.base}`,
            backdropFilter: 'blur(12px)',
          }}
        />

        {/* Hover glow */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(90deg, ${withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.1)} 0%, ${withOpacity(HERA_THEME_COLORS.primary.purple.base, 0.1)} 100%)`,
          }}
        />
      </>
    ),

    ghost: (
      <>
        {/* Hover background */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.1),
          }}
        />
      </>
    ),
  }

  const textColors = {
    primary: 'text-white',
    secondary: `text-${HERA_THEME_COLORS.text.primary}`,
    ghost: `text-${HERA_THEME_COLORS.primary.indigo.base}`,
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        sizeClasses[size],
        'hover:scale-105 hover:shadow-xl',
        disabled || loading ? '' : 'active:scale-95',
        className
      )}
      style={{
        boxShadow: variant === 'primary' ? `0 8px 24px ${HERA_THEME_COLORS.shadow.indigoLight}` : undefined,
      }}
    >
      {variantStyles[variant]}

      {/* Button content */}
      <span className={cn('relative z-10 flex items-center justify-center gap-2', textColors[variant])}>
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </span>
    </button>
  )
}
