// ================================================================================
// HERA APPOINTMENTS CALENDAR PAGE
// Smart Code: HERA.PAGES.APPOINTMENTS.CALENDAR.v1
// Calendar view of all appointments
// ================================================================================

'use client'

import React from 'react'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/session'
import { apiClient } from '@/lib/auth/session'
import { createAppointmentsApi } from '@/lib/api/appointments'
import { useAppointments } from '@/lib/hooks/useAppointment'
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar'
import { ButtonPrimary } from '@/components/ui/ButtonPrimary'
import { Card } from '@/components/ui/card'
import type { AppointmentFilters } from '@/lib/schemas/appointment'

export default function AppointmentsCalendarPage() {
  const router = useRouter()
  const { organizationId } = useAuth()
  const appointmentsApi = createAppointmentsApi(apiClient)

  // Set up filters for current organization
  const filters: AppointmentFilters = {
    organization_id: organizationId || ''
    // Can add date range filters here if needed
  }

  const { data: appointments, isLoading, error } = useAppointments(filters, appointmentsApi)

  const handleAppointmentClick = (appointment: any) => {
    router.push(`/appointments/${appointment.id}`)
  }

  const handleNewAppointment = () => {
    router.push('/appointments/new')
  }

  if (error) {
    return (
      <Card className="text-center p-8">
        <p className="text-red-600 mb-4">Error loading appointments</p>
        <ButtonPrimary onClick={() => window.location.reload()}>Retry</ButtonPrimary>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments Calendar</h1>
          <p className="text-sm text-gray-600 mt-1">View and manage all salon appointments</p>
        </div>

        <ButtonPrimary onClick={handleNewAppointment} icon={<Plus className="w-4 h-4" />}>
          Book Appointment
        </ButtonPrimary>
      </div>

      {/* Calendar Component */}
      <AppointmentCalendar
        appointments={appointments || []}
        onAppointmentClick={handleAppointmentClick}
        loading={isLoading}
      />

      {/* Quick Stats */}
      {appointments && appointments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card padding="md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Today</p>
              <p className="text-2xl font-bold text-primary">
                {
                  appointments.filter(apt => {
                    const today = new Date()
                    const aptDate = new Date(apt.start_time)
                    return (
                      aptDate.getDate() === today.getDate() &&
                      aptDate.getMonth() === today.getMonth() &&
                      aptDate.getFullYear() === today.getFullYear()
                    )
                  }).length
                }
              </p>
            </div>
          </Card>

          <Card padding="md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-primary">
                {
                  appointments.filter(apt => {
                    const now = new Date()
                    const aptDate = new Date(apt.start_time)
                    const weekStart = new Date(now)
                    weekStart.setDate(now.getDate() - now.getDay())
                    const weekEnd = new Date(weekStart)
                    weekEnd.setDate(weekStart.getDate() + 6)
                    return aptDate >= weekStart && aptDate <= weekEnd
                  }).length
                }
              </p>
            </div>
          </Card>

          <Card padding="md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">
                {appointments.filter(apt => apt.status === 'confirmed').length}
              </p>
            </div>
          </Card>

          <Card padding="md">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-purple-600">
                {appointments.filter(apt => apt.status === 'in_progress').length}
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
