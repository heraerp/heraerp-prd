'use client'
// Force dynamic rendering to prevent SSG issues with SecuredSalonProvider
export const dynamic = "force-dynamic";



/**
 * Salon Appointments Page
 *
 * Enterprise-grade appointment management using Universal Entity v2
 * Follows HERA DNA standards with proper smart codes and multi-tenant architecture
 */

import React, { useState, useMemo, useCallback } from 'react'
import {
  Calendar,
  Clock,
  Users,
  Search,
  Filter,
  Plus,
  Check,
  X,
  AlertCircle,
  DollarSign,
  MapPin,
  User,
  Scissors,
  FileText,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import { format, parseISO, differenceInMinutes, addDays, startOfDay, endOfDay } from 'date-fns'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { useSecuredSalonContext } from '../EnterpriseSecuredSalonProvider'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { APPOINTMENT_PRESET } from '@/hooks/entityPresets'
import { AppointmentForm } from '@/components/salon/AppointmentForm'
import '@/styles/salon-luxe.css'

// Status configuration
const APPOINTMENT_STATUS = {
  scheduled: { label: 'Scheduled', color: LUXE_COLORS.sapphire, icon: Clock },
  confirmed: { label: 'Confirmed', color: LUXE_COLORS.emerald, icon: CheckCircle },
  in_progress: { label: 'In Progress', color: LUXE_COLORS.gold, icon: Loader2 },
  completed: { label: 'Completed', color: LUXE_COLORS.emerald, icon: Check },
  no_show: { label: 'No Show', color: LUXE_COLORS.orange, icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: LUXE_COLORS.ruby, icon: XCircle }
}

// Payment status configuration
const PAYMENT_STATUS = {
  unpaid: { label: 'Unpaid', color: LUXE_COLORS.bronze },
  paid: { label: 'Paid', color: LUXE_COLORS.emerald },
  refunded: { label: 'Refunded', color: LUXE_COLORS.ruby },
  partial: { label: 'Partial', color: LUXE_COLORS.orange }
}

// Booking source configuration
const BOOKING_SOURCES = {
  walk_in: 'Walk In',
  phone: 'Phone',
  web: 'Website',
  app: 'Mobile App',
  partner: 'Partner'
}

export default function SalonAppointmentsPage() {
  const { salonRole, hasPermission, isAuthenticated, organization } = useSecuredSalonContext()
  const { toast } = useToast()

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<any>(null)
  const [cancellingAppointment, setCancellingAppointment] = useState<any>(null)
  const [cancellationReason, setCancellationReason] = useState('')

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('today')
  const [staffFilter, setStaffFilter] = useState<string>('all')

  // Load appointments
  const {
    entities: appointments,
    isLoading,
    error,
    refetch,
    create,
    update,
    archive,
    delete: hardDelete,
    isCreating,
    isUpdating,
    isDeleting
  } = useUniversalEntity({
    entity_type: 'APPOINTMENT',
    filters: {
      include_dynamic: true,
      include_relationships: true,
      limit: 200
    },
    dynamicFields: APPOINTMENT_PRESET.dynamicFields
  })

  // Load related entities for dropdowns
  const { entities: customers } = useUniversalEntity({
    entity_type: 'CUSTOMER',
    filters: { include_dynamic: true, limit: 100 }
  })

  const { entities: staff } = useUniversalEntity({
    entity_type: 'EMPLOYEE',
    filters: { include_dynamic: true, limit: 50 }
  })

  const { entities: services } = useUniversalEntity({
    entity_type: 'SERVICE',
    filters: { include_dynamic: true, limit: 100 }
  })

  const { entities: locations } = useUniversalEntity({
    entity_type: 'SALON_LOCATION',
    filters: { include_dynamic: true, limit: 10 }
  })

  // Permission checks
  const canCreate = ['owner', 'manager', 'receptionist'].includes(salonRole)
  const canEdit = ['owner', 'manager', 'receptionist', 'staff'].includes(salonRole)
  const canDelete = ['owner', 'manager'].includes(salonRole)
  const canViewPricing = ['owner', 'manager', 'accountant'].includes(salonRole)

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    let filtered = appointments || []

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter((appt: any) => {
        const startTime = appt.dynamic_fields?.start_time?.value
        if (!startTime) return false
        const apptDate = parseISO(startTime)

        switch (dateFilter) {
          case 'today':
            return apptDate >= startOfDay(now) && apptDate <= endOfDay(now)
          case 'next7days':
            return apptDate >= startOfDay(now) && apptDate <= endOfDay(addDays(now, 7))
          default:
            return true
        }
      })
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((appt: any) => {
        const status = appt.dynamic_fields?.status?.value || 'scheduled'
        return status === statusFilter
      })
    }

    // Staff filter
    if (staffFilter !== 'all') {
      filtered = filtered.filter((appt: any) => {
        const staffRel = appt.relationships?.find(
          (r: any) => r.relationship_type === 'APPT_WITH_STAFF'
        )
        return staffRel?.to_entity_id === staffFilter
      })
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((appt: any) => {
        // Search in customer name (from relationship)
        const customerRel = appt.relationships?.find(
          (r: any) => r.relationship_type === 'APPT_FOR_CUSTOMER'
        )
        const customer = customers?.find((c: any) => c.id === customerRel?.to_entity_id)
        const customerName = customer?.dynamic_fields?.name?.value || customer?.entity_name || ''

        // Search in service name (from relationship)
        const serviceRel = appt.relationships?.find(
          (r: any) => r.relationship_type === 'APPT_OF_SERVICE'
        )
        const service = services?.find((s: any) => s.id === serviceRel?.to_entity_id)
        const serviceName = service?.dynamic_fields?.name?.value || service?.entity_name || ''

        // Search in staff name
        const staffRel = appt.relationships?.find(
          (r: any) => r.relationship_type === 'APPT_WITH_STAFF'
        )
        const staffMember = staff?.find((s: any) => s.id === staffRel?.to_entity_id)
        const staffName = staffMember?.dynamic_fields?.name?.value || staffMember?.entity_name || ''

        return (
          customerName.toLowerCase().includes(query) ||
          serviceName.toLowerCase().includes(query) ||
          staffName.toLowerCase().includes(query)
        )
      })
    }

    return filtered
  }, [appointments, customers, services, staff, dateFilter, statusFilter, staffFilter, searchQuery])

  // Sort appointments by start time
  const sortedAppointments = useMemo(() => {
    return [...filteredAppointments].sort((a, b) => {
      const aTime = a.dynamic_fields?.start_time?.value
      const bTime = b.dynamic_fields?.start_time?.value
      if (!aTime || !bTime) return 0
      return new Date(aTime).getTime() - new Date(bTime).getTime()
    })
  }, [filteredAppointments])

  // Handlers
  const handleCreate = async (formData: any) => {
    try {
      // Calculate entity name
      const customer = customers?.find((c: any) => c.id === formData.customer_id)
      const service = services?.find((s: any) => s.id === formData.service_id)
      const startTime = formData.start_time
        ? format(parseISO(formData.start_time), 'MMM d @ h:mm a')
        : ''
      const entity_name = `${customer?.entity_name || 'Customer'} - ${service?.entity_name || 'Service'} @ ${startTime}`

      await create({
        entity_type: 'APPOINTMENT',
        entity_name,
        smart_code: 'HERA.SALON.APPOINTMENT.ENTITY.BOOKING.V1',
        dynamic_fields: {
          status: {
            value: formData.status || 'scheduled',
            type: 'text',
            smart_code: 'HERA.SALON.APPOINTMENT.DYN.STATUS.V1'
          },
          start_time: {
            value: formData.start_time,
            type: 'date',
            smart_code: 'HERA.SALON.APPOINTMENT.DYN.START_TIME.V1'
          },
          end_time: {
            value: formData.end_time,
            type: 'date',
            smart_code: 'HERA.SALON.APPOINTMENT.DYN.END_TIME.V1'
          },
          duration_minutes: {
            value: formData.duration_minutes,
            type: 'number',
            smart_code: 'HERA.SALON.APPOINTMENT.DYN.DURATION_MIN.V1'
          },
          price_total: {
            value: formData.price_total || 0,
            type: 'number',
            smart_code: 'HERA.SALON.APPOINTMENT.DYN.PRICE_TOTAL.V1'
          },
          discount: {
            value: formData.discount || 0,
            type: 'number',
            smart_code: 'HERA.SALON.APPOINTMENT.DYN.DISCOUNT.V1'
          },
          tax: {
            value: formData.tax || 0,
            type: 'number',
            smart_code: 'HERA.SALON.APPOINTMENT.DYN.TAX.V1'
          },
          payment_status: {
            value: formData.payment_status || 'unpaid',
            type: 'text',
            smart_code: 'HERA.SALON.APPOINTMENT.DYN.PAYMENT_STATUS.V1'
          },
          source: {
            value: formData.source || 'walk_in',
            type: 'text',
            smart_code: 'HERA.SALON.APPOINTMENT.DYN.SOURCE.V1'
          },
          notes: {
            value: formData.notes || '',
            type: 'text',
            smart_code: 'HERA.SALON.APPOINTMENT.DYN.NOTES.V1'
          },
          room: {
            value: formData.room || '',
            type: 'text',
            smart_code: 'HERA.SALON.APPOINTMENT.DYN.ROOM.V1'
          },
          chair: {
            value: formData.chair || '',
            type: 'text',
            smart_code: 'HERA.SALON.APPOINTMENT.DYN.CHAIR.V1'
          }
        },
        relationships: [
          {
            type: 'APPT_FOR_CUSTOMER',
            to_entity_id: formData.customer_id,
            smart_code: 'HERA.SALON.APPOINTMENT.REL.FOR_CUSTOMER.V1'
          },
          {
            type: 'APPT_WITH_STAFF',
            to_entity_id: formData.staff_id,
            smart_code: 'HERA.SALON.APPOINTMENT.REL.WITH_STAFF.V1'
          },
          {
            type: 'APPT_OF_SERVICE',
            to_entity_id: formData.service_id,
            smart_code: 'HERA.SALON.APPOINTMENT.REL.OF_SERVICE.V1'
          },
          ...(formData.location_id
            ? [
                {
                  type: 'APPT_AT_LOCATION',
                  to_entity_id: formData.location_id,
                  smart_code: 'HERA.SALON.APPOINTMENT.REL.AT_LOCATION.V1'
                }
              ]
            : [])
        ]
      })

      toast({
        title: 'Appointment created',
        description: `Successfully created appointment for ${customer?.entity_name}`
      })

      setIsModalOpen(false)
      refetch()
    } catch (error: any) {
      toast({
        title: 'Create failed',
        description: error?.message || 'Failed to create appointment',
        variant: 'destructive'
      })
    }
  }

  const handleUpdate = async (formData: any) => {
    if (!editingAppointment) return

    try {
      // Update dynamic fields
      const updateData: any = {
        entity_id: editingAppointment.id,
        dynamic_patch: {}
      }

      // Only update changed fields
      const fields = [
        'status',
        'start_time',
        'end_time',
        'duration_minutes',
        'price_total',
        'discount',
        'tax',
        'payment_status',
        'source',
        'notes',
        'room',
        'chair'
      ]

      fields.forEach(field => {
        if (formData[field] !== undefined) {
          updateData.dynamic_patch[field] = formData[field]
        }
      })

      await update(updateData)

      toast({
        title: 'Appointment updated',
        description: 'Successfully updated appointment details'
      })

      setIsModalOpen(false)
      setEditingAppointment(null)
      refetch()
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error?.message || 'Failed to update appointment',
        variant: 'destructive'
      })
    }
  }

  const handleQuickAction = async (appointment: any, action: string, additionalData?: any) => {
    try {
      let updateData: any = { entity_id: appointment.id, dynamic_patch: {} }

      switch (action) {
        case 'check_in':
          updateData.dynamic_patch = {
            status: 'in_progress',
            checkin_time: new Date().toISOString()
          }
          break

        case 'complete':
          updateData.dynamic_patch = {
            status: 'completed',
            checkout_time: new Date().toISOString()
          }
          break

        case 'cancel':
          updateData.dynamic_patch = {
            status: 'cancelled',
            cancellation_reason: additionalData?.reason || ''
          }
          break

        case 'no_show':
          updateData.dynamic_patch = {
            status: 'no_show'
          }
          break
      }

      await update(updateData)

      const actionLabels: Record<string, string> = {
        check_in: 'checked in',
        complete: 'completed',
        cancel: 'cancelled',
        no_show: 'marked as no-show'
      }

      toast({
        title: 'Appointment updated',
        description: `Successfully ${actionLabels[action]} the appointment`
      })

      refetch()
    } catch (error: any) {
      toast({
        title: 'Action failed',
        description: error?.message || 'Failed to update appointment',
        variant: 'destructive'
      })
    }
  }

  const handleCancelWithReason = () => {
    if (!cancellingAppointment || !cancellationReason.trim()) {
      toast({
        title: 'Cancellation reason required',
        description: 'Please provide a reason for cancellation',
        variant: 'destructive'
      })
      return
    }

    handleQuickAction(cancellingAppointment, 'cancel', { reason: cancellationReason })
    setCancellingAppointment(null)
    setCancellationReason('')
  }

  const openEditModal = (appointment: any) => {
    setEditingAppointment(appointment)
    setIsModalOpen(true)
  }

  const openCreateModal = () => {
    setEditingAppointment(null)
    setIsModalOpen(true)
  }

  // Render appointment row
  const renderAppointmentRow = (appointment: any) => {
    // Extract related entities
    const customerRel = appointment.relationships?.find(
      (r: any) => r.relationship_type === 'APPT_FOR_CUSTOMER'
    )
    const customer = customers?.find((c: any) => c.id === customerRel?.to_entity_id)

    const serviceRel = appointment.relationships?.find(
      (r: any) => r.relationship_type === 'APPT_OF_SERVICE'
    )
    const service = services?.find((s: any) => s.id === serviceRel?.to_entity_id)

    const staffRel = appointment.relationships?.find(
      (r: any) => r.relationship_type === 'APPT_WITH_STAFF'
    )
    const staffMember = staff?.find((s: any) => s.id === staffRel?.to_entity_id)

    // Extract fields
    const status = appointment.dynamic_fields?.status?.value || 'scheduled'
    const startTime = appointment.dynamic_fields?.start_time?.value
    const endTime = appointment.dynamic_fields?.end_time?.value
    const priceTotal = appointment.dynamic_fields?.price_total?.value || 0
    const paymentStatus = appointment.dynamic_fields?.payment_status?.value || 'unpaid'
    const notes = appointment.dynamic_fields?.notes?.value
    const room = appointment.dynamic_fields?.room?.value
    const chair = appointment.dynamic_fields?.chair?.value

    const statusConfig = APPOINTMENT_STATUS[status as keyof typeof APPOINTMENT_STATUS]
    const StatusIcon = statusConfig?.icon || Clock

    // Check if user can edit this appointment
    const canEditThis =
      canEdit &&
      (['owner', 'manager', 'receptionist'].includes(salonRole) ||
        (salonRole === 'staff' && staffRel?.to_entity_id === organization?.id))

    return (
      <div
        key={appointment.id}
        className="rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 hover:scale-[1.01]"
        style={{
          backgroundColor: `${LUXE_COLORS.charcoalLight}F2`,
          border: `1px solid ${LUXE_COLORS.gold}20`
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}40`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}20`
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            {/* Time block */}
            <div
              className="flex flex-col items-center justify-center px-4 py-2 rounded-lg"
              style={{
                backgroundColor: `${LUXE_COLORS.gold}20`,
                border: `1px solid ${LUXE_COLORS.gold}30`
              }}
            >
              <Clock className="h-4 w-4 mb-1" style={{ color: LUXE_COLORS.gold }} />
              {startTime && (
                <>
                  <div className="text-lg font-bold" style={{ color: LUXE_COLORS.champagne }}>
                    {format(parseISO(startTime), 'HH:mm')}
                  </div>
                  <div className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                    {format(parseISO(startTime), 'MMM d')}
                  </div>
                  {endTime && (
                    <div className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
                      {differenceInMinutes(parseISO(endTime), parseISO(startTime))} min
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg" style={{ color: LUXE_COLORS.champagne }}>
                  {customer?.dynamic_fields?.name?.value ||
                    customer?.entity_name ||
                    'Unknown Customer'}
                </h3>
                <Badge
                  className="flex items-center gap-1"
                  style={{
                    backgroundColor: statusConfig?.color + '20',
                    color: statusConfig?.color,
                    border: `1px solid ${statusConfig?.color}30`
                  }}
                >
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig?.label}
                </Badge>
              </div>

              <div className="space-y-1">
                {service && (
                  <div
                    className="flex items-center gap-2 text-sm"
                    style={{ color: LUXE_COLORS.lightText }}
                  >
                    <Scissors className="h-3 w-3" style={{ color: LUXE_COLORS.bronze }} />
                    <span>{service.dynamic_fields?.name?.value || service.entity_name}</span>
                    {canViewPricing && priceTotal > 0 && (
                      <>
                        <span style={{ color: LUXE_COLORS.bronze }}>•</span>
                        <span style={{ color: LUXE_COLORS.gold }}>${priceTotal.toFixed(2)}</span>
                        {paymentStatus !== 'unpaid' && (
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{
                              color:
                                PAYMENT_STATUS[paymentStatus as keyof typeof PAYMENT_STATUS]?.color,
                              borderColor:
                                PAYMENT_STATUS[paymentStatus as keyof typeof PAYMENT_STATUS]?.color
                            }}
                          >
                            {PAYMENT_STATUS[paymentStatus as keyof typeof PAYMENT_STATUS]?.label}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                )}

                {staffMember && (
                  <div
                    className="flex items-center gap-2 text-sm"
                    style={{ color: LUXE_COLORS.lightText }}
                  >
                    <User className="h-3 w-3" style={{ color: LUXE_COLORS.bronze }} />
                    <span>
                      {staffMember.dynamic_fields?.name?.value || staffMember.entity_name}
                    </span>
                    {(room || chair) && (
                      <>
                        <span style={{ color: LUXE_COLORS.bronze }}>•</span>
                        <MapPin className="h-3 w-3" style={{ color: LUXE_COLORS.bronze }} />
                        <span>
                          {room && `Room ${room}`}
                          {room && chair && ', '}
                          {chair && `Chair ${chair}`}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {notes && (
                  <div
                    className="flex items-start gap-2 text-sm mt-2"
                    style={{ color: LUXE_COLORS.bronze }}
                  >
                    <FileText className="h-3 w-3 mt-0.5" />
                    <span className="italic">{notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {canEditThis && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  style={{ color: LUXE_COLORS.bronze }}
                >
                  <span className="sr-only">Actions</span>
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48"
                style={{
                  backgroundColor: LUXE_COLORS.charcoalLight,
                  border: `1px solid ${LUXE_COLORS.gold}30`
                }}
              >
                {status === 'scheduled' && (
                  <DropdownMenuItem
                    onClick={() => handleQuickAction(appointment, 'check_in')}
                    style={{ color: LUXE_COLORS.lightText }}
                    className="cursor-pointer"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" style={{ color: LUXE_COLORS.emerald }} />
                    Check In
                  </DropdownMenuItem>
                )}

                {status === 'in_progress' && (
                  <DropdownMenuItem
                    onClick={() => handleQuickAction(appointment, 'complete')}
                    style={{ color: LUXE_COLORS.lightText }}
                    className="cursor-pointer"
                  >
                    <Check className="h-4 w-4 mr-2" style={{ color: LUXE_COLORS.emerald }} />
                    Complete
                  </DropdownMenuItem>
                )}

                {['scheduled', 'confirmed'].includes(status) && (
                  <>
                    <DropdownMenuItem
                      onClick={() => setCancellingAppointment(appointment)}
                      style={{ color: LUXE_COLORS.lightText }}
                      className="cursor-pointer"
                    >
                      <X className="h-4 w-4 mr-2" style={{ color: LUXE_COLORS.ruby }} />
                      Cancel
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleQuickAction(appointment, 'no_show')}
                      style={{ color: LUXE_COLORS.lightText }}
                      className="cursor-pointer"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" style={{ color: LUXE_COLORS.orange }} />
                      No Show
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator style={{ backgroundColor: `${LUXE_COLORS.bronze}30` }} />

                <DropdownMenuItem
                  onClick={() => openEditModal(appointment)}
                  style={{ color: LUXE_COLORS.lightText }}
                  className="cursor-pointer"
                >
                  Edit Details
                </DropdownMenuItem>

                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => archive(appointment.id)}
                    style={{ color: LUXE_COLORS.ruby }}
                    className="cursor-pointer"
                  >
                    Archive
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Please log in to manage appointments</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div
          className="rounded-xl shadow-lg backdrop-blur-xl p-6"
          style={{
            backgroundColor: `${LUXE_COLORS.charcoalLight}F2`,
            border: `1px solid ${LUXE_COLORS.gold}20`,
            boxShadow: `0 10px 30px ${LUXE_COLORS.black}80`
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
                    boxShadow: '0 4px 6px rgba(212, 175, 55, 0.3)'
                  }}
                >
                  <Calendar className="h-5 w-5" style={{ color: LUXE_COLORS.black }} />
                </div>
                <div>
                  <h1
                    className="text-2xl font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    Appointments
                  </h1>
                  <p className="text-sm font-medium" style={{ color: LUXE_COLORS.bronze }}>
                    {sortedAppointments.length} appointments •{' '}
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {canCreate && (
              <Button
                onClick={openCreateModal}
                className="font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5 hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
                  color: LUXE_COLORS.black,
                  border: 'none'
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div
          className="rounded-xl shadow-lg backdrop-blur-xl p-6"
          style={{
            backgroundColor: `${LUXE_COLORS.charcoalLight}F2`,
            border: `1px solid ${LUXE_COLORS.gold}20`
          }}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                style={{ color: LUXE_COLORS.bronze }}
              />
              <Input
                placeholder="Search by customer, service, or staff..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
            </div>

            <div className="flex items-center gap-3">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger
                  className="w-48 h-11"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                >
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  <SelectItem value="all" style={{ color: LUXE_COLORS.lightText }}>
                    All Dates
                  </SelectItem>
                  <SelectItem value="today" style={{ color: LUXE_COLORS.lightText }}>
                    Today
                  </SelectItem>
                  <SelectItem value="next7days" style={{ color: LUXE_COLORS.lightText }}>
                    Next 7 Days
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="w-48 h-11"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  <SelectItem value="all" style={{ color: LUXE_COLORS.lightText }}>
                    All Status
                  </SelectItem>
                  {Object.entries(APPOINTMENT_STATUS).map(([value, config]) => (
                    <SelectItem key={value} value={value} style={{ color: config.color }}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={staffFilter} onValueChange={setStaffFilter}>
                <SelectTrigger
                  className="w-48 h-11"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                >
                  <SelectValue placeholder="Staff Member" />
                </SelectTrigger>
                <SelectContent
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  <SelectItem value="all" style={{ color: LUXE_COLORS.lightText }}>
                    All Staff
                  </SelectItem>
                  {staff?.map((member: any) => (
                    <SelectItem
                      key={member.id}
                      value={member.id}
                      style={{ color: LUXE_COLORS.lightText }}
                    >
                      {member.dynamic_fields?.name?.value || member.entity_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: LUXE_COLORS.gold }} />
          </div>
        ) : sortedAppointments.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4" style={{ color: LUXE_COLORS.bronze }} />
              <p className="text-lg font-medium mb-2" style={{ color: LUXE_COLORS.lightText }}>
                No appointments found
              </p>
              <p className="text-sm mb-6" style={{ color: LUXE_COLORS.bronze }}>
                {searchQuery ||
                statusFilter !== 'all' ||
                dateFilter !== 'all' ||
                staffFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first appointment'}
              </p>
              {canCreate && !searchQuery && statusFilter === 'all' && (
                <Button
                  onClick={openCreateModal}
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
                    color: LUXE_COLORS.black
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Appointment
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">{sortedAppointments.map(renderAppointmentRow)}</div>
        )}

        {/* Create/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent
            className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col backdrop-blur-xl"
            style={{
              backgroundColor: `${LUXE_COLORS.charcoalLight}F2`,
              border: `1px solid ${LUXE_COLORS.gold}30`,
              color: LUXE_COLORS.lightText
            }}
          >
            <DialogHeader
              className="pb-6 border-b flex-shrink-0"
              style={{ borderColor: `${LUXE_COLORS.gold}20` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
                    boxShadow: '0 4px 6px rgba(212, 175, 55, 0.3)'
                  }}
                >
                  <Calendar className="h-5 w-5" style={{ color: LUXE_COLORS.black }} />
                </div>
                <div>
                  <DialogTitle
                    className="text-xl font-semibold"
                    style={{
                      background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {editingAppointment ? 'Edit Appointment' : 'New Appointment'}
                  </DialogTitle>
                  <DialogDescription className="mt-1" style={{ color: LUXE_COLORS.bronze }}>
                    {editingAppointment
                      ? 'Update the appointment details below'
                      : 'Schedule a new appointment for your client'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="overflow-y-auto flex-1">
              <AppointmentForm
                appointment={editingAppointment}
                customers={customers || []}
                staff={staff || []}
                services={services || []}
                locations={locations || []}
                onSubmit={editingAppointment ? handleUpdate : handleCreate}
                onCancel={() => setIsModalOpen(false)}
                isLoading={isCreating || isUpdating}
                canViewPricing={canViewPricing}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancellation Dialog */}
        <Dialog
          open={!!cancellingAppointment}
          onOpenChange={open => !open && setCancellingAppointment(null)}
        >
          <DialogContent
            className="max-w-md"
            style={{
              backgroundColor: `${LUXE_COLORS.charcoalLight}F2`,
              border: `1px solid ${LUXE_COLORS.gold}30`,
              color: LUXE_COLORS.lightText
            }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: LUXE_COLORS.gold }}>Cancel Appointment</DialogTitle>
              <DialogDescription style={{ color: LUXE_COLORS.bronze }}>
                Please provide a reason for cancelling this appointment
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <textarea
                value={cancellationReason}
                onChange={e => setCancellationReason(e.target.value)}
                placeholder="Enter cancellation reason..."
                rows={3}
                className="w-full rounded-lg px-4 py-3 resize-none focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCancellingAppointment(null)
                    setCancellationReason('')
                  }}
                  style={{
                    borderColor: `${LUXE_COLORS.bronze}50`,
                    color: LUXE_COLORS.bronze
                  }}
                >
                  Keep Appointment
                </Button>
                <Button
                  onClick={handleCancelWithReason}
                  disabled={!cancellationReason.trim()}
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.ruby} 0%, ${LUXE_COLORS.rubyDark} 100%)`,
                    color: 'white',
                    opacity: cancellationReason.trim() ? 1 : 0.5
                  }}
                >
                  Cancel Appointment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
