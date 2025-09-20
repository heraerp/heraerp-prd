'use client'

import React, { useState, useEffect } from 'react'
import { X, Calendar, Clock, User, Scissors, DollarSign, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { formatDate } from '@/lib/date-utils'
import { addDays, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAppointments } from '@/hooks/useAppointments'
import { universalApi } from '@/lib/universal-api'
import { toast } from '@/hooks/use-toast'

interface NewAppointmentModalProps {
  onClose: () => void
  onSuccess: () => void
  organizationId?: string
}

interface Service {
  id: string
  name: string
  duration: number
  price: number
}

interface Staff {
  id: string
  name: string
  specializations?: string[]
}

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
}

export function NewAppointmentModal({
  onClose,
  onSuccess,
  organizationId
}: NewAppointmentModalProps) {
  const { createAppointment, loading } = useAppointments({ organizationId })
  const [formLoading, setFormLoading] = useState(false)

  // Form state
  const [customerId, setCustomerId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [appointmentDate, setAppointmentDate] = useState(formatDate(new Date(), 'yyyy-MM-dd'))
  const [appointmentTime, setAppointmentTime] = useState('')
  const [notes, setNotes] = useState('')

  // Data state
  const [customers, setCustomers] = useState<Customer[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])

  // Selected service details
  const selectedService = services.find(s => s.id === serviceId)

  // Fetch customers, services, and staff on mount
  useEffect(() => {
    if (!organizationId) return

    const fetchData = async () => {
      setFormLoading(true)
      try {
        const [customersResp, servicesResp, staffResp] = await Promise.all([
          universalApi.getEntities('customer', organizationId),
          universalApi.getEntities('service', organizationId),
          universalApi.getEntities('employee', organizationId)
        ])

        // Transform customers
        if (customersResp.success && customersResp.data) {
          setCustomers(
            customersResp.data.map((c: any) => ({
              id: c.id,
              name: c.entity_name,
              phone: (c.metadata as any)?.phone,
              email: (c.metadata as any)?.email
            }))
          )
        }

        // Transform services
        if (servicesResp.success && servicesResp.data) {
          setServices(
            servicesResp.data.map((s: any) => ({
              id: s.id,
              name: s.entity_name,
              duration: (s.metadata as any)?.duration || 60,
              price: (s.metadata as any)?.price || 0
            }))
          )
        }

        // Transform staff
        if (staffResp.success && staffResp.data) {
          setStaff(
            staffResp.data
              .filter(
                (e: any) =>
                  (e.metadata as any)?.role === 'stylist' ||
                  (e.metadata as any)?.department === 'salon'
              )
              .map((s: any) => ({
                id: s.id,
                name: s.entity_name,
                specializations: (s.metadata as any)?.specializations
              }))
          )
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load appointment data'
        })
      } finally {
        setFormLoading(false)
      }
    }

    fetchData()
  }, [organizationId])

  // Generate available time slots when staff and date are selected
  useEffect(() => {
    if (staffId && appointmentDate && selectedService) {
      // Generate time slots from 9 AM to 6 PM
      const slots = []
      for (let hour = 9; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          slots.push(time)
        }
      }
      setAvailableSlots(slots)
    }
  }, [staffId, appointmentDate, selectedService])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerId || !serviceId || !staffId || !appointmentDate || !appointmentTime) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields'
      })
      return
    }

    const result = await createAppointment({
      customerId,
      serviceId,
      staffId,
      appointmentDate,
      appointmentTime,
      duration: selectedService?.duration || 60,
      notes
    })

    if (result) {
      onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(31, 41, 55, 0.95) 0%, 
              rgba(17, 24, 39, 0.98) 100%
            )
          `,
          backdropFilter: 'blur(40px) saturate(150%)',
          WebkitBackdropFilter: 'blur(40px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            0 24px 48px rgba(0, 0, 0, 0.8),
            0 12px 24px rgba(147, 51, 234, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-800 bg-background/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(147, 51, 234, 0.15) 0%, 
                    rgba(59, 130, 246, 0.1) 100%
                  )
                `,
                backdropFilter: 'blur(20px) saturate(120%)',
                WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Calendar className="w-5 h-5 text-foreground" />
            </div>
            <h2 className="text-xl font-semibold !text-gray-100 dark:!text-foreground">
              New Appointment
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label
              htmlFor="customer"
              className="flex items-center gap-2 !text-gray-700 dark:!text-gray-300"
            >
              <User className="w-4 h-4" />
              Customer *
            </Label>
            <Select value={customerId} onValueChange={setCustomerId} disabled={formLoading}>
              <SelectTrigger
                id="customer"
                className="bg-muted/50 border-border !text-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50"
              >
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id} className="!text-gray-300">
                    {customer.name}
                    {customer.phone && (
                      <span className="text-sm text-muted-foreground ml-2">({customer.phone})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <Label
              htmlFor="service"
              className="flex items-center gap-2 !text-gray-700 dark:!text-gray-300"
            >
              <Scissors className="w-4 h-4" />
              Service *
            </Label>
            <Select value={serviceId} onValueChange={setServiceId} disabled={formLoading}>
              <SelectTrigger
                id="service"
                className="bg-muted/50 border-border !text-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50"
              >
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id} className="!text-gray-300">
                    <div className="flex items-center justify-between w-full">
                      <span>{service.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {service.duration} min • AED {service.price}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Staff Selection */}
          <div className="space-y-2">
            <Label
              htmlFor="staff"
              className="flex items-center gap-2 !text-gray-700 dark:!text-gray-300"
            >
              <User className="w-4 h-4" />
              Staff Member *
            </Label>
            <Select value={staffId} onValueChange={setStaffId} disabled={formLoading}>
              <SelectTrigger
                id="staff"
                className="bg-muted/50 border-border !text-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50"
              >
                <SelectValue placeholder="Select a staff member" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {staff.map(member => (
                  <SelectItem key={member.id} value={member.id} className="!text-gray-300">
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="date"
                className="flex items-center gap-2 !text-gray-700 dark:!text-gray-300"
              >
                <Calendar className="w-4 h-4" />
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={appointmentDate}
                onChange={e => setAppointmentDate(e.target.value)}
                min={formatDate(new Date(), 'yyyy-MM-dd')}
                max={formatDate(addDays(new Date(), 90), 'yyyy-MM-dd')}
                className="bg-muted/50 border-border !text-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50"
                disabled={formLoading}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="time"
                className="flex items-center gap-2 !text-gray-700 dark:!text-gray-300"
              >
                <Clock className="w-4 h-4" />
                Time *
              </Label>
              <Select
                value={appointmentTime}
                onValueChange={setAppointmentTime}
                disabled={formLoading || !staffId}
              >
                <SelectTrigger
                  id="time"
                  className="bg-muted/50 border-border !text-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50"
                >
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {availableSlots.map(slot => (
                    <SelectItem key={slot} value={slot} className="!text-gray-300">
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Service Details Display */}
          {selectedService && (
            <div
              className="p-4 rounded-lg"
              style={{
                background: 'rgba(147, 51, 234, 0.1)',
                backdropFilter: 'blur(10px) saturate(120%)',
                WebkitBackdropFilter: 'blur(10px) saturate(120%)',
                border: '1px solid rgba(147, 51, 234, 0.2)'
              }}
            >
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="!text-gray-300">Duration: {selectedService.duration} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-purple-400" />
                  <span className="!text-gray-300">Price: AED {selectedService.price}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="!text-gray-300">
                    End:{' '}
                    {appointmentTime &&
                      formatDate(
                        parseISO(`${appointmentDate}T${appointmentTime}`).getTime() +
                          selectedService.duration * 60000,
                        'HH:mm'
                      )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label
              htmlFor="notes"
              className="flex items-center gap-2 !text-gray-700 dark:!text-gray-300"
            >
              <FileText className="w-4 h-4" />
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any special requests or notes..."
              className="bg-muted/50 border-border !text-foreground placeholder:text-muted-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50 min-h-[80px]"
              disabled={formLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading || formLoading}
              className="flex-1 backdrop-blur-xl bg-background/10 dark:bg-background/30 border-border/20 dark:border-border/30 hover:bg-background/20 dark:hover:bg-background/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading || formLoading || !customerId || !serviceId || !staffId || !appointmentTime
              }
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-foreground shadow-lg disabled:opacity-50"
            >
              {loading || formLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Appointment'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
