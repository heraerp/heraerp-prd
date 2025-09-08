'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, getDay, addMonths, subMonths } from 'date-fns'

interface LeaveEvent {
  id: string
  employeeName: string
  employeeInitials: string
  leaveType: 'annual' | 'sick' | 'unpaid' | 'other'
  startDate: Date
  endDate: Date
  isPartial?: boolean
  department: string
}

interface LeaveCalendarProps {
  organizationId?: string
}

export function LeaveCalendar({ organizationId }: LeaveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Mock data - will be replaced with universal API calls
  const leaveEvents: LeaveEvent[] = [
    {
      id: '1',
      employeeName: 'Emma Wilson',
      employeeInitials: 'EW',
      leaveType: 'annual',
      startDate: new Date('2025-09-08'),
      endDate: new Date('2025-09-09'),
      department: 'Styling'
    },
    {
      id: '2',
      employeeName: 'James Taylor',
      employeeInitials: 'JT',
      leaveType: 'sick',
      startDate: new Date('2025-09-08'),
      endDate: new Date('2025-09-08'),
      department: 'Front Desk'
    },
    {
      id: '3',
      employeeName: 'Lisa Park',
      employeeInitials: 'LP',
      leaveType: 'annual',
      startDate: new Date('2025-09-12'),
      endDate: new Date('2025-09-14'),
      department: 'Nail Services'
    },
    {
      id: '4',
      employeeName: 'Sarah Johnson',
      employeeInitials: 'SJ',
      leaveType: 'annual',
      startDate: new Date('2025-09-15'),
      endDate: new Date('2025-09-17'),
      department: 'Styling'
    }
  ]

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Add padding days to start on Sunday
  const startPadding = getDay(monthStart)
  const paddingDays = Array.from({ length: startPadding }, (_, i) => 
    new Date(monthStart.getTime() - (startPadding - i) * 24 * 60 * 60 * 1000)
  )
  
  const allDays = [...paddingDays, ...monthDays]
  
  const getEventsForDay = (date: Date) => {
    return leaveEvents.filter(event => {
      const eventStart = new Date(event.startDate)
      const eventEnd = new Date(event.endDate)
      return date >= eventStart && date <= eventEnd
    })
  }

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'annual':
        return 'bg-blue-500 border-blue-600'
      case 'sick':
        return 'bg-emerald-500 border-emerald-600'
      case 'unpaid':
        return 'bg-gray-500 border-gray-600'
      default:
        return 'bg-purple-500 border-purple-600'
    }
  }

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  return (
    <div className="p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border-white/20 dark:border-gray-700/30"
          >
            Today
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousMonth}
            className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border-white/20 dark:border-gray-700/30"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border-white/20 dark:border-gray-700/30"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-blue-500 border border-blue-600" />
          <span className="text-gray-600 dark:text-gray-400">Annual Leave</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-emerald-500 border border-emerald-600" />
          <span className="text-gray-600 dark:text-gray-400">Sick Leave</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-gray-500 border border-gray-600" />
          <span className="text-gray-600 dark:text-gray-400">Unpaid Leave</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="bg-gray-50 dark:bg-gray-800 p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {allDays.map((day, index) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isCurrentDay = isToday(day)
          
          return (
            <div
              key={index}
              className={`bg-white dark:bg-gray-900 p-2 min-h-[100px] ${
                !isCurrentMonth ? 'opacity-50' : ''
              } ${
                isCurrentDay ? 'ring-2 ring-inset ring-indigo-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium ${
                  isCurrentDay 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {dayEvents.length}
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={`px-1.5 py-0.5 text-xs rounded text-white font-medium ${getLeaveTypeColor(
                      event.leaveType
                    )} cursor-pointer hover:opacity-90 transition-opacity`}
                    title={`${event.employeeName} - ${event.department}`}
                  >
                    {event.employeeInitials}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
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