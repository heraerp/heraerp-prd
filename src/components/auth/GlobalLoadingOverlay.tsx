/**
 * Global Loading Overlay
 * Persistent loading screen that stays visible across route changes
 * Smart Code: HERA.UI.LOADING.OVERLAY.v1
 */

'use client'

import { useEffect } from 'react'
import { useLoadingStore } from '@/lib/stores/loading-store'
import { Sparkles } from 'lucide-react'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

export function GlobalLoadingOverlay() {
  const { isLoading, progress, message, subtitle } = useLoadingStore()

  // Prevent body scroll when loading
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isLoading])

  if (!isLoading) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: SALON_LUXE_COLORS.charcoal.dark,
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212, 175, 55, 0.2) 0%, transparent 50%),
          radial-gradient(ellipse 60% 50% at 0% 100%, rgba(212, 175, 55, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse 60% 50% at 100% 100%, rgba(212, 175, 55, 0.1) 0%, transparent 50%)
        `
      }}
    >
      {/* Animated gradient pulse */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 100% 80% at 50% 50%, rgba(212, 175, 55, 0.3) 0%, transparent 60%)
          `,
          animation: 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}
      />

      {/* Loading Card */}
      <div
        className="relative z-10 rounded-3xl p-12 backdrop-blur-xl max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-500"
        style={{
          background: 'linear-gradient(135deg, rgba(26,26,26,0.98) 0%, rgba(15,15,15,0.98) 100%)',
          border: `2px solid ${SALON_LUXE_COLORS.gold.base}`,
          boxShadow: `
            0 30px 60px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(212, 175, 55, 0.3),
            0 0 40px rgba(212, 175, 55, 0.4)
          `
        }}
      >
        {/* Logo with pulse animation */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse"
            style={{
              background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.gold.base} 0%, ${SALON_LUXE_COLORS.gold.dark} 100%)`,
              boxShadow: `0 12px 32px rgba(212, 175, 55, 0.5), 0 0 40px rgba(212, 175, 55, 0.3)`
            }}
          >
            <Sparkles className="h-10 w-10" style={{ color: SALON_LUXE_COLORS.charcoal.dark }} />
          </div>

          {/* Title */}
          <h1
            className="text-3xl font-bold mb-3"
            style={{
              background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.champagne.light} 0%, ${SALON_LUXE_COLORS.gold.base} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em'
            }}
          >
            Loading Your Dashboard
          </h1>

          {/* Message */}
          <p className="text-base" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
            {message || 'Preparing your workspace...'}
          </p>
        </div>

        {/* Progress Bar Container */}
        <div
          className="relative h-2 rounded-full overflow-hidden mb-6"
          style={{
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            border: `1px solid ${SALON_LUXE_COLORS.border.base}`
          }}
        >
          {/* Progress Bar */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${SALON_LUXE_COLORS.gold.base} 0%, ${SALON_LUXE_COLORS.champagne.light} 100%)`,
              boxShadow: `0 0 20px ${SALON_LUXE_COLORS.gold.base}80`
            }}
          >
            {/* Shimmer effect */}
            <div
              className="absolute inset-0 animate-shimmer"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
                backgroundSize: '200% 100%'
              }}
            />
          </div>
        </div>

        {/* Progress Percentage */}
        <div className="text-center">
          <p
            className="text-2xl font-bold tabular-nums"
            style={{ color: SALON_LUXE_COLORS.gold.base }}
          >
            {Math.round(progress)}%
          </p>
          <p className="text-xs mt-1" style={{ color: SALON_LUXE_COLORS.bronze }}>
            {subtitle || 'Setting up your session...'}
          </p>
        </div>

        {/* Animated dots */}
        <div className="flex justify-center gap-2 mt-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: SALON_LUXE_COLORS.gold.base,
                animation: `bounce 1.4s infinite ease-in-out both`,
                animationDelay: `${i * 0.16}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.3;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-shimmer {
          animation: shimmer 2s linear infinite;
        }
      `}</style>
    </div>
  )
}
