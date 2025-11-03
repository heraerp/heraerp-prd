// ================================================================================
// HERA APPOINTMENT DETAIL PAGE
// Smart Code: HERA.PAGES.APPOINTMENTS.DETAIL.V1
// Appointment detail view with actions and metadata
// ================================================================================



import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Scissors,
  FileText,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/lib/auth/session'
import { apiClient } from '@/lib/auth/session'
import { createAppointmentsApi } from '@/lib/api/appointments'
import { useAppointment, useAppointmentNavigation } from '@/lib/hooks/useAppointment'
import { AppointmentStatusBadge } from '@/components/appointments/AppointmentStatusBadge'
import { AppointmentActions } from '@/components/appointments/AppointmentActions'
import { ButtonPrimary } from '@/components/ui/ButtonPrimary'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { formatDateTime, formatDuration, formatCurrency } from '@/lib/utils'

export default function AppointmentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const appointmentId = params.id as string
  const { organizationId } = useAuth()
  const appointmentsApi = createAppointmentsApi(apiClient)
  const navigation = useAppointmentNavigation()

  const { appointment, isLoading, error, transition } = useAppointment(
    appointmentId,
    appointmentsApi
  )

  const handleTransition = async (action: any) => {
    await transition.mutateAsync({ action })
  }

  const handleOpenPOS = () => {
    navigation.goToPOS(appointmentId)
  }

  const handleViewActivity = () => {
    navigation.goToActivity(appointmentId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <Card className="text-center p-8">
        <p className="text-red-600 mb-4">
          {error instanceof Error ? error.message : 'Appointment not found'}
        </p>
        <ButtonPrimary onClick={() => router.push('/appointments/calendar')}>
          Back to Calendar
        </ButtonPrimary>
      </Card>
    )
  }

  const totalAmount = appointment.services?.reduce((sum, service) => sum + service.price, 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent padding="lg">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{appointment.code}</h1>
                <AppointmentStatusBadge status={appointment.status} size="lg" />
              </div>
              <p className="text-sm text-muted-foreground font-mono">
                Smart Code: {appointment.smart_code}
              </p>
            </div>

            <ButtonPrimary
              onClick={handleViewActivity}
              variant="outline"
              icon={<FileText className="w-4 h-4" />}
            >
              View Activity
            </ButtonPrimary>
          </div>

          {/* Action Buttons */}
          <AppointmentActions
            appointment={appointment}
            onTransition={handleTransition}
            onOpenPOS={appointment.status === 'service_complete' ? handleOpenPOS : undefined}
            loading={transition.isLoading}
          />
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Stylist */}
          <Card>
            <CardHeader title="Participants" />
            <CardContent padding="md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigation.goToCustomer(appointment.customer.id)}
                  className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-50/50 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="font-medium text-gray-900">{appointment.customer.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{appointment.customer.code}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                </button>

                <button
                  onClick={() => navigation.goToStaff(appointment.stylist.id)}
                  className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-50/50 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-secondary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Stylist</p>
                    <p className="font-medium text-gray-900">{appointment.stylist.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{appointment.stylist.code}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          {appointment.services && appointment.services.length > 0 && (
            <Card>
              <CardHeader title="Services" />
              <CardContent padding="md">
                <div className="space-y-3">
                  {appointment.services.map(service => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-500">{formatDuration(service.duration)}</p>
                      </div>
                      <p className="font-medium text-gray-900">{formatCurrency(service.price)}</p>
                    </div>
                  ))}

                  <div className="pt-3 flex items-center justify-between">
                    <p className="font-semibold text-gray-900">Total</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(totalAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {appointment.notes && (
            <Card>
              <CardHeader title="Notes" />
              <CardContent padding="md">
                <p className="text-gray-700 whitespace-pre-wrap">{appointment.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Time & Location */}
          <Card>
            <CardHeader title="Appointment Details" />
            <CardContent padding="md">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-medium text-gray-900">
                      {formatDateTime(appointment.start_time)}
                    </p>
                    <p className="text-sm text-gray-600">
                      to {formatDateTime(appointment.end_time)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium text-gray-900">
                      {formatDuration(
                        Math.round(
                          (new Date(appointment.end_time).getTime() -
                            new Date(appointment.start_time).getTime()) /
                            60000
                        )
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">{appointment.branch_code}</p>
                    {appointment.chair_slug && (
                      <p className="text-sm text-gray-600">Chair {appointment.chair_slug}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader title="System Information" />
            <CardContent padding="md">
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-mono text-xs text-gray-700">
                    {formatDateTime(appointment.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="font-mono text-xs text-gray-700">
                    {formatDateTime(appointment.updated_at)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Organization ID</p>
                  <p className="font-mono text-xs text-gray-700">{appointment.organization_id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
