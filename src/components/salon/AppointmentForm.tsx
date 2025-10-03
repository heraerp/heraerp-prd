import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Save, Loader2, Calendar, User, Scissors, MapPin, Clock, DollarSign } from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { format, parseISO, differenceInMinutes } from 'date-fns'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { CUSTOMER_PRESET, SERVICE_PRESET, STAFF_PRESET } from '@/hooks/entityPresets'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'

interface Appointment {
  id: string
  entity_name: string
  entity_code?: string
  dynamic_fields?: {
    appointment_date?: { value: string }
    start_time?: { value: string }
    end_time?: { value: string }
    duration_minutes?: { value: number }
    appointment_status?: { value: string }
    payment_status?: { value: string }
    service_price?: { value: number }
    discount_amount?: { value: number }
    tax_amount?: { value: number }
    total_amount?: { value: number }
    deposit_amount?: { value: number }
    notes?: { value: string }
    confirmation_sent?: { value: boolean }
    reminder_sent?: { value: boolean }
    room_chair?: { value: string }
    booking_source?: { value: string }
    cancellation_reason?: { value: string }
  }
  relationships?: {
    customer?: { to_entity: any }
    staff?: { to_entity: any }
    services?: { to_entity: any }[]
    location?: { to_entity: any }
  }
  created_at?: string
  updated_at?: string
}

interface AppointmentFormProps {
  appointment?: Appointment | null
  initialData?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading: boolean
}

export function AppointmentForm({ 
  appointment, 
  initialData,
  onSubmit, 
  onCancel, 
  isLoading 
}: AppointmentFormProps) {
  const { salonRole, hasPermission } = useSecuredSalonContext()
  const canViewPricing = hasPermission('salon:finance:read') || ['owner', 'manager'].includes(salonRole || '')
  
  // Load related entities
  const { entities: customers } = useUniversalEntity({
    entity_type: 'CUSTOMER',
    filters: { limit: 100 }
  })
  
  const { entities: staff } = useUniversalEntity({
    entity_type: 'STAFF',
    filters: { limit: 50 }
  })
  
  const { entities: services } = useUniversalEntity({
    entity_type: 'SERVICE',
    filters: { limit: 100, include_dynamic: true },
    dynamicFields: SERVICE_PRESET.dynamicFields
  })
  
  const { entities: locations } = useUniversalEntity({
    entity_type: 'LOCATION',
    filters: { limit: 20 }
  })

  // Use appointment prop or initialData
  const entityData = appointment || initialData
  const [formData, setFormData] = useState({
    // Basic info
    appointment_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '',
    end_time: '',
    duration_minutes: 60,
    
    // Status
    appointment_status: 'scheduled',
    payment_status: 'unpaid',
    booking_source: 'in_person',
    
    // Related entities
    customer_id: '',
    staff_id: '',
    service_ids: [] as string[],
    location_id: '',
    
    // Pricing (only visible to authorized roles)
    service_price: 0,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 0,
    deposit_amount: 0,
    
    // Additional info
    notes: '',
    room_chair: '',
    confirmation_sent: false,
    reminder_sent: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form data when appointment changes
  useEffect(() => {
    if (entityData) {
      console.log('[AppointmentForm] Populating form with entity data:', entityData)
      
      setFormData({
        appointment_date: entityData.dynamic_fields?.appointment_date?.value || format(new Date(), 'yyyy-MM-dd'),
        start_time: entityData.dynamic_fields?.start_time?.value || '',
        end_time: entityData.dynamic_fields?.end_time?.value || '',
        duration_minutes: entityData.dynamic_fields?.duration_minutes?.value || 60,
        appointment_status: entityData.dynamic_fields?.appointment_status?.value || 'scheduled',
        payment_status: entityData.dynamic_fields?.payment_status?.value || 'unpaid',
        booking_source: entityData.dynamic_fields?.booking_source?.value || 'in_person',
        customer_id: entityData.relationships?.customer?.to_entity?.id || '',
        staff_id: entityData.relationships?.staff?.to_entity?.id || '',
        service_ids: entityData.relationships?.services?.map(rel => rel.to_entity.id) || [],
        location_id: entityData.relationships?.location?.to_entity?.id || '',
        service_price: entityData.dynamic_fields?.service_price?.value || 0,
        discount_amount: entityData.dynamic_fields?.discount_amount?.value || 0,
        tax_amount: entityData.dynamic_fields?.tax_amount?.value || 0,
        total_amount: entityData.dynamic_fields?.total_amount?.value || 0,
        deposit_amount: entityData.dynamic_fields?.deposit_amount?.value || 0,
        notes: entityData.dynamic_fields?.notes?.value || '',
        room_chair: entityData.dynamic_fields?.room_chair?.value || '',
        confirmation_sent: entityData.dynamic_fields?.confirmation_sent?.value || false,
        reminder_sent: entityData.dynamic_fields?.reminder_sent?.value || false
      })
    }
  }, [entityData])

  // Calculate duration when times change
  useEffect(() => {
    if (formData.start_time && formData.end_time && formData.appointment_date) {
      const startDateTime = parseISO(`${formData.appointment_date}T${formData.start_time}`)
      const endDateTime = parseISO(`${formData.appointment_date}T${formData.end_time}`)
      const minutes = differenceInMinutes(endDateTime, startDateTime)
      if (minutes > 0) {
        setFormData(prev => ({ ...prev, duration_minutes: minutes }))
      }
    }
  }, [formData.start_time, formData.end_time, formData.appointment_date])

  // Calculate total when pricing changes
  useEffect(() => {
    const total = formData.service_price - formData.discount_amount + formData.tax_amount
    setFormData(prev => ({ ...prev, total_amount: Math.max(0, total) }))
  }, [formData.service_price, formData.discount_amount, formData.tax_amount])

  // Auto-calculate service price when services are selected
  useEffect(() => {
    if (services && formData.service_ids.length > 0) {
      const totalPrice = formData.service_ids.reduce((sum, serviceId) => {
        const service = services.find(s => s.id === serviceId)
        if (service?.dynamic_fields?.price) {
          return sum + (service.dynamic_fields.price.value || 0)
        }
        return sum
      }, 0)
      setFormData(prev => ({ ...prev, service_price: totalPrice }))
    }
  }, [formData.service_ids, services])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required'
    }
    
    if (!formData.staff_id) {
      newErrors.staff_id = 'Staff member is required'
    }
    
    if (formData.service_ids.length === 0) {
      newErrors.service_ids = 'At least one service is required'
    }
    
    if (!formData.appointment_date) {
      newErrors.appointment_date = 'Date is required'
    }
    
    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required'
    }
    
    if (!formData.end_time) {
      newErrors.end_time = 'End time is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      // Generate entity name from appointment details
      const customer = customers?.find(c => c.id === formData.customer_id)
      const staff = staff?.find(s => s.id === formData.staff_id)
      const appointmentName = `${customer?.entity_name || 'Customer'} - ${format(parseISO(formData.appointment_date), 'MMM d')} ${formData.start_time}`
      
      // Prepare the data in the format expected by the CRUD pattern
      const submitData = {
        entity_name: appointmentName,
        appointment_date: formData.appointment_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        duration_minutes: formData.duration_minutes,
        appointment_status: formData.appointment_status,
        payment_status: formData.payment_status,
        booking_source: formData.booking_source,
        customer_id: formData.customer_id,
        staff_id: formData.staff_id,
        service_ids: formData.service_ids,
        location_id: formData.location_id,
        service_price: formData.service_price,
        discount_amount: formData.discount_amount,
        tax_amount: formData.tax_amount,
        total_amount: formData.total_amount,
        deposit_amount: formData.deposit_amount,
        notes: formData.notes,
        room_chair: formData.room_chair,
        confirmation_sent: formData.confirmation_sent,
        reminder_sent: formData.reminder_sent
      }
      
      console.log('[AppointmentForm] Submitting data:', submitData)
      onSubmit(submitData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="space-y-6 pt-6 pb-4 flex-1 overflow-y-auto px-6">
        {/* Customer & Staff Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: LUXE_COLORS.champagne }}>
            <User className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
            Customer & Staff
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Customer *
              </label>
              <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                <SelectTrigger 
                  className="h-11"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                >
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent 
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  {customers?.map(customer => (
                    <SelectItem 
                      key={customer.id} 
                      value={customer.id}
                      style={{ color: LUXE_COLORS.lightText }}
                    >
                      {customer.entity_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customer_id && <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.customer_id}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Staff Member *
              </label>
              <Select value={formData.staff_id} onValueChange={(value) => setFormData({ ...formData, staff_id: value })}>
                <SelectTrigger 
                  className="h-11"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                >
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent 
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  {staff?.map(member => (
                    <SelectItem 
                      key={member.id} 
                      value={member.id}
                      style={{ color: LUXE_COLORS.lightText }}
                    >
                      {member.entity_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.staff_id && <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.staff_id}</p>}
            </div>
          </div>
        </div>

        {/* Services & Location Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: LUXE_COLORS.champagne }}>
            <Scissors className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
            Services & Location
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Services *
              </label>
              <div className="space-y-2">
                {services?.map(service => (
                  <label 
                    key={service.id}
                    className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.service_ids.includes(service.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, service_ids: [...formData.service_ids, service.id] })
                        } else {
                          setFormData({ ...formData, service_ids: formData.service_ids.filter(id => id !== service.id) })
                        }
                      }}
                      className="h-4 w-4 rounded text-gold focus:ring-gold"
                    />
                    <span style={{ color: LUXE_COLORS.lightText }}>
                      {service.entity_name}
                      {service.dynamic_fields?.price && canViewPricing && (
                        <span style={{ color: LUXE_COLORS.gold }} className="ml-2">
                          (AED {service.dynamic_fields.price.value})
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
              {errors.service_ids && <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.service_ids}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Location
              </label>
              <Select value={formData.location_id} onValueChange={(value) => setFormData({ ...formData, location_id: value })}>
                <SelectTrigger 
                  className="h-11"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                >
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent 
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  {locations?.map(location => (
                    <SelectItem 
                      key={location.id} 
                      value={location.id}
                      style={{ color: LUXE_COLORS.lightText }}
                    >
                      {location.entity_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Room / Chair
              </label>
              <Input
                value={formData.room_chair}
                onChange={(e) => setFormData({ ...formData, room_chair: e.target.value })}
                placeholder="Chair 1"
                className="h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
            </div>
          </div>
        </div>

        {/* Date & Time Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: LUXE_COLORS.champagne }}>
            <Calendar className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
            Date & Time
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Date *
              </label>
              <Input
                type="date"
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                className="h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
              {errors.appointment_date && <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.appointment_date}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Start Time *
              </label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
              {errors.start_time && <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.start_time}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                End Time *
              </label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
              {errors.end_time && <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.end_time}</p>}
            </div>
          </div>
          
          <div className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
            Duration: {formData.duration_minutes} minutes
          </div>
        </div>

        {/* Pricing Section (Only visible to authorized roles) */}
        {canViewPricing && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: LUXE_COLORS.champagne }}>
              <DollarSign className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
              Pricing
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                  Service Price
                </label>
                <Input
                  type="number"
                  value={formData.service_price}
                  onChange={(e) => setFormData({ ...formData, service_price: parseFloat(e.target.value) || 0 })}
                  step="0.01"
                  className="h-11"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                  Discount
                </label>
                <Input
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                  step="0.01"
                  className="h-11"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                  Tax
                </label>
                <Input
                  type="number"
                  value={formData.tax_amount}
                  onChange={(e) => setFormData({ ...formData, tax_amount: parseFloat(e.target.value) || 0 })}
                  step="0.01"
                  className="h-11"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                  Total
                </label>
                <Input
                  type="number"
                  value={formData.total_amount}
                  readOnly
                  className="h-11 font-bold"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.gold}50`,
                    color: LUXE_COLORS.gold
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Additional Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: LUXE_COLORS.champagne }}>
            Additional Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Booking Source
              </label>
              <Select value={formData.booking_source} onValueChange={(value) => setFormData({ ...formData, booking_source: value })}>
                <SelectTrigger 
                  className="h-11"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent 
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  <SelectItem value="in_person" style={{ color: LUXE_COLORS.lightText }}>In Person</SelectItem>
                  <SelectItem value="phone" style={{ color: LUXE_COLORS.lightText }}>Phone</SelectItem>
                  <SelectItem value="website" style={{ color: LUXE_COLORS.lightText }}>Website</SelectItem>
                  <SelectItem value="mobile_app" style={{ color: LUXE_COLORS.lightText }}>Mobile App</SelectItem>
                  <SelectItem value="social_media" style={{ color: LUXE_COLORS.lightText }}>Social Media</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Payment Status
              </label>
              <Select value={formData.payment_status} onValueChange={(value) => setFormData({ ...formData, payment_status: value })}>
                <SelectTrigger 
                  className="h-11"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent 
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  <SelectItem value="unpaid" style={{ color: LUXE_COLORS.bronze }}>Unpaid</SelectItem>
                  <SelectItem value="paid" style={{ color: LUXE_COLORS.emerald }}>Paid</SelectItem>
                  <SelectItem value="partial" style={{ color: LUXE_COLORS.orange }}>Partial</SelectItem>
                  <SelectItem value="refunded" style={{ color: LUXE_COLORS.ruby }}>Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Notes
              </label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Special requests, allergies, or other notes..."
                className="resize-none focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div 
        className="flex justify-end space-x-4 pt-6 pb-6 px-6 border-t flex-shrink-0 -mx-6 -mb-6 mt-6"
        style={{
          backgroundColor: `${LUXE_COLORS.charcoal}50`,
          borderColor: `${LUXE_COLORS.gold}20`
        }}
      >
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="h-11 px-6 transition-all hover:scale-[1.02]"
          style={{
            borderColor: `${LUXE_COLORS.bronze}50`,
            color: LUXE_COLORS.bronze,
            backgroundColor: 'transparent'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = `${LUXE_COLORS.bronze}10`
            e.currentTarget.style.borderColor = LUXE_COLORS.bronze
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.borderColor = `${LUXE_COLORS.bronze}50`
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 px-8 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 hover:scale-[1.02]"
          style={{
            background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
            color: LUXE_COLORS.black,
            border: 'none'
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{entityData ? 'Update Appointment' : 'Book Appointment'}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  )
}