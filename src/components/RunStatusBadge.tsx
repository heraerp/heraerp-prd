import React from 'react'
import { Badge } from '@/components/ui/badge'

interface RunStatusBadgeProps {
  status: string
}

export function RunStatusBadge({ status }: RunStatusBadgeProps) {
  const getVariant = () => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'default'
      case 'running':
      case 'in_progress':
        return 'secondary'
      case 'failed':
      case 'error':
        return 'destructive'
      case 'pending':
      case 'queued':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getDisplayText = () => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/_/g, ' ')
  }

  return <Badge variant={getVariant()}>{getDisplayText()}</Badge>
}
