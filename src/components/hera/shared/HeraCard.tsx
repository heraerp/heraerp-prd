'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { HERA_THEME_COLORS, withOpacity } from '@/lib/constants/hera-theme-colors'

interface HeraCardProps {
  children: ReactNode
  /** Enable hover effects (glow, scale) */
  enableHover?: boolean
  /** Enable shimmer effect on hover */
  enableShimmer?: boolean
  /** Custom className */
  className?: string
  /** Padding size */
  padding?: 'sm' | 'md' | 'lg'
  /** Border glow color */
  glowColor?: 'indigo' | 'purple' | 'cyan' | 'emerald' | 'pink'
  /** Click handler */
  onClick?: () => void
}

/**
 * HERA CARD COMPONENT
 *
 * Glassmorphic card with hover effects and animations
 * Consistent with HERA theme's indigo/purple/cyan palette
 *
 * Features:
 * - Glassmorphism with backdrop blur
 * - Hover glow effects
 * - Shimmer animation on hover
 * - Smooth transitions
 * - Customizable glow colors
 *
 * @example
 * <HeraCard enableHover={true} glowColor="indigo">
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </HeraCard>
 */
export function HeraCard({
  children,
  enableHover = true,
  enableShimmer = true,
  className,
  padding = 'lg',
  glowColor = 'indigo',
  onClick,
}: HeraCardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const glowColors = {
    indigo: {
      from: withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.1),
      to: withOpacity(HERA_THEME_COLORS.primary.purple.base, 0.1),
      border: withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.3),
      shadow: HERA_THEME_COLORS.shadow.indigoLight,
    },
    purple: {
      from: withOpacity(HERA_THEME_COLORS.primary.purple.base, 0.1),
      to: withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.1),
      border: withOpacity(HERA_THEME_COLORS.primary.purple.base, 0.3),
      shadow: HERA_THEME_COLORS.shadow.purpleLight,
    },
    cyan: {
      from: withOpacity(HERA_THEME_COLORS.primary.cyan.base, 0.1),
      to: withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.1),
      border: withOpacity(HERA_THEME_COLORS.primary.cyan.base, 0.3),
      shadow: HERA_THEME_COLORS.shadow.cyanLight,
    },
    emerald: {
      from: withOpacity(HERA_THEME_COLORS.accent.emerald.base, 0.1),
      to: withOpacity(HERA_THEME_COLORS.primary.cyan.base, 0.1),
      border: withOpacity(HERA_THEME_COLORS.accent.emerald.base, 0.3),
      shadow: 'rgba(16, 185, 129, 0.15)',
    },
    pink: {
      from: withOpacity(HERA_THEME_COLORS.accent.pink.base, 0.1),
      to: withOpacity(HERA_THEME_COLORS.primary.purple.base, 0.1),
      border: withOpacity(HERA_THEME_COLORS.accent.pink.base, 0.3),
      shadow: 'rgba(236, 72, 153, 0.15)',
    },
  }

  const selectedGlow = glowColors[glowColor]

  return (
    <div className="relative group" onClick={onClick}>
      {/* Hover glow effect */}
      {enableHover && (
        <div
          className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"
          style={{
            background: `linear-gradient(to right, ${selectedGlow.from} 0%, ${selectedGlow.to} 100%)`,
          }}
        />
      )}

      {/* Card content */}
      <div
        className={cn(
          'relative card-glass backdrop-blur-xl rounded-2xl transition-all duration-300',
          paddingClasses[padding],
          enableHover && 'hover:shadow-2xl hover:scale-[1.02]',
          onClick && 'cursor-pointer',
          className
        )}
        style={{
          background: `linear-gradient(135deg, ${withOpacity(HERA_THEME_COLORS.background.dark, 0.95)} 0%, ${withOpacity(HERA_THEME_COLORS.background.darkest, 0.95)} 100%)`,
          border: `1px solid ${HERA_THEME_COLORS.border.base}`,
          boxShadow: `0 25px 50px ${HERA_THEME_COLORS.shadow.black}, 0 0 0 1px ${HERA_THEME_COLORS.border.light}`,
        }}
      >
        {/* Shimmer effect on hover */}
        {enableHover && enableShimmer && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${selectedGlow.from} 0%, ${selectedGlow.to} 50%, transparent 70%)`,
            }}
          >
            <div className="absolute inset-0 animate-hera-shimmer">
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
                  transform: 'translateX(-100%)',
                }}
              />
            </div>
          </div>
        )}

        {/* Card children */}
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  )
}
