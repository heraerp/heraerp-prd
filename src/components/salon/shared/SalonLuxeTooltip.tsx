'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

interface SalonLuxeTooltipProps {
  content: string
  children: React.ReactNode
  delay?: number
  position?: 'top' | 'bottom' | 'left' | 'right'
  maxWidth?: string
  showIcon?: boolean
}

/**
 * ✨ SALON LUXE ENTERPRISE TOOLTIP
 *
 * Premium tooltip component with:
 * - Elegant gold-themed design matching Salon Luxe aesthetic
 * - Smooth animations with backdrop blur
 * - Smart positioning that avoids screen edges
 * - Configurable delay and positioning
 * - Optional sparkle icon for premium feel
 *
 * @example
 * <SalonLuxeTooltip content="Full product name here">
 *   <h3>Truncated name...</h3>
 * </SalonLuxeTooltip>
 */
export function SalonLuxeTooltip({
  content,
  children,
  delay = 300,
  position = 'top',
  maxWidth = '300px',
  showIcon = false
}: SalonLuxeTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [actualPosition, setActualPosition] = useState(position)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  // Calculate absolute position based on trigger element
  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const offset = 8 // Distance from trigger element

      let top = 0
      let left = 0
      let newPosition = position

      // Calculate position based on preference
      switch (position) {
        case 'top':
          top = triggerRect.top - offset
          left = triggerRect.left + triggerRect.width / 2
          if (top < 100) newPosition = 'bottom' // Not enough space on top
          break
        case 'bottom':
          top = triggerRect.bottom + offset
          left = triggerRect.left + triggerRect.width / 2
          if (top > viewportHeight - 100) newPosition = 'top' // Not enough space on bottom
          break
        case 'left':
          top = triggerRect.top + triggerRect.height / 2
          left = triggerRect.left - offset
          if (left < 100) newPosition = 'right' // Not enough space on left
          break
        case 'right':
          top = triggerRect.top + triggerRect.height / 2
          left = triggerRect.right + offset
          if (left > viewportWidth - 100) newPosition = 'left' // Not enough space on right
          break
      }

      setActualPosition(newPosition)
      setTooltipPosition({ top, left })
    }
  }, [isVisible, position])

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const getPositionStyles = () => {
    const { top, left } = tooltipPosition

    switch (actualPosition) {
      case 'top':
        return {
          top: `${top}px`,
          left: `${left}px`,
          transform: 'translate(-50%, -100%)'
        }
      case 'bottom':
        return {
          top: `${top}px`,
          left: `${left}px`,
          transform: 'translateX(-50%)'
        }
      case 'left':
        return {
          top: `${top}px`,
          left: `${left}px`,
          transform: 'translate(-100%, -50%)'
        }
      case 'right':
        return {
          top: `${top}px`,
          left: `${left}px`,
          transform: 'translateY(-50%)'
        }
      default:
        return {
          top: `${top}px`,
          left: `${left}px`
        }
    }
  }

  const getArrowStyles = () => {
    const arrowSize = '6px'

    switch (actualPosition) {
      case 'top':
        return {
          bottom: `-${arrowSize}`,
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          borderTop: `1px solid ${SALON_LUXE_COLORS.gold.base}40`,
          borderLeft: `1px solid ${SALON_LUXE_COLORS.gold.base}40`
        }
      case 'bottom':
        return {
          top: `-${arrowSize}`,
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          borderBottom: `1px solid ${SALON_LUXE_COLORS.gold.base}40`,
          borderRight: `1px solid ${SALON_LUXE_COLORS.gold.base}40`
        }
      case 'left':
        return {
          right: `-${arrowSize}`,
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
          borderTop: `1px solid ${SALON_LUXE_COLORS.gold.base}40`,
          borderRight: `1px solid ${SALON_LUXE_COLORS.gold.base}40`
        }
      case 'right':
        return {
          left: `-${arrowSize}`,
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
          borderBottom: `1px solid ${SALON_LUXE_COLORS.gold.base}40`,
          borderLeft: `1px solid ${SALON_LUXE_COLORS.gold.base}40`
        }
      default:
        return {}
    }
  }

  // Render tooltip content
  const tooltipContent = isVisible && typeof window !== 'undefined' ? (
    <div
      ref={tooltipRef}
      className="fixed z-[99999] pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-200"
      style={{
        ...getPositionStyles(),
        maxWidth
      }}
    >
      {/* Tooltip Content */}
      <div
        className="relative px-4 py-2.5 rounded-lg shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.charcoal.dark}f8 0%, ${SALON_LUXE_COLORS.charcoal.base}fa 100%)`,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${SALON_LUXE_COLORS.gold.base}40`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${SALON_LUXE_COLORS.gold.base}10, 0 0 20px ${SALON_LUXE_COLORS.gold.base}20`
        }}
      >
        {/* Subtle shine effect */}
        <div
          className="absolute inset-0 rounded-lg pointer-events-none opacity-30"
          style={{
            background: `radial-gradient(circle at top left, ${SALON_LUXE_COLORS.gold.base}15, transparent 50%)`
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex items-start gap-2">
          {showIcon && (
            <svg
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke={SALON_LUXE_COLORS.gold.base}
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          )}
          <p
            className="text-sm font-medium leading-relaxed"
            style={{ color: SALON_LUXE_COLORS.champagne.base }}
          >
            {content}
          </p>
        </div>

        {/* Arrow */}
        <div
          className="absolute w-3 h-3"
          style={{
            ...getArrowStyles(),
            backgroundColor: SALON_LUXE_COLORS.charcoal.dark,
            boxShadow: `0 0 10px ${SALON_LUXE_COLORS.gold.base}20`
          }}
        />
      </div>
    </div>
  ) : null

  return (
    <>
      <div
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {/* ✅ PORTAL: Render tooltip at body level to escape stacking context */}
      {tooltipContent && createPortal(tooltipContent, document.body)}
    </>
  )
}

/**
 * ✨ SALON LUXE ENTERPRISE TOOLTIP - COMPACT VERSION
 *
 * Lightweight version for inline use with automatic wrapping
 */
interface SalonLuxeTooltipInlineProps {
  content: string
  children: React.ReactNode
  className?: string
}

export function SalonLuxeTooltipInline({
  content,
  children,
  className = ''
}: SalonLuxeTooltipInlineProps) {
  return (
    <SalonLuxeTooltip content={content}>
      <span className={`cursor-help ${className}`}>{children}</span>
    </SalonLuxeTooltip>
  )
}
