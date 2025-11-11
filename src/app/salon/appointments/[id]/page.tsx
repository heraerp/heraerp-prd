'use client';

// ================================================================================
// VIEW APPOINTMENT PAGE
// Smart Code: HERA.PAGES.SALON.APPOINTMENTS.VIEW.V1
// POS-style appointment viewing page with service details
// ================================================================================

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays } from 'date-fns'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { universalApi } from '@/lib/universal-api-v2'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
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
  CalendarClock,
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Luxury color palette with spring animations
const LUXE_COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#5A2A40',
  rose: '#E8B4B8',
  // Animation curves
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  ease: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)'
}

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

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> =
  {
    DRAFT: {
      label: 'Draft',
      color: LUXE_COLORS.bronze,
      bgColor: `${LUXE_COLORS.bronze}20`,
      icon: AlertCircle
    },
    BOOKED: {
      label: 'Booked',
      color: LUXE_COLORS.gold,
      bgColor: `${LUXE_COLORS.gold}20`,
      icon: Calendar
    },
    CONFIRMED: {
      label: 'Confirmed',
      color: LUXE_COLORS.gold,
      bgColor: `${LUXE_COLORS.gold}20`,
      icon: CheckCircle
    },
    CHECKED_IN: {
      label: 'Checked In',
      color: LUXE_COLORS.emerald,
      bgColor: `${LUXE_COLORS.emerald}20`,
      icon: User
    },
    IN_SERVICE: {
      label: 'In Service',
      color: LUXE_COLORS.plum,
      bgColor: `${LUXE_COLORS.plum}20`,
      icon: Clock
    },
    COMPLETED: {
      label: 'Completed',
      color: LUXE_COLORS.emerald,
      bgColor: `${LUXE_COLORS.emerald}20`,
      icon: CheckCircle
    },
    CANCELLED: {
      label: 'Cancelled',
      color: LUXE_COLORS.rose,
      bgColor: `${LUXE_COLORS.rose}20`,
      icon: XCircle
    },
    NO_SHOW: {
      label: 'No Show',
      color: LUXE_COLORS.bronze,
      bgColor: `${LUXE_COLORS.bronze}20`,
      icon: XCircle
    }
  }

// Helper function to convert minutes to "Xh Ymin" format
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours}h`
  }
  return `${hours}h ${mins}min`
}

export default function ViewAppointmentPage({ params }: PageProps) {
  const router = useRouter()
  const { organization } = useHERAAuth()

  // Get organization ID from localStorage for demo mode
  const [localOrgId, setLocalOrgId] = useState<string | null>(null)

  // Get effective organization ID with security priority
  const getEffectiveOrgId = () => {
    // PRIORITY 1: Always use authenticated JWT organization (multi-tenant security)
    if (organization?.id) {
      return organization.id
    }

    // PRIORITY 2: LocalStorage only for demo/unauthenticated mode
    if (localOrgId) {
      return localOrgId
    }

    // PRIORITY 3: Subdomain detection as final fallback
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

    return null
  }

  const organizationId = getEffectiveOrgId()

  // Unwrap params Promise for Next.js 15
  const unwrappedParams = use(params)

  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null)
  const [transactionLines, setTransactionLines] = useState<TransactionLine[]>([])
  const [customer, setCustomer] = useState<any>(null)
  const [stylist, setStylist] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // Dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [postponeDialogOpen, setPostponeDialogOpen] = useState(false)
  const [postponeDays, setPostponeDays] = useState('1')
  const [postponeTime, setPostponeTime] = useState('')

  // Load localStorage org ID
  useEffect(() => {
    const storedOrgId = localStorage.getItem('organizationId')
    if (storedOrgId) {
      setLocalOrgId(storedOrgId)
    }
  }, [])

  // Load appointment details
  useEffect(() => {
    const orgId = organizationId || localOrgId
    if (!orgId || !unwrappedParams.id) return

    const loadAppointmentDetails = async () => {
      try {
        setLoading(true)

        // Set organization ID on universalApi
        universalApi.setOrganizationId(orgId)

        // Load appointment - Universal API filters by organization automatically
        const appointmentResponse = await universalApi.read('universal_transactions', {
          id: unwrappedParams.id
        })

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
  }, [organizationId, localOrgId, unwrappedParams.id])

  const handleCancelAppointment = async () => {
    setProcessing(true)

    try {
      // Update the appointment status to cancelled
      const updateData = {
        metadata: {
          ...appointment?.metadata,
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: 'user',
          cancellation_reason: cancelReason || undefined
        }
      }

      const response = await universalApi.updateTransaction(unwrappedParams.id, updateData)
      if (response.success) {
        // Show success message with animation
        const successDiv = document.createElement('div')
        successDiv.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, ${LUXE_COLORS.emerald}, ${LUXE_COLORS.gold});
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          z-index: 9999;
          font-weight: 500;
          animation: slideIn 0.4s ${LUXE_COLORS.spring};
        `
        successDiv.textContent = '✓ Appointment cancelled successfully'
        document.body.appendChild(successDiv)

        setTimeout(() => {
          successDiv.style.animation = `slideOut 0.3s ${LUXE_COLORS.ease}`
          setTimeout(() => successDiv.remove(), 300)
        }, 2000)

        // Redirect after short delay
        setTimeout(() => router.push('/salon/appointments'), 1000)
      }
    } catch (error) {
      console.error('Error:', 'Failed to cancel appointment')
    } finally {
      setProcessing(false)
      setCancelDialogOpen(false)
    }
  }

  const handlePostponeAppointment = async () => {
    setProcessing(true)

    try {
      const currentDate = appointment?.metadata?.appointment_date
        ? new Date(appointment.metadata.appointment_date)
        : new Date(appointment?.transaction_date || new Date())

      // Calculate new date
      const newDate = addDays(currentDate, parseInt(postponeDays))
      const newTime = postponeTime || appointment?.metadata?.appointment_time || '09:00'

      // Update the appointment with new date/time
      const updateData = {
        metadata: {
          ...appointment?.metadata,
          appointment_date: format(newDate, 'yyyy-MM-dd'),
          appointment_time: newTime,
          postponed_at: new Date().toISOString(),
          postponed_by: 'user',
          original_date: appointment?.metadata?.appointment_date,
          original_time: appointment?.metadata?.appointment_time
        }
      }

      const response = await universalApi.updateTransaction(unwrappedParams.id, updateData)
      if (response.success) {
        // Show success message with animation
        const successDiv = document.createElement('div')
        successDiv.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, ${LUXE_COLORS.emerald}, ${LUXE_COLORS.gold});
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          z-index: 9999;
          font-weight: 500;
          animation: slideIn 0.4s ${LUXE_COLORS.spring};
        `
        successDiv.textContent = `✓ Appointment rescheduled to ${format(newDate, 'MMM d')} at ${newTime}`
        document.body.appendChild(successDiv)

        setTimeout(() => {
          successDiv.style.animation = `slideOut 0.3s ${LUXE_COLORS.ease}`
          setTimeout(() => successDiv.remove(), 300)
        }, 3000)

        // Reload appointment data
        window.location.reload()
      }
    } catch (error) {
      console.error('Error:', 'Failed to postpone appointment')
    } finally {
      setProcessing(false)
      setPostponeDialogOpen(false)
    }
  }

  const getStatusBadge = (status: string = 'DRAFT') => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT
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

  const effectiveOrgId = organizationId || localOrgId

  if (!effectiveOrgId) {
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
      <div
        className="min-h-screen"
        style={{
          background: `linear-gradient(135deg, ${LUXE_COLORS.black} 0%, ${LUXE_COLORS.charcoal} 100%)`
        }}
      >
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div
                className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4"
                style={{ borderColor: LUXE_COLORS.gold }}
              ></div>
              <p style={{ color: LUXE_COLORS.bronze }}>Loading appointment details...</p>
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
    <>
      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `}</style>

      <div
        className="min-h-screen"
        style={{
          background: `linear-gradient(135deg, ${LUXE_COLORS.black} 0%, ${LUXE_COLORS.charcoal} 100%)`
        }}
      >
        {/* Header */}
        <div
          className="border-b"
          style={{
            backgroundColor: `${LUXE_COLORS.charcoal}CC`,
            borderColor: `${LUXE_COLORS.gold}40`
          }}
        >
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/salon/appointments')}
                  className="hover:opacity-80 transition-all"
                  style={{
                    color: LUXE_COLORS.champagne,
                    transition: `all 0.3s ${LUXE_COLORS.spring}`
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateX(-4px) scale(1.1)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateX(0) scale(1)'
                  }}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`
                    }}
                  >
                    <Calendar className="w-5 h-5" style={{ color: LUXE_COLORS.black }} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold" style={{ color: LUXE_COLORS.champagne }}>
                      Appointment Details
                    </h1>
                    <p className="text-sm" style={{ color: LUXE_COLORS.gold }}>
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
                  className="gap-2 hover:opacity-80 transition-all"
                  style={{
                    backgroundColor: LUXE_COLORS.black,
                    borderColor: LUXE_COLORS.bronze,
                    color: LUXE_COLORS.champagne,
                    transition: `all 0.3s ${LUXE_COLORS.spring}`
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 8px 16px ${LUXE_COLORS.gold}40`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPostponeDialogOpen(true)}
                  disabled={status === 'CANCELLED' || status === 'COMPLETED'}
                  className="gap-2 hover:opacity-80 transition-all"
                  style={{
                    backgroundColor: LUXE_COLORS.black,
                    borderColor: LUXE_COLORS.gold,
                    color: LUXE_COLORS.gold,
                    transition: `all 0.3s ${LUXE_COLORS.spring}`
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 8px 16px ${LUXE_COLORS.gold}40`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <CalendarClock className="w-4 h-4" />
                  Postpone
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCancelDialogOpen(true)}
                  disabled={status === 'CANCELLED' || status === 'COMPLETED'}
                  className="gap-2 hover:opacity-80 transition-all"
                  style={{
                    backgroundColor: LUXE_COLORS.black,
                    borderColor: LUXE_COLORS.rose,
                    color: LUXE_COLORS.rose,
                    transition: `all 0.3s ${LUXE_COLORS.spring}`
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 8px 16px ${LUXE_COLORS.rose}40`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Customer & Stylist Details */}
            <div className="space-y-4">
              <Card
                className="p-4 backdrop-blur shadow-lg border transition-all hover:shadow-xl"
                style={{
                  backgroundColor: LUXE_COLORS.charcoal,
                  borderColor: `${LUXE_COLORS.gold}40`,
                  transition: `all 0.4s ${LUXE_COLORS.spring}`
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}80`
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}40`
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <h3
                  className="font-medium mb-3 flex items-center gap-2"
                  style={{ color: LUXE_COLORS.champagne }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`
                    }}
                  >
                    <User className="w-4 h-4" style={{ color: LUXE_COLORS.black }} />
                  </div>
                  Customer Details
                </h3>
                {customer ? (
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-lg" style={{ color: LUXE_COLORS.champagne }}>
                        {customer.entity_name}
                      </p>
                    </div>

                    {customer.metadata?.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4" style={{ color: LUXE_COLORS.gold }} />
                        <span style={{ color: LUXE_COLORS.champagne }}>
                          {customer.metadata.phone}
                        </span>
                      </div>
                    )}

                    {customer.metadata?.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4" style={{ color: LUXE_COLORS.gold }} />
                        <span style={{ color: LUXE_COLORS.champagne }}>
                          {customer.metadata.email}
                        </span>
                      </div>
                    )}

                    {customer.metadata?.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 mt-0.5" style={{ color: LUXE_COLORS.gold }} />
                        <span style={{ color: LUXE_COLORS.champagne }}>
                          {customer.metadata.address}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ color: LUXE_COLORS.bronze }}>No customer information available</p>
                )}
              </Card>

              <Card
                className="p-4 backdrop-blur shadow-lg border transition-all hover:shadow-xl"
                style={{
                  backgroundColor: LUXE_COLORS.charcoal,
                  borderColor: `${LUXE_COLORS.gold}40`,
                  transition: `all 0.4s ${LUXE_COLORS.spring}`
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}80`
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}40`
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <h3
                  className="font-medium mb-3 flex items-center gap-2"
                  style={{ color: LUXE_COLORS.champagne }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${LUXE_COLORS.plum} 0%, ${LUXE_COLORS.rose} 100%)`
                    }}
                  >
                    <User className="w-4 h-4" style={{ color: 'white' }} />
                  </div>
                  Stylist Details
                </h3>
                {stylist ? (
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-lg" style={{ color: LUXE_COLORS.champagne }}>
                        {stylist.entity_name}
                      </p>
                    </div>

                    {stylist.metadata?.specialties && stylist.metadata.specialties.length > 0 && (
                      <div>
                        <p className="text-sm mb-1" style={{ color: LUXE_COLORS.bronze }}>
                          Specialties:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {stylist.metadata.specialties.map((specialty: string, index: number) => (
                            <Badge
                              key={index}
                              className="text-xs border"
                              style={{
                                backgroundColor: `${LUXE_COLORS.plum}20`,
                                borderColor: LUXE_COLORS.plum,
                                color: LUXE_COLORS.champagne
                              }}
                            >
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {stylist.metadata?.hourly_rate && (
                      <div className="text-sm">
                        <span style={{ color: LUXE_COLORS.bronze }}>Hourly Rate: </span>
                        <span className="font-medium" style={{ color: LUXE_COLORS.gold }}>
                          AED {stylist.metadata.hourly_rate}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ color: LUXE_COLORS.bronze }}>No stylist information available</p>
                )}
              </Card>

              <Card
                className="p-4 backdrop-blur shadow-lg border transition-all hover:shadow-xl"
                style={{
                  backgroundColor: LUXE_COLORS.charcoal,
                  borderColor: `${LUXE_COLORS.gold}40`,
                  transition: `all 0.4s ${LUXE_COLORS.spring}`
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}80`
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}40`
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <h3
                  className="font-medium mb-3 flex items-center gap-2"
                  style={{ color: LUXE_COLORS.champagne }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${LUXE_COLORS.emerald} 0%, ${LUXE_COLORS.gold} 100%)`
                    }}
                  >
                    <Calendar className="w-4 h-4" style={{ color: 'white' }} />
                  </div>
                  Appointment Time
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                      Date
                    </p>
                    <p className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                      {format(appointmentDate, 'MMMM d, yyyy')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                      Time
                    </p>
                    <p className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                      {format(appointmentDate, 'h:mm a')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                      Duration
                    </p>
                    <p className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                      {formatDuration(totalDuration)}
                    </p>
                  </div>

                  {appointment.metadata?.notes && (
                    <div>
                      <p className="text-sm mb-1" style={{ color: LUXE_COLORS.bronze }}>
                        Notes
                      </p>
                      <div
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: `${LUXE_COLORS.black}80` }}
                      >
                        <p className="text-sm" style={{ color: LUXE_COLORS.champagne }}>
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
              <Card
                className="p-4 backdrop-blur shadow-lg border transition-all hover:shadow-xl h-fit"
                style={{
                  backgroundColor: LUXE_COLORS.charcoal,
                  borderColor: `${LUXE_COLORS.gold}40`,
                  transition: `all 0.4s ${LUXE_COLORS.spring}`
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}80`
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}40`
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <h3
                  className="font-medium mb-3 flex items-center gap-2"
                  style={{ color: LUXE_COLORS.champagne }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${LUXE_COLORS.emerald} 0%, ${LUXE_COLORS.bronze} 100%)`
                    }}
                  >
                    <Scissors className="w-4 h-4" style={{ color: 'white' }} />
                  </div>
                  Services Booked
                  {transactionLines.length > 0 && (
                    <Badge
                      className="ml-auto border"
                      style={{
                        backgroundColor: `${LUXE_COLORS.gold}20`,
                        borderColor: LUXE_COLORS.gold,
                        color: LUXE_COLORS.champagne
                      }}
                    >
                      {transactionLines.length} item{transactionLines.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </h3>

                {transactionLines.length === 0 ? (
                  <p className="text-center py-8" style={{ color: LUXE_COLORS.bronze }}>
                    No services found
                  </p>
                ) : (
                  <ScrollArea className="h-[600px] pr-2 appointment-scrollbar">
                    <div className="space-y-3">
                      {transactionLines.map(line => (
                        <div
                          key={line.id}
                          className="p-4 border rounded-lg transition-all"
                          style={{
                            backgroundColor: `${LUXE_COLORS.black}80`,
                            borderColor: `${LUXE_COLORS.gold}30`,
                            transition: `all 0.3s ${LUXE_COLORS.spring}`
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}60`
                            e.currentTarget.style.transform = 'translateX(4px)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}30`
                            e.currentTarget.style.transform = 'translateX(0)'
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium" style={{ color: LUXE_COLORS.gold }}>
                                {line.entity?.entity_name || line.description}
                              </p>
                              {line.entity && (
                                <div className="flex items-center gap-3 text-sm mt-1">
                                  <span className="flex items-center gap-1">
                                    <Clock
                                      className="w-3 h-3"
                                      style={{ color: LUXE_COLORS.bronze }}
                                    />
                                    <span style={{ color: LUXE_COLORS.champagne }}>
                                      {formatDuration(
                                        line.entity.metadata?.duration_minutes ||
                                          line.line_data?.duration_minutes ||
                                          30
                                      )}
                                    </span>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <DollarSign
                                      className="w-3 h-3"
                                      style={{ color: LUXE_COLORS.gold }}
                                    />
                                    <span style={{ color: LUXE_COLORS.gold }}>
                                      AED {line.unit_amount.toFixed(2)}
                                    </span>
                                  </span>
                                </div>
                              )}
                            </div>
                            <Badge
                              className="ml-2 border"
                              style={{
                                backgroundColor: `${LUXE_COLORS.bronze}20`,
                                borderColor: LUXE_COLORS.bronze,
                                color: LUXE_COLORS.champagne
                              }}
                            >
                              {line.line_type}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span style={{ color: LUXE_COLORS.bronze }}>
                              Quantity: {line.quantity}
                            </span>
                            <span className="font-medium" style={{ color: LUXE_COLORS.gold }}>
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
              <Card
                className="p-4 backdrop-blur shadow-lg border-2 transition-all hover:shadow-xl"
                style={{
                  backgroundColor: LUXE_COLORS.charcoal,
                  borderColor: LUXE_COLORS.gold,
                  background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal} 0%, ${LUXE_COLORS.black} 100%)`,
                  transition: `all 0.4s ${LUXE_COLORS.spring}`
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = `0 16px 32px ${LUXE_COLORS.gold}40`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <h3
                  className="font-medium mb-3 flex items-center gap-2"
                  style={{ color: LUXE_COLORS.champagne }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`
                    }}
                  >
                    <DollarSign className="w-4 h-4" style={{ color: LUXE_COLORS.black }} />
                  </div>
                  Appointment Summary
                </h3>
                <div className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: LUXE_COLORS.bronze }}>Status:</span>
                      <span>{getStatusBadge(status)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span style={{ color: LUXE_COLORS.bronze }}>Booking Code:</span>
                      <span className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                        #{appointment.transaction_code}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span style={{ color: LUXE_COLORS.bronze }}>Items:</span>
                      <span className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                        {transactionLines.length} service{transactionLines.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span style={{ color: LUXE_COLORS.bronze }}>Total Duration:</span>
                      <span className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                        {formatDuration(totalDuration)}
                      </span>
                    </div>

                    <div className="pt-2 border-t" style={{ borderColor: `${LUXE_COLORS.gold}40` }}>
                      <div className="flex justify-between text-lg font-semibold">
                        <span style={{ color: LUXE_COLORS.champagne }}>Total Amount:</span>
                        <span style={{ color: LUXE_COLORS.gold }}>
                          AED {appointment.total_amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {appointment.metadata?.created_at && (
                    <div className="pt-2 border-t" style={{ borderColor: `${LUXE_COLORS.gold}40` }}>
                      <p className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                        Created on{' '}
                        {format(new Date(appointment.metadata.created_at), 'MMM d, yyyy at h:mm a')}
                      </p>
                    </div>
                  )}

                  {status === 'CANCELLED' && (
                    <div
                      className="mt-3 p-3 rounded-lg border"
                      style={{
                        backgroundColor: `${LUXE_COLORS.rose}20`,
                        borderColor: LUXE_COLORS.rose
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 mt-0.5" style={{ color: LUXE_COLORS.rose }} />
                        <div className="text-sm">
                          <p className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                            This appointment has been cancelled
                          </p>
                          {appointment.metadata?.cancelled_at && (
                            <p className="text-xs mt-1" style={{ color: LUXE_COLORS.rose }}>
                              Cancelled on{' '}
                              {format(
                                new Date(appointment.metadata.cancelled_at),
                                'MMM d, yyyy at h:mm a'
                              )}
                            </p>
                          )}
                          {appointment.metadata?.cancellation_reason && (
                            <p className="text-xs mt-1" style={{ color: LUXE_COLORS.champagne }}>
                              Reason: {appointment.metadata.cancellation_reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card
                className="p-4 backdrop-blur shadow-lg border transition-all hover:shadow-xl"
                style={{
                  backgroundColor: LUXE_COLORS.charcoal,
                  borderColor: `${LUXE_COLORS.gold}40`,
                  transition: `all 0.4s ${LUXE_COLORS.spring}`
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}80`
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}40`
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <h3
                  className="font-medium mb-3 flex items-center gap-2"
                  style={{ color: LUXE_COLORS.champagne }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${LUXE_COLORS.bronze} 0%, ${LUXE_COLORS.gold} 100%)`
                    }}
                  >
                    <FileText className="w-4 h-4" style={{ color: 'white' }} />
                  </div>
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Button
                    className="w-full justify-start hover:opacity-80 transition-all"
                    variant="outline"
                    style={{
                      backgroundColor: LUXE_COLORS.black,
                      borderColor: LUXE_COLORS.bronze,
                      color: LUXE_COLORS.champagne,
                      transition: `all 0.3s ${LUXE_COLORS.spring}`
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                    onClick={() => router.push(`/salon/appointments/${unwrappedParams.id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Appointment
                  </Button>

                  <Button
                    className="w-full justify-start hover:opacity-80 transition-all"
                    variant="outline"
                    style={{
                      backgroundColor: LUXE_COLORS.black,
                      borderColor: LUXE_COLORS.gold,
                      color: LUXE_COLORS.gold,
                      transition: `all 0.3s ${LUXE_COLORS.spring}`
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                    onClick={() => setPostponeDialogOpen(true)}
                    disabled={status === 'CANCELLED' || status === 'COMPLETED'}
                  >
                    <CalendarClock className="w-4 h-4 mr-2" />
                    Postpone Appointment
                  </Button>

                  <Button
                    className="w-full justify-start hover:opacity-80 transition-all"
                    variant="outline"
                    style={{
                      backgroundColor: LUXE_COLORS.black,
                      borderColor: LUXE_COLORS.bronze,
                      color: LUXE_COLORS.champagne,
                      transition: `all 0.3s ${LUXE_COLORS.spring}`
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                    onClick={() => window.print()}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Print Details
                  </Button>

                  <Button
                    className="w-full justify-start hover:opacity-80 transition-all"
                    variant="outline"
                    style={{
                      backgroundColor: LUXE_COLORS.black,
                      borderColor: LUXE_COLORS.rose,
                      color: LUXE_COLORS.rose,
                      transition: `all 0.3s ${LUXE_COLORS.spring}`
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                    onClick={() => setCancelDialogOpen(true)}
                    disabled={status === 'CANCELLED' || status === 'COMPLETED'}
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

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent
          className="sm:max-w-md"
          style={{
            backgroundColor: LUXE_COLORS.charcoal,
            borderColor: LUXE_COLORS.rose,
            color: LUXE_COLORS.champagne
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: LUXE_COLORS.champagne }}>Cancel Appointment</DialogTitle>
            <DialogDescription style={{ color: LUXE_COLORS.bronze }}>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label
                htmlFor="cancel-reason"
                className="text-sm"
                style={{ color: LUXE_COLORS.champagne }}
              >
                Cancellation Reason (Optional)
              </Label>
              <Textarea
                id="cancel-reason"
                placeholder="Enter reason for cancellation..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                rows={3}
                className="mt-1"
                style={{
                  backgroundColor: LUXE_COLORS.black,
                  borderColor: `${LUXE_COLORS.gold}40`,
                  color: LUXE_COLORS.champagne
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={processing}
              style={{
                backgroundColor: LUXE_COLORS.black,
                borderColor: LUXE_COLORS.bronze,
                color: LUXE_COLORS.champagne
              }}
            >
              Keep Appointment
            </Button>
            <Button
              onClick={handleCancelAppointment}
              disabled={processing}
              style={{
                backgroundColor: LUXE_COLORS.rose,
                color: 'white'
              }}
            >
              {processing ? 'Cancelling...' : 'Cancel Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Postpone Dialog */}
      <Dialog open={postponeDialogOpen} onOpenChange={setPostponeDialogOpen}>
        <DialogContent
          className="sm:max-w-md"
          style={{
            backgroundColor: LUXE_COLORS.charcoal,
            borderColor: LUXE_COLORS.gold,
            color: LUXE_COLORS.champagne
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: LUXE_COLORS.champagne }}>Postpone Appointment</DialogTitle>
            <DialogDescription style={{ color: LUXE_COLORS.bronze }}>
              Select a new date and time for the appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label
                htmlFor="postpone-days"
                className="text-sm"
                style={{ color: LUXE_COLORS.champagne }}
              >
                Postpone by
              </Label>
              <Select value={postponeDays} onValueChange={setPostponeDays}>
                <SelectTrigger
                  id="postpone-days"
                  className="mt-1"
                  style={{
                    backgroundColor: LUXE_COLORS.black,
                    borderColor: `${LUXE_COLORS.gold}40`,
                    color: LUXE_COLORS.champagne
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="2">2 days</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">1 week</SelectItem>
                  <SelectItem value="14">2 weeks</SelectItem>
                  <SelectItem value="30">1 month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                htmlFor="postpone-time"
                className="text-sm"
                style={{ color: LUXE_COLORS.champagne }}
              >
                New Time (Optional)
              </Label>
              <input
                id="postpone-time"
                type="time"
                value={postponeTime}
                onChange={e => setPostponeTime(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-md"
                style={{
                  backgroundColor: LUXE_COLORS.black,
                  borderColor: `${LUXE_COLORS.gold}40`,
                  border: '1px solid',
                  color: LUXE_COLORS.champagne
                }}
              />
              <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
                Leave empty to keep the original time
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setPostponeDialogOpen(false)}
              disabled={processing}
              style={{
                backgroundColor: LUXE_COLORS.black,
                borderColor: LUXE_COLORS.bronze,
                color: LUXE_COLORS.champagne
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePostponeAppointment}
              disabled={processing}
              style={{
                backgroundColor: LUXE_COLORS.gold,
                color: LUXE_COLORS.black
              }}
            >
              {processing ? 'Postponing...' : 'Confirm Postpone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
