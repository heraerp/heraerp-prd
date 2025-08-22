'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import { 
  Calendar,
  Clock,
  User,
  Scissors,
  ChevronLeft,
  Save,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

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

export default function NewAppointmentPage() {
  const router = useRouter()
  const { currentOrganization, isAuthenticated, isLoading: authLoading } = useMultiOrgAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    serviceId: '',
    stylistId: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    notes: ''
  })

  // Authentication check
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            Please <Link href="/auth/login" className="underline">log in</Link> to book appointments.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted!') // Debug log
    setIsSubmitting(true)
    
    try {
      const selectedServiceData = services.find(s => s.id === formData.serviceId)
      const selectedStylistData = stylists.find(s => s.id === formData.stylistId)
      
      // Use hardcoded organization ID for now
      const organizationId = currentOrganization?.id || '550e8400-e29b-41d4-a716-446655440000'
      
      const appointmentData = {
        organizationId: organizationId,
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        clientEmail: formData.clientEmail,
        serviceId: formData.serviceId,
        serviceName: selectedServiceData?.name,
        servicePrice: selectedServiceData?.price,
        stylistId: formData.stylistId,
        stylistName: selectedStylistData?.name,
        date: formData.date,
        time: formData.time,
        duration: selectedServiceData?.duration,
        notes: formData.notes
      }
      
      console.log('Submitting appointment data:', appointmentData)
      
      // Show loading message
      console.log('Sending request to API...')
      
      const response = await fetch('/api/v1/salon/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData)
      })

      console.log('Response received:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response not OK:', response.status, errorText)
        setMessage({ type: 'error', text: `Failed to create appointment: ${response.status}` })
        setIsSubmitting(false)
        return
      }

      const data = await response.json()
      console.log('Response data:', data)
      
      if (data.success) {
        console.log('Success! Redirecting...')
        setMessage({ type: 'success', text: 'Appointment created successfully!' })
        setTimeout(() => {
          router.push('/salon/appointments')
        }, 1000)
      } else {
        console.error('API returned error:', data.error)
        setMessage({ type: 'error', text: data.error || 'Failed to create appointment' })
      }
    } catch (error) {
      console.error('Caught error:', error)
      setMessage({ type: 'error', text: 'Network error: ' + error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedService = services.find(s => s.id === formData.serviceId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex">
      <SalonProductionSidebar />
      <div className="flex-1 ml-16">
        <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
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
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              New Appointment
            </h1>
            <p className="text-gray-600 text-lg">
              Book a new appointment for your client
            </p>
          </div>
        </div>

        {message && (
          <Alert className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
            <AlertDescription className={message.type === 'error' ? 'text-red-600' : 'text-green-600'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Client Information
                </CardTitle>
                <CardDescription>
                  Enter client details or select existing client
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Enter client name"
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
                    placeholder="+971 XX XXX XXXX"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="clientEmail">Email (Optional)</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    placeholder="client@example.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Service Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-purple-600" />
                  Service & Stylist
                </CardTitle>
                <CardDescription>
                  Choose service and preferred stylist
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="service">Service *</Label>
                  <Select
                    value={formData.serviceId}
                    onValueChange={(value) => setFormData({ ...formData, serviceId: value })}
                  >
                    <SelectTrigger id="service">
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
                  <Label htmlFor="stylist">Stylist *</Label>
                  <Select
                    value={formData.stylistId}
                    onValueChange={(value) => setFormData({ ...formData, stylistId: value })}
                  >
                    <SelectTrigger id="stylist">
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
                
                {selectedService && (
                  <Alert>
                    <AlertDescription>
                      <strong>Duration:</strong> {selectedService.duration}<br />
                      <strong>Price:</strong> AED {selectedService.price}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Date & Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Date & Time
                </CardTitle>
                <CardDescription>
                  Select appointment date and time
                </CardDescription>
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

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
                <CardDescription>
                  Any special requests or notes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter any special requests or notes..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
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
              disabled={isSubmitting || !formData.clientName || !formData.clientPhone || !formData.serviceId || !formData.stylistId || !formData.time}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Book Appointment
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