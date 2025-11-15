'use client'

import React from 'react'
import { useMousePosition } from '@/hooks/useMousePosition'
import { HERA_THEME_COLORS, withOpacity } from '@/lib/constants/hera-theme-colors'

interface HeraGradientBackgroundProps {
  /** Enable mouse tracking for interactive gradients */
  enableMouseTracking?: boolean
  /** Show animated gradient shift overlay */
  enableAnimatedOverlay?: boolean
  /** Show static positioned gradient orbs (like /organizations page) */
  enableStaticOrbs?: boolean
  /** Intensity multiplier for mouse movement (default: 1) */
  intensity?: number
}

/**
 * HERA Gradient Background Component
 *
 * Provides animated gradient background with optional mouse tracking
 * Similar to Salon Luxe theme but with HERA's indigo/purple/cyan palette
 *
 * Features:
 * - Mouse-tracking floating gradient orbs (interactive depth)
 * - Static positioned gradient orbs (like /organizations page)
 * - Smooth animated gradient overlays
 * - Multiple gradient layers for depth
 * - Performance optimized with throttling
 * - Fixed positioning for full-page coverage
 *
 * @example
 * <HeraGradientBackground enableMouseTracking={true} enableStaticOrbs={true} />
 */
export function HeraGradientBackground({
  enableMouseTracking = true,
  enableAnimatedOverlay = true,
  enableStaticOrbs = true,
  intensity = 1,
}: HeraGradientBackgroundProps) {
  const mousePosition = useMousePosition(50) // 50ms throttle for smooth performance

  // Calculate mouse-based transforms
  const getMouseTransform = (multiplierX: number, multiplierY: number) => {
    if (!enableMouseTracking) return {}

    return {
      transform: `translate(${mousePosition.x * multiplierX * intensity}px, ${mousePosition.y * multiplierY * intensity}px)`,
      transition: 'transform 1000ms ease-out',
    }
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Static positioned gradient orbs - minimal like /solutions page */}
      {enableStaticOrbs && (
        <>
          {/* Top left orb */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl" />

          {/* Bottom right orb */}
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 rounded-full blur-3xl" />
        </>
      )}

      {/* Smaller mouse-reactive gradient orbs with reduced opacity */}

      {/* Top-left orb (indigo → purple) - reduced size */}
      <div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.12)} 0%, ${withOpacity(HERA_THEME_COLORS.primary.purple.base, 0.08)} 50%, transparent 70%)`,
          ...getMouseTransform(0.02, 0.02),
        }}
      />

      {/* Top-right orb (cyan → blue) - reduced size */}
      <div
        className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${withOpacity(HERA_THEME_COLORS.primary.cyan.base, 0.12)} 0%, ${withOpacity(HERA_THEME_COLORS.primary.indigo.light, 0.08)} 50%, transparent 70%)`,
          ...getMouseTransform(-0.015, 0.015),
        }}
      />

      {/* Middle-left orb (purple → pink) - reduced size */}
      <div
        className="absolute top-1/3 -left-40 w-[400px] h-[400px] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${withOpacity(HERA_THEME_COLORS.primary.purple.base, 0.1)} 0%, ${withOpacity(HERA_THEME_COLORS.accent.pink.base, 0.06)} 50%, transparent 70%)`,
          ...getMouseTransform(0.025, -0.02),
        }}
      />

      {/* Middle-right orb (emerald → teal) - reduced size */}
      <div
        className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${withOpacity(HERA_THEME_COLORS.accent.emerald.base, 0.1)} 0%, ${withOpacity(HERA_THEME_COLORS.primary.cyan.dark, 0.06)} 50%, transparent 70%)`,
          ...getMouseTransform(-0.02, -0.025),
        }}
      />

      {/* Bottom-left orb (blue → indigo) - reduced size */}
      <div
        className="absolute -bottom-40 left-1/4 w-[450px] h-[450px] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${withOpacity(HERA_THEME_COLORS.primary.indigo.light, 0.1)} 0%, ${withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.06)} 50%, transparent 70%)`,
          ...getMouseTransform(0.018, 0.018),
        }}
      />

      {/* Bottom-right orb (violet → purple) - reduced size */}
      <div
        className="absolute -bottom-40 right-1/4 w-[450px] h-[450px] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${withOpacity(HERA_THEME_COLORS.primary.purple.light, 0.1)} 0%, ${withOpacity(HERA_THEME_COLORS.primary.purple.base, 0.06)} 50%, transparent 70%)`,
          ...getMouseTransform(-0.022, 0.022),
        }}
      />

      {/* Animated gradient overlay with subtle pulse */}
      {enableAnimatedOverlay && (
        <div
          className="absolute inset-0 animate-hera-gradient-shift"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.08)} 0%, ${withOpacity(HERA_THEME_COLORS.primary.purple.base, 0.08)} 50%, ${withOpacity(HERA_THEME_COLORS.primary.cyan.base, 0.08)} 100%)`,
          }}
        />
      )}
    </div>
  )
}
