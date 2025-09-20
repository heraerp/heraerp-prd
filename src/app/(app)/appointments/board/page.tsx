// ================================================================================
// HERA APPOINTMENT BOARD PAGE
// Smart Code: HERA.PAGES.APPOINTMENTS.BOARD.v1
// Kanban-style pipeline view of appointments
// ================================================================================

'use client'

import React, { useState } from 'react'
import { Plus, Clock, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/session'
import { apiClient } from '@/lib/auth/session'
import { createAppointmentsApi } from '@/lib/api/appointments'
import { useAppointments, useAppointment } from '@/lib/hooks/useAppointment'
import { AppointmentStatusBadge } from '@/components/appointments/AppointmentStatusBadge'
import { ButtonPrimary } from '@/components/ui/ButtonPrimary'
import { Card } from '@/components/ui/card'
import { formatTime, cn } from '@/lib/utils'
import type { Appointment, AppointmentFilters } from '@/lib/schemas/appointment'

// Board columns configuration
const BOARD_COLUMNS: Array<{
  status: Appointment['status']
  title: string
  color: string
}> = [
  { status: 'draft', title: 'Draft', color: 'bg-gray-50 border-gray-200' },
  { status: 'confirmed', title: 'Confirmed', color: 'bg-primary-50 border-primary-200' },
  { status: 'in_progress', title: 'In Progress', color: 'bg-purple-50 border-purple-200' },
  { status: 'service_complete', title: 'Service Complete', color: 'bg-secondary-50 border-secondary-200' },
  { status: 'paid', title: 'Paid', color: 'bg-green-50 border-green-200' },
  { status: 'closed', title: 'Closed', color: 'bg-blue-50 border-blue-200' },
]

interface AppointmentCardProps {
  appointment: Appointment
  onTransition: (appointmentId: string, action: any) => void
  onClick: () => void
}

function AppointmentCard({ appointment, onTransition, onClick }: AppointmentCardProps) {
  const api = createAppointmentsApi(apiClient)
  const { transition } = useAppointment(appointment.id, api)

  const handleQuickAction = async (action: any, e: React.MouseEvent) => {
    e.stopPropagation()
    await transition.mutateAsync({ action })
  }

  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="font-medium text-gray-900 text-sm">
            {appointment.customer.name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {appointment.code}
          </p>
        </div>
        <AppointmentStatusBadge status={appointment.status} size="sm" showDot={false} />
      </div>

      <div className="space-y-2 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTime(appointment.start_time)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          <span>{appointment.stylist.name}</span>
        </div>
      </div>

      {appointment.services && appointment.services.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {appointment.services.map(s => s.name).join(', ')}
          </p>
        </div>
      )}

      {/* Quick action buttons based on status */}
      {appointment.status === 'draft' && (
        <button
          onClick={(e) => handleQuickAction('confirm', e)}
          className="mt-3 w-full text-xs bg-primary text-white rounded-md py-1.5 hover:bg-primary-600 transition-colors"
        >
          Confirm
        </button>
      )}
      {appointment.status === 'confirmed' && (
        <button
          onClick={(e) => handleQuickAction('start', e)}
          className="mt-3 w-full text-xs bg-purple-600 text-white rounded-md py-1.5 hover:bg-purple-700 transition-colors"
        >
          Check In
        </button>
      )}
      {appointment.status === 'in_progress' && (
        <button
          onClick={(e) => handleQuickAction('complete', e)}
          className="mt-3 w-full text-xs bg-secondary text-white rounded-md py-1.5 hover:bg-secondary-600 transition-colors"
        >
          Complete
        </button>
      )}
    </div>
  )
}

export default function AppointmentBoardPage() {
  const router = useRouter()
  const { organizationId } = useAuth()
  const appointmentsApi = createAppointmentsApi(apiClient)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Filters for appointments
  const filters: AppointmentFilters = {
    organization_id: organizationId || '',
    from: `${selectedDate}T00:00:00Z`,
    to: `${selectedDate}T23:59:59Z`,
  }

  const { data: appointments, isLoading, error } = useAppointments(filters, appointmentsApi)

  // Group appointments by status
  const appointmentsByStatus = appointments?.reduce((acc, apt) => {
    if (!acc[apt.status]) {
      acc[apt.status] = []
    }
    acc[apt.status].push(apt)
    return acc
  }, {} as Record<string, Appointment[]>) || {}

  const handleNewAppointment = () => {
    router.push('/appointments/new')
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    router.push(`/appointments/${appointment.id}`)
  }

  if (error) {
    return (
      <Card className="text-center p-8">
        <p className="text-red-600 mb-4">Error loading appointments</p>
        <ButtonPrimary onClick={() => window.location.reload()}>
          Retry
        </ButtonPrimary>
      </Card>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Appointment Board
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage appointments through their lifecycle
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
          />
          
          <ButtonPrimary
            onClick={handleNewAppointment}
            icon={<Plus className="w-4 h-4" />}
          >
            Book Appointment
          </ButtonPrimary>
        </div>
      </div>

      {/* Board Columns */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 min-w-max h-full">
          {BOARD_COLUMNS.map((column) => (
            <div
              key={column.status}
              className={cn(
                'w-80 flex flex-col rounded-lg border-2',
                column.color
              )}
            >
              <div className="p-4 border-b">
                <h3 className="font-medium text-gray-900">{column.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {appointmentsByStatus[column.status]?.length || 0} appointments
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointmentsByStatus[column.status]?.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onTransition={() => {}}
                        onClick={() => handleAppointmentClick(appointment)}
                      />
                    )) || (
                      <p className="text-center text-sm text-gray-400 py-8">
                        No appointments
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Cancelled column (separate) */}
          <div className="w-80 flex flex-col rounded-lg border-2 bg-gray-50 border-gray-200">
            <div className="p-4 border-b">
              <h3 className="font-medium text-gray-500">Cancelled</h3>
              <p className="text-sm text-gray-400 mt-1">
                {appointmentsByStatus['cancelled']?.length || 0} appointments
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {appointmentsByStatus['cancelled']?.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onTransition={() => {}}
                    onClick={() => handleAppointmentClick(appointment)}
                  />
                )) || (
                  <p className="text-center text-sm text-gray-400 py-8">
                    No cancelled appointments
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}