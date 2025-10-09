'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { FixedSizeList as List } from 'react-window'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { getTransactions, getEntities } from '@/lib/universal-api-v2-client'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Loader2,
  AlertCircle,
  Clock,
  Users,
  Calendar as CalendarIcon
} from 'lucide-react'

// Enterprise Calendar Types
interface EnterpriseCalendarProps {
  className?: string
  onNewBooking?: () => void
  features?: {
    realTimeUpdates?: boolean
    conflictDetection?: boolean
    resourceOptimization?: boolean
    timeZoneSupport?: boolean
    virtualizedRendering?: boolean
  }
}

interface CalendarAppointment {
  id: string
  title: string
  customer_name: string
  stylist_id: string
  start_time: Date
  end_time: Date
  duration_minutes: number
  status: 'confirmed' | 'tentative' | 'cancelled' | 'completed'
  service_type: string
  price: number
  branch_id: string
  notes?: string
  color: string
  conflicts?: string[]
}

interface CalendarResource {
  id: string
  name: string
  type: 'stylist' | 'room' | 'equipment'
  available: boolean
  businessHours: { start: number; end: number }
  skills?: string[]
  branch_id?: string
}

// Enterprise color scheme
const ENTERPRISE_COLORS = {
  primary: '#1a365d',
  secondary: '#2d3748',
  accent: '#3182ce',
  success: '#38a169',
  warning: '#ed8936',
  error: '#e53e3e',
  surface: '#f7fafc',
  text: '#2d3748',
  textMuted: '#718096',
  border: '#e2e8f0'
}

// Business rules and constraints
const BUSINESS_CONSTRAINTS = {
  slotDuration: 30, // minutes
  businessHours: { start: 9, end: 19 },
  maxConcurrentPerStylist: 1,
  bufferTime: 15, // minutes between appointments
  minAppointmentDuration: 30,
  maxAppointmentDuration: 240
}

export function EnterpriseCalendar({
  className,
  onNewBooking,
  features = {
    realTimeUpdates: true,
    conflictDetection: true,
    resourceOptimization: true,
    timeZoneSupport: true,
    virtualizedRendering: true
  }
}: EnterpriseCalendarProps) {
  const { organizationId } = useSecuredSalonContext()
  const { selectedBranchId, branches, setBranchId } = useBranchFilter(
    organizationId,
    'salon-calendar'
  )
  const queryClient = useQueryClient()

  // Calendar state
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
  const [selectedResources, setSelectedResources] = useState<string[]>(['all'])
  const [timeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)

  // Calculate date range for current view
  const dateRange = useMemo(() => {
    const start = new Date(selectedDate)
    const end = new Date(selectedDate)

    switch (viewMode) {
      case 'day':
        break
      case 'week':
        const dayOfWeek = start.getDay()
        start.setDate(start.getDate() - dayOfWeek)
        end.setDate(start.getDate() + 6)
        break
      case 'month':
        start.setDate(1)
        end.setMonth(end.getMonth() + 1)
        end.setDate(0)
        break
    }

    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    return { start, end }
  }, [selectedDate, viewMode])

  // Parallel data loading with React Query
  const queries = useQueries({
    queries: [
      {
        queryKey: [
          'appointments',
          organizationId,
          dateRange.start.toISOString(),
          dateRange.end.toISOString(),
          selectedBranchId
        ],
        queryFn: async () => {
          if (!organizationId) return []
          return await getTransactions({
            orgId: organizationId,
            transactionType: 'APPOINTMENT',
            startDate: dateRange.start.toISOString(),
            endDate: dateRange.end.toISOString(),
            ...(selectedBranchId && selectedBranchId !== '__ALL__'
              ? { branchId: selectedBranchId }
              : {})
          })
        },
        enabled: !!organizationId,
        staleTime: 30_000,
        refetchInterval: features.realTimeUpdates ? 30_000 : false
      },
      {
        queryKey: ['staff', organizationId, selectedBranchId],
        queryFn: async () => {
          if (!organizationId) return []
          return await getEntities('', {
            p_organization_id: organizationId,
            p_entity_type: 'STAFF',
            ...(selectedBranchId && selectedBranchId !== '__ALL__'
              ? { p_branch_id: selectedBranchId }
              : {})
          })
        },
        enabled: !!organizationId,
        staleTime: 5 * 60 * 1000 // 5 minutes
      },
      {
        queryKey: ['customers', organizationId],
        queryFn: async () => {
          if (!organizationId) return []
          return await getEntities('', {
            p_organization_id: organizationId,
            p_entity_type: 'CUSTOMER'
          })
        },
        enabled: !!organizationId,
        staleTime: 10 * 60 * 1000 // 10 minutes
      },
      {
        queryKey: ['services', organizationId],
        queryFn: async () => {
          if (!organizationId) return []
          return await getEntities('', {
            p_organization_id: organizationId,
            p_entity_type: 'SERVICE'
          })
        },
        enabled: !!organizationId,
        staleTime: 15 * 60 * 1000 // 15 minutes
      }
    ]
  })

  const [appointmentsQuery, staffQuery, customersQuery, servicesQuery] = queries

  const isLoading = queries.some(q => q.isLoading)
  const hasError = queries.some(q => q.error)
  const errors = queries.filter(q => q.error).map(q => q.error)

  // Transform and memoize data
  const { appointments, resources, customers, services } = useMemo(() => {
    const rawAppointments = appointmentsQuery.data || []
    const rawStaff = staffQuery.data || []
    const rawCustomers = customersQuery.data || []
    const rawServices = servicesQuery.data || []

    // Create lookup maps for performance
    const customerMap = new Map(rawCustomers.map(c => [c.id, c.entity_name]))
    const serviceMap = new Map(
      rawServices.map(s => [s.id, { name: s.entity_name, color: s.metadata?.color || '#3182ce' }])
    )

    // Transform appointments with conflict detection
    const transformedAppointments: CalendarAppointment[] = rawAppointments.map(apt => {
      const metadata = apt.metadata || {}
      const serviceInfo = serviceMap.get(metadata.service_id) || {
        name: 'Service',
        color: '#3182ce'
      }

      return {
        id: apt.id,
        title: serviceInfo.name,
        customer_name: customerMap.get(apt.source_entity_id) || 'Walk-in',
        stylist_id: apt.target_entity_id || 'unassigned',
        start_time: new Date(metadata.start_time || apt.transaction_date),
        end_time: new Date(metadata.end_time || apt.transaction_date),
        duration_minutes: metadata.duration_minutes || 60,
        status: metadata.status || 'confirmed',
        service_type: metadata.service_type || 'general',
        price: apt.total_amount || 0,
        branch_id: metadata.branch_id || '',
        notes: metadata.notes,
        color: serviceInfo.color,
        conflicts: features.conflictDetection ? detectConflicts(apt, rawAppointments) : []
      }
    })

    // Transform staff to resources
    const transformedResources: CalendarResource[] = rawStaff.map(staff => ({
      id: staff.id,
      name: staff.entity_name || 'Staff Member',
      type: 'stylist' as const,
      available: staff.metadata?.available !== false,
      businessHours: {
        start: staff.metadata?.business_hours?.start || BUSINESS_CONSTRAINTS.businessHours.start,
        end: staff.metadata?.business_hours?.end || BUSINESS_CONSTRAINTS.businessHours.end
      },
      skills: staff.metadata?.skills || [],
      branch_id: staff.metadata?.branch_id
    }))

    return {
      appointments: transformedAppointments,
      resources: transformedResources,
      customers: rawCustomers,
      services: rawServices
    }
  }, [
    appointmentsQuery.data,
    staffQuery.data,
    customersQuery.data,
    servicesQuery.data,
    features.conflictDetection
  ])

  // Conflict detection function
  const detectConflicts = useCallback((appointment: any, allAppointments: any[]): string[] => {
    const conflicts: string[] = []
    const aptStart = new Date(appointment.metadata?.start_time || appointment.transaction_date)
    const aptEnd = new Date(appointment.metadata?.end_time || appointment.transaction_date)

    allAppointments.forEach(other => {
      if (other.id === appointment.id) return
      if (other.target_entity_id !== appointment.target_entity_id) return // Different stylist

      const otherStart = new Date(other.metadata?.start_time || other.transaction_date)
      const otherEnd = new Date(other.metadata?.end_time || other.transaction_date)

      // Check for overlap
      if (aptStart < otherEnd && aptEnd > otherStart) {
        conflicts.push(`Overlaps with appointment ${other.id}`)
      }
    })

    return conflicts
  }, [])

  // Generate time slots with performance optimization
  const timeSlots = useMemo(() => {
    const slots = []
    const { start, end } = BUSINESS_CONSTRAINTS.businessHours
    const slotCount = ((end - start) * 60) / BUSINESS_CONSTRAINTS.slotDuration

    for (let i = 0; i < slotCount; i++) {
      const hour = start + Math.floor((i * BUSINESS_CONSTRAINTS.slotDuration) / 60)
      const minute = (i * BUSINESS_CONSTRAINTS.slotDuration) % 60
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

      slots.push({
        time,
        displayTime: new Date(2024, 0, 1, hour, minute).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        hour,
        minute
      })
    }

    return slots
  }, [])

  // Filter resources based on selection
  const displayedResources = useMemo(() => {
    if (selectedResources.includes('all')) return resources
    return resources.filter(r => selectedResources.includes(r.id))
  }, [resources, selectedResources])

  // Get view dates
  const viewDates = useMemo(() => {
    const dates = []
    const current = new Date(dateRange.start)

    while (current <= dateRange.end) {
      dates.push(new Date(current))
      current.setDate(current.setDate() + 1)
    }

    return dates
  }, [dateRange])

  // Handle resource selection
  const handleResourceToggle = useCallback((resourceId: string) => {
    if (resourceId === 'all') {
      setSelectedResources(['all'])
    } else {
      setSelectedResources(prev => {
        const filtered = prev.filter(id => id !== 'all')
        if (filtered.includes(resourceId)) {
          const newSelection = filtered.filter(id => id !== resourceId)
          return newSelection.length === 0 ? ['all'] : newSelection
        } else {
          return [...filtered, resourceId]
        }
      })
    }
  }, [])

  // Navigation handlers
  const navigateCalendar = useCallback(
    (direction: 'prev' | 'next') => {
      const newDate = new Date(selectedDate)
      const amount = direction === 'next' ? 1 : -1

      switch (viewMode) {
        case 'day':
          newDate.setDate(newDate.getDate() + amount)
          break
        case 'week':
          newDate.setDate(newDate.getDate() + amount * 7)
          break
        case 'month':
          newDate.setMonth(newDate.getMonth() + amount)
          break
      }

      setSelectedDate(newDate)
    },
    [selectedDate, viewMode]
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          navigateCalendar('prev')
          break
        case 'ArrowRight':
          e.preventDefault()
          navigateCalendar('next')
          break
        case 'Home':
          e.preventDefault()
          setSelectedDate(new Date())
          break
        case '1':
          e.preventDefault()
          setViewMode('day')
          break
        case '2':
          e.preventDefault()
          setViewMode('week')
          break
        case '3':
          e.preventDefault()
          setViewMode('month')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigateCalendar])

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!features.realTimeUpdates || !organizationId) return

    // Note: This would connect to your WebSocket endpoint
    console.log('Setting up real-time updates for organization:', organizationId)

    // Cleanup function would close WebSocket connection
    return () => {
      console.log('Cleaning up real-time updates')
    }
  }, [organizationId, features.realTimeUpdates])

  // Error state
  if (hasError && !isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Failed to load calendar</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {errors[0]?.message || 'Please try again'}
          </p>
          <Button onClick={() => queryClient.invalidateQueries()}>Retry</Button>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full bg-white rounded-lg shadow-sm border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateCalendar('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateCalendar('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div>
            <h2 className="text-xl font-semibold">
              {viewMode === 'day'
                ? selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : viewMode === 'week'
                  ? `Week of ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  : selectedDate.toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
            </h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                {appointments.length} appointments
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {displayedResources.length} resources
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {timeZone}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={v => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button onClick={onNewBooking}>
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </Button>

          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="w-64 border-r bg-gray-50 p-4">
          <h3 className="font-semibold mb-3">Resources</h3>

          {/* Branch Filter */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Branch</label>
            <select
              value={selectedBranchId || '__ALL__'}
              onChange={e => setBranchId(e.target.value === '__ALL__' ? '' : e.target.value)}
              className="w-full p-2 border rounded-md text-sm"
            >
              <option value="__ALL__">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Resource Selection */}
          <div className="space-y-2">
            <div
              className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-white"
              onClick={() => handleResourceToggle('all')}
            >
              <input type="checkbox" checked={selectedResources.includes('all')} readOnly />
              <span className="text-sm font-medium">All Stylists</span>
            </div>

            {resources.map(resource => (
              <div
                key={resource.id}
                className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-white"
                onClick={() => handleResourceToggle(resource.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedResources.includes(resource.id)}
                  disabled={selectedResources.includes('all')}
                  readOnly
                />
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">{resource.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{resource.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {resource.businessHours.start}:00 - {resource.businessHours.end}:00
                  </p>
                </div>
                <Badge variant={resource.available ? 'default' : 'secondary'} className="text-xs">
                  {resource.available ? 'Available' : 'Away'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Time header */}
          <div className="flex border-b bg-gray-50">
            <div className="w-16 border-r p-2">
              <span className="text-xs font-medium text-muted-foreground">Time</span>
            </div>
            {displayedResources.map(resource => (
              <div key={resource.id} className="flex-1 min-w-32 border-r p-2 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">{resource.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{resource.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {resource.businessHours.start}:00-{resource.businessHours.end}:00
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Time slots */}
          <ScrollArea className="flex-1">
            {features.virtualizedRendering ? (
              <List
                height={600}
                itemCount={timeSlots.length}
                itemSize={60}
                itemData={{ timeSlots, resources: displayedResources, appointments }}
              >
                {({ index, style, data }) => (
                  <div style={style}>
                    <TimeSlotRow
                      timeSlot={data.timeSlots[index]}
                      resources={data.resources}
                      appointments={data.appointments}
                    />
                  </div>
                )}
              </List>
            ) : (
              <div>
                {timeSlots.map(slot => (
                  <TimeSlotRow
                    key={slot.time}
                    timeSlot={slot}
                    resources={displayedResources}
                    appointments={appointments}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

// Optimized time slot row component
const TimeSlotRow = React.memo(({ timeSlot, resources, appointments }: any) => {
  return (
    <div className="flex border-b h-15">
      {/* Time column */}
      <div className="w-16 border-r p-2 bg-gray-50">
        <span className="text-xs font-medium text-muted-foreground">{timeSlot.displayTime}</span>
      </div>

      {/* Resource columns */}
      {resources.map((resource: CalendarResource) => {
        const slotAppointments = appointments.filter((apt: CalendarAppointment) => {
          const aptTime = apt.start_time.getHours() * 100 + apt.start_time.getMinutes()
          const slotTime = timeSlot.hour * 100 + timeSlot.minute
          return apt.stylist_id === resource.id && aptTime === slotTime
        })

        const isBusinessHour =
          timeSlot.hour >= resource.businessHours.start &&
          timeSlot.hour < resource.businessHours.end

        return (
          <div
            key={resource.id}
            className={cn(
              'flex-1 min-w-32 border-r p-1 relative',
              !isBusinessHour && 'bg-gray-100'
            )}
          >
            {slotAppointments.map((apt: CalendarAppointment) => (
              <div
                key={apt.id}
                className={cn(
                  'absolute inset-x-1 top-1 p-2 rounded text-xs',
                  'border-l-4 bg-white shadow-sm',
                  apt.conflicts?.length && 'ring-2 ring-red-500'
                )}
                style={{
                  borderLeftColor: apt.color,
                  height: `${(apt.duration_minutes / 30) * 60 - 8}px`
                }}
              >
                <p className="font-medium truncate">{apt.customer_name}</p>
                <p className="text-muted-foreground truncate">{apt.title}</p>
                <p className="text-muted-foreground">{apt.duration_minutes}min</p>
                {apt.conflicts?.length > 0 && (
                  <Badge variant="destructive" className="text-xs mt-1">
                    Conflict
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
})

TimeSlotRow.displayName = 'TimeSlotRow'
