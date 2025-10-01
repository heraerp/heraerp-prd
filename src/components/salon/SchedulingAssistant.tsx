'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Calendar,
  CalendarX,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Star,
  Timer,
  User,
  MapPin,
  Sparkles,
  RefreshCw,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, addMinutesSafe } from '@/lib/date-utils'
import { addDays, startOfWeek, endOfWeek, isWithinInterval, parseISO, isSameDay } from 'date-fns'

interface Service {
  id: string
  entity_name: string
  duration: number
  buffer_before: number
  buffer_after: number
}

interface TimeSlot {
  start: string
  end: string
  confidence: number
  score?: number
  reasons?: string[]
}

interface BusyBlock {
  start: string
  end: string
  reason: string
  source_transaction_id?: string
}

interface WorkingHours {
  dow: number // 0-6, where 0 is Sunday
  start: string
  end: string
  tz: string
}

interface SchedulingAssistantProps {
  organizationId: string
  stylistId: string
  services: Service[]
  selectedDate?: Date
  resourceId?: string
  onSlotSelect: (slot: TimeSlot) => void
  compact?: boolean
  preSelectedTime?: string
}

export function SchedulingAssistant({
  organizationId,
  stylistId,
  services,
  selectedDate = new Date(),
  resourceId,
  onSlotSelect,
  compact = false,
  preSelectedTime
}: SchedulingAssistantProps) {
  const [loading, setLoading] = useState(true)
  const [suggestedSlots, setSuggestedSlots] = useState<TimeSlot[]>([])
  const [busyBlocks, setBusyBlocks] = useState<BusyBlock[]>([])
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([])
  const [viewDate, setViewDate] = useState(selectedDate)
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [timelineZoom, setTimelineZoom] = useState<'normal' | 'detailed'>('normal')
  const [currentTime, setCurrentTime] = useState(new Date())

  // Calculate total duration including buffers
  const totalDuration = services.reduce(
    (sum, service) => sum + service.duration + service.buffer_before + service.buffer_after,
    0
  )

  // Fetch availability data
  const fetchAvailability = useCallback(async () => {
    setLoading(true)
    try {
      // Calculate window based on view mode
      const windowStart =
        viewMode === 'week' ? startOfWeek(viewDate, { weekStartsOn: 0 }) : viewDate
      const windowEnd =
        viewMode === 'week' ? endOfWeek(viewDate, { weekStartsOn: 0 }) : addDays(viewDate, 1)

      // In real implementation, call API
      // const response = await fetch('/api/availability', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     organization_id: organizationId,
      //     smart_code: 'HERA.SALON.CALENDAR.AVAILABILITY.V1',
      //     stylist_id: stylistId,
      //     resource_id: resourceId,
      //     services: services.map(s => ({ service_id: s.id, quantity: 1 })),
      //     window_start: windowStart.toISOString(),
      //     window_end: windowEnd.toISOString(),
      //     preferences: {
      //       earliest_first: true,
      //       slot_granularity_minutes: 15
      //     }
      //   })
      // })

      // Mock data for demo
      const mockWorkingHours: WorkingHours[] = [
        { dow: 0, start: '10:00', end: '20:00', tz: 'Asia/Dubai' }, // Sunday
        { dow: 1, start: '09:00', end: '21:00', tz: 'Asia/Dubai' }, // Monday
        { dow: 2, start: '09:00', end: '21:00', tz: 'Asia/Dubai' }, // Tuesday
        { dow: 3, start: '09:00', end: '21:00', tz: 'Asia/Dubai' }, // Wednesday
        { dow: 4, start: '09:00', end: '21:00', tz: 'Asia/Dubai' }, // Thursday
        { dow: 5, start: '09:00', end: '13:00', tz: 'Asia/Dubai' }, // Friday (half day)
        { dow: 6, start: '10:00', end: '21:00', tz: 'Asia/Dubai' } // Saturday
      ]

      const mockBusyBlocks: BusyBlock[] = [
        {
          start: `${formatDate(viewDate, 'yyyy-MM-dd')}T10:00:00Z`,
          end: `${formatDate(viewDate, 'yyyy-MM-dd')}T12:00:00Z`,
          reason: 'existing_appointment',
          source_transaction_id: 'apt-123'
        },
        {
          start: `${formatDate(viewDate, 'yyyy-MM-dd')}T14:30:00Z`,
          end: `${formatDate(viewDate, 'yyyy-MM-dd')}T16:00:00Z`,
          reason: 'existing_appointment',
          source_transaction_id: 'apt-124'
        },
        {
          start: `${formatDate(viewDate, 'yyyy-MM-dd')}T12:30:00Z`,
          end: `${formatDate(viewDate, 'yyyy-MM-dd')}T13:00:00Z`,
          reason: 'prayer_time'
        }
      ]

      // Generate suggested slots
      const slots: TimeSlot[] = []
      const dayOfWeek = viewDate.getDay()
      const dayHours = mockWorkingHours.find(wh => wh.dow === dayOfWeek)

      if (dayHours) {
        const [startHour, startMin] = dayHours.start.split(':').map(Number)
        const [endHour, endMin] = dayHours.end.split(':').map(Number)

        let currentTime = new Date(viewDate)
        currentTime.setHours(startHour, startMin, 0, 0)

        const endTime = new Date(viewDate)
        endTime.setHours(endHour, endMin, 0, 0)

        // Generate slots every 15 minutes
        while (currentTime < endTime) {
          const slotEnd = addMinutesSafe(currentTime, totalDuration)

          // Check if slot fits within working hours
          if (slotEnd <= endTime) {
            // Check for conflicts with busy blocks
            const hasConflict = mockBusyBlocks.some(block => {
              const blockStart = parseISO(block.start)
              const blockEnd = parseISO(block.end)
              const slotStart = currentTime

              return (
                isWithinInterval(slotStart, { start: blockStart, end: blockEnd }) ||
                isWithinInterval(slotEnd, { start: blockStart, end: blockEnd }) ||
                isWithinInterval(blockStart, { start: slotStart, end: slotEnd })
              )
            })

            if (!hasConflict) {
              // Calculate confidence/score based on various factors
              let confidence = 0.9
              const reasons: string[] = []

              // Prefer morning slots
              if (currentTime.getHours() < 12) {
                confidence += 0.05
                reasons.push('Morning slot preferred')
              }

              // Avoid slots right after prayer time
              const afterPrayer = mockBusyBlocks.find(
                b =>
                  b.reason === 'prayer_time' &&
                  Math.abs(currentTime.getTime() - parseISO(b.end).getTime()) < 30 * 60 * 1000
              )
              if (afterPrayer) {
                confidence -= 0.1
                reasons.push('Close to prayer time')
              }

              // Check if it's the next available slot
              if (slots.length === 0) {
                confidence += 0.08
                reasons.push('Next available')
              }

              slots.push({
                start: currentTime.toISOString(),
                end: slotEnd.toISOString(),
                confidence: Math.min(confidence, 1),
                score: confidence,
                reasons
              })
            }
          }

          currentTime = addMinutesSafe(currentTime, 15)
        }
      }

      // Sort by score/confidence
      slots.sort((a, b) => (b.score || b.confidence) - (a.score || a.confidence))

      setWorkingHours(mockWorkingHours)
      setBusyBlocks(mockBusyBlocks)
      setSuggestedSlots(slots.slice(0, 10)) // Top 10 suggestions
    } catch (error) {
      console.error('Failed to fetch availability:', error)
    } finally {
      setLoading(false)
    }
  }, [organizationId, stylistId, services, resourceId, viewDate, viewMode, totalDuration])

  useEffect(() => {
    fetchAvailability()
  }, [fetchAvailability])

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  // Handle slot selection
  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    onSlotSelect(slot)
  }

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const days = viewMode === 'week' ? 7 : 1
    setViewDate(prev => (direction === 'next' ? addDays(prev, days) : addDays(prev, -days)))
  }

  // Render timeline view
  const renderTimeline = () => {
    const dayHours = workingHours.find(wh => wh.dow === viewDate.getDay())
    if (!dayHours) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Salon closed on this day</p>
        </div>
      )
    }

    const [startHour, startMin] = dayHours.start.split(':').map(Number)
    const [endHour, endMin] = dayHours.end.split(':').map(Number)
    const hours = []

    for (let h = startHour; h <= endHour; h++) {
      hours.push(h)
    }

    const pixelsPerHour = timelineZoom === 'detailed' ? 120 : 64
    const showHalfHours = timelineZoom === 'detailed'

    return (
      <div className="relative bg-background dark:bg-muted rounded-lg">
        {/* Hour labels */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-muted dark:bg-background rounded-l-lg">
          {hours.map((hour, idx) => (
            <div key={hour}>
              <div
                className="border-t border-border dark:border-border text-sm ink dark:text-gray-300 font-medium pt-1 pr-2 text-right"
                style={{ height: `${pixelsPerHour}px` }}
              >
                {formatDate(new Date().setHours(hour, 0), 'h:mm a')}
              </div>
              {showHalfHours && idx < hours.length - 1 && (
                <div
                  className="text-xs text-muted-foreground dark:text-muted-foreground pr-2 text-right"
                  style={{ height: `${pixelsPerHour / 2}px`, marginTop: `-${pixelsPerHour / 2}px` }}
                >
                  {formatDate(new Date().setHours(hour, 30), 'h:mm')}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="ml-20 relative">
          {hours.map((hour, idx) => (
            <div key={hour}>
              <div
                className="border-t-2 border-border dark:border-border"
                style={{ height: `${pixelsPerHour}px` }}
              >
                {/* Half-hour line */}
                {showHalfHours && (
                  <div
                    className="border-t border-gray-100 dark:border-gray-800 border-dashed"
                    style={{ marginTop: `${pixelsPerHour / 2}px` }}
                  />
                )}

                {/* Quarter-hour lines for detailed view */}
                {timelineZoom === 'detailed' && (
                  <>
                    <div
                      className="border-t border-gray-50 dark:border-gray-850 border-dotted"
                      style={{ marginTop: `${pixelsPerHour / 4 - 1}px` }}
                    />
                    <div
                      className="border-t border-gray-50 dark:border-gray-850 border-dotted"
                      style={{ marginTop: `${pixelsPerHour / 2 - 1}px` }}
                    />
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Current time indicator */}
          {isSameDay(currentTime, viewDate) && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{
                top: `${((currentTime.getHours() * 60 + currentTime.getMinutes() - startHour * 60) / 60) * pixelsPerHour}px`
              }}
            >
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <div className="flex-1 h-0.5 bg-red-500" />
                <span className="text-xs text-red-500 font-medium px-2 bg-background dark:bg-background">
                  {formatDate(currentTime, 'h:mm a')}
                </span>
              </div>
            </div>
          )}

          {/* Busy blocks */}
          {busyBlocks.map((block, idx) => {
            const blockStart = parseISO(block.start)
            const blockEnd = parseISO(block.end)

            if (!isSameDay(blockStart, viewDate)) return null

            const startMinutes =
              blockStart.getHours() * 60 + blockStart.getMinutes() - startHour * 60
            const durationMinutes = (blockEnd.getTime() - blockStart.getTime()) / (60 * 1000)
            const top = (startMinutes / 60) * pixelsPerHour
            const height = (durationMinutes / 60) * pixelsPerHour

            return (
              <div
                key={idx}
                className={cn(
                  'absolute left-0 right-0 rounded-md p-2 text-xs shadow-sm',
                  block.reason === 'existing_appointment' &&
                    'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700',
                  block.reason === 'prayer_time' &&
                    'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700'
                )}
                style={{ top: `${top}px`, height: `${height}px` }}
              >
                <p className="font-medium">
                  {block.reason === 'existing_appointment' ? 'Busy' : 'Prayer Time'}
                </p>
                {timelineZoom === 'detailed' && (
                  <p className="text-muted-foreground dark:text-muted-foreground">
                    {formatDate(blockStart, 'h:mm a')} - {formatDate(blockEnd, 'h:mm a')}
                  </p>
                )}
              </div>
            )
          })}

          {/* Suggested slots */}
          {suggestedSlots.map((slot, idx) => {
            const slotStart = parseISO(slot.start)
            const slotEnd = parseISO(slot.end)

            if (!isSameDay(slotStart, viewDate)) return null

            const startMinutes = slotStart.getHours() * 60 + slotStart.getMinutes() - startHour * 60
            const durationMinutes = (slotEnd.getTime() - slotStart.getTime()) / (60 * 1000)
            const top = (startMinutes / 60) * pixelsPerHour
            const height = (durationMinutes / 60) * pixelsPerHour

            // Don't show slots in the past
            if (isSameDay(viewDate, new Date()) && slotStart < currentTime) return null

            return (
              <div
                key={idx}
                className={cn(
                  'absolute left-0 right-0 rounded-md p-2 text-xs cursor-pointer transition-all shadow-sm',
                  selectedSlot?.start === slot.start
                    ? 'bg-purple-200 dark:bg-purple-800 border-2 border-purple-500 shadow-md'
                    : preSelectedTime && formatDate(slotStart, 'HH:mm') === preSelectedTime
                      ? 'bg-blue-200 dark:bg-blue-800 border-2 border-blue-500 shadow-md animate-pulse'
                      : 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800/30 hover:shadow-md'
                )}
                style={{ top: `${top}px`, height: `${height}px` }}
                onClick={() => handleSlotSelect(slot)}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {preSelectedTime && formatDate(slotStart, 'HH:mm') === preSelectedTime
                      ? '🎯 Requested Time'
                      : idx === 0
                        ? '⭐ Available'
                        : 'Available'}
                  </p>
                  {timelineZoom === 'detailed' && (
                    <Badge variant="outline" className="text-xs">
                      {Math.round(slot.confidence * 100)}%
                    </Badge>
                  )}
                </div>
                {timelineZoom === 'detailed' && (
                  <p className="text-muted-foreground dark:text-muted-foreground mt-1">
                    {formatDate(slotStart, 'h:mm a')} - {formatDate(slotEnd, 'h:mm a')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="h-full flex flex-col">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <p className="text-sm font-medium">{formatDate(viewDate, 'MMM d, yyyy')}</p>
            <Button variant="ghost" size="sm" onClick={() => navigateDate('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchAvailability}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Compact Suggestions */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : suggestedSlots.length > 0 ? (
            <div className="space-y-2">
              {suggestedSlots.slice(0, 5).map((slot, idx) => (
                <Card
                  key={idx}
                  className={cn(
                    'cursor-pointer transition-all',
                    selectedSlot?.start === slot.start
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : preSelectedTime &&
                          formatDate(parseISO(slot.start), 'HH:mm') === preSelectedTime
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 animate-pulse'
                        : 'hover:border-border'
                  )}
                  onClick={() => handleSlotSelect(slot)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {formatDate(parseISO(slot.start), 'h:mm a')} -{' '}
                          {formatDate(parseISO(slot.end), 'h:mm a')}
                        </p>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                          {formatDate(parseISO(slot.start), 'EEEE, MMM d')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {Math.round(slot.confidence * 100)}%
                        </Badge>
                        {preSelectedTime &&
                        formatDate(parseISO(slot.start), 'HH:mm') === preSelectedTime ? (
                          <p className="text-xs text-primary mt-1">Requested time</p>
                        ) : (
                          idx === 0 && <p className="text-xs text-green-600 mt-1">Next available</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarX className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                No available slots today
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Scheduling Assistant
        </h3>

        {/* Pre-selected time indicator */}
        {preSelectedTime && (
          <Alert className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <Clock className="h-4 w-4 text-primary" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Looking for availability around:</strong> {preSelectedTime} on{' '}
              {formatDate(selectedDate, 'MMM d, yyyy')}
            </AlertDescription>
          </Alert>
        )}

        {/* View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTimelineZoom(timelineZoom === 'normal' ? 'detailed' : 'normal')}
              title={timelineZoom === 'normal' ? 'Zoom in' : 'Zoom out'}
            >
              {timelineZoom === 'normal' ? (
                <ZoomIn className="w-4 h-4" />
              ) : (
                <ZoomOut className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <p className="text-sm font-medium min-w-[150px] text-center">
              {viewMode === 'week'
                ? `${formatDate(startOfWeek(viewDate), 'MMM d')} - ${formatDate(endOfWeek(viewDate), 'MMM d, yyyy')}`
                : formatDate(viewDate, 'EEEE, MMM d, yyyy')}
            </p>
            <Button variant="ghost" size="sm" onClick={() => navigateDate('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>

            {isSameDay(viewDate, new Date()) && (
              <Badge variant="secondary" className="text-xs">
                Today
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isSameDay(viewDate, new Date()) && (
              <Button variant="outline" size="sm" onClick={() => setViewDate(new Date())}>
                <Clock className="w-4 h-4 mr-2" />
                Today
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={fetchAvailability}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline View */}
        <Card className="lg:col-span-2 bg-background dark:bg-muted border-border dark:border-border">
          <CardHeader className="border-b border-border dark:border-border">
            <CardTitle className="text-sm flex items-center gap-2 text-gray-100 dark:text-foreground">
              <Clock className="w-4 h-4 text-primary" />
              Timeline View
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className={timelineZoom === 'detailed' ? 'h-[600px]' : 'h-[400px]'}>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                renderTimeline()
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Suggestions Panel */}
        <Card className="bg-background dark:bg-muted border-border dark:border-border">
          <CardHeader className="border-b border-border dark:border-border">
            <CardTitle className="text-sm flex items-center gap-2 text-gray-100 dark:text-foreground">
              <Star className="w-4 h-4 text-primary" />
              Top Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className={timelineZoom === 'detailed' ? 'h-[600px]' : 'h-[400px]'}>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : suggestedSlots.length > 0 ? (
                <div className="space-y-3">
                  {suggestedSlots.map((slot, idx) => (
                    <Card
                      key={idx}
                      className={cn(
                        'cursor-pointer transition-all bg-background dark:bg-muted-foreground/10',
                        selectedSlot?.start === slot.start
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : preSelectedTime &&
                              formatDate(parseISO(slot.start), 'HH:mm') === preSelectedTime
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 animate-pulse'
                            : 'hover:border-gray-400 dark:hover:border-gray-500'
                      )}
                      onClick={() => handleSlotSelect(slot)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-100 dark:text-foreground">
                              {formatDate(parseISO(slot.start), 'h:mm a')} -{' '}
                              {formatDate(parseISO(slot.end), 'h:mm a')}
                            </p>
                            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                              {formatDate(parseISO(slot.start), 'EEEE, MMM d')}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              slot.confidence >= 0.9 && 'border-green-500 text-green-700',
                              slot.confidence >= 0.7 &&
                                slot.confidence < 0.9 &&
                                'border-blue-500 text-blue-700',
                              slot.confidence < 0.7 && 'border-yellow-500 text-yellow-700'
                            )}
                          >
                            {Math.round(slot.confidence * 100)}%
                          </Badge>
                        </div>

                        {/* Reasons */}
                        {slot.reasons && slot.reasons.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {slot.reasons.map((reason, ridx) => (
                              <Badge key={ridx} variant="secondary" className="text-xs">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Special badges */}
                        {idx === 0 && (
                          <Badge className="mt-2 bg-green-100 text-green-800 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Next Available
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarX className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-4">
                    No available slots found
                  </p>
                  <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                    Try Next Day
                  </Button>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 rounded" />
          <span className="text-muted-foreground dark:text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 border border-red-300 rounded" />
          <span className="text-muted-foreground dark:text-muted-foreground">Busy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border border-green-300 rounded" />
          <span className="text-muted-foreground dark:text-muted-foreground">Prayer Time</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-200 dark:bg-purple-800 border-2 border-purple-500 rounded" />
          <span className="text-muted-foreground dark:text-muted-foreground">Selected</span>
        </div>
      </div>
    </div>
  )
}
