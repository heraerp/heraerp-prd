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
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, addMinutes, parseISO, isWithinInterval } from 'date-fns'
import { SchedulingAssistant } from './SchedulingAssistant'
import { useToast } from '@/hooks/use-toast'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

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
  const [conflicts, setConflicts] = useState<any[]>([])

  // Mock data - stylists
  const stylists: Stylist[] = [
    {
      id: 'rocky',
      entity_name: 'Rocky',
      entity_code: 'STAFF-001',
      smart_code: 'HERA.SALON.STAFF.CELEBRITY.v1',
      avatar: 'R',
      skills: ['Brazilian Blowout', 'Keratin', 'Bridal', 'Color Specialist'],
      level: 'celebrity',
      allow_double_book: false
    },
    {
      id: 'vinay',
      entity_name: 'Vinay',
      entity_code: 'STAFF-002',
      smart_code: 'HERA.SALON.STAFF.SENIOR.v1',
      avatar: 'V',
      skills: ['Cut & Style', 'Color', 'Men\'s Styling'],
      level: 'senior',
      allow_double_book: false
    },
    {
      id: 'maya',
      entity_name: 'Maya',
      entity_code: 'STAFF-003',
      smart_code: 'HERA.SALON.STAFF.SENIOR.v1',
      avatar: 'M',
      skills: ['Color Specialist', 'Balayage', 'Highlights'],
      level: 'senior',
      allow_double_book: true
    }
  ]

  // Initialize selected stylist from prop
  useEffect(() => {
    if (preSelectedStylist && !selectedStylist) {
      const stylist = stylists.find(s => s.id === preSelectedStylist)
      if (stylist) {
        setSelectedStylist(stylist)
      }
    }
  }, [preSelectedStylist, selectedStylist, stylists])

  // Mock data - customers
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: 'cust-1',
      entity_name: 'Sarah Johnson',
      entity_code: 'CUST-001',
      smart_code: 'HERA.SALON.CRM.CUSTOMER.VIP.v1',
      phone: '+971 55 123 4567',
      email: 'sarah.j@email.com',
      vip_level: 'platinum'
    },
    {
      id: 'cust-2',
      entity_name: 'Emma Davis',
      entity_code: 'CUST-002',
      smart_code: 'HERA.SALON.CRM.CUSTOMER.v1',
      phone: '+971 55 234 5678',
      email: 'emma.d@email.com',
      vip_level: 'gold'
    }
  ])

  const services: Service[] = [
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
    },
    {
      id: 'srv-2',
      entity_name: 'Keratin Treatment',
      entity_code: 'SRV-002',
      smart_code: 'HERA.SALON.SERVICE.CHEMICAL.KERATIN.v1',
      duration: 180,
      price: 350,
      buffer_before: 10,
      buffer_after: 20,
      category: 'Chemical Treatment',
      skills_required: ['Keratin']
    },
    {
      id: 'srv-3',
      entity_name: 'Premium Cut & Style',
      entity_code: 'SRV-003',
      smart_code: 'HERA.SALON.SERVICE.CUT.PREMIUM.v1',
      duration: 90,
      price: 150,
      buffer_before: 5,
      buffer_after: 10,
      category: 'Cut & Style',
      skills_required: ['Cut & Style']
    },
    {
      id: 'srv-4',
      entity_name: 'Color & Highlights',
      entity_code: 'SRV-004',
      smart_code: 'HERA.SALON.SERVICE.COLOR.HIGHLIGHTS.v1',
      duration: 180,
      price: 280,
      buffer_before: 10,
      buffer_after: 15,
      category: 'Color',
      skills_required: ['Color Specialist']
    }
  ]

  // Calculate total duration and price
  const totalDuration = selectedServices.reduce((sum, service) => 
    sum + service.duration + service.buffer_before + service.buffer_after, 0
  )
  const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0)
  const endTime = startTime ? format(
    addMinutes(
      parseISO(`${format(selectedDate, 'yyyy-MM-dd')}T${startTime}`),
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
      // In real implementation, call API
      // const response = await fetch(`/api/entities?entity_type=customer&q=${query}&organization_id=${organizationId}`)
      // Mock search
      const filtered = customers.filter(c => 
        c.entity_name.toLowerCase().includes(query.toLowerCase()) ||
        c.phone?.includes(query) ||
        c.email?.toLowerCase().includes(query.toLowerCase())
      )
      // For demo, just use existing customers
    } finally {
      setSearchingCustomer(false)
    }
  }, [customers, organizationId])

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
      // Create appointment transaction
      const appointmentData = {
        organization_id: organizationId,
        transaction_type: 'appointment',
        transaction_date: `${format(selectedDate, 'yyyy-MM-dd')}T${startTime}:00Z`,
        source_entity_id: selectedCustomer.id,
        target_entity_id: selectedStylist.id,
        total_amount: totalPrice,
        transaction_status: isHold ? 'hold' : 'confirmed',
        smart_code: 'HERA.SALON.CALENDAR.APPOINTMENT.v1',
        business_context: {
          end_time: `${format(selectedDate, 'yyyy-MM-dd')}T${endTime}:00Z`,
          hold: isHold,
          private: isPrivate
        },
        metadata: {
          title,
          notes
        }
      }

      // In real implementation, POST to API
      // const response = await fetch('/api/universal_transactions', { ... })
      
      // Create transaction lines for services
      const serviceLines = selectedServices.map((service, index) => ({
        organization_id: organizationId,
        transaction_id: 'mock-transaction-id', // Would come from response
        line_number: index + 1,
        entity_id: service.id,
        line_type: 'service',
        description: service.entity_name,
        quantity: 1,
        unit_amount: service.price,
        line_amount: service.price,
        smart_code: 'HERA.SALON.CALENDAR.APPOINTMENT.LINE.SERVICE.v1',
        line_data: {
          duration_minutes: service.duration,
          buffer_before: service.buffer_before,
          buffer_after: service.buffer_after
        }
      }))

      // Save notes if any
      if (notes) {
        const noteData = {
          organization_id: organizationId,
          entity_id: 'mock-transaction-id', // Would be the transaction ID
          field_name: 'appointment_notes',
          field_type: 'text',
          field_value_text: notes,
          smart_code: 'HERA.SALON.NOTES.APPOINTMENT.v1'
        }
        // POST to /api/core_dynamic_data
      }

      toast({
        title: 'Appointment Booked',
        description: `${title} on ${format(selectedDate, 'MMM d')} at ${startTime}`,
      })

      onBookingComplete?.({
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
    setStartTime(format(startDate, 'HH:mm'))
    setActiveTab('event')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[90vw] h-[85vh] max-h-[900px] p-0 bg-[#1b1b1b] border-[#323232] shadow-2xl overflow-hidden !top-[45%]">
        <DialogHeader className="px-6 py-3 border-b border-[#323232] bg-[#2b2b2b] flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-normal text-[#e1e1e1]">
            New event
          </DialogTitle>
        </DialogHeader>

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
                        className="border-0 border-b border-[#323232] rounded-none bg-transparent text-[#e1e1e1] placeholder-[#7a7a7a] text-lg focus:border-b-2 focus:border-[#4c7cf0] px-0 pb-2"
                      />
                    </div>

                    {/* Customer Selection */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 py-3 border-b border-[#323232]">
                        <User className="w-5 h-5 text-[#7a7a7a]" />
                        <div className="flex-1">
                          <Input
                            id="customer"
                            placeholder="Invite attendees"
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="border-0 bg-transparent text-[#e1e1e1] placeholder-[#7a7a7a] text-sm p-0 focus:ring-0"
                          />
                        </div>
                        {searchingCustomer && (
                          <Loader2 className="w-4 h-4 animate-spin text-[#7a7a7a]" />
                        )}
                        <span className="text-sm text-[#7a7a7a]">Optional</span>
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
                                  ? "bg-[#2b2b2b] text-[#e1e1e1]"
                                  : "hover:bg-[#2b2b2b] text-[#b3b3b3]"
                              )}
                              onClick={() => setSelectedCustomer(customer)}
                            >
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-[#4c7cf0] text-white text-xs">
                                  {customer.entity_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-normal">{customer.entity_name}</p>
                                <p className="text-xs text-[#7a7a7a]">{customer.email}</p>
                              </div>
                              {selectedCustomer?.id === customer.id && (
                                <X className="w-4 h-4 text-[#7a7a7a] hover:text-[#e1e1e1]" 
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
                        <SelectTrigger className="bg-[#2b2b2b] border-[#323232] text-[#e1e1e1] h-10 text-sm">
                          <SelectValue placeholder="Select a stylist" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2b2b2b] border-[#323232]">
                          {stylists.map(stylist => (
                            <SelectItem key={stylist.id} value={stylist.id} className="text-[#e1e1e1] hover:bg-[#323232] focus:bg-[#323232]">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="bg-[#4c7cf0] text-white text-xs">
                                    {stylist.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{stylist.entity_name}</span>
                                <Badge variant="secondary" className="ml-auto text-xs bg-[#323232] text-[#b3b3b3]">
                                  {stylist.level}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Service Selection */}
                      <div className="space-y-2">
                        <p className="text-xs text-[#7a7a7a] mb-2">Select services</p>
                        {services.map(service => (
                          <div
                            key={service.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded cursor-pointer transition-all",
                              selectedServices.find(s => s.id === service.id)
                                ? "bg-[#2b2b2b] border border-[#4c7cf0]"
                                : "bg-[#2b2b2b] border border-[#323232] hover:border-[#4c7cf0]/50"
                            )}
                            onClick={() => toggleService(service)}
                          >
                            <Checkbox
                              checked={!!selectedServices.find(s => s.id === service.id)}
                              className="border-[#7a7a7a] data-[state=checked]:bg-[#4c7cf0] data-[state=checked]:border-[#4c7cf0]"
                            />
                            <div className="flex-1">
                              <p className="text-sm text-[#e1e1e1]">{service.entity_name}</p>
                              <p className="text-xs text-[#7a7a7a]">
                                {service.duration} min • AED {service.price}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Service Summary */}
                      {selectedServices.length > 0 && (
                        <div className="mt-3 p-3 bg-[#252525] rounded text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-[#b3b3b3]">
                              Duration: {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                            </span>
                            <span className="text-[#e1e1e1] font-medium">
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
                            value={format(selectedDate, 'yyyy-MM-dd')}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            className="border-0 bg-transparent text-[#e1e1e1] text-sm p-0 focus:ring-0 [color-scheme:dark]"
                          />
                          <span className="text-[#7a7a7a]">to</span>
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              className="border-0 bg-transparent text-[#e1e1e1] text-sm p-0 focus:ring-0 w-20 [color-scheme:dark]"
                            />
                            <span className="text-[#7a7a7a]">-</span>
                            <Input
                              type="time"
                              value={endTime}
                              disabled
                              className="border-0 bg-transparent text-[#7a7a7a] text-sm p-0 focus:ring-0 w-20 cursor-not-allowed [color-scheme:dark]"
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
                          className="border-0 bg-transparent text-[#e1e1e1] placeholder-[#7a7a7a] text-sm p-0 focus:ring-0"
                        />
                      </div>
                    </div>

                    {/* Busy Toggle */}
                    <div className="flex items-center gap-3 mb-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={!isPrivate}
                          onCheckedChange={(checked) => setIsPrivate(!checked)}
                          className="border-[#7a7a7a] data-[state=checked]:bg-[#4c7cf0] data-[state=checked]:border-[#4c7cf0]"
                        />
                        <span className="text-sm text-[#e1e1e1]">Show as busy</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer ml-6">
                        <Checkbox
                          checked={isHold}
                          onCheckedChange={(checked) => setIsHold(!!checked)}
                          className="border-[#7a7a7a] data-[state=checked]:bg-[#4c7cf0] data-[state=checked]:border-[#4c7cf0]"
                        />
                        <span className="text-sm text-[#e1e1e1]">Tentative booking</span>
                      </label>
                    </div>

                  </div>
                </ScrollArea>

                {/* Right Column - Calendar View */}
                <div className="hidden lg:block h-full bg-[#252525] border-l border-[#323232]">
                  <div className="p-4 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-normal text-[#e1e1e1]">
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </h3>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0 text-[#7a7a7a] hover:text-[#e1e1e1] hover:bg-[#323232]"
                          onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000))}
                        >
                          ‹
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0 text-[#7a7a7a] hover:text-[#e1e1e1] hover:bg-[#323232]"
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
                    <strong>Selected time slot:</strong> {preSelectedTime} on {format(selectedDate, 'MMM d, yyyy')}
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

        {/* Footer */}
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
            <div className="flex items-center gap-2 text-sm text-[#7a7a7a]">
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
              className="bg-[#4c7cf0] hover:bg-[#6b95ff] text-white h-8 px-4 text-sm disabled:bg-[#323232] disabled:text-[#7a7a7a]"
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
      </DialogContent>
    </Dialog>
  )
}