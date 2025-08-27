'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import { CheckInButton } from '@/components/salon/appointments/CheckInButton'
import { 
  Calendar,
  Clock,
  User,
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

// Default organization ID for development
const DEFAULT_ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'

interface Appointment {
  id: string
  clientId?: string
  clientName?: string
  client?: string  // For backwards compatibility
  clientPhone?: string
  clientEmail?: string
  service: string
  time: string
  stylist: string
  stylistId?: string
  duration: string
  price: number
  status: string
  statusCode?: string
  notes?: string
  checkedInAt?: string
}

const mockAppointments: Appointment[] = [
  {
    id: '1',
    client: 'Sarah Johnson',
    service: 'Hair Color & Cut',
    time: '10:00 AM',
    stylist: 'Emma',
    duration: '90 min',
    price: 450,
    status: 'confirmed'
  },
  {
    id: '2',
    client: 'Maya Patel',
    service: 'Manicure & Pedicure',
    time: '11:30 AM',
    stylist: 'Lisa',
    duration: '60 min',
    price: 200,
    status: 'confirmed'
  },
  {
    id: '3',
    client: 'Fatima Al Rashid',
    service: 'Facial Treatment',
    time: '2:00 PM',
    stylist: 'Nina',
    duration: '75 min',
    price: 350,
    status: 'pending'
  },
  {
    id: '4',
    client: 'Aisha Khan',
    service: 'Hair Styling',
    time: '3:30 PM',
    stylist: 'Emma',
    duration: '45 min',
    price: 150,
    status: 'confirmed'
  },
  {
    id: '5',
    client: 'Leila Ahmed',
    service: 'Full Spa Package',
    time: '4:30 PM',
    stylist: 'Multiple',
    duration: '180 min',
    price: 850,
    status: 'confirmed'
  }
]

export default function AppointmentsPage() {
  const router = useRouter()
  const { currentOrganization, isAuthenticated, contextLoading } = useMultiOrgAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState('today')

  useEffect(() => {
    fetchAppointments()
  }, [selectedDate])

  const fetchAppointments = async () => {
    try {
      const orgId = currentOrganization?.id || DEFAULT_ORG_ID
      const dateStr = selectedDate.toISOString().split('T')[0]
      
      const response = await fetch(`/api/v1/salon/appointments?organization_id=${orgId}&date=${dateStr}`)
      const data = await response.json()
      
      if (data.success) {
        setAppointments(data.appointments)
      } else {
        // Fallback to mock data for demo
        setAppointments(mockAppointments)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      // Fallback to mock data for demo
      setAppointments(mockAppointments)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckInComplete = () => {
    // Refresh appointments list after check-in
    fetchAppointments()
  }

  const handleCancel = async (appointmentId: string) => {
    const reason = prompt('Cancellation reason:')
    if (!reason) return
    
    try {
      const response = await fetch(`/api/v1/salon/appointments/${appointmentId}?reason=${encodeURIComponent(reason)}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        alert('Appointment cancelled successfully!')
        fetchAppointments()
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      alert('Failed to cancel appointment')
    }
  }

  const handleDelete = async (appointmentId: string) => {
    if (!confirm('Permanently delete this cancelled appointment?')) return
    
    try {
      // For permanent deletion, update status to 'deleted'
      const response = await fetch(`/api/v1/salon/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_status: 'deleted'
        })
      })
      
      if (response.ok) {
        alert('Appointment deleted successfully!')
        fetchAppointments()
      }
    } catch (error) {
      console.error('Error deleting appointment:', error)
      alert('Failed to delete appointment')
    }
  }

  // Loading state only - no auth check for testing
  if (isLoading || contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    )
  }

  const filteredAppointments = appointments.filter(apt => {
    const clientName = apt.clientName || apt.client || ''
    const serviceName = apt.service || ''
    const stylistName = apt.stylist || ''
    
    return (
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stylistName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700'
      case 'completed':
        return 'bg-blue-100 text-blue-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex">
      <SalonProductionSidebar />
      <div className="flex-1 ml-16">
        <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/salon')}
            className="mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Appointments
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your salon appointments and bookings
              </p>
            </div>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => router.push('/salon/appointments/new')}
            >
              <Plus className="w-5 h-5 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>

        {/* Date Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-4">
                <CalendarDays className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h2>
              </div>
              <Button variant="outline" size="sm">
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by client, service, or stylist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Appointment Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">Today ({filteredAppointments.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-20 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {appointment.time.split(' ')[0]}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.time.split(' ')[1]}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{appointment.clientName || appointment.client}</h3>
                          <Badge className={getStatusColor(appointment.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(appointment.status)}
                              {appointment.status}
                            </span>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Service:</span>
                            <p className="font-medium">{appointment.service}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Stylist:</span>
                            <p className="font-medium">{appointment.stylist}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <p className="font-medium">{appointment.duration}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        AED {appointment.price}
                      </div>
                      <div className="mt-2 space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/salon/appointments/${appointment.id}/edit`)}
                        >
                          Edit
                        </Button>
                        <CheckInButton
                          appointmentId={appointment.id}
                          currentStatus={appointment.status}
                          currentStatusCode={appointment.statusCode}
                          onCheckInComplete={handleCheckInComplete}
                        />
                        {(appointment.statusCode === 'STATUS-APPOINTMENT-SCHEDULED' || 
                          appointment.statusCode === 'STATUS-APPOINTMENT-CHECKED_IN') && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-orange-600 hover:text-orange-700"
                            onClick={() => handleCancel(appointment.id)}
                          >
                            Cancel
                          </Button>
                        )}
                        {appointment.status === 'cancelled' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(appointment.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredAppointments.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? 'Try adjusting your search terms' : 'No appointments scheduled for today'}
                  </p>
                  <Button onClick={() => router.push('/salon/appointments/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Book New Appointment
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-gray-600">Upcoming appointments will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-gray-600">Completed appointments will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cancelled">
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-gray-600">Cancelled appointments will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </div>
  )
}