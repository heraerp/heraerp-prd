// ================================================================================
// HERA APPOINTMENT ACTIONS
// Smart Code: HERA.COMPONENTS.APPOINTMENT.ACTIONS.v1
// State transition action buttons with validation
// ================================================================================

import React from 'react'
import { 
  Play, 
  CheckCircle, 
  DollarSign, 
  Lock, 
  XCircle, 
  UserX,
  Calendar
} from 'lucide-react'
import { ButtonPrimary } from '@/src/components/ui/ButtonPrimary'
import { getAllowedTransitions, type Appointment, type AppointmentTransition } from '@/src/lib/schemas/appointment'
import { cn } from '@/src/lib/utils'

interface AppointmentActionsProps {
  appointment: Appointment
  onTransition: (action: AppointmentTransition['action']) => void
  onOpenPOS?: () => void
  loading?: boolean
  className?: string
}

export function AppointmentActions({
  appointment,
  onTransition,
  onOpenPOS,
  loading = false,
  className,
}: AppointmentActionsProps) {
  const allowedTransitions = getAllowedTransitions(appointment.status)

  const actionConfig: Record<AppointmentTransition['action'], {
    label: string
    icon: React.ReactNode
    variant?: 'primary' | 'secondary' | 'outline'
    className?: string
  }> = {
    confirm: {
      label: 'Confirm Appointment',
      icon: <Calendar className="w-4 h-4" />,
      variant: 'primary',
    },
    start: {
      label: 'Check In',
      icon: <Play className="w-4 h-4" />,
      variant: 'primary',
      className: 'bg-purple-600 hover:bg-purple-700',
    },
    complete: {
      label: 'Mark Complete',
      icon: <CheckCircle className="w-4 h-4" />,
      variant: 'secondary',
    },
    mark_paid: {
      label: 'Mark as Paid',
      icon: <DollarSign className="w-4 h-4" />,
      variant: 'primary',
      className: 'bg-green-600 hover:bg-green-700',
    },
    close: {
      label: 'Close Appointment',
      icon: <Lock className="w-4 h-4" />,
      variant: 'outline',
    },
    cancel: {
      label: 'Cancel',
      icon: <XCircle className="w-4 h-4" />,
      variant: 'outline',
      className: 'text-red-600 border-red-200 hover:bg-red-50',
    },
    no_show: {
      label: 'No Show',
      icon: <UserX className="w-4 h-4" />,
      variant: 'outline',
      className: 'text-gray-600 border-gray-200 hover:bg-gray-50',
    },
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {allowedTransitions.map((action) => {
        const config = actionConfig[action]
        
        return (
          <ButtonPrimary
            key={action}
            onClick={() => onTransition(action)}
            disabled={loading}
            variant={config.variant}
            size="md"
            icon={config.icon}
            className={config.className}
          >
            {config.label}
          </ButtonPrimary>
        )
      })}

      {/* Show Open POS button when service is complete */}
      {appointment.status === 'service_complete' && onOpenPOS && (
        <ButtonPrimary
          onClick={onOpenPOS}
          disabled={loading}
          variant="primary"
          size="md"
          icon={<DollarSign className="w-4 h-4" />}
          className="bg-green-600 hover:bg-green-700 ml-auto"
        >
          Open POS
        </ButtonPrimary>
      )}
    </div>
  )
}