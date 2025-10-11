'use client'

import { HTMLAttributes, useState, useRef, MouseEvent } from 'react'
import { cn } from '@/lib/utils'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

interface SalonLuxeTileProps extends HTMLAttributes<HTMLDivElement> {
  /** Display mode: grid (vertical lift) or list (horizontal slide) */
  mode?: 'grid' | 'list'
  /** Enable mouse tracking radial gradient effect */
  enableMouseTracking?: boolean
  /** Enable hover animations */
  enableHoverEffects?: boolean
  /** Reduced opacity for disabled/archived states */
  opacity?: number
  /** Custom border color override */
  borderColor?: string
  /** Custom background override */
  background?: string
}

/**
 * SALON LUXE TILE COMPONENT
 *
 * Enterprise-grade tile/card component with appointments page styling.
 * Features glassmorphism, golden borders, and mouse-tracking animations.
 *
 * Features:
 * - Glassmorphism with 8px backdrop blur
 * - Golden gradient borders with hover effects
 * - Mouse-tracking radial gradient (follows cursor)
 * - Spring animations with soft easing
 * - Grid mode: Lifts up and scales (translateY + scale)
 * - List mode: Slides horizontally
 * - Inset shadows for depth
 *
 * @example
 * // Grid tile
 * <SalonLuxeTile mode="grid" className="p-6">
 *   <h3>Appointment Title</h3>
 *   <p>Content here</p>
 * </SalonLuxeTile>
 *
 * // List tile
 * <SalonLuxeTile mode="list" className="flex items-center p-4">
 *   <div>Content</div>
 * </SalonLuxeTile>
 */
export function SalonLuxeTile({
  mode = 'grid',
  enableMouseTracking = true,
  enableHoverEffects = true,
  opacity = 1,
  borderColor,
  background,
  className,
  children,
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
  style,
  ...props
}: SalonLuxeTileProps) {
  const [isHovered, setIsHovered] = useState(false)
  const tileRef = useRef<HTMLDivElement>(null)

  // Spring animation curve from appointments page
  const SPRING_CURVE = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  const SMOOTH_CURVE = 'cubic-bezier(0.4, 0, 0.2, 1)'

  // Default gradient background
  const defaultBackground =
    'linear-gradient(135deg, rgba(245,230,200,0.08) 0%, rgba(212,175,55,0.05) 50%, rgba(184,134,11,0.03) 100%)'

  // Handle mouse movement for radial gradient effect
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!enableMouseTracking || !tileRef.current) {
      onMouseMove?.(e)
      return
    }

    const rect = tileRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    tileRef.current.style.background = `
      radial-gradient(circle at ${x}% ${y}%,
        rgba(212,175,55,0.15) 0%,
        rgba(212,175,55,0.08) 30%,
        rgba(245,230,200,0.05) 60%,
        rgba(184,134,11,0.03) 100%
      )
    `

    onMouseMove?.(e)
  }

  // Handle mouse enter
  const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    setIsHovered(true)

    if (enableHoverEffects && tileRef.current) {
      // Apply hover transformations based on mode
      if (mode === 'grid') {
        tileRef.current.style.transform = 'translateY(-8px) scale(1.03)'
      } else {
        tileRef.current.style.transform = 'translateX(6px)'
      }

      // Brighten border and enhance shadow
      tileRef.current.style.boxShadow =
        '0 20px 40px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.15)'
      tileRef.current.style.borderColor = `${borderColor || 'rgba(212, 175, 55, 0.60)'}`
    }

    onMouseEnter?.(e)
  }

  // Handle mouse leave
  const handleMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    setIsHovered(false)

    if (tileRef.current) {
      // Reset transformations
      tileRef.current.style.transform = 'translateY(0) scale(1) translateX(0)'

      // Reset shadow and border
      tileRef.current.style.boxShadow =
        '0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1)'
      tileRef.current.style.borderColor = borderColor || 'rgba(212, 175, 55, 0.25)'

      // Reset background to default gradient
      if (enableMouseTracking) {
        tileRef.current.style.background = background || defaultBackground
      }
    }

    onMouseLeave?.(e)
  }

  const baseStyles: React.CSSProperties = {
    background: background || defaultBackground,
    border: `1px solid ${borderColor || 'rgba(212, 175, 55, 0.25)'}`,
    boxShadow: '0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    opacity,
    // Use separate transition properties instead of shorthand
    transitionProperty: 'all',
    transitionDuration: '500ms',
    transitionTimingFunction: SPRING_CURVE,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    ...style,
  }

  return (
    <div
      ref={tileRef}
      className={cn(
        'rounded-xl cursor-pointer relative overflow-hidden group',
        className
      )}
      style={baseStyles}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  )
}
