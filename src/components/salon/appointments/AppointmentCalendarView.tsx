'use client'

import React from 'react'
import { Calendar as CalendarIcon, Clock, User, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { cn } from '@/lib/utils'

interface Appointment {
  id: string
  customerName: string
  serviceName: string
  staffName: string
  appointmentDate: Date
  appointmentTime: string
  duration: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  price: number
  notes?: string
}

interface AppointmentCalendarViewProps {
  appointments: Appointment[]
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

export function AppointmentCalendarView({ appointments, selectedDate, onDateSelect }: AppointmentCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate)
  
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Group appointments by date
  const appointmentsByDate = appointments.reduce((acc, apt) => {
    const dateKey = format(apt.appointmentDate, 'yyyy-MM-dd')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(apt)
    return acc
  }, {} as Record<string, Appointment[]>)
  
  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }
  
  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }
  
  const handleToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    onDateSelect(today)
  }
  
  const getDayAppointments = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return appointmentsByDate[dateKey] || []
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'cancelled': return 'bg-red-500'
      case 'completed': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(31, 41, 55, 0.85) 0%, 
            rgba(17, 24, 39, 0.9) 100%
          )
        `,
        backdropFilter: 'blur(20px) saturate(120%)',
        WebkitBackdropFilter: 'blur(20px) saturate(120%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.5),
          0 4px 16px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.05)
        `
      }}
    >
      {/* Calendar Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold !text-gray-900 dark:!text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousMonth}
              className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/30 border-white/20 dark:border-gray-700/30"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/30 border-white/20 dark:border-gray-700/30"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/30 border-white/20 dark:border-gray-700/30"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center">
              <p className="text-sm font-medium !text-gray-600 dark:!text-gray-400">{day}</p>
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayAppointments = getDayAppointments(day)
            const isSelected = isSameDay(day, selectedDate)
            const isCurrentDay = isToday(day)
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateSelect(day)}
                className={cn(
                  "min-h-[120px] p-2 rounded-lg transition-all duration-200 relative overflow-hidden group",
                  "hover:scale-105",
                  isSelected 
                    ? "bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-2 border-purple-500/50" 
                    : "bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/30",
                  isCurrentDay && !isSelected && "ring-2 ring-blue-500/50"
                )}
                style={{
                  backdropFilter: 'blur(10px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(10px) saturate(120%)'
                }}
              >
                <div className="text-left">
                  <p className={cn(
                    "text-sm font-medium mb-1",
                    isCurrentDay ? "!text-blue-400" : "!text-gray-700 dark:!text-gray-300",
                    isSelected && "!text-purple-400"
                  )}>
                    {format(day, 'd')}
                  </p>
                  
                  {/* Appointment indicators */}
                  {dayAppointments.length > 0 && (
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((apt, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "text-xs px-1 py-0.5 rounded truncate",
                            getStatusColor(apt.status),
                            "bg-opacity-20 text-white"
                          )}
                        >
                          <span className="font-medium">{apt.appointmentTime}</span>
                          <span className="ml-1 opacity-80">{apt.customerName.split(' ')[0]}</span>
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <p className="text-xs !text-gray-500 dark:!text-gray-400">
                          +{dayAppointments.length - 3} more
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Appointment count badge */}
                {dayAppointments.length > 0 && (
                  <div className="absolute top-1 right-1">
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "h-5 w-5 p-0 flex items-center justify-center text-xs",
                        dayAppointments.some(apt => apt.status === 'pending') && "bg-yellow-500/20 text-yellow-300",
                        dayAppointments.every(apt => apt.status === 'confirmed') && "bg-green-500/20 text-green-300"
                      )}
                    >
                      {dayAppointments.length}
                    </Badge>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected day appointments */}
        <div className="mt-6 pt-6 border-t border-gray-800">
          <h3 className="text-lg font-semibold !text-gray-900 dark:!text-white mb-4">
            Appointments on {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          
          {getDayAppointments(selectedDate).length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="!text-gray-600 dark:!text-gray-400">No appointments scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {getDayAppointments(selectedDate)
                .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
                .map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
                  style={{
                    backdropFilter: 'blur(10px) saturate(120%)',
                    WebkitBackdropFilter: 'blur(10px) saturate(120%)'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="font-medium !text-gray-900 dark:!text-white">
                          {apt.appointmentTime}
                        </span>
                        <span className="text-sm !text-gray-600 dark:!text-gray-400">
                          ({apt.duration} min)
                        </span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            apt.status === 'confirmed' && "border-green-500 text-green-400",
                            apt.status === 'pending' && "border-yellow-500 text-yellow-400",
                            apt.status === 'cancelled' && "border-red-500 text-red-400",
                            apt.status === 'completed' && "border-blue-500 text-blue-400"
                          )}
                        >
                          {apt.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          <span className="!text-gray-700 dark:!text-gray-300">{apt.customerName}</span>
                        </div>
                        <div className="!text-gray-700 dark:!text-gray-300">{apt.serviceName}</div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                          <span className="!text-gray-700 dark:!text-gray-300">AED {apt.price}</span>
                        </div>
                      </div>
                      
                      {apt.notes && (
                        <p className="text-sm !text-gray-600 dark:!text-gray-400 mt-2">
                          Note: {apt.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}