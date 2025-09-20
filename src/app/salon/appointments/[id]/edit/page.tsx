// ================================================================================
// SALON APPOINTMENT EDIT PAGE
// Smart Code: HERA.PAGES.SALON.APPOINTMENTS.EDIT.V1
// Edit existing appointment details
// ================================================================================

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { universalApi } from '@/lib/universal-api-v2'
import { format } from 'date-fns'
import { ArrowLeft, Save, Calendar, Clock, User, DollarSign, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

// Demo organization ID for Hair Talkz Salon
const DEFAULT_SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

interface AppointmentDetails {
  id: string
  transaction_date: string
  transaction_code: string
  total_amount: number
  metadata?: any
  source_entity_id?: string
  target_entity_id?: string
  source_entity?: any
  target_entity?: any
}

export default function EditAppointmentPage() {
  const router = useRouter()
  const params = useParams()
  const appointmentId = params.id as string
  const { toast } = useToast()
  
  const { organization, isLoading: authLoading } = useHERAAuth()
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [demoOrganizationId, setDemoOrganizationId] = useState<string | null>(null)
  const [isCheckingDemo, setIsCheckingDemo] = useState(true)
  
  // Form state
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [selectedStylist, setSelectedStylist] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [duration, setDuration] = useState('60')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('CONFIRMED')
  
  // Check for demo session on mount
  useEffect(() => {
    const checkDemoSession = () => {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)
      
      const demoOrgId = cookies['hera-demo-org']
      if (demoOrgId) {
        setDemoOrganizationId(demoOrgId || DEFAULT_SALON_ORG_ID)
      }
      
      setIsCheckingDemo(false)
    }
    
    checkDemoSession()
  }, [])
  
  // Use demo org ID if available, otherwise use authenticated org
  const organizationId = demoOrganizationId || organization?.id || (sessionStorage.getItem('isDemoLogin') === 'true' ? DEFAULT_SALON_ORG_ID : null)
  
  // Load appointment details
  const loadAppointment = async () => {
    if (!organizationId || !appointmentId) {
      console.log('⚠️ Missing organizationId or appointmentId')
      return
    }
    
    try {
      setLoading(true)
      
      // Set organization ID on universalApi
      universalApi.setOrganizationId(organizationId)
      
      // Get appointment details
      const response = await universalApi.read('universal_transactions', {
        id: appointmentId,
        organization_id: organizationId
      })
      
      if (response.success && response.data && response.data.length > 0) {
        const apt = response.data[0]
        setAppointment(apt)
        
        // Set form values from appointment data
        const aptDate = new Date(apt.transaction_date)
        
        setAppointmentDate(format(aptDate, 'yyyy-MM-dd'))
        setAppointmentTime(format(aptDate, 'HH:mm'))
        setSelectedCustomer(apt.source_entity_id || '')
        setSelectedStylist(apt.target_entity_id || '')
        setSelectedService(apt.metadata?.service_id || '')
        setDuration(apt.metadata?.duration_minutes?.toString() || '60')
        setNotes(apt.metadata?.notes || '')
        setStatus(apt.metadata?.status || 'CONFIRMED')
      }
    } catch (error) {
      console.error('Error loading appointment:', error)
      toast({
        title: 'Error',
        description: 'Failed to load appointment details',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    if (!authLoading && !isCheckingDemo && organizationId) {
      loadAppointment()
    }
  }, [organizationId, authLoading, isCheckingDemo, appointmentId])
  
  const handleSave = async () => {
    if (!organizationId || !appointmentId) return
    
    try {
      setSaving(true)
      
      // Combine date and time
      const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`)
      
      // Update appointment
      const updateData = {
        transaction_date: appointmentDateTime.toISOString(),
        source_entity_id: selectedCustomer,
        target_entity_id: selectedStylist,
        metadata: {
          ...appointment?.metadata,
          service_id: selectedService,
          duration_minutes: parseInt(duration),
          notes: notes,
          status: status,
          appointment_time: appointmentTime,
          updated_at: new Date().toISOString()
        }
      }
      
      const response = await universalApi.update('universal_transactions', appointmentId, updateData)
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Appointment updated successfully'
        })
        router.push('/salon/appointments')
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast({
        title: 'Error',
        description: 'Failed to update appointment',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }
  
  if (authLoading || isCheckingDemo || loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading appointment...</p>
          </div>
        </div>
      </div>
    )
  }
  
  if (!organizationId || !appointment) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Appointment not found
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              The appointment you're looking for doesn't exist
            </p>
            <Button 
              onClick={() => router.push('/salon/appointments')}
              className="mt-4"
            >
              Back to Appointments
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/salon/appointments')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Edit Appointment
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              #{appointment.transaction_code}
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Appointment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="text-gray-700 dark:text-gray-300">Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  id="date"
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="pl-9 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="time" className="text-gray-700 dark:text-gray-300">Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  id="time"
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="pl-9 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
          
          {/* Customer */}
          <div>
            <Label htmlFor="customer" className="text-gray-700 dark:text-gray-300">Customer</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                id="customer"
                value={appointment.source_entity?.entity_name || 'Unknown Customer'}
                disabled
                className="pl-9 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:text-gray-700 dark:disabled:text-gray-200"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Customer cannot be changed after booking
            </p>
          </div>
          
          {/* Stylist */}
          <div>
            <Label htmlFor="stylist" className="text-gray-700 dark:text-gray-300">Stylist</Label>
            <Select value={selectedStylist} onValueChange={setSelectedStylist}>
              <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                <SelectValue placeholder="Select stylist">
                  {appointment.target_entity?.entity_name || 'Select stylist'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem value={appointment.target_entity_id || 'none'}>
                  {appointment.target_entity?.entity_name || 'Current Stylist'}
                </SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Service */}
          <div>
            <Label htmlFor="service" className="text-gray-700 dark:text-gray-300">Service</Label>
            <Input
              id="service"
              value={appointment.metadata?.service_name || 'Service'}
              disabled
              className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:text-gray-700 dark:disabled:text-gray-200"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Service cannot be changed after booking
            </p>
          </div>
          
          {/* Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration" className="text-gray-700 dark:text-gray-300">Duration (minutes)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="hera-select-content">
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="180">3 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status" className="text-gray-700 dark:text-gray-300">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="hera-select-content">
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="IN_SERVICE">In Service</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="NO_SHOW">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-gray-700 dark:text-gray-300">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special notes or instructions..."
              rows={3}
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}