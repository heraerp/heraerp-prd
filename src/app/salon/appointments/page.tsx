// ================================================================================
// SALON APPOINTMENTS PAGE - LIST VIEW (PLAYBOOK API)
// Smart Code: HERA.PAGES.SALON.APPOINTMENTS.v1
// Uses Playbook API for appointment operations with Sacred Six tables
// ================================================================================

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSalonContext } from '@/app/salon/SalonProvider'
import { useAppointmentsPlaybook } from '@/hooks/useAppointmentsPlaybook'
import { AppointmentStatus } from '@/lib/playbook/entities'
import { format, startOfDay, endOfDay, addDays } from 'date-fns'
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
  Loader2
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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  booked: {
    label: 'Booked',
    color:
      'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700',
    icon: CheckCircle
  },
  checked_in: {
    label: 'Checked In',
    color:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
    icon: Clock
  },
  completed: {
    label: 'Completed',
    color:
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Cancelled',
    color:
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
    icon: XCircle
  },
  no_show: {
    label: 'No Show',
    color:
      'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
    icon: XCircle
  }
}

function SalonAppointmentsContent() {
  const router = useRouter()
  const { organizationId, isAuthenticated, isLoading: contextLoading } = useSalonContext()

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
    organizationId,
    refresh
  } = useAppointmentsPlaybook({
    ...getDateRange(),
    status: statusFilter !== 'all' ? [statusFilter] : undefined,
    q: searchTerm || undefined
  })

  // Update filters when changed
  useEffect(() => {
    refresh()
  }, [searchTerm, statusFilter, dateFilter])

  const getStatusBadge = (status: AppointmentStatus) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.booked
    const Icon = config.icon
    return (
      <Badge className={cn('gap-1', config.color)}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  // Get effective organization ID
  const effectiveOrgId = organizationId || localOrgId

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/50 to-muted dark:from-background dark:to-background">
      <div className="p-6">
        {/* Page Actions */}
        <div className="flex items-center justify-end gap-4 mb-6">
          <Button
            variant="outline"
            className="border-border hover:bg-accent"
            onClick={() => router.push('/salon/kanban')}
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Kanban View
          </Button>
          <Button
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={() => setShowNewAppointmentModal(true)}
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
        <Card className="p-6 mb-6 bg-card/95 backdrop-blur shadow-lg border-border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, stylist, or code..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-background border-border"
              />
            </div>

            <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
              <SelectTrigger className="w-[180px] bg-background border-border">
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
              <SelectTrigger className="w-[180px] bg-background border-border">
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

        {/* Appointments List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-6 bg-card/95 backdrop-blur shadow-lg border-border">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <Card className="p-12 text-center bg-card/95 backdrop-blur shadow-lg border-border">
            <Calendar className="w-12 h-12 text-violet-500/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No appointments found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Book your first appointment to get started'}
            </p>
            {!searchTerm && statusFilter === 'all' && dateFilter === 'all' && (
              <Button
                onClick={() => setShowNewAppointmentModal(true)}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Showing {appointments.length} of {total} appointments
            </p>

            {appointments.map(appointment => {
              const appointmentDate = new Date(appointment.start_time)
              const isPast = appointmentDate < new Date()

              return (
                <Card
                  key={appointment.id}
                  className={cn(
                    'p-6 transition-all hover:shadow-xl cursor-pointer bg-card/95 backdrop-blur border-border hover:border-violet-500/50',
                    isPast && 'opacity-75'
                  )}
                  onClick={() => router.push(`/salon/appointments/${appointment.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header Row */}
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-lg font-semibold text-foreground">
                          {appointment.entity_name}
                        </h3>
                        {getStatusBadge(appointment.status)}
                        <Badge variant="outline" className="gap-1 border-border">
                          <Calendar className="w-3 h-3" />
                          {format(appointmentDate, 'MMM d, yyyy')}
                        </Badge>
                        <Badge variant="outline" className="gap-1 border-border">
                          <Clock className="w-3 h-3" />
                          {format(appointmentDate, 'h:mm a')}
                        </Badge>
                      </div>

                      {/* Details Row */}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {appointment.service_ids && appointment.service_ids.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Services:</span>
                            <span>{appointment.service_ids.length} service(s)</span>
                          </div>
                        )}

                        {appointment.price && appointment.price > 0 && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-violet-500" />
                            <span className="font-medium">
                              {appointment.currency_code || 'AED'} {appointment.price.toFixed(2)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <span className="text-violet-500">#{appointment.entity_code}</span>
                        </div>
                      </div>

                      {/* Notes */}
                      {appointment.notes && (
                        <p className="mt-2 text-sm text-muted-foreground italic">
                          {appointment.notes}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="hover:bg-muted">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
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
                            // TODO: Implement delete via Playbook API
                            toast({
                              title: 'Not implemented',
                              description: 'Delete functionality coming soon',
                              variant: 'destructive'
                            })
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
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
