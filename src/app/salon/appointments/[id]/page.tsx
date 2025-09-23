// ================================================================================
// VIEW APPOINTMENT PAGE
// Smart Code: HERA.PAGES.SALON.APPOINTMENTS.VIEW.V1
// POS-style appointment viewing page with service details
// ================================================================================

'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { universalApi } from '@/lib/universal-api-v2'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
// import { useToast } from '@/components/ui/use-toast' // Removed for runtime compatibility
import {
  Calendar,
  Clock,
  User,
  DollarSign,
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  FileText,
  Scissors,
  ShoppingBag
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

interface AppointmentDetails {
  id: string
  transaction_date: string
  transaction_code: string
  total_amount: number
  metadata?: any
  source_entity?: any // Customer
  target_entity?: any // Stylist
  status?: string
}

interface TransactionLine {
  id: string
  line_number: number
  entity_id: string
  line_type: string
  description: string
  quantity: number
  unit_amount: number
  line_amount: number
  line_data?: any
  entity?: any // The service/product entity
}

const STATUS_CONFIG = {
  DRAFT: {
    label: 'Draft',
    color:
      'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
    icon: AlertCircle
  },
  BOOKED: {
    label: 'Booked',
    color:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    icon: Calendar
  },
  CONFIRMED: {
    label: 'Confirmed',
    color:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    icon: CheckCircle
  },
  CHECKED_IN: {
    label: 'Checked In',
    color:
      'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700',
    icon: User
  },
  IN_SERVICE: {
    label: 'In Service',
    color:
      'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
    icon: Clock
  },
  COMPLETED: {
    label: 'Completed',
    color:
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    icon: CheckCircle
  },
  CANCELLED: {
    label: 'Cancelled',
    color:
      'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
    icon: XCircle
  },
  NO_SHOW: {
    label: 'No Show',
    color:
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
    icon: XCircle
  }
}

export default function ViewAppointmentPage({ params }: PageProps) {
  const router = useRouter()
  const { organization } = useHERAAuth()

  // Check for Hair Talkz subdomain
  const getEffectiveOrgId = () => {
    if (organization?.id) return organization.id

    // Check if we're on hairtalkz or heratalkz subdomain
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      if (
        hostname.startsWith('hairtalkz.') ||
        hostname === 'hairtalkz.localhost' ||
        hostname.startsWith('heratalkz.') ||
        hostname === 'heratalkz.localhost'
      ) {
        return '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // Hair Talkz org ID
      }
    }

    return organization?.id
  }

  const organizationId = getEffectiveOrgId()
  // const { toast } = useToast() // Removed for runtime compatibility

  // Unwrap params Promise for Next.js 15
  const unwrappedParams = use(params)

  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null)
  const [transactionLines, setTransactionLines] = useState<TransactionLine[]>([])
  const [customer, setCustomer] = useState<any>(null)
  const [stylist, setStylist] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  // Load appointment details
  useEffect(() => {
    if (!organizationId || !unwrappedParams.id) return

    const loadAppointmentDetails = async () => {
      try {
        setLoading(true)

        // Set organization ID on universalApi
        universalApi.setOrganizationId(organizationId)

        console.log('📊 Loading appointment details for:', unwrappedParams.id)

        // Load appointment - Universal API filters by organization automatically
        const appointmentResponse = await universalApi.read('universal_transactions', {
          id: unwrappedParams.id
        })

        console.log('📅 Appointment response:', appointmentResponse)

        if (appointmentResponse.success && appointmentResponse.data?.length > 0) {
          const apt = appointmentResponse.data[0]
          setAppointment(apt)

          // Load customer details if available
          if (apt.source_entity_id) {
            const customerResponse = await universalApi.read('core_entities', {
              id: apt.source_entity_id
            })
            if (customerResponse.success && customerResponse.data?.length > 0) {
              setCustomer(customerResponse.data[0])
            }
          }

          // Load stylist details if available
          if (apt.target_entity_id) {
            const stylistResponse = await universalApi.read('core_entities', {
              id: apt.target_entity_id
            })
            if (stylistResponse.success && stylistResponse.data?.length > 0) {
              setStylist(stylistResponse.data[0])
            }
          }

          // Load transaction lines
          const linesResponse = await universalApi.read('universal_transaction_lines', {
            transaction_id: unwrappedParams.id
          })

          console.log('📝 Transaction lines response:', linesResponse)

          if (linesResponse.success && linesResponse.data) {
            // Load service/product details for each line
            const linesWithDetails = await Promise.all(
              linesResponse.data.map(async (line: any) => {
                if (line.entity_id || line.line_entity_id) {
                  const entityId = line.entity_id || line.line_entity_id
                  const entityResponse = await universalApi.read('core_entities', {
                    id: entityId
                  })
                  if (entityResponse.success && entityResponse.data?.length > 0) {
                    return { ...line, entity: entityResponse.data[0] }
                  }
                }
                return line
              })
            )

            setTransactionLines(linesWithDetails)
          }
        } else {
          console.error('Error:', 'Appointment not found')
          router.push('/salon/appointments')
        }
      } catch (error) {
        console.error('Error loading appointment details:', error)
        console.error('Error:', 'Failed to load appointment details')
      } finally {
        setLoading(false)
      }
    }

    loadAppointmentDetails()
  }, [organizationId, unwrappedParams.id])

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return

    setDeleting(true)

    try {
      // Update the appointment status to cancelled
      const updateData = {
        metadata: {
          ...appointment.metadata,
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: 'user'
        }
      }

      const response = await universalApi.updateTransaction(unwrappedParams.id, updateData)
      if (response.success) {
        console.log('Success:', 'Appointment cancelled successfully')
        router.push('/salon/appointments')
      }
    } catch (error) {
      console.error('Error:', 'Failed to cancel appointment')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: string = 'DRAFT') => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT
    const Icon = config.icon
    return (
      <Badge className={cn('gap-1', config.color)}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  if (!organizationId) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              No Organization Selected
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Please select an organization to view appointments
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading appointment details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Appointment Not Found
              </h2>
              <Button className="mt-4" onClick={() => router.push('/salon/appointments')}>
                Back to Appointments
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const appointmentDate =
    appointment.metadata?.appointment_date && appointment.metadata?.appointment_time
      ? new Date(
          `${appointment.metadata.appointment_date}T${appointment.metadata.appointment_time}`
        )
      : new Date(appointment.transaction_date)
  const status = appointment.metadata?.status?.toUpperCase() || 'DRAFT'
  const totalDuration =
    appointment.metadata?.duration || appointment.metadata?.total_service_duration_minutes || 60

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-950/20 dark:to-pink-950/20 border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/salon/appointments')}
                className="hover:bg-violet-100 dark:hover:bg-violet-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 flex items-center justify-center shadow-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Appointment Details
                  </h1>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    #{appointment.transaction_code}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {getStatusBadge(status)}
              <Button
                variant="outline"
                onClick={() => router.push(`/salon/appointments/${unwrappedParams.id}/edit`)}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={deleting || status === 'CANCELLED' || status === 'COMPLETED'}
                className="gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <XCircle className="w-4 h-4" />
                Cancel Appointment
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer & Stylist Details */}
          <div className="space-y-4">
            <Card className="p-4 border-2 hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
              <h3 className="font-medium mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                  <User className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                Customer Details
              </h3>
              {customer ? (
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-lg">
                      {customer.entity_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Customer Code: {customer.entity_code}
                    </p>
                  </div>

                  {customer.metadata?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {customer.metadata.phone}
                      </span>
                    </div>
                  )}

                  {customer.metadata?.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {customer.metadata.email}
                      </span>
                    </div>
                  )}

                  {customer.metadata?.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {customer.metadata.address}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No customer information available</p>
              )}
            </Card>

            <Card className="p-4 border-2 hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
              <h3 className="font-medium mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                  <User className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                </div>
                Stylist Details
              </h3>
              {stylist ? (
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-lg">
                      {stylist.entity_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Employee Code: {stylist.entity_code}
                    </p>
                  </div>

                  {stylist.metadata?.specialties && stylist.metadata.specialties.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Specialties:</p>
                      <div className="flex flex-wrap gap-1">
                        {stylist.metadata.specialties.map((specialty: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {stylist.metadata?.hourly_rate && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Hourly Rate: </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        AED {stylist.metadata.hourly_rate}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No stylist information available</p>
              )}
            </Card>

            <Card className="p-4 border-2 hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
              <h3 className="font-medium mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                Appointment Time
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {format(appointmentDate, 'MMMM d, yyyy')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {format(appointmentDate, 'h:mm a')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {totalDuration} minutes
                  </p>
                </div>

                {appointment.metadata?.notes && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Notes</p>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {appointment.metadata.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Center Column - Services */}
          <div className="space-y-4">
            <Card className="p-4 border-2 hover:border-violet-200 dark:hover:border-violet-800 transition-colors h-fit">
              <h3 className="font-medium mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                  <Scissors className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                Services Booked
                {transactionLines.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {transactionLines.length} item{transactionLines.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </h3>

              {transactionLines.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 dark:text-gray-400">
                  No services found
                </p>
              ) : (
                <ScrollArea className="h-[600px] pr-2 appointment-scrollbar">
                  <div className="space-y-3">
                    {transactionLines.map(line => (
                      <div key={line.id} className="p-4 border rounded-lg bg-card">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-amber-600 dark:text-amber-400">
                              {line.entity?.entity_name || line.description}
                            </p>
                            {line.entity && (
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                  <span className="dark:text-gray-400">
                                    {line.entity.metadata?.duration_minutes ||
                                      line.line_data?.duration_minutes ||
                                      30}{' '}
                                    min
                                  </span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                                  <span className="dark:text-amber-400">
                                    AED {line.unit_amount.toFixed(2)}
                                  </span>
                                </span>
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {line.line_type}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-amber-600 dark:text-amber-400">
                            Quantity: {line.quantity}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            Total: AED {line.line_amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-4">
            <Card className="p-4 border-2 border-violet-400 dark:border-violet-600 bg-violet-50 dark:bg-violet-950/30">
              <h3 className="font-medium mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                Appointment Summary
              </h3>
              <div className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span>{getStatusBadge(status)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Booking Code:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      #{appointment.transaction_code}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Items:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {transactionLines.length} service{transactionLines.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Duration:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {totalDuration} minutes
                    </span>
                  </div>

                  <div className="pt-2 border-t dark:border-gray-600">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-gray-900 dark:text-gray-100">Total Amount:</span>
                      <span className="text-amber-600 dark:text-amber-400">
                        AED {appointment.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {appointment.metadata?.created_at && (
                  <div className="pt-2 border-t dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Created on{' '}
                      {format(new Date(appointment.metadata.created_at), 'MMM d, yyyy at h:mm a')}
                    </p>
                  </div>
                )}

                {status === 'CANCELLED' && (
                  <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-red-700 dark:text-red-300">
                          This appointment has been cancelled
                        </p>
                        {appointment.metadata?.cancelled_at && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Cancelled on{' '}
                            {format(
                              new Date(appointment.metadata.cancelled_at),
                              'MMM d, yyyy at h:mm a'
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4 border-2 hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
              <h3 className="font-medium mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push(`/salon/appointments/${unwrappedParams.id}/edit`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Appointment
                </Button>

                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    // TODO: Implement duplicate functionality
                    console.log(
                      'Coming Soon:',
                      'Duplicate appointment feature will be available soon'
                    )
                  }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Duplicate Appointment
                </Button>

                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    // TODO: Implement print functionality
                    window.print()
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Print Details
                </Button>

                <Button
                  className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={deleting || status === 'CANCELLED' || status === 'COMPLETED'}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Appointment
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
