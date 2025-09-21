'use client'

import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface PosCommissionBadgeProps {
  commissionsEnabled: boolean
  className?: string
}

export function PosCommissionBadge({ commissionsEnabled, className }: PosCommissionBadgeProps) {
  if (commissionsEnabled) {
    return (
      <Badge variant="default" className={className}>
        <CheckCircle className="w-3 h-3 mr-1" />
        Commissions ON
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className={className}>
      <AlertCircle className="w-3 h-3 mr-1" />
      Commissions OFF — Simple POS
    </Badge>
  )
}
