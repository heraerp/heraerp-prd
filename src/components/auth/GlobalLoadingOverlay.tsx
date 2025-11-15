/**
 * Global Loading Overlay - HERA Theme
 * Enterprise-grade loading screen with premium animations
 * Smart Code: HERA.UI.LOADING.OVERLAY.v2
 */

'use client'

import React, { useEffect } from 'react'
import { useLoadingStore } from '@/lib/stores/loading-store'
import { Loader2, Lock, Zap, Sparkles, XCircle, AlertTriangle } from 'lucide-react'
import { HERA_THEME_COLORS, HERA_THEME_GRADIENTS, withOpacity } from '@/lib/constants/hera-theme-colors'

export function GlobalLoadingOverlay() {
  const { isLoading, progress, message, subtitle, hasError } = useLoadingStore()

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
        backgroundColor: HERA_THEME_COLORS.background.darkest,
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 50% -20%, ${withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.15)} 0%, transparent 50%),
          radial-gradient(ellipse 60% 50% at 0% 100%, ${withOpacity(HERA_THEME_COLORS.primary.purple.base, 0.1)} 0%, transparent 50%),
          radial-gradient(ellipse 60% 50% at 100% 100%, ${withOpacity(HERA_THEME_COLORS.primary.cyan.base, 0.08)} 0%, transparent 50%)
        `
      }}
    >
      {/* Animated gradient orbs */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 100% 80% at 50% 50%, ${withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.25)} 0%, transparent 60%)
          `,
          animation: 'pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}
      />

      {/* Rotating gradient ring */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-30"
        style={{
          background: `conic-gradient(from 0deg, ${HERA_THEME_COLORS.primary.indigo.base}, ${HERA_THEME_COLORS.primary.purple.base}, ${HERA_THEME_COLORS.primary.cyan.base}, ${HERA_THEME_COLORS.primary.indigo.base})`,
          filter: 'blur(60px)',
          animation: 'spin-slow 20s linear infinite'
        }}
      />

      {/* Loading Card */}
      <div
        className="relative z-10 rounded-3xl p-10 backdrop-blur-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-500"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)',
          border: `2px solid ${withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.3)}`,
          boxShadow: `
            0 30px 60px rgba(0, 0, 0, 0.7),
            0 0 0 1px ${withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.2)},
            0 0 60px ${withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.3)},
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `
        }}
      >
        {/* Floating particles background */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: [
                  HERA_THEME_COLORS.primary.indigo.light,
                  HERA_THEME_COLORS.primary.purple.light,
                  HERA_THEME_COLORS.primary.cyan.light
                ][i % 3],
                opacity: 0.4,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Icon with rotating ring */}
        <div className="relative text-center mb-8">
          {/* Rotating outer ring */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, ${HERA_THEME_COLORS.primary.indigo.base}, ${HERA_THEME_COLORS.primary.purple.base}, ${HERA_THEME_COLORS.primary.cyan.base}, ${HERA_THEME_COLORS.primary.indigo.base})`,
                padding: '3px',
                animation: 'spin-smooth 3s linear infinite'
              }}
            >
              <div
                className="w-full h-full rounded-full flex items-center justify-center"
                style={{
                  background: HERA_THEME_COLORS.background.darkest,
                }}
              >
                {/* Inner icon */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: hasError
                      ? `linear-gradient(135deg, ${HERA_THEME_COLORS.accent.rose.base} 0%, ${HERA_THEME_COLORS.accent.rose.dark} 100%)`
                      : HERA_THEME_GRADIENTS.buttonPrimary,
                    boxShadow: hasError
                      ? `0 8px 24px ${withOpacity(HERA_THEME_COLORS.accent.rose.base, 0.4)}, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                      : `0 8px 24px ${withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.4)}, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                  }}
                >
                  {hasError ? (
                    <XCircle className="h-8 w-8 text-white" />
                  ) : (
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Title with gradient text */}
          <h1
            className="text-3xl font-bold mb-3"
            style={{
              background: `linear-gradient(135deg, ${HERA_THEME_COLORS.primary.indigo.light} 0%, ${HERA_THEME_COLORS.primary.purple.light} 50%, ${HERA_THEME_COLORS.primary.cyan.light} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em'
            }}
          >
            HERA
          </h1>

          {/* Message */}
          <p className="text-base font-medium" style={{ color: HERA_THEME_COLORS.text.primary }}>
            {message || 'Initializing your session...'}
          </p>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="relative mb-8 mt-6">
          {/* Progress percentage badge - positioned above */}
          <div className="flex justify-center mb-3">
            <div
              className="px-5 py-2 rounded-full text-lg font-bold tabular-nums"
              style={{
                background: HERA_THEME_GRADIENTS.buttonPrimary,
                color: 'white',
                boxShadow: `0 4px 16px ${withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.5)}, inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
                border: `1px solid ${withOpacity(HERA_THEME_COLORS.primary.indigo.light, 0.3)}`
              }}
            >
              {Math.round(progress)}%
            </div>
          </div>

          {/* Track */}
          <div
            className="relative h-3 rounded-full overflow-hidden"
            style={{
              background: withOpacity(HERA_THEME_COLORS.background.base, 0.5),
              border: `1px solid ${withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.2)}`,
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Progress fill with gradient */}
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                background: HERA_THEME_GRADIENTS.buttonPrimary,
                boxShadow: `0 0 24px ${withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.6)}, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
              }}
            >
              {/* Animated shimmer */}
              <div
                className="absolute inset-0 animate-shimmer"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%)',
                  backgroundSize: '200% 100%'
                }}
              />
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <div className="text-center mb-6">
          <p className="text-sm" style={{ color: HERA_THEME_COLORS.text.secondary }}>
            {subtitle || 'Setting up your session...'}
          </p>
        </div>

        {/* Feature indicators with icons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div
            className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300"
            style={{
              background: withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.1),
              border: `1px solid ${withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.2)}`
            }}
          >
            <Lock className="w-4 h-4" style={{ color: HERA_THEME_COLORS.primary.indigo.light }} />
            <span className="text-[10px] font-medium" style={{ color: HERA_THEME_COLORS.text.muted }}>
              Secure
            </span>
          </div>
          <div
            className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300"
            style={{
              background: withOpacity(HERA_THEME_COLORS.primary.purple.base, 0.1),
              border: `1px solid ${withOpacity(HERA_THEME_COLORS.primary.purple.base, 0.2)}`
            }}
          >
            <Zap className="w-4 h-4" style={{ color: HERA_THEME_COLORS.primary.purple.light }} />
            <span className="text-[10px] font-medium" style={{ color: HERA_THEME_COLORS.text.muted }}>
              Fast
            </span>
          </div>
          <div
            className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300"
            style={{
              background: withOpacity(HERA_THEME_COLORS.primary.cyan.base, 0.1),
              border: `1px solid ${withOpacity(HERA_THEME_COLORS.primary.cyan.base, 0.2)}`
            }}
          >
            <Sparkles className="w-4 h-4" style={{ color: HERA_THEME_COLORS.primary.cyan.light }} />
            <span className="text-[10px] font-medium" style={{ color: HERA_THEME_COLORS.text.muted }}>
              Smart
            </span>
          </div>
        </div>

        {/* Animated pulse dots */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: HERA_THEME_GRADIENTS.buttonPrimary,
                animation: `bounce 1.4s infinite ease-in-out both`,
                animationDelay: `${i * 0.16}s`,
                boxShadow: `0 0 8px ${withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.5)}`
              }}
            />
          ))}
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.25;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.1);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-smooth {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
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

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }

        .animate-shimmer {
          animation: shimmer 2s linear infinite;
        }
      `}</style>
    </div>
  )
}
