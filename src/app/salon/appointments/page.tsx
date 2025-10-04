'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import {
  useHeraAppointments,
  type Appointment,
  type AppointmentFormValues
} from '@/hooks/useHeraAppointments'
import { useBranchFilter } from '@/hooks/useBranchFilter'
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
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

// Luxe color palette
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  emerald: '#0F6F5C',
  rose: '#E8B4B8'
}

interface AppointmentStats {
  totalAppointments: number
  todayAppointments: number
  upcomingAppointments: number
  completedAppointments: number
}

function AppointmentsContent() {
  const router = useRouter()
  const { organizationId } = useSecuredSalonContext()
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()

  // State declarations
  const [searchTerm, setSearchTerm] = useState('')
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>()
  const [showArchivedAppointments, setShowArchivedAppointments] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  // Use the new useHeraAppointments hook
  const {
    appointments,
    isLoading,
    createAppointment,
    updateAppointment,
    archiveAppointment,
    deleteAppointment,
    restoreAppointment,
    isCreating,
    isUpdating,
    isDeleting
  } = useHeraAppointments({
    organizationId: organizationId || '',
    includeArchived: showArchivedAppointments,
    userRole: 'manager' // TODO: Get from auth context
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

  // Appointment modal handlers
  const handleOpenAppointmentModal = (appointment?: Appointment) => {
    setSelectedAppointment(appointment)
    setAppointmentModalOpen(true)
  }

  const handleCloseAppointmentModal = () => {
    setSelectedAppointment(undefined)
    setAppointmentModalOpen(false)
  }

  const handleSaveAppointment = async (appointmentData: AppointmentFormValues) => {
    if (!organizationId) return

    try {
      if (selectedAppointment) {
        // Update existing appointment
        await updateAppointment(selectedAppointment.id, appointmentData)
        showSuccess('Appointment updated', 'Successfully updated appointment')
      } else {
        // Create new appointment
        await createAppointment(appointmentData)
        showSuccess('Appointment created', 'Successfully created new appointment')
      }
      handleCloseAppointmentModal()
    } catch (error) {
      console.error('Error saving appointment:', error)
      showError(
        'Failed to save appointment',
        error instanceof Error ? error.message : 'Please try again'
      )
      throw error
    }
  }

  const handleArchiveAppointment = async (appointmentId: string) => {
    if (!organizationId) return

    try {
      await archiveAppointment(appointmentId)
      showSuccess('Appointment archived', 'Successfully archived appointment')
      handleCloseAppointmentModal()
    } catch (error) {
      console.error('Error archiving appointment:', error)
      showError(
        'Failed to archive appointment',
        error instanceof Error ? error.message : 'Please try again'
      )
      throw error
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!organizationId) return

    try {
      await deleteAppointment(appointmentId, true)
      showSuccess('Appointment deleted', 'Successfully deleted appointment permanently')
      handleCloseAppointmentModal()
    } catch (error) {
      console.error('Error deleting appointment:', error)
      showError(
        'Failed to delete appointment',
        error instanceof Error ? error.message : 'Please try again'
      )
      throw error
    }
  }

  const handleConfirmDeleteAppointment = async () => {
    if (!appointmentToDelete) return

    try {
      await deleteAppointment(appointmentToDelete.id, true)
      showSuccess('Appointment deleted', 'Successfully deleted appointment permanently')
      setDeleteConfirmOpen(false)
      setAppointmentToDelete(null)
    } catch (error) {
      showError(
        'Failed to delete appointment',
        error instanceof Error ? error.message : 'Please try again'
      )
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

  if (!organizationId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.black }}
      >
        <div
          className="text-center p-8 rounded-xl"
          style={{
            backgroundColor: COLORS.charcoal,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
          }}
        >
          <h2 className="text-xl font-medium mb-2" style={{ color: COLORS.champagne }}>
            Loading...
          </h2>
          <p style={{ color: COLORS.lightText, opacity: 0.7 }}>Setting up appointments.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.black }}>
      <div
        className="rounded-2xl p-8"
        style={{
          backgroundColor: COLORS.charcoal,
          border: `1px solid ${COLORS.gold}20`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{
                background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.gold} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Appointments
            </h1>
            <p style={{ color: COLORS.bronze }}>Manage salon appointments and bookings</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/salon/appointments/calendar')}
              style={{
                background: `linear-gradient(135deg, ${COLORS.emerald} 0%, ${COLORS.emerald}DD 100%)`,
                color: COLORS.champagne,
                border: 'none'
              }}
              className="hover:opacity-90"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar View
            </Button>
            <Button
              onClick={() => handleOpenAppointmentModal()}
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                color: COLORS.black,
                border: 'none'
              }}
              className="hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Appointments',
              value: stats.totalAppointments,
              desc: 'All time',
              icon: CalendarDays,
              color: COLORS.emerald
            },
            {
              title: 'Today',
              value: stats.todayAppointments,
              desc: 'Scheduled today',
              icon: Clock,
              color: COLORS.gold
            },
            {
              title: 'Upcoming',
              value: stats.upcomingAppointments,
              desc: 'Future bookings',
              icon: Calendar,
              color: COLORS.bronze
            },
            {
              title: 'Completed',
              value: stats.completedAppointments,
              desc: 'Finished',
              icon: CheckCircle,
              color: COLORS.champagne
            }
          ].map((stat, index) => (
            <Card
              key={index}
              style={{
                backgroundColor: COLORS.charcoalLight,
                border: `1px solid ${COLORS.gold}20`,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: COLORS.bronze }}>
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: COLORS.champagne }}>
                  {stat.value}
                </div>
                <p className="text-xs" style={{ color: COLORS.bronze }}>
                  {stat.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                style={{ color: COLORS.bronze }}
              />
              <Input
                placeholder="Search by customer, stylist..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 border-0 outline-none"
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  border: `1px solid ${COLORS.gold}30`,
                  color: COLORS.champagne,
                  borderRadius: '0.375rem'
                }}
              />
            </div>

            <div className="w-64">
              <Select
                value={branchId || '__ALL__'}
                onValueChange={value => setBranchId(value === '__ALL__' ? '' : value)}
              >
                <SelectTrigger
                  className="border-0 outline-none"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    border: `1px solid ${COLORS.gold}30`,
                    color: COLORS.champagne
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" style={{ color: COLORS.bronze }} />
                    <SelectValue placeholder="All locations" />
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
                        {branch.name || 'Unnamed Branch'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="border-0 outline-none"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    border: `1px solid ${COLORS.gold}30`,
                    color: COLORS.champagne
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
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger
                  className="border-0 outline-none"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    border: `1px solid ${COLORS.gold}30`,
                    color: COLORS.champagne
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

            <Button
              variant={showArchivedAppointments ? 'default' : 'outline'}
              onClick={() => setShowArchivedAppointments(!showArchivedAppointments)}
              style={{
                backgroundColor: showArchivedAppointments ? COLORS.gold : 'transparent',
                color: showArchivedAppointments ? COLORS.black : COLORS.champagne,
                borderColor: COLORS.gold
              }}
              className="whitespace-nowrap"
            >
              <Archive className="h-4 w-4 mr-2" />
              {showArchivedAppointments ? 'Hide Archived' : 'Show Archived'}
            </Button>
          </div>
        </div>

        {/* Appointments List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: COLORS.gold }}
            />
            <span className="ml-3" style={{ color: COLORS.bronze }}>
              Loading appointments...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAppointments.map(appointment => {
              const appointmentDate = appointment.start_time
                ? new Date(appointment.start_time)
                : null

              return (
                <Card
                  key={appointment.id}
                  className="transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    border: `1px solid ${COLORS.gold}20`,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
                    opacity: appointment.status === 'archived' ? 0.6 : 1
                  }}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg" style={{ color: COLORS.champagne }}>
                            {appointment.customer_name || 'Customer'}
                          </h3>
                          <p className="text-sm mt-1" style={{ color: COLORS.bronze }}>
                            {appointment.stylist_name || 'Unassigned'}
                          </p>
                        </div>
                        <Badge
                          style={{
                            backgroundColor:
                              appointment.status === 'booked'
                                ? `${COLORS.gold}20`
                                : appointment.status === 'completed'
                                  ? `${COLORS.emerald}20`
                                  : `${COLORS.bronze}20`,
                            color:
                              appointment.status === 'booked'
                                ? COLORS.gold
                                : appointment.status === 'completed'
                                  ? COLORS.emerald
                                  : COLORS.bronze,
                            border: `1px solid ${
                              appointment.status === 'booked'
                                ? COLORS.gold
                                : appointment.status === 'completed'
                                  ? COLORS.emerald
                                  : COLORS.bronze
                            }40`
                          }}
                        >
                          {appointment.status}
                        </Badge>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 text-sm">
                        {appointmentDate && (
                          <>
                            <div
                              className="flex items-center gap-2"
                              style={{ color: COLORS.bronze }}
                            >
                              <Calendar className="w-4 h-4" />
                              <span>{format(appointmentDate, 'MMM d, yyyy')}</span>
                            </div>
                            <div
                              className="flex items-center gap-2"
                              style={{ color: COLORS.bronze }}
                            >
                              <Clock className="w-4 h-4" />
                              <span>{format(appointmentDate, 'h:mm a')}</span>
                              {appointment.duration_minutes && (
                                <span>({appointment.duration_minutes} min)</span>
                              )}
                            </div>
                          </>
                        )}
                        {appointment.price !== undefined && appointment.price > 0 && (
                          <div
                            className="flex items-center gap-2"
                            style={{ color: COLORS.champagne }}
                          >
                            <DollarSign className="w-4 h-4" style={{ color: COLORS.gold }} />
                            <span className="font-medium">
                              {appointment.currency_code || 'AED'} {appointment.price.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {appointment.notes && (
                        <p className="text-sm italic" style={{ color: COLORS.bronze }}>
                          {appointment.notes}
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div
                        className="pt-4 border-t flex gap-2"
                        style={{ borderColor: COLORS.gold + '20' }}
                      >
                        <Button
                          size="sm"
                          onClick={() => handleOpenAppointmentModal(appointment)}
                          style={{
                            backgroundColor: COLORS.gold + '20',
                            color: COLORS.gold,
                            border: `1px solid ${COLORS.gold}40`,
                            flex: 1
                          }}
                          className="hover:opacity-80 transition-opacity"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>

                        {/* Show Archive button for active appointments */}
                        {appointment.status !== 'archived' &&
                          appointment.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  await archiveAppointment(appointment.id)
                                  showSuccess(
                                    'Appointment archived',
                                    'Successfully archived appointment'
                                  )
                                } catch (error) {
                                  showError(
                                    'Failed to archive appointment',
                                    error instanceof Error ? error.message : 'Please try again'
                                  )
                                }
                              }}
                              style={{
                                backgroundColor: COLORS.bronze + '20',
                                color: COLORS.bronze,
                                border: `1px solid ${COLORS.bronze}40`,
                                flex: 1
                              }}
                              className="hover:opacity-80 transition-opacity"
                            >
                              <Archive className="h-3 w-3 mr-1" />
                              Archive
                            </Button>
                          )}

                        {/* Show Restore button for archived appointments */}
                        {appointment.status === 'archived' && (
                          <Button
                            size="sm"
                            onClick={() => handleRestoreAppointment(appointment)}
                            style={{
                              backgroundColor: COLORS.emerald + '20',
                              color: COLORS.emerald,
                              border: `1px solid ${COLORS.emerald}40`,
                              flex: 1
                            }}
                            className="hover:opacity-80 transition-opacity"
                          >
                            Restore
                          </Button>
                        )}

                        {/* Show Delete button for archived appointments */}
                        {appointment.status === 'archived' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setAppointmentToDelete(appointment)
                              setDeleteConfirmOpen(true)
                            }}
                            style={{
                              backgroundColor: '#991B1B20',
                              color: '#991B1B',
                              border: `1px solid #991B1B40`,
                              flex: 1
                            }}
                            className="hover:opacity-80 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredAppointments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.bronze }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: COLORS.champagne }}>
              No appointments found
            </h3>
            <p style={{ color: COLORS.bronze }}>
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Click "New Appointment" to create your first booking'}
            </p>
            {!searchTerm && statusFilter === 'all' && dateFilter === 'all' && (
              <Button
                className="mt-4"
                onClick={() => setAppointmentModalOpen(true)}
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                  color: COLORS.black,
                  border: 'none'
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Appointment
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent
          className="max-w-md"
          style={{
            backgroundColor: COLORS.charcoal,
            border: `1px solid ${COLORS.gold}`,
            color: COLORS.lightText
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: COLORS.champagne }} className="text-xl font-bold">
              Delete Appointment?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p style={{ color: COLORS.lightText }}>
              Are you sure you want to permanently delete this appointment with{' '}
              <strong style={{ color: COLORS.gold }}>
                &ldquo;{appointmentToDelete?.customer_name}&rdquo;
              </strong>
              ?
            </p>
            <p className="mt-3 text-sm" style={{ color: COLORS.bronze }}>
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false)
                setAppointmentToDelete(null)
              }}
              disabled={isDeleting}
              className="flex-1"
              style={{
                borderColor: COLORS.gold,
                color: COLORS.champagne,
                backgroundColor: 'transparent'
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDeleteAppointment}
              disabled={isDeleting}
              className="flex-1"
              style={{
                backgroundColor: '#991B1B',
                color: '#FFFFFF'
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Modal */}
      <AppointmentModal
        open={appointmentModalOpen}
        onOpenChange={handleCloseAppointmentModal}
        onSave={handleSaveAppointment}
        onArchive={handleArchiveAppointment}
        onDelete={handleDeleteAppointment}
        appointment={selectedAppointment}
        userRole="manager"
        isLoading={isCreating || isUpdating || isDeleting}
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
