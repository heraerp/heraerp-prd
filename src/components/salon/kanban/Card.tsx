// ============================================================================
// HERA • Kanban Card Component with DRAFT support
// ============================================================================

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import {
  Clock,
  User,
  Scissors,
  Star,
  AlertCircle,
  CheckCircle,
  Edit,
  MoreVertical,
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { KanbanCard as CardType, CANCELLABLE_STATES, RESCHEDULABLE_STATES } from '@/schemas/kanban'
import { format } from 'date-fns'

interface CardProps {
  card: CardType
  onConfirm?: () => void
  onEdit?: () => void
  onReschedule?: () => void
  onCancel?: () => void
  onProcessPayment?: () => void
}

export function Card({
  card,
  onConfirm,
  onEdit,
  onReschedule,
  onCancel,
  onProcessPayment
}: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id
  })
  const [isHovered, setIsHovered] = React.useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const startTime = format(new Date(card.start), 'HH:mm')
  const endTime = format(new Date(card.end), 'HH:mm')

  return (
    <div
      ref={setNodeRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...style,
        background: isHovered
          ? 'linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 100%)'
          : 'linear-gradient(135deg, #1A1A1A 0%, #141414 100%)',
        borderColor: card.status === 'DRAFT' ? '#D4AF37' : '#8C785360',
        borderWidth: isHovered ? '2px' : '1px',
        color: '#F5E6C8',
        boxShadow: isHovered
          ? '0 8px 24px rgba(212, 175, 55, 0.2), 0 0 0 1px rgba(212, 175, 55, 0.1)'
          : '0 2px 8px rgba(0, 0, 0, 0.3)',
        transform: isHovered && !isDragging
          ? `${CSS.Transform.toString(transform)} translateY(-2px)`
          : CSS.Transform.toString(transform)
      }}
      className={cn(
        'relative rounded-lg border cursor-move select-none transition-all duration-300',
        isDragging && 'opacity-50 shadow-2xl z-50 scale-105'
      )}
      {...attributes}
      {...listeners}
    >
      {/* Draft badge */}
      {card.status === 'DRAFT' && (
        <div className="absolute -top-2 left-2 animate-in fade-in duration-300">
          <Badge
            variant="outline"
            className="text-xs font-semibold shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
              color: '#0B0B0B',
              borderColor: '#D4AF37',
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)'
            }}
          >
            Draft
          </Badge>
        </div>
      )}

      {/* Cancellation reason badge */}
      {card.status === 'CANCELLED' && card.cancellation_reason && (
        <div className="absolute -top-2 left-2 animate-in fade-in duration-300">
          <Badge
            variant="outline"
            className="text-xs font-semibold shadow-lg"
            style={{
              background: card.cancellation_reason === 'no_show'
                ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
                : 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
              color: '#FFFFFF',
              borderColor: card.cancellation_reason === 'no_show' ? '#DC2626' : '#EA580C',
              boxShadow: card.cancellation_reason === 'no_show'
                ? '0 4px 12px rgba(220, 38, 38, 0.4)'
                : '0 4px 12px rgba(234, 88, 12, 0.4)'
            }}
          >
            {card.cancellation_reason === 'no_show' ? 'No Show' : 'Cancelled'}
          </Badge>
        </div>
      )}

      <div className="p-3 space-y-2">
        {/* Header with time and actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-3 h-3" style={{ color: '#D4AF37' }} />
            <span className="font-medium">
              {startTime} - {endTime}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {card.status === 'DRAFT' && (
                <>
                  <DropdownMenuItem onClick={onConfirm}>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Confirm Booking
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Draft
                  </DropdownMenuItem>
                </>
              )}
              {RESCHEDULABLE_STATES.includes(card.status) && (
                <DropdownMenuItem onClick={onReschedule}>
                  <Clock className="w-4 h-4 mr-2" />
                  Reschedule
                </DropdownMenuItem>
              )}
              {card.status === 'TO_PAY' && (
                <DropdownMenuItem onClick={onProcessPayment} className="text-green-600">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Process Payment
                </DropdownMenuItem>
              )}
              {CANCELLABLE_STATES.includes(card.status) && (
                <DropdownMenuItem onClick={onCancel} className="text-red-600">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Cancel Appointment
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Customer name */}
        <div className="flex items-center gap-2">
          <User className="w-3 h-3" style={{ color: '#D4AF37' }} />
          <span className="font-medium text-sm">{card.customer_name}</span>
          {card.flags?.vip && (
            <Star
              className="w-4 h-4 animate-pulse"
              style={{
                color: '#D4AF37',
                fill: '#D4AF37',
                filter: 'drop-shadow(0 0 4px rgba(212, 175, 55, 0.6))'
              }}
            />
          )}
          {card.flags?.new && (
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0.5 font-semibold"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                color: '#FFFFFF',
                border: 'none'
              }}
            >
              New
            </Badge>
          )}
        </div>

        {/* Service */}
        <div className="flex items-center gap-2 text-sm">
          <Scissors className="w-3 h-3" style={{ color: '#D4AF37' }} />
          <span>{card.service_name}</span>
        </div>

        {/* Stylist */}
        {card.stylist_name && (
          <div className="text-xs" style={{ color: '#8C7853' }}>
            with {card.stylist_name}
          </div>
        )}

        {/* Status indicator */}
        {card.status !== 'DRAFT' && (
          <div className="text-xs mt-2" style={{ color: '#8C7853' }}>
            Status: {card.status.replace('_', ' ').toLowerCase()}
            {card.status === 'TO_PAY' && (
              <span className="ml-2" style={{ color: '#D4AF37' }}>💳 POS Ready</span>
            )}
          </div>
        )}

        {/* Draft actions */}
        {card.status === 'DRAFT' && (
          <div className="flex gap-2 pt-2 border-t" style={{ borderColor: '#8C785320' }}>
            <Button
              size="sm"
              variant="default"
              className="flex-1 h-7 font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                color: '#0B0B0B'
              }}
              onClick={e => {
                e.stopPropagation()
                onConfirm?.()
              }}
            >
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 transition-all duration-300 hover:shadow-md hover:scale-105"
              style={{
                borderColor: '#8C7853',
                color: '#F5E6C8'
              }}
              onClick={e => {
                e.stopPropagation()
                onEdit?.()
              }}
            >
              Edit
            </Button>
          </div>
        )}

        {/* TO_PAY actions */}
        {card.status === 'TO_PAY' && (
          <div className="flex gap-2 pt-2 border-t" style={{ borderColor: '#8C785320' }}>
            <Button
              size="sm"
              variant="default"
              className="flex-1 h-7 font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF'
              }}
              onClick={e => {
                e.stopPropagation()
                onProcessPayment?.()
              }}
            >
              <CreditCard className="w-3 h-3 mr-1" />
              Process Payment
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
