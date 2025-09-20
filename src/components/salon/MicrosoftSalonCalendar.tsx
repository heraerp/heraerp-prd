'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import '@/styles/microsoft-calendar.css'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Users,
  Clock,
  Video,
  Phone,
  MapPin,
  Star,
  Sparkles,
  Grid3x3,
  List,
  CalendarDays,
  User,
  Crown,
  Zap,
  Scissors,
  Palette,
  ChevronDown,
  MoreVertical,
  Bell,
  Settings,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookAppointmentModal } from '@/components/salon/BookAppointmentModal'

interface MicrosoftSalonCalendarProps {
  className?: string
  onNewBooking?: () => void
}

interface TimeSlot {
  time: string
  displayTime: string
  appointments: any[]
}

const BUSINESS_HOURS = {
  start: 9,
  end: 21,
  slotDuration: 30 // minutes
}

export function MicrosoftSalonCalendar({ className, onNewBooking }: MicrosoftSalonCalendarProps) {
  const { organization } = useHERAAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedView, setSelectedView] = useState<'day' | 'week' | 'month'>('week')
  const [selectedStylist, setSelectedStylist] = useState<string>('all')
  const [showSidebar, setShowSidebar] = useState(true)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [bookingSlot, setBookingSlot] = useState<{ date: Date; time: string } | null>(null)

  // Sample stylists with Microsoft-style avatars
  const stylists = [
    {
      id: 'rocky',
      name: 'Rocky',
      title: 'Celebrity Hair Artist',
      avatar: 'R',
      color: 'bg-purple-600',
      available: true,
      status: 'available'
    },
    {
      id: 'vinay',
      name: 'Vinay',
      title: 'Senior Stylist',
      avatar: 'V',
      color: 'bg-blue-600',
      available: true,
      status: 'busy'
    },
    {
      id: 'maya',
      name: 'Maya',
      title: 'Color Specialist',
      avatar: 'M',
      color: 'bg-pink-600',
      available: false,
      status: 'away'
    },
    {
      id: 'sophia',
      name: 'Sophia',
      title: 'Bridal Specialist',
      avatar: 'S',
      color: 'bg-amber-600',
      available: true,
      status: 'available'
    }
  ]

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = []
    const totalMinutes = (BUSINESS_HOURS.end - BUSINESS_HOURS.start) * 60
    const numberOfSlots = totalMinutes / BUSINESS_HOURS.slotDuration

    for (let i = 0; i < numberOfSlots; i++) {
      const hour = BUSINESS_HOURS.start + Math.floor((i * BUSINESS_HOURS.slotDuration) / 60)
      const minute = (i * BUSINESS_HOURS.slotDuration) % 60
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const displayTime = new Date(2024, 0, 1, hour, minute).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })

      slots.push({ time, displayTime, appointments: [] })
    }

    return slots
  }, [])

  // Sample appointments with Microsoft-style data
  const appointments = [
    {
      id: '1',
      title: 'Brazilian Blowout',
      client: 'Sarah Johnson',
      stylist: 'rocky',
      time: '10:00',
      duration: 240, // minutes
      service: 'brazilian',
      status: 'confirmed',
      price: 'AED 500',
      color: '#8B5CF6',
      icon: <Zap className="w-3 h-3" />
    },
    {
      id: '2',
      title: 'Premium Cut & Style',
      client: 'Emma Davis',
      stylist: 'vinay',
      time: '14:30',
      duration: 90,
      service: 'cut',
      status: 'confirmed',
      price: 'AED 150',
      color: '#3B82F6',
      icon: <Scissors className="w-3 h-3" />
    },
    {
      id: '3',
      title: 'Hair Color & Highlights',
      client: 'Aisha Khan',
      stylist: 'maya',
      time: '15:00',
      duration: 180,
      service: 'color',
      status: 'tentative',
      price: 'AED 280',
      color: '#EC4899',
      icon: <Palette className="w-3 h-3" />
    }
  ]

  // Get current week dates
  const getWeekDates = () => {
    const dates = []
    const startOfWeek = new Date(selectedDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates()

  // Format date for display
  const formatDateHeader = (date: Date) => {
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
    const dayNumber = date.getDate()

    return { dayName, dayNumber, isToday }
  }

  return (
    <div
      className={cn(
        'flex h-[800px] bg-background dark:bg-background rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 border-r border-border dark:border-border bg-muted dark:bg-muted/50 flex flex-col calendar-sidebar">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border dark:border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-100 dark:text-foreground">Calendar</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(false)}
                className="text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Mini Calendar */}
            <div className="bg-background dark:bg-muted rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-100 dark:text-foreground">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              {/* Mini calendar grid would go here */}
              <div className="text-xs text-muted-foreground dark:text-muted-foreground text-center py-4">
                Mini calendar view
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h4 className="text-sm font-semibold text-gray-100 dark:text-foreground mb-3">
                Team Members
              </h4>
              <div className="space-y-2">
                {stylists.map(stylist => (
                  <div
                    key={stylist.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all sidebar-item',
                      selectedStylist === stylist.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                        : 'hover:bg-muted dark:hover:bg-muted-foreground/10'
                    )}
                    onClick={() => setSelectedStylist(stylist.id)}
                  >
                    <div className="relative">
                      <Avatar className={cn('h-10 w-10', stylist.color)}>
                        <AvatarFallback className="text-foreground font-semibold">
                          {stylist.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800',
                          stylist.status === 'available'
                            ? 'bg-green-500'
                            : stylist.status === 'busy'
                              ? 'bg-red-500'
                              : 'bg-gray-400'
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-100 dark:text-foreground">
                        {stylist.name}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">{stylist.title}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs',
                        stylist.available
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-muted text-muted-foreground dark:bg-muted-foreground/10 dark:text-gray-300'
                      )}
                    >
                      {stylist.available ? 'Available' : 'Away'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="p-4 border-t border-border dark:border-border">
              <h4 className="text-sm font-semibold text-gray-100 dark:text-foreground mb-3">
                Today's Appointments
              </h4>
              <div className="space-y-2">
                {appointments.slice(0, 3).map(apt => (
                  <div
                    key={apt.id}
                    className="p-3 bg-background dark:bg-muted rounded-lg border border-border dark:border-border"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-1 h-full rounded-full self-stretch"
                        style={{ backgroundColor: apt.color }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-100 dark:text-foreground">
                          {apt.title}
                        </p>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground">{apt.client}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground dark:text-gray-300">
                            {apt.time}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground dark:text-gray-300">
                            {apt.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border dark:border-border">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-foreground"
              onClick={() => {
                setBookingSlot(null)
                setIsBookingOpen(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>
      )}

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col">
        {/* Calendar Header */}
        <div className="p-4 border-b border-border dark:border-border bg-background dark:bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!showSidebar && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(true)}
                  className="text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-gray-200"
                >
                  <Grid3x3 className="w-5 h-5" />
                </Button>
              )}

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-muted-foreground dark:text-gray-300">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  className="text-sm font-medium min-w-[120px] text-gray-700 dark:text-gray-200"
                >
                  Today
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground dark:text-gray-300">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              <h2 className="text-xl font-semibold text-gray-100 dark:text-foreground">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <Tabs value={selectedView} onValueChange={v => setSelectedView(v as any)}>
                <TabsList className="bg-muted dark:bg-muted">
                  <TabsTrigger value="day" className="text-sm">
                    Day
                  </TabsTrigger>
                  <TabsTrigger value="week" className="text-sm">
                    Week
                  </TabsTrigger>
                  <TabsTrigger value="month" className="text-sm">
                    Month
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-muted-foreground dark:text-gray-300">
                  <Search className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground dark:text-gray-300">
                  <Filter className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground dark:text-gray-300">
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Time Column */}
            <div className="w-20 border-r border-border dark:border-border bg-muted dark:bg-muted/30">
              <div className="h-14 border-b border-border dark:border-border" />
              <ScrollArea className="h-[calc(100%-3.5rem)] calendar-scrollbar">
                {timeSlots.map((slot, idx) => (
                  <div
                    key={slot.time}
                    className="h-16 border-b border-gray-100 dark:border-gray-800 px-2 py-1"
                  >
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {slot.displayTime}
                    </span>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Days Grid */}
            <div className="flex-1 flex">
              <ScrollArea className="w-full calendar-scrollbar">
                <div className="flex">
                  {weekDates.map((date, dayIdx) => {
                    const { dayName, dayNumber, isToday } = formatDateHeader(date)

                    return (
                      <div
                        key={dayIdx}
                        className="flex-1 min-w-[140px] border-r border-border dark:border-border last:border-r-0"
                      >
                        {/* Day Header */}
                        <div
                          className={cn(
                            'h-14 border-b border-border dark:border-border px-2 py-2 text-center day-header',
                            isToday && 'today'
                          )}
                        >
                          <p
                            className={cn(
                              'text-xs font-bold uppercase tracking-wider',
                              isToday
                                ? 'text-primary dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-300'
                            )}
                          >
                            {dayName}
                          </p>
                          <p
                            className={cn(
                              'text-xl font-extrabold',
                              isToday
                                ? 'text-primary dark:text-blue-400'
                                : 'text-gray-100 dark:text-foreground'
                            )}
                          >
                            {dayNumber}
                          </p>
                        </div>

                        {/* Time Slots */}
                        <div>
                          {timeSlots.map((slot, slotIdx) => {
                            // Find appointments for this slot
                            const slotAppointments = appointments.filter(
                              apt =>
                                apt.time === slot.time &&
                                (selectedStylist === 'all' || apt.stylist === selectedStylist)
                            )

                            return (
                              <div
                                key={`${dayIdx}-${slotIdx}`}
                                className={cn(
                                  'h-16 border-b border-gray-100 dark:border-gray-800 relative group time-slot',
                                  'hover:bg-muted dark:hover:bg-muted/50 cursor-pointer'
                                )}
                                onClick={() => {
                                  if (!slotAppointments.length) {
                                    setBookingSlot({ date: date, time: slot.time })
                                    setIsBookingOpen(true)
                                  }
                                }}
                              >
                                {/* Current time indicator */}
                                {isToday && slotIdx === 8 && (
                                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 z-10">
                                    <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
                                  </div>
                                )}

                                {/* Appointments */}
                                {slotAppointments.map((apt, aptIdx) => {
                                  const durationSlots = Math.ceil(
                                    apt.duration / BUSINESS_HOURS.slotDuration
                                  )
                                  const stylistInfo = stylists.find(s => s.id === apt.stylist)

                                  return (
                                    <div
                                      key={apt.id}
                                      className={cn(
                                        'absolute inset-x-1 top-1 mx-1 rounded-md p-2 cursor-pointer appointment-card',
                                        'transform transition-all hover:scale-[1.02] hover:shadow-md',
                                        'border-l-4',
                                        `appointment-${apt.service}`
                                      )}
                                      style={{
                                        backgroundColor: `${apt.color}15`,
                                        borderLeftColor: apt.color,
                                        height: `${durationSlots * 64 - 8}px`,
                                        zIndex: 5 + aptIdx
                                      }}
                                    >
                                      <div className="flex items-start gap-2">
                                        <div
                                          className="w-6 h-6 rounded-full flex items-center justify-center text-foreground text-xs font-bold flex-shrink-0"
                                          style={{ backgroundColor: apt.color }}
                                        >
                                          {apt.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-semibold text-gray-100 dark:text-foreground truncate">
                                            {apt.title}
                                          </p>
                                          <p className="text-xs text-muted-foreground dark:text-gray-300 truncate">
                                            {apt.client}
                                          </p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <Badge
                                              variant="secondary"
                                              className="text-xs px-1 py-0"
                                              style={{
                                                backgroundColor: `${apt.color}20`,
                                                color: apt.color,
                                                borderColor: apt.color
                                              }}
                                            >
                                              {apt.price}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                                              {stylistInfo?.name}
                                            </span>
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <MoreVertical className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  )
                                })}

                                {/* Add appointment hint */}
                                {!slotAppointments.length && (
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>

      {/* Book Appointment Modal */}
      <BookAppointmentModal
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false)
          setBookingSlot(null)
        }}
        onBookingComplete={booking => {
          console.log('Booking completed:', booking)
          setIsBookingOpen(false)
          setBookingSlot(null)
          onNewBooking?.()
        }}
        preSelectedDate={bookingSlot?.date}
        preSelectedTime={bookingSlot?.time}
        preSelectedStylist={selectedStylist !== 'all' ? selectedStylist : undefined}
      />
    </div>
  )
}
