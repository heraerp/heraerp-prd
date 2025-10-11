'use client'

export const dynamic = 'force-dynamic'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import {
  useHeraAppointments,
  type Appointment,
  type AppointmentStatus,
  STATUS_CONFIG,
  VALID_STATUS_TRANSITIONS
} from '@/hooks/useHeraAppointments'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { useHeraCustomers } from '@/hooks/useHeraCustomers'
import { useHeraServices } from '@/hooks/useHeraServicesV2'
import { useHeraStaff } from '@/hooks/useHeraStaff'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
import { AppointmentModal } from '@/components/salon/appointments/AppointmentModal'
import {
  Plus,
  Clock,
  Calendar,
  CheckCircle,
  CalendarDays,
  Search,
  Edit,
  Trash2,
  Building2,
  Archive,
  DollarSign,
  User,
  Sparkles,
  LayoutGrid,
  LayoutList,
  X,
  RotateCcw,
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/luxe-dialog'
import { Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { format, addMinutes, parse } from 'date-fns'
import { cn } from '@/lib/utils'

// Enterprise Salon Theme - Soft Animations & Modern Aesthetics
const LUXE_COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  rose: '#E8B4B8',
  // Soft spring-like animation curves
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  ease: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)'
}

interface AppointmentStats {
  totalAppointments: number
  todayAppointments: number
  upcomingAppointments: number
  completedAppointments: number
}

type ViewMode = 'grid' | 'list'

function AppointmentsContent() {
  const router = useRouter()
  const { organizationId, isLoading: contextLoading, isAuthenticated } = useSecuredSalonContext()

  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()

  // State declarations
  const [searchTerm, setSearchTerm] = useState('')
  const [showArchivedAppointments, setShowArchivedAppointments] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [postponeDialogOpen, setPostponeDialogOpen] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null)
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null)
  const [appointmentToPostpone, setAppointmentToPostpone] = useState<Appointment | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [postponeDate, setPostponeDate] = useState('')
  const [postponeTime, setPostponeTime] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // ✨ ENTERPRISE: Modal state
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Use the universal entity hook for appointments
  const {
    appointments,
    isLoading,
    archiveAppointment,
    deleteAppointment,
    restoreAppointment,
    updateAppointment,
    updateAppointmentStatus,
    canTransitionTo,
    isDeleting,
    isUpdating
  } = useHeraAppointments({
    organizationId: organizationId || '',
    includeArchived: showArchivedAppointments,
    userRole: 'manager'
  })

  // Branch filter hook
  const {
    branchId,
    branches,
    loading: branchesLoading,
    setBranchId,
    hasMultipleBranches
  } = useBranchFilter(organizationId, 'salon-appointments-list')

  // ✨ ENTERPRISE: Load data for modal
  const { customers } = useHeraCustomers({ organizationId: organizationId || '' })
  const { services } = useHeraServices({ organizationId: organizationId || '' })
  const { staff } = useHeraStaff({ organizationId: organizationId || '' })

  // 🕐 ENTERPRISE: Generate time slots for reschedule (9 AM - 9 PM, 30-min intervals)
  const generateTimeSlots = useCallback((): Array<{ start: string; end: string }> => {
    const slots: Array<{ start: string; end: string }> = []
    const startHour = 9
    const endHour = 21

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of [0, 30]) {
        const start = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push({
          start,
          end: format(addMinutes(parse(start, 'HH:mm', new Date()), 30), 'HH:mm')
        })
      }
    }

    return slots
  }, [])

  // 🔍 ENTERPRISE: Check for time slot conflicts - Only booked appointments block slots
  const checkTimeSlotConflict = useCallback(
    (
      timeStr: string,
      date: string,
      stylistId: string | null,
      duration: number,
      excludeAppointmentId?: string
    ) => {
      if (!date || !stylistId) {
        return { hasConflict: false, conflictingAppointment: null }
      }

      const checkDateTime = new Date(`${date}T${timeStr}`)
      const checkEndTime = addMinutes(checkDateTime, duration)

      // ✨ ENTERPRISE: Only these statuses block time slots
      const BLOCKING_STATUSES = [
        'booked', // Confirmed appointment
        'checked_in', // Customer has arrived
        'in_progress', // Service is happening
        'payment_pending' // Service done, awaiting payment
      ]

      for (const apt of appointments || []) {
        // Skip current appointment when editing
        if (excludeAppointmentId && apt.id === excludeAppointmentId) continue

        // Only check same stylist appointments
        if (apt.stylist_id !== stylistId) continue

        // ✨ ENTERPRISE: Only block if appointment status requires the time slot
        if (!BLOCKING_STATUSES.includes(apt.status)) {
          continue
        }

        const aptStart = new Date(apt.start_time)
        const aptEnd = new Date(apt.end_time)

        // Check for overlap
        if (
          (checkDateTime >= aptStart && checkDateTime < aptEnd) ||
          (checkEndTime > aptStart && checkEndTime <= aptEnd) ||
          (checkDateTime <= aptStart && checkEndTime >= aptEnd)
        ) {
          return { hasConflict: true, conflictingAppointment: apt }
        }
      }

      return { hasConflict: false, conflictingAppointment: null }
    },
    [appointments]
  )

  // ✅ FIX: Clear selected time when date changes (forces time slot reload in reschedule modal)
  useEffect(() => {
    if (postponeDialogOpen && postponeDate) {
      // Keep existing time if modal just opened with pre-populated date
      // But clear time if user actively changes the date
      const appointmentDate = appointmentToPostpone?.start_time
        ? format(new Date(appointmentToPostpone.start_time), 'yyyy-MM-dd')
        : null

      // Only clear time if date changed from original appointment date
      if (appointmentDate && postponeDate !== appointmentDate && postponeTime) {
        setPostponeTime('')
        console.log('[Appointments] ⚡ Time slots reloading for new date:', postponeDate)
      }
    }
  }, [postponeDate, postponeDialogOpen, appointmentToPostpone, postponeTime])

  // ⚡ PERFORMANCE: Memoize stats calculation
  const stats: AppointmentStats = useMemo(() => {
    if (!appointments)
      return {
        totalAppointments: 0,
        todayAppointments: 0,
        upcomingAppointments: 0,
        completedAppointments: 0
      }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return {
      totalAppointments: appointments.length,
      todayAppointments: appointments.filter(a => {
        if (!a.start_time) return false
        const appointmentDate = new Date(a.start_time)
        return appointmentDate.toDateString() === today.toDateString()
      }).length,
      upcomingAppointments: appointments.filter(a => {
        if (!a.start_time) return false
        const appointmentDate = new Date(a.start_time)
        return appointmentDate >= today && a.status === 'booked'
      }).length,
      completedAppointments: appointments.filter(a => a.status === 'completed').length
    }
  }, [appointments])

  // ⚡ PERFORMANCE: Memoize handlers with useCallback
  const handleConfirmDeleteAppointment = useCallback(async () => {
    if (!appointmentToDelete) return

    const loadingId = showLoading('Deleting appointment...', 'Please wait')

    try {
      await deleteAppointment(appointmentToDelete.id)
      removeToast(loadingId)
      showSuccess('Appointment deleted', 'Successfully deleted appointment permanently')
      setDeleteConfirmOpen(false)
      setAppointmentToDelete(null)
    } catch (error) {
      removeToast(loadingId)
      showError(
        'Failed to delete appointment',
        error instanceof Error ? error.message : 'Please try again'
      )
    }
  }, [appointmentToDelete, deleteAppointment, showLoading, removeToast, showSuccess, showError])

  const handleConfirmCancelAppointment = useCallback(async () => {
    if (!appointmentToCancel) return

    const loadingId = showLoading('Cancelling appointment...', 'Please wait')

    try {
      // ✅ ENTERPRISE: Update status to cancelled with reason
      await updateAppointmentStatus({
        id: appointmentToCancel.id,
        status: 'cancelled'
      })

      // If reason provided, save it in metadata
      if (cancelReason.trim()) {
        await updateAppointment({
          id: appointmentToCancel.id,
          data: {
            notes:
              `${appointmentToCancel.notes || ''}\n\nCancellation reason: ${cancelReason}`.trim()
          }
        })
      }

      removeToast(loadingId)
      showSuccess(
        'Appointment cancelled',
        `${appointmentToCancel.customer_name}'s appointment has been cancelled`
      )
      setCancelConfirmOpen(false)
      setAppointmentToCancel(null)
      setCancelReason('') // Reset reason
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to cancel appointment', error.message || 'Please try again')
    }
  }, [
    appointmentToCancel,
    cancelReason,
    updateAppointmentStatus,
    updateAppointment,
    showLoading,
    removeToast,
    showSuccess,
    showError
  ])

  const handleConfirmPostponeAppointment = useCallback(async () => {
    if (!appointmentToPostpone || !postponeDate || !postponeTime) {
      showError('Validation error', 'Please select both date and time')
      return
    }

    const loadingId = showLoading('Rescheduling appointment...', 'Please wait')

    try {
      // ✅ ENTERPRISE: Combine date and time
      const newDateTime = new Date(`${postponeDate}T${postponeTime}`)
      const currentDuration = appointmentToPostpone.duration_minutes || 60
      const newEndTime = new Date(newDateTime.getTime() + currentDuration * 60000)

      await updateAppointment({
        id: appointmentToPostpone.id,
        data: {
          start_time: newDateTime.toISOString(),
          end_time: newEndTime.toISOString(),
          notes:
            `${appointmentToPostpone.notes || ''}\n\nRescheduled from ${format(new Date(appointmentToPostpone.start_time), 'MMM d, yyyy • h:mm a')}`.trim()
        }
      })

      removeToast(loadingId)
      showSuccess(
        'Appointment rescheduled',
        `Moved to ${format(newDateTime, 'MMM d, yyyy • h:mm a')}`
      )
      setPostponeDialogOpen(false)
      setAppointmentToPostpone(null)
      setPostponeDate('')
      setPostponeTime('')
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to reschedule appointment', error.message || 'Please try again')
    }
  }, [
    appointmentToPostpone,
    postponeDate,
    postponeTime,
    updateAppointment,
    showLoading,
    removeToast,
    showSuccess,
    showError
  ])

  const handleRestoreAppointment = useCallback(
    async (appointment: Appointment) => {
      const loadingId = showLoading('Restoring appointment...', 'Please wait')

      try {
        await restoreAppointment(appointment.id)
        removeToast(loadingId)
        showSuccess('Appointment restored', `${appointment.entity_name} has been restored`)
      } catch (error: any) {
        removeToast(loadingId)
        showError('Failed to restore appointment', error.message || 'Please try again')
      }
    },
    [restoreAppointment, showLoading, removeToast, showSuccess, showError]
  )

  const handleStatusTransition = useCallback(
    async (appointment: Appointment, newStatus: AppointmentStatus) => {
      const loadingId = showLoading(
        `Updating to ${STATUS_CONFIG[newStatus].label}...`,
        'Please wait'
      )

      try {
        // ✅ FIXED: Pass object with id and status properties (not separate parameters)
        await updateAppointmentStatus({ id: appointment.id, status: newStatus })
        removeToast(loadingId)
        showSuccess(
          'Status updated',
          `Appointment status changed to ${STATUS_CONFIG[newStatus].label}`
        )
      } catch (error: any) {
        removeToast(loadingId)
        showError('Failed to update status', error.message || 'Please try again')
      }
    },
    [updateAppointmentStatus, showLoading, removeToast, showSuccess, showError]
  )

  // ⚡ PERFORMANCE: Memoize filtered appointments
  const filteredAppointments = useMemo(() => {
    if (!appointments) return []

    return appointments.filter(a => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        (a.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (a.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (a.stylist_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

      // Branch filter - Fixed to properly handle empty string and __ALL__
      const matchesBranch =
        !hasMultipleBranches ||
        !branchId ||
        branchId === '' ||
        branchId === '__ALL__' ||
        a.branch_id === branchId

      // Status filter
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter

      // Date filter
      let matchesDate = true
      if (dateFilter !== 'all' && a.start_time) {
        const appointmentDate = new Date(a.start_time)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        switch (dateFilter) {
          case 'today':
            matchesDate = appointmentDate.toDateString() === today.toDateString()
            break
          case 'upcoming':
            matchesDate = appointmentDate >= today
            break
          case 'past':
            matchesDate = appointmentDate < today
            break
        }
      }

      return matchesSearch && matchesBranch && matchesStatus && matchesDate
    })
  }, [appointments, searchTerm, hasMultipleBranches, branchId, statusFilter, dateFilter])

  // ⚡ PERFORMANCE: Memoize branch name lookup
  const getBranchName = useCallback(
    (branchId: string | null) => {
      if (!branchId) return null
      const branch = branches.find(b => b.id === branchId)
      return branch?.name || null
    },
    [branches]
  )

  // 🎯 ENTERPRISE: Three-layer loading state
  // Layer 1: Context Loading (SecuredSalonProvider initializing)
  if (contextLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.black }}
      >
        <div
          className="text-center p-8 rounded-xl backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(15,15,15,0.95) 100%)',
            border: `1px solid ${LUXE_COLORS.gold}20`,
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}
        >
          <Loader2
            className="w-8 h-8 animate-spin mx-auto mb-4"
            style={{ color: LUXE_COLORS.gold }}
          />
          <h2 className="text-xl font-medium mb-2" style={{ color: LUXE_COLORS.champagne }}>
            Initializing Security...
          </h2>
          <p style={{ color: LUXE_COLORS.bronze }}>Validating your session</p>
        </div>
      </div>
    )
  }

  // Layer 2: Authentication Check
  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.black }}
      >
        <div
          className="text-center p-8 rounded-xl backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(15,15,15,0.95) 100%)',
            border: `1px solid ${LUXE_COLORS.gold}20`,
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}
        >
          <Shield className="w-8 h-8 mx-auto mb-4" style={{ color: LUXE_COLORS.gold }} />
          <h2 className="text-xl font-medium mb-2" style={{ color: LUXE_COLORS.champagne }}>
            Authentication Required
          </h2>
          <p style={{ color: LUXE_COLORS.bronze }}>Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Layer 3: Organization ID Check
  if (!organizationId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.black }}
      >
        <div
          className="text-center p-8 rounded-xl backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(15,15,15,0.95) 100%)',
            border: `1px solid ${LUXE_COLORS.gold}20`,
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}
        >
          <Loader2
            className="w-8 h-8 animate-spin mx-auto mb-4"
            style={{ color: LUXE_COLORS.gold }}
          />
          <h2 className="text-xl font-medium mb-2" style={{ color: LUXE_COLORS.champagne }}>
            Loading Organization...
          </h2>
          <p style={{ color: LUXE_COLORS.bronze }}>Setting up your workspace</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: LUXE_COLORS.black }}>
      {/* Main Container with Glassmorphism */}
      <div
        className="rounded-2xl p-8 backdrop-blur-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(15,15,15,0.95) 100%)',
          border: `1px solid ${LUXE_COLORS.gold}15`,
          boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.1)'
        }}
      >
        {/* Header with Gradient Title */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1
              className="text-4xl font-bold mb-2"
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em'
              }}
            >
              Appointments
            </h1>
            <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
              Manage salon appointments and bookings with elegance
            </p>
          </div>
          <div className="flex gap-3">
            {/* View Toggle */}
            <div
              className="flex rounded-lg p-1"
              style={{
                background: 'rgba(245,230,200,0.05)',
                border: `1px solid ${LUXE_COLORS.gold}20`
              }}
            >
              <button
                onClick={() => setViewMode('grid')}
                className="px-3 py-2 rounded-md transition-all duration-300"
                style={{
                  background:
                    viewMode === 'grid'
                      ? `linear-gradient(135deg, ${LUXE_COLORS.gold}30 0%, ${LUXE_COLORS.gold}20 100%)`
                      : 'transparent',
                  color: viewMode === 'grid' ? LUXE_COLORS.gold : LUXE_COLORS.bronze,
                  border:
                    viewMode === 'grid'
                      ? `1px solid ${LUXE_COLORS.gold}40`
                      : '1px solid transparent',
                  transitionTimingFunction: LUXE_COLORS.spring
                }}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="px-3 py-2 rounded-md transition-all duration-300"
                style={{
                  background:
                    viewMode === 'list'
                      ? `linear-gradient(135deg, ${LUXE_COLORS.gold}30 0%, ${LUXE_COLORS.gold}20 100%)`
                      : 'transparent',
                  color: viewMode === 'list' ? LUXE_COLORS.gold : LUXE_COLORS.bronze,
                  border:
                    viewMode === 'list'
                      ? `1px solid ${LUXE_COLORS.gold}40`
                      : '1px solid transparent',
                  transitionTimingFunction: LUXE_COLORS.spring
                }}
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
            <Button
              onClick={() => router.push('/salon/appointments/calendar')}
              className="transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.emerald} 0%, ${LUXE_COLORS.emerald}DD 100%)`,
                color: LUXE_COLORS.champagne,
                border: 'none',
                boxShadow: '0 4px 12px rgba(15,111,92,0.2)',
                transitionTimingFunction: LUXE_COLORS.spring
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(15,111,92,0.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,111,92,0.2)'
              }}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar View
            </Button>
            <Button
              onClick={() => router.push('/salon/kanban')}
              className="transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.bronze} 0%, ${LUXE_COLORS.bronze}DD 100%)`,
                color: LUXE_COLORS.champagne,
                border: 'none',
                boxShadow: '0 4px 12px rgba(140,120,83,0.2)',
                transitionTimingFunction: LUXE_COLORS.spring
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(140,120,83,0.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(140,120,83,0.2)'
              }}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Kanban Board
            </Button>
            <Button
              onClick={() => router.push('/salon/appointments/new')}
              className="transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
                color: LUXE_COLORS.black,
                border: 'none',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(212,175,55,0.3)',
                transitionTimingFunction: LUXE_COLORS.spring
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(212,175,55,0.4)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(212,175,55,0.3)'
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>

        {/* Stats Cards with Soft Spring Animations */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Appointments',
              value: stats.totalAppointments,
              desc: 'All time',
              icon: CalendarDays,
              color: LUXE_COLORS.emerald,
              gradient:
                'linear-gradient(135deg, rgba(15,111,92,0.15) 0%, rgba(15,111,92,0.05) 100%)'
            },
            {
              title: 'Today',
              value: stats.todayAppointments,
              desc: 'Scheduled today',
              icon: Clock,
              color: LUXE_COLORS.gold,
              gradient:
                'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)'
            },
            {
              title: 'Upcoming',
              value: stats.upcomingAppointments,
              desc: 'Future bookings',
              icon: Calendar,
              color: LUXE_COLORS.bronze,
              gradient:
                'linear-gradient(135deg, rgba(140,120,83,0.15) 0%, rgba(140,120,83,0.05) 100%)'
            },
            {
              title: 'Completed',
              value: stats.completedAppointments,
              desc: 'Finished',
              icon: CheckCircle,
              color: LUXE_COLORS.champagne,
              gradient:
                'linear-gradient(135deg, rgba(245,230,200,0.15) 0%, rgba(245,230,200,0.05) 100%)'
            }
          ].map((stat, index) => (
            <div
              key={index}
              className="rounded-xl p-6 transition-all duration-500 cursor-pointer"
              style={{
                background: stat.gradient,
                border: `1px solid ${stat.color}20`,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transitionTimingFunction: LUXE_COLORS.spring
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.2)'
                e.currentTarget.style.borderColor = `${stat.color}50`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
                e.currentTarget.style.borderColor = `${stat.color}20`
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium" style={{ color: LUXE_COLORS.bronze }}>
                  {stat.title}
                </p>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: LUXE_COLORS.champagne }}>
                {stat.value}
              </div>
              <p className="text-xs" style={{ color: LUXE_COLORS.bronze, opacity: 0.7 }}>
                {stat.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Search and Filters with Enhanced Styling */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[300px]">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: LUXE_COLORS.bronze }}
              />
              <Input
                placeholder="Search by customer, stylist..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-6 border-0 outline-none transition-all duration-300"
                style={{
                  background: 'rgba(245,230,200,0.05)',
                  border: `1px solid ${LUXE_COLORS.gold}20`,
                  color: LUXE_COLORS.champagne,
                  borderRadius: '0.75rem',
                  transitionTimingFunction: LUXE_COLORS.smooth
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}50`
                  e.currentTarget.style.background = 'rgba(245,230,200,0.08)'
                  e.currentTarget.style.boxShadow = `0 0 0 4px ${LUXE_COLORS.gold}10`
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}20`
                  e.currentTarget.style.background = 'rgba(245,230,200,0.05)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Branch Filter - Truncate long names */}
            {hasMultipleBranches && (
              <div className="w-64">
                <Select
                  value={branchId || '__ALL__'}
                  onValueChange={value => setBranchId(value === '__ALL__' ? '' : value)}
                >
                  <SelectTrigger
                    className="border-0 outline-none py-6 transition-all duration-300"
                    style={{
                      background: 'rgba(245,230,200,0.05)',
                      border: `1px solid ${LUXE_COLORS.gold}20`,
                      color: LUXE_COLORS.champagne,
                      borderRadius: '0.75rem',
                      transitionTimingFunction: LUXE_COLORS.smooth
                    }}
                  >
                    <div className="flex items-center gap-2 w-full overflow-hidden">
                      <Building2
                        className="h-4 w-4 flex-shrink-0"
                        style={{ color: LUXE_COLORS.bronze }}
                      />
                      <span className="truncate block max-w-[180px]">
                        <SelectValue placeholder="All locations" />
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__ALL__">All locations</SelectItem>
                    {branchesLoading ? (
                      <SelectItem value="__LOADING__" disabled>
                        Loading...
                      </SelectItem>
                    ) : (
                      branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>
                          <span
                            className="block truncate max-w-[240px]"
                            title={branch.name || 'Unnamed Branch'}
                          >
                            {branch.name || 'Unnamed Branch'}
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status Filter */}
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="border-0 outline-none py-6 transition-all duration-300"
                  style={{
                    background: 'rgba(245,230,200,0.05)',
                    border: `1px solid ${LUXE_COLORS.gold}20`,
                    color: LUXE_COLORS.champagne,
                    borderRadius: '0.75rem',
                    transitionTimingFunction: LUXE_COLORS.smooth
                  }}
                >
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="w-48">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger
                  className="border-0 outline-none py-6 transition-all duration-300"
                  style={{
                    background: 'rgba(245,230,200,0.05)',
                    border: `1px solid ${LUXE_COLORS.gold}20`,
                    color: LUXE_COLORS.champagne,
                    borderRadius: '0.75rem',
                    transitionTimingFunction: LUXE_COLORS.smooth
                  }}
                >
                  <SelectValue placeholder="All dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Archived Toggle */}
            <Button
              onClick={() => setShowArchivedAppointments(!showArchivedAppointments)}
              className="whitespace-nowrap transition-all duration-300"
              style={{
                background: showArchivedAppointments
                  ? `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`
                  : 'rgba(245,230,200,0.05)',
                color: showArchivedAppointments ? LUXE_COLORS.black : LUXE_COLORS.champagne,
                border: `1px solid ${LUXE_COLORS.gold}${showArchivedAppointments ? '' : '30'}`,
                fontWeight: showArchivedAppointments ? '600' : '400',
                transitionTimingFunction: LUXE_COLORS.spring
              }}
            >
              <Archive className="h-4 w-4 mr-2" />
              {showArchivedAppointments ? 'Hide Archived' : 'Show Archived'}
            </Button>
          </div>
        </div>

        {/* Appointments List/Grid with Enhanced Cards */}
        {filteredAppointments.length === 0 ? (
          <div
            className="text-center py-20 rounded-xl transition-all duration-500"
            style={{
              background: 'rgba(245,230,200,0.03)',
              border: `1px solid ${LUXE_COLORS.gold}10`,
              transitionTimingFunction: LUXE_COLORS.spring
            }}
          >
            <Sparkles
              className="w-12 h-12 mx-auto mb-4"
              style={{ color: LUXE_COLORS.bronze, opacity: 0.5 }}
            />
            <h3 className="text-xl font-medium mb-2" style={{ color: LUXE_COLORS.champagne }}>
              No appointments found
            </h3>
            <p className="text-sm mb-6" style={{ color: LUXE_COLORS.bronze }}>
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first appointment to get started'}
            </p>
            {!searchTerm && statusFilter === 'all' && dateFilter === 'all' && (
              <Button
                onClick={() => router.push('/salon/appointments/new')}
                className="transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
                  color: LUXE_COLORS.black,
                  border: 'none',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(212,175,55,0.3)',
                  transitionTimingFunction: LUXE_COLORS.spring
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(212,175,55,0.4)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(212,175,55,0.3)'
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredAppointments.map(appointment => {
              const appointmentDate = appointment.start_time
                ? new Date(appointment.start_time)
                : null
              const branchName = getBranchName(appointment.branch_id)

              return (
                <div
                  key={appointment.id}
                  onClick={() => {
                    setSelectedAppointment(appointment)
                    setModalOpen(true)
                  }}
                  className={`rounded-xl p-6 transition-all duration-500 cursor-pointer ${viewMode === 'list' ? 'flex items-center justify-between' : ''} relative overflow-hidden group`}
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(245,230,200,0.08) 0%, rgba(212,175,55,0.05) 50%, rgba(184,134,11,0.03) 100%)',
                    border: `1px solid ${LUXE_COLORS.gold}25`,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1)',
                    opacity:
                      appointment.status === 'archived' || appointment.status === 'cancelled'
                        ? 0.6
                        : 1,
                    transitionTimingFunction: LUXE_COLORS.spring,
                    backdropFilter: 'blur(8px)'
                  }}
                  onMouseMove={e => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = ((e.clientX - rect.left) / rect.width) * 100
                    const y = ((e.clientY - rect.top) / rect.height) * 100
                    e.currentTarget.style.background = `
                      radial-gradient(circle at ${x}% ${y}%,
                        rgba(212,175,55,0.15) 0%,
                        rgba(212,175,55,0.08) 30%,
                        rgba(245,230,200,0.05) 60%,
                        rgba(184,134,11,0.03) 100%
                      )
                    `
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform =
                      viewMode === 'grid' ? 'translateY(-8px) scale(1.03)' : 'translateX(6px)'
                    e.currentTarget.style.boxShadow =
                      '0 20px 40px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.15)'
                    e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}60`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1) translateX(0)'
                    e.currentTarget.style.boxShadow =
                      '0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1)'
                    e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}25`
                    e.currentTarget.style.background =
                      'linear-gradient(135deg, rgba(245,230,200,0.08) 0%, rgba(212,175,55,0.05) 50%, rgba(184,134,11,0.03) 100%)'
                  }}
                >
                  <div
                    className={viewMode === 'list' ? 'flex-1 flex items-center gap-6' : 'space-y-4'}
                  >
                    {/* Header */}
                    <div
                      className={
                        viewMode === 'list' ? 'flex-1' : 'flex items-start justify-between'
                      }
                    >
                      <div className="flex-1">
                        <h3
                          className="font-semibold text-lg mb-1"
                          style={{ color: LUXE_COLORS.champagne }}
                        >
                          {appointment.customer_name || 'Customer'}
                        </h3>
                        <div
                          className="flex items-center gap-2 text-sm"
                          style={{ color: LUXE_COLORS.bronze }}
                        >
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {appointment.stylist_name || 'Unassigned'}
                          </span>
                        </div>
                        {branchName && viewMode === 'list' && (
                          <div
                            className="flex items-center gap-2 text-xs mt-1"
                            style={{ color: LUXE_COLORS.bronze, opacity: 0.7 }}
                          >
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate max-w-[200px]" title={branchName}>
                              {branchName}
                            </span>
                          </div>
                        )}
                      </div>
                      {viewMode === 'grid' && (
                        <Badge
                          className="transition-all duration-300 ml-2 flex-shrink-0"
                          style={{
                            background: `${STATUS_CONFIG[appointment.status as AppointmentStatus]?.color}20`,
                            color:
                              STATUS_CONFIG[appointment.status as AppointmentStatus]?.color ||
                              LUXE_COLORS.bronze,
                            border: `1px solid ${STATUS_CONFIG[appointment.status as AppointmentStatus]?.color}40`,
                            fontWeight: '500',
                            textTransform: 'capitalize'
                          }}
                        >
                          {STATUS_CONFIG[appointment.status as AppointmentStatus]?.label ||
                            appointment.status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>

                    {/* Appointment Details */}
                    {viewMode === 'list' ? (
                      <div className="flex items-center gap-6">
                        {appointmentDate && (
                          <>
                            <div
                              className="flex items-center gap-2 text-sm min-w-[180px]"
                              style={{ color: LUXE_COLORS.bronze }}
                            >
                              <Calendar
                                className="w-4 h-4 flex-shrink-0"
                                style={{ color: LUXE_COLORS.gold }}
                              />
                              <span className="font-medium whitespace-nowrap">
                                {format(appointmentDate, 'MMM d, yyyy')}
                              </span>
                            </div>
                            <div
                              className="flex items-center gap-2 text-sm min-w-[120px]"
                              style={{ color: LUXE_COLORS.bronze }}
                            >
                              <Clock
                                className="w-4 h-4 flex-shrink-0"
                                style={{ color: LUXE_COLORS.gold }}
                              />
                              <span className="font-medium whitespace-nowrap">
                                {format(appointmentDate, 'h:mm a')}
                              </span>
                            </div>
                          </>
                        )}
                        {appointment.price !== undefined && appointment.price > 0 && (
                          <div
                            className="flex items-center gap-2 text-sm font-medium min-w-[100px]"
                            style={{ color: LUXE_COLORS.champagne }}
                          >
                            <DollarSign
                              className="w-4 h-4 flex-shrink-0"
                              style={{ color: LUXE_COLORS.gold }}
                            />
                            <span className="whitespace-nowrap">
                              {appointment.currency_code || 'AED'} {appointment.price.toFixed(2)}
                            </span>
                          </div>
                        )}
                        <Badge
                          className="transition-all duration-300 flex-shrink-0"
                          style={{
                            background: `${STATUS_CONFIG[appointment.status as AppointmentStatus]?.color}20`,
                            color:
                              STATUS_CONFIG[appointment.status as AppointmentStatus]?.color ||
                              LUXE_COLORS.bronze,
                            border: `1px solid ${STATUS_CONFIG[appointment.status as AppointmentStatus]?.color}40`,
                            fontWeight: '500',
                            textTransform: 'capitalize',
                            minWidth: '90px',
                            textAlign: 'center'
                          }}
                        >
                          {STATUS_CONFIG[appointment.status as AppointmentStatus]?.label ||
                            appointment.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ) : (
                      <div
                        className="space-y-3 pt-3"
                        style={{ borderTop: `1px solid ${LUXE_COLORS.gold}10` }}
                      >
                        {appointmentDate && (
                          <>
                            <div
                              className="flex items-center gap-3 text-sm"
                              style={{ color: LUXE_COLORS.bronze }}
                            >
                              <Calendar
                                className="w-4 h-4 flex-shrink-0"
                                style={{ color: LUXE_COLORS.gold }}
                              />
                              <span className="font-medium">
                                {format(appointmentDate, 'EEEE, MMM d, yyyy')}
                              </span>
                            </div>
                            <div
                              className="flex items-center gap-3 text-sm"
                              style={{ color: LUXE_COLORS.bronze }}
                            >
                              <Clock
                                className="w-4 h-4 flex-shrink-0"
                                style={{ color: LUXE_COLORS.gold }}
                              />
                              <span className="font-medium">
                                {format(appointmentDate, 'h:mm a')}
                                {appointment.duration_minutes && (
                                  <span className="ml-2 opacity-70">
                                    ({appointment.duration_minutes} min)
                                  </span>
                                )}
                              </span>
                            </div>
                          </>
                        )}
                        {branchName && (
                          <div
                            className="flex items-center gap-3 text-sm"
                            style={{ color: LUXE_COLORS.bronze }}
                          >
                            <Building2
                              className="w-4 h-4 flex-shrink-0"
                              style={{ color: LUXE_COLORS.gold }}
                            />
                            <span className="truncate font-medium" title={branchName}>
                              {branchName}
                            </span>
                          </div>
                        )}
                        {appointment.price !== undefined && appointment.price > 0 && (
                          <div
                            className="flex items-center gap-3 text-sm font-medium"
                            style={{ color: LUXE_COLORS.champagne }}
                          >
                            <DollarSign
                              className="w-4 h-4 flex-shrink-0"
                              style={{ color: LUXE_COLORS.gold }}
                            />
                            <span>
                              {appointment.currency_code || 'AED'} {appointment.price.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes - Only in grid view */}
                    {viewMode === 'grid' && appointment.notes && (
                      <div
                        className="p-3 rounded-lg text-xs italic"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.03) 100%)',
                          border: `1px solid ${LUXE_COLORS.gold}15`,
                          color: LUXE_COLORS.bronze
                        }}
                      >
                        <p className="line-clamp-2">{appointment.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* ✨ ENTERPRISE: Action Buttons Row */}
                  <div
                    className="flex items-center justify-between mt-4 pt-3"
                    style={{ borderTop: `1px solid ${LUXE_COLORS.gold}10` }}
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Status Transitions - Only ONE next status button (one step at a time) */}
                    <div className="flex gap-2 flex-wrap flex-1">
                      {(() => {
                        // Get next logical status (first non-cancelled option)
                        const nextStatus = VALID_STATUS_TRANSITIONS[
                          appointment.status as AppointmentStatus
                        ]?.find(s => s !== 'cancelled' && s !== 'no_show')

                        if (!nextStatus) return null

                        const statusInfo = STATUS_CONFIG[nextStatus]
                        return (
                          <Button
                            key={nextStatus}
                            size="sm"
                            onClick={e => {
                              e.stopPropagation()
                              handleStatusTransition(appointment, nextStatus)
                            }}
                            disabled={isUpdating}
                            className="transition-all duration-300 font-medium"
                            style={{
                              background: `linear-gradient(135deg, ${statusInfo.color}20 0%, ${statusInfo.color}15 100%)`,
                              color: statusInfo.color,
                              border: `1px solid ${statusInfo.color}40`,
                              transitionTimingFunction: LUXE_COLORS.spring,
                              fontSize: '0.75rem',
                              padding: '0.5rem 1rem',
                              boxShadow: `0 2px 8px ${statusInfo.color}10`
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = `linear-gradient(135deg, ${statusInfo.color}35 0%, ${statusInfo.color}25 100%)`
                              e.currentTarget.style.borderColor = `${statusInfo.color}70`
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                              e.currentTarget.style.boxShadow = `0 6px 16px ${statusInfo.color}25`
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = `linear-gradient(135deg, ${statusInfo.color}20 0%, ${statusInfo.color}15 100%)`
                              e.currentTarget.style.borderColor = `${statusInfo.color}40`
                              e.currentTarget.style.transform = 'translateY(0) scale(1)'
                              e.currentTarget.style.boxShadow = `0 2px 8px ${statusInfo.color}10`
                            }}
                          >
                            {statusInfo.label}
                          </Button>
                        )
                      })()}

                      {/* PAY Button - Payment Pending appointments */}
                      {appointment.status === 'payment_pending' && (
                        <Button
                          size="sm"
                          onClick={e => {
                            e.stopPropagation()
                            // 🎯 ENTERPRISE: Build comprehensive appointment data for POS
                            const appointmentData = {
                              id: appointment.id,
                              customer_name: appointment.customer_name,
                              customer_id: appointment.metadata?.customer_id,
                              stylist_name: appointment.stylist_name,
                              stylist_id: appointment.stylist_id,
                              service_name: appointment.metadata?.service_name,
                              service_id: appointment.metadata?.service_id,
                              start: appointment.start_time,
                              end: appointment.end_time,
                              price: appointment.price,
                              duration: appointment.duration_minutes,
                              status: appointment.status
                            }

                            // Store appointment details in sessionStorage for POS page
                            sessionStorage.setItem('pos_appointment', JSON.stringify(appointmentData))

                            // 🎯 ENTERPRISE: Redirect to POS with appointment ID
                            router.push(`/salon/pos?appointment=${appointment.id}`)
                          }}
                          className="transition-all duration-300 font-medium"
                          style={{
                            background: 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.15) 100%)',
                            color: '#10B981',
                            border: '1px solid rgba(16,185,129,0.4)',
                            borderRadius: '0.5rem',
                            fontSize: '0.75rem',
                            padding: '0.5rem 1rem',
                            boxShadow: '0 2px 8px rgba(16,185,129,0.1)',
                            cursor: 'pointer',
                            pointerEvents: 'auto'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.35) 0%, rgba(16,185,129,0.25) 100%)'
                            e.currentTarget.style.borderColor = 'rgba(16,185,129,0.7)'
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.25)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.15) 100%)'
                            e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'
                            e.currentTarget.style.transform = 'translateY(0) scale(1)'
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.1)'
                          }}
                        >
                          <CreditCard className="w-4 h-4 mr-2 inline" />
                          Pay Now
                        </Button>
                      )}
                    </div>

                    {/* Quick Action Icons */}
                    <div className="flex gap-2 ml-2 flex-shrink-0">
                      {/* Cancel Button - All active appointments */}
                      {appointment.status !== 'completed' &&
                        appointment.status !== 'cancelled' &&
                        appointment.status !== 'no_show' && (
                          <Button
                            size="sm"
                            onClick={e => {
                              e.stopPropagation()
                              setAppointmentToCancel(appointment)
                              setCancelConfirmOpen(true)
                            }}
                            className="transition-all duration-300 w-9 h-9 p-0"
                            style={{
                              background:
                                'linear-gradient(135deg, rgba(239,68,68,0.25) 0%, rgba(239,68,68,0.15) 100%)',
                              color: '#EF4444',
                              border: '1.5px solid rgba(239,68,68,0.5)',
                              boxShadow: '0 2px 8px rgba(239,68,68,0.15)'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background =
                                'linear-gradient(135deg, rgba(239,68,68,0.40) 0%, rgba(239,68,68,0.30) 100%)'
                              e.currentTarget.style.transform = 'scale(1.15) rotate(-5deg)'
                              e.currentTarget.style.boxShadow = '0 4px 16px rgba(239,68,68,0.30)'
                              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.8)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background =
                                'linear-gradient(135deg, rgba(239,68,68,0.25) 0%, rgba(239,68,68,0.15) 100%)'
                              e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(239,68,68,0.15)'
                              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'
                            }}
                            title="Cancel Appointment"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}

                      {/* Postpone Button - Draft, Booked, Checked In only */}
                      {(appointment.status === 'draft' ||
                        appointment.status === 'booked' ||
                        appointment.status === 'checked_in') && (
                        <Button
                          size="sm"
                          onClick={e => {
                            e.stopPropagation()
                            setAppointmentToPostpone(appointment)
                            setPostponeDialogOpen(true)
                            if (appointment.start_time) {
                              const currentDate = new Date(appointment.start_time)
                              setPostponeDate(format(currentDate, 'yyyy-MM-dd'))
                              setPostponeTime(format(currentDate, 'HH:mm'))
                            }
                          }}
                          className="transition-all duration-300 w-9 h-9 p-0"
                          style={{
                            background:
                              'linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(59,130,246,0.15) 100%)',
                            color: '#3B82F6',
                            border: '1.5px solid rgba(59,130,246,0.5)',
                            boxShadow: '0 2px 8px rgba(59,130,246,0.15)'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background =
                              'linear-gradient(135deg, rgba(59,130,246,0.40) 0%, rgba(59,130,246,0.30) 100%)'
                            e.currentTarget.style.transform = 'scale(1.15) rotate(5deg)'
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.30)'
                            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.8)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background =
                              'linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(59,130,246,0.15) 100%)'
                            e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.15)'
                            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'
                          }}
                          title="Postpone Appointment"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Delete Button - Draft only */}
                      {appointment.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={e => {
                            e.stopPropagation()
                            setAppointmentToDelete(appointment)
                            setDeleteConfirmOpen(true)
                          }}
                          className="transition-all duration-300 w-9 h-9 p-0"
                          style={{
                            background:
                              'linear-gradient(135deg, rgba(185,28,28,0.25) 0%, rgba(185,28,28,0.15) 100%)',
                            color: '#B91C1C',
                            border: '1.5px solid rgba(185,28,28,0.5)',
                            boxShadow: '0 2px 8px rgba(185,28,28,0.15)'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background =
                              'linear-gradient(135deg, rgba(185,28,28,0.40) 0%, rgba(185,28,28,0.30) 100%)'
                            e.currentTarget.style.transform = 'scale(1.15) rotate(-5deg)'
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(185,28,28,0.30)'
                            e.currentTarget.style.borderColor = 'rgba(185,28,28,0.8)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background =
                              'linear-gradient(135deg, rgba(185,28,28,0.25) 0%, rgba(185,28,28,0.15) 100%)'
                            e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(185,28,28,0.15)'
                            e.currentTarget.style.borderColor = 'rgba(185,28,28,0.5)'
                          }}
                          title="Delete Appointment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Restore Button - Cancelled/No Show only */}
                      {(appointment.status === 'cancelled' || appointment.status === 'no_show') && (
                        <Button
                          size="sm"
                          onClick={e => {
                            e.stopPropagation()
                            handleRestoreAppointment(appointment)
                          }}
                          className="transition-all duration-300 w-9 h-9 p-0"
                          style={{
                            background:
                              'linear-gradient(135deg, rgba(15,111,92,0.25) 0%, rgba(15,111,92,0.15) 100%)',
                            color: LUXE_COLORS.emerald,
                            border: `1.5px solid ${LUXE_COLORS.emerald}50`,
                            boxShadow: '0 2px 8px rgba(15,111,92,0.15)'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background =
                              'linear-gradient(135deg, rgba(15,111,92,0.40) 0%, rgba(15,111,92,0.30) 100%)'
                            e.currentTarget.style.transform = 'scale(1.15) rotate(5deg)'
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,111,92,0.30)'
                            e.currentTarget.style.borderColor = `${LUXE_COLORS.emerald}80`
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background =
                              'linear-gradient(135deg, rgba(15,111,92,0.25) 0%, rgba(15,111,92,0.15) 100%)'
                            e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(15,111,92,0.15)'
                            e.currentTarget.style.borderColor = `${LUXE_COLORS.emerald}50`
                          }}
                          title="Restore Appointment"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <DialogContent
          className="sm:max-w-[450px] border-0 p-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1A1A1A 0%, #0F0F0F 100%)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.2)'
          }}
        >
          <DialogHeader
            className="p-6 pb-4"
            style={{ borderBottom: `1px solid ${LUXE_COLORS.gold}15` }}
          >
            <DialogTitle className="text-xl" style={{ color: LUXE_COLORS.champagne }}>
              Cancel Appointment
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="mb-4" style={{ color: LUXE_COLORS.bronze }}>
              Are you sure you want to cancel this appointment? The customer will need to be
              notified.
            </p>
            {appointmentToCancel && (
              <div
                className="p-4 rounded-lg mb-4"
                style={{
                  background: 'rgba(140,120,83,0.1)',
                  border: `1px solid ${LUXE_COLORS.bronze}20`
                }}
              >
                <p className="font-medium mb-1" style={{ color: LUXE_COLORS.champagne }}>
                  {appointmentToCancel.customer_name || 'Customer'}
                </p>
                <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                  {appointmentToCancel.start_time &&
                    format(new Date(appointmentToCancel.start_time), 'MMM d, yyyy • h:mm a')}
                </p>
              </div>
            )}
            {/* ✅ ENTERPRISE: Cancellation reason field */}
            <div className="space-y-2">
              <Label style={{ color: LUXE_COLORS.champagne }}>
                Cancellation Reason <span style={{ color: LUXE_COLORS.bronze }}>(optional)</span>
              </Label>
              <Textarea
                placeholder="e.g., Customer requested, schedule conflict..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                rows={3}
                className="border-0"
                style={{
                  background: 'rgba(245,230,200,0.05)',
                  border: `1px solid ${LUXE_COLORS.gold}20`,
                  color: LUXE_COLORS.champagne,
                  borderRadius: '0.5rem'
                }}
              />
            </div>
          </div>
          <DialogFooter className="p-6 pt-0 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCancelConfirmOpen(false)}
              className="flex-1"
              style={{
                background: 'rgba(245,230,200,0.05)',
                border: `1px solid ${LUXE_COLORS.gold}20`,
                color: LUXE_COLORS.champagne
              }}
            >
              Keep Appointment
            </Button>
            <Button
              onClick={handleConfirmCancelAppointment}
              className="flex-1"
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.bronze} 0%, #73603F 100%)`,
                color: LUXE_COLORS.champagne,
                border: 'none',
                fontWeight: '600'
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent
          className="sm:max-w-[450px] border-0 p-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1A1A1A 0%, #0F0F0F 100%)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.2)'
          }}
        >
          <DialogHeader
            className="p-6 pb-4"
            style={{ borderBottom: `1px solid ${LUXE_COLORS.gold}15` }}
          >
            <DialogTitle className="text-xl" style={{ color: LUXE_COLORS.champagne }}>
              Delete Appointment Permanently
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="mb-6" style={{ color: LUXE_COLORS.bronze }}>
              Are you sure you want to permanently delete this appointment? This action cannot be
              undone and all data will be lost.
            </p>
            {appointmentToDelete && (
              <div
                className="p-4 rounded-lg mb-6"
                style={{
                  background: 'rgba(232,180,184,0.1)',
                  border: `1px solid ${LUXE_COLORS.rose}20`
                }}
              >
                <p className="font-medium mb-1" style={{ color: LUXE_COLORS.champagne }}>
                  {appointmentToDelete.customer_name || 'Customer'}
                </p>
                <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                  {appointmentToDelete.start_time &&
                    format(new Date(appointmentToDelete.start_time), 'MMM d, yyyy • h:mm a')}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="p-6 pt-0 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="flex-1"
              style={{
                background: 'rgba(245,230,200,0.05)',
                border: `1px solid ${LUXE_COLORS.gold}20`,
                color: LUXE_COLORS.champagne
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDeleteAppointment}
              disabled={isDeleting}
              className="flex-1"
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.rose} 0%, #D4969A 100%)`,
                color: LUXE_COLORS.black,
                border: 'none',
                fontWeight: '600'
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ ENTERPRISE: Postpone/Reschedule Dialog - Luxe Salon Theme */}
      <Dialog open={postponeDialogOpen} onOpenChange={setPostponeDialogOpen}>
        <DialogContent
          className="sm:max-w-[500px] border-0 p-0"
          style={{
            background: 'linear-gradient(135deg, #1A1A1A 0%, #0F0F0F 100%)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.2)'
          }}
        >
          <DialogHeader
            className="p-6 pb-4"
            style={{ borderBottom: `1px solid ${LUXE_COLORS.gold}15` }}
          >
            <DialogTitle
              className="text-xl flex items-center gap-2"
              style={{ color: LUXE_COLORS.champagne }}
            >
              <Clock className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
              Reschedule Appointment
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <p style={{ color: LUXE_COLORS.bronze }}>
              Select a new date and time for this appointment.
            </p>
            {appointmentToPostpone && (
              <div
                className="p-4 rounded-lg"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.08) 100%)',
                  border: `1px solid ${LUXE_COLORS.gold}30`,
                  boxShadow: '0 2px 8px rgba(212,175,55,0.1)'
                }}
              >
                <p className="font-medium mb-1" style={{ color: LUXE_COLORS.champagne }}>
                  {appointmentToPostpone.customer_name || 'Customer'}
                </p>
                <p className="text-sm mb-2" style={{ color: LUXE_COLORS.bronze }}>
                  Current:{' '}
                  {appointmentToPostpone.start_time &&
                    format(new Date(appointmentToPostpone.start_time), 'MMM d, yyyy • h:mm a')}
                </p>
                <p className="text-xs" style={{ color: LUXE_COLORS.bronze, opacity: 0.7 }}>
                  Duration: {appointmentToPostpone.duration_minutes || 60} minutes
                </p>
              </div>
            )}

            {/* ✅ ENTERPRISE: Date Selection */}
            <div className="space-y-2">
              <Label style={{ color: LUXE_COLORS.champagne }}>
                New Date <span style={{ color: LUXE_COLORS.gold }}>*</span>
              </Label>
              <input
                type="date"
                value={postponeDate}
                onChange={e => setPostponeDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  background: 'rgba(245,230,200,0.05)',
                  border: `1px solid ${LUXE_COLORS.gold}20`,
                  color: LUXE_COLORS.champagne
                }}
              />
            </div>

            {/* ✅ ENTERPRISE: Time Slot Selection with Conflict Detection */}
            <div className="space-y-2">
              <Label
                className="flex items-center justify-between"
                style={{ color: LUXE_COLORS.champagne }}
              >
                <span>
                  New Time <span style={{ color: LUXE_COLORS.gold }}>*</span>
                  {appointmentToPostpone && (
                    <span className="text-xs ml-2" style={{ color: LUXE_COLORS.bronze }}>
                      (Duration: {appointmentToPostpone.duration_minutes || 60} min)
                    </span>
                  )}
                </span>
                {appointmentToPostpone?.stylist_id && (
                  <span
                    className="text-[10px] font-normal"
                    style={{ color: LUXE_COLORS.bronze, opacity: 0.8 }}
                  >
                    ✨ Draft appointments don't block slots
                  </span>
                )}
              </Label>
              {appointmentToPostpone?.stylist_id ? (
                <Select value={postponeTime} onValueChange={setPostponeTime}>
                  <SelectTrigger
                    style={{
                      background: 'rgba(245,230,200,0.05)',
                      border: `1px solid ${LUXE_COLORS.gold}20`,
                      color: LUXE_COLORS.champagne
                    }}
                  >
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent className="hera-select-content max-h-[300px]">
                    {generateTimeSlots()
                      .filter(slot => {
                        // If selected date is today, only show future time slots
                        const today = format(new Date(), 'yyyy-MM-dd')
                        const isToday = postponeDate === today
                        if (isToday) {
                          const now = new Date()
                          const [slotHour, slotMinute] = slot.start.split(':').map(Number)
                          // Add 30 minute buffer for booking
                          if (
                            slotHour < now.getHours() ||
                            (slotHour === now.getHours() && slotMinute <= now.getMinutes() + 30)
                          ) {
                            return false
                          }
                        }
                        return true
                      })
                      .map(slot => {
                        const conflict = checkTimeSlotConflict(
                          slot.start,
                          postponeDate,
                          appointmentToPostpone?.stylist_id || null,
                          appointmentToPostpone?.duration_minutes || 60,
                          appointmentToPostpone?.id
                        )

                        const [hours, minutes] = slot.start.split(':').map(Number)
                        const period = hours >= 12 ? 'PM' : 'AM'
                        const displayHours = hours % 12 || 12
                        const displayTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`

                        const conflictInfo =
                          conflict.hasConflict && conflict.conflictingAppointment
                            ? `${conflict.conflictingAppointment.customer_name} (${conflict.conflictingAppointment.status})`
                            : ''

                        return (
                          <SelectItem
                            key={slot.start}
                            value={slot.start}
                            disabled={conflict.hasConflict}
                            className={cn(conflict.hasConflict && 'opacity-50 cursor-not-allowed')}
                            title={conflictInfo}
                          >
                            <div className="flex items-center justify-between w-full gap-2">
                              <span>{displayTime}</span>
                              {conflict.hasConflict && (
                                <div className="flex items-center gap-1">
                                  <Badge
                                    variant="destructive"
                                    className="text-[10px] px-1.5 py-0"
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.2)',
                                      color: '#F87171',
                                      border: '1px solid rgba(239, 68, 68, 0.3)'
                                    }}
                                  >
                                    {conflict.conflictingAppointment?.status || 'Booked'}
                                  </Badge>
                                  {conflict.conflictingAppointment?.customer_name && (
                                    <span className="text-[10px] text-gray-500 truncate max-w-[100px]">
                                      {conflict.conflictingAppointment.customer_name}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                  </SelectContent>
                </Select>
              ) : (
                <div
                  className="p-3 rounded-lg text-sm text-center"
                  style={{
                    background: 'rgba(212,175,55,0.1)',
                    border: `1px solid ${LUXE_COLORS.gold}20`,
                    color: LUXE_COLORS.bronze
                  }}
                >
                  <Clock className="w-4 h-4 mx-auto mb-1" />
                  No stylist assigned - cannot check availability
                </div>
              )}
            </div>

            {/* ✅ ENTERPRISE: Preview new appointment time */}
            {postponeDate && postponeTime && (
              <div
                className="p-3 rounded-lg"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(15,111,92,0.15) 0%, rgba(15,111,92,0.08) 100%)',
                  border: `1px solid ${LUXE_COLORS.emerald}30`,
                  boxShadow: '0 2px 8px rgba(15,111,92,0.1)'
                }}
              >
                <p className="text-sm font-medium" style={{ color: LUXE_COLORS.champagne }}>
                  ✨ New Appointment Time:
                </p>
                <p
                  className="text-sm mt-1 font-medium"
                  style={{ color: LUXE_COLORS.emerald, fontSize: '0.95rem' }}
                >
                  {format(
                    new Date(`${postponeDate}T${postponeTime}`),
                    'EEEE, MMMM d, yyyy • h:mm a'
                  )}
                </p>
              </div>
            )}

            {/* ✅ ENTERPRISE: Validation warning */}
            {(!postponeDate || !postponeTime) && (
              <p className="text-xs" style={{ color: LUXE_COLORS.bronze, opacity: 0.7 }}>
                Both date and time are required to reschedule the appointment.
              </p>
            )}
          </div>
          {/* ✅ FOOTER WITH SAVE BUTTON - ALWAYS VISIBLE */}
          <div
            className="p-6 pt-4 flex gap-3"
            style={{
              borderTop: `1px solid ${LUXE_COLORS.gold}20`,
              background: 'linear-gradient(to top, rgba(212,175,55,0.08) 0%, transparent 100%)'
            }}
          >
            <Button
              onClick={() => {
                setPostponeDialogOpen(false)
                setAppointmentToPostpone(null)
                setPostponeDate('')
                setPostponeTime('')
              }}
              className="flex-1 transition-all duration-300"
              style={{
                background: 'rgba(245,230,200,0.05)',
                border: `1px solid ${LUXE_COLORS.gold}30`,
                color: LUXE_COLORS.champagne,
                fontWeight: '500',
                minHeight: '48px'
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPostponeAppointment}
              disabled={!postponeDate || !postponeTime}
              className="flex-1 transition-all duration-500"
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.gold}10 0%, ${LUXE_COLORS.goldDark}15 100%)`,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `2px solid ${LUXE_COLORS.gold}60`,
                borderRadius: '16px',
                color: LUXE_COLORS.champagne,
                fontWeight: '700',
                padding: '1.25rem 2rem',
                fontSize: '1.05rem',
                letterSpacing: '0.02em',
                boxShadow: `0 8px 32px ${LUXE_COLORS.gold}35, inset 0 1px 0 rgba(255,255,255,0.15)`,
                minHeight: '60px',
                position: 'relative',
                overflow: 'hidden',
                transitionTimingFunction: LUXE_COLORS.spring,
                opacity: !postponeDate || !postponeTime ? 0.5 : 1
              }}
              onMouseEnter={e => {
                if (postponeDate && postponeTime) {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${LUXE_COLORS.gold}25 0%, ${LUXE_COLORS.goldDark}30 100%)`
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                  e.currentTarget.style.boxShadow = `0 16px 48px ${LUXE_COLORS.gold}50, inset 0 1px 0 rgba(255,255,255,0.25)`
                  e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}90`
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${LUXE_COLORS.gold}10 0%, ${LUXE_COLORS.goldDark}15 100%)`
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = `0 8px 32px ${LUXE_COLORS.gold}35, inset 0 1px 0 rgba(255,255,255,0.15)`
                e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}60`
              }}
            >
              <Clock className="w-4 h-4 mr-2" />
              💾 Save New Time
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✨ ENTERPRISE: Appointment View/Edit Modal */}
      <AppointmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        appointment={selectedAppointment}
        customers={customers || []}
        stylists={staff || []}
        services={services || []}
        branches={branches}
        existingAppointments={appointments || []}
        onSave={async data => {
          if (!selectedAppointment) return

          const loadingId = showLoading('Saving changes...', 'Please wait')

          try {
            await updateAppointment({
              id: selectedAppointment.id,
              data
            })

            removeToast(loadingId)
            showSuccess('Appointment updated', 'Changes saved successfully')
            setModalOpen(false)
            setSelectedAppointment(null)
          } catch (error: any) {
            removeToast(loadingId)
            showError('Failed to update', error.message || 'Please try again')
          }
        }}
      />
    </div>
  )
}

export default function AppointmentsPage() {
  return (
    <StatusToastProvider>
      <AppointmentsContent />
    </StatusToastProvider>
  )
}
