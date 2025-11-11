'use client'

import React, { useState, useMemo, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import ReactDOM from 'react-dom'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  AlertTriangle,
  Info,
  Building2,
  Clock,
  Calendar,
  UserCheck,
  DollarSign,
  CheckCircle,
  XCircle,
  FileEdit
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { useHeraAppointments, STATUS_CONFIG } from '@/hooks/useHeraAppointments'
import { useHeraStaff } from '@/hooks/useHeraStaff'
import { useHeraCustomers } from '@/hooks/useHeraCustomers'
import { useHeraServices } from '@/hooks/useHeraServices'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { useStaffAvailability } from '@/hooks/useStaffAvailability'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
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

// 🚀 LAZY LOADING: Appointment modal component
const AppointmentModal = lazy(() =>
  import('@/components/salon/appointments/AppointmentModal').then(module => ({
    default: module.AppointmentModal
  }))
)

// 🎨 LUXE: Import Salon theme components
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'

// 🎯 Debug flag - set to false for production
const DEBUG_MODE = true

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
  rawStatus?: string // ✅ Original database status
  price: string
  color: string
  colorLight?: string
  colorBorder?: string
  icon: React.ReactNode
  station?: string
  branchId: string
}

const BUSINESS_HOURS = {
  start: 10, // Salon hours: 10 AM to 9 PM
  end: 21,
  slotDuration: 15 // 15-minute slots to match booking system
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

// Helper to get status icon based on STATUS_CONFIG
function getStatusIcon(status: string) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'FileEdit': FileEdit,
    'Calendar': Calendar,
    'UserCheck': UserCheck,
    'Clock': Clock,
    'DollarSign': DollarSign,
    'CheckCircle': CheckCircle,
    'XCircle': XCircle,
    'AlertCircle': AlertCircle
  }

  const iconName = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.icon || 'Calendar'
  const IconComponent = iconMap[iconName] || Scissors
  return <IconComponent className="w-3 h-3" />
}

export function SalonResourceCalendar({
  className,
  organizations = [],
  canViewAllBranches = false
}: SalonResourceCalendarProps) {
  const { organizationId, organization } = useSecuredSalonContext()
  const mounted = useIsMounted()
  const router = useRouter()

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
  const [selectedView, setSelectedView] = useState<'day' | 'week' | 'month'>('day')
  const [viewMode, setViewMode] = useState<'single' | 'resource'>('resource')
  const [selectedStylists, setSelectedStylists] = useState<string[]>(['all'])
  const [selectedBranches, setSelectedBranches] = useState<string[]>(['all'])
  const [showSidebar, setShowSidebar] = useState(true)
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null)
  const [lateMenuAppointment, setLateMenuAppointment] = useState<Appointment | null>(null)
  const [lateMenuPosition, setLateMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [dropTarget, setDropTarget] = useState<{
    date: Date
    time: string
    stylistId: string
  } | null>(null)

  // Scroll container ref for horizontal navigation
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Horizontal scroll functions for calendar navigation
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      console.log('📍 Scroll Left - Current scrollLeft:', scrollContainerRef.current.scrollLeft)
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' })
    } else {
      console.log('❌ Scroll container ref not found')
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      console.log('📍 Scroll Right - Current scrollLeft:', scrollContainerRef.current.scrollLeft)
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' })
    } else {
      console.log('❌ Scroll container ref not found')
    }
  }

  // 🔍 Search state
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // 🚀 ENTERPRISE: Appointment modal state
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // 🚀 ENTERPRISE: New booking context (for passing to /appointments/new)
  const [newBookingContext, setNewBookingContext] = useState<{
    branchId?: string
    stylistId?: string
    date?: string
    time?: string
  } | null>(null)

  // 🚀 LUXE: Conflict warning modal state
  const [conflictWarningOpen, setConflictWarningOpen] = useState(false)
  const [conflictDetails, setConflictDetails] = useState<{
    date: Date
    time: string
    stylistId: string
    conflictingAppointments: Appointment[]
  } | null>(null)

  // 🚀 LUXE: Cancel confirmation modal state
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null)

  // 🕐 Current time state for timeline and past slot detection
  const [currentTime, setCurrentTime] = useState(new Date())

  // ⚡ PERFORMANCE: Always load full month of data for instant filtering & no refetching
  const monthDateRange = useMemo(() => {
    const start = new Date(selectedDate)
    const end = new Date(selectedDate)

    // Always load full month
    start.setDate(1)
    end.setMonth(end.getMonth() + 1)
    end.setDate(0)

    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    return {
      fromISO: start.toISOString(),
      toISO: end.toISOString()
    }
  }, [selectedDate.getMonth(), selectedDate.getFullYear()]) // Only recompute when month/year changes

  // Calculate visible range for current view (for UI display, not data fetching)
  const visibleDateRange = useMemo(() => {
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

    if (DEBUG_MODE) {
      console.log('📅 [Calendar] Visible date range:', {
        view: selectedView,
        selected: selectedDate.toDateString(),
        start: start.toDateString(),
        end: end.toDateString()
      })
    }

    return {
      start,
      end,
      startDate: start.toDateString(),
      endDate: end.toDateString()
    }
  }, [selectedDate, selectedView])

  // ⚡ PERFORMANCE: Fetch full month of appointments (cached for instant view switching)
  const {
    appointments: allMonthAppointments,
    isLoading: appointmentsLoading,
    error: appointmentsError,
    updateAppointment, // ✨ Get update method for drag-and-drop
    refetch: refetchAppointments // ✨ Get refetch method for manual refresh
  } = useHeraAppointments({
    organizationId,
    filters: {
      ...(branchId && !canViewAllBranches ? { branch_id: branchId } : {}),
      date_from: monthDateRange.fromISO,
      date_to: monthDateRange.toISO
    }
    // ✅ REMOVED refetchOnMount: Uses standard cache (30min stale time)
    // This eliminates slow loading while still showing fresh data via cache invalidation
  })

  // ⚡ CLIENT-SIDE FILTER: Filter appointments to visible date range
  const rawAppointments = useMemo(() => {
    if (!allMonthAppointments) return []

    // Filter to visible range based on current view
    return allMonthAppointments.filter(apt => {
      const aptDate = new Date(apt.start_time)
      return aptDate >= visibleDateRange.start && aptDate <= visibleDateRange.end
    })
  }, [allMonthAppointments, visibleDateRange.start, visibleDateRange.end])

  // 🔄 REFRESH: Refetch appointments when page becomes visible (e.g., returning from booking page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && refetchAppointments) {
        console.log('📡 [Calendar] Page became visible - refetching appointments...')
        refetchAppointments()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Also refetch on focus (when user clicks back to tab/window)
    window.addEventListener('focus', () => {
      if (refetchAppointments) {
        console.log('📡 [Calendar] Window focused - refetching appointments...')
        refetchAppointments()
      }
    })

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [refetchAppointments])

  // 🚀 ENTERPRISE: Auto-refresh when returning from POS after payment completion
  // This handles the case where user navigates back from POS after completing payment
  useEffect(() => {
    // Check if we're returning from POS with a completed payment
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'appointment_status_updated' && e.newValue) {
        console.log('✅ [Calendar] Detected appointment status update from POS - refreshing...')

        // Parse the update data
        try {
          const updateData = JSON.parse(e.newValue)
          console.log('📋 Update data:', updateData)

          // Refetch appointments to get latest status
          if (refetchAppointments) {
            refetchAppointments()
          }

          // Clear the flag after processing
          localStorage.removeItem('appointment_status_updated')
        } catch (err) {
          console.error('Failed to parse appointment update data:', err)
        }
      }
    }

    // Listen for storage events (cross-tab communication)
    window.addEventListener('storage', handleStorageChange)

    // Also check on component mount (in case we're returning via browser back button)
    const checkForUpdates = () => {
      const updateFlag = localStorage.getItem('appointment_status_updated')
      if (updateFlag) {
        console.log('✅ [Calendar] Found pending appointment update on mount - refreshing...')

        if (refetchAppointments) {
          refetchAppointments()
        }

        // Clear the flag
        localStorage.removeItem('appointment_status_updated')
      }
    }

    // Check immediately on mount
    checkForUpdates()

    // Also check when route changes (using Next.js router events)
    const handleRouteChange = () => {
      checkForUpdates()
    }

    // Listen for popstate (browser back/forward buttons)
    window.addEventListener('popstate', handleRouteChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [refetchAppointments])

  // 🐛 DEBUG: Comprehensive logging for appointment loading
  useEffect(() => {
    if (DEBUG_MODE) {
      console.log('⚡ [Calendar] PERFORMANCE MODE - Month data with client-side filtering:', {
        loading: appointmentsLoading,
        hasError: !!appointmentsError,
        error: appointmentsError,
        totalMonthAppointments: allMonthAppointments?.length || 0,
        visibleAppointments: rawAppointments?.length || 0,
        selectedDate: selectedDate.toDateString(),
        monthRange: {
          from: monthDateRange.fromISO,
          to: monthDateRange.toISO
        },
        visibleRange: {
          from: visibleDateRange.startDate,
          to: visibleDateRange.endDate
        },
        organizationId,
        branchId
      })
    }

    if (rawAppointments && rawAppointments.length > 0) {
      const firstApt = rawAppointments[0]
      console.log('📅 [Calendar] Appointments visible:', rawAppointments.length, 'in current view (', allMonthAppointments?.length, 'total in month)')
      console.log('📍 [Calendar] First appointment:', {
        date: new Date(firstApt.start_time).toDateString(),
        time: new Date(firstApt.start_time).toLocaleTimeString(),
        customer: firstApt.customer_name,
        stylist: firstApt.stylist_name
      })
      console.log('📆 [Calendar] Visible range:', {
        from: visibleDateRange.startDate,
        to: visibleDateRange.endDate
      })
    } else if (!appointmentsLoading && DEBUG_MODE) {
      console.log('⚠️ [Calendar] No appointments found for current filters')
    }
  }, [rawAppointments, allMonthAppointments, appointmentsLoading, appointmentsError, monthDateRange, visibleDateRange, organizationId, branchId, selectedDate])

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
      // ✅ CRITICAL FIX: Handle timezone properly - parse as local date
      // If start_time is already in format "YYYY-MM-DD HH:MM:SS", parse as local
      // Otherwise use Date constructor
      let startDate: Date
      if (typeof apt.start_time === 'string' && apt.start_time.includes('T')) {
        // ISO format with timezone - parse and convert to local
        startDate = new Date(apt.start_time)
      } else if (typeof apt.start_time === 'string') {
        // Postgres format "YYYY-MM-DD HH:MM:SS" - parse as local
        const parts = apt.start_time.match(/(\d{4})-(\d{2})-(\d{2})[\sT](\d{2}):(\d{2}):(\d{2})/)
        if (parts) {
          startDate = new Date(
            parseInt(parts[1]), // year
            parseInt(parts[2]) - 1, // month (0-indexed)
            parseInt(parts[3]), // day
            parseInt(parts[4]), // hour
            parseInt(parts[5]), // minute
            parseInt(parts[6]) // second
          )
        } else {
          startDate = new Date(apt.start_time)
        }
      } else {
        startDate = new Date(apt.start_time)
      }

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

      // ✅ ENTERPRISE: Map database status to calendar status
      // Database statuses: 'booked', 'checked_in', 'payment_done', 'completed', 'cancelled'
      const calendarStatus = apt.status || 'booked'

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
        status: calendarStatus, // ✅ Use actual database status
        rawStatus: apt.status, // Keep original for reference
        price: `AED ${apt.total_amount || 0}`,
        color: staffColor.bg, // ✨ Use staff color instead of service color
        colorLight: staffColor.light,
        colorBorder: staffColor.border,
        icon: getStatusIcon(apt.status || 'booked'), // ✅ Dynamic status-based icon
        station: `station-1`,
        branchId: appointmentBranchId
      }
    })

    // 🔍 Apply filters (status, service, date range) if any are active
    // For now, just return all appointments - filters can be added in future

    // 🐛 DEBUG: Log appointments to check date parsing
    if (DEBUG_MODE && appointments.length > 0) {
      console.log('📅 [Calendar] Transformed appointments:', {
        total: appointments.length,
        sample: appointments.slice(0, 3).map(apt => ({
          id: apt.id,
          client: apt.client,
          date: apt.date.toDateString(),
          time: apt.time,
          originalStartTime: rawAppointments.find(r => r.id === apt.id)?.start_time
        }))
      })
    }

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
      // Disable transitions during drag for instant response
      e.currentTarget.style.transition = 'none'
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
      e.currentTarget.style.cursor = 'pointer'
      // Re-enable transitions after drag
      e.currentTarget.style.transition = ''
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

  // 🚀 ENTERPRISE: Handle "Client Late" - Quick delay appointment
  const handleClientLate = useCallback(
    async (appointment: Appointment, delayMinutes: number) => {
      if (!updateAppointment) return

      try {
        const currentStart = new Date(appointment.date)
        const [hours, minutes] = appointment.time.split(':').map(Number)
        currentStart.setHours(hours, minutes, 0, 0)

        // Calculate new start time with delay
        const newStartTime = new Date(currentStart.getTime() + delayMinutes * 60000)

        // ✅ Update appointment with delay reason in metadata
        await updateAppointment({
          id: appointment.id,
          data: {
            start_time: newStartTime.toISOString(),
            duration_minutes: appointment.duration,
            metadata: {
              ...((appointment as any).metadata || {}),
              late_arrival: {
                original_time: currentStart.toISOString(),
                delay_minutes: delayMinutes,
                delayed_at: new Date().toISOString(),
                reason: 'CLIENT_LATE'
              }
            }
          }
        })

        setLateMenuAppointment(null)
        setLateMenuPosition(null)

        // Only log in debug mode
        if (DEBUG_MODE) {
          console.log('✅ Appointment delayed:', {
            appointmentId: appointment.id,
            delayMinutes,
            newTime: newStartTime.toLocaleString()
          })
        }
      } catch (error) {
        console.error('❌ Failed to delay appointment:', error)
        alert('Failed to delay appointment. Please try again.')
      }
    },
    [updateAppointment]
  )

  // 🚀 ENTERPRISE: Toggle appointment completion status
  const handleToggleCompletion = useCallback(
    async (appointment: Appointment) => {
      if (!updateAppointment) return

      try {
        const newStatus = appointment.status === 'completed' ? 'confirmed' : 'completed'

        // ✅ Update appointment status
        await updateAppointment({
          id: appointment.id,
          data: {
            status: newStatus,
            metadata: {
              ...((appointment as any).metadata || {}),
              completion_toggled: {
                previous_status: appointment.status,
                new_status: newStatus,
                toggled_at: new Date().toISOString()
              }
            }
          }
        })

        // Only log in debug mode
        if (DEBUG_MODE) {
          console.log('✅ Appointment status toggled:', {
            appointmentId: appointment.id,
            previousStatus: appointment.status,
            newStatus
          })
        }
      } catch (error) {
        console.error('❌ Failed to toggle appointment status:', error)
        alert('Failed to update appointment status. Please try again.')
      }
    },
    [updateAppointment]
  )

  // ✨ ENTERPRISE: Status Transition Rules & Validation
  const STATUS_TRANSITIONS = {
    // Define allowed transitions for each status
    booked: ['checked_in', 'cancelled'], // Can only check-in or cancel
    checked_in: ['booked', 'completed', 'cancelled'], // Can go back, complete, or cancel
    completed: ['booked'], // Can reopen (with confirmation) - e.g., customer returns with issue
    cancelled: ['booked'] // Can rebook (with confirmation)
  } as const

  // Define transitions that require confirmation with optional reason input
  const REQUIRES_CONFIRMATION = {
    completed_to_booked: {
      title: 'Reopen Completed Appointment?',
      message:
        'This appointment is already completed. Reopening will reset the status to "Booked". This action should only be used if the service needs to be redone or if there was an error.',
      confirmText: 'Reopen Appointment',
      cancelText: 'Cancel',
      type: 'warning' as const,
      showReasonInput: true,
      reasonLabel: 'Reason for Reopening (Optional)',
      reasonPlaceholder: 'e.g., Customer complaint, service issue, billing error...'
    },
    cancelled_to_booked: {
      title: 'Rebook Cancelled Appointment?',
      message:
        'This appointment was cancelled. Are you sure you want to rebook it? This will reset the status to "Booked".',
      confirmText: 'Rebook Appointment',
      cancelText: 'Cancel',
      type: 'info' as const,
      showReasonInput: true,
      reasonLabel: 'Reason for Rebooking (Optional)',
      reasonPlaceholder: 'e.g., Customer changed mind, scheduling error...'
    },
    checked_in_to_booked: {
      title: 'Move Back to Booked?',
      message:
        'The customer has already checked in. Moving back to "Booked" status will require them to check in again. Are you sure?',
      confirmText: 'Move to Booked',
      cancelText: 'Cancel',
      type: 'warning' as const,
      showReasonInput: true,
      reasonLabel: 'Reason for Moving Back (Optional)',
      reasonPlaceholder: 'e.g., Wrong customer checked in, timing issue...'
    },
    booked_to_cancelled: {
      title: 'Cancel Appointment?',
      message:
        'Are you sure you want to cancel this appointment? The customer will need to rebook if they want to reschedule.',
      confirmText: 'Cancel Appointment',
      cancelText: 'Keep Appointment',
      type: 'warning' as const,
      showReasonInput: true,
      reasonLabel: 'Cancellation Reason (Optional)',
      reasonPlaceholder: 'e.g., Customer request, no-show, emergency...'
    },
    checked_in_to_cancelled: {
      title: 'Cancel Checked-In Appointment?',
      message:
        'The customer has already checked in. Cancelling now may require additional follow-up. Are you sure?',
      confirmText: 'Cancel Appointment',
      cancelText: 'Keep Appointment',
      type: 'warning' as const,
      showReasonInput: true,
      reasonLabel: 'Cancellation Reason (Optional)',
      reasonPlaceholder: 'e.g., Emergency, customer left, service unavailable...'
    }
  } as const

  // ✨ ENTERPRISE: Validate status transition with business rules
  const validateStatusTransition = useCallback(
    (currentStatus: string, newStatus: string): { valid: boolean; reason?: string } => {
      // Same status - no change needed
      if (currentStatus === newStatus) {
        return { valid: false, reason: 'Status is already set to this value' }
      }

      // Check if transition is allowed
      const allowedTransitions =
        STATUS_TRANSITIONS[currentStatus as keyof typeof STATUS_TRANSITIONS]
      if (!allowedTransitions || !allowedTransitions.includes(newStatus as any)) {
        return {
          valid: false,
          reason: `Cannot change status from "${currentStatus}" to "${newStatus}". Not allowed by business rules.`
        }
      }

      return { valid: true }
    },
    []
  )

  // ✨ ENTERPRISE: Get confirmation requirement for transition
  const getConfirmationRequirement = useCallback(
    (currentStatus: string, newStatus: string) => {
      const transitionKey = `${currentStatus}_to_${newStatus}` as keyof typeof REQUIRES_CONFIRMATION
      return REQUIRES_CONFIRMATION[transitionKey]
    },
    []
  )

  // ✨ ENTERPRISE: Confirmation dialog state with optional reason input
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean
    title: string
    message: string
    confirmText: string
    cancelText: string
    type: 'warning' | 'info'
    showReasonInput: boolean
    reasonLabel?: string
    reasonPlaceholder?: string
    onConfirm: (reason?: string) => void
  } | null>(null)

  // State for optional reason input in confirmation dialogs
  const [confirmationReason, setConfirmationReason] = useState('')

  // ✨ ENTERPRISE: Handle appointment status change with validation & confirmation
  const handleStatusChange = useCallback(
    async (appointmentId: string, newStatus: string, currentStatus: string) => {
      if (!updateAppointment) return

      // ✅ STEP 1: Validate transition
      const validation = validateStatusTransition(currentStatus, newStatus)
      if (!validation.valid) {
        alert(validation.reason || 'Invalid status transition')
        return
      }

      // ✅ STEP 2: Check if confirmation required
      const confirmationConfig = getConfirmationRequirement(currentStatus, newStatus)

      // Function to actually perform the status update
      const performUpdate = async (reason?: string) => {
        try {
          // ✅ RPC UPDATE: Returns updated data and automatically updates React Query cache
          // The useUniversalTransactionV1 hook's onSuccess handler:
          // 1. Updates the specific transaction in cache (instant UI update)
          // 2. Invalidates all transaction queries (ensures consistency)
          // No manual cache manipulation needed!

          // ✅ CRITICAL: Skip validation for transitions that required user confirmation
          // If user confirmed via dialog, we trust their decision and bypass hook validation
          await updateAppointment({
            id: appointmentId,
            data: {
              status: newStatus,
              metadata: {
                status_changed_at: new Date().toISOString(),
                status_changed_via: 'calendar_badge',
                previous_status: currentStatus,
                status_transition: `${currentStatus} → ${newStatus}`,
                requires_confirmation: !!confirmationConfig,
                changed_by_user: true,
                ...(reason && { status_change_reason: reason }) // ✅ Store optional reason
              }
            },
            skipValidation: !!confirmationConfig // Skip validation if user confirmed
          })

          // Only log in debug mode
          if (DEBUG_MODE) {
            console.log('✅ Appointment status changed:', {
              appointmentId,
              transition: `${currentStatus} → ${newStatus}`,
              timestamp: new Date().toISOString(),
              confirmed: !!confirmationConfig
            })
          }
        } catch (error) {
          console.error('❌ Failed to change appointment status:', error)
          alert('Failed to update appointment status. Please try again.')
        }
      }

      // If confirmation required, show luxe modal
      if (confirmationConfig) {
        setConfirmationReason('') // Reset reason input
        setConfirmationDialog({
          open: true,
          title: confirmationConfig.title,
          message: confirmationConfig.message,
          confirmText: confirmationConfig.confirmText,
          cancelText: confirmationConfig.cancelText,
          type: confirmationConfig.type,
          showReasonInput: confirmationConfig.showReasonInput,
          reasonLabel: confirmationConfig.reasonLabel,
          reasonPlaceholder: confirmationConfig.reasonPlaceholder,
          onConfirm: (reason?: string) => {
            setConfirmationDialog(null)
            performUpdate(reason)
          }
        })
      } else {
        // No confirmation needed, update directly
        await performUpdate()
      }
    },
    [updateAppointment, validateStatusTransition, getConfirmationRequirement]
  )

  // ✨ ENTERPRISE: Handle Process Payment from status badge
  const handleProcessPayment = useCallback(
    (appointment: any) => {
      // Find the original raw appointment with all data
      const originalAppointment = rawAppointments?.find(apt => apt.id === appointment.id)

      if (!originalAppointment) {
        alert('Appointment data not found. Please try again.')
        return
      }

      // 🎯 ENTERPRISE PATTERN: Extract service data (same as quick action menu)
      const serviceIds = originalAppointment.metadata?.service_ids || []
      const serviceNames: string[] = []
      const servicePrices: number[] = []

      // Extract service names and prices from loaded services
      serviceIds.forEach((serviceId: string) => {
        const service = services?.find((s: any) => s.id === serviceId)
        if (service) {
          serviceNames.push(service.entity_name || service.name || 'Unknown Service')

          // 🎯 ENTERPRISE: dynamic_fields can be ARRAY or OBJECT with numeric keys
          let price = 0
          if (service.dynamic_fields) {
            // Convert to array if it's an object with numeric keys
            const fieldsArray = Array.isArray(service.dynamic_fields)
              ? service.dynamic_fields
              : Object.values(service.dynamic_fields)

            // Extract actual field objects (unwrap {value: {...}})
            const unwrappedFields = fieldsArray.map((f: any) => f.value || f)

            // Find price field
            const priceField = unwrappedFields.find((f: any) => f.field_name === 'price_market')
            price = priceField?.field_value_number || 0

            // Fallback: check nested structure
            if (!price && service.dynamic_fields.price_market?.value) {
              price = service.dynamic_fields.price_market.value
            }
          }

          // Final fallback
          if (!price && service.price) {
            price = service.price
          }

          servicePrices.push(price)
        } else {
          serviceNames.push('Unknown Service')
          servicePrices.push(0)
        }
      })

      // 🎯 ENTERPRISE PATTERN: Extract service data to TOP LEVEL
      const appointmentData = {
        id: originalAppointment.id,
        organization_id: organizationId,
        branch_id: originalAppointment.branch_id,
        customer_id: originalAppointment.customer_id,
        customer_name: originalAppointment.customer_name,
        stylist_id: originalAppointment.stylist_id,
        stylist_name: originalAppointment.stylist_name,
        // ✅ SERVICE DATA AT TOP LEVEL
        service_ids: serviceIds,
        service_names: serviceNames,
        service_prices: servicePrices,
        start_time: originalAppointment.start_time,
        end_time: originalAppointment.end_time,
        duration: originalAppointment.duration_minutes,
        price: originalAppointment.price || originalAppointment.total_amount || 0,
        status: originalAppointment.status,
        flags: {
          vip: originalAppointment.metadata?.vip || false,
          new: originalAppointment.metadata?.new_customer || false
        },
        metadata: originalAppointment.metadata,
        _source: 'calendar_status_badge',
        _timestamp: new Date().toISOString()
      }

      // Store appointment details in sessionStorage for POS page
      sessionStorage.setItem('pos_appointment', JSON.stringify(appointmentData))

      // Navigate to POS with appointment ID
      router.push(`/salon/pos?appointment=${originalAppointment.id}`)
    },
    [rawAppointments, services, organizationId, router]
  )

  // Handle context menu for quick actions with smart positioning
  const handleAppointmentRightClick = useCallback((e: React.MouseEvent, appointment: Appointment) => {
    e.preventDefault()
    e.stopPropagation()

    // ✅ ENTERPRISE UX: Smart positioning - ensure menu stays in viewport
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const clickY = e.clientY
    const clickX = e.clientX
    const menuHeight = 550 // Approximate menu height with all options
    const menuWidth = 280

    // Calculate if menu would overflow viewport
    const wouldOverflowBottom = clickY + menuHeight > viewportHeight
    const wouldOverflowRight = clickX + menuWidth > viewportWidth

    // Position menu to stay within viewport
    const finalY = wouldOverflowBottom
      ? Math.max(10, clickY - menuHeight) // Show above, with 10px min from top
      : clickY

    const finalX = wouldOverflowRight
      ? Math.max(10, clickX - menuWidth) // Show to left, with 10px min from left
      : clickX

    setLateMenuAppointment(appointment)
    setLateMenuPosition({
      x: finalX,
      y: finalY
    })
  }, [])

  // 🚀 ENTERPRISE: Handle appointment click to view/edit
  const handleAppointmentClick = useCallback(
    (e: React.MouseEvent, appointment: Appointment) => {
      // Don't trigger if right-clicking or dragging
      if (e.button !== 0) return

      e.stopPropagation()

      // Find the original raw appointment data (not transformed)
      const originalAppointment = rawAppointments?.find(apt => apt.id === appointment.id)
      if (originalAppointment) {
        setSelectedAppointment(originalAppointment as any)
        setModalOpen(true)
      }
    },
    [rawAppointments]
  )

  // 🚀 ENTERPRISE: Check for time slot conflicts (excluding completed appointments)
  const checkTimeSlotConflict = useCallback(
    (date: Date, time: string, stylistId: string, durationMinutes: number = 60) => {
      if (!transformedAppointments || transformedAppointments.length === 0) {
        return { hasConflict: false, conflictingAppointments: [] }
      }

      const [hours, minutes] = time.split(':').map(Number)
      const slotStart = new Date(date)
      slotStart.setHours(hours, minutes, 0, 0)
      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000)

      // Filter for active appointments only (exclude completed/cancelled)
      const conflictingAppointments = transformedAppointments.filter((apt: Appointment) => {
        // Skip if different date
        if (apt.date.toDateString() !== date.toDateString()) return false

        // Skip if different stylist (and stylist is specified)
        if (stylistId && apt.stylist !== stylistId) return false

        // ✅ ENTERPRISE RULE: Completed or cancelled appointments free up the slot
        if (apt.status === 'completed' || apt.status === 'cancelled') return false

        // Check time overlap
        const [aptHours, aptMinutes] = apt.time.split(':').map(Number)
        const aptStart = new Date(date)
        aptStart.setHours(aptHours, aptMinutes, 0, 0)
        const aptEnd = new Date(aptStart.getTime() + (apt.duration || 60) * 60000)

        // Check if times overlap
        return (
          (slotStart >= aptStart && slotStart < aptEnd) || // Slot starts during appointment
          (slotEnd > aptStart && slotEnd <= aptEnd) || // Slot ends during appointment
          (slotStart <= aptStart && slotEnd >= aptEnd) // Slot contains appointment
        )
      })

      return {
        hasConflict: conflictingAppointments.length > 0,
        conflictingAppointments
      }
    },
    [transformedAppointments]
  )

  // 🚀 LUXE: Handle conflict warning - proceed with booking
  const handleConflictProceed = useCallback(() => {
    if (!conflictDetails) return

    // ✅ FIX: Format date in local timezone to avoid off-by-one day error
    const year = conflictDetails.date.getFullYear()
    const month = String(conflictDetails.date.getMonth() + 1).padStart(2, '0')
    const day = String(conflictDetails.date.getDate()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${day}`

    const params = new URLSearchParams({
      date: formattedDate,
      time: conflictDetails.time,
      stylist_id: conflictDetails.stylistId
    })

    if (branchId && branchId !== 'all') {
      params.append('branch_id', branchId)
    }

    setConflictWarningOpen(false)
    setConflictDetails(null)
    router.push(`/salon/appointments/new?${params.toString()}`)
  }, [conflictDetails, branchId, router])

  // 🚀 ENTERPRISE: Handle empty slot click to book new appointment
  const handleEmptySlotClick = useCallback(
    (date: Date, time: string, stylistId: string) => {
      // ✅ ENTERPRISE: Check for conflicts before allowing booking
      const conflict = checkTimeSlotConflict(date, time, stylistId, 60)

      if (conflict.hasConflict) {
        // 🎨 LUXE: Show custom conflict warning modal
        setConflictDetails({
          date,
          time,
          stylistId,
          conflictingAppointments: conflict.conflictingAppointments
        })
        setConflictWarningOpen(true)
        return
      }

      // ✅ FIX: Format date in local timezone to avoid off-by-one day error
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const formattedDate = `${year}-${month}-${day}` // YYYY-MM-DD format

      // Build query params for /appointments/new
      const params = new URLSearchParams({
        date: formattedDate,
        time: time,
        stylist_id: stylistId
      })

      // Add branch if selected
      if (branchId && branchId !== 'all') {
        params.append('branch_id', branchId)
      }

      // Navigate to new appointment page with pre-filled data
      router.push(`/salon/appointments/new?${params.toString()}`)
    },
    [branchId, router, checkTimeSlotConflict]
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

  // ✨ ENTERPRISE: Appointment Status Configuration (Dual Color Coding)
  // Staff colors remain primary, status adds secondary visual cue
  // 🎨 BRIGHTER colors - distinct from staff colors (Violet/Blue/Pink/Amber/Teal/Rose/Indigo/Emerald/Purple/Cyan)
  // Workflow: Booked → Checked In → Process Payment (POS) → Completed (automatic)
  const APPOINTMENT_STATUSES = {
    booked: {
      label: 'Booked',
      color: '#FCD34D', // Enhanced Gold - matches badge color
      bg: 'rgba(252, 211, 77, 0.50)', // ✨ ENHANCED: More vibrant background (35% → 50%)
      border: '#FCD34D', // ✨ ENHANCED: Solid border for crisp edges
      icon: '📅',
      description: 'Appointment confirmed, awaiting check-in'
    },
    checked_in: {
      label: 'Checked In',
      color: '#60A5FA', // Bright Blue - matches badge color
      bg: 'rgba(96, 165, 250, 0.50)', // ✨ ENHANCED: More vibrant background (35% → 50%)
      border: '#60A5FA', // ✨ ENHANCED: Solid border for crisp edges
      icon: '✓',
      description: 'Customer has arrived and checked in',
      action: 'process_payment' // ✅ Next action: Process Payment at POS → Auto-complete
    },
    completed: {
      label: 'Completed',
      color: '#34D399', // Enhanced Emerald Green - matches badge color
      bg: 'rgba(52, 211, 153, 0.50)', // ✨ ENHANCED: More vibrant background (35% → 50%)
      border: '#34D399', // ✨ ENHANCED: Solid border for crisp edges
      icon: '✅',
      description: 'Appointment finished and closed'
    },
    cancelled: {
      label: 'Cancelled',
      color: '#F87171', // Enhanced Red - matches badge color
      bg: 'rgba(248, 113, 113, 0.50)', // ✨ ENHANCED: More vibrant background (35% → 50%)
      border: '#F87171', // ✨ ENHANCED: Solid border for crisp edges
      icon: '✕',
      description: 'Appointment cancelled'
    }
  } as const

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
                // ✅ FIX: Format date in local timezone to avoid off-by-one day error
                const year = selectedDate.getFullYear()
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
                const day = String(selectedDate.getDate()).padStart(2, '0')
                const formattedDate = `${year}-${month}-${day}`

                const params = new URLSearchParams({ date: formattedDate })
                router.push(`/salon/appointments/new?${params.toString()}`)
              }}
            >
              <Plus className="w-4 h-4 mr-2 calendar-icon" />
              Book Appointment
            </Button>
          </div>
        </div>
      )}

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Calendar Header - Fixed to Viewport Width */}
        <div
          className="p-4 border-b sticky top-0 z-30 flex-shrink-0"
          style={{
            backgroundColor: COLORS.charcoal,
            borderColor: `${COLORS.gold}33`
          }}
        >
          {/* Top Row: Date Navigation - Prevent Overflow */}
          <div className="flex items-center justify-between mb-3 min-w-0">
            <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
              {!showSidebar && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(true)}
                  className="hover:opacity-80 flex-shrink-0"
                  style={{ color: COLORS.bronze }}
                >
                  <Grid3x3 className="w-5 h-5" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground dark:text-gray-300 flex-shrink-0"
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
                className="text-sm font-medium min-w-[100px] flex-shrink-0 transition-all duration-200"
                style={{
                  color: COLORS.champagne,
                  borderColor: `${COLORS.gold}40`,
                  backgroundColor: `rgba(212, 175, 55, 0.08)`,
                  borderWidth: '2px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `rgba(212, 175, 55, 0.18)`
                  e.currentTarget.style.borderColor = `${COLORS.gold}60`
                  e.currentTarget.style.color = COLORS.champagne
                  e.currentTarget.style.boxShadow = `0 2px 8px rgba(212, 175, 55, 0.25)`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `rgba(212, 175, 55, 0.08)`
                  e.currentTarget.style.borderColor = `${COLORS.gold}40`
                  e.currentTarget.style.color = COLORS.champagne
                  e.currentTarget.style.boxShadow = 'none'
                }}
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hover:opacity-80 flex-shrink-0"
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

              <h2 className="text-base font-semibold ml-2 truncate" style={{ color: COLORS.champagne }}>
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
            </div>

            {/* Right Side Controls - Always Visible, Never Shrink */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
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

              {/* Horizontal Scroll Buttons - Always Visible */}
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg border-2" style={{
                backgroundColor: COLORS.charcoal,
                borderColor: COLORS.gold
              }}>
                <Button
                  onClick={scrollLeft}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md hover:bg-gold/30 transition-all"
                  style={{ color: COLORS.gold }}
                  title="Scroll Calendar Left"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="h-6 w-px bg-gold/40" />
                <Button
                  onClick={scrollRight}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md hover:bg-gold/30 transition-all"
                  style={{ color: COLORS.gold }}
                  title="Scroll Calendar Right"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Info */}
          <p className="text-sm" style={{ color: COLORS.bronze }}>
            {selectedView.charAt(0).toUpperCase() + selectedView.slice(1)} view •{' '}
            {viewDates.length} day{viewDates.length > 1 ? 's' : ''} • Hair Talkz Salon
          </p>
        </div>

        {/* Calendar Grid with Overlay Scroll Buttons */}
        <div className="flex-1 overflow-hidden relative">
          <div
            ref={scrollContainerRef}
            className="h-full w-full overflow-x-auto calendar-scrollbar"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns:
                  selectedView === 'month'
                    ? `repeat(7, 180px)` // Month view: 180px per day
                    : selectedView === 'week'
                      ? `80px repeat(7, 200px)` // Week view: 200px per day
                      : viewMode === 'single'
                        ? `80px repeat(${viewDates.length}, 200px)` // Single resource: 200px per date
                        : `80px repeat(${displayedStylists.length}, 200px)`, // Resource view: 200px per stylist (optimized)
                minHeight: selectedView === 'month' ? 'auto' : `${timeSlots.length * 64}px`,
                minWidth: selectedView === 'month' ? '1260px' : selectedView === 'week' ? '1480px' : 'auto' // Ensure horizontal scrolling
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
                              'h-16 border-b border-r relative group calendar-time-slot transition-all duration-200 cursor-pointer'
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
                                // Week/Day view - no specific stylist selected
                                handleEmptySlotClick(date, slot.time, '')
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
                                    boxShadow: `0 2px 8px ${apt.colorLight || 'rgba(0,0,0,0.1)'}`,
                                    opacity: apt.status === 'completed' ? 0.75 : 1,
                                    filter: apt.status === 'completed' ? 'grayscale(0.3)' : 'none'
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
                    // ✅ FIX: Format date in local timezone
                    const checkDate = viewMode === 'resource' && viewDates.length > 0 ? viewDates[0] : selectedDate
                    const year = checkDate.getFullYear()
                    const month = String(checkDate.getMonth() + 1).padStart(2, '0')
                    const day = String(checkDate.getDate()).padStart(2, '0')
                    const dateToCheck = `${year}-${month}-${day}`
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
                              'h-16 border-b relative group calendar-time-slot transition-all duration-200 cursor-pointer'
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
                                // Single day view - no specific stylist
                                handleEmptySlotClick(date, slot.time, '')
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
                                  onClick={e => handleAppointmentClick(e, apt)}
                                  onContextMenu={e => handleAppointmentRightClick(e, apt)}
                                  className={cn(
                                    'absolute inset-x-1 top-1 mx-1 rounded-lg p-2.5 cursor-pointer',
                                    'calendar-appointment-card'
                                  )}
                                  style={{
                                    transition: 'transform 150ms ease-out, box-shadow 150ms ease-out',
                                    backgroundColor: apt.colorLight || `${apt.color}15`,
                                    borderLeft: `4px solid ${apt.color}`,
                                    border: `1px solid ${apt.colorBorder || `${apt.color}40`}`,
                                    height: `${durationSlots * 64 - 8}px`,
                                    zIndex: 5 + aptIdx,
                                    boxShadow: `0 2px 8px ${apt.colorLight || 'rgba(0,0,0,0.1)'}`,
                                    opacity: apt.status === 'completed' ? 0.75 : 1,
                                    filter: apt.status === 'completed' ? 'grayscale(0.3)' : 'none'
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
                                    <div className="relative">
                                      <div
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-foreground text-xs font-bold flex-shrink-0"
                                        style={{
                                          backgroundColor: apt.color,
                                          opacity: apt.status === 'completed' ? 0.6 : 1
                                        }}
                                      >
                                        {apt.icon}
                                      </div>
                                      {/* ✅ Completion Badge */}
                                      {apt.status === 'completed' && (
                                        <div
                                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                                          style={{
                                            backgroundColor: COLORS.gold,
                                            boxShadow: `0 0 8px ${COLORS.gold}`
                                          }}
                                        >
                                          <span className="text-xs">✓</span>
                                        </div>
                                      )}
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
                              isBusinessHour && 'cursor-pointer',
                              isDropTarget && 'calendar-drop-target ring-2'
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
                              // ✅ CLEAR UX: Only allow click on empty slots to book
                              if (!slotAppointments.length && isBusinessHour && !isPast) {
                                handleEmptySlotClick(selectedDate, slot.time, stylist.id)
                              }
                              // Note: Click on appointments handled by appointment card itself
                            }}
                            onMouseEnter={e => {
                              // Only show hover effect for empty slots
                              if (isBusinessHour && !slotAppointments.length && !isPast) {
                                e.currentTarget.style.backgroundColor = `${COLORS.gold}08`
                                e.currentTarget.style.borderLeft = `2px solid ${COLORS.gold}60`
                                e.currentTarget.style.boxShadow = `inset 0 0 12px ${COLORS.gold}15, 0 2px 8px ${COLORS.gold}10`
                                e.currentTarget.style.cursor = 'pointer'
                              }
                            }}
                            onMouseLeave={e => {
                              if (isBusinessHour && !isPast) {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                e.currentTarget.style.borderLeft = 'none'
                                e.currentTarget.style.boxShadow = 'none'
                                e.currentTarget.style.cursor = 'default'
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
                                  onClick={e => handleAppointmentClick(e, apt)}
                                  onContextMenu={e => handleAppointmentRightClick(e, apt)}
                                  className={cn(
                                    'absolute inset-x-1 top-1 mx-1 rounded-lg p-2.5 cursor-pointer',
                                    'calendar-appointment-card'
                                  )}
                                  style={{
                                    transition: 'transform 150ms ease-out, box-shadow 150ms ease-out',
                                    backgroundColor: apt.colorLight || `${apt.color}15`,
                                    borderLeft: `4px solid ${apt.color}`,
                                    border: `1px solid ${apt.colorBorder || `${apt.color}40`}`,
                                    height: `${durationSlots * 64 - 8}px`,
                                    zIndex: 5 + aptIdx,
                                    boxShadow: `0 2px 8px ${apt.colorLight || 'rgba(0,0,0,0.1)'}`,
                                    opacity: apt.status === 'completed' ? 0.75 : 1,
                                    filter: apt.status === 'completed' ? 'grayscale(0.3)' : 'none'
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
                                  <AppointmentCard
                                    appointment={apt}
                                    stylist={stylist}
                                    compact
                                    onStatusChange={handleStatusChange}
                                    onProcessPayment={handleProcessPayment}
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
                </React.Fragment>
              ))}
                </>
              )}
            </div>
          </div>
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

      {/* 🚀 ENTERPRISE: "Client Late" Quick Action Menu */}
      {lateMenuAppointment && lateMenuPosition && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => {
              setLateMenuAppointment(null)
              setLateMenuPosition(null)
            }}
          />

          {/* 🎨 LUXE Enhanced Context Menu */}
          <div
            className="fixed z-[101] rounded-xl shadow-2xl border-2 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
            style={{
              top: `${lateMenuPosition.y}px`,
              left: `${lateMenuPosition.x}px`,
              backgroundColor: COLORS.charcoal,
              borderColor: `${COLORS.gold}60`,
              minWidth: '280px',
              boxShadow: `0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px ${COLORS.gold}40, 0 0 40px ${COLORS.gold}20`,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)'
            }}
          >
            {/* Gradient Header */}
            <div
              className="px-4 py-3 border-b relative"
              style={{
                background: `linear-gradient(135deg, ${COLORS.charcoalLight} 0%, ${COLORS.charcoal} 100%)`,
                borderColor: `${COLORS.gold}30`
              }}
            >
              {/* Gold accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{
                  background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`
                }}
              />

              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: `${COLORS.gold}20`,
                    border: `1px solid ${COLORS.gold}60`
                  }}
                >
                  <Clock className="w-3 h-3" style={{ color: COLORS.gold }} />
                </div>
                <span className="text-sm font-bold tracking-wide" style={{ color: COLORS.champagne }}>
                  Quick Actions
                </span>
              </div>
              <p className="text-xs font-medium" style={{ color: COLORS.bronze }}>
                {lateMenuAppointment.client} • {lateMenuAppointment.time}
              </p>
            </div>

            {/* View/Edit Option - Primary Action */}
            <div className="p-2 border-b" style={{ borderColor: `${COLORS.bronze}30` }}>
              <button
                onClick={() => {
                  // Find raw appointment and open edit modal
                  const originalAppointment = rawAppointments?.find(
                    apt => apt.id === lateMenuAppointment.id
                  )
                  if (originalAppointment) {
                    setSelectedAppointment(originalAppointment as any)
                    setModalOpen(true)
                  }
                  setLateMenuAppointment(null)
                  setLateMenuPosition(null)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.gold}10 100%)`,
                  border: `1px solid ${COLORS.gold}40`,
                  color: COLORS.champagne,
                  boxShadow: `0 2px 8px ${COLORS.gold}10`
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${COLORS.gold}30 0%, ${COLORS.gold}20 100%)`
                  e.currentTarget.style.borderColor = `${COLORS.gold}60`
                  e.currentTarget.style.boxShadow = `0 4px 12px ${COLORS.gold}20`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.gold}10 100%)`
                  e.currentTarget.style.borderColor = `${COLORS.gold}40`
                  e.currentTarget.style.boxShadow = `0 2px 8px ${COLORS.gold}10`
                }}
              >
                <span className="text-xl">✏️</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
                    View / Edit Appointment
                  </p>
                  <p className="text-xs" style={{ color: COLORS.bronze }}>
                    Modify details, services, or notes
                  </p>
                </div>
              </button>
            </div>

            {/* Quick Delay Options */}
            <div className="px-2 pt-2 pb-1">
              <p className="text-xs font-semibold px-2 mb-2" style={{ color: COLORS.bronze }}>
                CLIENT RUNNING LATE
              </p>
              <div className="space-y-1">
                {[
                  { label: 'Delay 15 minutes', minutes: 15, icon: '⏱️' },
                  { label: 'Delay 30 minutes', minutes: 30, icon: '⏰' },
                  { label: 'Delay 45 minutes', minutes: 45, icon: '⏲️' }
                ].map(option => (
                <button
                  key={option.minutes}
                  onClick={() => handleClientLate(lateMenuAppointment, option.minutes)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-95"
                  style={{
                    backgroundColor: `${COLORS.gold}10`,
                    color: COLORS.champagne
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = `${COLORS.gold}20`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = `${COLORS.gold}10`
                  }}
                >
                  <span className="text-xl">{option.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                      {option.label}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.bronze }}>
                      Move to{' '}
                      {(() => {
                        const current = new Date(lateMenuAppointment.date)
                        const [hours, minutes] = lateMenuAppointment.time.split(':').map(Number)
                        current.setHours(hours, minutes, 0, 0)
                        const newTime = new Date(current.getTime() + option.minutes * 60000)
                        const displayHours = newTime.getHours() % 12 || 12
                        const displayMinutes = newTime.getMinutes().toString().padStart(2, '0')
                        const period = newTime.getHours() >= 12 ? 'PM' : 'AM'
                        return `${displayHours}:${displayMinutes} ${period}`
                      })()}
                    </p>
                  </div>
                </button>
              ))}
              </div>
            </div>

            {/* Payment - Only show if not completed or cancelled */}
            {lateMenuAppointment.status !== 'completed' &&
             lateMenuAppointment.status !== 'cancelled' && (
              <div className="px-2 pb-2 pt-1 border-t" style={{ borderColor: `${COLORS.bronze}30` }}>
                <button
                  onClick={() => {
                    // Find the original raw appointment with all data
                    const originalAppointment = rawAppointments?.find(
                      apt => apt.id === lateMenuAppointment.id
                    )

                    if (originalAppointment) {
                      // 🎯 ENTERPRISE PATTERN: Extract service data (same as appointments page)
                      const serviceIds = originalAppointment.metadata?.service_ids || []
                      const serviceNames: string[] = []
                      const servicePrices: number[] = []

                      // Extract service names and prices from loaded services
                      serviceIds.forEach((serviceId: string) => {
                        const service = services?.find((s: any) => s.id === serviceId)
                        if (service) {
                          serviceNames.push(service.entity_name || service.name || 'Unknown Service')

                          // 🎯 ENTERPRISE: dynamic_fields can be ARRAY or OBJECT with numeric keys
                          let price = 0
                          if (service.dynamic_fields) {
                            // Convert to array if it's an object with numeric keys
                            const fieldsArray = Array.isArray(service.dynamic_fields)
                              ? service.dynamic_fields
                              : Object.values(service.dynamic_fields)

                            // Extract actual field objects (unwrap {value: {...}})
                            const unwrappedFields = fieldsArray.map((f: any) => f.value || f)

                            // Find price field
                            const priceField = unwrappedFields.find((f: any) => f.field_name === 'price_market')
                            price = priceField?.field_value_number || 0

                            // Fallback: check nested structure
                            if (!price && service.dynamic_fields.price_market?.value) {
                              price = service.dynamic_fields.price_market.value
                            }
                          }

                          // Final fallback
                          if (!price && service.price) {
                            price = service.price
                          }

                          servicePrices.push(price)
                        } else {
                          serviceNames.push('Unknown Service')
                          servicePrices.push(0)
                        }
                      })

                      // 🎯 ENTERPRISE PATTERN: Extract service data to TOP LEVEL (same as appointments page)
                      // This ensures POS can access service data directly without nested metadata drilling
                      const appointmentData = {
                        id: originalAppointment.id,
                        organization_id: organizationId,
                        branch_id: originalAppointment.branch_id,
                        customer_id: originalAppointment.customer_id,
                        customer_name: originalAppointment.customer_name,
                        stylist_id: originalAppointment.stylist_id,
                        stylist_name: originalAppointment.stylist_name,
                        // ✅ SERVICE DATA AT TOP LEVEL (same pattern as appointments page)
                        service_ids: serviceIds,
                        service_names: serviceNames,
                        service_prices: servicePrices,
                        start_time: originalAppointment.start_time,
                        end_time: originalAppointment.end_time,
                        duration: originalAppointment.duration_minutes,
                        price: originalAppointment.price || originalAppointment.total_amount || 0,
                        status: originalAppointment.status,
                        flags: {
                          vip: originalAppointment.metadata?.vip || false,
                          new: originalAppointment.metadata?.new_customer || false
                        },
                        metadata: originalAppointment.metadata,
                        _source: 'calendar',
                        _timestamp: new Date().toISOString()
                      }

                      // Store appointment details in sessionStorage for POS page
                      sessionStorage.setItem('pos_appointment', JSON.stringify(appointmentData))

                      // Navigate to POS with appointment ID
                      router.push(`/salon/pos?appointment=${originalAppointment.id}`)
                    }

                    setLateMenuAppointment(null)
                    setLateMenuPosition(null)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, rgba(147,51,234,0.35) 0%, rgba(192,132,252,0.25) 100%)',
                    border: '1px solid rgba(147,51,234,0.5)',
                    color: COLORS.champagne
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(147,51,234,0.5) 0%, rgba(192,132,252,0.35) 100%)'
                    e.currentTarget.style.borderColor = 'rgba(147,51,234,0.8)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(147,51,234,0.35) 0%, rgba(192,132,252,0.25) 100%)'
                    e.currentTarget.style.borderColor = 'rgba(147,51,234,0.5)'
                  }}
                >
                  <span className="text-xl">💳</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                      Process Payment
                    </p>
                    <p className="text-xs" style={{ color: COLORS.bronze }}>
                      Complete checkout at POS
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* Cancel Appointment */}
            <div className="px-2 pb-2 pt-1 border-t" style={{ borderColor: `${COLORS.bronze}30` }}>
              <button
                onClick={() => {
                  // Open LUXE cancel confirmation modal
                  setAppointmentToCancel(lateMenuAppointment)
                  setCancelConfirmOpen(true)
                  setLateMenuAppointment(null)
                  setLateMenuPosition(null)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-95"
                style={{
                  backgroundColor: `rgba(239, 68, 68, 0.1)`,
                  border: `1px solid rgba(239, 68, 68, 0.3)`,
                  color: COLORS.champagne
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = `rgba(239, 68, 68, 0.2)`
                  e.currentTarget.style.borderColor = `rgba(239, 68, 68, 0.5)`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = `rgba(239, 68, 68, 0.1)`
                  e.currentTarget.style.borderColor = `rgba(239, 68, 68, 0.3)`
                }}
              >
                <span className="text-xl">🚫</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium" style={{ color: '#ef4444' }}>
                    Cancel Appointment
                  </p>
                  <p className="text-xs" style={{ color: COLORS.bronze }}>
                    Mark this appointment as cancelled
                  </p>
                </div>
              </button>
            </div>

            {/* Book New Appointment */}
            <div className="px-2 pb-2 pt-1 border-t" style={{ borderColor: `${COLORS.bronze}30` }}>
              <button
                onClick={() => {
                  // Extract appointment details for pre-filling
                  const appointmentDate = lateMenuAppointment.date
                  const appointmentTime = lateMenuAppointment.time
                  const stylistId = lateMenuAppointment.stylist

                  // Close menu
                  setLateMenuAppointment(null)
                  setLateMenuPosition(null)

                  // Navigate to new appointment with pre-filled data
                  // ✅ FIX: Format date in local timezone to avoid off-by-one day error
                  const year = appointmentDate.getFullYear()
                  const month = String(appointmentDate.getMonth() + 1).padStart(2, '0')
                  const day = String(appointmentDate.getDate()).padStart(2, '0')
                  const formattedDate = `${year}-${month}-${day}`

                  const params = new URLSearchParams({
                    date: formattedDate,
                    time: appointmentTime,
                    stylist_id: stylistId
                  })

                  if (branchId && branchId !== 'all') {
                    params.append('branch_id', branchId)
                  }

                  router.push(`/salon/appointments/new?${params.toString()}`)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.gold}10 100%)`,
                  border: `1px solid ${COLORS.gold}40`,
                  color: COLORS.champagne
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${COLORS.gold}30 0%, ${COLORS.gold}20 100%)`
                  e.currentTarget.style.borderColor = `${COLORS.gold}60`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.gold}10 100%)`
                  e.currentTarget.style.borderColor = `${COLORS.gold}40`
                }}
              >
                <span className="text-xl">➕</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                    Book New Appointment
                  </p>
                  <p className="text-xs" style={{ color: COLORS.bronze }}>
                    Schedule another appointment
                  </p>
                </div>
              </button>
            </div>

            {/* Close Menu */}
            <div className="px-2 pb-2 pt-1 border-t" style={{ borderColor: `${COLORS.bronze}30` }}>
              <button
                onClick={() => {
                  setLateMenuAppointment(null)
                  setLateMenuPosition(null)
                }}
                className="w-full px-4 py-2 rounded-lg text-sm transition-all duration-200"
                style={{
                  backgroundColor: 'transparent',
                  color: COLORS.bronze
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = `${COLORS.bronze}10`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                Close Menu
              </button>
            </div>
          </div>
        </>
      )}

      {/* 🎨 LUXE: Cancel Confirmation Modal */}
      <SalonLuxeModal
        open={cancelConfirmOpen}
        onClose={() => {
          setCancelConfirmOpen(false)
          setAppointmentToCancel(null)
        }}
        title="Cancel Appointment"
        description="Are you sure you want to cancel this appointment?"
        icon={<AlertCircle className="w-6 h-6" />}
        size="sm"
        footer={
          <>
            <SalonLuxeButton
              variant="outline"
              onClick={() => {
                setCancelConfirmOpen(false)
                setAppointmentToCancel(null)
              }}
            >
              Keep Appointment
            </SalonLuxeButton>
            <SalonLuxeButton
              variant="danger"
              onClick={async () => {
                if (!updateAppointment || !appointmentToCancel) return

                try {
                  await updateAppointment({
                    id: appointmentToCancel.id,
                    data: { status: 'cancelled' }
                  })
                  setCancelConfirmOpen(false)
                  setAppointmentToCancel(null)
                } catch (error) {
                  console.error('❌ Failed to cancel appointment:', error)
                }
              }}
            >
              Yes, Cancel Appointment
            </SalonLuxeButton>
          </>
        }
      >
        {appointmentToCancel && (
          <div className="space-y-4 py-4">
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: `${COLORS.charcoalLight}`,
                borderColor: `${COLORS.bronze}30`
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
                    Client:
                  </span>
                  <span className="text-sm" style={{ color: COLORS.bronze }}>
                    {appointmentToCancel.client}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
                    Date & Time:
                  </span>
                  <span className="text-sm" style={{ color: COLORS.bronze }}>
                    {appointmentToCancel.date.toLocaleDateString()} at {appointmentToCancel.time}
                  </span>
                </div>
                {appointmentToCancel.serviceNames && appointmentToCancel.serviceNames.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
                      Services:
                    </span>
                    <span className="text-sm" style={{ color: COLORS.bronze }}>
                      {appointmentToCancel.serviceNames.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div
              className="p-3 rounded-lg text-xs"
              style={{
                backgroundColor: `rgba(239, 68, 68, 0.1)`,
                color: '#ef4444',
                border: `1px solid rgba(239, 68, 68, 0.3)`
              }}
            >
              ⚠️ <strong>Warning:</strong> This action will mark the appointment as cancelled. The time
              slot will become available for new bookings.
            </div>
          </div>
        )}
      </SalonLuxeModal>

      {/* 🎨 LUXE: Conflict Warning Modal */}
      <SalonLuxeModal
        open={conflictWarningOpen}
        onClose={() => {
          setConflictWarningOpen(false)
          setConflictDetails(null)
        }}
        title="Time Slot Conflict"
        description="This time slot already has appointments scheduled"
        icon={<AlertCircle className="w-6 h-6" />}
        size="md"
        footer={
          <>
            <SalonLuxeButton
              variant="outline"
              onClick={() => {
                setConflictWarningOpen(false)
                setConflictDetails(null)
              }}
            >
              Cancel
            </SalonLuxeButton>
            <SalonLuxeButton variant="primary" onClick={handleConflictProceed}>
              Proceed Anyway
            </SalonLuxeButton>
          </>
        }
      >
        {conflictDetails && (
          <div className="space-y-4 py-4">
            {/* Requested Booking Details */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: `${COLORS.black}40`,
                borderColor: `${COLORS.bronze}30`
              }}
            >
              <p className="text-sm mb-3 font-semibold" style={{ color: COLORS.champagne }}>
                Requested Booking:
              </p>
              <div className="space-y-1 text-sm" style={{ color: COLORS.bronze }}>
                <p>
                  📅{' '}
                  {conflictDetails.date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p>🕐 {conflictDetails.time}</p>
              </div>
            </div>

            {/* Existing Appointments */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: `${COLORS.gold}10`,
                borderColor: `${COLORS.gold}30`
              }}
            >
              <p className="text-sm mb-3 font-semibold" style={{ color: COLORS.champagne }}>
                ⚠️ Existing Appointments:
              </p>
              <div className="space-y-2">
                {conflictDetails.conflictingAppointments.map((apt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded"
                    style={{
                      backgroundColor: `${COLORS.charcoal}80`,
                      borderLeft: `3px solid ${apt.color}`
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: apt.color }}
                    >
                      {apt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: COLORS.champagne }}>
                        {apt.client}
                      </p>
                      <p className="text-xs truncate" style={{ color: COLORS.bronze }}>
                        {apt.time} • {apt.price}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enterprise Notice */}
            <div
              className="p-3 rounded-lg text-xs"
              style={{
                backgroundColor: `${COLORS.bronze}15`,
                color: COLORS.bronze
              }}
            >
              💡 <strong>Note:</strong> You can still proceed with this booking. Our system allows
              overlapping appointments to accommodate special circumstances.
            </div>
          </div>
        )}
      </SalonLuxeModal>

      {/* 🚀 ENTERPRISE: Appointment View/Edit Modal */}
      {modalOpen && selectedAppointment && (
        <Suspense fallback={null}>
          <AppointmentModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            appointment={selectedAppointment}
            customers={customers || []}
            stylists={staff || []}
            services={services || []}
            branches={filterBranches || []}
            onSave={async (data: any) => {
              if (!updateAppointment) return

              try {
                // ✅ RPC returns updated data and automatically updates React Query cache
                // No need for manual refetch - the hook handles cache updates
                await updateAppointment({
                  id: selectedAppointment.id,
                  data
                })

                setModalOpen(false)
                setSelectedAppointment(null)
              } catch (error) {
                console.error('❌ Failed to update appointment:', error)
                throw error
              }
            }}
            existingAppointments={rawAppointments || []}
            currencySymbol={organization?.currency_symbol || 'AED'}
          />
        </Suspense>
      )}

      {/* ✨ ENTERPRISE: Salon Luxe Confirmation Dialog for Status Changes with Optional Reason */}
      {confirmationDialog && (
        <SalonLuxeModal
          open={confirmationDialog.open}
          onClose={() => {
            setConfirmationDialog(null)
            setConfirmationReason('') // Reset reason on close
          }}
          title={confirmationDialog.title}
          icon={
            confirmationDialog.type === 'warning' ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <Info className="w-6 h-6" />
            )
          }
          size="sm"
          footer={
            <div className="flex items-center gap-3 w-full justify-end">
              <button
                onClick={() => {
                  setConfirmationDialog(null)
                  setConfirmationReason('')
                }}
                className="min-w-[120px] px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  color: '#F5E6C8'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)'
                }}
              >
                {confirmationDialog.cancelText}
              </button>
              <button
                onClick={() => confirmationDialog.onConfirm(confirmationReason || undefined)}
                className="min-w-[120px] px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  color: '#0B0B0B',
                  boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #E3C75F 0%, #C9A520 100%)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.4)'
                  e.currentTarget.style.transform = 'scale(1.02)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(212, 175, 55, 0.3)'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                {confirmationDialog.confirmText}
              </button>
            </div>
          }
        >
          <div className="py-6 space-y-4">
            <p
              className="text-base leading-relaxed"
              style={{
                color: '#F5E6C8'
              }}
            >
              {confirmationDialog.message}
            </p>

            {/* ✨ ENTERPRISE: Optional Reason Input for Audit Trail */}
            {confirmationDialog.showReasonInput && (
              <div className="space-y-2 pt-2">
                <label
                  className="text-sm font-medium block"
                  style={{ color: '#D4AF37' }}
                >
                  {confirmationDialog.reasonLabel}
                </label>
                <textarea
                  value={confirmationReason}
                  onChange={e => setConfirmationReason(e.target.value)}
                  placeholder={confirmationDialog.reasonPlaceholder}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: '#0F0F0F',
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                    color: '#F5E6C8'
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.1)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <p
                  className="text-xs italic"
                  style={{ color: 'rgba(212, 175, 55, 0.6)' }}
                >
                  This information helps maintain a complete audit trail
                </p>
              </div>
            )}
          </div>
        </SalonLuxeModal>
      )}
    </div>
  )
}

// ✨ ENTERPRISE: Appointment Status Badge Component
function AppointmentStatusBadge({
  status,
  appointment,
  onStatusChange,
  onProcessPayment,
  compact = false
}: {
  status: string
  appointment?: any
  onStatusChange?: (newStatus: string, currentStatus: string) => void
  onProcessPayment?: (appointment: any) => void
  compact?: boolean
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [badgePosition, setBadgePosition] = useState<{ top: number; left: number; maxHeight: number } | null>(null)
  const badgeRef = useRef<HTMLButtonElement>(null)

  // ✨ ENTERPRISE: Smart positioning - anchored to badge with visual connection
  useEffect(() => {
    if (showStatusMenu && badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect()
      const dropdownWidth = 200
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top

      // Calculate actual content height (no scroll needed for 4-5 options)
      // Each option: ~44px, Process Payment: ~52px, padding: 8px top/bottom
      const contentHeight = status === 'checked_in' ? 260 : 210

      // Determine vertical positioning (prefer below)
      const shouldPositionAbove = spaceBelow < contentHeight + 20 && spaceAbove > spaceBelow

      // Determine horizontal positioning (prefer aligned to right edge of badge)
      let leftPosition = rect.right - dropdownWidth

      // If dropdown would overflow left, align to left edge of badge instead
      if (leftPosition < 10) {
        leftPosition = rect.left
      }

      // If still overflowing, center on badge
      if (leftPosition + dropdownWidth > viewportWidth - 10) {
        leftPosition = rect.left + (rect.width / 2) - (dropdownWidth / 2)
      }

      setBadgePosition({
        top: shouldPositionAbove
          ? rect.top - contentHeight - 4 // 4px gap above
          : rect.bottom + 4, // 4px gap below - visually connected
        left: Math.max(10, Math.min(leftPosition, viewportWidth - dropdownWidth - 10)),
        maxHeight: contentHeight // Exact height, no scrollbar needed
      })
    }
  }, [showStatusMenu, status])

  // Status configuration - Salon Luxe aesthetic with proper icons
  // Workflow: Booked → Checked In → Process Payment (POS) → Completed (automatic)
  const STATUSES = {
    booked: {
      label: 'Booked',
      color: '#FCD34D', // Brighter Gold - stronger contrast
      textColor: '#1A1A1A', // Dark text for better readability
      bg: 'rgba(252, 211, 77, 0.50)', // ✨ ENHANCED: More vibrant background (35% → 50%)
      border: '#FCD34D', // ✨ ENHANCED: Solid border for crisp edges
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
        </svg>
      ),
      action: null
    },
    checked_in: {
      label: 'Checked In',
      color: '#60A5FA', // Bright Blue - professional
      textColor: '#FFFFFF', // White text for contrast
      bg: 'rgba(96, 165, 250, 0.50)', // ✨ ENHANCED: More vibrant background (35% → 50%)
      border: '#60A5FA', // ✨ ENHANCED: Solid border for crisp edges
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ),
      action: 'process_payment'
    },
    completed: {
      label: 'Completed',
      color: '#34D399', // Brighter Emerald Green - success
      textColor: '#1A1A1A', // Dark text for better readability
      bg: 'rgba(52, 211, 153, 0.50)', // ✨ ENHANCED: More vibrant background (35% → 50%)
      border: '#34D399', // ✨ ENHANCED: Solid border for crisp edges
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
        </svg>
      ),
      action: null
    },
    cancelled: {
      label: 'Cancelled',
      color: '#F87171', // Brighter Red - cancelled
      textColor: '#FFFFFF', // White text for contrast
      bg: 'rgba(248, 113, 113, 0.50)', // ✨ ENHANCED: More vibrant background (35% → 50%)
      border: '#F87171', // ✨ ENHANCED: Solid border for crisp edges
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      ),
      action: null
    }
  }

  // ✨ ENTERPRISE: Status transition rules (must match main component)
  const ALLOWED_TRANSITIONS = {
    booked: ['checked_in', 'cancelled'],
    checked_in: ['booked', 'completed', 'cancelled'],
    completed: ['booked'], // Requires confirmation
    cancelled: ['booked'] // Requires confirmation
  } as const

  // Transitions requiring confirmation (visual indicator)
  const NEEDS_CONFIRMATION = [
    'completed_to_booked',
    'cancelled_to_booked',
    'checked_in_to_booked',
    'booked_to_cancelled',
    'checked_in_to_cancelled'
  ]

  // Get allowed status transitions for current status
  const allowedStatuses =
    ALLOWED_TRANSITIONS[status as keyof typeof ALLOWED_TRANSITIONS] || []

  // Check if a transition requires confirmation
  const requiresConfirmation = (fromStatus: string, toStatus: string): boolean => {
    return NEEDS_CONFIRMATION.includes(`${fromStatus}_to_${toStatus}`)
  }

  const currentStatus = STATUSES[status as keyof typeof STATUSES] || STATUSES.booked

  return (
    <>
      {/* ✨ ENTERPRISE GRADE: Salon Luxe Status Badge - Enhanced Contrast */}
      <button
        ref={badgeRef}
        onClick={e => {
          e.stopPropagation()
          setShowStatusMenu(!showStatusMenu)
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200"
        style={{
          backgroundColor: currentStatus.bg,
          border: `2px solid ${currentStatus.border}`,
          color: currentStatus.textColor,
          fontWeight: '700',
          fontSize: '11px',
          letterSpacing: '0.02em',
          boxShadow: `0 3px 16px ${currentStatus.color}60, inset 0 1px 0 rgba(255,255,255,0.20)`, // ✨ ENHANCED: Stronger glow (40% → 60%)
          cursor: 'pointer',
          position: 'relative',
          zIndex: showStatusMenu ? 9999 : 'auto',
          backdropFilter: 'blur(12px)'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = currentStatus.color + '60' // ✨ ENHANCED: Brighter hover (45% → 60%)
          e.currentTarget.style.boxShadow = `0 6px 24px ${currentStatus.color}80, inset 0 1px 0 rgba(255,255,255,0.30)` // ✨ ENHANCED: Stronger glow (60% → 80%)
          e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)' // ✨ ENHANCED: More pronounced lift
          e.currentTarget.style.borderColor = currentStatus.color
          e.currentTarget.style.borderWidth = '2.5px' // ✨ ENHANCED: Thicker border on hover
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = currentStatus.bg
          e.currentTarget.style.boxShadow = `0 3px 16px ${currentStatus.color}60, inset 0 1px 0 rgba(255,255,255,0.20)`
          e.currentTarget.style.transform = 'scale(1) translateY(0)'
          e.currentTarget.style.borderColor = currentStatus.border
          e.currentTarget.style.borderWidth = '2px'
        }}
      >
        {currentStatus.icon}
        {!compact && <span className="font-bold tracking-wide">{currentStatus.label}</span>}
      </button>

      {/* ✨ ENTERPRISE GRADE: Portal-Based Dropdown - BREAKS OUT OF PARENT BOUNDARIES */}
      {showStatusMenu && onStatusChange && badgePosition && ReactDOM.createPortal(
        <>
          {/* Invisible backdrop to close dropdown */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(2px)'
            }}
            onClick={e => {
              e.stopPropagation()
              setShowStatusMenu(false)
            }}
          />

          {/* Dropdown menu - enterprise-grade, no scrollbar */}
          <div
            style={{
              position: 'fixed',
              top: badgePosition.top,
              left: badgePosition.left,
              zIndex: 9999,
              backgroundColor: '#1A1A1A',
              border: `1px solid rgba(212, 175, 55, 0.3)`,
              borderRadius: '10px',
              width: '200px',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.6),
                0 0 0 1px rgba(212, 175, 55, 0.2),
                inset 0 1px 0 rgba(212, 175, 55, 0.1)
              `,
              backdropFilter: 'blur(12px)',
              overflow: 'visible'
            }}
            onClick={e => e.stopPropagation()}
          >
          {/* ✨ ENTERPRISE: Process Payment Action (when status is checked_in) */}
          {status === 'checked_in' && onProcessPayment && appointment && (
            <div className="p-2 border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}>
              <button
                onClick={e => {
                  e.stopPropagation()
                  onProcessPayment(appointment)
                  setShowStatusMenu(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  color: '#A78BFA'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(168, 85, 247, 0.2) 100%)'
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%)'
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)'
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                </svg>
                <div className="flex-1 text-left">
                  <p className="text-xs font-semibold">Process Payment</p>
                  <p className="text-[10px] opacity-70">Go to POS</p>
                </div>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 opacity-60">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                </svg>
              </button>
            </div>
          )}

          {/* ✨ ENTERPRISE GRADE: Clean Status Options - No Scrollbar */}
          <div className="p-2" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {Object.entries(STATUSES).map(([key, statusConfig]) => {
              // Check if this transition is allowed
              const isAllowed = allowedStatuses.includes(key as any) || status === key
              const isCurrent = status === key
              const needsConfirm = requiresConfirmation(status, key)

              // Skip disallowed transitions
              if (!isAllowed) return null

              return (
                <button
                  key={key}
                  onClick={e => {
                    e.stopPropagation()
                    if (!isCurrent && onStatusChange) {
                      onStatusChange(key, status)
                    }
                    setShowStatusMenu(false)
                  }}
                  disabled={isCurrent}
                  className="w-full transition-all duration-200"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: isCurrent ? statusConfig.bg : 'transparent',
                    border: `1px solid ${isCurrent ? statusConfig.border : 'transparent'}`,
                    color: statusConfig.color,
                    fontWeight: isCurrent ? '600' : '500',
                    fontSize: '12px',
                    cursor: isCurrent ? 'default' : 'pointer',
                    opacity: isCurrent ? 1 : 0.9
                  }}
                  onMouseEnter={e => {
                    if (!isCurrent) {
                      e.currentTarget.style.backgroundColor = statusConfig.bg
                      e.currentTarget.style.borderColor = statusConfig.border
                      e.currentTarget.style.opacity = '1'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isCurrent) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.borderColor = 'transparent'
                      e.currentTarget.style.opacity = '0.9'
                    }
                  }}
                >
                  {statusConfig.icon}
                  <span style={{ flex: 1, textAlign: 'left' }}>
                    {statusConfig.label}
                  </span>
                  {isCurrent && (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 opacity-60">
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                    </svg>
                  )}
                </button>
              )
            })}
          </div>

        </div>
      </>,
      document.body
    )}
    </>
  )
}

// Appointment card component
function AppointmentCard({
  appointment,
  stylist,
  compact = false,
  onStatusChange,
  onProcessPayment
}: {
  appointment: Appointment
  stylist?: Stylist
  compact?: boolean
  onStatusChange?: (appointmentId: string, newStatus: string, currentStatus: string) => void
  onProcessPayment?: (appointment: any) => void
}) {
  // Access COLORS from parent scope
  const COLORS = {
    champagne: '#F5E6C8',
    bronze: '#8C7853',
    gold: '#D4AF37'
  }

  return (
    <div className="flex items-start gap-2 relative">
      {/* ✨ ENTERPRISE: Status Badge - Smart Positioning (Inside Card Boundaries) */}
      <div
        className="absolute top-0 right-0 z-50"
        onClick={(e) => {
          e.stopPropagation() // Prevent opening appointment when clicking status badge
        }}
      >
        <AppointmentStatusBadge
          status={appointment.status}
          appointment={appointment}
          onStatusChange={
            onStatusChange
              ? (newStatus, currentStatus) => onStatusChange(appointment.id, newStatus, currentStatus)
              : undefined
          }
          onProcessPayment={onProcessPayment}
          compact={compact}
        />
      </div>

      {/* ✨ ENHANCED: Status-colored icon circle with improved depth */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-transform duration-200"
        style={{
          backgroundColor: appointment.color,
          boxShadow: `0 2px 8px ${appointment.color}60, inset 0 1px 0 rgba(255,255,255,0.25)`,
          border: `1.5px solid ${appointment.color}`,
          color: '#1A1A1A' // Dark text for better contrast
        }}
      >
        {appointment.icon}
      </div>
      <div className="flex-1 min-w-0 pr-20">
        {/* Added pr-20 to ensure enough space for status badge without overlap */}
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
            {/* ✨ ENHANCED: Price badge with stronger contrast and depth */}
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0.5 calendar-appointment-badge font-bold"
              style={{
                backgroundColor: `${appointment.color}35`,
                color: appointment.color,
                border: `1px solid ${appointment.color}`,
                boxShadow: `0 1px 4px ${appointment.color}40`,
                borderRadius: '6px'
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
    </div>
  )
}
