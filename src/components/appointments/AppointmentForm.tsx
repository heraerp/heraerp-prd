// ================================================================================
// HERA APPOINTMENT FORM
// Smart Code: HERA.COMPONENTS.APPOINTMENT.FORM.v1
// Booking form with validation and time slot selection
// ================================================================================

'use client'

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, Clock, User, Scissors, MapPin, Loader2 } from 'lucide-react'
import { ButtonPrimary } from '@/components/ui/ButtonPrimary'
import { Card } from '@/components/ui/card'
import { AppointmentCreate } from '@/lib/schemas/appointment'
import { formatTime, formatDate, cn } from '@/lib/utils'
import type { z } from 'zod'

// Mock data for dropdowns
const MOCK_CUSTOMERS = [
  { id: 'cust-001', code: 'CUST-001', name: 'Emma Thompson' },
  { id: 'cust-002', code: 'CUST-002', name: 'Sarah Johnson' },
  { id: 'cust-003', code: 'CUST-003', name: 'Michelle Davis' },
  { id: 'cust-004', code: 'CUST-004', name: 'Jennifer Wilson' },
  { id: 'cust-005', code: 'CUST-005', name: 'Amanda Brown' }
]

const MOCK_STYLISTS = [
  { id: 'staff-001', code: 'STAFF-001', name: 'Lisa Chen' },
  { id: 'staff-002', code: 'STAFF-002', name: 'Maria Rodriguez' },
  { id: 'staff-003', code: 'STAFF-003', name: 'Ahmed Hassan' }
]

const MOCK_SERVICES = [
  { id: 'srv-001', name: 'Hair Cut & Style', duration: 60, price: 150 },
  { id: 'srv-002', name: 'Hair Color', duration: 90, price: 200 },
  { id: 'srv-003', name: 'Hair Treatment', duration: 90, price: 300 },
  { id: 'srv-004', name: 'Manicure & Pedicure', duration: 60, price: 100 },
  { id: 'srv-005', name: 'Facial', duration: 75, price: 180 }
]

const MOCK_BRANCHES = [
  { code: 'MAIN', name: 'Main Branch' },
  { code: 'DOWNTOWN', name: 'Downtown Branch' },
  { code: 'MALL', name: 'Mall Location' }
]

interface AppointmentFormProps {
  organizationId: string
  onSubmit: (data: z.infer<typeof AppointmentCreate>) => Promise<void>
  loading?: boolean
  className?: string
}

export function AppointmentForm({
  organizationId,
  onSubmit,
  loading = false,
  className
}: AppointmentFormProps) {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [availableSlots, setAvailableSlots] = useState<Array<{ start: string; end: string }>>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const form = useForm<z.infer<typeof AppointmentCreate>>({
    resolver: zodResolver(AppointmentCreate),
    defaultValues: {
      organization_id: organizationId,
      customer_code: '',
      stylist_code: '',
      branch_code: 'MAIN',
      services: [],
      notes: ''
    }
  })

  const watchStylist = form.watch('stylist_code')
  const watchBranch = form.watch('branch_code')

  // Calculate total duration based on selected services
  const totalDuration = selectedServices.reduce((total, serviceId) => {
    const service = MOCK_SERVICES.find(s => s.id === serviceId)
    return total + (service?.duration || 0)
  }, 0)

  // Load available slots when date/stylist changes
  useEffect(() => {
    if (selectedDate && watchStylist && totalDuration > 0) {
      loadAvailableSlots()
    }
  }, [selectedDate, watchStylist, totalDuration])

  const loadAvailableSlots = async () => {
    setLoadingSlots(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    // Generate mock slots
    const slots = []
    const date = new Date(selectedDate)
    const startHour = 9 // 9 AM
    const endHour = 18 // 6 PM

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const start = new Date(date)
        start.setHours(hour, minute, 0, 0)
        const end = new Date(start)
        end.setMinutes(end.getMinutes() + totalDuration)

        if (end.getHours() < endHour || (end.getHours() === endHour && end.getMinutes() === 0)) {
          slots.push({
            start: start.toISOString(),
            end: end.toISOString()
          })
        }
      }
    }

    setAvailableSlots(slots)
    setLoadingSlots(false)
  }

  const handleServiceToggle = (serviceId: string) => {
    const newServices = selectedServices.includes(serviceId)
      ? selectedServices.filter(id => id !== serviceId)
      : [...selectedServices, serviceId]

    setSelectedServices(newServices)
    form.setValue('services', newServices)
  }

  const handleSlotSelect = (slot: { start: string; end: string }) => {
    form.setValue('start_time', slot.start)
    form.setValue('end_time', slot.end)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={cn('space-y-6', className)}>
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
            <Controller
              name="customer_code"
              control={form.control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="">Select a customer</option>
                  {MOCK_CUSTOMERS.map(customer => (
                    <option key={customer.id} value={customer.code}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {form.formState.errors.customer_code && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.customer_code.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stylist</label>
            <Controller
              name="stylist_code"
              control={form.control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="">Select a stylist</option>
                  {MOCK_STYLISTS.map(stylist => (
                    <option key={stylist.id} value={stylist.code}>
                      {stylist.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {form.formState.errors.stylist_code && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.stylist_code.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <Controller
              name="branch_code"
              control={form.control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  {MOCK_BRANCHES.map(branch => (
                    <option key={branch.code} value={branch.code}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Services</h3>

        <div className="space-y-3">
          {MOCK_SERVICES.map(service => (
            <label
              key={service.id}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all',
                selectedServices.includes(service.id)
                  ? 'border-primary bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service.id)}
                  onChange={() => handleServiceToggle(service.id)}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{service.name}</p>
                  <p className="text-xs text-gray-500">{service.duration} minutes</p>
                </div>
              </div>
              <span className="text-sm font-medium text-foreground">{service.price} AED</span>
            </label>
          ))}
        </div>

        {form.formState.errors.services && (
          <p className="text-sm text-red-600 mt-2">{form.formState.errors.services.message}</p>
        )}

        {totalDuration > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              Total duration:{' '}
              <strong>
                {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
              </strong>
            </p>
          </div>
        )}
      </Card>

      {selectedDate && watchStylist && totalDuration > 0 && (
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Available Time Slots</h3>

          {loadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading available slots...</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {availableSlots.map((slot, idx) => {
                const isSelected =
                  form.watch('start_time') === slot.start && form.watch('end_time') === slot.end

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSlotSelect(slot)}
                    className={cn(
                      'p-2 text-sm rounded-md border transition-all',
                      isSelected
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    )}
                  >
                    {formatTime(slot.start)}
                  </button>
                )
              })}
            </div>
          )}

          {form.watch('start_time') && (
            <div className="mt-4 p-3 bg-green-50 rounded-md">
              <p className="text-sm text-green-700">
                Selected:{' '}
                <strong>
                  {formatTime(form.watch('start_time'))} - {formatTime(form.watch('end_time'))}
                </strong>
              </p>
            </div>
          )}
        </Card>
      )}

      <Card padding="lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Additional Notes</h3>

        <Controller
          name="notes"
          control={form.control}
          render={({ field }) => (
            <textarea
              {...field}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="Any special requests or notes..."
            />
          )}
        />
      </Card>

      <div className="flex items-center justify-end gap-4">
        <ButtonPrimary
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={loading}
        >
          Cancel
        </ButtonPrimary>
        <ButtonPrimary
          type="submit"
          variant="primary"
          loading={loading}
          loadingText="Booking..."
          icon={<Calendar className="w-4 h-4" />}
        >
          Book Appointment
        </ButtonPrimary>
      </div>
    </form>
  )
}
