// ================================================================================
// HERA APPOINTMENT STATUS BADGE
// Smart Code: HERA.COMPONENTS.APPOINTMENT.STATUS.BADGE.v1
// Status badge with color coding
// ================================================================================

import React from 'react'
import { cn } from '@/src/lib/utils'
import { STATUS_COLORS, type Appointment } from '@/src/lib/schemas/appointment'

interface AppointmentStatusBadgeProps {
  status: Appointment['status']
  size?: 'sm' | 'md' | 'lg'
  showDot?: boolean
  className?: string
}

export function AppointmentStatusBadge({
  status,
  size = 'md',
  showDot = true,
  className,
}: AppointmentStatusBadgeProps) {
  const colors = STATUS_COLORS[status]
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }

  const statusLabels: Record<Appointment['status'], string> = {
    draft: 'Draft',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    service_complete: 'Service Complete',
    paid: 'Paid',
    closed: 'Closed',
    cancelled: 'Cancelled',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        sizeClasses[size],
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            'rounded-full',
            dotSizeClasses[size],
            status === 'cancelled' || status === 'draft' ? 'bg-gray-400' :
            status === 'confirmed' ? 'bg-primary' :
            status === 'in_progress' ? 'bg-purple-500' :
            status === 'service_complete' ? 'bg-secondary' :
            status === 'paid' ? 'bg-green-500' :
            status === 'closed' ? 'bg-blue-500' :
            'bg-gray-400'
          )}
        />
      )}
      {statusLabels[status]}
    </span>
  )
}