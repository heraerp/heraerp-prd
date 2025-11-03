// ================================================================================
// HERA APPOINTMENT ACTIVITY PAGE
// Smart Code: HERA.PAGES.APPOINTMENTS.ACTIVITY.V1
// Activity timeline for appointment history
// ================================================================================



import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth/session'
import { apiClient } from '@/lib/auth/session'
import { createAppointmentsApi } from '@/lib/api/appointments'
import { useAppointment, useAppointmentActivity } from '@/lib/hooks/useAppointment'
import { AppointmentTimeline } from '@/components/appointments/AppointmentTimeline'
import { AppointmentStatusBadge } from '@/components/appointments/AppointmentStatusBadge'
import { ButtonPrimary } from '@/components/ui/ButtonPrimary'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

export default function AppointmentActivityPage() {
  const router = useRouter()
  const params = useParams()
  const appointmentId = params.id as string
  const { organizationId } = useAuth()
  const appointmentsApi = createAppointmentsApi(apiClient)

  const { appointment, isLoading: appointmentLoading } = useAppointment(
    appointmentId,
    appointmentsApi
  )
  const { data: activity, isLoading: activityLoading } = useAppointmentActivity(
    appointmentId,
    appointmentsApi
  )

  const handleBack = () => {
    router.push(`/appointments/${appointmentId}`)
  }

  if (appointmentLoading || activityLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!appointment) {
    return (
      <Card className="text-center p-8">
        <p className="text-red-600 mb-4">Appointment not found</p>
        <ButtonPrimary onClick={() => router.push('/appointments/calendar')}>
          Back to Calendar
        </ButtonPrimary>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <ButtonPrimary
          onClick={handleBack}
          variant="outline"
          size="sm"
          icon={<ChevronLeft className="w-4 h-4" />}
        >
          Back to Details
        </ButtonPrimary>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Appointment Activity</h1>
            <AppointmentStatusBadge status={appointment.status} />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {appointment.code} - {appointment.customer.name}
          </p>
        </div>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader
          title="Activity Timeline"
          subtitle="Complete history of appointment events and status changes"
        />
        <CardContent padding="lg">
          <AppointmentTimeline events={activity || []} />
        </CardContent>
      </Card>

      {/* Audit Information */}
      <Card>
        <CardHeader title="Audit Trail" subtitle="System-level tracking for compliance" />
        <CardContent padding="md">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Appointment ID</p>
                <p className="font-mono text-gray-700">{appointment.id}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Organization ID</p>
                <p className="font-mono text-gray-700">{appointment.organization_id}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Smart Code</p>
                <p className="font-mono text-gray-700">{appointment.smart_code}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Current Status</p>
                <p className="font-mono text-gray-700">{appointment.status}</p>
              </div>
            </div>

            {appointment.metadata && Object.keys(appointment.metadata).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-gray-500 mb-2">Metadata</p>
                <pre className="text-xs font-mono text-gray-600 bg-white rounded p-2 overflow-x-auto">
                  {JSON.stringify(appointment.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
