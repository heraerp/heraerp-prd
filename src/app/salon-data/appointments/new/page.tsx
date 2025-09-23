'use client'

// Force dynamic rendering - Railway cache bust v1.2.2
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, User, Phone, Mail, DollarSign, FileText, ChevronLeft } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { createIntegratedAppointment } from '@/lib/salon/integrated-appointment-booking'
import { getSupabase } from '@/lib/supabase'
import Link from 'next/link'

// Default organization ID for salon - Hair Talkz Park Regis
const DEFAULT_SALON_ORG_ID = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'

interface Service {
  id: string
  entity_name: string
  price: number
  duration: number
}

interface Stylist {
  id: string
  entity_name: string
}

export default function NewAppointmentPage() {
  const router = useRouter()
  const { currentOrganization, contextLoading } = useHERAAuth()
  const organizationId = currentOrganization?.id || DEFAULT_SALON_ORG_ID

  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [stylists, setStylists] = useState<Stylist[]>([])

  // Form state
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    serviceId: '',
    stylistId: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    notes: ''
  })

  // Load services and stylists
  useEffect(() => {
    const loadData = async () => {
      if (!organizationId) return

      const supabase = getSupabase()

      // Load services
      const { data: servicesData } = await supabase
        .from('core_entities')
        .select('id, entity_name, core_dynamic_data(*)')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'service')
        .eq('status', 'active')
        .order('entity_name')

      // Load stylists
      const { data: stylistsData } = await supabase
        .from('core_entities')
        .select('id, entity_name')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'staff')
        .eq('status', 'active')
        .order('entity_name')

      if (servicesData) {
        const servicesWithPricing = servicesData.map(service => {
          const priceField = service.core_dynamic_data?.find((f: any) => f.field_name === 'price')
          const durationField = service.core_dynamic_data?.find(
            (f: any) => f.field_name === 'duration'
          )

          return {
            id: service.id,
            entity_name: service.entity_name,
            price: priceField?.field_value_number || 0,
            duration: durationField?.field_value_number || 30
          }
        })
        setServices(servicesWithPricing as Service[])
      }

      if (stylistsData) {
        setStylists(stylistsData as Stylist[])
      }
    }

    loadData()
  }, [organizationId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.clientName ||
      !formData.clientPhone ||
      !formData.serviceId ||
      !formData.stylistId
    ) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const selectedService = services.find(s => s.id === formData.serviceId)
      const selectedStylist = stylists.find(s => s.id === formData.stylistId)

      if (!selectedService || !selectedStylist) {
        throw new Error('Invalid service or stylist selection')
      }

      const result = await createIntegratedAppointment({
        organizationId,
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        clientEmail: formData.clientEmail,
        serviceId: formData.serviceId,
        serviceName: selectedService.entity_name,
        servicePrice: selectedService.price,
        stylistId: formData.stylistId,
        stylistName: selectedStylist.entity_name,
        date: formData.date,
        time: formData.time,
        duration: selectedService.duration,
        notes: formData.notes
      })

      if (result.success) {
        toast.success('Appointment booked successfully!')
        router.push('/salon-data/appointments')
      } else {
        throw new Error(result.message || 'Failed to book appointment')
      }
    } catch (error) {
      console.error('Booking error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to book appointment')
    } finally {
      setLoading(false)
    }
  }

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/salon-data/appointments">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">New Appointment</h1>
            <p className="text-muted-foreground mt-1">Book a new appointment for a client</p>
          </div>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Appointment Details</CardTitle>
              <CardDescription>Fill in the client and service information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Client Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Client Information</h3>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="clientName">
                      Client Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="clientName"
                        placeholder="Enter client name"
                        value={formData.clientName}
                        onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="clientPhone">
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="clientPhone"
                          type="tel"
                          placeholder="+971 50 123 4567"
                          value={formData.clientPhone}
                          onChange={e => setFormData({ ...formData, clientPhone: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="clientEmail">Email (Optional)</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="clientEmail"
                          type="email"
                          placeholder="client@example.com"
                          value={formData.clientEmail}
                          onChange={e => setFormData({ ...formData, clientEmail: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Service Details</h3>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="service">
                      Service <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.serviceId}
                      onValueChange={value => setFormData({ ...formData, serviceId: value })}
                    >
                      <SelectTrigger id="service">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map(service => (
                          <SelectItem key={service.id} value={service.id}>
                            <div className="flex justify-between items-center w-full">
                              <span>{service.entity_name}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                AED {service.price} • {service.duration} min
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="stylist">
                      Stylist <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.stylistId}
                      onValueChange={value => setFormData({ ...formData, stylistId: value })}
                    >
                      <SelectTrigger id="stylist">
                        <SelectValue placeholder="Select a stylist" />
                      </SelectTrigger>
                      <SelectContent>
                        {stylists.map(stylist => (
                          <SelectItem key={stylist.id} value={stylist.id}>
                            {stylist.entity_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="date">
                        Date <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={e => setFormData({ ...formData, date: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="time">
                        Time <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="time"
                          type="time"
                          value={formData.time}
                          onChange={e => setFormData({ ...formData, time: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any special requests or notes..."
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              {formData.serviceId && (
                <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 p-4">
                  <h4 className="font-semibold mb-2">Booking Summary</h4>
                  <div className="space-y-1 text-sm">
                    {services.find(s => s.id === formData.serviceId) && (
                      <>
                        <div className="flex justify-between">
                          <span>Service:</span>
                          <span className="font-medium">
                            {services.find(s => s.id === formData.serviceId)?.entity_name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price:</span>
                          <span className="font-medium">
                            AED {services.find(s => s.id === formData.serviceId)?.price}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span className="font-medium">
                            {services.find(s => s.id === formData.serviceId)?.duration} minutes
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-6">
            <Link href="/salon-data/appointments">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            >
              {loading ? 'Booking...' : 'Book Appointment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
