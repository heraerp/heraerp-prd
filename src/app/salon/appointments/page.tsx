// TODO: Update this page to use production data from useAppointment
// 1. Replace hardcoded data arrays with: const data = items.map(transformToUIAppointment)
// 2. Update create handlers to use: await createAppointment(formData)
// 3. Update delete handlers to use: await deleteAppointment(id)
// 4. Replace loading states with: loading ? <Skeleton /> : <YourComponent />

'use client'

import { useAuth } from '@/contexts/auth-context'
import { useUserContext } from '@/hooks/useUserContext'
import { useAppointment } from '@/hooks/useAppointment'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import { 
  Calendar, 
  Clock, 
  User, 
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Scissors,
  Search,
  Filter,
  ArrowLeft,
  Save,
  TestTube,
  CalendarDays,
  Timer,
  DollarSign,
  Users,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

// Progressive Demo Data
const initialAppointments = [
  {
    id: 1,
    clientName: 'Sarah Johnson',
    clientEmail: 'sarah.johnson@email.com',
    clientPhone: '(555) 123-4567',
    service: 'Haircut & Style',
    stylist: 'Emma',
    date: '2025-01-09',
    time: '10:00',
    duration: 60,
    price: 85,
    status: 'confirmed',
    notes: 'Regular client, prefers layers',
    createdDate: '2025-01-05'
  },
  {
    id: 2,
    clientName: 'Mike Chen',
    clientEmail: 'mike.chen@email.com',
    clientPhone: '(555) 987-6543',
    service: 'Beard Trim',
    stylist: 'David',
    date: '2025-01-09',
    time: '11:30',
    duration: 30,
    price: 35,
    status: 'pending',
    notes: 'First time client',
    createdDate: '2025-01-06'
  },
  {
    id: 3,
    clientName: 'Lisa Wang',
    clientEmail: 'lisa.wang@email.com',
    clientPhone: '(555) 456-7890',
    service: 'Hair Color',
    stylist: 'Emma',
    date: '2025-01-09',
    time: '14:00',
    duration: 120,
    price: 150,
    status: 'confirmed',
    notes: 'Wants blonde highlights',
    createdDate: '2025-01-04'
  },
  {
    id: 4,
    clientName: 'James Wilson',
    clientEmail: 'james.wilson@email.com',
    clientPhone: '(555) 789-0123',
    service: 'Full Service',
    stylist: 'Alex',
    date: '2025-01-10',
    time: '16:00',
    duration: 90,
    price: 120,
    status: 'confirmed',
    notes: 'Wedding preparation',
    createdDate: '2025-01-07'
  }
]

const services = [
  { name: 'Haircut & Style', duration: 60, price: 85 },
  { name: 'Hair Color', duration: 120, price: 150 },
  { name: 'Beard Trim', duration: 30, price: 35 },
  { name: 'Full Service', duration: 90, price: 120 },
  { name: 'Highlights', duration: 90, price: 130 },
  { name: 'Deep Conditioning', duration: 45, price: 65 }
]

const stylists = ['Emma', 'David', 'Alex', 'Sarah', 'Michael']

interface Appointment {
  id: number
  clientName: string
  clientEmail: string
  clientPhone: string
  service: string
  stylist: string
  date: string
  time: string
  duration: number
  price: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  notes: string
  createdDate: string
}

export default function AppointmentsProgressive() {
  const { isAuthenticated } = useAuth()
  const { organizationId, userContext, loading: contextLoading } = useUserContext()
  const { 
    items, 
    stats, 
    loading, 
    error, 
    refetch, 
    createAppointment, 
    updateAppointment, 
    deleteAppointment 
  } = useAppointment(organizationId)

  const [testMode, setTestMode] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)

  // New appointment form state
  const [newAppointment, setNewAppointment] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    service: '',
    stylist: '',
    date: '',
    time: '',
    notes: ''
  })

  // Filter appointments
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.stylist.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter
    const matchesDate = dateFilter === 'all' || appointment.date === dateFilter
    return matchesSearch && matchesStatus && matchesDate
  })

  const handleSaveProgress = () => {
    setLastSaved(new Date())
    setHasChanges(false)
    console.log('Appointment data saved:', appointments)
  }

  const handleAddAppointment = () => {
    if (!newAppointment.clientName || !newAppointment.service) return

    const selectedService = services.find(s => s.name === newAppointment.service)
    const appointment: Appointment = {
      id: Date.now(),
      ...newAppointment,
      duration: selectedService?.duration || 60,
      price: selectedService?.price || 0,
      status: 'pending',
      createdDate: new Date().toISOString().split('T')[0]
    }

    setAppointments(prev => [...prev, appointment])
    setNewAppointment({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      service: '',
      stylist: '',
      date: '',
      time: '',
      notes: ''
    })
    setShowAddForm(false)
    setHasChanges(true)
  }

  const handleUpdateStatus = (id: number, status: Appointment['status']) => {
    setAppointments(prev => 
      prev.map(apt => apt.id === id ? { ...apt, status } : apt)
    )
    setHasChanges(true)
  }

  const handleDeleteAppointment = (id: number) => {
    setAppointments(prev => prev.filter(apt => apt.id !== id))
    setHasChanges(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      case 'no-show': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTodayAppointments = () => {
    const today = new Date().toISOString().split('T')[0]
    return appointments.filter(apt => apt.date === today)
  }

  const getWeeklyStats = () => {
    const today = new Date()
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const weeklyAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      return aptDate >= weekStart && aptDate <= weekEnd
    })

    return {
      totalAppointments: weeklyAppointments.length,
      confirmed: weeklyAppointments.filter(apt => apt.status === 'confirmed').length,
      completed: weeklyAppointments.filter(apt => apt.status === 'completed').length,
      revenue: weeklyAppointments.filter(apt => apt.status === 'completed').reduce((sum, apt) => sum + apt.price, 0)
    }
  }

  const weeklyStats = getWeeklyStats()


  if (!isAuthenticated) {


    return (


      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">


        <Alert>


          <AlertCircle className="h-4 w-4" />


          <AlertDescription>


            Please log in to access appointments management.


          </AlertDescription>


        </Alert>


      </div>


    )


  }



  if (contextLoading) {


    return (


      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">


        <div className="text-center">


          <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />


          <p className="text-gray-600">Loading your profile...</p>


        </div>


      </div>


    )


  }



  if (!organizationId) {


    return (


      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">


        <Alert variant="destructive">


          <AlertCircle className="h-4 w-4" />


          <AlertDescription>


            Organization not found. Please contact support.


          </AlertDescription>


        </Alert>


      </div>


    )


  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex">
      {/* Teams-Style Sidebar */}
      <SalonProductionSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Progressive Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
          <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-right">
              {userContext && (
                <>
                  <p className="text-sm font-medium">{userContext.user.name}</p>
                  <p className="text-xs text-gray-600">{userContext.organization.name}</p>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/salon-progressive">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Appointment Management
                </h1>
                <p className="text-sm text-gray-600">Schedule and manage all appointments</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {testMode && hasChanges && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveProgress}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="h-4 w-4" />
                  Save Progress
                </Button>
              )}

              {lastSaved && (
                <div className="text-xs text-gray-500">
                  Saved: {lastSaved.toLocaleTimeString()}
                </div>
              )}

              <Badge variant="secondary" className="flex items-center gap-1">
                <TestTube className="h-3 w-3" />
                Test Mode
              </Badge>
            </div>
          </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
        {/* Weekly Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold text-blue-600">{stats.totalAppointments}</p>
                <p className="text-xs text-gray-600">This Week</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
                <p className="text-xs text-gray-600">Confirmed</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
                <p className="text-xs text-gray-600">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-green-600">${stats.revenue}</p>
                <p className="text-xs text-gray-600">Revenue</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search appointments by client, service, or stylist..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-pink-600 hover:bg-pink-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Appointment List */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-pink-500" />
                  Appointments ({filteredAppointments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredAppointments.map((appointment) => (
                    <div 
                      key={appointment.id} 
                      className="p-4 border rounded-lg hover:bg-pink-25 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{appointment.clientName}</p>
                            <p className="text-sm text-gray-600">{appointment.service}</p>
                            <p className="text-xs text-gray-500">
                              {appointment.date} at {appointment.time} • {appointment.duration}min • {appointment.stylist}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                          <p className="text-sm font-medium text-green-600">${appointment.price}</p>
                        </div>
                      </div>
                      
                      {appointment.notes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                          {appointment.notes}
                        </div>
                      )}
                      
                      <div className="mt-3 flex items-center gap-2">
                        <Select
                          value={appointment.status}
                          onValueChange={(status) => handleUpdateStatus(appointment.id, status as Appointment['status'])}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="no-show">No Show</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteAppointment(appointment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Appointment Form or Details */}
          <div>
            {showAddForm ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-pink-500" />
                    New Appointment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="clientName">Client Name *</Label>
                    <Input
                      id="clientName"
                      value={newAppointment.clientName}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, clientName: e.target.value }))}
                      placeholder="Enter client name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={newAppointment.clientEmail}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, clientEmail: e.target.value }))}
                      placeholder="client@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientPhone">Phone</Label>
                    <Input
                      id="clientPhone"
                      value={newAppointment.clientPhone}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, clientPhone: e.target.value }))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="service">Service *</Label>
                    <Select
                      value={newAppointment.service}
                      onValueChange={(value) => setNewAppointment(prev => ({ ...prev, service: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.name} value={service.name}>
                            {service.name} - {service.duration}min - ${service.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="stylist">Stylist</Label>
                    <Select
                      value={newAppointment.stylist}
                      onValueChange={(value) => setNewAppointment(prev => ({ ...prev, stylist: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stylist" />
                      </SelectTrigger>
                      <SelectContent>
                        {stylists.map((stylist) => (
                          <SelectItem key={stylist} value={stylist}>
                            {stylist}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newAppointment.date}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newAppointment.time}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newAppointment.notes}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Special requests, allergies, etc."
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAddAppointment}
                      className="flex-1 bg-pink-600 hover:bg-pink-700"
                      disabled={!newAppointment.clientName || !newAppointment.service}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Book Appointment
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">Select an appointment to view details</p>
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Book New Appointment
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Progressive Features Notice */}
        {testMode && (
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TestTube className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Test Mode Active</p>
                  <p className="text-sm text-blue-700">
                    Book, modify, and manage appointments freely. All changes are saved locally in test mode. 
                    Click "Save Progress" to persist your appointment schedule.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  )
}