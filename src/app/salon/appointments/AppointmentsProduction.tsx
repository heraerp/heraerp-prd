'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import { universalApi } from '@/lib/universal-api'
import { useAuth } from '@/components/auth/DualAuthProvider'
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
  CalendarDays,
  Timer,
  DollarSign,
  Users,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface Appointment {
  id: string
  entity_name: string
  entity_type: string
  entity_code?: string
  organization_id: string
  smart_code?: string
  created_at?: string
  updated_at?: string
  // Dynamic fields
  client_name?: string
  client_email?: string
  client_phone?: string
  service?: string
  stylist?: string
  appointment_date?: string
  appointment_time?: string
  duration?: number
  price?: number
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  notes?: string
}

export default function AppointmentsProduction() {
  const { organization } = useAuth()
  const organizationId = organization?.id
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [services, setServices] = useState<Array<{name: string, duration: number, price: number}>>([])
  const [stylists, setStylists] = useState<string[]>([])
  
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

  // Set organization ID for API
  useEffect(() => {
    if (organizationId) {
      universalApi.setOrganizationId(organizationId)
    }
  }, [organizationId])

  // Load appointments from Supabase
  const loadAppointments = async () => {
    if (!organizationId) return
    
    setLoading(true)
    try {
      // Get all appointment entities
      const response = await universalApi.read('core_entities', {
        entity_type: 'appointment',
        organization_id: organizationId
      })

      if (response.success && response.data) {
        // For each appointment, load dynamic data
        const appointmentsWithData = await Promise.all(
          response.data.map(async (entity: any) => {
            const dynamicData = await universalApi.getDynamicFields(entity.id)
            
            return {
              id: entity.id,
              entity_name: entity.entity_name,
              entity_type: entity.entity_type,
              entity_code: entity.entity_code,
              organization_id: entity.organization_id,
              smart_code: entity.smart_code,
              created_at: entity.created_at,
              updated_at: entity.updated_at,
              // Map dynamic fields
              client_name: dynamicData.client_name || '',
              client_email: dynamicData.client_email || '',
              client_phone: dynamicData.client_phone || '',
              service: dynamicData.service || '',
              stylist: dynamicData.stylist || '',
              appointment_date: dynamicData.appointment_date || '',
              appointment_time: dynamicData.appointment_time || '',
              duration: parseInt(dynamicData.duration || '60'),
              price: parseFloat(dynamicData.price || '0'),
              status: dynamicData.status || 'pending',
              notes: dynamicData.notes || ''
            }
          })
        )

        setAppointments(appointmentsWithData)
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
      toast({
        title: 'Error',
        description: 'Failed to load appointments. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Load services from Supabase
  const loadServices = async () => {
    if (!organizationId) return
    
    try {
      const response = await universalApi.read('core_entities', {
        entity_type: 'service',
        organization_id: organizationId
      })

      if (response.success && response.data) {
        const servicesData = await Promise.all(
          response.data.map(async (entity: any) => {
            const dynamicData = await universalApi.getDynamicFields(entity.id)
            return {
              name: entity.entity_name,
              duration: parseInt(dynamicData.duration || '60'),
              price: parseFloat(dynamicData.price || '0')
            }
          })
        )
        setServices(servicesData)
      }
    } catch (error) {
      console.error('Error loading services:', error)
    }
  }

  // Load stylists from Supabase
  const loadStylists = async () => {
    if (!organizationId) return
    
    try {
      const response = await universalApi.read('core_entities', {
        entity_type: 'employee',
        organization_id: organizationId
      })

      if (response.success && response.data) {
        const stylistNames = await Promise.all(
          response.data.map(async (entity: any) => {
            const dynamicData = await universalApi.getDynamicFields(entity.id)
            const status = dynamicData.status || 'active'
            const department = dynamicData.department || ''
            
            if (status === 'active' && 
                (department === 'Hair Services' || 
                 department === "Men's Grooming" ||
                 dynamicData.role?.toLowerCase().includes('stylist') ||
                 dynamicData.role?.toLowerCase().includes('barber'))) {
              return entity.entity_name
            }
            return null
          })
        )
        
        const activeStylists = stylistNames.filter(name => name !== null) as string[]
        setStylists(activeStylists)
      }
    } catch (error) {
      console.error('Error loading stylists:', error)
    }
  }

  // Load appointments, services, and stylists on mount
  useEffect(() => {
    loadAppointments()
    loadServices()
    loadStylists()
  }, [organizationId])

  // Filter appointments
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.stylist?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter
    const matchesDate = dateFilter === 'all' || appointment.appointment_date === dateFilter
    return matchesSearch && matchesStatus && matchesDate
  })

  const handleAddAppointment = async () => {
    if (!newAppointment.clientName || !newAppointment.service || !organizationId) {
      if (!organizationId) {
        toast({
          title: 'Error',
          description: 'Organization not found. Please refresh the page and try again.',
          variant: 'destructive'
        })
      }
      return
    }

    setSaving(true)
    try {
      const selectedService = services.find(s => s.name === newAppointment.service)
      
      // Create appointment entity
      const appointmentName = `${newAppointment.clientName} - ${newAppointment.service} - ${newAppointment.date}`
      const entityResponse = await universalApi.createEntity({
        entity_type: 'appointment',
        entity_name: appointmentName,
        entity_code: `APPT-${Date.now()}`,
        organization_id: organizationId,
        smart_code: 'HERA.SALON.APPOINTMENT.v1'
      })

      if (entityResponse.success && entityResponse.data) {
        const entityId = entityResponse.data.id

        // Set dynamic fields
        const dynamicFields = {
          client_name: newAppointment.clientName,
          client_email: newAppointment.clientEmail,
          client_phone: newAppointment.clientPhone,
          service: newAppointment.service,
          stylist: newAppointment.stylist,
          appointment_date: newAppointment.date,
          appointment_time: newAppointment.time,
          duration: selectedService?.duration.toString() || '60',
          price: selectedService?.price.toString() || '0',
          status: 'pending',
          notes: newAppointment.notes
        }

        // Save each dynamic field
        for (const [field, value] of Object.entries(dynamicFields)) {
          if (value) {
            await universalApi.setDynamicField(entityId, field, value)
          }
        }

        // Show success notification
        toast({
          title: 'Success',
          description: 'Appointment booked successfully!',
          duration: 3000
        })

        // Reset form
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

        // Reload appointments
        await loadAppointments()
      }
    } catch (error) {
      console.error('Error adding appointment:', error)
      toast({
        title: 'Error',
        description: 'Failed to book appointment. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: Appointment['status']) => {
    try {
      await universalApi.setDynamicField(id, 'status', status)
      
      toast({
        title: 'Success',
        description: 'Appointment status updated!',
        duration: 2000
      })
      
      await loadAppointments()
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return

    try {
      const response = await universalApi.delete('core_entities', id)
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Appointment deleted successfully!',
          duration: 3000
        })
        await loadAppointments()
      }
    } catch (error) {
      console.error('Error deleting appointment:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete appointment. Please try again.',
        variant: 'destructive'
      })
    }
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

  const getWeeklyStats = () => {
    const today = new Date()
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const weeklyAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date || '')
      return aptDate >= weekStart && aptDate <= weekEnd
    })

    return {
      totalAppointments: weeklyAppointments.length,
      confirmed: weeklyAppointments.filter(apt => apt.status === 'confirmed').length,
      completed: weeklyAppointments.filter(apt => apt.status === 'completed').length,
      revenue: weeklyAppointments
        .filter(apt => apt.status === 'completed')
        .reduce((sum, apt) => sum + (apt.price || 0), 0)
    }
  }

  const weeklyStats = getWeeklyStats()

  if (loading && appointments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex">
      {/* Teams-Style Sidebar */}
      <SalonProductionSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" asChild>
                  <Link href="/salon">
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
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Live Mode
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
                  <p className="text-2xl font-bold text-blue-600">{weeklyStats.totalAppointments}</p>
                  <p className="text-xs text-gray-600">This Week</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold text-green-600">{weeklyStats.confirmed}</p>
                  <p className="text-xs text-gray-600">Confirmed</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold text-purple-600">{weeklyStats.completed}</p>
                  <p className="text-xs text-gray-600">Completed</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold text-green-600">${weeklyStats.revenue}</p>
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
              <SelectContent className="hera-select-content">
                <SelectItem value="all" className="hera-select-item">All Status</SelectItem>
                <SelectItem value="pending" className="hera-select-item">Pending</SelectItem>
                <SelectItem value="confirmed" className="hera-select-item">Confirmed</SelectItem>
                <SelectItem value="completed" className="hera-select-item">Completed</SelectItem>
                <SelectItem value="cancelled" className="hera-select-item">Cancelled</SelectItem>
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
                              <p className="font-medium">{appointment.client_name}</p>
                              <p className="text-sm text-gray-600">{appointment.service}</p>
                              <p className="text-xs text-gray-500">
                                {appointment.appointment_date} at {appointment.appointment_time} • {appointment.duration}min • {appointment.stylist}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getStatusColor(appointment.status || 'pending')}>
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
                            <SelectContent className="hera-select-content">
                              <SelectItem value="pending" className="hera-select-item">Pending</SelectItem>
                              <SelectItem value="confirmed" className="hera-select-item">Confirmed</SelectItem>
                              <SelectItem value="completed" className="hera-select-item">Completed</SelectItem>
                              <SelectItem value="cancelled" className="hera-select-item">Cancelled</SelectItem>
                              <SelectItem value="no-show" className="hera-select-item">No Show</SelectItem>
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

            {/* Add Appointment Form */}
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
                        <SelectContent className="hera-select-content">
                          {services.length > 0 ? (
                            services.map((service) => (
                              <SelectItem key={service.name} value={service.name} className="hera-select-item">
                                {service.name} - {service.duration}min - ${service.price}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled className="hera-select-item">
                              No services available
                            </SelectItem>
                          )}
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
                        <SelectContent className="hera-select-content">
                          {stylists.length > 0 ? (
                            stylists.map((stylist) => (
                              <SelectItem key={stylist} value={stylist} className="hera-select-item">
                                {stylist}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled className="hera-select-item">
                              No stylists available
                            </SelectItem>
                          )}
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
                        disabled={!newAppointment.clientName || !newAppointment.service || saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Booking...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Book Appointment
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAddForm(false)}
                        disabled={saving}
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
        </div>
      </div>
    </div>
  )
}