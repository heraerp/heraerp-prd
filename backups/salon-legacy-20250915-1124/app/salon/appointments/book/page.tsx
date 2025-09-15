'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { universalApi } from '@/lib/universal-api'
import { Calendar, Clock, User, Scissors, ChevronRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const SALON_ORG_ID = '84a3654b-907b-472a-ac8f-a1ffb6fb711b'

interface Entity {
  id: string
  entity_name: string
  entity_code: string
  entity_type: string
}

interface ServiceDetails {
  duration_minutes?: number
  base_price?: number
  skill_level_required?: string
}

export default function BookAppointmentPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  
  // Data
  const [customers, setCustomers] = useState<Entity[]>([])
  const [services, setServices] = useState<Entity[]>([])
  const [stylists, setStylists] = useState<Entity[]>([])
  const [serviceDetails, setServiceDetails] = useState<Record<string, ServiceDetails>>({})
  
  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedStylist, setSelectedStylist] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  useEffect(() => {
    universalApi.setOrganizationId(SALON_ORG_ID)
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load entities
      const entitiesData = await universalApi.read('core_entities')
      const allEntities = entitiesData.data.filter((e: any) => e.organization_id === SALON_ORG_ID)
      
      // Filter by type
      setCustomers(allEntities.filter((e: any) => e.entity_type === 'customer'))
      setServices(allEntities.filter((e: any) => e.entity_type === 'service'))
      setStylists(allEntities.filter((e: any) => e.entity_type === 'stylist'))
      
      // Load service details from dynamic data
      const dynamicData = await universalApi.read('core_dynamic_data')
      const serviceDynamicData = dynamicData.data.filter(
        (d: any) => d.organization_id === SALON_ORG_ID && 
                    allEntities.some((e: any) => e.id === d.entity_id && e.entity_type === 'service')
      )
      
      // Build service details map
      const detailsMap: Record<string, ServiceDetails> = {}
      serviceDynamicData.forEach((d: any) => {
        if (!detailsMap[d.entity_id]) {
          detailsMap[d.entity_id] = {}
        }
        if (d.field_name === 'duration_minutes') {
          detailsMap[d.entity_id].duration_minutes = d.field_value_number
        } else if (d.field_name === 'base_price') {
          detailsMap[d.entity_id].base_price = d.field_value_number
        } else if (d.field_name === 'skill_level_required') {
          detailsMap[d.entity_id].skill_level_required = d.field_value_text
        }
      })
      
      setServiceDetails(detailsMap)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      // Get selected entities
      const service = services.find(s => s.id === selectedService)
      const details = serviceDetails[selectedService] || {}
      
      // Create appointment transaction
      const appointment = await universalApi.createTransaction({
        transaction_type: 'appointment',
        transaction_date: `${selectedDate}T${selectedTime}:00`,
        transaction_code: `APPT-${Date.now()}`,
        smart_code: 'HERA.SALON.APPT.BOOK.CREATE.v1',
        source_entity_id: selectedCustomer,
        target_entity_id: selectedStylist,
        total_amount: details.base_price || 0,
        transaction_currency_code: 'AED',
        business_context: {
          appointment_datetime: `${selectedDate}T${selectedTime}:00`,
          duration_minutes: details.duration_minutes || 60,
          status: 'confirmed',
          services: [service?.entity_code],
          notes: notes
        }
      })

      // Create appointment lines
      if (appointment.id) {
        // Service line
        await universalApi.createTransactionLine({
          transaction_id: appointment.id,
          line_number: 1,
          line_type: 'SERVICE',
          entity_id: selectedService,
          quantity: 1,
          unit_amount: details.base_price || 0,
          line_amount: details.base_price || 0,
          smart_code: 'HERA.SALON.APPT.LINE.SERVICE.v1',
          line_data: {
            duration_minutes: details.duration_minutes || 60
          }
        })
      }

      // Success - redirect to appointments page
      router.push('/salon/appointments')
    } catch (error) {
      console.error('Error creating appointment:', error)
      alert('Failed to create appointment. Please try again.')
    }
  }

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Book Appointment</h1>
        <p className="text-white/60 mt-1">Schedule a new appointment for your customer</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all",
              step >= s 
                ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white" 
                : "bg-white/10 text-white/60"
            )}>
              {step > s ? <Check className="w-5 h-5" /> : s}
            </div>
            {s < 4 && (
              <div className={cn(
                "w-24 h-0.5 mx-2",
                step > s ? "bg-purple-500" : "bg-white/10"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Form Steps */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Select Customer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer.id)}
                  className={cn(
                    "p-4 rounded-lg border transition-all text-left",
                    selectedCustomer === customer.id
                      ? "bg-purple-500/20 border-purple-500 text-white"
                      : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                  )}
                >
                  <p className="font-medium">{customer.entity_name}</p>
                  <p className="text-sm opacity-60">{customer.entity_code}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!selectedCustomer}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg py-3 font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Select Service</h2>
            <div className="space-y-3">
              {services.map((service) => {
                const details = serviceDetails[service.id] || {}
                return (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                    className={cn(
                      "w-full p-4 rounded-lg border transition-all text-left",
                      selectedService === service.id
                        ? "bg-purple-500/20 border-purple-500 text-white"
                        : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{service.entity_name}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm opacity-60">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {details.duration_minutes || 60} min
                          </span>
                          <span>AED {details.base_price || 0}</span>
                        </div>
                      </div>
                      <Scissors className="w-5 h-5 opacity-60" />
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-white/10 text-white rounded-lg py-3 font-medium hover:bg-white/20 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedService}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg py-3 font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Select Stylist & Time</h2>
            
            {/* Stylist Selection */}
            <div>
              <label className="text-white/60 text-sm font-medium mb-2 block">Stylist</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {stylists.map((stylist) => (
                  <button
                    key={stylist.id}
                    onClick={() => setSelectedStylist(stylist.id)}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      selectedStylist === stylist.id
                        ? "bg-purple-500/20 border-purple-500 text-white"
                        : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                    )}
                  >
                    <User className="w-5 h-5 mx-auto mb-1 opacity-60" />
                    <p className="text-sm font-medium">{stylist.entity_name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="text-white/60 text-sm font-medium mb-2 block">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Time Selection */}
            <div>
              <label className="text-white/60 text-sm font-medium mb-2 block">Time</label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      "p-2 rounded-lg border transition-all text-sm",
                      selectedTime === time
                        ? "bg-purple-500/20 border-purple-500 text-white"
                        : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-white/10 text-white rounded-lg py-3 font-medium hover:bg-white/20 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!selectedStylist || !selectedTime}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg py-3 font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Confirm Appointment</h2>
            
            {/* Summary */}
            <div className="bg-white/5 rounded-lg p-6 space-y-4 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Customer</span>
                <span className="text-white font-medium">
                  {customers.find(c => c.id === selectedCustomer)?.entity_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Service</span>
                <span className="text-white font-medium">
                  {services.find(s => s.id === selectedService)?.entity_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Stylist</span>
                <span className="text-white font-medium">
                  {stylists.find(s => s.id === selectedStylist)?.entity_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Date & Time</span>
                <span className="text-white font-medium">
                  {new Date(selectedDate).toLocaleDateString()} at {selectedTime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Duration</span>
                <span className="text-white font-medium">
                  {serviceDetails[selectedService]?.duration_minutes || 60} minutes
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Price</span>
                <span className="text-white font-medium">
                  AED {serviceDetails[selectedService]?.base_price || 0}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-white/60 text-sm font-medium mb-2 block">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                placeholder="Any special requests or notes..."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-white/10 text-white rounded-lg py-3 font-medium hover:bg-white/20 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg py-3 font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}