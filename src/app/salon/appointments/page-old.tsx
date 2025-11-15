// ================================================================================
// SALON APPOINTMENTS PAGE - LIST VIEW (PLAYBOOK API)
// Smart Code: HERA.PAGES.SALON.APPOINTMENTS.V1
// Uses Playbook API for appointment operations with Sacred Six tables
// ================================================================================

'use client'

import React, { useState, useEffect } from 'react'
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
  MapPin
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
  const { organizationId, isAuthenticated, isLoading: contextLoading } = useSecuredSalonContext()

  // Branch filter hook
  const {
    branchId,
    branches,
    loading: branchesLoading,
    setBranchId,
    hasMultipleBranches
  } = useBranchFilter(undefined, 'salon-appointments-list')

  // State for filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'week' | 'all'>('all')
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false)

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
        return {
          date_from: today.toISOString(),
          date_to: endOfDay(addDays(today, 14)).toISOString()
        }
    }
  }

  // Use Playbook hook
  const {
    data: appointments,
    total,
    loading,
    error,
    organizationId: playbookOrgId,
    refresh
  } = useAppointmentsPlaybook({
    ...getDateRange(),
    status: statusFilter !== 'all' ? [statusFilter] : undefined,
    branch_id: branchId || undefined,
    q: searchTerm || undefined
  })

  // Update filters when changed
  useEffect(() => {
    refresh()
  }, [searchTerm, statusFilter, dateFilter, branchId])

  const getStatusBadge = (status: AppointmentStatus) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.booked
    const Icon = config.icon
    return (
      <Badge
        className="gap-1 border"
        style={{
          backgroundColor: config.bgColor,
          color: config.color,
          borderColor: config.color
        }}
      >
        <Icon className="w-3 h-3" />
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
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
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
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${LUXE_COLORS.black} 0%, ${LUXE_COLORS.charcoal} 100%)`
      }}
    >
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: LUXE_COLORS.champagne }}>
            Appointments
          </h1>
          <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
            Manage all salon appointments and bookings
          </p>
        </div>

        {/* Page Actions */}
        <div className="flex items-center justify-end gap-3 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/salon/appointments/calendar')}
            style={{
              backgroundColor: LUXE_COLORS.black,
              borderColor: LUXE_COLORS.bronze,
              color: LUXE_COLORS.champagne
            }}
            className="hover:opacity-80"
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
            className="hover:opacity-80"
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Kanban View
          </Button>
          <Button
            style={{
              background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
              color: LUXE_COLORS.black
            }}
            className="hover:opacity-90 transition-opacity font-semibold"
            onClick={() => router.push('/salon/appointments/new')}
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
          className="p-6 mb-6 backdrop-blur shadow-lg border"
          style={{
            backgroundColor: LUXE_COLORS.charcoal,
            borderColor: `${LUXE_COLORS.gold}40`
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
                className="pl-9"
                style={{
                  backgroundColor: LUXE_COLORS.black,
                  borderColor: LUXE_COLORS.bronze,
                  color: LUXE_COLORS.champagne
                }}
              />
            </div>

            {/* Branch Filter - Enterprise Grade */}
            <Select
              value={branchId || 'all'}
              onValueChange={value => setBranchId(value === 'all' ? undefined : value)}
            >
              <SelectTrigger
                className="w-[200px]"
                style={{
                  backgroundColor: LUXE_COLORS.black,
                  borderColor: LUXE_COLORS.bronze,
                  color: LUXE_COLORS.champagne
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
                className="w-[180px]"
                style={{
                  backgroundColor: LUXE_COLORS.black,
                  borderColor: LUXE_COLORS.bronze,
                  color: LUXE_COLORS.champagne
                }}
              >
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem value="all" className="hera-select-item">
                  Next 14 days
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
                className="w-[180px]"
                style={{
                  backgroundColor: LUXE_COLORS.black,
                  borderColor: LUXE_COLORS.bronze,
                  color: LUXE_COLORS.champagne
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
        {branchId && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
              Active Filters:
            </span>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{
                background: `${LUXE_COLORS.gold}20`,
                border: `1px solid ${LUXE_COLORS.gold}40`
              }}
            >
              <Building2 className="h-3 w-3" style={{ color: LUXE_COLORS.gold }} />
              <span className="text-sm font-medium" style={{ color: LUXE_COLORS.champagne }}>
                {branches.find(b => b.id === branchId)?.name || 'Unknown Branch'}
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
            {[1, 2, 3].map(i => (
              <Card
                key={i}
                className="p-6 backdrop-blur shadow-lg border"
                style={{
                  backgroundColor: LUXE_COLORS.charcoal,
                  borderColor: `${LUXE_COLORS.gold}40`
                }}
              >
                <div className="animate-pulse">
                  <div
                    className="h-4 rounded w-1/4 mb-4"
                    style={{ backgroundColor: `${LUXE_COLORS.bronze}40` }}
                  ></div>
                  <div
                    className="h-3 rounded w-1/2 mb-2"
                    style={{ backgroundColor: `${LUXE_COLORS.bronze}40` }}
                  ></div>
                  <div
                    className="h-3 rounded w-1/3"
                    style={{ backgroundColor: `${LUXE_COLORS.bronze}40` }}
                  ></div>
                </div>
              </Card>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <Card
            className="p-12 text-center backdrop-blur shadow-lg border"
            style={{
              backgroundColor: LUXE_COLORS.charcoal,
              borderColor: `${LUXE_COLORS.gold}40`
            }}
          >
            <Calendar
              className="w-12 h-12 mx-auto mb-4"
              style={{ color: `${LUXE_COLORS.gold}40` }}
            />
            <h3 className="text-lg font-medium mb-1" style={{ color: LUXE_COLORS.champagne }}>
              No appointments found
            </h3>
            <p className="mb-4" style={{ color: LUXE_COLORS.bronze }}>
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || branchId
                ? 'Try adjusting your filters'
                : 'Book your first appointment to get started'}
            </p>
            {!searchTerm && statusFilter === 'all' && dateFilter === 'all' && !branchId && (
              <Button
                onClick={() => router.push('/salon/appointments/new')}
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
                  color: LUXE_COLORS.black
                }}
                className="hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
              Showing {appointments.length} of {total} appointments
            </p>

            {appointments.map(appointment => {
              const appointmentDate = new Date(appointment.start_time)
              const isPast = appointmentDate < new Date()

              return (
                <Card
                  key={appointment.id}
                  className={cn(
                    'p-6 transition-all hover:shadow-xl cursor-pointer backdrop-blur border',
                    isPast && 'opacity-60'
                  )}
                  style={{
                    backgroundColor: LUXE_COLORS.charcoal,
                    borderColor: `${LUXE_COLORS.gold}40`
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}80`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}40`
                  }}
                  onClick={() => router.push(`/salon/appointments/${appointment.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header Row */}
                      <div className="flex items-center gap-4 mb-3">
                        <h3
                          className="text-lg font-semibold"
                          style={{ color: LUXE_COLORS.champagne }}
                        >
                          {appointment.entity_name}
                        </h3>
                        {getStatusBadge(appointment.status)}
                        <Badge
                          variant="outline"
                          className="gap-1 border"
                          style={{
                            backgroundColor: `${LUXE_COLORS.bronze}20`,
                            borderColor: LUXE_COLORS.bronze,
                            color: LUXE_COLORS.champagne
                          }}
                        >
                          <Calendar className="w-3 h-3" />
                          {format(appointmentDate, 'MMM d, yyyy')}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="gap-1 border"
                          style={{
                            backgroundColor: `${LUXE_COLORS.bronze}20`,
                            borderColor: LUXE_COLORS.bronze,
                            color: LUXE_COLORS.champagne
                          }}
                        >
                          <Clock className="w-3 h-3" />
                          {format(appointmentDate, 'h:mm a')}
                        </Badge>
                        {appointment.metadata?.branch_id && (
                          <Badge
                            variant="outline"
                            className="gap-1 border"
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
                            <DollarSign className="w-4 h-4" style={{ color: LUXE_COLORS.gold }} />
                            <span className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                              {appointment.currency_code || 'AED'} {appointment.price.toFixed(2)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <span style={{ color: LUXE_COLORS.gold }}>
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
                          className="hover:opacity-80"
                          style={{ color: LUXE_COLORS.bronze }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            router.push(`/salon/appointments/${appointment.id}/edit`)
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            handleCancel(appointment.id)
                          }}
                          disabled={actionId === appointment.id}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Cancel
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            handleNoShow(appointment.id)
                          }}
                          disabled={actionId === appointment.id}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Mark No-show
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            handleCheckIn(appointment.id)
                          }}
                          disabled={actionId === appointment.id}
                        >
                          <Clock className="w-4 h-4 mr-2" />
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
