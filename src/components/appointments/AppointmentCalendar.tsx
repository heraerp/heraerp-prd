// ================================================================================
// HERA APPOINTMENT CALENDAR
// Smart Code: HERA.COMPONENTS.APPOINTMENT.CALENDAR.V1
// Calendar view with month/week/day modes and status colors
// ================================================================================

'use client'

import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Clock, User } from 'lucide-react'
import { ButtonPrimary } from '@/components/ui/ButtonPrimary'
import { Card } from '@/components/ui/card'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'
import { cn, formatTime, isToday, isTomorrow } from '@/lib/utils'
import type { Appointment } from '@/lib/schemas/appointment'

interface AppointmentCalendarProps {
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
  loading?: boolean
  className?: string
}

type ViewMode = 'month' | 'week' | 'day'

export function AppointmentCalendar({
  appointments,
  onAppointmentClick,
  loading = false,
  className
}: AppointmentCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    switch (viewMode) {
      case 'month':
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        end.setMonth(end.getMonth() + 1)
        end.setDate(0)
        end.setHours(23, 59, 59, 999)
        break
      case 'week':
        const day = start.getDay()
        const diff = start.getDate() - day
        start.setDate(diff)
        start.setHours(0, 0, 0, 0)
        end.setDate(diff + 6)
        end.setHours(23, 59, 59, 999)
        break
      case 'day':
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
    }

    return { start, end }
  }, [currentDate, viewMode])

  // Filter appointments for current view
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const date = new Date(apt.start_time)
      return date >= dateRange.start && date <= dateRange.end
    })
  }, [appointments, dateRange])

  // Group appointments by date
  const groupedAppointments = useMemo(() => {
    const groups: Record<string, Appointment[]> = {}

    filteredAppointments.forEach(apt => {
      const date = new Date(apt.start_time)
      const key = date.toISOString().split('T')[0]

      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(apt)
    })

    // Sort appointments within each day
    Object.values(groups).forEach(dayAppointments => {
      dayAppointments.sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )
    })

    return groups
  }, [filteredAppointments])

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)

    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
        break
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
        break
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
        break
    }

    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getDateLabel = () => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      year: 'numeric'
    }

    switch (viewMode) {
      case 'month':
        return currentDate.toLocaleDateString('en-US', options)
      case 'week':
        const weekStart = new Date(dateRange.start)
        const weekEnd = new Date(dateRange.end)
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      case 'day':
        return currentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
    }
  }

  const renderAppointment = (appointment: Appointment) => (
    <button
      key={appointment.id}
      onClick={() => onAppointmentClick(appointment)}
      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-50/50 transition-colors group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 ink-muted" />
          <span className="text-sm font-medium ink">
            {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
          </span>
        </div>
        <AppointmentStatusBadge status={appointment.status} size="sm" />
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-sm ink">
          <User className="w-3.5 h-3.5 ink-muted" />
          <span className="font-medium">{appointment.customer.name}</span>
          <span className="ink-muted">with</span>
          <span>{appointment.stylist.name}</span>
        </div>

        {appointment.services && appointment.services.length > 0 && (
          <div className="text-xs ink-muted">
            {appointment.services.map(s => s.name).join(', ')}
          </div>
        )}
      </div>

      <div className="mt-2 text-xs font-mono group-hover:ink-muted">
        {appointment.code}
      </div>
    </button>
  )

  if (loading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('p-6', className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold ink">{getDateLabel()}</h2>
          <ButtonPrimary onClick={goToToday} variant="outline" size="sm">
            Today
          </ButtonPrimary>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Selector */}
          <div className="flex rounded-lg border border-gray-200 p-1">
            {(['month', 'week', 'day'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize',
                  viewMode === mode ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <ButtonPrimary
            onClick={() => navigate('prev')}
            variant="outline"
            size="sm"
            icon={<ChevronLeft className="w-4 h-4" />}
          />
          <ButtonPrimary
            onClick={() => navigate('next')}
            variant="outline"
            size="sm"
            icon={<ChevronRight className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Calendar Content */}
      <div className="space-y-4">
        {Object.entries(groupedAppointments).length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="ink-muted mb-4">No appointments scheduled</p>
            <ButtonPrimary
              onClick={() => (window.location.href = '/appointments/new')}
              variant="primary"
            >
              Book your first appointment
            </ButtonPrimary>
          </div>
        ) : (
          Object.entries(groupedAppointments)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([dateKey, dayAppointments]) => {
              const date = new Date(dateKey)
              const dateLabel = isToday(date)
                ? 'Today'
                : isTomorrow(date)
                  ? 'Tomorrow'
                  : date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })

              return (
                <div key={dateKey}>
                  <h3 className="text-sm font-medium ink mb-3">
                    {dateLabel}
                    <span className="ml-2 text-xs ink-muted">
                      ({dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}
                      )
                    </span>
                  </h3>
                  <div className="space-y-2">{dayAppointments.map(renderAppointment)}</div>
                </div>
              )
            })
        )}
      </div>
    </Card>
  )
}
