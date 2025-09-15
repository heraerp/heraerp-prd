'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TeamsSidebar } from '@/components/ui/teams-sidebar'
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin } from 'lucide-react'

// Sample events data
const SAMPLE_EVENTS = [
  { id: 1, title: 'Team Meeting', time: '09:00', date: '2025-08-06', type: 'meeting' },
  { id: 2, title: 'Client Call', time: '14:00', date: '2025-08-06', type: 'call' },
  { id: 3, title: 'Project Review', time: '10:30', date: '2025-08-07', type: 'review' },
  { id: 4, title: 'Lunch Break', time: '12:00', date: '2025-08-07', type: 'break' }
]

function SimpleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1)
    } else {
      newDate.setMonth(currentDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    )
  }

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return SAMPLE_EVENTS.filter(event => event.date === dateStr)
  }

  const days = getDaysInMonth(currentDate)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <TeamsSidebar />
      <div className="ml-16 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">HERA Calendar</h1>
            </div>
            <p className="text-gray-600">Universal scheduling system for all businesses</p>
          </div>

          {/* Calendar */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Event
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {daysOfWeek.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  if (day === null) {
                    return <div key={index} className="h-24 p-1"></div>
                  }

                  const events = getEventsForDate(day)

                  return (
                    <div
                      key={day}
                      className={`h-24 p-1 border border-gray-200 cursor-pointer transition-colors ${
                        isToday(day)
                          ? 'bg-blue-100 border-blue-300'
                          : isSelected(day)
                            ? 'bg-blue-50 border-blue-200'
                            : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        const newSelected = new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth(),
                          day
                        )
                        setSelectedDate(newSelected)
                      }}
                    >
                      <div className="flex flex-col h-full">
                        <div
                          className={`text-sm font-medium ${
                            isToday(day) ? 'text-blue-600' : 'text-gray-900'
                          }`}
                        >
                          {day}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          {events.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className={`text-xs p-1 mb-1 rounded truncate ${
                                event.type === 'meeting'
                                  ? 'bg-blue-200 text-blue-800'
                                  : event.type === 'call'
                                    ? 'bg-green-200 text-green-800'
                                    : event.type === 'review'
                                      ? 'bg-purple-200 text-purple-800'
                                      : 'bg-gray-200 text-gray-800'
                              }`}
                            >
                              {event.time} {event.title}
                            </div>
                          ))}
                          {events.length > 2 && (
                            <div className="text-xs text-gray-500">+{events.length - 2} more</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Today's Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Today's Events</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {SAMPLE_EVENTS.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No events scheduled for today</p>
              ) : (
                <div className="space-y-3">
                  {SAMPLE_EVENTS.map(event => (
                    <div
                      key={event.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${
                          event.type === 'meeting'
                            ? 'bg-blue-500'
                            : event.type === 'call'
                              ? 'bg-green-500'
                              : event.type === 'review'
                                ? 'bg-purple-500'
                                : 'bg-gray-500'
                        }`}
                      ></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{event.title}</div>
                        <div className="text-sm text-gray-600 flex items-center space-x-2">
                          <Clock className="h-3 w-3" />
                          <span>{event.time}</span>
                          <MapPin className="h-3 w-3" />
                          <span>Conference Room A</span>
                        </div>
                      </div>
                      <Badge variant="outline">{event.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SimpleCalendar
