'use client'

import React from 'react'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { HeraGradientBackground } from './HeraGradientBackground'
import { HERA_THEME_COLORS } from '@/lib/constants/hera-theme-colors'

interface HeraPageProps {
  children: ReactNode
  /** Page title */
  title?: string
  /** Page subtitle/description */
  description?: string
  /** Header actions (buttons, etc.) */
  actions?: ReactNode
  /** Show animated gradient background */
  showAnimatedBackground?: boolean
  /** Enable mouse tracking for interactive gradients */
  enableMouseTracking?: boolean
  /** Container max width */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full'
  /** Custom className for the container */
  className?: string
  /** Padding size */
  padding?: 'sm' | 'md' | 'lg' | 'xl'
  /** Show header section */
  showHeader?: boolean
}

/**
 * HERA PAGE WRAPPER
 *
 * Enterprise-grade page wrapper with HERA theme for public pages
 * Inspired by Salon Luxe but with indigo/purple/cyan gradient palette
 *
 * Features:
 * - Animated gradient backgrounds with mouse tracking
 * - Glassmorphism effects with backdrop blur
 * - Smooth animations and transitions
 * - Responsive design
 * - Consistent spacing and layout
 *
 * @example
 * <HeraPage
 *   title="Pricing"
 *   description="Transparent pricing for enterprise"
 *   showAnimatedBackground={true}
 *   enableMouseTracking={true}
 * >
 *   <div>Your page content</div>
 * </HeraPage>
 */
export function HeraPage({
  children,
  title,
  description,
  actions,
  showAnimatedBackground = true,
  enableMouseTracking = true,
  maxWidth = '7xl',
  className,
  padding = 'lg',
  showHeader = true,
}: HeraPageProps) {
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  }

  const paddingClasses = {
    sm: 'px-4 py-12',
    md: 'px-6 py-16',
    lg: 'px-6 py-20',
    xl: 'px-8 py-24',
  }

  return (
    <div
      className="min-h-screen relative w-full"
      style={{ backgroundColor: HERA_THEME_COLORS.background.darkest }}
    >
      {/* Animated gradient background */}
      {showAnimatedBackground && (
        <HeraGradientBackground
          enableMouseTracking={enableMouseTracking}
          enableAnimatedOverlay={true}
        />
      )}

      {/* Main container */}
      <div
        className={cn(
          'mx-auto relative z-10',
          maxWidthClasses[maxWidth],
          paddingClasses[padding]
        )}
      >
        {/* Page header */}
        {showHeader && (title || description || actions) && (
          <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
            {title && (
              <h1
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
                style={{ color: HERA_THEME_COLORS.text.primary }}
              >
                {title}
              </h1>
            )}

            {description && (
              <p
                className="text-xl md:text-2xl max-w-4xl mx-auto mb-10 leading-relaxed"
                style={{ color: HERA_THEME_COLORS.text.secondary }}
              >
                {description}
              </p>
            )}

            {actions && (
              <div className="flex flex-wrap justify-center gap-4 mt-8">{actions}</div>
            )}
          </div>
        )}

        {/* Page content */}
        <div className={cn('animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100', className)}>
          {children}
        </div>
      </div>
    </div>
  )
}
