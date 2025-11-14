/**
 * HERA Universal Tile System - Mobile-First Responsive Layout
 * Smart Code: HERA.UI.MOBILE.LAYOUT.RESPONSIVE.v1
 * 
 * Mobile-first responsive layout wrapper for financial tiles and workspace components
 */

'use client'

import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface MobileResponsiveLayoutProps {
  children: React.ReactNode
  className?: string
  variant?: 'tiles' | 'cards' | 'list'
  spacing?: 'tight' | 'normal' | 'loose'
  showMobileHeader?: boolean
  title?: string
  subtitle?: string
  onRefresh?: () => void
  isRefreshing?: boolean
}

/**
 * Mobile-First Responsive Layout Component
 * Follows HERA mandatory mobile standards
 */
export function MobileResponsiveLayout({
  children,
  className = '',
  variant = 'tiles',
  spacing = 'normal',
  showMobileHeader = false,
  title,
  subtitle,
  onRefresh,
  isRefreshing = false
}: MobileResponsiveLayoutProps) {
  
  const getSpacingClasses = () => {
    switch (spacing) {
      case 'tight':
        return 'gap-2 md:gap-3 p-2 md:p-4'
      case 'loose':
        return 'gap-6 md:gap-8 p-6 md:p-8'
      default:
        return 'gap-4 md:gap-6 p-4 md:p-6'
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'cards':
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      case 'list':
        return 'flex flex-col space-y-4'
      default: // tiles
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    }
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Mobile Header - MANDATORY Pattern */}
      {showMobileHeader && (
        <div className="md:hidden mb-4">
          {/* iOS Status Bar Spacer */}
          <div className="h-11 bg-gradient-to-b from-black/20 to-transparent" />
          
          {/* Mobile App Header */}
          <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between p-4">
              <div className="flex-1">
                {title && (
                  <h1 className="text-lg font-bold text-gray-900 truncate">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-xs text-gray-600 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
              
              {onRefresh && (
                <button 
                  className="min-w-[44px] min-h-[44px] rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  aria-label="Refresh content"
                >
                  <svg 
                    className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Welcome Card - MANDATORY Pattern */}
      <div className="md:hidden bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {title || 'Financial Analytics'}
        </h2>
        <p className="text-gray-600 mb-4">
          {subtitle || 'Monitor your financial performance with interactive tiles'}
        </p>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Live Data</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>Interactive</span>
          </div>
        </div>
      </div>

      {/* Content Area with Responsive Grid */}
      <div 
        className={cn(
          'w-full',
          getSpacingClasses(),
          getVariantClasses()
        )}
      >
        {children}
      </div>

      {/* Mobile Bottom Spacing - MANDATORY for comfortable scrolling */}
      <div className="h-20 md:h-0" />
    </div>
  )
}

/**
 * Mobile Touch Wrapper - Ensures 44px minimum touch targets
 */
export interface MobileTouchWrapperProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  variant?: 'button' | 'card' | 'tile'
}

export function MobileTouchWrapper({
  children,
  className = '',
  onClick,
  disabled = false,
  variant = 'button'
}: MobileTouchWrapperProps) {
  
  const getVariantClasses = () => {
    const baseClasses = 'min-h-[44px] min-w-[44px] active:scale-95 transition-transform touch-manipulation'
    
    switch (variant) {
      case 'card':
        return `${baseClasses} rounded-xl p-4 bg-white shadow-sm border border-gray-200 hover:shadow-md active:shadow-lg`
      case 'tile':
        return `${baseClasses} rounded-2xl p-6 bg-white shadow-lg border border-gray-100 hover:shadow-xl active:shadow-2xl`
      default: // button
        return `${baseClasses} rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300`
    }
  }

  if (!onClick) {
    return (
      <div className={cn(getVariantClasses(), disabled && 'opacity-50 cursor-not-allowed', className)}>
        {children}
      </div>
    )
  }

  return (
    <button
      className={cn(getVariantClasses(), disabled && 'opacity-50 cursor-not-allowed', className)}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  )
}

/**
 * Mobile Typography Scale - HERA Standard
 */
export const MOBILE_TYPOGRAPHY = {
  h1: 'text-xl sm:text-2xl md:text-3xl font-bold',
  h2: 'text-lg sm:text-xl md:text-2xl font-semibold',
  h3: 'text-base sm:text-lg md:text-xl font-medium',
  body: 'text-sm sm:text-base',
  caption: 'text-xs sm:text-sm',
  button: 'text-sm sm:text-base font-medium'
} as const

/**
 * Mobile Spacing Scale - HERA Standard
 */
export const MOBILE_SPACING = {
  xs: 'p-2 gap-2',
  sm: 'p-3 gap-3', 
  md: 'p-4 gap-4',
  lg: 'p-6 gap-6',
  xl: 'p-8 gap-8'
} as const

/**
 * Mobile Breakpoint Utilities
 */
export const MOBILE_BREAKPOINTS = {
  mobile: 'block sm:hidden',
  tablet: 'hidden sm:block md:hidden', 
  desktop: 'hidden md:block',
  mobileAndTablet: 'block md:hidden',
  tabletAndDesktop: 'hidden sm:block'
} as const

/**
 * Hook for responsive breakpoint detection
 */
export function useResponsiveBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<'mobile' | 'tablet' | 'desktop'>('mobile')

  React.useEffect(() => {
    const updateBreakpoint = () => {
      if (window.innerWidth >= 1024) {
        setBreakpoint('desktop')
      } else if (window.innerWidth >= 640) {
        setBreakpoint('tablet')
      } else {
        setBreakpoint('mobile')
      }
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isMobileOrTablet: breakpoint === 'mobile' || breakpoint === 'tablet'
  }
}

export default MobileResponsiveLayout