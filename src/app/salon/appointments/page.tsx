// ================================================================================
// SALON APPOINTMENTS PAGE - LIST VIEW (PLAYBOOK API)
// Smart Code: HERA.PAGES.SALON.APPOINTMENTS.v1
// Uses Playbook API for appointment operations with Sacred Six tables
// ================================================================================

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  booked: {
    label: 'Booked',
    color:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    icon: CheckCircle
  },
  checked_in: {
    label: 'Checked In',
    color:
      'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
    icon: Clock
  },
  completed: {
    label: 'Completed',
    color:
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Cancelled',
    color:
      'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
    icon: XCircle
  },
  no_show: {
    label: 'No Show',
    color:
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
    icon: XCircle
  }
}

export default function SalonAppointmentsPage() {
  const router = useRouter()
  const { organization, isAuthenticated, isLoading: contextLoading } = useHERAAuth()

  // State for filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'week' | 'all'>('all')
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false)

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

  // Three-layer authorization pattern
  // Layer 1: Authentication check
  if (!isAuthenticated) {
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
  if (contextLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Layer 3: Organization check
  if (!organizationId) {
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
    <PageLayout>
      <PageHeader
        title="Appointments"
        breadcrumbs={[
          { label: 'HERA' },
          { label: 'SALON OS' },
          { label: 'Appointments', isActive: true }
        ]}
        actions={
          <>
            <PageHeaderButton
              variant="secondary"
              icon={CalendarDays}
              onClick={() => router.push('/salon/appointments/calendar')}
            >
              Calendar View
            </PageHeaderButton>
            <PageHeaderButton
              variant="primary"
              icon={Plus}
              onClick={() => window.location.href = 'http://localhost:3001/salon/appointments/new'}
            >
              Book Appointment
            </PageHeaderButton>
          </>
        }
      />

      {/* Error state */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Search by customer, stylist, or code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 dark:bg-gray-800 dark:border-gray-700 dark:!text-white dark:placeholder:text-gray-400"
            />
          </div>

          <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
            <SelectTrigger className="w-[180px] dark:bg-gray-800 dark:border-gray-700 dark:!text-white">
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
            <SelectTrigger className="w-[180px] dark:bg-gray-800 dark:border-gray-700 dark:!text-white">
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
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:!text-white mb-1">
            No appointments found
          </h3>
          <p className="text-gray-600 dark:!text-gray-200 mb-4">
            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Book your first appointment to get started'}
          </p>
          {!searchTerm && statusFilter === 'all' && dateFilter === 'all' && (
            <Button
              onClick={() => window.location.href = 'http://localhost:3001/salon/appointments/new'}
              className="dark:!text-white"
            >
              Book Appointment
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-amber-500 dark:text-amber-400">
            Showing {appointments.length} of {total} appointments
          </p>

          {appointments.map(appointment => {
            const appointmentDate = new Date(appointment.start_time)
            const isPast = appointmentDate < new Date()

            return (
              <Card
                key={appointment.id}
                className={cn(
                  'p-6 transition-all hover:shadow-md cursor-pointer',
                  isPast && 'opacity-75'
                )}
                onClick={() => router.push(`/salon/appointments/${appointment.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header Row */}
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                        {appointment.entity_name}
                      </h3>
                      {getStatusBadge(appointment.status)}
                      <Badge
                        variant="outline"
                        className="gap-1 dark:text-gray-300 dark:border-gray-600"
                      >
                        <Calendar className="w-3 h-3" />
                        {format(appointmentDate, 'MMM d, yyyy')}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="gap-1 dark:text-gray-300 dark:border-gray-600"
                      >
                        <Clock className="w-3 h-3" />
                        {format(appointmentDate, 'h:mm a')}
                      </Badge>
                    </div>

                    {/* Details Row */}
                    <div className="flex flex-wrap gap-4 text-sm text-amber-600 dark:text-amber-400">
                      {appointment.service_ids && appointment.service_ids.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Services:</span>
                          <span>{appointment.service_ids.length} service(s)</span>
                        </div>
                      )}

                      {appointment.price && appointment.price > 0 && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                          <span className="font-medium">
                            {appointment.currency_code || 'AED'} {appointment.price.toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <span className="text-amber-500">#{appointment.entity_code}</span>
                      </div>
                    </div>

                    {/* Notes */}
                    {appointment.notes && (
                      <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
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
                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
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
          organizationId={organizationId || undefined}
        />
      )}
    </PageLayout>
  )
}
