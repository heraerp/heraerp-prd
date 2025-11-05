'use client'

import React, { useState } from 'react'
import type { LucideIcon } from 'lucide-react'

/**
 * 🎯 Enterprise-Grade Icon Button with Tooltip
 *
 * Follows SAP Fiori / modern enterprise design principles:
 * - Icon-only buttons for compact header layouts
 * - Hover tooltips for discoverability
 * - Touch-friendly 44px minimum target
 * - Consistent HERA luxe styling
 */

interface SalonIconButtonProps {
  icon: LucideIcon
  label: string
  onClick: () => void
  color?: string
  hoverColor?: string
  textColor?: string
  disabled?: boolean
  loading?: boolean
  badge?: string | number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const COLORS = {
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  charcoalLight: '#232323'
}

export function SalonIconButton({
  icon: Icon,
  label,
  onClick,
  color = COLORS.charcoalLight,
  hoverColor,
  textColor = COLORS.champagne,
  disabled = false,
  loading = false,
  badge,
  className = '',
  size = 'md'
}: SalonIconButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const sizes = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <div className="relative">
      {/* Icon Button with Enhanced Styling */}
      <button
        onClick={onClick}
        disabled={disabled || loading}
        onMouseEnter={() => {
          setShowTooltip(true)
          setIsHovered(true)
        }}
        onMouseLeave={() => {
          setShowTooltip(false)
          setIsHovered(false)
        }}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={`${sizes[size]} rounded-full flex items-center justify-center active:scale-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden ${className}`}
        style={{
          background: isHovered
            ? `linear-gradient(135deg, ${color}50 0%, ${color}35 50%, ${color}50 100%)`
            : `linear-gradient(135deg, ${color}30 0%, ${color}20 100%)`,
          border: `1px solid ${color}${isHovered ? '60' : '40'}`,
          color: color,
          boxShadow: isHovered
            ? `0 4px 20px ${color}50, 0 0 0 3px ${color}20`
            : '0 2px 8px rgba(0, 0, 0, 0.2)',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
        }}
        aria-label={label}
      >
        {/* Animated shimmer on hover */}
        {isHovered && (
          <div
            className="absolute inset-0 animate-shimmer pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
              backgroundSize: '200% 100%'
            }}
          />
        )}

        {/* Icon with rotation */}
        <Icon
          className={`${iconSizes[size]} relative z-10 transition-transform duration-300`}
          strokeWidth={2.5}
          style={{
            color: color,
            transform: isHovered ? 'rotate(12deg)' : 'rotate(0deg)'
          }}
        />

        {/* Badge with Pulse Animation */}
        {badge && (
          <span
            className="absolute -top-1 -right-1 min-w-[20px] h-[20px] rounded-full text-[10px] font-bold flex items-center justify-center px-1.5 animate-pulse"
            style={{
              backgroundColor: COLORS.gold,
              color: COLORS.charcoal,
              boxShadow: `0 2px 8px ${COLORS.gold}60, 0 0 0 2px ${COLORS.charcoal}`,
              border: `2px solid ${COLORS.charcoal}`
            }}
          >
            {badge}
          </span>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl"
          >
            <div
              className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: textColor }}
            />
          </div>
        )}
      </button>

      {/* Enhanced Tooltip with Smooth Animation */}
      {showTooltip && !disabled && (
        <div
          className="absolute top-full mt-3 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-none"
          style={{
            backgroundColor: COLORS.charcoalLight,
            color: COLORS.champagne,
            border: `1px solid ${COLORS.gold}40`,
            boxShadow: `0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px ${COLORS.gold}20`
          }}
        >
          {loading ? 'Loading...' : label}

          {/* Enhanced Tooltip Arrow */}
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
            style={{
              backgroundColor: COLORS.charcoalLight,
              borderTop: `1px solid ${COLORS.gold}40`,
              borderLeft: `1px solid ${COLORS.gold}40`
            }}
          />
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
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
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  )
}

/**
 * 🎯 Icon Button Group - Horizontal layout with consistent spacing
 */
interface SalonIconButtonGroupProps {
  children: React.ReactNode
  className?: string
  spacing?: 'sm' | 'md' | 'lg'
}

export function SalonIconButtonGroup({
  children,
  className = '',
  spacing = 'md'
}: SalonIconButtonGroupProps) {
  const spacings = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3'
  }

  return (
    <div className={`flex items-center ${spacings[spacing]} ${className}`}>
      {children}
    </div>
  )
}

/**
 * 🎯 Divider for separating button groups
 */
export function SalonIconButtonDivider() {
  return (
    <div
      className="w-px h-8 mx-1"
      style={{ backgroundColor: COLORS.bronze + '30' }}
    />
  )
}
