'use client'

import React from 'react'
import { format } from 'date-fns'
import { Calendar, Clock, User, Scissors, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SALON_LUXE_COLORS as LUXE_COLORS, withOpacity } from '@/lib/constants/salon-luxe-colors'

export type AppointmentStatus =
  | 'draft'
  | 'booked'
  | 'checked_in'
  | 'in_progress'
  | 'payment_pending'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'archived'

interface StatusConfig {
  label: string
  color: string
}

const STATUS_CONFIG: Record<AppointmentStatus, StatusConfig> = {
  draft: { label: 'Draft', color: LUXE_COLORS.text.tertiary },
  booked: { label: 'Booked', color: LUXE_COLORS.gold.base },
  checked_in: { label: 'Checked In', color: LUXE_COLORS.plum.base },
  in_progress: { label: 'In Progress', color: LUXE_COLORS.plum.dark },
  payment_pending: { label: 'Payment Due', color: LUXE_COLORS.gold.dark },
  completed: { label: 'Completed', color: LUXE_COLORS.emerald.base },
  cancelled: { label: 'Cancelled', color: LUXE_COLORS.text.tertiary },
  no_show: { label: 'No Show', color: LUXE_COLORS.rose.dark },
  archived: { label: 'Archived', color: LUXE_COLORS.text.tertiary }
}

export interface AppointmentCardProps {
  appointment: {
    id: string
    customer_id?: string
    stylist_id?: string
    branch_id?: string
    start_time?: string
    duration_minutes?: number
    price?: number
    notes?: string
    status: string
    metadata?: {
      service_ids?: string[]
      [key: string]: any
    }
  }
  customers?: Array<{ id: string; entity_name: string }>
  staff?: Array<{ id: string; entity_name: string }>
  services?: Array<{ id: string; entity_name: string }>
  branches?: Array<{ id: string; entity_name: string }>
  organization?: { currencySymbol?: string }
  viewMode?: 'grid' | 'list'
  onClick?: () => void
  showNotes?: boolean
}

/**
 * ✨ SALON LUXE ENTERPRISE APPOINTMENT CARD
 *
 * Premium appointment card component with:
 * - Elegant gold-themed design with gradient effects
 * - Interactive hover animations with radial gradient tracking
 * - Responsive grid/list layouts
 * - Customer, stylist, services, date, time, price display
 * - Status badges with color coding
 * - Click-to-open modal pattern
 *
 * @example
 * <AppointmentCard
 *   appointment={appointment}
 *   customers={customers}
 *   staff={staff}
 *   services={services}
 *   branches={branches}
 *   viewMode="grid"
 *   onClick={() => setSelectedAppointment(appointment)}
 * />
 */
export function AppointmentCard({
  appointment,
  customers = [],
  staff = [],
  services = [],
  branches = [],
  organization,
  viewMode = 'grid',
  onClick,
  showNotes = true
}: AppointmentCardProps) {
  const appointmentDate = appointment.start_time ? new Date(appointment.start_time) : null
  const customerName =
    customers?.find(c => c.id === appointment.customer_id)?.entity_name || 'Customer'
  const stylistName =
    staff?.find(s => s.id === appointment.stylist_id)?.entity_name || 'Unassigned'
  const branchName = branches?.find(b => b.id === appointment.branch_id)?.entity_name

  const serviceIds = appointment.metadata?.service_ids || []
  const serviceNames = serviceIds
    .map((serviceId: string) => services?.find(s => s.id === serviceId)?.entity_name)
    .filter(Boolean)
    .join(', ')

  const status = appointment.status as AppointmentStatus
  const statusConfig = STATUS_CONFIG[status] || {
    label: appointment.status.replace('_', ' '),
    color: LUXE_COLORS.text.tertiary
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-6 transition-all duration-500 cursor-pointer ${viewMode === 'list' ? 'flex items-center justify-between' : ''} relative overflow-hidden group`}
      style={{
        background: `linear-gradient(135deg, ${withOpacity(LUXE_COLORS.charcoal.light, 0.95)} 0%, ${withOpacity(LUXE_COLORS.charcoal.dark, 0.98)} 100%)`,
        border: `1px solid ${LUXE_COLORS.border.light}`,
        boxShadow: `0 4px 16px ${LUXE_COLORS.shadow.black}, inset 0 1px 0 ${withOpacity(LUXE_COLORS.gold.base, 0.1)}`,
        opacity:
          appointment.status === 'archived' || appointment.status === 'cancelled' ? 0.6 : 1,
        backdropFilter: 'blur(12px)'
      }}
      onMouseMove={e => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        e.currentTarget.style.background = `
          radial-gradient(circle at ${x}% ${y}%,
            ${withOpacity(LUXE_COLORS.gold.base, 0.15)} 0%,
            ${withOpacity(LUXE_COLORS.gold.base, 0.08)} 30%,
            ${withOpacity(LUXE_COLORS.charcoal.light, 0.95)} 60%,
            ${withOpacity(LUXE_COLORS.charcoal.dark, 0.98)} 100%
          )
        `
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform =
          viewMode === 'grid' ? 'translateY(-8px) scale(1.03)' : 'translateX(6px)'
        e.currentTarget.style.boxShadow =
          `0 20px 40px ${LUXE_COLORS.shadow.gold}, inset 0 1px 0 ${withOpacity(LUXE_COLORS.gold.base, 0.15)}`
        e.currentTarget.style.borderColor = `${LUXE_COLORS.border.base}`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(1) translateX(0)'
        e.currentTarget.style.boxShadow =
          `0 4px 16px ${LUXE_COLORS.shadow.black}, inset 0 1px 0 ${withOpacity(LUXE_COLORS.gold.base, 0.1)}`
        e.currentTarget.style.borderColor = `${LUXE_COLORS.border.light}`
        e.currentTarget.style.background =
          `linear-gradient(135deg, ${withOpacity(LUXE_COLORS.charcoal.light, 0.95)} 0%, ${withOpacity(LUXE_COLORS.charcoal.dark, 0.98)} 100%)`
      }}
    >
      <div className={viewMode === 'list' ? 'flex-1 flex items-center gap-4' : 'space-y-4'}>
        {/* Header - Customer & Stylist Info */}
        <div
          className={
            viewMode === 'list' ? 'w-[280px] flex-shrink-0' : 'flex items-start justify-between'
          }
        >
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-base mb-1 truncate"
              style={{ color: LUXE_COLORS.champagne.base }}
              title={customerName}
            >
              {customerName}
            </h3>
            <div className="flex items-center gap-2 text-xs mb-1" style={{ color: LUXE_COLORS.text.secondary }}>
              <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: LUXE_COLORS.gold.base }} />
              <span className="truncate" title={stylistName}>
                {stylistName}
              </span>
            </div>
            {serviceNames && (
              <div className="flex items-center gap-2 text-xs mb-1" style={{ color: LUXE_COLORS.text.secondary }}>
                <Scissors className="w-3.5 h-3.5 flex-shrink-0" style={{ color: LUXE_COLORS.gold.base }} />
                <span className="truncate" title={serviceNames}>
                  {serviceNames}
                </span>
              </div>
            )}
            {branchName && viewMode === 'list' && (
              <div
                className="flex items-center gap-2 text-xs"
                style={{ color: LUXE_COLORS.text.tertiary }}
              >
                <Building2 className="w-3 h-3 flex-shrink-0" style={{ color: LUXE_COLORS.gold.base }} />
                <span className="truncate" title={branchName}>
                  {branchName}
                </span>
              </div>
            )}
          </div>
          {viewMode === 'grid' && (
            <Badge
              className="transition-all duration-300 ml-2 flex-shrink-0"
              style={{
                background: `${statusConfig.color}20`,
                color: statusConfig.color,
                border: `1px solid ${statusConfig.color}40`,
                fontWeight: '500',
                textTransform: 'capitalize'
              }}
            >
              {statusConfig.label}
            </Badge>
          )}
        </div>

        {/* Appointment Details - List View */}
        {viewMode === 'list' ? (
          <div className="flex items-center gap-3 flex-1">
            {appointmentDate && (
              <>
                <div
                  className="flex items-center gap-2 text-sm w-[150px] flex-shrink-0"
                  style={{ color: LUXE_COLORS.text.secondary }}
                >
                  <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: LUXE_COLORS.gold.base }} />
                  <span className="font-medium whitespace-nowrap">
                    {format(appointmentDate, 'MMM d, yyyy')}
                  </span>
                </div>
                <div
                  className="flex items-center gap-2 text-sm w-[100px] flex-shrink-0"
                  style={{ color: LUXE_COLORS.text.secondary }}
                >
                  <Clock className="w-4 h-4 flex-shrink-0" style={{ color: LUXE_COLORS.gold.base }} />
                  <span className="font-medium whitespace-nowrap">
                    {format(appointmentDate, 'h:mm a')}
                  </span>
                </div>
              </>
            )}
            {appointment.price !== undefined && appointment.price > 0 && (
              <div
                className="flex items-center gap-2 text-sm font-semibold w-[120px] flex-shrink-0"
                style={{ color: LUXE_COLORS.champagne.base }}
              >
                <span className="whitespace-nowrap">
                  {organization?.currencySymbol || 'AED'} {appointment.price.toFixed(2)}
                </span>
              </div>
            )}
            <Badge
              className="transition-all duration-300 flex-shrink-0 ml-auto"
              style={{
                background: `${statusConfig.color}20`,
                color: statusConfig.color,
                border: `1px solid ${statusConfig.color}40`,
                fontWeight: '600',
                textTransform: 'capitalize',
                minWidth: '100px',
                textAlign: 'center',
                paddingLeft: '12px',
                paddingRight: '12px'
              }}
            >
              {statusConfig.label}
            </Badge>
          </div>
        ) : (
          <div className="space-y-3 pt-3" style={{ borderTop: `1px solid ${LUXE_COLORS.border.lighter}` }}>
            {appointmentDate && (
              <>
                <div className="flex items-center gap-3 text-sm" style={{ color: LUXE_COLORS.text.secondary }}>
                  <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: LUXE_COLORS.gold.base }} />
                  <span className="font-medium">{format(appointmentDate, 'EEEE, MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm" style={{ color: LUXE_COLORS.text.secondary }}>
                  <Clock className="w-4 h-4 flex-shrink-0" style={{ color: LUXE_COLORS.gold.base }} />
                  <span className="font-medium">
                    {format(appointmentDate, 'h:mm a')}
                    {appointment.duration_minutes && (
                      <span className="ml-2 opacity-70">({appointment.duration_minutes} min)</span>
                    )}
                  </span>
                </div>
              </>
            )}
            {branchName && (
              <div className="flex items-center gap-3 text-sm" style={{ color: LUXE_COLORS.text.secondary }}>
                <Building2 className="w-4 h-4 flex-shrink-0" style={{ color: LUXE_COLORS.gold.base }} />
                <span className="truncate font-medium" title={branchName}>
                  {branchName}
                </span>
              </div>
            )}
            {appointment.price !== undefined && appointment.price > 0 && (
              <div
                className="flex items-center gap-3 text-sm font-medium"
                style={{ color: LUXE_COLORS.champagne.base }}
              >
                <span>
                  {organization?.currencySymbol || 'AED'} {appointment.price.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Notes - Only in grid view */}
        {viewMode === 'grid' && showNotes && appointment.notes && (
          <div
            className="p-3 rounded-lg text-xs italic"
            style={{
              background: withOpacity(LUXE_COLORS.gold.base, 0.08),
              border: `1px solid ${LUXE_COLORS.border.lighter}`,
              color: LUXE_COLORS.text.secondary
            }}
          >
            <p className="line-clamp-2">{appointment.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
