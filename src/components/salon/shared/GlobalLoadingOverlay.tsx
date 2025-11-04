/**
 * Global Loading Overlay
 * Beautiful fullscreen loading experience that persists across route changes
 * Smart Code: HERA.UI.LOADING.OVERLAY.GLOBAL.v1
 *
 * Features:
 * - Smooth progress bar animation
 * - Customizable title and subtitle
 * - Persists across route navigation
 * - Auto-hides when loading completes
 * - Elegant fade in/out animations
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useLoadingStore } from '@/lib/stores/loading-store'
import { Loader2, Sparkles } from 'lucide-react'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

export function GlobalLoadingOverlay() {
  const { isLoading, progress, message, subtitle } = useLoadingStore()
  const [show, setShow] = useState(false)
  const [animate, setAnimate] = useState(false)

  // ✅ ENTERPRISE: Snapshot the message when loading starts
  // This prevents showing stale messages during state transitions
  const [displayMessage, setDisplayMessage] = useState('')
  const [displaySubtitle, setDisplaySubtitle] = useState('')

  useEffect(() => {
    if (isLoading) {
      // ✅ Capture message snapshot when loading starts
      setDisplayMessage(message)
      setDisplaySubtitle(subtitle)

      // Show overlay immediately
      setShow(true)
      // Trigger fade-in animation after a frame
      requestAnimationFrame(() => {
        setAnimate(true)
      })
    } else {
      // ✅ CRITICAL: Immediately hide on isLoading=false (no fade-out delay)
      // This prevents any flash of old messages during logout
      setShow(false)
      setAnimate(false)

      // Clear message snapshots after hide
      setTimeout(() => {
        setDisplayMessage('')
        setDisplaySubtitle('')
      }, 100)
    }
  }, [isLoading, message, subtitle])

  // ✅ ENTERPRISE: Only show if BOTH conditions are true
  // This ensures immediate hide on logout
  if (!show || !isLoading) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${
        animate ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 30% 20%, ${SALON_LUXE_COLORS.gold.base}15 0%, transparent 50%),
            radial-gradient(ellipse 70% 50% at 70% 80%, ${SALON_LUXE_COLORS.gold.base}10 0%, transparent 50%)
          `,
          animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}
      />

      {/* Loading Card */}
      <div
        className={`relative w-full max-w-md mx-4 p-8 rounded-2xl backdrop-blur-xl transform transition-all duration-300 ${
          animate ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        style={{
          background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.charcoal.light}E6 0%, ${SALON_LUXE_COLORS.charcoal.base}E6 100%)`,
          border: `1px solid ${SALON_LUXE_COLORS.gold.base}40`,
          boxShadow: `0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px ${SALON_LUXE_COLORS.gold.base}20`
        }}
      >
        {/* Icon */}
        <div
          className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.gold.base} 0%, ${SALON_LUXE_COLORS.gold.dark} 100%)`,
            boxShadow: `0 8px 24px ${SALON_LUXE_COLORS.gold.base}60`
          }}
        >
          <Sparkles
            className="w-8 h-8 animate-pulse"
            style={{ color: SALON_LUXE_COLORS.charcoal.dark }}
          />
        </div>

        {/* Title */}
        <h2
          className="text-2xl font-bold text-center mb-2"
          style={{
            color: SALON_LUXE_COLORS.champagne.light,
            letterSpacing: '-0.02em'
          }}
        >
          {displayMessage || 'Loading Your Dashboard'}
        </h2>

        {/* Subtitle */}
        {displaySubtitle && (
          <p
            className="text-center mb-6"
            style={{ color: SALON_LUXE_COLORS.bronze }}
          >
            {displaySubtitle}
          </p>
        )}

        {/* Progress Bar */}
        <div
          className="relative h-2 rounded-full overflow-hidden mb-4"
          style={{
            backgroundColor: `${SALON_LUXE_COLORS.charcoal.dark}80`
          }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${SALON_LUXE_COLORS.gold.base} 0%, ${SALON_LUXE_COLORS.champagne.base} 100%)`,
              boxShadow: `0 0 20px ${SALON_LUXE_COLORS.gold.base}60`
            }}
          />
        </div>

        {/* Progress Percentage */}
        <div
          className="text-center text-sm font-medium"
          style={{ color: SALON_LUXE_COLORS.gold.base }}
        >
          {progress}%
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center mt-6">
          <Loader2
            className="w-6 h-6 animate-spin"
            style={{ color: SALON_LUXE_COLORS.gold.base }}
          />
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}
