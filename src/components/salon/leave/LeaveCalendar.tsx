'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate, isTodaySafe } from '@/lib/date-utils'
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  getDay,
  addMonths,
  subMonths
} from 'date-fns'

interface LeaveCalendarProps {
  requests: any[]
  staff: any[]
  branchId?: string
  showAppointments?: boolean
}

export function LeaveCalendar({ requests, staff, branchId, showAppointments }: LeaveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Add padding days to start on Sunday
  const startPadding = getDay(monthStart)
  const paddingDays = Array.from(
    { length: startPadding },
    (_, i) => new Date(monthStart.getTime() - (startPadding - i) * 24 * 60 * 60 * 1000)
  )

  const allDays = [...paddingDays, ...monthDays]

  const getEventsForDay = (date: Date) => {
    return requests.filter(request => {
      const from = request.metadata?.from ? new Date(request.metadata.from) : null
      const to = request.metadata?.to ? new Date(request.metadata.to) : null
      if (!from || !to) return false

      return date >= from && date <= to
    })
  }

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'ANNUAL':
        return 'bg-blue-500 border-blue-600'
      case 'SICK':
        return 'bg-emerald-500 border-emerald-600'
      case 'UNPAID':
        return 'bg-gray-900 border-border'
      default:
        return 'bg-purple-500 border-purple-600'
    }
  }

  // Get staff name by ID
  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId)
    return staffMember?.entity_name || 'Unknown'
  }

  const getStaffInitials = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId)
    if (!staffMember) return '??'
    const names = staffMember.entity_name.split(' ')
    return names
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
  }

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  return (
    <div className="p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-100 dark:text-foreground">
            {formatDate(currentDate, 'MMMM yyyy')}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="backdrop-blur-xl bg-background/30 dark:bg-background/30 border-border/20 dark:border-border/30"
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousMonth}
            className="backdrop-blur-xl bg-background/30 dark:bg-background/30 border-border/20 dark:border-border/30"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            className="backdrop-blur-xl bg-background/30 dark:bg-background/30 border-border/20 dark:border-border/30"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-blue-500 border border-blue-600" />
          <span className="text-muted-foreground dark:text-muted-foreground">Annual Leave</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-emerald-500 border border-emerald-600" />
          <span className="text-muted-foreground dark:text-muted-foreground">Sick Leave</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-gray-900 border border-border" />
          <span className="text-muted-foreground dark:text-muted-foreground">Unpaid Leave</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-700 dark:bg-muted-foreground/10 rounded-xl overflow-hidden">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="bg-muted dark:bg-muted p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {allDays.map((day, index) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isCurrentDay = isTodaySafe(day)

          return (
            <div
              key={index}
              className={`bg-background dark:bg-background p-2 min-h-[100px] ${
                !isCurrentMonth ? 'opacity-50' : ''
              } ${isCurrentDay ? 'ring-2 ring-inset ring-indigo-500' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-medium ${
                    isCurrentDay
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-100 dark:text-foreground'
                  }`}
                >
                  {formatDate(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-xs text-muted-foreground dark:text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {dayEvents.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={`px-1.5 py-0.5 text-xs rounded text-white font-medium ${getLeaveTypeColor(
                      event.metadata?.type || 'ANNUAL'
                    )} cursor-pointer hover:opacity-90 transition-opacity`}
                    title={`${getStaffName(event.source_entity_id)}`}
                  >
                    {getStaffInitials(event.source_entity_id)}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground dark:text-muted-foreground text-center">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
