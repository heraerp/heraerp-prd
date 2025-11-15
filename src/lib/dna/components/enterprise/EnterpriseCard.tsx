/**
 * HERA DNA Enterprise Card Component
 * Next-generation card with advanced features for enterprise applications
 * Combines glassmorphism, animations, accessibility, and performance optimizations
 */

'use client'

import React, { useEffect, useImperativeHandle, useState } from 'react'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useGlassEffect } from '../../design-system/glass-effects-2.0'

// Advanced card props with enterprise features
export interface EnterpriseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  // Glass effects
  glassIntensity?: 'subtle' | 'medium' | 'strong' | 'ultra'
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'premium'

  // Enterprise features
  elevation?: 'none' | 'low' | 'medium' | 'high' | 'floating'
  interactive?: boolean
  loading?: boolean
  disabled?: boolean
  selected?: boolean

  // Advanced animations
  animateOnHover?: boolean
  animateOnMount?: boolean
  animationPreset?: 'fade' | 'slide' | 'scale' | 'float' | 'none'

  // Accessibility
  role?: string
  ariaLabel?: string
  ariaDescribedBy?: string

  // Performance
  lazy?: boolean
  priority?: 'high' | 'medium' | 'low'

  // Advanced features
  glow?: boolean
  pulse?: boolean
  shimmer?: boolean
  gradient?: boolean
  noise?: boolean

  // Layout
  fullHeight?: boolean
  noPadding?: boolean
  compact?: boolean
}

// Animation presets
const animationPresets = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  slide: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  },
  float: {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    },
    whileHover: {
      y: -4,
      transition: { duration: 0.2, ease: 'easeOut' }
    }
  },
  none: {}
}

// Elevation shadows
const elevationStyles = {
  none: '',
  low: 'shadow-sm hover:shadow-md',
  medium: 'shadow-md hover:shadow-lg',
  high: 'shadow-lg hover:shadow-xl',
  floating: 'shadow-xl hover:shadow-2xl'
}

export const EnterpriseCard = React.forwardRef<HTMLDivElement, EnterpriseCardProps>(
  (
    {
      className,
      children,
      glassIntensity = 'medium',
      variant = 'default',
      elevation = 'low',
      interactive = true,
      loading = false,
      disabled = false,
      selected = false,
      animateOnHover = true,
      animateOnMount = true,
      animationPreset = 'slide',
      role = 'article',
      ariaLabel,
      ariaDescribedBy,
      lazy = false,
      priority = 'medium',
      glow = false,
      pulse = false,
      shimmer = false,
      gradient = false,
      noise = false,
      fullHeight = false,
      noPadding = false,
      compact = false,
      ...props
    },
    ref
  ) => {
    const [isInView, setIsInView] = React.useState(!lazy)
    const cardRef = React.useRef<HTMLDivElement>(null)

    // Merge refs
    React.useImperativeHandle(ref, () => cardRef.current!)

    // Intersection observer for lazy loading
    React.useEffect(() => {
      if (!lazy || isInView) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        },
        { rootMargin: '50px' }
      )

      if (cardRef.current) {
        observer.observe(cardRef.current)
      }

      return () => observer.disconnect()
    }, [lazy, isInView])

    // Glass effects
    const { className: glassClassName, styles: glassStyles } = useGlassEffect({
      intensity: glassIntensity,
      variant,
      enableShine: shimmer,
      enableParticles: false,
      enableDepth: elevation === 'floating'
    })

    // Animation variants
    const animations = animateOnMount ? animationPresets[animationPreset] : {}

    // Loading state
    if (loading) {
      return (
        <div
          ref={cardRef}
          className={cn(
            'rounded-xl border animate-pulse',
            glassClassName,
            elevationStyles[elevation],
            fullHeight && 'h-full',
            className
          )}
          {...props}
        >
          <div className="p-6 space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-muted-foreground/10 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-muted-foreground/10 rounded w-1/2" />
            <div className="h-20 bg-gray-200 dark:bg-muted-foreground/10 rounded" />
          </div>
        </div>
      )
    }

    const cardContent = (
      <motion.div
        ref={cardRef}
        role={role}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-disabled={disabled}
        aria-selected={selected}
        className={cn(
          // Base styles
          'rounded-xl border relative',

          // Glass effects
          glassClassName,

          // Elevation
          elevationStyles[elevation],

          // States
          disabled && 'opacity-50 cursor-not-allowed',
          selected && 'ring-2 ring-primary ring-offset-2',
          interactive && !disabled && 'cursor-pointer',

          // Layout
          fullHeight && 'h-full',
          !noPadding && !compact && 'p-6',
          compact && 'p-4',

          // Advanced effects
          glow && 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
          pulse && 'animate-pulse',

          // Performance
          priority === 'high' && 'will-change-transform',

          className
        )}
        whileHover={animateOnHover && !disabled ? { scale: 1.02 } : undefined}
        whileTap={interactive && !disabled ? { scale: 0.98 } : undefined}
        {...animations}
        {...props}
      >
        {/* Gradient background */}
        {gradient && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-xl pointer-events-none" />
        )}

        {/* Noise texture */}
        {noise && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`
            }}
          />
        )}

        {/* Shimmer effect */}
        {shimmer && (
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>

        {/* Selected indicator */}
        {selected && (
          <div className="absolute top-2 right-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
          </div>
        )}
      </motion.div>
    )

    // Lazy loading placeholder
    if (lazy && !isInView) {
      return (
        <div
          ref={cardRef}
          className={cn(
            'rounded-xl border bg-muted/20',
            elevationStyles[elevation],
            fullHeight && 'h-full',
            className
          )}
          style={{ minHeight: '200px' }}
        />
      )
    }

    return cardContent
  }
)

EnterpriseCard.displayName = 'EnterpriseCard'

// Compound components for better composition
export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    icon?: React.ReactNode
    actions?: React.ReactNode
    separator?: boolean
  }
>(({ className, icon, actions, separator = true, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-start justify-between gap-4',
      separator && 'pb-4 mb-4 border-b border-border/50',
      className
    )}
    {...props}
  >
    <div className="flex items-start gap-3 flex-1">
      {icon && <div className="mt-0.5 text-muted-foreground">{icon}</div>}
      <div className="flex-1 space-y-1">{children}</div>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
))
CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }
>(({ className, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  }

  return (
    <h3
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight', sizeClasses[size], className)}
      {...props}
    />
  )
})
CardTitle.displayName = 'CardTitle'

// Add CSS for shimmer animation
export const shimmerKeyframes = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
`
