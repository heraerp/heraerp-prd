'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Calendar, Clock, User, Play, CreditCard, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAppointmentsList } from '@/lib/api/appointments'
import { useRealAppointmentsList } from '@/lib/api/appointments-real'

interface UpcomingAppointmentsProps {
  organizationId: string
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-500' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-500' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-500' },
  service_complete: { label: 'Complete', color: 'bg-green-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500' },
  pending: { label: 'Pending', color: 'bg-orange-500' },
  completed: { label: 'Completed', color: 'bg-green-500' }
}

const defaultStatus = { label: 'Scheduled', color: 'bg-blue-500' }

export function UpcomingAppointments({ organizationId }: UpcomingAppointmentsProps) {
  const today = new Date().toISOString().split('T')[0]

  console.log('🎯 UpcomingAppointments rendered with:', { organizationId, today })

  // Use real appointments from universal_transactions
  const { data, isLoading, error } = useRealAppointmentsList({
    organizationId,
    dateFrom: today,
    dateTo: today
  })

  const appointments = data?.appointments || []

  console.log('📊 Appointment data:', {
    isLoading,
    appointmentCount: appointments.length,
    appointments,
    error,
    hasData: !!data
  })

  const handleStartService = async (appointmentId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Update appointment status to in_progress
    // This would call the appointment update API
    console.log('Starting service for appointment:', appointmentId)
  }

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Appointments
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No appointments scheduled for today</p>
            <Link href="/appointments/new">
              <Button variant="link" className="mt-2">
                Book New Appointment
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map(appointment => {
              const status =
                statusConfig[appointment.status as keyof typeof statusConfig] || defaultStatus
              const appointmentTime = format(new Date(appointment.datetime), 'HH:mm')

              return (
                <Link
                  key={appointment.id}
                  href={`/appointments/${appointment.id}`}
                  className="block focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-lg"
                >
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-sm truncate">
                            {appointment.customer_name}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {appointmentTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {appointment.stylist_name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {appointment.service_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={cn('text-white', status.color)}>
                        {status.label}
                      </Badge>

                      {appointment.status === 'confirmed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={e => handleStartService(appointment.id, e)}
                          className="h-8"
                          title="Start Service"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}

                      {appointment.status === 'service_complete' && (
                        <Link
                          href={`/pos/sale?apptId=${appointment.id}`}
                          onClick={e => e.stopPropagation()}
                        >
                          <Button size="sm" variant="ghost" className="h-8" title="Open POS">
                            <CreditCard className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3">
        <Link href="/appointments/calendar" className="w-full">
          <Button variant="ghost" className="w-full">
            View Calendar
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
