'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import '@/styles/microsoft-calendar.css'
import '@/styles/salon-calendar-animations.css'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  MapPin,
  Star,
  Sparkles,
  Grid3x3,
  User,
  Crown,
  Zap,
  Scissors,
  Palette,
  MoreVertical,
  Settings,
  X,
  Columns,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { useHeraAppointments } from '@/hooks/useHeraAppointments'
import { useHeraStaff } from '@/hooks/useHeraStaff'
import { useHeraCustomers } from '@/hooks/useHeraCustomers'
import { useHeraServices } from '@/hooks/useHeraServicesV2'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { BranchSelector } from '@/components/salon/BranchSelector'

interface SalonResourceCalendarProps {
  className?: string
  onNewBooking?: () => void
  organizations?: Array<{
    id: string
    organization_code: string
    organization_name: string
  }>
  currentOrganizationId?: string
  canViewAllBranches?: boolean
}

interface TimeSlot {
  time: string
  displayTime: string
  appointments: any[]
}

interface Stylist {
  id: string
  name: string
  title: string
  avatar: string
  color: string
  available: boolean
  status: string
  businessHours?: {
    start: number
    end: number
  }
}

interface Appointment {
  id: string
  title: string
  client: string
  stylist: string
  time: string
  date: Date
  duration: number
  service: string
  status: string
  price: string
  color: string
  icon: React.ReactNode
  station?: string
  branchId: string
}

const BUSINESS_HOURS = {
  start: 9,
  end: 21,
  slotDuration: 30 // minutes
}

// Helper to assert UUID format
function assertUuid(id: string) {
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) throw new Error(`Invalid organization_id: ${id}`)
}

// Helper to check if component is mounted
function useIsMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

export function SalonResourceCalendar({
  className,
  organizations = [],
  canViewAllBranches = false
}: SalonResourceCalendarProps) {
  const { organizationId } = useSecuredSalonContext()
  // ✅ CRITICAL: Use organizationId directly from JWT context
  // This is the validated organization ID from JWT token, not from cache
  const branchId = undefined // Branch filtering via client-side selection
  const mounted = useIsMounted()

  // All hooks must be called before any conditional returns
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedView, setSelectedView] = useState<'day' | 'week' | 'month'>('week')
  const [viewMode, setViewMode] = useState<'single' | 'resource'>('resource')
  const [selectedStylists, setSelectedStylists] = useState<string[]>(['all'])
  const [selectedBranches, setSelectedBranches] = useState<string[]>(['all'])
  const [showSidebar, setShowSidebar] = useState(true)
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null)
  const [dropTarget, setDropTarget] = useState<{
    date: Date
    time: string
    stylistId: string
  } | null>(null)

  // Calculate date range based on selected view
  const dateRange = useMemo(() => {
    const start = new Date(selectedDate)
    const end = new Date(selectedDate)

    switch (selectedView) {
      case 'day':
        // Just the selected day
        break
      case 'week':
        // Get start and end of week
        const dayOfWeek = start.getDay()
        start.setDate(start.getDate() - dayOfWeek)
        end.setDate(start.getDate() + 6)
        break
      case 'month':
        // Get start and end of month
        start.setDate(1)
        end.setMonth(end.getMonth() + 1)
        end.setDate(0)
        break
    }

    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    return {
      fromISO: start.toISOString(),
      toISO: end.toISOString()
    }
  }, [selectedDate, selectedView])

  // ✅ Use HERA RPC hooks for data fetching (same as appointments page)
  const {
    appointments: rawAppointments,
    isLoading: appointmentsLoading,
    error: appointmentsError
  } = useHeraAppointments({
    organizationId,
    filters: {
      ...(branchId && !canViewAllBranches ? { branch_id: branchId } : {}),
      date_from: dateRange.fromISO,
      date_to: dateRange.toISO
    }
  })

  const { staff, isLoading: staffLoading } = useHeraStaff({
    organizationId,
    filters: {
      ...(branchId && !canViewAllBranches ? { branch_id: branchId } : {})
    }
  })

  const { isLoading: customersLoading } = useHeraCustomers({
    organizationId
  })

  const { isLoading: servicesLoading } = useHeraServices({
    organizationId
  })

  const loading = appointmentsLoading || staffLoading || customersLoading || servicesLoading
  const error = appointmentsError

  // Tiny navigation skeleton when changing week/day/month
  const [isViewLoading, setIsViewLoading] = useState(false)
  useEffect(() => {
    // trigger a brief skeleton on view/date change
    setIsViewLoading(true)
    const t = setTimeout(() => setIsViewLoading(false), 400)
    return () => clearTimeout(t)
  }, [selectedDate, selectedView])
  useEffect(() => {
    // if network finished, hide skeleton immediately
    if (!loading) setIsViewLoading(false)
  }, [loading])

  // Helper function to get consistent colors for stylists
  const getColorForIndex = useCallback((index: number): string => {
    const colors = [
      'bg-purple-600',
      'bg-blue-600',
      'bg-pink-600',
      'bg-amber-600',
      'bg-teal-600',
      'bg-rose-600',
      'bg-indigo-600',
      'bg-emerald-600'
    ]
    return colors[index % colors.length] || 'bg-purple-600'
  }, [])

  // ✅ Transform HERA staff data to Stylist format
  const allStylists: (Stylist & { branchId: string })[] = useMemo(() => {
    if (!staff.length && !mounted) {
      // Return empty array for initial render to prevent hydration mismatch
      return []
    }

    // Map HERA staff data to Stylist format
    const mapped = staff.map((s: any, index: number) => ({
      id: s.id,
      name: s.entity_name || 'Staff Member',
      title: s.metadata?.role || s.metadata?.designation || 'Stylist',
      avatar: s.entity_name?.charAt(0).toUpperCase() || 'S',
      color: getColorForIndex(index),
      available: s.metadata?.available !== false,
      status: s.metadata?.available === false ? 'away' : 'available',
      businessHours: { start: 9, end: 19 }, // Default hours
      branchId: s.metadata?.branch_id || ''
    }))

    // Virtual stylist to show appointments with no stylist assignment
    const unassigned: (Stylist & { branchId: string }) = {
      id: 'unassigned',
      name: 'Unassigned',
      title: '—',
      avatar: 'U',
      color: getColorForIndex(0),
      available: true,
      status: 'available',
      businessHours: { start: 9, end: 19 },
      branchId: ''
    }

    return [unassigned, ...mapped]
  }, [staff, mounted, getColorForIndex])

  // Filter stylists based on selected branches
  const stylists = useMemo(() => {
    if (selectedBranches.includes('all')) {
      return allStylists
    }
    return allStylists.filter(s => selectedBranches.includes(s.branchId))
  }, [allStylists, selectedBranches])

  // Get selected stylists for resource view
  const displayedStylists = useMemo(() => {
    if (selectedStylists.includes('all')) {
      return stylists
    }
    return stylists.filter(s => selectedStylists.includes(s.id))
  }, [stylists, selectedStylists])

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

  // ✅ Transform HERA appointments to calendar format
  const transformedAppointments = useMemo(() => {
    if (!rawAppointments.length || !mounted) {
      // Return empty array for initial render to prevent hydration mismatch
      return []
    }

    // Service icons and colors mapping
    const serviceIconMap: Record<string, { icon: React.ReactNode; color: string }> = {
      brazilian: { icon: <Zap className="w-3 h-3" />, color: '#8B5CF6' },
      cut: { icon: <Scissors className="w-3 h-3" />, color: '#3B82F6' },
      color: { icon: <Palette className="w-3 h-3" />, color: '#EC4899' },
      bridal: { icon: <Crown className="w-3 h-3" />, color: '#F59E0B' },
      nails: { icon: <Sparkles className="w-3 h-3" />, color: '#10B981' },
      keratin: { icon: <Star className="w-3 h-3" />, color: '#8B5CF6' },
      default: { icon: <Scissors className="w-3 h-3" />, color: '#6B7280' }
    }

    return rawAppointments.map((apt: any) => {
      const startDate = new Date(apt.start_time)
      const time = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`

      // Get service info (appointment might have service in metadata)
      const serviceType = apt.metadata?.service_type || 'default'
      const serviceInfo = serviceIconMap[serviceType] || serviceIconMap['default']

      // Customer and stylist names come from enriched appointment data
      const customerName = apt.customer_name || 'Walk-in Customer'
      const stylistId = apt.stylist_id || ''

      // Get branch info from metadata
      const appointmentBranchId = apt.branch_id || ''

      return {
        id: apt.id,
        title: apt.entity_name || 'Appointment',
        client: customerName,
        stylist: stylistId,
        time,
        date: startDate,
        duration: apt.duration_minutes || 60,
        service: serviceType,
        status:
          apt.status === 'completed'
            ? 'completed'
            : apt.status === 'cancelled'
              ? 'tentative'
              : 'confirmed',
        price: `AED ${apt.total_amount || 0}`,
        color: serviceInfo?.color || '#6B7280',
        icon: serviceInfo?.icon || <Scissors className="w-3 h-3" />,
        station: `station-1`,
        branchId: appointmentBranchId
      }
    })
  }, [rawAppointments, mounted])

  // Get dates based on selected view
  const getViewDates = useCallback(() => {
    const dates = []

    if (selectedView === 'day') {
      // For day view, just return the selected date
      dates.push(new Date(selectedDate))
    } else if (selectedView === 'week') {
      // For week view, get full week
      const startOfWeek = new Date(selectedDate)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day
      startOfWeek.setDate(diff)

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000)
        dates.push(date)
      }
    } else {
      // For month view, get current month's weeks (simplified to current week for now)
      const startOfWeek = new Date(selectedDate)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day
      startOfWeek.setDate(diff)

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000)
        dates.push(date)
      }
    }

    return dates
  }, [selectedDate, selectedView])

  const viewDates = useMemo(() => getViewDates(), [getViewDates])

  // Format date for display
  const formatDateHeader = useCallback((date: Date) => {
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
    const dayNumber = date.getDate()

    return { dayName, dayNumber, isToday }
  }, [])

  // Handle stylist selection
  const handleStylistToggle = useCallback((stylistId: string) => {
    if (stylistId === 'all') {
      setSelectedStylists(['all'])
    } else {
      setSelectedStylists(prev => {
        const filtered = prev.filter(id => id !== 'all')
        if (filtered.includes(stylistId)) {
          const newSelection = filtered.filter(id => id !== stylistId)
          return newSelection.length === 0 ? ['all'] : newSelection
        } else {
          return [...filtered, stylistId]
        }
      })
    }
  }, [])

  // Check if time slot is within stylist's business hours
  const isWithinBusinessHours = useCallback((stylist: Stylist, time: string) => {
    const [hourStr] = time.split(':')
    const hour = hourStr ? Number(hourStr) : 9
    const businessHours = stylist.businessHours || BUSINESS_HOURS
    return hour >= businessHours.start && hour < businessHours.end
  }, [])

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, appointment: Appointment) => {
    setDraggedAppointment(appointment)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  // Handle drag over
  const handleDragOver = useCallback(
    (e: React.DragEvent, date: Date, time: string, stylistId: string) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setDropTarget({ date, time, stylistId })
    },
    []
  )

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent, date: Date, time: string, stylistId: string) => {
      e.preventDefault()
      if (!draggedAppointment) return

      setDraggedAppointment(null)
      setDropTarget(null)

      // TODO: Call Playbook API to update the appointment
      console.log('Moved appointment:', {
        appointmentId: draggedAppointment.id,
        newDate: date,
        newTime: time,
        newStylist: stylistId
      })

      // After API call succeeds, the useCalendarPlaybook hook will automatically
      // refresh the data and update the UI
    },
    [draggedAppointment]
  )

  // Handle keyboard navigation
  const handleKeyNavigation = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return // Don't handle keyboard events when typing in inputs
      }

      const newDate = new Date(selectedDate)

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          if (selectedView === 'day') {
            newDate.setDate(newDate.getDate() - 1)
          } else if (selectedView === 'week') {
            newDate.setDate(newDate.getDate() - 7)
          } else {
            newDate.setMonth(newDate.getMonth() - 1)
          }
          console.log('Salon Keyboard: Previous', {
            oldDate: selectedDate.toDateString(),
            newDate: newDate.toDateString(),
            view: selectedView
          })
          setSelectedDate(newDate)
          break
        case 'ArrowRight':
          e.preventDefault()
          if (selectedView === 'day') {
            newDate.setDate(newDate.getDate() + 1)
          } else if (selectedView === 'week') {
            newDate.setDate(newDate.getDate() + 7)
          } else {
            newDate.setMonth(newDate.getMonth() + 1)
          }
          console.log('Salon Keyboard: Next', {
            oldDate: selectedDate.toDateString(),
            newDate: newDate.toDateString(),
            view: selectedView
          })
          setSelectedDate(newDate)
          break
        case 'Home':
          e.preventDefault()
          console.log('Salon Keyboard: Today')
          setSelectedDate(new Date())
          break
        case '1':
          e.preventDefault()
          setSelectedView('day')
          break
        case '2':
          e.preventDefault()
          setSelectedView('week')
          break
        case '3':
          e.preventDefault()
          setSelectedView('month')
          break
      }
    },
    [selectedDate, selectedView]
  )

  // Add keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyNavigation)
    return () => window.removeEventListener('keydown', handleKeyNavigation)
  }, [handleKeyNavigation])

  // Assert valid UUID after all hooks
  useEffect(() => {
    if (organizationId) {
      try {
        assertUuid(organizationId)
      } catch (error) {
        console.error('Invalid organization ID:', organizationId, error)
      }
    }
  }, [organizationId])

  // Don't render calendar if no organization ID
  if (!organizationId && mounted) {
    return (
      <div
        className={cn(
          'flex h-[800px] rounded-lg overflow-hidden items-center justify-center',
          className
        )}
        style={{
          backgroundColor: '#1A1A1A',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(212, 175, 55, 0.1)'
        }}
      >
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4" style={{ color: '#8C7853' }} />
          <p style={{ color: '#F5E6C8' }}>No organization selected</p>
        </div>
      </div>
    )
  }

  // Show loading state
  if (loading && !mounted) {
    return (
      <div
        className={cn(
          'flex h-[800px] rounded-lg overflow-hidden items-center justify-center',
          className
        )}
        style={{
          backgroundColor: '#1A1A1A',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(212, 175, 55, 0.1)'
        }}
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#D4AF37' }} />
          <p style={{ color: '#F5E6C8' }}>Loading calendar...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error && !transformedAppointments.length && !staff.length) {
    return (
      <div
        className={cn(
          'flex h-[800px] rounded-lg overflow-hidden items-center justify-center',
          className
        )}
        style={{
          backgroundColor: '#1A1A1A',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(212, 175, 55, 0.1)'
        }}
      >
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4" style={{ color: '#E8B4B8' }} />
          <p className="font-semibold mb-2" style={{ color: '#E8B4B8' }}>
            Failed to load calendar data
          </p>
          <p className="text-sm" style={{ color: '#8C7853' }}>
            {error.message}
          </p>
        </div>
      </div>
    )
  }

  // Define luxury color palette
  const COLORS = {
    black: '#0B0B0B',
    charcoal: '#1A1A1A',
    gold: '#D4AF37',
    goldDark: '#B8860B',
    champagne: '#F5E6C8',
    bronze: '#8C7853',
    emerald: '#0F6F5C',
    plum: '#5A2A40',
    rose: '#E8B4B8',
    lightText: '#E0E0E0'
  }

  return (
    <div
      className={cn('relative flex h-[800px] rounded-lg overflow-hidden calendar-fade-in', className)}
      style={{
        backgroundColor: COLORS.charcoal,
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(212, 175, 55, 0.1)',
        border: `1px solid ${COLORS.gold}1A`
      }}
    >
      {(isViewLoading || loading) && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <Skeleton className="h-6 w-28" data-testid="calendar-loading" />
        </div>
      )}
      {/* Sidebar */}
      {showSidebar && (
        <div
          className="w-80 border-r flex flex-col calendar-sidebar"
          style={{
            backgroundColor: COLORS.charcoal,
            borderColor: `${COLORS.gold}33`
          }}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b" style={{ borderColor: `${COLORS.gold}33` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: COLORS.champagne }}>
                Calendar
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(false)}
                className="hover:opacity-80"
                style={{ color: COLORS.bronze }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Branch Filter */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2" style={{ color: COLORS.champagne }}>
                Branch
              </h4>
              <BranchSelector variant="sidebar" showIcon={false} />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant={viewMode === 'single' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setViewMode('single')}
                style={{
                  backgroundColor: viewMode === 'single' ? COLORS.gold : 'transparent',
                  color: viewMode === 'single' ? COLORS.black : COLORS.champagne,
                  borderColor: COLORS.bronze
                }}
              >
                <User className="w-4 h-4 mr-2" />
                Single View
              </Button>
              <Button
                variant={viewMode === 'resource' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setViewMode('resource')}
                style={{
                  backgroundColor: viewMode === 'resource' ? COLORS.gold : 'transparent',
                  color: viewMode === 'resource' ? COLORS.black : COLORS.champagne,
                  borderColor: COLORS.bronze
                }}
              >
                <Columns className="w-4 h-4 mr-2" />
                Resource View
              </Button>
            </div>

            {/* Mini Calendar - Enterprise Grade */}
            <div
              className="rounded-lg p-3"
              style={{
                backgroundColor: COLORS.black,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div className="flex items-center justify-between mb-3 calendar-mini-header">
                <span className="text-sm font-semibold tracking-wide" style={{ color: COLORS.champagne }}>
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 calendar-mini-nav-button"
                    style={{ color: COLORS.bronze }}
                    onClick={() => {
                      const newDate = new Date(selectedDate)
                      newDate.setMonth(newDate.getMonth() - 1)
                      setSelectedDate(newDate)
                    }}
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 calendar-mini-nav-button"
                    style={{ color: COLORS.bronze }}
                    onClick={() => {
                      const newDate = new Date(selectedDate)
                      newDate.setMonth(newDate.getMonth() + 1)
                      setSelectedDate(newDate)
                    }}
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Day of week headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div
                    key={i}
                    className="text-center text-xs font-semibold py-1 calendar-dow-header"
                    style={{ color: COLORS.gold }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const year = selectedDate.getFullYear()
                  const month = selectedDate.getMonth()
                  const firstDay = new Date(year, month, 1).getDay()
                  const daysInMonth = new Date(year, month + 1, 0).getDate()
                  const today = new Date()
                  const isToday = (day: number) =>
                    today.getFullYear() === year &&
                    today.getMonth() === month &&
                    today.getDate() === day
                  const isSelected = (day: number) =>
                    selectedDate.getFullYear() === year &&
                    selectedDate.getMonth() === month &&
                    selectedDate.getDate() === day

                  const days = []
                  // Empty cells for days before month starts
                  for (let i = 0; i < firstDay; i++) {
                    days.push(<div key={`empty-${i}`} />)
                  }
                  // Actual days of the month
                  for (let day = 1; day <= daysInMonth; day++) {
                    const dayIsToday = isToday(day)
                    const dayIsSelected = isSelected(day)
                    days.push(
                      <button
                        key={day}
                        onClick={() => {
                          const newDate = new Date(year, month, day)
                          setSelectedDate(newDate)
                        }}
                        className={cn(
                          'calendar-mini-day text-xs font-medium py-1.5 rounded-md',
                          dayIsToday && 'calendar-mini-today ring-2 ring-offset-1 font-bold shadow-md',
                          dayIsSelected && 'calendar-mini-selected font-bold'
                        )}
                        style={{
                          color: dayIsToday
                            ? COLORS.black
                            : dayIsSelected
                              ? COLORS.champagne
                              : COLORS.lightText,
                          backgroundColor: dayIsToday
                            ? COLORS.gold
                            : dayIsSelected
                              ? `${COLORS.gold}40`
                              : 'transparent'
                        }}
                      >
                        {day}
                      </button>
                    )
                  }
                  return days
                })()}
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h4 className="text-sm font-semibold mb-3" style={{ color: COLORS.champagne }}>
                Team Members
              </h4>

              {/* All option */}
              <div
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all sidebar-item mb-2',
                  selectedStylists.includes('all')
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                    : 'hover:bg-muted dark:hover:bg-muted-foreground/10'
                )}
                onClick={() => handleStylistToggle('all')}
              >
                <Checkbox
                  checked={selectedStylists.includes('all')}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                    All Stylists
                  </p>
                  <p className="text-xs" style={{ color: COLORS.bronze }}>
                    View all team members
                  </p>
                </div>
              </div>

              {/* Individual stylists */}
              <div className="space-y-2">
                {stylists.map(stylist => (
                  <div
                    key={stylist.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer calendar-sidebar-item',
                      selectedStylists.includes(stylist.id)
                        ? 'bg-amber-50/10 dark:bg-amber-900/20 border border-amber-200/30 dark:border-amber-700/30'
                        : 'hover:bg-amber-50/5 dark:hover:bg-amber-900/10'
                    )}
                    onClick={() => handleStylistToggle(stylist.id)}
                  >
                    <Checkbox
                      checked={selectedStylists.includes(stylist.id)}
                      disabled={selectedStylists.includes('all')}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <div className="relative">
                      <Avatar className={cn('h-10 w-10', stylist.color)}>
                        <AvatarFallback className="text-foreground font-semibold">
                          {stylist.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800',
                          'calendar-avatar-status',
                          stylist.status === 'available'
                            ? 'bg-green-500'
                            : stylist.status === 'busy'
                              ? 'bg-red-500'
                              : 'bg-gray-400'
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                        {stylist.name}
                      </p>
                      <p className="text-xs" style={{ color: COLORS.bronze }}>
                        {stylist.title}
                      </p>
                      {organizations.length > 0 && (
                        <p className="text-xs mt-0.5" style={{ color: COLORS.bronze }}>
                          {organizations
                            .find(org => org.id === (stylist as any).branchId)
                            ?.organization_name.split('•')[1]
                            ?.trim() || 'Branch'}
                        </p>
                      )}
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
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t" style={{ borderColor: `${COLORS.gold}33` }}>
            <Button
              className="w-full font-semibold tracking-wide uppercase calendar-action-button"
              style={{
                backgroundImage: `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                color: COLORS.black,
                borderRadius: '9999px',
                boxShadow: '0 6px 20px rgba(212,175,55,0.25)'
              }}
              onClick={() => {
                window.location.href = '/salon/appointments/new'
              }}
            >
              <Plus className="w-4 h-4 mr-2 calendar-icon" />
              Book Appointment
            </Button>
          </div>
        </div>
      )}

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col">
        {/* Calendar Header */}
        <div
          className="p-4 border-b"
          style={{
            backgroundColor: COLORS.charcoal,
            borderColor: `${COLORS.gold}33`
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!showSidebar && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(true)}
                  className="hover:opacity-80"
                  style={{ color: COLORS.bronze }}
                >
                  <Grid3x3 className="w-5 h-5" />
                </Button>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground dark:text-gray-300"
                  style={{ color: COLORS.bronze }}
                  onClick={() => {
                    const newDate = new Date(selectedDate)
                    if (selectedView === 'day') {
                      newDate.setDate(newDate.getDate() - 1)
                    } else if (selectedView === 'week') {
                      newDate.setDate(newDate.getDate() - 7)
                    } else {
                      newDate.setMonth(newDate.getMonth() - 1)
                    }
                    console.log('Salon Navigation: Previous', {
                      oldDate: selectedDate.toDateString(),
                      newDate: newDate.toDateString(),
                      view: selectedView
                    })
                    setSelectedDate(newDate)
                  }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  className="text-sm font-medium min-w-[120px]"
                  style={{
                    color: COLORS.champagne,
                    borderColor: COLORS.bronze
                  }}
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:opacity-80"
                  style={{ color: COLORS.bronze }}
                  onClick={() => {
                    const newDate = new Date(selectedDate)
                    if (selectedView === 'day') {
                      newDate.setDate(newDate.getDate() + 1)
                    } else if (selectedView === 'week') {
                      newDate.setDate(newDate.getDate() + 7)
                    } else {
                      newDate.setMonth(newDate.getMonth() + 1)
                    }
                    console.log('Salon Navigation: Next', {
                      oldDate: selectedDate.toDateString(),
                      newDate: newDate.toDateString(),
                      view: selectedView
                    })
                    setSelectedDate(newDate)
                  }}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex flex-col">
                <h2 className="text-xl font-semibold" style={{ color: COLORS.champagne }}>
                  {selectedView === 'day'
                    ? selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : selectedView === 'week'
                      ? `Week of ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : selectedDate.toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric'
                        })}
                </h2>
                <p className="text-sm" style={{ color: COLORS.bronze }}>
                  {selectedView.charAt(0).toUpperCase() + selectedView.slice(1)} view •{' '}
                  {viewDates.length} day{viewDates.length > 1 ? 's' : ''} • Hair Talkz Salon
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Tabs value={selectedView} onValueChange={v => setSelectedView(v as any)}>
                <TabsList
                  style={{ backgroundColor: `${COLORS.charcoal}DD`, borderColor: COLORS.bronze }}
                >
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:opacity-80"
                  style={{ color: COLORS.bronze }}
                >
                  <Search className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:opacity-80"
                  style={{ color: COLORS.bronze }}
                >
                  <Filter className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:opacity-80"
                  style={{ color: COLORS.bronze }}
                  title="Keyboard Shortcuts: ← → Navigate, Home: Today, 1: Day, 2: Week, 3: Month"
                >
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
            <div
              className="w-20 border-r"
              style={{
                backgroundColor: `${COLORS.charcoal}CC`,
                borderColor: `${COLORS.gold}33`
              }}
            >
              <div
                className={cn('border-b', viewMode === 'resource' ? 'h-20' : 'h-14')}
                style={{ borderColor: `${COLORS.gold}33` }}
              />
              <ScrollArea
                className={cn(
                  'calendar-scrollbar',
                  viewMode === 'resource' ? 'h-[calc(100%-5rem)]' : 'h-[calc(100%-3.5rem)]'
                )}
              >
                {timeSlots.map((slot) => (
                  <div
                    key={slot.time}
                    className="h-16 border-b px-2 py-1"
                    style={{ borderColor: `${COLORS.gold}1A` }}
                  >
                    <span className="text-xs font-semibold" style={{ color: COLORS.bronze }}>
                      {slot.displayTime}
                    </span>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Days/Resources Grid */}
            <div className="flex-1 flex">
              <ScrollArea className="w-full calendar-scrollbar">
                <div className="flex">
                  {viewMode === 'single'
                    ? // Single view mode (day/week/month layout)
                      viewDates.map((date, dayIdx) => {
                        const { dayName, dayNumber, isToday } = formatDateHeader(date)

                        return (
                          <div
                            key={dayIdx}
                            className={cn(
                              'border-r last:border-r-0 transition-all duration-300',
                              selectedView === 'day'
                                ? 'flex-1 min-w-[400px]'
                                : 'flex-1 min-w-[140px]'
                            )}
                            style={{ borderColor: `${COLORS.gold}33` }}
                          >
                            {/* Day Header */}
                            <div
                              className={cn(
                                'h-14 border-b px-2 py-2 text-center day-header',
                                isToday && 'today'
                              )}
                              style={{
                                borderColor: `${COLORS.gold}33`,
                                backgroundColor: isToday ? `${COLORS.gold}0D` : 'transparent'
                              }}
                            >
                              <p
                                className={cn('text-xs font-bold uppercase tracking-wider')}
                                style={{
                                  color: isToday ? COLORS.gold : COLORS.bronze
                                }}
                              >
                                {dayName}
                              </p>
                              <p
                                className={cn('text-xl font-extrabold')}
                                style={{
                                  color: isToday ? COLORS.gold : COLORS.champagne
                                }}
                              >
                                {dayNumber}
                              </p>
                            </div>

                            {/* Time Slots */}
                            <div>
                              {timeSlots.map((slot, slotIdx) => {
                              const slotAppointments = transformedAppointments.filter(
                                (apt: Appointment) =>
                                  apt.time === slot.time &&
                                  apt.date.toDateString() === date.toDateString() &&
                                  (selectedStylists.includes('all') ||
                                    selectedStylists.includes(apt.stylist || 'unassigned')) &&
                                  (!selectedBranchId || apt.branchId === selectedBranchId)
                              )

                                return (
                                  <div
                                    key={`${dayIdx}-${slotIdx}`}
                                    className={cn(
                                      'h-16 border-b relative group calendar-time-slot'
                                    )}
                                    style={{
                                      borderColor: `${COLORS.gold}1A`,
                                      backgroundColor: 'transparent'
                                    }}
                                    onClick={() => {
                                      if (!slotAppointments.length) {
                                        window.location.href = '/salon/appointments/new'
                                      }
                                    }}
                                  >
                                    {/* Appointments */}
                                    {slotAppointments.map((apt: Appointment, aptIdx: number) => {
                                      const durationSlots = Math.ceil(
                                        apt.duration / BUSINESS_HOURS.slotDuration
                                      )
                                      const stylistInfo = stylists.find(s => s.id === apt.stylist)

                                      return (
                                        <div
                                          key={apt.id}
                                          draggable
                                          onDragStart={e => handleDragStart(e, apt)}
                                          className={cn(
                                            'absolute inset-x-1 top-1 mx-1 rounded-md p-2 cursor-move',
                                            'calendar-appointment-card border-l-4',
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
                                              <p
                                                className="text-xs font-semibold truncate"
                                                style={{ color: COLORS.champagne }}
                                              >
                                                {apt.title}
                                              </p>
                                              <p
                                                className="text-xs truncate"
                                                style={{ color: COLORS.bronze }}
                                              >
                                                {apt.client}
                                              </p>
                                              <div className="flex items-center gap-2 mt-1">
                                                <Badge
                                                  variant="secondary"
                                                  className="text-xs px-1 py-0 calendar-appointment-badge"
                                                  style={{
                                                    backgroundColor: `${apt.color}20`,
                                                    color: apt.color,
                                                    borderColor: apt.color
                                                  }}
                                                >
                                                  {apt.price}
                                                </Badge>
                                                {stylistInfo && (
                                                  <span
                                                    className="text-xs"
                                                    style={{ color: COLORS.bronze }}
                                                  >
                                                    {stylistInfo.name}
                                                  </span>
                                                )}
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
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })
                    : // Resource view mode
                      displayedStylists.map((stylist) => (
                        <div
                          key={stylist.id}
                          className="flex-1 min-w-[200px] border-r last:border-r-0"
                          style={{ borderColor: `${COLORS.gold}33` }}
                        >
                          {/* Stylist Header */}
                          <div
                            className="h-20 border-b px-2 py-2"
                            style={{
                              backgroundColor: `${COLORS.charcoal}DD`,
                              borderColor: `${COLORS.gold}33`
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className={cn('h-10 w-10', stylist.color)}>
                                <AvatarFallback className="text-foreground font-semibold">
                                  {stylist.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p
                                  className="text-sm font-semibold"
                                  style={{ color: COLORS.champagne }}
                                >
                                  {stylist.name}
                                </p>
                                <p className="text-xs" style={{ color: COLORS.bronze }}>
                                  {stylist.title}
                                </p>
                                {organizations.length > 0 && (
                                  <p className="text-xs" style={{ color: COLORS.bronze }}>
                                    {organizations
                                      .find(org => org.id === (stylist as any).branchId)
                                      ?.organization_name.split('•')[1]
                                      ?.trim() || 'Branch'}
                                  </p>
                                )}
                              </div>
                            </div>
                            <p className="text-xs mt-1" style={{ color: COLORS.bronze }}>
                              {stylist.businessHours
                                ? `${stylist.businessHours.start}:00 - ${stylist.businessHours.end}:00`
                                : 'Standard hours'}
                            </p>
                          </div>

                          {/* Time Slots for this stylist */}
                          <div>
                            {timeSlots.map((slot, slotIdx) => {
                              const slotAppointments = transformedAppointments.filter(
                                (apt: Appointment) =>
                                  apt.time === slot.time &&
                                  ((apt.stylist && apt.stylist === stylist.id) ||
                                    (!apt.stylist && stylist.id === 'unassigned')) &&
                                  apt.date.toDateString() === selectedDate.toDateString() &&
                                  (!selectedBranchId || apt.branchId === selectedBranchId)
                              )

                              const isBusinessHour = isWithinBusinessHours(stylist, slot.time)
                              const isDropTarget =
                                dropTarget &&
                                dropTarget.time === slot.time &&
                                dropTarget.stylistId === stylist.id

                              return (
                                <div
                                  key={`${stylist.id}-${slotIdx}`}
                                  className={cn(
                                    'h-16 border-b relative group calendar-time-slot',
                                    isBusinessHour && 'cursor-pointer',
                                    isDropTarget && 'calendar-drop-target ring-2'
                                  )}
                                  style={{
                                    borderColor: `${COLORS.gold}1A`,
                                    backgroundColor: !isBusinessHour
                                      ? `${COLORS.charcoal}66`
                                      : 'transparent'
                                  }}
                                  onClick={() => {
                                    if (!slotAppointments.length && isBusinessHour) {
                                      window.location.href = '/salon/appointments/new'
                                    }
                                  }}
                                  onDragOver={e =>
                                    isBusinessHour &&
                                    handleDragOver(e, selectedDate, slot.time, stylist.id)
                                  }
                                  onDrop={e =>
                                    isBusinessHour &&
                                    handleDrop(e, selectedDate, slot.time, stylist.id)
                                  }
                                  onDragLeave={() => setDropTarget(null)}
                                >
                                  {/* Non-business hour overlay */}
                                  {!isBusinessHour && (
                                    <div
                                      className="absolute inset-0 z-10"
                                      style={{ backgroundColor: `${COLORS.charcoal}66` }}
                                    />
                                  )}

                                  {/* Appointments */}
                                  {slotAppointments.map((apt: Appointment, aptIdx: number) => {
                                    const durationSlots = Math.ceil(
                                      apt.duration / BUSINESS_HOURS.slotDuration
                                    )

                                    return (
                                      <div
                                        key={apt.id}
                                        draggable
                                        onDragStart={e => handleDragStart(e, apt)}
                                        className={cn(
                                          'absolute inset-x-1 top-1 mx-1 rounded-md p-2 cursor-move',
                                          'calendar-appointment-card border-l-4',
                                          `appointment-${apt.service}`
                                        )}
                                        style={{
                                          backgroundColor: `${apt.color}15`,
                                          borderLeftColor: apt.color,
                                          height: `${durationSlots * 64 - 8}px`,
                                          zIndex: 5 + aptIdx
                                        }}
                                      >
                                        <AppointmentCard
                                          appointment={apt}
                                          stylist={stylist}
                                          compact
                                        />
                                      </div>
                                    )
                                  })}

                                  {/* Add appointment hint */}
                                  {!slotAppointments.length && isBusinessHour && (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Plus className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Appointment card component
function AppointmentCard({
  appointment,
  stylist,
  compact = false
}: {
  appointment: Appointment
  stylist?: Stylist
  compact?: boolean
}) {
  // Access COLORS from parent scope
  const COLORS = {
    champagne: '#F5E6C8',
    bronze: '#8C7853'
  }

  return (
    <div className="flex items-start gap-2">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-foreground text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: appointment.color }}
      >
        {appointment.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: COLORS.champagne }}>
          {appointment.title}
        </p>
        <p className="text-xs truncate" style={{ color: COLORS.bronze }}>
          {appointment.client}
        </p>
        {!compact && (
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="secondary"
              className="text-xs px-1 py-0 calendar-appointment-badge"
              style={{
                backgroundColor: `${appointment.color}20`,
                color: appointment.color,
                borderColor: appointment.color
              }}
            >
              {appointment.price}
            </Badge>
            {stylist && (
              <span className="text-xs" style={{ color: COLORS.bronze }}>
                {stylist.name}
              </span>
            )}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <MoreVertical className="w-3 h-3" />
      </Button>
    </div>
  )
}
