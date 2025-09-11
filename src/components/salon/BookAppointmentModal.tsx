'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Calendar,
  Clock,
  User,
  Plus,
  Search,
  AlertCircle,
  Scissors,
  DollarSign,
  FileText,
  Paperclip,
  Lock,
  ChevronRight,
  Loader2,
  CalendarX,
  CheckCircle,
  Star,
  Sparkles,
  Timer,
  Users,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, addMinutesSafe } from '@/lib/date-utils'
import { parseISO, isWithinInterval } from 'date-fns'
import { SchedulingAssistant } from './SchedulingAssistant'
import { useToast } from '@/hooks/use-toast'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { universalConfigService } from '@/lib/universal-config/universal-config-service'
import { universalApi } from '@/lib/universal-api'

interface Service {
  id: string
  entity_name: string
  entity_code: string
  smart_code: string
  duration: number
  price: number
  buffer_before: number
  buffer_after: number
  category?: string
  skills_required?: string[]
}

interface Stylist {
  id: string
  entity_name: string
  entity_code: string
  smart_code: string
  avatar?: string
  skills: string[]
  level: 'junior' | 'senior' | 'celebrity'
  working_hours?: any
  allow_double_book?: boolean
}

interface Customer {
  id: string
  entity_name: string
  entity_code: string
  smart_code: string
  phone?: string
  email?: string
  vip_level?: string
  preferences?: any
}

interface BookAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onBookingComplete?: (appointment: any) => void
  preSelectedDate?: Date
  preSelectedTime?: string
  preSelectedStylist?: string
  preSelectedService?: string
}

export function BookAppointmentModal({
  isOpen,
  onClose,
  onBookingComplete,
  preSelectedDate,
  preSelectedTime,
  preSelectedStylist,
  preSelectedService
}: BookAppointmentModalProps) {
  const { currentOrganization } = useMultiOrgAuth()
  const { toast } = useToast()
  const organizationId = currentOrganization?.id || 'demo-salon'

  // Form state - Default to assistant tab when pre-selected time is provided
  const [activeTab, setActiveTab] = useState<'event' | 'assistant'>(preSelectedTime ? 'assistant' : 'event')
  const [title, setTitle] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null)
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(preSelectedDate || new Date())
  const [startTime, setStartTime] = useState(preSelectedTime || '10:00')
  const [isHold, setIsHold] = useState(false)
  const [notes, setNotes] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isPrivate, setIsPrivate] = useState(true)

  // UI state
  const [searchingCustomer, setSearchingCustomer] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [conflicts, setConflicts] = useState<any[]>([])

  // Data state
  const [stylists, setStylists] = useState<Stylist[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])

  // Fetch salon data on mount
  useEffect(() => {
    const fetchSalonData = async () => {
      if (!organizationId) return
      
      setLoadingData(true)
      universalApi.setOrganizationId(organizationId)
      
      try {
        // Fetch stylists (staff entities)
        const stylistsResponse = await universalApi.readEntities({
          entity_type: 'staff',
          organization_id: organizationId
        })
        
        if (stylistsResponse && stylistsResponse.data) {
          const formattedStylists = stylistsResponse.data.map((staff: any) => ({
            id: staff.id,
            entity_name: staff.entity_name,
            entity_code: staff.entity_code || staff.id,
            smart_code: staff.smart_code || 'HERA.SALON.STAFF.v1',
            avatar: staff.entity_name?.charAt(0) || 'S',
            skills: staff.metadata?.skills || [],
            level: staff.metadata?.level || 'senior',
            allow_double_book: staff.metadata?.allow_double_book || false
          }))
          setStylists(formattedStylists)
        }

        // Fetch services
        const servicesResponse = await universalApi.readEntities({
          entity_type: 'service',
          organization_id: organizationId
        })
        
        if (servicesResponse && servicesResponse.data) {
          const formattedServices = servicesResponse.data.map((service: any) => ({
            id: service.id,
            entity_name: service.entity_name,
            entity_code: service.entity_code || service.id,
            smart_code: service.smart_code || 'HERA.SALON.SERVICE.v1',
            duration: service.metadata?.duration || 60,
            price: service.metadata?.price || 0,
            buffer_before: service.metadata?.buffer_before || 5,
            buffer_after: service.metadata?.buffer_after || 10,
            category: service.metadata?.category || 'General',
            skills_required: service.metadata?.skills_required || []
          }))
          setServices(formattedServices)
        }

        // Fetch recent customers
        const customersResponse = await universalApi.readEntities({
          entity_type: 'customer',
          organization_id: organizationId,
          limit: 50
        })
        
        if (customersResponse && customersResponse.data) {
          const formattedCustomers = customersResponse.data.map((customer: any) => ({
            id: customer.id,
            entity_name: customer.entity_name,
            entity_code: customer.entity_code || customer.id,
            smart_code: customer.smart_code || 'HERA.SALON.CRM.CUSTOMER.v1',
            phone: customer.metadata?.phone || '',
            email: customer.metadata?.email || '',
            vip_level: customer.metadata?.vip_level || null,
            preferences: customer.metadata?.preferences || {}
          }))
          setCustomers(formattedCustomers)
        }
      } catch (error) {
        console.error('Failed to fetch salon data:', error)
        toast({
          title: 'Failed to load data',
          description: 'Unable to fetch salon data. Please try again.',
          variant: 'destructive'
        })
      } finally {
        setLoadingData(false)
      }
    }

    fetchSalonData()
  }, [organizationId, toast])

  // Use real data if available, otherwise fall back to empty arrays
  useEffect(() => {
    // If no data loaded and we have mock data for demo, use it
    if (!loadingData && stylists.length === 0 && organizationId === 'demo-salon') {
      // Demo data for testing
      setStylists([
        {
          id: 'rocky',
          entity_name: 'Rocky',
          entity_code: 'STAFF-001',
          smart_code: 'HERA.SALON.STAFF.CELEBRITY.v1',
          avatar: 'R',
          skills: ['Brazilian Blowout', 'Keratin', 'Bridal', 'Color Specialist'],
          level: 'celebrity',
          allow_double_book: false
        }
      ])
      
      setServices([
        {
          id: 'srv-1',
          entity_name: 'Brazilian Blowout',
          entity_code: 'SRV-001',
          smart_code: 'HERA.SALON.SERVICE.CHEMICAL.BRAZILIAN.v1',
          duration: 240,
          price: 500,
          buffer_before: 15,
          buffer_after: 30,
          category: 'Chemical Treatment',
          skills_required: ['Brazilian Blowout']
        }
      ])
    }
  }, [loadingData, stylists.length, organizationId])

  // Initialize selected stylist from prop
  useEffect(() => {
    if (preSelectedStylist && !selectedStylist) {
      const stylist = stylists.find(s => s.id === preSelectedStylist)
      if (stylist) {
        setSelectedStylist(stylist)
      }
    }
  }, [preSelectedStylist, selectedStylist, stylists])


  // Calculate total duration and price
  const totalDuration = selectedServices.reduce((sum, service) => 
    sum + service.duration + service.buffer_before + service.buffer_after, 0
  )
  const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0)
  const endTime = startTime ? formatDate(
    addMinutesSafe(
      parseISO(`${formatDate(selectedDate, 'yyyy-MM-dd')}T${startTime}`),
      totalDuration
    ),
    'HH:mm'
  ) : ''

  // Auto-generate title
  useEffect(() => {
    if (selectedServices.length > 0 && selectedCustomer) {
      const serviceNames = selectedServices.map(s => s.entity_name).join(', ')
      setTitle(`${serviceNames} — ${selectedCustomer.entity_name}`)
    }
  }, [selectedServices, selectedCustomer])

  // Check for conflicts when time/services change
  const checkConflicts = useCallback(async () => {
    if (!selectedStylist || !startTime || selectedServices.length === 0) return

    try {
      // In real implementation, call API to check conflicts
      // const response = await fetch('/api/availability', { ... })
      // For now, mock no conflicts
      setConflicts([])
    } catch (error) {
      console.error('Failed to check conflicts:', error)
    }
  }, [selectedStylist, startTime, selectedServices])

  useEffect(() => {
    const debounce = setTimeout(() => {
      checkConflicts()
    }, 500)
    return () => clearTimeout(debounce)
  }, [checkConflicts])

  // Handle service selection
  const toggleService = (service: Service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id)
      if (exists) {
        return prev.filter(s => s.id !== service.id)
      }
      return [...prev, service]
    })
  }

  // Handle customer search
  const searchCustomers = useCallback(async (query: string) => {
    if (query.length < 2) return
    
    setSearchingCustomer(true)
    try {
      // Search customers via universal API
      const searchResponse = await universalApi.readEntities({
        entity_type: 'customer',
        organization_id: organizationId,
        search: query
      })
      
      if (searchResponse && searchResponse.data) {
        const searchResults = searchResponse.data.map((customer: any) => ({
          id: customer.id,
          entity_name: customer.entity_name,
          entity_code: customer.entity_code || customer.id,
          smart_code: customer.smart_code || 'HERA.SALON.CRM.CUSTOMER.v1',
          phone: customer.metadata?.phone || '',
          email: customer.metadata?.email || '',
          vip_level: customer.metadata?.vip_level || null,
          preferences: customer.metadata?.preferences || {}
        }))
        setCustomers(searchResults)
      }
    } catch (error) {
      console.error('Failed to search customers:', error)
      // Fall back to local search
      const filtered = customers.filter(c => 
        c.entity_name.toLowerCase().includes(query.toLowerCase()) ||
        c.phone?.includes(query) ||
        c.email?.toLowerCase().includes(query.toLowerCase())
      )
      setCustomers(filtered)
    } finally {
      setSearchingCustomer(false)
    }
  }, [organizationId])

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchCustomers(customerSearch)
    }, 300)
    return () => clearTimeout(debounce)
  }, [customerSearch, searchCustomers])

  // Handle booking
  const handleBook = async () => {
    if (!selectedCustomer || !selectedStylist || selectedServices.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please select a customer, stylist, and at least one service.',
        variant: 'destructive'
      })
      return
    }

    if (conflicts.length > 0) {
      toast({
        title: 'Time Conflict',
        description: 'The selected time conflicts with another appointment.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      // Check booking rules via UCR before creating appointment
      universalConfigService.setOrganizationId(organizationId)
      
      const bookingContext = {
        organization_id: organizationId,
        business_type: 'salon',
        customer_id: selectedCustomer.id,
        customer_segments: selectedCustomer.vip_level ? [`vip_${selectedCustomer.vip_level}`] : ['regular'],
        specialist_id: selectedStylist.id,
        service_ids: selectedServices.map(s => s.id),
        appointment_time: `${formatDate(selectedDate, 'yyyy-MM-dd')}T${startTime}:00Z`,
        appointment_value: totalPrice,
        now: new Date(),
        lead_minutes: (new Date(`${formatDate(selectedDate, 'yyyy-MM-dd')}T${startTime}:00Z`).getTime() - new Date().getTime()) / (1000 * 60)
      }

      // Check booking availability rules
      const availabilityDecision = await universalConfigService.decide({
        family: 'HERA.UNIV.CONFIG.BOOKING.AVAILABILITY',
        context: bookingContext
      })

      console.log('UCR Booking Decision:', availabilityDecision)

      // Apply UCR decision
      if (availabilityDecision.decision === 'unavailable') {
        toast({
          title: 'Booking Not Available',
          description: availabilityDecision.reason || 'This time slot is not available according to salon policies.',
          variant: 'destructive'
        })
        return
      }

      // Check pricing rules for any adjustments
      const pricingDecision = await universalConfigService.decide({
        family: 'HERA.UNIV.CONFIG.PRICING.DISCOUNT',
        context: bookingContext,
        inputs: { original_price: totalPrice }
      })

      console.log('UCR Pricing Decision:', pricingDecision)

      // Apply pricing adjustments if any
      const finalPrice = pricingDecision.payload?.final_price || totalPrice
      const discountApplied = pricingDecision.payload?.total_discount || 0

      if (discountApplied > 0) {
        toast({
          title: 'Discount Applied!',
          description: `${pricingDecision.reason} - AED ${discountApplied.toFixed(0)} discount applied.`,
          variant: 'default'
        })
      }

      // Create appointment transaction
      const appointmentData = {
        organization_id: organizationId,
        transaction_type: 'appointment',
        transaction_date: `${formatDate(selectedDate, 'yyyy-MM-dd')}T${startTime}:00Z`,
        source_entity_id: selectedCustomer.id,
        target_entity_id: selectedStylist.id,
        total_amount: finalPrice,
        transaction_status: isHold ? 'hold' : 'confirmed',
        smart_code: 'HERA.SALON.CALENDAR.APPOINTMENT.v1',
        business_context: {
          end_time: `${formatDate(selectedDate, 'yyyy-MM-dd')}T${endTime}:00Z`,
          hold: isHold,
          private: isPrivate
        },
        metadata: {
          title,
          notes
        }
      }

      // Create appointment transaction using universalApi
      universalApi.setOrganizationId(organizationId)
      
      const response = await universalApi.createTransaction({
        organization_id: organizationId,
        transaction_type: 'appointment',
        transaction_date: `${formatDate(selectedDate, 'yyyy-MM-dd')}T${startTime}:00Z`,
        source_entity_id: selectedCustomer.id,
        target_entity_id: selectedStylist.id,
        total_amount: finalPrice,
        transaction_status: isHold ? 'hold' : 'confirmed',
        smart_code: 'HERA.SALON.CALENDAR.APPOINTMENT.v1',
        business_context: {
          end_time: `${formatDate(selectedDate, 'yyyy-MM-dd')}T${endTime}:00Z`,
          hold: isHold,
          private: isPrivate,
          // Add salon-specific fields
          branch_id: organizationId, // TODO: Get actual branch if multi-location
          service_category: selectedServices[0]?.category || 'general',
          skills_required: selectedServices.flatMap(s => s.skills_required || []),
          estimated_duration: totalDuration,
          buffer_time: selectedServices.reduce((sum, s) => sum + s.buffer_before + s.buffer_after, 0),
          ucr_discount_applied: discountApplied,
          ucr_final_price: finalPrice
        },
        metadata: {
          title,
          notes,
          discount_reason: pricingDecision.reason || null,
          original_price: totalPrice
        }
      })

      if (!response || !response.data) {
        throw new Error('Failed to create appointment transaction')
      }

      const transactionId = response.data.id

      // Create transaction lines for each service
      for (const [index, service] of selectedServices.entries()) {
        await universalApi.createTransactionLine({
          organization_id: organizationId,
          transaction_id: transactionId,
          line_number: index + 1,
          line_entity_id: service.id,
          line_type: 'service',
          description: service.entity_name,
          quantity: 1,
          unit_amount: service.price,
          line_amount: service.price,
          smart_code: 'HERA.SALON.CALENDAR.APPOINTMENT.LINE.SERVICE.v1',
          line_data: {
            duration_minutes: service.duration,
            buffer_before: service.buffer_before,
            buffer_after: service.buffer_after,
            category: service.category
          }
        })
      }

      // Save notes as dynamic data if any
      if (notes) {
        await universalApi.setDynamicField(
          transactionId,
          'appointment_notes',
          notes,
          'HERA.SALON.NOTES.APPOINTMENT.v1'
        )
      }

      toast({
        title: 'Appointment Booked',
        description: `${title} on ${formatDate(selectedDate, 'MMM d')} at ${startTime}${discountApplied > 0 ? ` - Final price: AED ${finalPrice.toFixed(0)} (${discountApplied.toFixed(0)} discount applied)` : ` - Total: AED ${finalPrice.toFixed(0)}`}`,
      })

      onBookingComplete?.({
        id: transactionId,
        transaction_id: transactionId,
        ...appointmentData,
        services: selectedServices,
        customer: selectedCustomer,
        stylist: selectedStylist
      })
      
      onClose()
    } catch (error) {
      console.error('Failed to book appointment:', error)
      toast({
        title: 'Booking Failed',
        description: 'Unable to book the appointment. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle slot selection from scheduling assistant
  const handleSlotSelect = (slot: { start: string; end: string }) => {
    const startDate = parseISO(slot.start)
    setSelectedDate(startDate)
    setStartTime(formatDate(startDate, 'HH:mm'))
    setActiveTab('event')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[90vw] h-[85vh] max-h-[900px] p-0 bg-background border-border shadow-2xl overflow-hidden !top-[45%] dark:bg-gray-900 dark:border-gray-700">
        <DialogHeader className="px-6 py-3 border-b border-border bg-card flex flex-row items-center justify-between dark:bg-gray-800 dark:border-gray-700">
          <DialogTitle className="text-base font-normal text-card-foreground dark:text-white">
            New event
          </DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-sm text-muted-foreground">Loading salon data...</p>
            </div>
          </div>
        ) : (
        <>
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 bg-[#1b1b1b]">
          <TabsList className="px-6 bg-transparent border-0 gap-0">
            <TabsTrigger value="event" className="text-sm font-normal text-[#b3b3b3] data-[state=active]:text-[#e1e1e1] data-[state=active]:border-b-2 data-[state=active]:border-[#4c7cf0] rounded-none px-4 pb-3">
              Event
            </TabsTrigger>
            <TabsTrigger value="assistant" className="text-sm font-normal text-[#b3b3b3] data-[state=active]:text-[#e1e1e1] data-[state=active]:border-b-2 data-[state=active]:border-[#4c7cf0] rounded-none px-4 pb-3">
              Scheduling Assistant
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden bg-[#1b1b1b]">
            <TabsContent value="event" className="h-full m-0">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] h-full">
                {/* Left Column - Form */}
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-0">
                    {/* Title */}
                    <div className="mb-6">
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Add a title"
                        className="border-0 border-b border-border rounded-none bg-transparent text-foreground placeholder-muted-foreground text-lg focus:border-b-2 focus:border-primary px-0 pb-2 dark:bg-transparent dark:text-white dark:placeholder-gray-400"
                        style={{ backgroundColor: 'transparent' }}
                      />
                    </div>

                    {/* Customer Selection */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 py-3 border-b border-border dark:border-gray-700">
                        <User className="w-5 h-5 text-muted-foreground dark:text-gray-400" />
                        <div className="flex-1">
                          <Input
                            id="customer"
                            placeholder="Invite attendees"
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="border-0 bg-transparent text-foreground placeholder-muted-foreground text-sm p-0 focus:ring-0 dark:bg-transparent dark:text-white dark:placeholder-gray-400"
                            style={{ backgroundColor: 'transparent' }}
                          />
                        </div>
                        {searchingCustomer && (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground dark:text-gray-400" />
                        )}
                        <span className="text-sm text-gray-500 dark:text-gray-400">Optional</span>
                      </div>
                        
                      {/* Customer List */}
                      {(customerSearch || selectedCustomer) && (
                        <div className="mt-2 space-y-1">
                          {customers.map(customer => (
                            <div
                              key={customer.id}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-all text-sm",
                                selectedCustomer?.id === customer.id
                                  ? "bg-accent text-accent-foreground dark:bg-gray-800 dark:text-white"
                                  : "hover:bg-accent text-muted-foreground dark:hover:bg-gray-800 dark:text-gray-300"
                              )}
                              onClick={() => setSelectedCustomer(customer)}
                            >
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                  {customer.entity_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-normal">{customer.entity_name}</p>
                                <p className="text-xs text-muted-foreground dark:text-gray-400">{customer.email}</p>
                              </div>
                              {selectedCustomer?.id === customer.id && (
                                <X className="w-4 h-4 text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-white" 
                                   onClick={(e) => {
                                     e.stopPropagation()
                                     setSelectedCustomer(null)
                                   }}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stylist & Service Selection - Combined Section */}
                    <div className="mb-6 space-y-4">
                      <div className="flex items-center gap-3 py-3 border-b border-[#323232]">
                        <Scissors className="w-5 h-5 text-[#7a7a7a]" />
                        <div className="flex-1">
                          <p className="text-sm text-[#e1e1e1]">Appointment Details</p>
                        </div>
                      </div>
                      
                      {/* Stylist Dropdown */}
                      <Select
                        value={selectedStylist?.id}
                        onValueChange={(id) => setSelectedStylist(stylists.find(s => s.id === id) || null)}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white h-10 text-sm" style={{ backgroundColor: '#2b2b2b' }}>
                          <SelectValue placeholder="Select a stylist" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600" style={{ backgroundColor: '#2b2b2b' }}>
                          {stylists.map(stylist => (
                            <SelectItem key={stylist.id} value={stylist.id} className="text-popover-foreground hover:bg-accent focus:bg-accent dark:text-white dark:hover:bg-gray-700 dark:focus:bg-gray-700 hera-select-item">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {stylist.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{stylist.entity_name}</span>
                                <Badge variant="secondary" className="ml-auto text-xs">
                                  {stylist.level}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Service Selection */}
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Select services</p>
                        {services.map(service => (
                          <div
                            key={service.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded cursor-pointer transition-all",
                              selectedServices.find(s => s.id === service.id)
                                ? "bg-accent border border-primary dark:bg-gray-800 dark:border-blue-500"
                                : "bg-card border border-border hover:border-primary/50 dark:bg-gray-800 dark:border-gray-600 dark:hover:border-blue-500/50"
                            )}
                            onClick={() => toggleService(service)}
                          >
                            <Checkbox
                              checked={!!selectedServices.find(s => s.id === service.id)}
                              className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary dark:border-gray-400 dark:data-[state=checked]:bg-blue-500 dark:data-[state=checked]:border-blue-500"
                            />
                            <div className="flex-1">
                              <p className="text-sm text-card-foreground dark:text-white">{service.entity_name}</p>
                              <p className="text-xs text-muted-foreground dark:text-gray-400">
                                {service.duration} min • AED {service.price}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Service Summary */}
                      {selectedServices.length > 0 && (
                        <div className="mt-3 p-3 bg-secondary rounded text-sm dark:bg-gray-700">
                          <div className="flex justify-between items-center">
                            <span className="text-secondary-foreground dark:text-gray-300">
                              Duration: {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                            </span>
                            <span className="text-foreground font-medium dark:text-white">
                              Total: AED {totalPrice}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Date and Time */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 py-3 border-b border-[#323232]">
                        <Clock className="w-5 h-5 text-[#7a7a7a]" />
                        <div className="flex items-center gap-4 flex-1">
                          <Input
                            type="date"
                            value={formatDate(selectedDate, 'yyyy-MM-dd')}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            className="border-0 bg-background text-foreground text-sm p-0 focus:ring-0 dark:bg-gray-800 dark:text-white dark:[color-scheme:dark]"
                          />
                          <span className="text-[#7a7a7a]">to</span>
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              className="border-0 bg-background text-foreground text-sm p-0 focus:ring-0 w-20 dark:bg-gray-800 dark:text-white dark:[color-scheme:dark]"
                            />
                            <span className="text-[#7a7a7a]">-</span>
                            <Input
                              type="time"
                              value={endTime}
                              disabled
                              className="border-0 bg-background text-muted-foreground text-sm p-0 focus:ring-0 w-20 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:[color-scheme:dark]"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#4c7cf0] hover:text-[#6b95ff] hover:bg-transparent p-0 h-auto font-normal"
                          >
                            All day
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Additional Options */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 py-3 border-b border-[#323232]">
                        <FileText className="w-5 h-5 text-[#7a7a7a]" />
                        <Input
                          placeholder="Add description"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="border-0 bg-background text-foreground placeholder-muted-foreground text-sm p-0 focus:ring-0 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Busy Toggle */}
                    <div className="flex items-center gap-3 mb-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={!isPrivate}
                          onCheckedChange={(checked) => setIsPrivate(!checked)}
                          className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary dark:border-gray-400 dark:data-[state=checked]:bg-blue-500 dark:data-[state=checked]:border-blue-500"
                        />
                        <span className="text-sm text-foreground dark:text-white">Show as busy</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer ml-6">
                        <Checkbox
                          checked={isHold}
                          onCheckedChange={(checked) => setIsHold(!!checked)}
                          className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary dark:border-gray-400 dark:data-[state=checked]:bg-blue-500 dark:data-[state=checked]:border-blue-500"
                        />
                        <span className="text-sm text-foreground dark:text-white">Tentative booking</span>
                      </label>
                    </div>

                  </div>
                </ScrollArea>

                {/* Right Column - Calendar View */}
                <div className="hidden lg:block h-full bg-[#252525] border-l border-[#323232]">
                  <div className="p-4 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-normal text-[#e1e1e1]">
                        {formatDate(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </h3>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-accent dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
                          onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000))}
                        >
                          ‹
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-accent dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
                          onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000))}
                        >
                          ›
                        </Button>
                      </div>
                    </div>
                    
                    {/* Time slots grid */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="relative">
                        {/* Time labels */}
                        <div className="absolute left-0 top-0 w-12">
                          {[...Array(12)].map((_, i) => (
                            <div key={i} className="h-16 text-xs text-[#7a7a7a] pt-1">
                              {i + 9}:00
                            </div>
                          ))}
                        </div>
                        
                        {/* Calendar grid */}
                        <div className="ml-14 border-l border-[#323232]">
                          {/* Current time slot highlight */}
                          {startTime && (
                            <div
                              className="absolute left-14 right-4 bg-[#4c7cf0] rounded"
                              style={{
                                top: `${((parseInt(startTime.split(':')[0]) - 9) * 64) + 16}px`,
                                height: `${(totalDuration / 60) * 64}px`
                              }}
                            >
                              <div className="p-2 text-white">
                                <p className="text-xs font-medium">
                                  {selectedServices.length > 0 ? selectedServices[0].entity_name : 'New Appointment'}
                                </p>
                                <p className="text-xs opacity-80">
                                  {startTime} - {endTime}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {/* Hour lines */}
                          {[...Array(12)].map((_, i) => (
                            <div key={i} className="h-16 border-t border-[#323232]" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="assistant" className="h-full p-6 m-0">
              {preSelectedTime && !selectedStylist && !selectedServices.length && (
                <Alert className="mb-4 border-purple-500 bg-purple-500/20">
                  <AlertCircle className="h-4 w-4 text-purple-400" />
                  <AlertDescription className="text-purple-200">
                    <strong>Selected time slot:</strong> {preSelectedTime} on {formatDate(selectedDate, 'MMM d, yyyy')}
                    <br />
                    Please select a stylist and services to check availability for this time.
                  </AlertDescription>
                </Alert>
              )}
              {selectedStylist && selectedServices.length > 0 ? (
                <SchedulingAssistant
                  organizationId={organizationId}
                  stylistId={selectedStylist.id}
                  services={selectedServices}
                  selectedDate={selectedDate}
                  onSlotSelect={handleSlotSelect}
                  preSelectedTime={preSelectedTime}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-lg font-medium mb-2 text-white">Select Stylist and Services</h3>
                    <p className="text-gray-300">
                      Please select a stylist and at least one service to view availability
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white hover:border-gray-500"
                      onClick={() => setActiveTab('event')}
                    >
                      Go to Event Tab
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
        
        <div className="px-6 py-3 border-t border-[#323232] bg-[#2b2b2b] flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Additional options */}
            <Button 
              variant="ghost" 
              size="sm"
              className="text-[#b3b3b3] hover:text-[#e1e1e1] hover:bg-[#323232] h-8"
            >
              <ChevronRight className="w-4 h-4 mr-1" />
              Response options
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                15 minutes before
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {conflicts.length > 0 && (
              <span className="text-xs text-red-400 mr-2">Conflict detected</span>
            )}
            <Button
              onClick={handleBook}
              disabled={loading || !selectedCustomer || !selectedStylist || selectedServices.length === 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-4 text-sm disabled:bg-secondary disabled:text-muted-foreground dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
        </>
        )}
      </DialogContent>
    </Dialog>
  )
}