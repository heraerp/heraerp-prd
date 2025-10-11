'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

export type SalonLuxeInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  /** Error state */
  error?: boolean
  /** Success state */
  success?: boolean
  /** Icon to display on the left */
  leftIcon?: React.ReactNode
  /** Icon to display on the right */
  rightIcon?: React.ReactNode
}

/**
 * SALON LUXE INPUT COMPONENT
 *
 * Enterprise-grade input field with salon luxe theme.
 * Features glassmorphism, golden borders, and smooth focus animations.
 *
 * Features:
 * - Glassmorphism with 8px backdrop blur
 * - Golden borders (25% → 60% on focus)
 * - Smooth spring animations
 * - Error/success states with color feedback
 * - Optional left/right icons
 * - Placeholder with bronze color
 * - Soft rounded corners (12px)
 *
 * @example
 * <SalonLuxeInput
 *   placeholder="Enter customer name"
 *   leftIcon={<User className="w-4 h-4" />}
 * />
 */
const SalonLuxeInput = React.forwardRef<HTMLInputElement, SalonLuxeInputProps>(
  ({ className, type, error, success, leftIcon, rightIcon, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)

    const getBorderColor = () => {
      if (error) return SALON_LUXE_COLORS.error
      if (success) return SALON_LUXE_COLORS.success
      if (isFocused) return 'rgba(212, 175, 55, 0.60)'
      return 'rgba(212, 175, 55, 0.25)'
    }

    const getBoxShadow = () => {
      if (error)
        return '0 4px 16px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      if (success)
        return '0 4px 16px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      if (isFocused)
        return '0 8px 24px rgba(212, 175, 55, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
      return '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
    }

    return (
      <div className="relative w-full">
        {leftIcon && (
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none transition-colors duration-300"
            style={{
              color: isFocused ? SALON_LUXE_COLORS.gold.base : SALON_LUXE_COLORS.bronze
            }}
          >
            {leftIcon}
          </div>
        )}

        <input
          type={type}
          className={cn(
            'flex h-12 w-full rounded-xl px-4 py-3 text-sm font-medium',
            'transition-all duration-500 ease-out',
            'placeholder:font-normal',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            leftIcon && 'pl-12',
            rightIcon && 'pr-12',
            className
          )}
          style={{
            background:
              'linear-gradient(135deg, rgba(245,230,200,0.08) 0%, rgba(212,175,55,0.05) 50%, rgba(184,134,11,0.03) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: `1px solid ${getBorderColor()}`,
            boxShadow: getBoxShadow(),
            color: SALON_LUXE_COLORS.champagne.light,
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          ref={ref}
          {...props}
        />

        {rightIcon && (
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none transition-colors duration-300"
            style={{
              color: isFocused ? SALON_LUXE_COLORS.gold.base : SALON_LUXE_COLORS.bronze
            }}
          >
            {rightIcon}
          </div>
        )}

        {/* Focus ring animation */}
        <style jsx>{`
          input::placeholder {
            color: ${SALON_LUXE_COLORS.bronze};
            opacity: 0.7;
          }
        `}</style>
      </div>
    )
  }
)

SalonLuxeInput.displayName = 'SalonLuxeInput'

export { SalonLuxeInput }
