'use client'

import React, { useState, useMemo } from 'react'
import { LeaveRequest } from '@/hooks/useHeraLeave'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, addMonths, subMonths } from 'date-fns'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#9B59B6',
  rose: '#E8B4B8'
}

interface LeaveCalendarTabProps {
  requests: LeaveRequest[]
  staff: Array<{ id: string; entity_name: string }>
  branchId?: string
}

const LEAVE_TYPE_COLORS = {
  ANNUAL: COLORS.plum,
  SICK: COLORS.rose,
  UNPAID: COLORS.bronze,
  OTHER: '#666'
}

export function LeaveCalendarTab({ requests, staff, branchId }: LeaveCalendarTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Get month info
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get leave requests for this month
  const monthRequests = useMemo(() => {
    return requests.filter(request => {
      const startDate = new Date(request.start_date)
      const endDate = new Date(request.end_date)
      return (
        isWithinInterval(monthStart, { start: startDate, end: endDate }) ||
        isWithinInterval(monthEnd, { start: startDate, end: endDate }) ||
        (startDate <= monthStart && endDate >= monthEnd)
      )
    })
  }, [requests, monthStart, monthEnd])

  // Get leave requests for a specific day
  const getLeaveForDay = (day: Date) => {
    return monthRequests.filter(request => {
      const startDate = new Date(request.start_date)
      const endDate = new Date(request.end_date)
      return isWithinInterval(day, { start: startDate, end: endDate })
    })
  }

  // Get leave requests for selected date
  const selectedDateLeave = useMemo(() => {
    if (!selectedDate) return []
    return getLeaveForDay(selectedDate)
  }, [selectedDate, monthRequests])

  // Navigation
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  return (
    <div>
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: COLORS.champagne }}>
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <p className="text-sm mt-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            {monthRequests.length} leave request{monthRequests.length !== 1 ? 's' : ''} this month
          </p>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
            style={{ backgroundColor: `${COLORS.gold}20`, color: COLORS.gold }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToToday}
            className="px-4 h-10 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
            style={{ backgroundColor: `${COLORS.gold}20`, color: COLORS.gold }}
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
            style={{ backgroundColor: `${COLORS.gold}20`, color: COLORS.gold }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-xl" style={{ backgroundColor: COLORS.charcoal }}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: LEAVE_TYPE_COLORS.ANNUAL }} />
          <span className="text-xs" style={{ color: COLORS.champagne }}>
            Annual Leave
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: LEAVE_TYPE_COLORS.SICK }} />
          <span className="text-xs" style={{ color: COLORS.champagne }}>
            Sick Leave
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: LEAVE_TYPE_COLORS.UNPAID }} />
          <span className="text-xs" style={{ color: COLORS.champagne }}>
            Unpaid Leave
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: LEAVE_TYPE_COLORS.OTHER }} />
          <span className="text-xs" style={{ color: COLORS.champagne }}>
            Other
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <div
            className="rounded-xl p-4 md:p-6"
            style={{ backgroundColor: COLORS.charcoal }}
          >
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold py-2"
                  style={{ color: COLORS.gold }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Actual days */}
              {daysInMonth.map(day => {
                const leaveForDay = getLeaveForDay(day)
                const isToday = isSameDay(day, new Date())
                const isSelected = selectedDate && isSameDay(day, selectedDate)

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className="aspect-square rounded-lg p-1 transition-all duration-300 hover:scale-105 active:scale-95 relative"
                    style={{
                      backgroundColor: isSelected
                        ? `${COLORS.gold}40`
                        : isToday
                        ? `${COLORS.gold}20`
                        : leaveForDay.length > 0
                        ? `${COLORS.bronze}10`
                        : 'transparent',
                      border: isToday ? `2px solid ${COLORS.gold}` : '1px solid transparent'
                    }}
                  >
                    <div
                      className="text-sm font-medium"
                      style={{
                        color: isSelected || isToday ? COLORS.champagne : COLORS.bronze
                      }}
                    >
                      {format(day, 'd')}
                    </div>

                    {/* Leave indicators */}
                    {leaveForDay.length > 0 && (
                      <div className="flex gap-0.5 mt-1 justify-center">
                        {leaveForDay.slice(0, 3).map((leave, i) => (
                          <div
                            key={i}
                            className="w-1 h-1 rounded-full"
                            style={{
                              backgroundColor:
                                LEAVE_TYPE_COLORS[leave.leave_type as keyof typeof LEAVE_TYPE_COLORS]
                            }}
                          />
                        ))}
                        {leaveForDay.length > 3 && (
                          <div
                            className="w-1 h-1 rounded-full"
                            style={{ backgroundColor: COLORS.champagne }}
                          />
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="lg:col-span-1">
          <div
            className="rounded-xl p-4 md:p-6 sticky top-6"
            style={{ backgroundColor: COLORS.charcoal }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${COLORS.gold}20` }}
              >
                <CalendarIcon className="w-6 h-6" style={{ color: COLORS.gold }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: COLORS.champagne }}>
                  {selectedDate ? format(selectedDate, 'dd MMM yyyy') : 'Select a date'}
                </h3>
                <p className="text-xs" style={{ color: COLORS.bronze, opacity: 0.7 }}>
                  {selectedDateLeave.length} leave request
                  {selectedDateLeave.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Leave List */}
            {selectedDateLeave.length > 0 ? (
              <div className="space-y-3">
                {selectedDateLeave.map(leave => (
                  <div
                    key={leave.id}
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: `${COLORS.black}40`,
                      borderLeft: `4px solid ${
                        LEAVE_TYPE_COLORS[leave.leave_type as keyof typeof LEAVE_TYPE_COLORS]
                      }`
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${COLORS.gold}10` }}
                      >
                        <User className="w-4 h-4" style={{ color: COLORS.gold }} />
                      </div>
                      <div className="flex-1">
                        <div
                          className="text-sm font-medium"
                          style={{ color: COLORS.champagne }}
                        >
                          {leave.staff_name}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: COLORS.bronze, opacity: 0.7 }}
                        >
                          {leave.leave_type.charAt(0) + leave.leave_type.slice(1).toLowerCase()}{' '}
                          Leave
                        </div>
                      </div>
                    </div>
                    <div className="text-xs" style={{ color: COLORS.bronze }}>
                      {format(new Date(leave.start_date), 'dd MMM')} -{' '}
                      {format(new Date(leave.end_date), 'dd MMM')} ({leave.total_days}{' '}
                      {leave.total_days === 1 ? 'day' : 'days'})
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon
                  className="w-12 h-12 mx-auto mb-3"
                  style={{ color: COLORS.bronze, opacity: 0.3 }}
                />
                <p className="text-sm" style={{ color: COLORS.bronze, opacity: 0.7 }}>
                  {selectedDate
                    ? 'No leave requests for this date'
                    : 'Select a date to view leave requests'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
