// ================================================================================
// HERA APPOINTMENT TIMELINE
// Smart Code: HERA.COMPONENTS.APPOINTMENT.TIMELINE.v1
// Activity timeline with chronological events
// ================================================================================

import React from 'react'
import { Calendar, MessageSquare, User, Bot, DollarSign, FileText, AlertCircle } from 'lucide-react'
import { formatDateTime, getRelativeTime, cn } from '@/lib/utils'
import type { ActivityEvent } from '@/lib/schemas/appointment'

interface AppointmentTimelineProps {
  events: ActivityEvent[]
  className?: string
}

export function AppointmentTimeline({ events, className }: AppointmentTimelineProps) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const getEventIcon = (event: ActivityEvent) => {
    switch (event.event_type) {
      case 'created':
        return <Calendar className="w-4 h-4" />
      case 'status_changed':
        return <AlertCircle className="w-4 h-4" />
      case 'whatsapp_sent':
        return <MessageSquare className="w-4 h-4" />
      case 'customer_confirmed':
        return <User className="w-4 h-4" />
      case 'reminder_sent':
        return <MessageSquare className="w-4 h-4" />
      case 'payment_received':
        return <DollarSign className="w-4 h-4" />
      case 'note_added':
        return <FileText className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getEventColor = (event: ActivityEvent) => {
    switch (event.event_type) {
      case 'created':
        return 'bg-blue-100 text-blue-700'
      case 'status_changed':
        return 'bg-purple-100 text-purple-700'
      case 'whatsapp_sent':
      case 'reminder_sent':
        return 'bg-green-100 text-green-700'
      case 'customer_confirmed':
        return 'bg-primary-100 text-primary-700'
      case 'payment_received':
        return 'bg-emerald-100 text-emerald-700'
      case 'note_added':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getEventDescription = (event: ActivityEvent) => {
    switch (event.event_type) {
      case 'created':
        return 'Appointment created'
      case 'status_changed':
        return `Status changed from ${event.details.from} to ${event.details.to}`
      case 'whatsapp_sent':
        return `WhatsApp ${event.details.message_type} sent`
      case 'customer_confirmed':
        return 'Customer confirmed appointment'
      case 'reminder_sent':
        return 'Reminder sent to customer'
      case 'payment_received':
        return 'Payment received'
      case 'note_added':
        return 'Note added'
      default:
        return event.event_type.replace(/_/g, ' ')
    }
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 ink-muted">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No activity yet</p>
      </div>
    )
  }

  return (
    <div className={cn('flow-root', className)}>
      <ul className="-mb-8">
        {sortedEvents.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== sortedEvents.length - 1 ? (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white',
                      getEventColor(event)
                    )}
                  >
                    {getEventIcon(event)}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm ink">
                      {getEventDescription(event)}{' '}
                      <span className="font-medium ink">by {event.actor.name}</span>
                    </p>

                    {/* Show additional details */}
                    {event.details.reason && (
                      <p className="mt-1 text-sm ink-muted">Reason: {event.details.reason}</p>
                    )}

                    {/* Show smart code and transaction ID for audit */}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs ink-muted">
                      {event.smart_code && (
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 font-mono">
                          {event.smart_code}
                        </span>
                      )}
                      {event.transaction_id && (
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 font-mono">
                          TXN: {event.transaction_id}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm">
                    <time dateTime={event.timestamp} className="ink-muted">
                      {getRelativeTime(event.timestamp)}
                    </time>
                    <div className="text-xs ink-muted mt-0.5">
                      {formatDateTime(event.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
