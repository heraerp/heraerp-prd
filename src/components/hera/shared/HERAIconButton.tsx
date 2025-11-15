'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'

interface HERAIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  tooltip?: string
  variant?: 'default' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

/**
 * HERA ICON BUTTON COMPONENT
 *
 * Circular icon button with HERA platform theme and hover effects.
 * Perfect for action buttons, toolbar icons, and compact controls.
 *
 * Features:
 * - Circular glassmorphism design
 * - Indigo gradient hover effects
 * - Spring animation on hover
 * - Tooltip support
 * - Multiple variants (default, danger, ghost)
 *
 * @example
 * <HERAIconButton
 *   icon={<Edit className="w-5 h-5" />}
 *   tooltip="Edit"
 *   onClick={() => handleEdit()}
 * />
 */
export const HERAIconButton = forwardRef<HTMLButtonElement, HERAIconButtonProps>(
  ({ icon, tooltip, variant = 'default', size = 'md', className, disabled, ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false)

    // Size styles
    const sizeStyles = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12'
    }

    // Get variant styles
    const getVariantStyles = () => {
      const baseStyle: React.CSSProperties = {
        transitionProperty: 'all',
        transitionDuration: '300ms',
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // spring animation
      }

      if (disabled) {
        return {
          ...baseStyle,
          backgroundColor: 'rgba(51, 65, 85, 0.3)',
          color: 'rgba(148, 163, 184, 0.5)',
          cursor: 'not-allowed',
          opacity: 0.5,
        }
      }

      switch (variant) {
        case 'default':
          return isHovered
            ? {
                ...baseStyle,
                background: `linear-gradient(135deg, rgba(99, 102, 241, 0.20) 0%, rgba(147, 51, 234, 0.25) 100%)`,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'rgba(99, 102, 241, 0.60)',
                color: '#A5B4FC',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.30)',
                transform: 'scale(1.1) translateY(-2px)',
              }
            : {
                ...baseStyle,
                background: `linear-gradient(135deg, rgba(99, 102, 241, 0.10) 0%, rgba(147, 51, 234, 0.15) 100%)`,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'rgba(99, 102, 241, 0.30)',
                color: '#818CF8',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)',
              }

        case 'danger':
          return isHovered
            ? {
                ...baseStyle,
                background: `rgba(239, 68, 68, 0.20)`,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'rgba(239, 68, 68, 0.60)',
                color: '#FCA5A5',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.30)',
                transform: 'scale(1.1) translateY(-2px)',
              }
            : {
                ...baseStyle,
                background: `rgba(239, 68, 68, 0.10)`,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'rgba(239, 68, 68, 0.30)',
                color: '#F87171',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)',
              }

        case 'ghost':
          return isHovered
            ? {
                ...baseStyle,
                backgroundColor: 'rgba(99, 102, 241, 0.10)',
                color: '#A5B4FC',
                transform: 'scale(1.1)',
              }
            : {
                ...baseStyle,
                backgroundColor: 'transparent',
                color: '#94A3B8',
              }

        default:
          return baseStyle
      }
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        title={tooltip}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 relative group',
          sizeStyles[size],
          className
        )}
        style={getVariantStyles()}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {icon}
        {tooltip && (
          <span className="absolute bottom-full mb-2 px-2 py-1 text-xs font-medium text-white bg-slate-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {tooltip}
          </span>
        )}
      </button>
    )
  }
)

HERAIconButton.displayName = 'HERAIconButton'
