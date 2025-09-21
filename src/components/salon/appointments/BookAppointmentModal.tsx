// ================================================================================
// BOOK APPOINTMENT MODAL
// Smart Code: HERA.UI.SALON.APPOINTMENT.BOOK.MODAL.v1
// POS-style appointment booking modal with service selection and checkout
// ================================================================================

'use client'

import React, { useState, useEffect, useRef } from 'react'
import '@/styles/dialog-overrides.css'
import { format, addMinutes } from 'date-fns'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { universalApi } from '@/lib/universal-api-v2'
import { createDraftAppointment } from '@/lib/appointments/createDraftAppointment'
import { upsertAppointmentLines } from '@/lib/appointments/upsertAppointmentLines'
import { useAvailableSlots } from '@/lib/hooks/useAppointment'
import { createAppointmentsApi } from '@/lib/api/appointments'
import { apiClient } from '@/lib/auth/session'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/luxe-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import {
  Calendar,
  Clock,
  User,
  Plus,
  Minus,
  X,
  Search,
  DollarSign,
  Check,
  Scissors,
  ShoppingBag,
  Move
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookAppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate?: string
  defaultStylistId?: string
}

interface Customer {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    phone?: string
    email?: string
  }
}

interface Service {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    price?: number
    duration_minutes?: number
    category?: string
  }
}

interface Stylist {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    specialties?: string[]
    hourly_rate?: number
  }
}

interface CartItem {
  service: Service
  quantity: number
  price: number
  duration: number
}

interface TimeSlot {
  start: string
  end: string
}

export function BookAppointmentModal({
  open,
  onOpenChange,
  defaultDate,
  defaultStylistId
}: BookAppointmentModalProps) {
  const { organization } = useHERAAuth()
  const organizationId = organization?.id
  const appointmentsApi = createAppointmentsApi(apiClient)
  const { toast } = useToast()

  // Form state
  const [selectedDate, setSelectedDate] = useState(defaultDate || format(new Date(), 'yyyy-MM-dd'))
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null)
  const [notes, setNotes] = useState('')

  // Data state
  const [customers, setCustomers] = useState<Customer[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [stylists, setStylists] = useState<Stylist[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Search state
  const [customerSearch, setCustomerSearch] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')

  // Generate available time slots
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const date = new Date(`${selectedDate}T09:00:00`)
    const endTime = new Date(`${selectedDate}T18:00:00`)

    while (date < endTime) {
      const start = new Date(date)
      const end = new Date(date.getTime() + 30 * 60 * 1000) // 30 min slots

      slots.push({
        start: start.toTimeString().substring(0, 5),
        end: end.toTimeString().substring(0, 5)
      })

      date.setMinutes(date.getMinutes() + 30)
    }

    return slots
  }

  // Computed values
  const filteredCustomers = customers.filter(customer =>
    customer.entity_name.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const filteredServices = services.filter(service =>
    service.entity_name.toLowerCase().includes(serviceSearch.toLowerCase())
  )

  const timeSlots = generateTimeSlots()

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalDuration = cart.reduce((sum, item) => sum + item.duration * item.quantity, 0)

  // Load initial data when modal opens
  useEffect(() => {
    if (!open || !organizationId) return

    const loadData = async () => {
      try {
        setLoading(true)

        // Set organization ID on universalApi
        universalApi.setOrganizationId(organizationId)

        console.log('📊 Loading modal data for org:', organizationId)

        // Load customers
        const customersResponse = await universalApi.read('core_entities', {
          organization_id: organizationId,
          entity_type: 'customer'
        })

        console.log('👥 Customers response:', customersResponse)

        // Load services
        const servicesResponse = await universalApi.read('core_entities', {
          organization_id: organizationId,
          entity_type: 'service'
        })

        console.log('✂️ Services response:', servicesResponse)

        // Load stylists
        const stylistsResponse = await universalApi.read('core_entities', {
          organization_id: organizationId,
          entity_type: 'employee'
        })

        console.log('💇 Stylists response:', stylistsResponse)

        if (customersResponse.success) setCustomers(customersResponse.data || [])
        if (servicesResponse.success) setServices(servicesResponse.data || [])
        if (stylistsResponse.success) setStylists(stylistsResponse.data || [])

        // Set default stylist if provided
        if (defaultStylistId && stylistsResponse.success) {
          const defaultStylist = stylistsResponse.data?.find(s => s.id === defaultStylistId)
          if (defaultStylist) setSelectedStylist(defaultStylist)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load appointment data',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [open, organizationId, defaultStylistId])

  // Cart operations
  const addToCart = (service: Service) => {
    const existingItem = cart.find(item => item.service.id === service.id)

    if (existingItem) {
      updateQuantity(service.id, 1)
    } else {
      setCart([
        ...cart,
        {
          service,
          quantity: 1,
          price: service.metadata?.price || 0,
          duration: service.metadata?.duration_minutes || 30
        }
      ])
    }
  }

  const updateQuantity = (serviceId: string, delta: number) => {
    setCart(
      cart.map(item => {
        if (item.service.id === serviceId) {
          const newQuantity = Math.max(1, item.quantity + delta)
          return { ...item, quantity: newQuantity }
        }
        return item
      })
    )
  }

  const removeFromCart = (serviceId: string) => {
    setCart(cart.filter(item => item.service.id !== serviceId))
  }

  // Save appointment
  const handleSave = async () => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'Organization not found',
        variant: 'destructive'
      })
      return
    }

    if (!selectedCustomer) {
      toast({
        title: 'Error',
        description: 'Please select a customer',
        variant: 'destructive'
      })
      return
    }

    if (!selectedStylist) {
      toast({
        title: 'Error',
        description: 'Please select a stylist',
        variant: 'destructive'
      })
      return
    }

    if (!selectedTime) {
      toast({
        title: 'Error',
        description: 'Please select a time',
        variant: 'destructive'
      })
      return
    }

    if (cart.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one service',
        variant: 'destructive'
      })
      return
    }

    setSaving(true)

    try {
      const startAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString()

      // Create draft appointment
      const { id: appointmentId } = await createDraftAppointment({
        organizationId,
        startAt,
        durationMin: totalDuration,
        customerEntityId: selectedCustomer.id,
        preferredStylistEntityId: selectedStylist.id,
        notes: notes || undefined
      })

      // Create appointment lines
      await upsertAppointmentLines({
        organizationId,
        appointmentId,
        items: cart.map(item => ({
          type: 'SERVICE' as const,
          entityId: item.service.id,
          qty: item.quantity,
          unitAmount: item.price,
          durationMin: item.duration
        }))
      })

      toast({
        title: 'Success',
        description: 'Appointment drafted successfully'
      })

      // Reset form and close modal
      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create appointment',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setSelectedCustomer(null)
    setSelectedStylist(null)
    setSelectedTime('')
    setNotes('')
    setCart([])
    setCustomerSearch('')
    setServiceSearch('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] sm:w-[90vw] md:w-[85vw] h-[85vh] max-h-[85vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0 bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-950/20 dark:to-pink-950/20 relative">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 flex items-center justify-center shadow-lg">
                <Calendar className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">
                  Book New Appointment
                </h2>
                <p className="text-sm text-muted-foreground font-normal">
                  Schedule a service appointment for your customer
                </p>
              </div>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close dialog</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading appointment data...</p>
            </div>
          </div>
        ) : (
          <div className="modal-scroll-content flex-1 overflow-y-scroll overflow-x-hidden">
            <div className="p-6 pb-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Left Column - Customer & Time Selection */}
                <div className="space-y-4">
                  <Card className="p-4 border-2 hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
                    <h3 className="font-medium mb-3 flex items-center gap-2 text-foreground">
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                        <User className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      Customer Details
                    </h3>
                    {selectedCustomer ? (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">
                              {selectedCustomer.entity_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {selectedCustomer.metadata?.phone || 'No phone'}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedCustomer(null)}
                            className="text-foreground hover:bg-accent"
                          >
                            Change
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search customers..."
                            value={customerSearch}
                            onChange={e => setCustomerSearch(e.target.value)}
                            className="pl-9"
                          />
                        </div>

                        {customerSearch && (
                          <ScrollArea className="h-32">
                            {filteredCustomers.map(customer => (
                              <div
                                key={customer.id}
                                className="p-2 hover:bg-muted rounded cursor-pointer"
                                onClick={() => {
                                  setSelectedCustomer(customer)
                                  setCustomerSearch('')
                                }}
                              >
                                <p className="font-medium text-foreground">
                                  {customer.entity_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {customer.metadata?.phone || 'No phone'}
                                </p>
                              </div>
                            ))}
                          </ScrollArea>
                        )}
                      </div>
                    )}
                  </Card>

                  <Card className="p-4 border-2 hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
                    <h3 className="font-medium mb-3 flex items-center gap-2 text-foreground">
                      <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                        <User className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                      </div>
                      Stylist Selection
                    </h3>
                    <Select
                      value={selectedStylist?.id || ''}
                      onValueChange={value => {
                        const stylist = stylists.find(s => s.id === value)
                        setSelectedStylist(stylist || null)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a stylist" />
                      </SelectTrigger>
                      <SelectContent className="hera-select-content">
                        {stylists.map(stylist => (
                          <SelectItem key={stylist.id} value={stylist.id}>
                            {stylist.entity_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Card>

                  <Card className="p-4 border-2 hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
                    <h3 className="font-medium mb-3 flex items-center gap-2 text-foreground">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      Date & Time
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={selectedDate}
                          onChange={e => setSelectedDate(e.target.value)}
                          min={format(new Date(), 'yyyy-MM-dd')}
                        />
                      </div>

                      <div>
                        <Label>Time</Label>
                        <Select value={selectedTime} onValueChange={setSelectedTime}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent className="hera-select-content">
                            {timeSlots.map(slot => (
                              <SelectItem key={slot.start} value={slot.start}>
                                {slot.start}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Notes (Optional)</Label>
                        <Textarea
                          placeholder="Any special requests..."
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Center Column - Service Selection */}
                <div className="space-y-4">
                  <Card className="p-4 border-2 hover:border-violet-200 dark:hover:border-violet-800 transition-colors h-fit">
                    <h3 className="font-medium mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                        <Scissors className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      Select Services
                    </h3>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search services..."
                        value={serviceSearch}
                        onChange={e => setServiceSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    <ScrollArea className="h-[300px] lg:h-[400px]">
                      <div className="space-y-2">
                        {filteredServices.map(service => (
                          <div
                            key={service.id}
                            className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => addToCart(service)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-foreground">
                                  {service.entity_name}
                                </p>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                    <span>
                                      {service.metadata?.duration_minutes || 30} min
                                    </span>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3 text-muted-foreground" />
                                    <span>
                                      AED {service.metadata?.price || 0}
                                    </span>
                                  </span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={e => {
                                  e.stopPropagation()
                                  addToCart(service)
                                }}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </Card>
                </div>

                {/* Right Column - Cart & Summary */}
                <div className="space-y-4 lg:col-span-1">
                  <Card className="p-4 border-2 hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
                    <h3 className="font-medium mb-3 flex items-center gap-2 text-foreground">
                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      Selected Services
                      {cart.length > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {cart.length} item{cart.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </h3>

                    {cart.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No services selected
                      </p>
                    ) : (
                      <ScrollArea className="h-48 lg:h-64">
                        <div className="space-y-3">
                          {cart.map(item => (
                            <div
                              key={item.service.id}
                              className="p-3 border rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-medium text-sm text-foreground">
                                  {item.service.entity_name}
                                </p>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeFromCart(item.service.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => updateQuantity(item.service.id, -1)}
                                    className="h-6 w-6"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="w-6 text-center text-sm">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => updateQuantity(item.service.id, 1)}
                                    className="h-6 w-6"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>

                                <div className="text-sm text-muted-foreground font-medium">
                                  AED {(item.price * item.quantity).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </Card>

                  <Card className="p-4 border-2 border-violet-400 dark:border-violet-600 bg-violet-50 dark:bg-violet-950/30">
                    <h3 className="font-medium mb-3 flex items-center gap-2 text-foreground">
                      <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-primary-foreground" />
                      </div>
                      Booking Summary
                    </h3>
                    <div className="space-y-2 text-sm">
                      {selectedCustomer && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Customer:</span>
                          <span className="font-medium text-foreground">
                            {selectedCustomer.entity_name}
                          </span>
                        </div>
                      )}

                      {selectedStylist && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Stylist:</span>
                          <span className="font-medium text-foreground">
                            {selectedStylist.entity_name}
                          </span>
                        </div>
                      )}

                      {selectedDate && selectedTime && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time:</span>
                          <span className="font-medium text-foreground">
                            {format(new Date(`${selectedDate}T${selectedTime}`), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium text-foreground">
                          {totalDuration} minutes
                        </span>
                      </div>

                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-lg font-semibold">
                          <span className="text-foreground">Total:</span>
                          <span className="text-violet-700 dark:text-violet-300">
                            AED {totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleSave}
                        disabled={
                          !selectedCustomer ||
                          !selectedStylist ||
                          !selectedTime ||
                          cart.length === 0 ||
                          saving
                        }
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                            Booking...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Confirm Booking
                          </>
                        )}
                      </Button>

                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => {
                          resetForm()
                          onOpenChange(false)
                        }}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
