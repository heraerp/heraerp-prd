'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

interface SalonProductTileProps extends HTMLAttributes<HTMLDivElement> {
  /** Display mode: grid or list */
  mode?: 'grid' | 'list'
  /** Enable hover effects */
  enableHoverEffects?: boolean
  /** Reduced opacity for disabled/archived states */
  opacity?: number
  /** Custom border color override */
  borderColor?: string
  /** Custom background override */
  background?: string
}

/**
 * SALON PRODUCT TILE COMPONENT
 *
 * Enterprise-grade tile/card component with products page styling.
 * Features linear gradients, subtle hover effects, and compact design.
 *
 * Features:
 * - Linear gradient background (charcoal to dark)
 * - Backdrop blur effect (10px)
 * - Subtle scale animation on hover (1.02)
 * - Gold gradient overlay on hover
 * - Bronze borders with shadow
 * - Compact, information-dense design
 *
 * Differences from SalonLuxeTile:
 * - No mouse-tracking radial gradient
 * - Simpler, more subtle animations
 * - Focus on data density over visual effects
 * - Better for catalog/inventory views
 *
 * @example
 * // Product grid tile
 * <SalonProductTile mode="grid" className="p-5">
 *   <div className="flex items-start gap-3">
 *     <ProductIcon />
 *     <ProductInfo />
 *   </div>
 *   <ProductMetrics />
 * </SalonProductTile>
 *
 * // Archived/disabled product
 * <SalonProductTile opacity={0.6}>
 *   <ProductContent />
 * </SalonProductTile>
 */
export function SalonProductTile({
  mode = 'grid',
  enableHoverEffects = true,
  opacity = 1,
  borderColor,
  background,
  className,
  children,
  onMouseEnter,
  onMouseLeave,
  style,
  ...props
}: SalonProductTileProps) {
  const [isHovered, setIsHovered] = useState(false)
  const tileRef = useRef<HTMLDivElement>(null)

  // Colors from Products page
  const COLORS = {
    charcoalLight: '#232323',
    charcoalDark: '#0F0F0F',
    bronze: '#8C7853',
    gold: '#D4AF37'
  }

  // Default linear gradient background (Products page style)
  const defaultBackground = `linear-gradient(135deg, ${COLORS.charcoalLight}e8 0%, ${COLORS.charcoalDark}f0 100%)`

  // Default border color
  const defaultBorderColor = `${COLORS.bronze}20`

  // Handle mouse enter
  const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    setIsHovered(true)

    if (enableHoverEffects && tileRef.current) {
      // Apply hover scale
      tileRef.current.style.transform = 'scale(1.02)'

      // Enhance shadow
      tileRef.current.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'
    }

    onMouseEnter?.(e)
  }

  // Handle mouse leave
  const handleMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    setIsHovered(false)

    if (tileRef.current) {
      // Reset transformations
      tileRef.current.style.transform = 'scale(1)'

      // Reset shadow
      tileRef.current.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'
    }

    onMouseLeave?.(e)
  }

  const baseStyles: React.CSSProperties = {
    background: background || defaultBackground,
    border: `1px solid ${borderColor || defaultBorderColor}`,
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    opacity,
    // Smooth transition for all properties
    transition: 'all 300ms ease-out',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    ...style
  }

  return (
    <div
      ref={tileRef}
      className={cn(
        'group relative rounded-xl overflow-hidden',
        className
      )}
      style={baseStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Subtle gold gradient overlay on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${COLORS.gold}08 0%, transparent 100%)`
        }}
      />

      {/* Content with relative positioning to appear above overlay */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
