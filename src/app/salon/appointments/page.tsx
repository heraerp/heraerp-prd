'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import {
  useHeraAppointments,
  type Appointment
} from '@/hooks/useHeraAppointments'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
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
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { format } from 'date-fns'

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
  const { organizationId } = useSecuredSalonContext()
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()

  // State declarations
  const [searchTerm, setSearchTerm] = useState('')
  const [showArchivedAppointments, setShowArchivedAppointments] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null)
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Use the universal entity hook for appointments
  const {
    appointments,
    isLoading,
    archiveAppointment,
    deleteAppointment,
    restoreAppointment,
    isDeleting
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

  // Calculate stats from appointment data
  const stats: AppointmentStats = {
    totalAppointments: appointments?.length || 0,
    todayAppointments:
      appointments?.filter(a => {
        const appointmentDate = new Date(a.start_time || '')
        const today = new Date()
        return appointmentDate.toDateString() === today.toDateString()
      }).length || 0,
    upcomingAppointments:
      appointments?.filter(a => {
        const appointmentDate = new Date(a.start_time || '')
        return appointmentDate > new Date() && a.status === 'booked'
      }).length || 0,
    completedAppointments: appointments?.filter(a => a.status === 'completed').length || 0
  }

  const handleConfirmDeleteAppointment = async () => {
    if (!appointmentToDelete) return

    const loadingId = showLoading('Deleting appointment...', 'Please wait')

    try {
      await deleteAppointment(appointmentToDelete.id, true)
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
  }

  const handleConfirmCancelAppointment = async () => {
    if (!appointmentToCancel) return

    const loadingId = showLoading('Cancelling appointment...', 'Please wait')

    try {
      // Archive the appointment (soft delete)
      await archiveAppointment(appointmentToCancel.id)
      removeToast(loadingId)
      showSuccess('Appointment cancelled', `${appointmentToCancel.customer_name}'s appointment has been cancelled`)
      setCancelConfirmOpen(false)
      setAppointmentToCancel(null)
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to cancel appointment', error.message || 'Please try again')
    }
  }

  const handleRestoreAppointment = async (appointment: Appointment) => {
    const loadingId = showLoading('Restoring appointment...', 'Please wait')

    try {
      await restoreAppointment(appointment.id)
      removeToast(loadingId)
      showSuccess('Appointment restored', `${appointment.entity_name} has been restored`)
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to restore appointment', error.message || 'Please try again')
    }
  }

  const filteredAppointments =
    appointments?.filter(a => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        (a.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (a.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (a.stylist_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

      // Branch filter
      const matchesBranch =
        !hasMultipleBranches || !branchId || branchId === '__ALL__' || a.branch_id === branchId

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
    }) || []

  // Get branch name for display
  const getBranchName = (branchId: string | null) => {
    if (!branchId) return null
    const branch = branches.find(b => b.id === branchId)
    return branch?.name || null
  }

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
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: LUXE_COLORS.gold }} />
          <h2 className="text-xl font-medium mb-2" style={{ color: LUXE_COLORS.champagne }}>
            Loading...
          </h2>
          <p style={{ color: LUXE_COLORS.bronze }}>Setting up appointments.</p>
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
                  background: viewMode === 'grid' ? `linear-gradient(135deg, ${LUXE_COLORS.gold}30 0%, ${LUXE_COLORS.gold}20 100%)` : 'transparent',
                  color: viewMode === 'grid' ? LUXE_COLORS.gold : LUXE_COLORS.bronze,
                  border: viewMode === 'grid' ? `1px solid ${LUXE_COLORS.gold}40` : '1px solid transparent',
                  transitionTimingFunction: LUXE_COLORS.spring
                }}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="px-3 py-2 rounded-md transition-all duration-300"
                style={{
                  background: viewMode === 'list' ? `linear-gradient(135deg, ${LUXE_COLORS.gold}30 0%, ${LUXE_COLORS.gold}20 100%)` : 'transparent',
                  color: viewMode === 'list' ? LUXE_COLORS.gold : LUXE_COLORS.bronze,
                  border: viewMode === 'list' ? `1px solid ${LUXE_COLORS.gold}40` : '1px solid transparent',
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
              gradient: 'linear-gradient(135deg, rgba(15,111,92,0.15) 0%, rgba(15,111,92,0.05) 100%)'
            },
            {
              title: 'Today',
              value: stats.todayAppointments,
              desc: 'Scheduled today',
              icon: Clock,
              color: LUXE_COLORS.gold,
              gradient: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)'
            },
            {
              title: 'Upcoming',
              value: stats.upcomingAppointments,
              desc: 'Future bookings',
              icon: Calendar,
              color: LUXE_COLORS.bronze,
              gradient: 'linear-gradient(135deg, rgba(140,120,83,0.15) 0%, rgba(140,120,83,0.05) 100%)'
            },
            {
              title: 'Completed',
              value: stats.completedAppointments,
              desc: 'Finished',
              icon: CheckCircle,
              color: LUXE_COLORS.champagne,
              gradient: 'linear-gradient(135deg, rgba(245,230,200,0.15) 0%, rgba(245,230,200,0.05) 100%)'
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
                      <Building2 className="h-4 w-4 flex-shrink-0" style={{ color: LUXE_COLORS.bronze }} />
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
                          <span className="block truncate max-w-[240px]" title={branch.name || 'Unnamed Branch'}>
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
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2
              className="w-10 h-10 animate-spin mb-4"
              style={{ color: LUXE_COLORS.gold }}
            />
            <p className="text-lg" style={{ color: LUXE_COLORS.bronze }}>
              Loading appointments...
            </p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div
            className="text-center py-20 rounded-xl transition-all duration-500"
            style={{
              background: 'rgba(245,230,200,0.03)',
              border: `1px solid ${LUXE_COLORS.gold}10`,
              transitionTimingFunction: LUXE_COLORS.spring
            }}
          >
            <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: LUXE_COLORS.bronze, opacity: 0.5 }} />
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
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredAppointments.map(appointment => {
              const appointmentDate = appointment.start_time
                ? new Date(appointment.start_time)
                : null
              const branchName = getBranchName(appointment.branch_id)

              return (
                <div
                  key={appointment.id}
                  className={`rounded-xl p-6 transition-all duration-500 ${viewMode === 'list' ? 'flex items-center justify-between' : ''}`}
                  style={{
                    background: 'linear-gradient(135deg, rgba(245,230,200,0.05) 0%, rgba(212,175,55,0.03) 100%)',
                    border: `1px solid ${LUXE_COLORS.gold}20`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    opacity: appointment.status === 'archived' || appointment.status === 'cancelled' ? 0.6 : 1,
                    transitionTimingFunction: LUXE_COLORS.spring
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = viewMode === 'grid' ? 'translateY(-6px) scale(1.02)' : 'translateX(4px)'
                    e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.2)'
                    e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}50`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1) translateX(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                    e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}20`
                  }}
                >
                  <div className={viewMode === 'list' ? 'flex-1 flex items-center gap-6' : 'space-y-4'}>
                    {/* Header */}
                    <div className={viewMode === 'list' ? 'flex-1' : 'flex items-start justify-between'}>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1" style={{ color: LUXE_COLORS.champagne }}>
                          {appointment.customer_name || 'Customer'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm" style={{ color: LUXE_COLORS.bronze }}>
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{appointment.stylist_name || 'Unassigned'}</span>
                        </div>
                        {branchName && viewMode === 'list' && (
                          <div className="flex items-center gap-2 text-xs mt-1" style={{ color: LUXE_COLORS.bronze, opacity: 0.7 }}>
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate max-w-[200px]" title={branchName}>{branchName}</span>
                          </div>
                        )}
                      </div>
                      {viewMode === 'grid' && (
                        <Badge
                          className="transition-all duration-300 ml-2 flex-shrink-0"
                          style={{
                            background:
                              appointment.status === 'booked'
                                ? `linear-gradient(135deg, ${LUXE_COLORS.gold}30 0%, ${LUXE_COLORS.gold}20 100%)`
                                : appointment.status === 'completed'
                                  ? `linear-gradient(135deg, ${LUXE_COLORS.emerald}30 0%, ${LUXE_COLORS.emerald}20 100%)`
                                  : appointment.status === 'checked_in'
                                    ? `linear-gradient(135deg, ${LUXE_COLORS.bronze}30 0%, ${LUXE_COLORS.bronze}20 100%)`
                                    : `linear-gradient(135deg, ${LUXE_COLORS.rose}30 0%, ${LUXE_COLORS.rose}20 100%)`,
                            color:
                              appointment.status === 'booked'
                                ? LUXE_COLORS.gold
                                : appointment.status === 'completed'
                                  ? LUXE_COLORS.emerald
                                  : appointment.status === 'checked_in'
                                    ? LUXE_COLORS.bronze
                                    : LUXE_COLORS.rose,
                            border: `1px solid ${
                              appointment.status === 'booked'
                                ? LUXE_COLORS.gold
                                : appointment.status === 'completed'
                                  ? LUXE_COLORS.emerald
                                  : appointment.status === 'checked_in'
                                    ? LUXE_COLORS.bronze
                                    : LUXE_COLORS.rose
                            }40`,
                            fontWeight: '500',
                            textTransform: 'capitalize'
                          }}
                        >
                          {appointment.status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>

                    {/* Appointment Details */}
                    {viewMode === 'list' ? (
                      <div className="flex items-center gap-6">
                        {appointmentDate && (
                          <>
                            <div className="flex items-center gap-2 text-sm min-w-[180px]" style={{ color: LUXE_COLORS.bronze }}>
                              <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: LUXE_COLORS.gold }} />
                              <span className="font-medium whitespace-nowrap">{format(appointmentDate, 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm min-w-[120px]" style={{ color: LUXE_COLORS.bronze }}>
                              <Clock className="w-4 h-4 flex-shrink-0" style={{ color: LUXE_COLORS.gold }} />
                              <span className="font-medium whitespace-nowrap">{format(appointmentDate, 'h:mm a')}</span>
                            </div>
                          </>
                        )}
                        {appointment.price !== undefined && appointment.price > 0 && (
                          <div
                            className="flex items-center gap-2 text-sm font-medium min-w-[100px]"
                            style={{ color: LUXE_COLORS.champagne }}
                          >
                            <DollarSign className="w-4 h-4 flex-shrink-0" style={{ color: LUXE_COLORS.gold }} />
                            <span className="whitespace-nowrap">
                              {appointment.currency_code || 'AED'} {appointment.price.toFixed(2)}
                            </span>
                          </div>
                        )}
                        <Badge
                          className="transition-all duration-300 flex-shrink-0"
                          style={{
                            background:
                              appointment.status === 'booked'
                                ? `linear-gradient(135deg, ${LUXE_COLORS.gold}30 0%, ${LUXE_COLORS.gold}20 100%)`
                                : appointment.status === 'completed'
                                  ? `linear-gradient(135deg, ${LUXE_COLORS.emerald}30 0%, ${LUXE_COLORS.emerald}20 100%)`
                                  : appointment.status === 'checked_in'
                                    ? `linear-gradient(135deg, ${LUXE_COLORS.bronze}30 0%, ${LUXE_COLORS.bronze}20 100%)`
                                    : `linear-gradient(135deg, ${LUXE_COLORS.rose}30 0%, ${LUXE_COLORS.rose}20 100%)`,
                            color:
                              appointment.status === 'booked'
                                ? LUXE_COLORS.gold
                                : appointment.status === 'completed'
                                  ? LUXE_COLORS.emerald
                                  : appointment.status === 'checked_in'
                                    ? LUXE_COLORS.bronze
                                    : LUXE_COLORS.rose,
                            border: `1px solid ${
                              appointment.status === 'booked'
                                ? LUXE_COLORS.gold
                                : appointment.status === 'completed'
                                  ? LUXE_COLORS.emerald
                                  : appointment.status === 'checked_in'
                                    ? LUXE_COLORS.bronze
                                    : LUXE_COLORS.rose
                            }40`,
                            fontWeight: '500',
                            textTransform: 'capitalize',
                            minWidth: '90px',
                            textAlign: 'center'
                          }}
                        >
                          {appointment.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-3" style={{ borderTop: `1px solid ${LUXE_COLORS.gold}10` }}>
                        {appointmentDate && (
                          <>
                            <div className="flex items-center gap-3 text-sm" style={{ color: LUXE_COLORS.bronze }}>
                              <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: LUXE_COLORS.gold }} />
                              <span className="font-medium">{format(appointmentDate, 'EEEE, MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm" style={{ color: LUXE_COLORS.bronze }}>
                              <Clock className="w-4 h-4 flex-shrink-0" style={{ color: LUXE_COLORS.gold }} />
                              <span className="font-medium">
                                {format(appointmentDate, 'h:mm a')}
                                {appointment.duration_minutes && (
                                  <span className="ml-2 opacity-70">({appointment.duration_minutes} min)</span>
                                )}
                              </span>
                            </div>
                          </>
                        )}
                        {branchName && (
                          <div className="flex items-center gap-3 text-sm" style={{ color: LUXE_COLORS.bronze }}>
                            <Building2 className="w-4 h-4 flex-shrink-0" style={{ color: LUXE_COLORS.gold }} />
                            <span className="truncate font-medium" title={branchName}>{branchName}</span>
                          </div>
                        )}
                        {appointment.price !== undefined && appointment.price > 0 && (
                          <div
                            className="flex items-center gap-3 text-sm font-medium"
                            style={{ color: LUXE_COLORS.champagne }}
                          >
                            <DollarSign className="w-4 h-4 flex-shrink-0" style={{ color: LUXE_COLORS.gold }} />
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
                        className="p-3 rounded-lg text-sm italic"
                        style={{
                          background: 'rgba(212,175,55,0.05)',
                          border: `1px solid ${LUXE_COLORS.gold}10`,
                          color: LUXE_COLORS.bronze
                        }}
                      >
                        <p className="line-clamp-2">{appointment.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className={`${viewMode === 'list' ? 'flex gap-2 flex-shrink-0' : 'pt-4 flex gap-2'}`} style={viewMode === 'grid' ? { borderTop: `1px solid ${LUXE_COLORS.gold}10` } : {}}>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/salon/appointments/${appointment.id}`)}
                      className={`${viewMode === 'list' ? '' : 'flex-1'} transition-all duration-300`}
                      style={{
                        background: 'rgba(212,175,55,0.15)',
                        color: LUXE_COLORS.gold,
                        border: `1px solid ${LUXE_COLORS.gold}30`,
                        transitionTimingFunction: LUXE_COLORS.spring
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(212,175,55,0.25)'
                        e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}50`
                        e.currentTarget.style.transform = 'scale(1.05)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(212,175,55,0.15)'
                        e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}30`
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      {viewMode === 'list' ? 'Edit' : 'View/Edit'}
                    </Button>
                    {appointment.status === 'archived' || appointment.status === 'cancelled' ? (
                      <Button
                        size="sm"
                        onClick={() => handleRestoreAppointment(appointment)}
                        className={`${viewMode === 'list' ? '' : 'flex-1'} transition-all duration-300`}
                        style={{
                          background: 'rgba(15,111,92,0.15)',
                          color: LUXE_COLORS.emerald,
                          border: `1px solid ${LUXE_COLORS.emerald}30`,
                          transitionTimingFunction: LUXE_COLORS.spring
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(15,111,92,0.25)'
                          e.currentTarget.style.borderColor = `${LUXE_COLORS.emerald}50`
                          e.currentTarget.style.transform = 'scale(1.05)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(15,111,92,0.15)'
                          e.currentTarget.style.borderColor = `${LUXE_COLORS.emerald}30`
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        Restore
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setAppointmentToCancel(appointment)
                            setCancelConfirmOpen(true)
                          }}
                          className="transition-all duration-300"
                          style={{
                            background: 'rgba(140,120,83,0.15)',
                            color: LUXE_COLORS.bronze,
                            border: `1px solid ${LUXE_COLORS.bronze}30`,
                            transitionTimingFunction: LUXE_COLORS.spring
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(140,120,83,0.25)'
                            e.currentTarget.style.borderColor = `${LUXE_COLORS.bronze}50`
                            e.currentTarget.style.transform = 'scale(1.05)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(140,120,83,0.15)'
                            e.currentTarget.style.borderColor = `${LUXE_COLORS.bronze}30`
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setAppointmentToDelete(appointment)
                            setDeleteConfirmOpen(true)
                          }}
                          className="transition-all duration-300"
                          style={{
                            background: 'rgba(232,180,184,0.15)',
                            color: LUXE_COLORS.rose,
                            border: `1px solid ${LUXE_COLORS.rose}30`,
                            transitionTimingFunction: LUXE_COLORS.spring
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(232,180,184,0.25)'
                            e.currentTarget.style.borderColor = `${LUXE_COLORS.rose}50`
                            e.currentTarget.style.transform = 'scale(1.05)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(232,180,184,0.15)'
                            e.currentTarget.style.borderColor = `${LUXE_COLORS.rose}30`
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
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
          <DialogHeader className="p-6 pb-4" style={{ borderBottom: `1px solid ${LUXE_COLORS.gold}15` }}>
            <DialogTitle className="text-xl" style={{ color: LUXE_COLORS.champagne }}>
              Cancel Appointment
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="mb-6" style={{ color: LUXE_COLORS.bronze }}>
              Are you sure you want to cancel this appointment? The customer will need to be notified.
            </p>
            {appointmentToCancel && (
              <div
                className="p-4 rounded-lg mb-6"
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
          <DialogHeader className="p-6 pb-4" style={{ borderBottom: `1px solid ${LUXE_COLORS.gold}15` }}>
            <DialogTitle className="text-xl" style={{ color: LUXE_COLORS.champagne }}>
              Delete Appointment Permanently
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="mb-6" style={{ color: LUXE_COLORS.bronze }}>
              Are you sure you want to permanently delete this appointment? This action cannot be undone and all data will be lost.
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
