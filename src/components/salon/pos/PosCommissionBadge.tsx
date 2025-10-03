'use client'

import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle } from 'lucide-react'

// Luxe salon color palette
const COLORS = {
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  emerald: '#0F6F5C',
  charcoalDark: '#0F0F0F',
  plum: '#B794F4'
}

interface PosCommissionBadgeProps {
  commissionsEnabled: boolean
  className?: string
}

export function PosCommissionBadge({ commissionsEnabled, className }: PosCommissionBadgeProps) {
  if (commissionsEnabled) {
    return (
      <Badge
        variant="default"
        className={`px-4 py-1.5 font-semibold ${className}`}
        style={{
          background: `linear-gradient(135deg, ${COLORS.emerald}25 0%, ${COLORS.emerald}15 100%)`,
          color: COLORS.emerald,
          border: `1px solid ${COLORS.emerald}60`,
          boxShadow: `0 0 16px ${COLORS.emerald}20, 0 0 0 1px ${COLORS.emerald}30`
        }}
      >
        <CheckCircle className="w-4 h-4 mr-2" style={{ color: COLORS.emerald }} />
        Commissions ON
      </Badge>
    )
  }

  return (
    <Badge
      variant="secondary"
      className={`px-4 py-1.5 font-semibold ${className}`}
      style={{
        background: `linear-gradient(135deg, ${COLORS.plum}20 0%, ${COLORS.plum}10 100%)`,
        color: COLORS.plum,
        border: `1px solid ${COLORS.plum}40`,
        boxShadow: `0 0 12px ${COLORS.plum}15, 0 0 0 1px ${COLORS.plum}20`
      }}
    >
      <AlertCircle className="w-4 h-4 mr-2" style={{ color: COLORS.plum }} />
      Commissions OFF — Simple POS
    </Badge>
  )
}
