'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

interface CharacterCounterProps {
  current: number
  min?: number
  max?: number
  showCheck?: boolean
  className?: string
}

/**
 * ENTERPRISE CHARACTER COUNTER
 *
 * Displays character count with validation state:
 * - Red when below minimum
 * - Green with checkmark when valid
 * - Amber when approaching maximum
 * - Red when exceeding maximum
 *
 * @example
 * ```tsx
 * <CharacterCounter
 *   current={formData.reason.length}
 *   min={10}
 *   max={500}
 *   showCheck
 * />
 * ```
 */
export function CharacterCounter({
  current,
  min,
  max,
  showCheck = true,
  className = ''
}: CharacterCounterProps) {
  // Determine validation state
  const isValid = (!min || current >= min) && (!max || current <= max)
  const isApproachingMax = max && current > max * 0.8 && current <= max
  const isExceedingMax = max && current > max
  const isBelowMin = min && current < min

  // Determine color
  let color = SALON_LUXE_COLORS.bronze
  if (isExceedingMax || isBelowMin) {
    color = SALON_LUXE_COLORS.rose
  } else if (isApproachingMax) {
    color = SALON_LUXE_COLORS.gold.base
  } else if (isValid && min && current >= min) {
    color = SALON_LUXE_COLORS.emerald
  }

  // Build display text
  let displayText = `${current}`
  if (min && !max) {
    displayText += ` / ${min} characters`
  } else if (max) {
    displayText += ` / ${max} characters`
  } else {
    displayText += ' characters'
  }

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${className}`} style={{ color }}>
      <span>{displayText}</span>
      {showCheck && isValid && min && current >= min && (
        <Check className="w-3.5 h-3.5 animate-in zoom-in duration-200" />
      )}
    </div>
  )
}
