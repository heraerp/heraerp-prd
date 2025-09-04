'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import { 
  ChevronLeft,
  Save,
  Loader2,
  Calendar,
  Clock,
  User,
  Scissors
} from 'lucide-react'

const services = [
  { id: '1', name: 'Hair Cut', duration: '30 min', price: 150 },
  { id: '2', name: 'Hair Color', duration: '90 min', price: 350 },
  { id: '3', name: 'Hair Color & Cut', duration: '120 min', price: 450 },
  { id: '4', name: 'Manicure', duration: '45 min', price: 100 },
  { id: '5', name: 'Pedicure', duration: '45 min', price: 120 },
  { id: '6', name: 'Manicure & Pedicure', duration: '90 min', price: 200 },
  { id: '7', name: 'Facial Treatment', duration: '75 min', price: 350 },
  { id: '8', name: 'Hair Styling', duration: '45 min', price: 150 },
  { id: '9', name: 'Full Spa Package', duration: '180 min', price: 850 }
]

const stylists = [
  { id: '1', name: 'Emma Johnson', specialties: ['Hair Color', 'Hair Cut'] },
  { id: '2', name: 'Lisa Chen', specialties: ['Nails', 'Manicure', 'Pedicure'] },
  { id: '3', name: 'Nina Patel', specialties: ['Facial', 'Spa Treatments'] },
  { id: '4', name: 'Sarah Williams', specialties: ['Hair Styling', 'Hair Cut'] }
]

export default function EditAppointmentPage() {
  const router = useRouter()
  const params = useParams()
  const appointmentId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    serviceId: '',
    stylistId: '',
    date: '',
    time: '',
    notes: ''
  })

  useEffect(() => {
    fetchAppointment()
  }, [appointmentId])

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/v1/salon/appointments/${appointmentId}`)
      const data = await response.json()
      
      if (data.success && data.appointment) {
        const apt = data.appointment
        setFormData({
          clientName: apt.metadata?.customer_name || '',
          clientPhone: apt.metadata?.customer_phone || '',
          clientEmail: apt.metadata?.customer_email || '',
          serviceId: apt.metadata?.service_id || '',
          stylistId: apt.metadata?.stylist_id || '',
          date: apt.transaction_date?.split('T')[0] || '',
          time: apt.metadata?.appointment_time || '',
          notes: apt.metadata?.notes || ''
        })
      } else {
        setMessage({ type: 'error', text: 'Appointment not found' })
      }
    } catch (error) {
      console.error('Error fetching appointment:', error)
      setMessage({ type: 'error', text: 'Failed to load appointment' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const selectedService = services.find(s => s.id === formData.serviceId)
      const selectedStylist = stylists.find(s => s.id === formData.stylistId)
      
      const response = await fetch(`/api/v1/salon/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName: formData.clientName,
          clientPhone: formData.clientPhone,
          clientEmail: formData.clientEmail,
          serviceId: formData.serviceId,
          serviceName: selectedService?.name,
          servicePrice: selectedService?.price,
          stylistId: formData.stylistId,
          stylistName: selectedStylist?.name,
          date: formData.date,
          time: formData.time,
          duration: selectedService?.duration,
          notes: formData.notes
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Appointment updated successfully!' })
        setTimeout(() => {
          router.push('/salon/appointments')
        }, 1000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update appointment' })
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      setMessage({ type: 'error', text: 'Network error: ' + error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading appointment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex">
      <SalonProductionSidebar />
      <div className="flex-1 ml-16">
        <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/salon/appointments')}
            className="mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Appointments
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Edit Appointment
          </h1>
        </div>

        {message && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
            <AlertDescription className={message.type === 'error' ? 'text-red-600' : 'text-green-600'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="clientPhone">Phone Number *</Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="clientEmail">Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-purple-600" />
                  Service & Stylist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Service *</Label>
                  <Select
                    value={formData.serviceId}
                    onValueChange={(value) => setFormData({ ...formData, serviceId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - {service.duration} (AED {service.price})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Stylist *</Label>
                  <Select
                    value={formData.stylistId}
                    onValueChange={(value) => setFormData({ ...formData, stylistId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a stylist" />
                    </SelectTrigger>
                    <SelectContent>
                      {stylists.map((stylist) => (
                        <SelectItem key={stylist.id} value={stylist.id}>
                          {stylist.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Date & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any special notes..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.push('/salon/appointments')}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Appointment
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
      </div>
    </div>
  )
}