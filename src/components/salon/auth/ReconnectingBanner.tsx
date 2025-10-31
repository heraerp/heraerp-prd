/**
 * HERA DNA SECURITY: Reconnecting Banner Component
 * Smart Code: HERA.DNA.SECURITY.SALON.RECONNECTING_BANNER.v1
 *
 * ✅ ENTERPRISE: Luxury-themed reconnection feedback for salon users
 * Provides graceful degraded state during authentication recovery
 *
 * Features:
 * - Salon Luxe theme integration (gold, charcoal, champagne)
 * - Animated connecting indicator with pulse effect
 * - Non-intrusive fixed bottom banner
 * - Smooth fade in/out transitions
 * - Mobile-responsive design
 */

'use client'

import React, { useEffect, useState } from 'react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { Loader2, WifiOff, RefreshCw } from 'lucide-react'

interface ReconnectingBannerProps {
  isReconnecting: boolean
  message?: string
  onRetry?: () => void
}

export function ReconnectingBanner({
  isReconnecting,
  message = 'Reconnecting to secure session...',
  onRetry
}: ReconnectingBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showRetry, setShowRetry] = useState(false)

  // Smooth fade in/out with delay
  useEffect(() => {
    if (isReconnecting) {
      // Show immediately when reconnecting starts
      setIsVisible(true)

      // Show retry button after 10 seconds
      const retryTimer = setTimeout(() => {
        setShowRetry(true)
      }, 10000)

      return () => clearTimeout(retryTimer)
    } else {
      // Hide retry button immediately when reconnection succeeds
      setShowRetry(false)

      // Fade out banner after brief delay
      const hideTimer = setTimeout(() => {
        setIsVisible(false)
      }, 500)

      return () => clearTimeout(hideTimer)
    }
  }, [isReconnecting])

  if (!isVisible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out"
      style={{
        transform: isReconnecting ? 'translateY(0)' : 'translateY(100%)',
        opacity: isReconnecting ? 1 : 0
      }}
    >
      {/* Luxury gradient background with blur effect */}
      <div
        className="backdrop-blur-md border-t"
        style={{
          background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal}f0 0%, ${LUXE_COLORS.charcoalLight}f0 100%)`,
          borderColor: `${LUXE_COLORS.gold}40`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4">
            {/* Left: Status indicator with animation */}
            <div className="flex items-center gap-3 flex-1">
              {/* Animated pulse loader */}
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-20"
                  style={{ backgroundColor: LUXE_COLORS.gold }}
                />
                <Loader2
                  className="h-5 w-5 sm:h-6 sm:w-6 animate-spin relative z-10"
                  style={{ color: LUXE_COLORS.gold }}
                />
              </div>

              {/* Message with luxury styling */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm sm:text-base font-medium truncate"
                  style={{ color: LUXE_COLORS.champagne }}
                >
                  {message}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: LUXE_COLORS.bronze }}
                >
                  Your session is being restored securely
                </p>
              </div>
            </div>

            {/* Right: Retry button (shows after 10s) */}
            {showRetry && onRetry && (
              <button
                onClick={onRetry}
                className="ml-4 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 whitespace-nowrap"
                style={{
                  backgroundColor: `${LUXE_COLORS.gold}20`,
                  color: LUXE_COLORS.gold,
                  border: `1px solid ${LUXE_COLORS.gold}40`
                }}
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Retry Now</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom accent line - luxury gold shimmer */}
      <div
        className="h-1 w-full relative overflow-hidden"
        style={{ backgroundColor: `${LUXE_COLORS.gold}20` }}
      >
        <div
          className="absolute inset-0 w-1/3 animate-shimmer"
          style={{
            background: `linear-gradient(90deg, transparent, ${LUXE_COLORS.gold}80, transparent)`,
            animation: 'shimmer 2s infinite'
          }}
        />
      </div>

      {/* Add shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  )
}

/**
 * Reconnecting Banner with Network Error variant
 * Shows when connection is lost entirely
 */
export function NetworkErrorBanner({
  isVisible,
  onRetry
}: {
  isVisible: boolean
  onRetry?: () => void
}) {
  if (!isVisible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out"
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        opacity: isVisible ? 1 : 0
      }}
    >
      {/* Network error styling - ruby accent */}
      <div
        className="backdrop-blur-md border-t"
        style={{
          background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal}f0 0%, ${LUXE_COLORS.ruby}20 100%)`,
          borderColor: `${LUXE_COLORS.ruby}40`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4">
            {/* Left: Error indicator */}
            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-20"
                  style={{ backgroundColor: LUXE_COLORS.ruby }}
                />
                <WifiOff
                  className="h-5 w-5 sm:h-6 sm:w-6 relative z-10"
                  style={{ color: LUXE_COLORS.ruby }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className="text-sm sm:text-base font-medium truncate"
                  style={{ color: LUXE_COLORS.champagne }}
                >
                  Connection Lost
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: LUXE_COLORS.bronze }}
                >
                  Please check your internet connection
                </p>
              </div>
            </div>

            {/* Right: Retry button */}
            {onRetry && (
              <button
                onClick={onRetry}
                className="ml-4 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 whitespace-nowrap"
                style={{
                  backgroundColor: LUXE_COLORS.ruby,
                  color: 'white'
                }}
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Retry Connection</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom accent line - ruby pulse */}
      <div
        className="h-1 w-full"
        style={{
          backgroundColor: LUXE_COLORS.ruby,
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}
      />
    </div>
  )
}

export default ReconnectingBanner
