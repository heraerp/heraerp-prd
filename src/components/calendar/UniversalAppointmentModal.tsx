'use client'

/**
 * HERA Universal Appointment Modal
 * Smart Code: HERA.UI.CALENDAR.MODAL.APPOINTMENT.UNIVERSAL.v1
 *
 * Universal CRUD modal for calendar appointments across all business verticals
 * - Salon: Service bookings with stylist assignment
 * - Healthcare: Patient appointments with doctor scheduling
 * - Consulting: Client sessions with consultant allocation
 * - Manufacturing: Job scheduling with operator assignment
 *
 * Features:
 * - Industry-specific field rendering
 * - Customer/Service/Resource selection dropdowns
 * - Full CRUD operations (Create/Read/Update/Delete)
 * - Conflict detection and validation
 * - HERA Sacred Six integration
 * - Smart Code automatic generation
 */

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User,
  Users,
  DollarSign,
  Tag,
  AlertCircle,
  CheckCircle,
  Trash2,
  Save,
  Plus
} from 'lucide-react'
import { format } from 'date-fns'

// Business type configurations
const BUSINESS_CONFIGS = {
  salon: {
    resourceLabel: 'Stylist',
    clientLabel: 'Customer',
    serviceLabel: 'Service',
    appointmentLabel: 'Appointment',
    priceLabel: 'Price',
    currency: 'AED',
    statusOptions: [
      { value: 'confirmed', label: 'Confirmed', color: 'bg-green-100 text-green-800' },
      { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-800' },
      { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
      { value: 'no-show', label: 'No Show', color: 'bg-gray-100 text-gray-800' }
    ]
  },
  healthcare: {
    resourceLabel: 'Doctor',
    clientLabel: 'Patient',
    serviceLabel: 'Treatment',
    appointmentLabel: 'Appointment',
    priceLabel: 'Fee',
    currency: 'USD',
    statusOptions: [
      { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
      { value: 'checked-in', label: 'Checked In', color: 'bg-green-100 text-green-800' },
      { value: 'in-progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
      { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
      { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
    ]
  },
  consulting: {
    resourceLabel: 'Consultant',
    clientLabel: 'Client',
    serviceLabel: 'Session Type',
    appointmentLabel: 'Session',
    priceLabel: 'Rate',
    currency: 'USD',
    statusOptions: [
      { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
      { value: 'confirmed', label: 'Confirmed', color: 'bg-green-100 text-green-800' },
      { value: 'in-progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
      { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
      { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
    ]
  },
  manufacturing: {
    resourceLabel: 'Operator',
    clientLabel: 'Work Order',
    serviceLabel: 'Job Type',
    appointmentLabel: 'Job',
    priceLabel: 'Cost',
    currency: 'USD',
    statusOptions: [
      { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
      { value: 'in-progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
      { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
      { value: 'on-hold', label: 'On Hold', color: 'bg-orange-100 text-orange-800' },
      { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
    ]
  }
}

interface UniversalAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit' | 'view'
  businessType: keyof typeof BUSINESS_CONFIGS

  // Initial data
  appointment?: any
  initialDate?: Date
  initialTime?: string
  initialResourceId?: string
  initialBranchId?: string

  // Available options for dropdowns
  resources: Array<{
    id: string
    name: string
    title: string
    avatar: string
    color: string
  }>
  clients: Array<{
    id: string
    name: string
    email?: string
    phone?: string
  }>
  services: Array<{
    id: string
    name: string
    description?: string
    duration: number
    price: string
    priceAmount: number
    currency: string
  }>

  // Organization context
  organizationId: string
  branchId?: string

  // Smart codes
  smartCodes?: {
    appointment: string
    resource: string
  }

  // Callbacks
  onCreate?: (appointmentData: any) => void
  onUpdate?: (appointmentData: any) => void
  onDelete?: (appointmentId: string) => void

  // Validation
  checkAvailability?: (resourceId: string, date: Date, time: string, duration: number) => Promise<{
    available: boolean
    reason?: string
  }>
}

export function UniversalAppointmentModal({
  isOpen,
  onClose,
  mode,
  businessType,
  appointment,
  initialDate,
  initialTime,
  initialResourceId,
  initialBranchId,
  resources,
  clients,
  services,
  organizationId,
  branchId,
  smartCodes = {
    appointment: `HERA.${businessType.toUpperCase()}.APPOINTMENT.TXN.v1`,
    resource: `HERA.${businessType.toUpperCase()}.RESOURCE.ENT.v1`
  },
  onCreate,
  onUpdate,
  onDelete,
  checkAvailability
}: UniversalAppointmentModalProps) {
  const config = BUSINESS_CONFIGS[businessType]

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date())
  const [selectedTime, setSelectedTime] = useState<string>(initialTime || '09:00')
  const [selectedResourceId, setSelectedResourceId] = useState<string>(initialResourceId || '')
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [duration, setDuration] = useState<number>(60)
  const [status, setStatus] = useState<string>('confirmed')
  const [notes, setNotes] = useState<string>('')
  const [price, setPrice] = useState<number>(0)

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availabilityCheck, setAvailabilityCheck] = useState<{
    checked: boolean
    available: boolean
    reason?: string
  }>({ checked: false, available: true })

  // Initialize form with appointment data (edit/view mode)
  useEffect(() => {
    if (appointment && (mode === 'edit' || mode === 'view')) {
      setSelectedDate(appointment.date || new Date())
      setSelectedTime(appointment.time || '09:00')
      setSelectedResourceId(appointment.resourceId || '')
      setSelectedClientId(appointment.clientId || '')
      setSelectedServiceId(appointment.serviceId || '')
      setDuration(appointment.duration || 60)
      setStatus(appointment.status || 'confirmed')
      setNotes(appointment.notes || appointment.description || '')
      setPrice(appointment.priceAmount || 0)
    }
  }, [appointment, mode])

  // Auto-calculate price when service changes
  useEffect(() => {
    if (selectedServiceId) {
      const service = services.find(s => s.id === selectedServiceId)
      if (service) {
        setDuration(service.duration)
        setPrice(service.priceAmount)
      }
    }
  }, [selectedServiceId, services])

  // Check availability when resource/date/time changes
  useEffect(() => {
    const performAvailabilityCheck = async () => {
      if (selectedResourceId && selectedDate && selectedTime && checkAvailability) {
        const result = await checkAvailability(selectedResourceId, selectedDate, selectedTime, duration)
        setAvailabilityCheck({
          checked: true,
          available: result.available,
          reason: result.reason
        })
      }
    }

    performAvailabilityCheck()
  }, [selectedResourceId, selectedDate, selectedTime, duration, checkAvailability])

  // Generate time slots (30-minute intervals)
  const timeSlots = useMemo(() => {
    const slots: string[] = []
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
    return slots
  }, [])

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!selectedResourceId) {
      newErrors.resource = `Please select a ${config.resourceLabel.toLowerCase()}`
    }
    if (!selectedClientId) {
      newErrors.client = `Please select a ${config.clientLabel.toLowerCase()}`
    }
    if (!selectedServiceId) {
      newErrors.service = `Please select a ${config.serviceLabel.toLowerCase()}`
    }
    if (!selectedDate) {
      newErrors.date = 'Please select a date'
    }
    if (!selectedTime) {
      newErrors.time = 'Please select a time'
    }
    if (duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    // Check availability one more time before submit
    if (checkAvailability && selectedResourceId) {
      const result = await checkAvailability(selectedResourceId, selectedDate, selectedTime, duration)
      if (!result.available) {
        setErrors({ availability: result.reason || 'Resource is not available' })
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Construct appointment payload
      const appointmentData = {
        id: appointment?.id,
        date: selectedDate,
        time: selectedTime,
        resourceId: selectedResourceId,
        clientId: selectedClientId,
        serviceId: selectedServiceId,
        duration,
        status,
        notes,
        price: `${config.currency} ${price.toFixed(2)}`,
        priceAmount: price,
        currency: config.currency,
        organizationId,
        branchId: branchId || initialBranchId,
        smartCode: smartCodes.appointment,

        // Get names for display
        resourceName: resources.find(r => r.id === selectedResourceId)?.name || '',
        clientName: clients.find(c => c.id === selectedClientId)?.name || '',
        serviceName: services.find(s => s.id === selectedServiceId)?.name || ''
      }

      if (mode === 'create') {
        onCreate?.(appointmentData)
      } else if (mode === 'edit') {
        onUpdate?.(appointmentData)
      }

      onClose()
    } catch (error) {
      console.error('[UniversalAppointmentModal] Submit failed:', error)
      setErrors({ submit: 'Failed to save appointment. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = () => {
    if (appointment?.id && window.confirm('Are you sure you want to delete this appointment?')) {
      onDelete?.(appointment.id)
      onClose()
    }
  }

  if (!isOpen) return null

  const isReadOnly = mode === 'view'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {mode === 'create'
                  ? `New ${config.appointmentLabel}`
                  : mode === 'edit'
                    ? `Edit ${config.appointmentLabel}`
                    : `View ${config.appointmentLabel}`}
              </h3>
              {appointment && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Availability Warning */}
          {availabilityCheck.checked && !availabilityCheck.available && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Resource Not Available
                </p>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  {availabilityCheck.reason}
                </p>
              </div>
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-600 dark:text-red-300">{errors.submit}</p>
            </div>
          )}

          {/* Date & Time Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="text-sm font-semibold mb-2 block">
                Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !selectedDate && 'text-muted-foreground',
                      errors.date && 'border-red-500'
                    )}
                    disabled={isReadOnly}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={date => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>

            <div>
              <Label htmlFor="time" className="text-sm font-semibold mb-2 block">
                Time
              </Label>
              <Select value={selectedTime} onValueChange={setSelectedTime} disabled={isReadOnly}>
                <SelectTrigger className={cn(errors.time && 'border-red-500')}>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(slot => (
                    <SelectItem key={slot} value={slot}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {slot}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.time && <p className="text-xs text-red-500 mt-1">{errors.time}</p>}
            </div>
          </div>

          {/* Resource Selection */}
          <div>
            <Label htmlFor="resource" className="text-sm font-semibold mb-2 block">
              {config.resourceLabel}
            </Label>
            <Select
              value={selectedResourceId}
              onValueChange={setSelectedResourceId}
              disabled={isReadOnly}
            >
              <SelectTrigger className={cn(errors.resource && 'border-red-500')}>
                <SelectValue placeholder={`Select ${config.resourceLabel.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {resources.map(resource => (
                  <SelectItem key={resource.id} value={resource.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn('w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold', resource.color)}
                      >
                        {resource.avatar}
                      </div>
                      <div>
                        <p className="font-medium">{resource.name}</p>
                        <p className="text-xs text-gray-500">{resource.title}</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.resource && <p className="text-xs text-red-500 mt-1">{errors.resource}</p>}
          </div>

          {/* Client Selection */}
          <div>
            <Label htmlFor="client" className="text-sm font-semibold mb-2 block">
              {config.clientLabel}
            </Label>
            <Select
              value={selectedClientId}
              onValueChange={setSelectedClientId}
              disabled={isReadOnly}
            >
              <SelectTrigger className={cn(errors.client && 'border-red-500')}>
                <SelectValue placeholder={`Select ${config.clientLabel.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <div>
                        <p className="font-medium">{client.name}</p>
                        {client.email && (
                          <p className="text-xs text-gray-500">{client.email}</p>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.client && <p className="text-xs text-red-500 mt-1">{errors.client}</p>}
          </div>

          {/* Service Selection */}
          <div>
            <Label htmlFor="service" className="text-sm font-semibold mb-2 block">
              {config.serviceLabel}
            </Label>
            <Select
              value={selectedServiceId}
              onValueChange={setSelectedServiceId}
              disabled={isReadOnly}
            >
              <SelectTrigger className={cn(errors.service && 'border-red-500')}>
                <SelectValue placeholder={`Select ${config.serviceLabel.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex items-between gap-2 w-full">
                      <div className="flex-1">
                        <p className="font-medium">{service.name}</p>
                        <p className="text-xs text-gray-500">
                          {service.duration} min • {service.price}
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.service && <p className="text-xs text-red-500 mt-1">{errors.service}</p>}
          </div>

          {/* Duration & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration" className="text-sm font-semibold mb-2 block">
                Duration (minutes)
              </Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={e => setDuration(parseInt(e.target.value) || 0)}
                min={15}
                step={15}
                disabled={isReadOnly}
                className={cn(errors.duration && 'border-red-500')}
              />
              {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
            </div>

            <div>
              <Label htmlFor="price" className="text-sm font-semibold mb-2 block">
                {config.priceLabel} ({config.currency})
              </Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                min={0}
                step={0.01}
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <Label htmlFor="status" className="text-sm font-semibold mb-2 block">
              Status
            </Label>
            <Select value={status} onValueChange={setStatus} disabled={isReadOnly}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Badge className={cn('text-xs', option.color)}>{option.label}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-semibold mb-2 block">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
              disabled={isReadOnly}
              className="resize-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky bottom-0">
          <div>
            {mode === 'edit' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || (availabilityCheck.checked && !availabilityCheck.available)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isSubmitting ? (
                  <>Saving...</>
                ) : (
                  <>
                    {mode === 'create' ? <Plus className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    {mode === 'create' ? 'Create' : 'Save Changes'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
