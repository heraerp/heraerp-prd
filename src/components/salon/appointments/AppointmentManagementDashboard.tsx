'use client'

import React, { useState } from 'react'
import { Plus, Calendar, Filter, Search, Clock, User, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRealAppointmentsList } from '@/lib/api/appointments-real'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface AppointmentManagementDashboardProps {
  organizationId?: string
}

const statusConfig = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-500', icon: Calendar },
  confirmed: { label: 'Confirmed', color: 'bg-green-500', icon: CheckCircle },
  in_progress: { label: 'In Progress', color: 'bg-yellow-500', icon: Clock },
  completed: { label: 'Completed', color: 'bg-gray-500', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: AlertCircle },
}

export function AppointmentManagementDashboard({ organizationId }: AppointmentManagementDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Fetch real appointments
  const { data, isLoading, error } = useRealAppointmentsList({
    organizationId: organizationId || '',
    dateFrom: selectedDate,
    dateTo: selectedDate
  })

  const appointments = data?.appointments || []

  // Filter appointments based on search and status
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = searchTerm === '' || 
      apt.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.stylist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.service_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' || apt.status === selectedStatus
    
    return matchesSearch && matchesStatus
  })

  // Group appointments by status for summary
  const statusSummary = appointments.reduce((acc, apt) => {
    acc[apt.status] = (acc[apt.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 dark:bg-red-950/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p>Error loading appointments: {error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Appointment Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage salon appointments and bookings
          </p>
        </div>
        <Link href="/salon-data/appointments/new">
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </Link>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const Icon = config.icon
          const count = statusSummary[status] || 0
          
          return (
            <Card 
              key={status} 
              className={cn(
                "cursor-pointer transition-all",
                selectedStatus === status && "ring-2 ring-primary"
              )}
              onClick={() => setSelectedStatus(selectedStatus === status ? 'all' : status)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{config.label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <Icon className={cn("h-8 w-8", config.color, "text-white rounded-full p-2")} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setSelectedStatus('all')
                setSelectedDate(new Date().toISOString().split('T')[0])
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Appointments for {format(new Date(selectedDate), 'MMMM d, yyyy')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No appointments found for the selected filters
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => {
                const statusInfo = statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.scheduled
                const StatusIcon = statusInfo.icon
                const appointmentTime = new Date(appointment.datetime)
                
                return (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2 rounded-full", statusInfo.color)}>
                        <StatusIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{appointment.customer_name}</h3>
                          <Badge variant="secondary">{appointment.service_name}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(appointmentTime, 'h:mm a')}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {appointment.stylist_name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(statusInfo.color, "text-white")}>
                        {statusInfo.label}
                      </Badge>
                      <Link href={`/salon-data/appointments/${appointment.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AppointmentManagementDashboard
