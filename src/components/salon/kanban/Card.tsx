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
  CreditCard,
  ArrowRight,
  ChevronRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'
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
  onMoveToNext?: () => void
}

export function Card({
  card,
  onConfirm,
  onEdit,
  onReschedule,
  onCancel,
  onProcessPayment,
  onMoveToNext
}: CardProps) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id
  })
  const [isHovered, setIsHovered] = React.useState(false)
  const [mousePosition, setMousePosition] = React.useState({ x: 50, y: 50 })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging
      ? transition
      : 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' // 🎨 ENTERPRISE: Spring animation
  }

  const startTime = format(new Date(card.start), 'HH:mm')
  const endTime = format(new Date(card.end), 'HH:mm')

  // 🎨 ENTERPRISE: Mouse movement animation handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePosition({ x, y })
  }

  return (
    <div
      ref={setNodeRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setMousePosition({ x: 50, y: 50 })
      }}
      onMouseMove={handleMouseMove}
      style={{
        ...style,
        // 🎨 ENTERPRISE: Mouse-following radial gradient background
        background: isHovered
          ? `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%,
               rgba(212, 175, 55, 0.15) 0%,
               rgba(212, 175, 55, 0.08) 30%,
               rgba(42, 42, 42, 0.95) 60%,
               rgba(26, 26, 26, 1) 100%)`
          : 'linear-gradient(135deg, #1A1A1A 0%, #141414 100%)',
        borderColor: isHovered ? '#D4AF37' : '#D4AF3780', // 🎨 ENTERPRISE: Golden outline for all cards
        borderWidth: isHovered ? '2px' : '1px',
        borderRadius: '1rem', // 🎨 ENTERPRISE: Softer edges
        color: '#F5E6C8',
        boxShadow: isHovered
          ? '0 12px 32px rgba(212, 175, 55, 0.25), 0 0 0 1px rgba(212, 175, 55, 0.15), inset 0 0 20px rgba(212, 175, 55, 0.05)'
          : '0 4px 12px rgba(0, 0, 0, 0.3)', // 🎨 Enhanced shadow
        transform:
          isHovered && !isDragging
            ? `${CSS.Transform.toString(transform)} translateY(-6px) scale(1.03)` // 🎨 More lift
            : CSS.Transform.toString(transform)
      }}
      className={cn(
        'relative border cursor-move select-none group', // 🎯 ENTERPRISE: Added 'group' for hover effects
        isDragging && 'opacity-50 shadow-2xl z-50 scale-105'
      )}
      {...attributes}
      {...listeners}
    >
      {/* Cancellation reason badge */}
      {card.status === 'CANCELLED' && card.cancellation_reason && (
        <div className="absolute -top-2 left-2 animate-in fade-in duration-300">
          <Badge
            variant="outline"
            className="text-xs font-semibold shadow-lg"
            style={{
              background:
                card.cancellation_reason === 'no_show'
                  ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
                  : 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
              color: '#FFFFFF',
              borderColor: card.cancellation_reason === 'no_show' ? '#DC2626' : '#EA580C',
              borderRadius: '0.75rem', // 🎨 ENTERPRISE: Softer edges
              boxShadow:
                card.cancellation_reason === 'no_show'
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
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 transition-all duration-300"
                style={{
                  borderRadius: '0.5rem' // 🎨 ENTERPRISE: Softer edges
                }}
              >
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
              {card.status === 'PAYMENT_PENDING' && (
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

        {/* Customer name with quick action */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <User className="w-3 h-3" style={{ color: '#D4AF37' }} />
            <span className="font-medium text-sm">{card.customer_name}</span>
          </div>
          {/* 🎯 ENTERPRISE: Quick action arrow for next state */}
          {card.status !== 'DONE' && card.status !== 'CANCELLED' && onMoveToNext && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={e => {
                e.stopPropagation()
                onMoveToNext()
              }}
              style={{
                color: '#D4AF37',
                borderRadius: '0.5rem', // 🎨 ENTERPRISE: Softer edges
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#F5E6C8'
                e.currentTarget.style.transform = 'scale(1.2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#D4AF37'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
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
                border: 'none',
                borderRadius: '0.75rem' // 🎨 ENTERPRISE: Softer edges
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
            {card.status === 'PAYMENT_PENDING' && (
              <span className="ml-2" style={{ color: '#D4AF37' }}>
                💳 POS Ready
              </span>
            )}
          </div>
        )}

        {/* Draft actions */}
        {card.status === 'DRAFT' && (
          <div className="flex gap-2 pt-2 border-t" style={{ borderColor: '#8C785320' }}>
            <Button
              size="sm"
              variant="default"
              className="flex-1 h-8 font-medium"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.15) 100%)',
                color: '#10B981',
                border: '1px solid rgba(16,185,129,0.4)',
                borderRadius: '0.5rem', // 🎨 ENTERPRISE: Soft edges
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', // 🎨 ENTERPRISE: Spring easing
                boxShadow: '0 2px 8px rgba(16,185,129,0.1)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.35) 0%, rgba(16,185,129,0.25) 100%)'
                e.currentTarget.style.borderColor = 'rgba(16,185,129,0.7)'
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.25)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.15) 100%)'
                e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.1)'
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
              className="flex-1 h-8"
              style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.15) 100%)',
                color: '#D4AF37',
                border: '1px solid rgba(212,175,55,0.4)',
                borderRadius: '0.5rem', // 🎨 ENTERPRISE: Soft edges
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', // 🎨 ENTERPRISE: Spring easing
                boxShadow: '0 2px 8px rgba(212,175,55,0.1)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,175,55,0.35) 0%, rgba(212,175,55,0.25) 100%)'
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.7)'
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(212,175,55,0.25)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.15) 100%)'
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(212,175,55,0.1)'
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

        {/* TO_PAY actions - 🎯 ENTERPRISE: PAY button redirects to POS */}
        {card.status === 'PAYMENT_PENDING' && (
          <div className="flex gap-2 pt-2 border-t" style={{ borderColor: '#8C785320' }}>
            <Button
              size="sm"
              variant="default"
              className="flex-1 h-8 font-medium"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.15) 100%)',
                color: '#10B981',
                border: '1px solid rgba(16,185,129,0.4)',
                borderRadius: '0.5rem',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 2px 8px rgba(16,185,129,0.1)',
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.35) 0%, rgba(16,185,129,0.25) 100%)'
                e.currentTarget.style.borderColor = 'rgba(16,185,129,0.7)'
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.25)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.15) 100%)'
                e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.1)'
              }}
              onPointerDown={e => {
                e.stopPropagation()
              }}
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                // 🎯 ENTERPRISE: Build comprehensive appointment data for POS
                const appointmentData = {
                  id: card.id,
                  customer_name: card.customer_name,
                  customer_id: card.customer_id,
                  stylist_name: card.stylist_name,
                  stylist_id: card.stylist_id,
                  service_name: card.service_name,
                  service_id: card.service_id,
                  start: card.start,
                  end: card.end,
                  price: card.price,
                  duration: card.duration,
                  status: card.status
                }

                // Store appointment details in sessionStorage for POS page
                sessionStorage.setItem('pos_appointment', JSON.stringify(appointmentData))

                // 🎯 ENTERPRISE: Redirect to POS with appointment ID
                router.push(`/salon/pos?appointment=${card.id}`)
              }}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pay Now
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
