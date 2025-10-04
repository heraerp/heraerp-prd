// ================================================================================
// SALON APPOINTMENTS PAGE - LIST VIEW (PLAYBOOK API)
// Smart Code: HERA.PAGES.SALON.APPOINTMENTS.V1
// Uses Playbook API for appointment operations with Sacred Six tables
// ================================================================================

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { useAppointmentsPlaybook } from '@/hooks/useAppointmentsPlaybook'
import { AppointmentStatus } from '@/lib/playbook/entities'
import { format, startOfDay, endOfDay, addDays } from 'date-fns'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import {
  Calendar,
  Clock,
  User,
  Phone,
  DollarSign,
  Plus,
  Search,
  Filter,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarDays,
  Loader2,
  Building2,
  MapPin,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { toast } from '@/hooks/use-toast'
import { PageLayout } from '@/components/universal/PageLayout'
import { PageHeader, PageHeaderButton } from '@/components/universal/PageHeader'
import { NewAppointmentModal } from '@/components/salon/appointments/NewAppointmentModal'
import { SimpleSalonGuard } from '@/components/salon/auth/SimpleSalonGuard'
import {
  cancelAppointmentV2,
  noShowAppointmentV2,
  checkInAppointmentV2
} from '@/lib/salon/appointments-v2-helper'

// Luxury color palette
const LUXE_COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#5A2A40',
  rose: '#E8B4B8'
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> =
  {
    booked: {
      label: 'Booked',
      color: LUXE_COLORS.gold,
      bgColor: `${LUXE_COLORS.gold}20`,
      icon: CheckCircle
    },
    checked_in: {
      label: 'Checked In',
      color: LUXE_COLORS.emerald,
      bgColor: `${LUXE_COLORS.emerald}20`,
      icon: Clock
    },
    completed: {
      label: 'Completed',
      color: LUXE_COLORS.emerald,
      bgColor: `${LUXE_COLORS.emerald}20`,
      icon: CheckCircle
    },
    cancelled: {
      label: 'Cancelled',
      color: LUXE_COLORS.rose,
      bgColor: `${LUXE_COLORS.rose}20`,
      icon: XCircle
    },
    no_show: {
      label: 'No Show',
      color: LUXE_COLORS.bronze,
      bgColor: `${LUXE_COLORS.bronze}20`,
      icon: XCircle
    }
  }

function SalonAppointmentsContent() {
  const router = useRouter()
  const { organization, isAuthenticated, isLoading: contextLoading, selectedBranchId } = useSecuredSalonContext()
  const organizationId = organization?.id

  // Branch filter hook - no persistence to prevent stuck filters
  const {
    branchId,
    branches,
    loading: branchesLoading,
    setBranchId,
    hasMultipleBranches
  } = useBranchFilter(undefined, undefined, organizationId) // No persistKey

  // State for filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'week' | 'all'>('all')
  
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false)
  
  const handleOpenModal = () => {
    console.log('Opening new appointment modal')
    setShowNewAppointmentModal(true)
  }

  // Always reset branch filter to 'all' on page load to prevent stuck filters
  useEffect(() => {
    // Clear any persisted branch filter and always start with 'all'
    localStorage.removeItem('branch-filter-salon-appointments-list')
    setBranchId(undefined)
    console.log('📅 Reset branch filter to show all locations')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Get organization ID from localStorage for demo mode
  const [localOrgId, setLocalOrgId] = useState<string | null>(null)

  useEffect(() => {
    const storedOrgId = localStorage.getItem('organizationId')
    if (storedOrgId) {
      setLocalOrgId(storedOrgId)
    }
  }, [])

  // Calculate date range based on filter
  const getDateRange = () => {
    const today = startOfDay(new Date())

    switch (dateFilter) {
      case 'today':
        return {
          date_from: today.toISOString(),
          date_to: endOfDay(today).toISOString()
        }
      case 'tomorrow':
        const tomorrow = addDays(today, 1)
        return {
          date_from: tomorrow.toISOString(),
          date_to: endOfDay(tomorrow).toISOString()
        }
      case 'week':
        return {
          date_from: today.toISOString(),
          date_to: endOfDay(addDays(today, 7)).toISOString()
        }
      case 'all':
      default:
        // For 'all', show appointments from 1 year ago to 1 year in the future
        // This ensures we catch appointments that might have been created with future dates
        return {
          date_from: addDays(today, -365).toISOString(),
          date_to: endOfDay(addDays(today, 365)).toISOString()
        }
    }
  }

  // Use Playbook hook
  const playbookParams = {
    ...getDateRange(),
    status: statusFilter !== 'all' ? [statusFilter] : undefined,
    branch_id: branchId && branchId !== 'all' && branchId !== undefined ? branchId : undefined,
    q: searchTerm || undefined
  }
  
  console.log('📅 Appointments page params:', {
    branchId,
    branch_id_passed: playbookParams.branch_id,
    dateRange: getDateRange()
  })
  
  const {
    data: appointments,
    total,
    loading,
    error,
    organizationId: playbookOrgId,
    refresh
  } = useAppointmentsPlaybook(playbookParams)

  // Update filters when changed
  useEffect(() => {
    refresh()
  }, [searchTerm, statusFilter, dateFilter, branchId])

  const getStatusBadge = (status: AppointmentStatus) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.booked
    const Icon = config.icon
    return (
      <Badge
        className="gap-1 border transition-all duration-300 hover:scale-105 shadow-sm"
        style={{
          backgroundColor: config.bgColor,
          color: config.color,
          borderColor: config.color,
          boxShadow: `0 2px 8px ${config.color}20`
        }}
      >
        <Icon className="w-3 h-3 animate-pulse" style={{ animationDuration: '3s' }} />
        {config.label}
      </Badge>
    )
  }

  // Get effective organization ID
  const effectiveOrgId = organizationId || playbookOrgId || localOrgId

  // Three-layer authorization pattern (adapted for demo mode)
  // Layer 1: Authentication check (skip for demo mode)
  if (!isAuthenticated && !localOrgId) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to access this page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Layer 2: Context loading check
  if (contextLoading && !localOrgId) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center animate-fadeIn">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                 style={{ 
                   background: `linear-gradient(135deg, ${LUXE_COLORS.gold}40 0%, ${LUXE_COLORS.goldDark}40 100%)`,
                   boxShadow: `0 8px 32px ${LUXE_COLORS.gold}20`
                 }}>
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: LUXE_COLORS.gold }} />
            </div>
            <p className="mt-4" style={{ color: LUXE_COLORS.bronze }}>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Layer 3: Organization check
  if (!effectiveOrgId) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No organization context found. Please select an organization.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const [actionId, setActionId] = useState<string | null>(null)

  const handleCancel = async (id: string) => {
    try {
      setActionId(id)
      await cancelAppointmentV2({ organizationId: effectiveOrgId!, appointmentId: id })
      toast({ title: 'Appointment cancelled' })
      await refresh()
    } catch (e) {
      const m = e instanceof Error ? e.message : 'Failed to cancel appointment'
      toast({ title: 'Error', description: m, variant: 'destructive' })
    } finally {
      setActionId(null)
    }
  }

  const handleNoShow = async (id: string) => {
    try {
      setActionId(id)
      await noShowAppointmentV2({ organizationId: effectiveOrgId!, appointmentId: id })
      toast({ title: 'Marked as no-show' })
      await refresh()
    } catch (e) {
      const m = e instanceof Error ? e.message : 'Failed to mark no-show'
      toast({ title: 'Error', description: m, variant: 'destructive' })
    } finally {
      setActionId(null)
    }
  }

  const handleCheckIn = async (id: string) => {
    try {
      setActionId(id)
      await checkInAppointmentV2({ organizationId: effectiveOrgId!, appointmentId: id })
      toast({ title: 'Checked in' })
      await refresh()
    } catch (e) {
      const m = e instanceof Error ? e.message : 'Failed to check in'
      toast({ title: 'Error', description: m, variant: 'destructive' })
    } finally {
      setActionId(null)
    }
  }

  return (
    <div
      className="min-h-screen transition-all duration-300"
      style={{
        background: `linear-gradient(135deg, ${LUXE_COLORS.black} 0%, ${LUXE_COLORS.charcoal} 100%)`
      }}
    >
      <div className="p-6 animate-fadeIn">
        {/* Page Header */}
        <div className="mb-6 animate-slideDown">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transform transition-transform duration-300 hover:scale-110"
                 style={{ 
                   background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
                   boxShadow: `0 8px 32px ${LUXE_COLORS.gold}40`
                 }}>
              <Calendar className="w-6 h-6" style={{ color: LUXE_COLORS.black }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: LUXE_COLORS.champagne }}>
                Appointments
              </h1>
              <p className="text-sm mt-1 opacity-80 transition-opacity duration-300 hover:opacity-100" style={{ color: LUXE_COLORS.bronze }}>
                Manage all salon appointments and bookings
              </p>
            </div>
          </div>
        </div>

        {/* Page Actions */}
        <div className="flex items-center justify-end gap-3 mb-6 animate-slideLeft">
          <Button
            variant="outline"
            onClick={() => router.push('/salon/appointments/calendar')}
            style={{
              backgroundColor: LUXE_COLORS.black,
              borderColor: LUXE_COLORS.bronze,
              color: LUXE_COLORS.champagne
            }}
            className="hover:opacity-80 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = LUXE_COLORS.gold
              e.currentTarget.style.boxShadow = `0 4px 16px ${LUXE_COLORS.gold}30`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = LUXE_COLORS.bronze
              e.currentTarget.style.boxShadow = ''
            }}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar View
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/salon/kanban')}
            style={{
              backgroundColor: LUXE_COLORS.black,
              borderColor: LUXE_COLORS.bronze,
              color: LUXE_COLORS.champagne
            }}
            className="hover:opacity-80 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = LUXE_COLORS.gold
              e.currentTarget.style.boxShadow = `0 4px 16px ${LUXE_COLORS.gold}30`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = LUXE_COLORS.bronze
              e.currentTarget.style.boxShadow = ''
            }}
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Kanban View
          </Button>
          <Button
            style={{
              background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
              color: LUXE_COLORS.black,
              boxShadow: `0 4px 16px ${LUXE_COLORS.gold}40`
            }}
            className="hover:opacity-90 transition-all duration-300 font-semibold hover:scale-105 hover:shadow-2xl"
            onClick={handleOpenModal}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
              e.currentTarget.style.boxShadow = `0 8px 24px ${LUXE_COLORS.gold}60`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = `0 4px 16px ${LUXE_COLORS.gold}40`
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Book Appointment
          </Button>
        </div>

        {/* Error state */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card
          className="p-6 mb-6 backdrop-blur shadow-lg border transition-all duration-300 animate-fadeInUp"
          style={{
            backgroundColor: `${LUXE_COLORS.charcoal}E6`,
            borderColor: `${LUXE_COLORS.gold}40`,
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}60`
            e.currentTarget.style.boxShadow = `0 8px 32px ${LUXE_COLORS.gold}20`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}40`
            e.currentTarget.style.boxShadow = ''
          }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-2.5 h-4 w-4"
                style={{ color: LUXE_COLORS.bronze }}
              />
              <Input
                placeholder="Search by customer, stylist, or code..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 transition-all duration-300 focus:scale-[1.02]"
                style={{
                  backgroundColor: `${LUXE_COLORS.black}CC`,
                  borderColor: LUXE_COLORS.bronze,
                  color: LUXE_COLORS.champagne
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = LUXE_COLORS.gold
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${LUXE_COLORS.gold}20`
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = LUXE_COLORS.bronze
                  e.currentTarget.style.boxShadow = ''
                }}
              />
            </div>

            {/* Branch Filter - Enterprise Grade */}
            <Select
              value={branchId === undefined || branchId === 'all' ? 'all' : branchId}
              onValueChange={value => setBranchId(value === 'all' ? undefined : value)}
            >
              <SelectTrigger
                className="w-[200px] transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: `${LUXE_COLORS.black}CC`,
                  borderColor: LUXE_COLORS.bronze,
                  color: LUXE_COLORS.champagne
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = LUXE_COLORS.gold
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${LUXE_COLORS.gold}20`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = LUXE_COLORS.bronze
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" style={{ color: LUXE_COLORS.gold }} />
                  <SelectValue placeholder="All Locations" />
                </div>
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem value="all" className="hera-select-item">
                  All Locations
                </SelectItem>
                {branchesLoading ? (
                  <div className="px-2 py-3 text-center">
                    <Loader2
                      className="h-4 w-4 animate-spin mx-auto"
                      style={{ color: LUXE_COLORS.gold }}
                    />
                  </div>
                ) : branches.length === 0 ? (
                  <div
                    className="px-2 py-3 text-center text-sm"
                    style={{ color: LUXE_COLORS.bronze }}
                  >
                    No branches configured
                  </div>
                ) : (
                  branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id} className="hera-select-item">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" style={{ color: LUXE_COLORS.gold }} />
                        <div className="flex flex-col">
                          <span className="font-medium">{branch.name}</span>
                          {branch.code && <span className="text-xs opacity-60">{branch.code}</span>}
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
              <SelectTrigger
                className="w-[180px] transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: `${LUXE_COLORS.black}CC`,
                  borderColor: LUXE_COLORS.bronze,
                  color: LUXE_COLORS.champagne
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = LUXE_COLORS.gold
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${LUXE_COLORS.gold}20`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = LUXE_COLORS.bronze
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem value="all" className="hera-select-item">
                  All appointments
                </SelectItem>
                <SelectItem value="today" className="hera-select-item">
                  Today
                </SelectItem>
                <SelectItem value="tomorrow" className="hera-select-item">
                  Tomorrow
                </SelectItem>
                <SelectItem value="week" className="hera-select-item">
                  Next 7 days
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger
                className="w-[180px] transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: `${LUXE_COLORS.black}CC`,
                  borderColor: LUXE_COLORS.bronze,
                  color: LUXE_COLORS.champagne
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = LUXE_COLORS.gold
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${LUXE_COLORS.gold}20`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = LUXE_COLORS.bronze
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem value="all" className="hera-select-item">
                  All statuses
                </SelectItem>
                <SelectItem value="booked" className="hera-select-item">
                  Booked
                </SelectItem>
                <SelectItem value="checked_in" className="hera-select-item">
                  Checked In
                </SelectItem>
                <SelectItem value="completed" className="hera-select-item">
                  Completed
                </SelectItem>
                <SelectItem value="cancelled" className="hera-select-item">
                  Cancelled
                </SelectItem>
                <SelectItem value="no_show" className="hera-select-item">
                  No Show
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Active Filters Indicator */}
        {branchId && branchId !== 'all' && (
          <div className="mb-4 flex items-center gap-2 animate-slideDown">
            <span className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
              Active Filters:
            </span>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105"
              style={{
                background: `${LUXE_COLORS.gold}20`,
                border: `1px solid ${LUXE_COLORS.gold}40`,
                boxShadow: `0 2px 8px ${LUXE_COLORS.gold}20`
              }}
            >
              <Building2 className="h-3 w-3" style={{ color: LUXE_COLORS.gold }} />
              <span className="text-sm font-medium" style={{ color: LUXE_COLORS.champagne }}>
                {branches.find(b => b.id === branchId)?.name || branchId}
              </span>
              <button
                onClick={() => setBranchId(undefined)}
                className="ml-1 hover:opacity-70 transition-opacity"
                style={{ color: LUXE_COLORS.gold }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Appointments List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i, index) => (
              <Card
                key={i}
                className="p-6 backdrop-blur shadow-lg border animate-fadeIn"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}E6`,
                  borderColor: `${LUXE_COLORS.gold}40`,
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div className="animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-12 h-12 rounded-full"
                      style={{ backgroundColor: `${LUXE_COLORS.gold}30` }}
                    ></div>
                    <div className="flex-1">
                      <div
                        className="h-4 rounded w-1/4 mb-2"
                        style={{ backgroundColor: `${LUXE_COLORS.bronze}40` }}
                      ></div>
                      <div
                        className="h-3 rounded w-1/2"
                        style={{ backgroundColor: `${LUXE_COLORS.bronze}40` }}
                      ></div>
                    </div>
                  </div>
                  <div
                    className="h-3 rounded w-1/3 ml-16"
                    style={{ backgroundColor: `${LUXE_COLORS.bronze}40` }}
                  ></div>
                </div>
              </Card>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <Card
            className="p-12 text-center backdrop-blur shadow-lg border animate-fadeIn"
            style={{
              backgroundColor: `${LUXE_COLORS.charcoal}E6`,
              borderColor: `${LUXE_COLORS.gold}40`,
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center animate-pulse"
                 style={{ 
                   background: `linear-gradient(135deg, ${LUXE_COLORS.gold}20 0%, ${LUXE_COLORS.goldDark}20 100%)`,
                   boxShadow: `0 8px 32px ${LUXE_COLORS.gold}10`
                 }}>
              <Calendar
                className="w-10 h-10"
                style={{ color: `${LUXE_COLORS.gold}60` }}
              />
            </div>
            <h3 className="text-lg font-medium mb-1" style={{ color: LUXE_COLORS.champagne }}>
              No appointments found
            </h3>
            <p className="mb-4" style={{ color: LUXE_COLORS.bronze }}>
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || (branchId && branchId !== 'all')
                ? 'Try adjusting your filters'
                : 'Book your first appointment to get started'}
            </p>
            {!searchTerm && statusFilter === 'all' && dateFilter === 'all' && (!branchId || branchId === 'all') && (
              <Button
                onClick={handleOpenModal}
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
                  color: LUXE_COLORS.black,
                  boxShadow: `0 4px 16px ${LUXE_COLORS.gold}40`
                }}
                className="hover:opacity-90 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                  e.currentTarget.style.boxShadow = `0 8px 24px ${LUXE_COLORS.gold}60`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = `0 4px 16px ${LUXE_COLORS.gold}40`
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm animate-fadeIn flex items-center gap-2" style={{ color: LUXE_COLORS.bronze }}>
              <span className="inline-block w-2 h-2 rounded-full animate-pulse" 
                    style={{ backgroundColor: LUXE_COLORS.gold }}></span>
              Showing <span className="font-semibold" style={{ color: LUXE_COLORS.champagne }}>{appointments.length}</span> of <span className="font-semibold" style={{ color: LUXE_COLORS.champagne }}>{total}</span> appointments
            </p>

            {appointments.map((appointment, index) => {
              const appointmentDate = new Date(appointment.start_time)
              const isPast = appointmentDate < new Date()

              return (
                <Card
                  key={appointment.id}
                  className={cn(
                    'p-6 transition-all duration-300 hover:shadow-xl cursor-pointer backdrop-blur border animate-fadeInUp transform hover:-translate-y-1',
                    isPast && 'opacity-60'
                  )}
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}E6`,
                    borderColor: `${LUXE_COLORS.gold}40`,
                    backdropFilter: 'blur(10px)',
                    animationDelay: `${Math.min(index * 0.05, 0.3)}s`
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}80`
                    e.currentTarget.style.boxShadow = `0 12px 40px ${LUXE_COLORS.gold}30`
                    e.currentTarget.style.backgroundColor = `${LUXE_COLORS.charcoal}F2`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}40`
                    e.currentTarget.style.boxShadow = ''
                    e.currentTarget.style.backgroundColor = `${LUXE_COLORS.charcoal}E6`
                  }}
                  onClick={() => router.push(`/salon/appointments/${appointment.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header Row */}
                      <div className="flex items-center gap-4 mb-3">
                        <h3
                          className="text-lg font-semibold transition-colors duration-300"
                          style={{ color: LUXE_COLORS.champagne }}
                        >
                          {appointment.entity_name}
                        </h3>
                        <div className="flex items-center gap-2 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <Badge
                          variant="outline"
                          className="gap-1 border !text-[#F5E6C8] transition-all duration-300 hover:scale-105"
                          style={{
                            backgroundColor: `${LUXE_COLORS.bronze}20`,
                            borderColor: LUXE_COLORS.bronze,
                            color: LUXE_COLORS.champagne
                          }}
                        >
                          <Calendar className="w-3 h-3" style={{ color: LUXE_COLORS.champagne }} />
                          <span style={{ color: LUXE_COLORS.champagne }}>
                            {format(appointmentDate, 'MMM d, yyyy')}
                          </span>
                        </Badge>
                        <Badge
                          variant="outline"
                          className="gap-1 border !text-[#F5E6C8] transition-all duration-300 hover:scale-105"
                          style={{
                            backgroundColor: `${LUXE_COLORS.bronze}20`,
                            borderColor: LUXE_COLORS.bronze,
                            color: LUXE_COLORS.champagne
                          }}
                        >
                          <Clock className="w-3 h-3" style={{ color: LUXE_COLORS.champagne }} />
                          <span style={{ color: LUXE_COLORS.champagne }}>
                            {format(appointmentDate, 'h:mm a')}
                          </span>
                        </Badge>
                        {appointment.metadata?.branch_id && (
                          <Badge
                            variant="outline"
                            className="gap-1 border transition-all duration-300 hover:scale-105"
                            style={{
                              backgroundColor: `${LUXE_COLORS.gold}20`,
                              borderColor: LUXE_COLORS.gold,
                              color: LUXE_COLORS.champagne
                            }}
                          >
                            <Building2 className="w-3 h-3" />
                            {branches.find(b => b.id === appointment.metadata?.branch_id)?.name ||
                              'Branch'}
                          </Badge>
                        )}
                      </div>

                      {/* Details Row */}
                      <div
                        className="flex flex-wrap gap-4 text-sm"
                        style={{ color: LUXE_COLORS.bronze }}
                      >
                        {appointment.service_ids && appointment.service_ids.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Services:</span>
                            <span>{appointment.service_ids.length} service(s)</span>
                          </div>
                        )}

                        {appointment.price && appointment.price > 0 && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 animate-pulse" style={{ color: LUXE_COLORS.gold, animationDuration: '4s' }} />
                            <span className="font-medium transition-all duration-300 hover:scale-105 inline-block" style={{ color: LUXE_COLORS.champagne }}>
                              {appointment.currency_code || 'AED'} {appointment.price.toFixed(2)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <span className="font-mono text-sm opacity-80 hover:opacity-100 transition-opacity duration-300" style={{ color: LUXE_COLORS.gold }}>
                            #{appointment.entity_code}
                          </span>
                        </div>
                      </div>

                      {/* Notes */}
                      {appointment.notes && (
                        <p className="mt-2 text-sm italic" style={{ color: LUXE_COLORS.bronze }}>
                          {appointment.notes}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:opacity-80 transition-all duration-300 hover:scale-110"
                          style={{ color: LUXE_COLORS.bronze }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = LUXE_COLORS.gold
                            e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = LUXE_COLORS.bronze
                            e.currentTarget.style.transform = ''
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="animate-fadeIn" style={{
                        backgroundColor: LUXE_COLORS.charcoal,
                        borderColor: LUXE_COLORS.gold,
                        color: LUXE_COLORS.champagne
                      }}>
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            router.push(`/salon/appointments/${appointment.id}/edit`)
                          }}
                          className="hover:bg-opacity-10 cursor-pointer transition-colors duration-200"
                          style={{ color: LUXE_COLORS.champagne }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = `${LUXE_COLORS.gold}20`
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" style={{ color: LUXE_COLORS.gold }} />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuSeparator style={{ backgroundColor: `${LUXE_COLORS.gold}30` }} />

                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            handleCancel(appointment.id)
                          }}
                          disabled={actionId === appointment.id}
                          className="hover:bg-opacity-10 cursor-pointer transition-colors duration-200"
                          style={{ color: LUXE_COLORS.rose }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = `${LUXE_COLORS.rose}20`
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" style={{ color: LUXE_COLORS.rose }} />
                          Cancel
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            handleNoShow(appointment.id)
                          }}
                          disabled={actionId === appointment.id}
                          className="hover:bg-opacity-10 cursor-pointer transition-colors duration-200"
                          style={{ color: LUXE_COLORS.champagne }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = `${LUXE_COLORS.bronze}20`
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-2" style={{ color: LUXE_COLORS.bronze }} />
                          Mark No-show
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            handleCheckIn(appointment.id)
                          }}
                          disabled={actionId === appointment.id}
                          className="hover:bg-opacity-10 cursor-pointer transition-colors duration-200"
                          style={{ color: LUXE_COLORS.champagne }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = `${LUXE_COLORS.emerald}20`
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <Clock className="w-4 h-4 mr-2" style={{ color: LUXE_COLORS.emerald }} />
                          Check-in
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* New Appointment Modal */}
        {showNewAppointmentModal && (
          <NewAppointmentModal
            onClose={() => setShowNewAppointmentModal(false)}
            onSuccess={() => {
              setShowNewAppointmentModal(false)
              refresh()
            }}
            organizationId={effectiveOrgId || undefined}
            selectedBranchId={branchId}
          />
        )}
      </div>
    </div>
  )
}

export default function SalonAppointmentsPage() {
  return (
    <SimpleSalonGuard requiredRoles={['owner', 'receptionist', 'admin']}>
      <SalonAppointmentsContent />
    </SimpleSalonGuard>
  )
}
