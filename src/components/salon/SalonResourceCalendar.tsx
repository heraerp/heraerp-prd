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
  AlertCircle,
  Building2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { useHeraAppointments } from '@/hooks/useHeraAppointments'
import { useHeraStaff } from '@/hooks/useHeraStaff'
import { useHeraCustomers } from '@/hooks/useHeraCustomers'
import { useHeraServices } from '@/hooks/useHeraServices'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { useStaffAvailability } from '@/hooks/useStaffAvailability'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

// 🎯 Debug flag - set to false for production
const DEBUG_MODE = false

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
  serviceNames?: string[] // ✨ Service names for display
  status: string
  price: string
  color: string
  colorLight?: string
  colorBorder?: string
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
  const mounted = useIsMounted()

  // ✅ Branch filter hook (same as appointments page)
  const {
    branchId,
    branches: filterBranches,
    loading: branchesLoading,
    setBranchId: setFilterBranchId,
    hasMultipleBranches
  } = useBranchFilter(organizationId, 'salon-calendar')

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

  // 🔍 Search state
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // 🕐 Current time state for timeline and past slot detection
  const [currentTime, setCurrentTime] = useState(new Date())

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
    error: appointmentsError,
    updateAppointment // ✨ Get update method for drag-and-drop
  } = useHeraAppointments({
    organizationId,
    filters: {
      ...(branchId && !canViewAllBranches ? { branch_id: branchId } : {}),
      date_from: dateRange.fromISO,
      date_to: dateRange.toISO
    }
  })

  // Debug: Log appointments data ONCE when loaded
  useEffect(() => {
    if (rawAppointments && rawAppointments.length > 0) {
      const firstApt = rawAppointments[0]
      console.log('📅 [Calendar] Appointments loaded:', rawAppointments.length, 'appointment(s)')
      console.log('📍 [Calendar] First appointment:', {
        date: new Date(firstApt.start_time).toDateString(),
        time: new Date(firstApt.start_time).toLocaleTimeString(),
        customer: firstApt.customer_name,
        stylist: firstApt.stylist_name
      })
      console.log('📆 [Calendar] Date range:', {
        from: dateRange.startDate,
        to: dateRange.endDate
      })
    }
  }, [rawAppointments, appointmentsLoading, appointmentsError, dateRange, organizationId, branchId])

  const { staff, isLoading: staffLoading } = useHeraStaff({
    organizationId,
    filters: {
      ...(branchId && !canViewAllBranches ? { branch_id: branchId } : {})
    }
  })

  const { customers, isLoading: customersLoading } = useHeraCustomers({
    organizationId
  })

  const { services, isLoading: servicesLoading } = useHeraServices({
    organizationId
  })

  // ✅ LAYER 1: Staff availability checking based on leave requests
  const {
    checkStaffAvailability,
    getUnavailableDates,
    isLoading: availabilityLoading,
    approvedLeaveRequests
  } = useStaffAvailability({
    organizationId,
    branchId: branchId || undefined
  })

  // Debug: Log leave requests ONCE when loaded
  useEffect(() => {
    if (approvedLeaveRequests && approvedLeaveRequests.length > 0) {
      console.log('🏖️ [Calendar] Leave requests loaded:', approvedLeaveRequests.length, 'staff on leave')
    }
  }, [approvedLeaveRequests, availabilityLoading, organizationId, branchId])

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

  // ✨ Enterprise-grade staff color palette (soft, aesthetic, professional)
  const STAFF_COLORS = [
    { bg: '#8B5CF6', light: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.4)' }, // Violet
    { bg: '#3B82F6', light: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)' }, // Blue
    { bg: '#EC4899', light: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.4)' }, // Pink
    { bg: '#F59E0B', light: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' }, // Amber
    { bg: '#14B8A6', light: 'rgba(20, 184, 166, 0.15)', border: 'rgba(20, 184, 166, 0.4)' }, // Teal
    { bg: '#F43F5E', light: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.4)' }, // Rose
    { bg: '#6366F1', light: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.4)' }, // Indigo
    { bg: '#10B981', light: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' }, // Emerald
    { bg: '#A855F7', light: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)' }, // Purple
    { bg: '#06B6D4', light: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.4)' } // Cyan
  ]

  // Helper function to get consistent staff color
  const getStaffColor = useCallback(
    (stylistId: string, index: number) => {
      return STAFF_COLORS[index % STAFF_COLORS.length]
    },
    [STAFF_COLORS]
  )

  // ✅ Transform HERA staff data to Stylist format
  const allStylists: (Stylist & { branchId: string })[] = useMemo(() => {
    if (!staff.length && !mounted) {
      // Return empty array for initial render to prevent hydration mismatch
      return []
    }

    // Map HERA staff data to Stylist format with enterprise colors
    return staff.map((s: any, index: number) => {
      const staffColor = getStaffColor(s.id, index)
      return {
        id: s.id,
        name: s.entity_name || 'Staff Member',
        title: s.role_title || 'Stylist', // ✅ Use role_title from dynamic fields
        avatar: s.entity_name?.charAt(0).toUpperCase() || 'S',
        color: `bg-[${staffColor.bg}]`, // Keep for compatibility
        staffColor: staffColor, // ✨ Enterprise color object
        available: s.metadata?.available !== false,
        status: s.metadata?.available === false ? 'away' : 'available',
        businessHours: { start: 9, end: 21 }, // ✅ 9 AM to 9 PM (same as appointments page)
        branchId: s.metadata?.branch_id || ''
      }
    })
  }, [staff, mounted, getStaffColor])

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

  // ✅ Transform HERA appointments to calendar format with staff colors and service names
  const transformedAppointments = useMemo(() => {
    if (!rawAppointments.length || !mounted) {
      // Return empty array for initial render to prevent hydration mismatch
      return []
    }

    const appointments = rawAppointments.map((apt: any) => {
      const startDate = new Date(apt.start_time)
      const time = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`

      // Customer and stylist info - use runtime lookup
      const customerName = customers?.find(c => c.id === apt.customer_id)?.entity_name || 'Walk-in Customer'
      const stylistId = apt.stylist_id || 'unassigned'

      // Get branch info from metadata
      const appointmentBranchId = apt.branch_id || ''

      // ✨ Find stylist and get their color
      const stylist = allStylists.find(s => s.id === stylistId) || allStylists[0] // fallback to unassigned
      const staffColor = stylist?.staffColor || {
        bg: '#6B7280',
        light: 'rgba(107, 114, 128, 0.15)',
        border: 'rgba(107, 114, 128, 0.4)'
      }

      // ✨ Get service names from service IDs (OPTIMIZED - no logging in production)
      const serviceIds = apt.metadata?.service_ids || []
      const serviceNames = Array.isArray(serviceIds)
        ? serviceIds
            .map((id: string) => {
              const service = services.find((s: any) => s.id === id)
              return service?.entity_name || service?.name
            })
            .filter(Boolean)
        : []

      return {
        id: apt.id,
        title: apt.entity_name || 'Appointment',
        client: customerName,
        stylist: stylistId,
        time,
        date: startDate,
        duration: apt.duration_minutes || 60,
        service: apt.metadata?.service_type || 'default',
        serviceNames, // ✨ Include service names for display
        status:
          apt.status === 'completed'
            ? 'completed'
            : apt.status === 'cancelled'
              ? 'tentative'
              : 'confirmed',
        price: `AED ${apt.total_amount || 0}`,
        color: staffColor.bg, // ✨ Use staff color instead of service color
        colorLight: staffColor.light,
        colorBorder: staffColor.border,
        icon: <Scissors className="w-3 h-3" />,
        station: `station-1`,
        branchId: appointmentBranchId
      }
    })

    // 🔍 Apply filters (status, service, date range) if any are active
    // For now, just return all appointments - filters can be added in future
    return appointments
  }, [rawAppointments, mounted, allStylists, services, customers])

  // 🔍 Search filtered appointments (MUST come after transformedAppointments)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []

    const query = searchQuery.toLowerCase().trim()
    return transformedAppointments.filter((apt: Appointment) => {
      const customerMatch = apt.client?.toLowerCase().includes(query)
      const serviceMatch = apt.serviceNames?.some((name: string) =>
        name.toLowerCase().includes(query)
      )
      const stylistMatch = stylists
        .find(s => s.id === apt.stylist)
        ?.name.toLowerCase()
        .includes(query)
      const timeMatch = apt.time.includes(query)
      const dateMatch = apt.date.toLocaleDateString().toLowerCase().includes(query)

      return customerMatch || serviceMatch || stylistMatch || timeMatch || dateMatch
    })
  }, [searchQuery, transformedAppointments, stylists])

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
      // ✨ ENTERPRISE MONTH VIEW: Full calendar grid with all weeks
      const year = selectedDate.getFullYear()
      const month = selectedDate.getMonth()

      // Get first day of month and last day of month
      const firstDayOfMonth = new Date(year, month, 1)
      const lastDayOfMonth = new Date(year, month + 1, 0)

      // Get the starting Sunday (could be from previous month)
      const startOfCalendar = new Date(firstDayOfMonth)
      startOfCalendar.setDate(startOfCalendar.getDate() - firstDayOfMonth.getDay())

      // Get the ending Saturday (could be from next month)
      const endOfCalendar = new Date(lastDayOfMonth)
      const daysToAdd = 6 - lastDayOfMonth.getDay()
      endOfCalendar.setDate(endOfCalendar.getDate() + daysToAdd)

      // Generate all dates for the calendar grid (typically 35 or 42 days)
      const currentDate = new Date(startOfCalendar)
      while (currentDate <= endOfCalendar) {
        dates.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
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

  // ✨ Calculate booking status for a time slot
  const getSlotBookingStatus = useCallback((slotAppointments: any[]) => {
    if (slotAppointments.length === 0) return 'available'
    if (slotAppointments.length >= 3) return 'fullyBooked' // 3+ appointments = fully booked
    if (slotAppointments.length >= 1) return 'partiallyBooked'
    return 'available'
  }, [])

  // 🕐 Check if a time slot is in the past
  const isTimeSlotPast = useCallback(
    (date: Date, timeString: string) => {
      const [hours, minutes] = timeString.split(':').map(Number)
      const slotDate = new Date(date)
      slotDate.setHours(hours || 0, minutes || 0, 0, 0)

      return slotDate < currentTime
    },
    [currentTime]
  )

  // 🕐 Calculate timeline position (in pixels from top of grid)
  const getTimelinePosition = useCallback(() => {
    const now = currentTime
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    // Only show timeline if current time is within business hours
    if (currentHour < BUSINESS_HOURS.start || currentHour >= BUSINESS_HOURS.end) {
      return null
    }

    // Calculate minutes since business start
    const minutesSinceStart =
      (currentHour - BUSINESS_HOURS.start) * 60 + currentMinute

    // Calculate which slot we're in and offset within that slot
    const slotIndex = Math.floor(minutesSinceStart / BUSINESS_HOURS.slotDuration)
    const minutesIntoSlot = minutesSinceStart % BUSINESS_HOURS.slotDuration

    // Each slot is 64px (h-16), calculate exact pixel position
    const SLOT_HEIGHT = 64 // h-16 in Tailwind
    const offsetWithinSlot = (minutesIntoSlot / BUSINESS_HOURS.slotDuration) * SLOT_HEIGHT

    // Return exact pixel position
    return slotIndex * SLOT_HEIGHT + offsetWithinSlot
  }, [currentTime])

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, appointment: Appointment) => {
    setDraggedAppointment(appointment)
    e.dataTransfer.effectAllowed = 'move'
    // Add visual feedback - set opacity on the dragged element
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
      e.currentTarget.style.cursor = 'grabbing'
    }
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

  // Handle drag end - reset visual feedback
  const handleDragEnd = useCallback((e: React.DragEvent) => {
    // Reset opacity on drag end
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
      e.currentTarget.style.cursor = 'move'
    }
    setDraggedAppointment(null)
    setDropTarget(null)
  }, [])

  // Handle drop - ✅ Using HERA RPC hook method
  const handleDrop = useCallback(
    async (e: React.DragEvent, date: Date, time: string, stylistId: string) => {
      e.preventDefault()
      if (!draggedAppointment || !updateAppointment) return

      const oldAppointment = draggedAppointment
      setDraggedAppointment(null)
      setDropTarget(null)

      try {
        // Calculate new start_time from date and time
        const [hours, minutes] = time.split(':').map(Number)
        const newStartTime = new Date(date)
        newStartTime.setHours(hours || 0, minutes || 0, 0, 0)

        // ✨ Use HERA RPC hook method to update the appointment
        await updateAppointment({
          id: oldAppointment.id,
          data: {
            stylist_id: stylistId,
            start_time: newStartTime.toISOString(),
            duration_minutes: oldAppointment.duration
          }
        })

        // Only log in debug mode
        if (DEBUG_MODE) {
          console.log('✅ Appointment moved successfully:', {
            appointmentId: oldAppointment.id,
            newStylist: stylists.find(s => s.id === stylistId)?.name,
            newTime: newStartTime.toLocaleString()
          })
        }

        // ✅ Hook automatically refetches data - no manual reload needed!
      } catch (error) {
        console.error('❌ Failed to move appointment:', error)
        alert('Failed to move appointment. Please try again.')
      }
    },
    [draggedAppointment, stylists, updateAppointment]
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
          setSelectedDate(newDate)
          break
        case 'Home':
          e.preventDefault()
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

  // 🕐 Update current time every minute for timeline accuracy
  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(new Date())

    // Update immediately
    updateCurrentTime()

    // Update every minute
    const intervalId = setInterval(updateCurrentTime, 60000) // 60000ms = 1 minute

    return () => clearInterval(intervalId)
  }, [])

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

  // Define luxury color palette with soft aesthetic booking status colors
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
    lightText: '#E0E0E0',
    // ✨ Soft aesthetic booking status colors
    available: {
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.25)',
      text: '#34D399',
      glow: 'rgba(16, 185, 129, 0.15)'
    },
    partiallyBooked: {
      bg: 'rgba(251, 191, 36, 0.08)',
      border: 'rgba(251, 191, 36, 0.25)',
      text: '#FBBF24',
      glow: 'rgba(251, 191, 36, 0.15)'
    },
    fullyBooked: {
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.25)',
      text: '#F87171',
      glow: 'rgba(239, 68, 68, 0.15)'
    },
    offHours: {
      bg: 'rgba(107, 114, 128, 0.05)',
      border: 'rgba(107, 114, 128, 0.15)',
      text: '#9CA3AF',
      glow: 'rgba(107, 114, 128, 0.1)'
    }
  }

  return (
    <div
      className={cn(
        'relative flex h-[800px] rounded-lg overflow-hidden calendar-fade-in',
        className
      )}
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
            {/* Branch Filter - Moved to top */}
            {hasMultipleBranches && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
                    Branch
                  </h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSidebar(false)}
                    className="hover:opacity-80 h-6 w-6"
                    style={{ color: COLORS.bronze }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Select
                  value={branchId || '__ALL__'}
                  onValueChange={value => setFilterBranchId(value === '__ALL__' ? '' : value)}
                >
                  <SelectTrigger
                    className="w-full transition-all duration-300"
                    style={{
                      background: `${COLORS.charcoal}80`,
                      border: `1px solid ${COLORS.bronze}20`,
                      color: COLORS.gold
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      <SelectValue placeholder="All Locations" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="hera-select-content">
                    <SelectItem value="__ALL__">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3" />
                        <span>All Locations</span>
                        <span
                          className="text-xs ml-auto"
                          style={{ color: `${COLORS.bronze}80` }}
                        >
                          {filterBranches.length}{' '}
                          {filterBranches.length === 1 ? 'branch' : 'branches'}
                        </span>
                      </div>
                    </SelectItem>
                    {branchesLoading ? (
                      <SelectItem value="__LOADING__" disabled>
                        Loading...
                      </SelectItem>
                    ) : (
                      filterBranches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{branch.name || 'Unnamed Branch'}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Close button for single branch case */}
            {!hasMultipleBranches && (
              <div className="flex items-center justify-end mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(false)}
                  className="hover:opacity-80 h-6 w-6"
                  style={{ color: COLORS.bronze }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

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
                <span
                  className="text-sm font-semibold tracking-wide"
                  style={{ color: COLORS.champagne }}
                >
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
                          dayIsToday &&
                            'calendar-mini-today ring-2 ring-offset-1 font-bold shadow-md',
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
                          'calendar-avatar-status transition-all duration-300'
                        )}
                        style={{
                          backgroundColor:
                            stylist.status === 'available'
                              ? COLORS.available.text
                              : stylist.status === 'busy'
                                ? COLORS.fullyBooked.text
                                : COLORS.offHours.text,
                          boxShadow:
                            stylist.status === 'available'
                              ? `0 0 8px ${COLORS.available.glow}`
                              : stylist.status === 'busy'
                                ? `0 0 8px ${COLORS.fullyBooked.glow}`
                                : `0 0 4px ${COLORS.offHours.glow}`
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                        {stylist.name}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn('text-xs transition-all duration-300 font-medium')}
                      style={{
                        backgroundColor: stylist.available
                          ? COLORS.available.bg
                          : COLORS.offHours.bg,
                        color: stylist.available ? COLORS.available.text : COLORS.offHours.text,
                        border: `1px solid ${stylist.available ? COLORS.available.border : COLORS.offHours.border}`,
                        boxShadow: `0 2px 8px ${stylist.available ? COLORS.available.glow : COLORS.offHours.glow}`
                      }}
                    >
                      {stylist.available ? '✨ Available' : '💤 Away'}
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
                  onClick={() => setShowSearchModal(true)}
                  title="Search appointments"
                >
                  <Search className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid - Single Scroll Container */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full w-full calendar-scrollbar">
            <div
              className="grid"
              style={{
                gridTemplateColumns:
                  selectedView === 'month'
                    ? `repeat(7, 1fr)` // Month view: 7 equal columns for days of week
                    : selectedView === 'week'
                      ? `80px repeat(7, 1fr)` // Week view: time column + 7 day columns
                      : viewMode === 'single'
                        ? `80px repeat(${viewDates.length}, 1fr)`
                        : `80px repeat(${displayedStylists.length}, 1fr)`,
                minHeight: selectedView === 'month' ? 'auto' : `${timeSlots.length * 64}px`
              }}
            >
              {/* ✨ ENTERPRISE MONTH VIEW GRID */}
              {selectedView === 'month' ? (
                <>
                  {/* Month View: Day of week headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, idx) => (
                    <div
                      key={dayName}
                      className="sticky top-0 z-10 text-center py-3 border-b"
                      style={{
                        backgroundColor: `${COLORS.charcoal}DD`,
                        borderColor: `${COLORS.gold}33`,
                        gridColumn: `${idx + 1}`
                      }}
                    >
                      <p className="text-sm font-bold uppercase tracking-wider" style={{ color: COLORS.gold }}>
                        {dayName}
                      </p>
                    </div>
                  ))}

                  {/* Month View: Date cells */}
                  {viewDates.map((date, idx) => {
                    const { dayNumber, isToday } = formatDateHeader(date)
                    const isCurrentMonth = date.getMonth() === selectedDate.getMonth()

                    // Get appointments for this day
                    const dayAppointments = transformedAppointments.filter(
                      (apt: Appointment) => {
                        const dateMatch = apt.date.toDateString() === date.toDateString()
                        const stylistMatch = selectedStylists.includes('all') || selectedStylists.includes(apt.stylist || 'unassigned')
                        const branchMatch = !hasMultipleBranches || !branchId || branchId === '' || branchId === '__ALL__' || apt.branchId === branchId

                        // Debug: Log when appointment SHOULD show
                        if (apt === transformedAppointments[0] && dateMatch && stylistMatch && branchMatch) {
                          console.log('✅ [Calendar] Appointment will show on:', date.toDateString())
                        }

                        return dateMatch && stylistMatch && branchMatch
                      }
                    )

                    return (
                      <div
                        key={idx}
                        className={cn(
                          'min-h-[120px] p-2 border-b border-r transition-all duration-200 cursor-pointer hover:scale-[1.01]',
                          isToday && 'ring-2 ring-inset',
                          !isCurrentMonth && 'opacity-40'
                        )}
                        style={{
                          backgroundColor: isToday ? `${COLORS.gold}08` : COLORS.charcoal,
                          borderColor: `${COLORS.gold}${isCurrentMonth ? '33' : '15'}`,
                          ringColor: COLORS.gold
                        }}
                        onClick={() => {
                          setSelectedDate(date)
                          setSelectedView('day')
                        }}
                        onMouseEnter={(e) => {
                          if (!isToday) {
                            e.currentTarget.style.backgroundColor = `${COLORS.gold}05`
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isToday) {
                            e.currentTarget.style.backgroundColor = COLORS.charcoal
                          }
                        }}
                      >
                        {/* Date number */}
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={cn('text-sm font-bold', isToday && 'text-lg')}
                            style={{
                              color: isToday ? COLORS.gold : isCurrentMonth ? COLORS.champagne : COLORS.bronze
                            }}
                          >
                            {dayNumber}
                          </span>
                          {dayAppointments.length > 0 && (
                            <Badge
                              variant="secondary"
                              className="text-xs h-5 px-2"
                              style={{
                                backgroundColor: `${COLORS.gold}20`,
                                color: COLORS.gold,
                                border: `1px solid ${COLORS.gold}40`
                              }}
                            >
                              {dayAppointments.length}
                            </Badge>
                          )}
                        </div>

                        {/* Appointments list (max 3 shown) */}
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 3).map((apt: Appointment) => (
                            <div
                              key={apt.id}
                              className="text-xs p-1 rounded truncate"
                              style={{
                                backgroundColor: apt.colorLight,
                                borderLeft: `2px solid ${apt.color}`,
                                color: COLORS.champagne
                              }}
                              title={`${apt.time} - ${apt.client} - ${apt.serviceNames?.join(', ') || apt.service}`}
                            >
                              <span className="font-semibold">{apt.time}</span> {apt.client}
                            </div>
                          ))}
                          {dayAppointments.length > 3 && (
                            <p className="text-xs text-center" style={{ color: COLORS.bronze }}>
                              +{dayAppointments.length - 3} more
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </>
              ) : selectedView === 'week' ? (
                <>
                  {/* Week View: Time column header (empty cell) */}
                  <div
                    className="sticky top-0 z-10"
                    style={{
                      gridColumn: '1',
                      backgroundColor: `${COLORS.charcoal}CC`,
                      borderRight: `1px solid ${COLORS.gold}33`,
                      borderBottom: `1px solid ${COLORS.gold}33`,
                      height: '80px'
                    }}
                  />

                  {/* Week View: Day headers with dates */}
                  {viewDates.map((date, dayIdx) => {
                    const { dayName, dayNumber, isToday } = formatDateHeader(date)
                    return (
                      <div
                        key={dayIdx}
                        className="sticky top-0 z-10 text-center py-3 border-b border-r"
                        style={{
                          gridColumn: `${dayIdx + 2}`,
                          backgroundColor: isToday ? `${COLORS.gold}15` : `${COLORS.charcoal}DD`,
                          borderColor: `${COLORS.gold}33`,
                          height: '80px'
                        }}
                      >
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: isToday ? COLORS.gold : COLORS.bronze }}>
                          {dayName}
                        </p>
                        <p className="text-2xl font-extrabold mt-1" style={{ color: isToday ? COLORS.gold : COLORS.champagne }}>
                          {dayNumber}
                        </p>
                      </div>
                    )
                  })}

                  {/* Week View: Time Slots Grid - Each row contains time cell + day cells */}
                  {timeSlots.map((slot, slotIdx) => (
                    <React.Fragment key={slot.time}>
                      {/* Time Cell (First Column) */}
                      <div
                        className="h-16 border-b px-2 py-1"
                        style={{
                          gridColumn: '1',
                          gridRow: `${slotIdx + 2}`,
                          backgroundColor: `${COLORS.charcoal}CC`,
                          borderRight: `1px solid ${COLORS.gold}33`,
                          borderBottom: `1px solid ${COLORS.gold}1A`
                        }}
                      >
                        <span className="text-xs font-semibold" style={{ color: COLORS.bronze }}>
                          {slot.displayTime}
                        </span>
                      </div>

                      {/* Day cells with time slot appointments */}
                      {viewDates.map((date, dayIdx) => {
                        const { isToday } = formatDateHeader(date)

                        const slotAppointments = transformedAppointments.filter(
                          (apt: Appointment) =>
                            apt.time === slot.time &&
                            apt.date.toDateString() === date.toDateString() &&
                            (selectedStylists.includes('all') || selectedStylists.includes(apt.stylist || 'unassigned')) &&
                            (!hasMultipleBranches || !branchId || branchId === '' || branchId === '__ALL__' || apt.branchId === branchId)
                        )

                        const isPast = isTimeSlotPast(date, slot.time)

                        return (
                          <div
                            key={`${dayIdx}-${slotIdx}`}
                            className={cn(
                              'h-16 border-b border-r relative group calendar-time-slot transition-all duration-200',
                              !isPast && 'cursor-pointer',
                              isPast && 'pointer-events-none'
                            )}
                            style={{
                              gridColumn: `${dayIdx + 2}`,
                              gridRow: `${slotIdx + 2}`,
                              borderRight: `1px solid ${COLORS.gold}33`,
                              borderBottom: `1px solid ${COLORS.gold}1A`,
                              backgroundColor: isPast
                                ? 'rgba(107, 114, 128, 0.15)'
                                : isToday
                                  ? `${COLORS.gold}03`
                                  : 'transparent',
                              opacity: isPast ? 0.4 : 1
                            }}
                            onClick={() => {
                              if (!slotAppointments.length && !isPast) {
                                window.location.href = '/salon/appointments/new'
                              }
                            }}
                            onMouseEnter={e => {
                              if (!slotAppointments.length && !isPast) {
                                e.currentTarget.style.backgroundColor = `${COLORS.gold}08`
                                e.currentTarget.style.borderLeft = `2px solid ${COLORS.gold}60`
                                e.currentTarget.style.boxShadow = `inset 0 0 12px ${COLORS.gold}15, 0 2px 8px ${COLORS.gold}10`
                                e.currentTarget.style.transform = 'scale(1.01)'
                              }
                            }}
                            onMouseLeave={e => {
                              if (!isPast) {
                                e.currentTarget.style.backgroundColor = isToday ? `${COLORS.gold}03` : 'transparent'
                                e.currentTarget.style.borderLeft = 'none'
                                e.currentTarget.style.boxShadow = 'none'
                                e.currentTarget.style.transform = 'scale(1)'
                              }
                            }}
                          >
                            {/* 🕐 Timeline Indicator (only for today's column) */}
                            {isToday && slotIdx === 0 && getTimelinePosition() !== null && (
                              <div
                                className="absolute left-0 right-0 z-20 pointer-events-none"
                                style={{
                                  top: `${getTimelinePosition()}px`
                                }}
                              >
                                <div
                                  className="absolute left-0 w-3 h-3 rounded-full animate-pulse"
                                  style={{
                                    backgroundColor: COLORS.gold,
                                    boxShadow: `0 0 12px ${COLORS.gold}`,
                                    transform: 'translate(-50%, -50%)'
                                  }}
                                />
                                <div
                                  className="h-0.5 w-full"
                                  style={{
                                    backgroundColor: COLORS.gold,
                                    boxShadow: `0 0 8px ${COLORS.gold}80`,
                                    transform: 'translateY(-50%)'
                                  }}
                                />
                              </div>
                            )}

                            {/* Appointments */}
                            {slotAppointments.map((apt: Appointment, aptIdx: number) => {
                              const durationSlots = Math.ceil(
                                apt.duration / BUSINESS_HOURS.slotDuration
                              )
                              const stylistInfo = stylists.find(s => s.id === apt.stylist)

                              return (
                                <div
                                  key={apt.id}
                                  className={cn(
                                    'absolute inset-x-1 top-1 mx-1 rounded-lg p-2 cursor-pointer',
                                    'calendar-appointment-card transition-all duration-200'
                                  )}
                                  style={{
                                    backgroundColor: apt.colorLight || `${apt.color}15`,
                                    borderLeft: `4px solid ${apt.color}`,
                                    border: `1px solid ${apt.colorBorder || `${apt.color}40`}`,
                                    height: `${durationSlots * 64 - 8}px`,
                                    zIndex: 5 + aptIdx,
                                    boxShadow: `0 2px 8px ${apt.colorLight || 'rgba(0,0,0,0.1)'}`
                                  }}
                                  onClick={() => {
                                    setSelectedDate(apt.date)
                                    setSelectedView('day')
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = `0 6px 16px ${apt.colorBorder || 'rgba(0,0,0,0.2)'}`
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = `0 2px 8px ${apt.colorLight || 'rgba(0,0,0,0.1)'}`
                                  }}
                                >
                                  {/* Compact appointment card for week view */}
                                  <div className="flex items-start gap-1">
                                    <div
                                      className="w-5 h-5 rounded-full flex items-center justify-center text-foreground text-xs font-bold flex-shrink-0"
                                      style={{ backgroundColor: apt.color }}
                                    >
                                      {apt.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p
                                        className="text-xs font-semibold truncate"
                                        style={{ color: COLORS.champagne }}
                                      >
                                        {apt.client}
                                      </p>
                                      {apt.serviceNames && apt.serviceNames.length > 0 && (
                                        <p
                                          className="text-xs truncate"
                                          style={{ color: COLORS.gold, opacity: 0.8 }}
                                          title={apt.serviceNames.join(', ')}
                                        >
                                          {apt.serviceNames[0]}
                                        </p>
                                      )}
                                      {stylistInfo && (
                                        <p className="text-xs truncate" style={{ color: COLORS.bronze }}>
                                          {stylistInfo.name}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}

                            {/* Add appointment hint */}
                            {!slotAppointments.length && !isPast && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </>
              ) : (
                <>
                  {/* ✨ DAY VIEW: Time-based grid with detailed appointments */}
                  {/* Sticky Header Row */}
                  <div
                    className="sticky top-0 z-10"
                    style={{
                      gridColumn: '1',
                      backgroundColor: `${COLORS.charcoal}CC`,
                      borderRight: `1px solid ${COLORS.gold}33`,
                      borderBottom: `1px solid ${COLORS.gold}33`,
                      height: viewMode === 'resource' ? '80px' : '56px'
                    }}
                  />

                  {viewMode === 'single'
                ? // Single view headers (dates)
                  viewDates.map((date, dayIdx) => {
                    const { dayName, dayNumber, isToday } = formatDateHeader(date)
                    return (
                      <div
                        key={dayIdx}
                        className="sticky top-0 z-10 text-center py-2"
                        style={{
                          gridColumn: `${dayIdx + 2}`,
                          backgroundColor: isToday ? `${COLORS.gold}0D` : COLORS.charcoal,
                          borderRight: `1px solid ${COLORS.gold}33`,
                          borderBottom: `1px solid ${COLORS.gold}33`,
                          height: '56px'
                        }}
                      >
                        <p
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: isToday ? COLORS.gold : COLORS.bronze }}
                        >
                          {dayName}
                        </p>
                        <p
                          className="text-xl font-extrabold"
                          style={{ color: isToday ? COLORS.gold : COLORS.champagne }}
                        >
                          {dayNumber}
                        </p>
                      </div>
                    )
                  })
                : // Resource view headers (stylists)
                  displayedStylists.map((stylist, idx) => {
                    // ✅ Check if staff is on leave for the selected date
                    const dateToCheck = viewMode === 'resource' && viewDates.length > 0
                      ? viewDates[0].toISOString().split('T')[0]
                      : selectedDate.toISOString().split('T')[0]
                    const availability = checkStaffAvailability(stylist.id, dateToCheck, 'full_day')
                    const isOnLeave = !availability.isAvailable

                    return (
                      <div
                        key={stylist.id}
                        className="sticky top-0 z-10 px-2 py-2"
                        style={{
                          gridColumn: `${idx + 2}`,
                          backgroundColor: `${COLORS.charcoal}DD`,
                          borderRight: `1px solid ${COLORS.gold}33`,
                          borderBottom: `1px solid ${COLORS.gold}33`,
                          height: '80px'
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className={cn('h-10 w-10', stylist.color)}>
                            <AvatarFallback className="text-foreground font-semibold">
                              {stylist.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
                              {stylist.name}
                            </p>
                            {isOnLeave && (
                              <Badge
                                className="text-[9px] px-1.5 py-0 mt-1"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.2)',
                                  color: '#EF4444',
                                  border: '1px solid rgba(239, 68, 68, 0.3)'
                                }}
                              >
                                ON LEAVE
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

              {/* Time Slots Grid - Each row contains time cell + resource cells */}
              {timeSlots.map((slot, slotIdx) => (
                <React.Fragment key={slot.time}>
                  {/* Time Cell (First Column) */}
                  <div
                    className="h-16 border-b px-2 py-1"
                    style={{
                      gridColumn: '1',
                      gridRow: `${slotIdx + 2}`,
                      backgroundColor: `${COLORS.charcoal}CC`,
                      borderRight: `1px solid ${COLORS.gold}33`,
                      borderBottom: `1px solid ${COLORS.gold}1A`
                    }}
                  >
                    <span className="text-xs font-semibold" style={{ color: COLORS.bronze }}>
                      {slot.displayTime}
                    </span>
                  </div>

                  {viewMode === 'single'
                    ? // Single view - Resource cells for each date
                      viewDates.map((date, dayIdx) => {
                        const slotAppointments = transformedAppointments.filter(
                          (apt: Appointment) =>
                            apt.time === slot.time &&
                            apt.date.toDateString() === date.toDateString() &&
                            (selectedStylists.includes('all') ||
                              selectedStylists.includes(apt.stylist || 'unassigned')) &&
                            (!hasMultipleBranches ||
                              !branchId ||
                              branchId === '' ||
                              branchId === '__ALL__' ||
                              apt.branchId === branchId)
                        )

                        const isPast = isTimeSlotPast(date, slot.time)
                        const { isToday } = formatDateHeader(date)

                        return (
                          <div
                            key={`${dayIdx}-${slotIdx}`}
                            className={cn(
                              'h-16 border-b relative group calendar-time-slot transition-all duration-200',
                              !isPast && 'cursor-pointer',
                              isPast && 'pointer-events-none'
                            )}
                            style={{
                              gridColumn: `${dayIdx + 2}`,
                              gridRow: `${slotIdx + 2}`,
                              borderRight: `1px solid ${COLORS.gold}33`,
                              borderBottom: `1px solid ${COLORS.gold}1A`,
                              backgroundColor: isPast
                                ? 'rgba(107, 114, 128, 0.15)'
                                : 'transparent',
                              opacity: isPast ? 0.4 : 1
                            }}
                            onClick={() => {
                              if (!slotAppointments.length && !isPast) {
                                window.location.href = '/salon/appointments/new'
                              }
                            }}
                            onMouseEnter={e => {
                              if (!slotAppointments.length && !isPast) {
                                e.currentTarget.style.backgroundColor = `${COLORS.gold}08`
                                e.currentTarget.style.borderLeft = `2px solid ${COLORS.gold}60`
                                e.currentTarget.style.boxShadow = `inset 0 0 12px ${COLORS.gold}15, 0 2px 8px ${COLORS.gold}10`
                                e.currentTarget.style.transform = 'scale(1.01)'
                              }
                            }}
                            onMouseLeave={e => {
                              if (!isPast) {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                e.currentTarget.style.borderLeft = 'none'
                                e.currentTarget.style.boxShadow = 'none'
                                e.currentTarget.style.transform = 'scale(1)'
                              }
                            }}
                          >
                            {/* 🕐 Timeline Indicator (only for today's column) */}
                            {isToday && slotIdx === 0 && getTimelinePosition() !== null && (
                              <div
                                className="absolute left-0 right-0 z-20 pointer-events-none"
                                style={{
                                  top: `${getTimelinePosition()}px`
                                }}
                              >
                                <div
                                  className="absolute left-0 w-3 h-3 rounded-full animate-pulse"
                                  style={{
                                    backgroundColor: COLORS.gold,
                                    boxShadow: `0 0 12px ${COLORS.gold}`,
                                    transform: 'translate(-50%, -50%)'
                                  }}
                                />
                                <div
                                  className="h-0.5 w-full"
                                  style={{
                                    backgroundColor: COLORS.gold,
                                    boxShadow: `0 0 8px ${COLORS.gold}80`,
                                    transform: 'translateY(-50%)'
                                  }}
                                />
                              </div>
                            )}

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
                                  onDragEnd={handleDragEnd}
                                  className={cn(
                                    'absolute inset-x-1 top-1 mx-1 rounded-lg p-2.5 cursor-move',
                                    'calendar-appointment-card transition-all duration-200'
                                  )}
                                  style={{
                                    backgroundColor: apt.colorLight || `${apt.color}15`,
                                    borderLeft: `4px solid ${apt.color}`,
                                    border: `1px solid ${apt.colorBorder || `${apt.color}40`}`,
                                    height: `${durationSlots * 64 - 8}px`,
                                    zIndex: 5 + aptIdx,
                                    boxShadow: `0 2px 8px ${apt.colorLight || 'rgba(0,0,0,0.1)'}`
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = `0 6px 16px ${apt.colorBorder || 'rgba(0,0,0,0.2)'}`
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = `0 2px 8px ${apt.colorLight || 'rgba(0,0,0,0.1)'}`
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
                                      {apt.serviceNames && apt.serviceNames.length > 0 && (
                                        <p
                                          className="text-xs truncate mt-0.5"
                                          style={{ color: COLORS.gold, opacity: 0.8 }}
                                          title={apt.serviceNames.join(', ')}
                                        >
                                          {apt.serviceNames.join(', ')}
                                        </p>
                                      )}
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
                      })
                    : // Resource view - Stylist cells
                      displayedStylists.map((stylist, stylistIdx) => {
                        const slotAppointments = transformedAppointments.filter(
                          (apt: Appointment) =>
                            apt.time === slot.time &&
                            apt.stylist &&
                            apt.stylist === stylist.id &&
                            apt.date.toDateString() === selectedDate.toDateString() &&
                            (!hasMultipleBranches ||
                              !branchId ||
                              branchId === '' ||
                              branchId === '__ALL__' ||
                              apt.branchId === branchId)
                        )

                        const isBusinessHour = isWithinBusinessHours(stylist, slot.time)
                        const isPast = isTimeSlotPast(selectedDate, slot.time)
                        const isDropTarget =
                          dropTarget &&
                          dropTarget.time === slot.time &&
                          dropTarget.stylistId === stylist.id

                        return (
                          <div
                            key={`${stylist.id}-${slotIdx}`}
                            className={cn(
                              'h-16 border-b relative group calendar-time-slot transition-all duration-200',
                              isBusinessHour && !isPast && 'cursor-pointer',
                              isDropTarget && 'calendar-drop-target ring-2',
                              isPast && 'pointer-events-none'
                            )}
                            style={{
                              gridColumn: `${stylistIdx + 2}`,
                              gridRow: `${slotIdx + 2}`,
                              borderRight: `1px solid ${COLORS.gold}33`,
                              borderBottom: `1px solid ${COLORS.gold}1A`,
                              backgroundColor: !isBusinessHour
                                ? `${COLORS.charcoal}66`
                                : isPast
                                  ? 'rgba(107, 114, 128, 0.15)'
                                  : 'transparent',
                              opacity: isPast ? 0.4 : 1
                            }}
                            onClick={() => {
                              if (!slotAppointments.length && isBusinessHour && !isPast) {
                                window.location.href = '/salon/appointments/new'
                              }
                            }}
                            onMouseEnter={e => {
                              if (isBusinessHour && !slotAppointments.length && !isPast) {
                                e.currentTarget.style.backgroundColor = `${COLORS.gold}08`
                                e.currentTarget.style.borderLeft = `2px solid ${COLORS.gold}60`
                                e.currentTarget.style.boxShadow = `inset 0 0 12px ${COLORS.gold}15, 0 2px 8px ${COLORS.gold}10`
                                e.currentTarget.style.transform = 'scale(1.01)'
                              }
                            }}
                            onMouseLeave={e => {
                              if (isBusinessHour && !isPast) {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                e.currentTarget.style.borderLeft = 'none'
                                e.currentTarget.style.boxShadow = 'none'
                                e.currentTarget.style.transform = 'scale(1)'
                              }
                            }}
                            onDragOver={e =>
                              isBusinessHour &&
                              handleDragOver(e, selectedDate, slot.time, stylist.id)
                            }
                            onDrop={e =>
                              isBusinessHour && handleDrop(e, selectedDate, slot.time, stylist.id)
                            }
                            onDragLeave={() => setDropTarget(null)}
                          >
                            {/* 🕐 Timeline Indicator (only for today and first slot) */}
                            {selectedDate.toDateString() === new Date().toDateString() &&
                              slotIdx === 0 &&
                              getTimelinePosition() !== null && (
                                <div
                                  className="absolute left-0 right-0 z-20 pointer-events-none"
                                  style={{
                                    top: `${getTimelinePosition()}px`
                                  }}
                                >
                                  <div
                                    className="absolute left-0 w-3 h-3 rounded-full animate-pulse"
                                    style={{
                                      backgroundColor: COLORS.gold,
                                      boxShadow: `0 0 12px ${COLORS.gold}`,
                                      transform: 'translate(-50%, -50%)'
                                    }}
                                  />
                                  <div
                                    className="h-0.5 w-full"
                                    style={{
                                      backgroundColor: COLORS.gold,
                                      boxShadow: `0 0 8px ${COLORS.gold}80`,
                                      transform: 'translateY(-50%)'
                                    }}
                                  />
                                </div>
                              )}

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
                                  onDragEnd={handleDragEnd}
                                  className={cn(
                                    'absolute inset-x-1 top-1 mx-1 rounded-lg p-2.5 cursor-move',
                                    'calendar-appointment-card transition-all duration-200'
                                  )}
                                  style={{
                                    backgroundColor: apt.colorLight || `${apt.color}15`,
                                    borderLeft: `4px solid ${apt.color}`,
                                    border: `1px solid ${apt.colorBorder || `${apt.color}40`}`,
                                    height: `${durationSlots * 64 - 8}px`,
                                    zIndex: 5 + aptIdx,
                                    boxShadow: `0 2px 8px ${apt.colorLight || 'rgba(0,0,0,0.1)'}`
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = `0 6px 16px ${apt.colorBorder || 'rgba(0,0,0,0.2)'}`
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = `0 2px 8px ${apt.colorLight || 'rgba(0,0,0,0.1)'}`
                                  }}
                                >
                                  <AppointmentCard appointment={apt} stylist={stylist} compact />
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
                </React.Fragment>
              ))}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* 🔍 Search Modal */}
      <Dialog open={showSearchModal} onOpenChange={setShowSearchModal}>
        <DialogContent
          className="max-w-2xl"
          style={{
            backgroundColor: COLORS.charcoal,
            borderColor: `${COLORS.gold}40`,
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: COLORS.champagne }}>
              Search Appointments
            </DialogTitle>
            <DialogDescription style={{ color: COLORS.bronze }}>
              Search by customer name, service, stylist, date or time
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                style={{ color: COLORS.bronze }}
              />
              <Input
                type="text"
                placeholder="Start typing to search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-11 text-base"
                style={{
                  backgroundColor: COLORS.black,
                  borderColor: `${COLORS.gold}40`,
                  color: COLORS.champagne
                }}
                autoFocus
              />
            </div>

            {/* Search Results */}
            <div
              className="max-h-[400px] overflow-y-auto rounded-lg"
              style={{
                backgroundColor: COLORS.black,
                border: `1px solid ${COLORS.gold}20`
              }}
            >
              {searchQuery.trim() === '' ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: COLORS.bronze }} />
                  <p className="text-sm" style={{ color: COLORS.bronze }}>
                    Start typing to search appointments
                  </p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: COLORS.rose }} />
                  <p className="font-medium mb-1" style={{ color: COLORS.champagne }}>
                    No appointments found
                  </p>
                  <p className="text-sm" style={{ color: COLORS.bronze }}>
                    Try a different search term
                  </p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: `${COLORS.gold}20` }}>
                  {searchResults.map((apt: Appointment) => {
                    const stylistInfo = stylists.find(s => s.id === apt.stylist)
                    return (
                      <div
                        key={apt.id}
                        className="p-4 cursor-pointer transition-all duration-200"
                        style={{
                          backgroundColor: 'transparent'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = `${COLORS.gold}08`
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                        onClick={() => {
                          // Navigate to the appointment's date
                          setSelectedDate(apt.date)
                          setSelectedView('day')
                          setShowSearchModal(false)
                          setSearchQuery('')
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: apt.color }}
                          >
                            {apt.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold" style={{ color: COLORS.champagne }}>
                                {apt.client}
                              </p>
                              <Badge
                                variant="outline"
                                className="text-xs"
                                style={{
                                  backgroundColor: `${apt.color}20`,
                                  color: apt.color,
                                  borderColor: apt.color
                                }}
                              >
                                {apt.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm" style={{ color: COLORS.bronze }}>
                              <span>📅 {apt.date.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}</span>
                              <span>🕐 {apt.time}</span>
                              {stylistInfo && <span>👤 {stylistInfo.name}</span>}
                            </div>
                            {apt.serviceNames && apt.serviceNames.length > 0 && (
                              <p className="text-sm mt-1" style={{ color: COLORS.gold, opacity: 0.8 }}>
                                {apt.serviceNames.join(', ')}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant="secondary"
                                className="text-xs"
                                style={{
                                  backgroundColor: `${COLORS.gold}20`,
                                  color: COLORS.gold,
                                  borderColor: `${COLORS.gold}40`
                                }}
                              >
                                {apt.price}
                              </Badge>
                              <span className="text-xs" style={{ color: COLORS.bronze }}>
                                {apt.duration} min
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Results Count */}
            {searchQuery.trim() !== '' && searchResults.length > 0 && (
              <p className="text-sm text-center" style={{ color: COLORS.bronze }}>
                Found {searchResults.length} appointment{searchResults.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
    bronze: '#8C7853',
    gold: '#D4AF37'
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
        {/* ✨ Display service names */}
        {appointment.serviceNames && appointment.serviceNames.length > 0 && (
          <p
            className="text-xs truncate mt-0.5"
            style={{ color: COLORS.gold, opacity: 0.8 }}
            title={appointment.serviceNames.join(', ')}
          >
            {appointment.serviceNames.join(', ')}
          </p>
        )}
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
