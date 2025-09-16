// ================================================================================
// HERA NEW APPOINTMENT PAGE
// Smart Code: HERA.PAGES.APPOINTMENTS.NEW.v1
// Book new appointment page
// ================================================================================

'use client'

import React from 'react'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/lib/auth/session'
import { apiClient } from '@/src/lib/auth/session'
import { createAppointmentsApi } from '@/src/lib/api/appointments'
import { useCreateAppointment } from '@/src/lib/hooks/useAppointment'
import { AppointmentForm } from '@/src/components/appointments/AppointmentForm'
import { ButtonPrimary } from '@/src/components/ui/ButtonPrimary'
import { Card } from '@/src/components/ui/Card'

export default function NewAppointmentPage() {
  const router = useRouter()
  const { organizationId } = useAuth()
  const appointmentsApi = createAppointmentsApi(apiClient)
  const createAppointment = useCreateAppointment(appointmentsApi)

  const handleSubmit = async (data: any) => {
    await createAppointment.mutateAsync(data)
    // The hook handles navigation to the detail page
  }

  const handleBack = () => {
    router.push('/appointments/calendar')
  }

  if (!organizationId) {
    return (
      <Card className="text-center p-8">
        <p className="text-gray-600">No organization selected</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <ButtonPrimary
          onClick={handleBack}
          variant="outline"
          size="sm"
          icon={<ChevronLeft className="w-4 h-4" />}
        >
          Back to Calendar
        </ButtonPrimary>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Book New Appointment
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Schedule a new appointment for a customer
          </p>
        </div>
      </div>

      {/* Booking Form */}
      <AppointmentForm
        organizationId={organizationId}
        onSubmit={handleSubmit}
        loading={createAppointment.isLoading}
      />
    </div>
  )
}