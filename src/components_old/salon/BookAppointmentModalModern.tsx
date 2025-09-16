'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  X,
  Crown,
  Zap,
  TrendingUp,
  Heart,
  Palette,
  Gift,
  Phone,
  Mail
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, addMinutes, parseISO, isWithinInterval } from 'date-fns'
import { formatDate, addMinutesSafe } from '@/lib/date-utils'
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
  total_spent?: number
  visit_count?: number
}

interface BookAppointmentModalModernProps {
  isOpen: boolean
  onClose: () => void
  onBookingComplete?: (appointment: any) => void
  preSelectedDate?: Date
  preSelectedTime?: string
  preSelectedStylist?: string
  preSelectedService?: string
}

export function BookAppointmentModalModern({
  isOpen,
  onClose,
  onBookingComplete,
  preSelectedDate,
  preSelectedTime,
  preSelectedStylist,
  preSelectedService
}: BookAppointmentModalModernProps) {
  console.log('BookAppointmentModalModern rendering - Modern Glassmorphism Version')
  const { currentOrganization } = useMultiOrgAuth()
  const { toast } = useToast()
  const modalRef = useRef<HTMLDivElement>(null)
  const organizationId = currentOrganization?.id || 'demo-salon'
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })

  // Form state - Default to assistant tab when pre-selected time is provided
  const [activeTab, setActiveTab] = useState<'quick' | 'detailed' | 'assistant'>(
    preSelectedTime ? 'assistant' : 'quick'
  )
  const [title, setTitle] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null)
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(preSelectedDate || new Date())
  const [startTime, setStartTime] = useState(preSelectedTime || '10:00')
  const [isHold, setIsHold] = useState(false)
  const [notes, setNotes] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isPrivate, setIsPrivate] = useState(false)

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

  // Track mouse for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (modalRef.current) {
        const rect = modalRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        setMousePosition({ x, y })
      }
    }

    const modal = modalRef.current
    if (modal) {
      modal.addEventListener('mousemove', handleMouseMove)
      return () => modal.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isOpen])

  // Fetch salon data on mount
  useEffect(() => {
    const fetchSalonData = async () => {
      if (!organizationId) return

      setLoadingData(true)
      universalApi.setOrganizationId(organizationId)

      try {
        // Fetch stylists (staff entities)
        const stylistsResponse = await universalApi.read({
          table: 'core_entities',
          organizationId
        })

        if (stylistsResponse?.data) {
          const staffEntities = stylistsResponse.data.filter((e: any) => e.entity_type === 'staff')
          const formattedStylists = staffEntities.map((staff: any) => ({
            id: staff.id,
            entity_name: staff.entity_name,
            entity_code: staff.entity_code || staff.id,
            smart_code: staff.smart_code || 'HERA.SALON.STAFF.v1',
            avatar: staff.entity_name?.charAt(0) || 'S',
            skills: (staff.metadata as any)?.skills || [],
            level: (staff.metadata as any)?.level || 'senior',
            allow_double_book: (staff.metadata as any)?.allow_double_book || false
          }))
          setStylists(formattedStylists)
        }

        // Fetch services
        const servicesData =
          stylistsResponse?.data?.filter((e: any) => e.entity_type === 'service') || []
        const formattedServices = servicesData.map((service: any) => ({
          id: service.id,
          entity_name: service.entity_name,
          entity_code: service.entity_code || service.id,
          smart_code: service.smart_code || 'HERA.SALON.SERVICE.v1',
          duration: (service.metadata as any)?.duration || 60,
          price: (service.metadata as any)?.price || 0,
          buffer_before: (service.metadata as any)?.buffer_before || 5,
          buffer_after: (service.metadata as any)?.buffer_after || 10,
          category: (service.metadata as any)?.category || 'General',
          skills_required: (service.metadata as any)?.skills_required || []
        }))
        setServices(formattedServices)

        // Fetch recent customers
        const customerData =
          stylistsResponse?.data?.filter((e: any) => e.entity_type === 'customer') || []
        const formattedCustomers = customerData.map((customer: any) => ({
          id: customer.id,
          entity_name: customer.entity_name,
          entity_code: customer.entity_code || customer.id,
          smart_code: customer.smart_code || 'HERA.SALON.CRM.CUSTOMER.v1',
          phone: (customer.metadata as any)?.phone || '',
          email: (customer.metadata as any)?.email || '',
          vip_level: (customer.metadata as any)?.vip_level || null,
          preferences: (customer.metadata as any)?.preferences || {},
          total_spent: (customer.metadata as any)?.total_spent || 0,
          visit_count: (customer.metadata as any)?.visit_count || 0
        }))
        setCustomers(formattedCustomers)
      } catch (error) {
        console.error('Error fetching salon data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load salon data',
          variant: 'destructive'
        })
      } finally {
        setLoadingData(false)
      }
    }

    if (isOpen) {
      fetchSalonData()
    }
  }, [isOpen, organizationId, toast])

  // Quick booking actions
  const handleQuickBook = async (type: 'walk-in' | 'regular' | 'vip') => {
    if (!selectedCustomer || !selectedStylist || selectedServices.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please select customer, stylist, and service',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const appointment = await createAppointment()
      if (appointment) {
        onBookingComplete?.(appointment)
        toast({
          title: 'Booking Successful',
          description: `Appointment booked for ${selectedCustomer.entity_name}`
        })
        onClose()
      }
    } catch (error) {
      console.error('Booking error:', error)
      toast({
        title: 'Booking Failed',
        description: 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Create appointment - saves to Supabase via Universal API
  const createAppointment = async () => {
    if (!organizationId || !selectedCustomer || !selectedStylist || selectedServices.length === 0) {
      throw new Error('Missing required fields')
    }

    const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration, 0)
    const appointmentDateTime = parseISO(`${format(selectedDate, 'yyyy-MM-dd')}T${startTime}`)
    const endTime = format(addMinutes(appointmentDateTime, totalDuration), 'HH:mm')

    // Prepare appointment data for Supabase
    const appointmentData = {
      organization_id: organizationId,
      transaction_type: 'appointment',
      transaction_date: format(selectedDate, 'yyyy-MM-dd'),
      smart_code: 'HERA.SALON.APPOINTMENT.v1',
      transaction_code: `APT-${Date.now()}`, // Unique appointment code
      metadata: {
        title: title || `${selectedServices[0].entity_name} for ${selectedCustomer.entity_name}`,
        customer_id: selectedCustomer.id,
        customer_name: selectedCustomer.entity_name,
        customer_phone: selectedCustomer.phone || '',
        customer_email: selectedCustomer.email || '',
        customer_vip_level: selectedCustomer.vip_level || null,
        stylist_id: selectedStylist.id,
        stylist_name: selectedStylist.entity_name,
        stylist_level: selectedStylist.level,
        services: selectedServices.map(s => ({
          id: s.id,
          name: s.entity_name,
          duration: s.duration,
          price: s.price,
          category: s.category
        })),
        start_time: startTime,
        end_time: endTime,
        duration: totalDuration,
        is_hold: isHold,
        is_private: isPrivate,
        notes: notes || '',
        status: isHold ? 'hold' : 'confirmed',
        created_via: 'modern_modal',
        created_at: new Date().toISOString(),
        appointment_datetime: appointmentDateTime.toISOString()
      },
      from_entity_id: selectedCustomer.id,
      to_entity_id: selectedStylist.id,
      total_amount: selectedServices.reduce((sum, service) => sum + service.price, 0),
      currency: 'AED'
    }

    console.log('Saving appointment to Supabase:', appointmentData)

    // Create the transaction in Supabase
    const result = await universalApi.createTransaction(appointmentData)

    if (!result || !result.data) {
      throw new Error('Failed to save appointment to database')
    }

    // Also create line items for each service
    if (result.data.id) {
      const lineItems = selectedServices.map((service, index) => ({
        transaction_id: result.data.id,
        line_number: index + 1,
        line_entity_id: service.id,
        quantity: 1,
        unit_price: service.price,
        line_amount: service.price,
        smart_code: 'HERA.SALON.APPOINTMENT.LINE.v1',
        metadata: {
          service_name: service.entity_name,
          duration: service.duration,
          stylist_id: selectedStylist.id
        }
      }))

      // Create line items in parallel
      await Promise.all(
        lineItems.map(item =>
          universalApi.create({
            table: 'universal_transaction_lines',
            data: item
          })
        )
      )
    }

    console.log('Appointment saved successfully:', result.data)
    return result.data
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        ref={modalRef}
        className="max-w-5xl h-[85vh] p-0 overflow-hidden border-0"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(0, 0, 0, 0.95) 0%, 
              rgba(17, 24, 39, 0.95) 25%,
              rgba(31, 41, 55, 0.9) 50%,
              rgba(17, 24, 39, 0.95) 75%,
              rgba(0, 0, 0, 0.95) 100%
            ),
            radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
              rgba(147, 51, 234, 0.08) 0%, 
              rgba(59, 130, 246, 0.05) 25%,
              rgba(16, 185, 129, 0.03) 50%,
              transparent 70%
            ),
            #0a0a0a
          `
        }}
      >
        {/* WSAG Animated Background Orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Primary Light Orb */}
          <div
            className="absolute w-96 h-96 rounded-full transition-all duration-[3000ms] ease-in-out"
            style={{
              background: `radial-gradient(circle, 
                rgba(147, 51, 234, 0.15) 0%, 
                rgba(147, 51, 234, 0.08) 30%, 
                rgba(147, 51, 234, 0.02) 60%, 
                transparent 100%
              )`,
              filter: 'blur(60px)',
              left: `${20 + mousePosition.x * 0.1}%`,
              top: `${10 + mousePosition.y * 0.05}%`,
              transform: `translate(-50%, -50%) scale(${1 + mousePosition.x * 0.002})`
            }}
          />

          {/* Secondary Light Orb */}
          <div
            className="absolute w-80 h-80 rounded-full transition-all duration-[4000ms] ease-in-out"
            style={{
              background: `radial-gradient(circle, 
                rgba(59, 130, 246, 0.12) 0%, 
                rgba(59, 130, 246, 0.06) 30%, 
                rgba(59, 130, 246, 0.02) 60%, 
                transparent 100%
              )`,
              filter: 'blur(70px)',
              right: `${15 + mousePosition.x * 0.08}%`,
              top: `${60 + mousePosition.y * 0.03}%`,
              transform: `translate(50%, -50%) scale(${1 + mousePosition.y * 0.002})`
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div
            className="px-8 py-6 border-b"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(31, 41, 55, 0.85) 0%, 
                  rgba(17, 24, 39, 0.9) 100%
                )
              `,
              backdropFilter: 'blur(20px) saturate(120%)',
              WebkitBackdropFilter: 'blur(20px) saturate(120%)',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center shadow-2xl"
                  style={{
                    background: `
                      linear-gradient(135deg, 
                        rgba(147, 51, 234, 0.2) 0%, 
                        rgba(59, 130, 246, 0.15) 100%
                      )
                    `,
                    backdropFilter: 'blur(20px) saturate(120%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: `
                      0 8px 32px rgba(0, 0, 0, 0.4),
                      0 4px 16px rgba(147, 51, 234, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1)
                    `
                  }}
                >
                  <Calendar className="w-7 h-7 text-foreground drop-shadow-lg" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold !text-foreground flex items-center gap-2">
                    Book Appointment
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-foreground border-0">
                      Modern Booking Experience
                    </Badge>
                  </h2>
                  <p className="text-sm !text-muted-foreground mt-1">
                    Quick booking, smart recommendations, VIP experience
                  </p>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-background/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v: any) => setActiveTab(v)}
            className="flex-1 flex flex-col"
          >
            <div
              className="px-8 py-4 border-b"
              style={{
                background: 'rgba(31, 41, 55, 0.5)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderColor: 'rgba(255, 255, 255, 0.05)'
              }}
            >
              <TabsList className="grid w-full max-w-md grid-cols-3 bg-background/30 backdrop-blur-xl border border-border/10">
                <TabsTrigger
                  value="quick"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-foreground"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Book
                </TabsTrigger>
                <TabsTrigger
                  value="detailed"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-foreground"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Detailed
                </TabsTrigger>
                <TabsTrigger
                  value="assistant"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-foreground"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Assistant
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              {/* Quick Book Tab */}
              <TabsContent value="quick" className="px-8 pb-8">
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <Card
                    className="overflow-hidden"
                    style={{
                      background: `
                        linear-gradient(135deg, 
                          rgba(31, 41, 55, 0.7) 0%, 
                          rgba(17, 24, 39, 0.8) 100%
                        )
                      `,
                      backdropFilter: 'blur(20px) saturate(120%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <CardHeader>
                      <CardTitle className="!text-foreground flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <Button
                          variant="outline"
                          className="h-auto py-6 flex-col gap-3 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30 hover:border-primary/50 hover:from-blue-500/20 hover:to-indigo-500/20 group"
                          onClick={() => handleQuickBook('walk-in')}
                        >
                          <Users className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold text-foreground">Walk-In</span>
                          <span className="text-xs text-muted-foreground">Quick 30-min service</span>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-auto py-6 flex-col gap-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:border-purple-500/50 hover:from-purple-500/20 hover:to-pink-500/20 group"
                          onClick={() => handleQuickBook('regular')}
                        >
                          <Calendar className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold text-foreground">Regular Booking</span>
                          <span className="text-xs text-muted-foreground">Standard appointment</span>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-auto py-6 flex-col gap-3 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30 hover:border-yellow-500/50 hover:from-yellow-500/20 hover:to-orange-500/20 group"
                          onClick={() => handleQuickBook('vip')}
                        >
                          <Crown className="w-8 h-8 text-yellow-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold text-foreground">VIP Priority</span>
                          <span className="text-xs text-muted-foreground">Premium experience</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Customer Selection with VIP Badges */}
                  <Card
                    className="overflow-hidden"
                    style={{
                      background: `
                        linear-gradient(135deg, 
                          rgba(31, 41, 55, 0.7) 0%, 
                          rgba(17, 24, 39, 0.8) 100%
                        )
                      `,
                      backdropFilter: 'blur(20px) saturate(120%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <CardHeader>
                      <CardTitle className="!text-foreground flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Select Customer
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Customer Search */}
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search customer by name or phone..."
                            value={customerSearch}
                            onChange={e => setCustomerSearch(e.target.value)}
                            className="pl-10 bg-background/30 border-border/10 text-foreground placeholder:text-muted-foreground"
                          />
                        </div>

                        {/* VIP Customers */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-400" />
                            VIP Customers
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            {customers
                              .filter(c => c.vip_level)
                              .slice(0, 4)
                              .map(customer => (
                                <Button
                                  key={customer.id}
                                  variant="outline"
                                  className={cn(
                                    'justify-start gap-3 bg-background/30 border-border/10 hover:bg-background/10',
                                    selectedCustomer?.id === customer.id &&
                                      'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/50'
                                  )}
                                  onClick={() => setSelectedCustomer(customer)}
                                >
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback
                                      className={cn(
                                        'text-xs font-bold',
                                        customer.vip_level === 'platinum'
                                          ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-100'
                                          : 'bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900'
                                      )}
                                    >
                                      {customer.entity_name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 text-left">
                                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                                      {customer.entity_name}
                                      {customer.vip_level === 'platinum' && (
                                        <Badge className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-gray-300 to-gray-400 text-gray-100 border-0">
                                          Platinum
                                        </Badge>
                                      )}
                                      {customer.vip_level === 'gold' && (
                                        <Badge className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 border-0">
                                          Gold
                                        </Badge>
                                      )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {customer.visit_count || 0} visits • AED{' '}
                                      {customer.total_spent || 0}
                                    </p>
                                  </div>
                                </Button>
                              ))}
                          </div>
                        </div>

                        {/* Recent Customers */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Recent Customers</p>
                          <div className="grid grid-cols-2 gap-3">
                            {customers
                              .filter(
                                c =>
                                  !c.vip_level &&
                                  (!customerSearch ||
                                    c.entity_name
                                      .toLowerCase()
                                      .includes(customerSearch.toLowerCase()))
                              )
                              .slice(0, 4)
                              .map(customer => (
                                <Button
                                  key={customer.id}
                                  variant="outline"
                                  className={cn(
                                    'justify-start gap-3 bg-background/30 border-border/10 hover:bg-background/10',
                                    selectedCustomer?.id === customer.id &&
                                      'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/50'
                                  )}
                                  onClick={() => setSelectedCustomer(customer)}
                                >
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback className="bg-muted-foreground/10 text-foreground text-xs">
                                      {customer.entity_name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 text-left">
                                    <p className="text-sm font-medium text-foreground">
                                      {customer.entity_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {customer.phone || 'No phone'}
                                    </p>
                                  </div>
                                </Button>
                              ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Service Selection */}
                  <Card
                    className="overflow-hidden"
                    style={{
                      background: `
                        linear-gradient(135deg, 
                          rgba(31, 41, 55, 0.7) 0%, 
                          rgba(17, 24, 39, 0.8) 100%
                        )
                      `,
                      backdropFilter: 'blur(20px) saturate(120%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <CardHeader>
                      <CardTitle className="!text-foreground flex items-center gap-2">
                        <Scissors className="w-5 h-5" />
                        Services
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {services.map(service => (
                          <Button
                            key={service.id}
                            variant="outline"
                            className={cn(
                              'justify-between h-auto py-3 px-4 bg-background/30 border-border/10 hover:bg-background/10',
                              selectedServices.find(s => s.id === service.id) &&
                                'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/50'
                            )}
                            onClick={() => {
                              if (selectedServices.find(s => s.id === service.id)) {
                                setSelectedServices(
                                  selectedServices.filter(s => s.id !== service.id)
                                )
                              } else {
                                setSelectedServices([...selectedServices, service])
                              }
                            }}
                          >
                            <div className="text-left">
                              <p className="font-medium text-foreground">{service.entity_name}</p>
                              <p className="text-xs text-muted-foreground">{service.duration} min</p>
                            </div>
                            <p className="font-semibold text-green-400">AED {service.price}</p>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stylist Selection */}
                  <Card
                    className="overflow-hidden"
                    style={{
                      background: `
                        linear-gradient(135deg, 
                          rgba(31, 41, 55, 0.7) 0%, 
                          rgba(17, 24, 39, 0.8) 100%
                        )
                      `,
                      backdropFilter: 'blur(20px) saturate(120%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <CardHeader>
                      <CardTitle className="!text-foreground flex items-center gap-2">
                        <Star className="w-5 h-5" />
                        Select Stylist
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {stylists.map(stylist => (
                          <Button
                            key={stylist.id}
                            variant="outline"
                            className={cn(
                              'justify-start gap-3 h-auto py-3 bg-background/30 border-border/10 hover:bg-background/10',
                              selectedStylist?.id === stylist.id &&
                                'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/50'
                            )}
                            onClick={() => setSelectedStylist(stylist)}
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarFallback
                                className={cn(
                                  'font-bold',
                                  stylist.level === 'celebrity'
                                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-foreground'
                                    : stylist.level === 'senior'
                                      ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-foreground'
                                      : 'bg-muted-foreground/10 text-foreground'
                                )}
                              >
                                {stylist.entity_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-left flex-1">
                              <p className="font-medium text-foreground flex items-center gap-2">
                                {stylist.entity_name}
                                {stylist.level === 'celebrity' && (
                                  <Badge className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-purple-500 to-pink-500 text-foreground border-0">
                                    Celebrity
                                  </Badge>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {stylist.skills.slice(0, 2).join(', ')}
                              </p>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Smart Recommendations */}
                  {selectedCustomer && (
                    <Alert className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
                      <TrendingUp className="h-4 w-4 text-purple-400" />
                      <AlertDescription className="text-foreground">
                        <strong>Smart Recommendation:</strong> {selectedCustomer.entity_name}{' '}
                        usually books{' '}
                        {selectedCustomer.preferences?.favorite_service || 'Hair Color'} with{' '}
                        {selectedCustomer.preferences?.favorite_stylist || 'Sara'}. Last visit was{' '}
                        {selectedCustomer.preferences?.last_visit || '2 weeks ago'}.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="bg-background/30 border-border/10 text-foreground hover:bg-background/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-foreground"
                      onClick={() => handleQuickBook('regular')}
                      disabled={
                        loading ||
                        !selectedCustomer ||
                        !selectedStylist ||
                        selectedServices.length === 0
                      }
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Booking...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Book Appointment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Detailed Tab */}
              <TabsContent value="detailed" className="px-8 pb-8">
                <div className="space-y-6">
                  {/* Customer Selection */}
                  <div className="space-y-2">
                    <Label className="text-foreground">Customer *</Label>
                    <Select
                      value={selectedCustomer?.id || ''}
                      onValueChange={value => {
                        const customer = customers.find(c => c.id === value)
                        setSelectedCustomer(customer || null)
                      }}
                    >
                      <SelectTrigger className="bg-background/30 border-border/10 text-foreground">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border/10">
                        {customers.map(customer => (
                          <SelectItem
                            key={customer.id}
                            value={customer.id}
                            className="text-foreground hover:bg-background/10"
                          >
                            <div className="flex items-center gap-2">
                              <span>{customer.entity_name}</span>
                              {customer.vip_level && (
                                <Badge
                                  className={cn(
                                    'text-[10px] px-1.5 py-0 border-0',
                                    customer.vip_level === 'platinum'
                                      ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-100'
                                      : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900'
                                  )}
                                >
                                  {customer.vip_level}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label className="text-foreground">Appointment Title</Label>
                    <Input
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g., Hair Color and Cut"
                      className="bg-background/30 border-border/10 text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Date *</Label>
                      <Input
                        type="date"
                        value={format(selectedDate, 'yyyy-MM-dd')}
                        onChange={e => setSelectedDate(new Date(e.target.value))}
                        className="bg-background/30 border-border/10 text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Time *</Label>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                        className="bg-background/30 border-border/10 text-foreground"
                      />
                    </div>
                  </div>

                  {/* Services */}
                  <div className="space-y-2">
                    <Label className="text-foreground">Services * (Select multiple)</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {services.map(service => (
                        <label
                          key={service.id}
                          className={cn(
                            'flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all',
                            selectedServices.find(s => s.id === service.id)
                              ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/50'
                              : 'bg-background/30 border border-border/10 hover:bg-background/10'
                          )}
                        >
                          <Checkbox
                            checked={!!selectedServices.find(s => s.id === service.id)}
                            onCheckedChange={checked => {
                              if (checked) {
                                setSelectedServices([...selectedServices, service])
                              } else {
                                setSelectedServices(
                                  selectedServices.filter(s => s.id !== service.id)
                                )
                              }
                            }}
                            className="border-white/30 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{service.entity_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {service.duration} min • AED {service.price}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Stylist */}
                  <div className="space-y-2">
                    <Label className="text-foreground">Stylist *</Label>
                    <Select
                      value={selectedStylist?.id || ''}
                      onValueChange={value => {
                        const stylist = stylists.find(s => s.id === value)
                        setSelectedStylist(stylist || null)
                      }}
                    >
                      <SelectTrigger className="bg-background/30 border-border/10 text-foreground">
                        <SelectValue placeholder="Select stylist" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border/10">
                        {stylists.map(stylist => (
                          <SelectItem
                            key={stylist.id}
                            value={stylist.id}
                            className="text-foreground hover:bg-background/10"
                          >
                            <div className="flex items-center gap-2">
                              <span>{stylist.entity_name}</span>
                              {stylist.level === 'celebrity' && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-purple-500 to-pink-500 text-foreground border-0">
                                  Celebrity
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label className="text-foreground">Notes</Label>
                    <Textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Any special requests or notes..."
                      className="bg-background/30 border-border/10 text-foreground placeholder:text-muted-foreground min-h-[80px]"
                    />
                  </div>

                  {/* Options */}
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={isHold}
                        onCheckedChange={checked => setIsHold(checked as boolean)}
                        className="border-white/30 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                      <span className="text-sm text-foreground">Mark as Hold</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={isPrivate}
                        onCheckedChange={checked => setIsPrivate(checked as boolean)}
                        className="border-white/30 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                      <span className="text-sm text-foreground">Private Appointment</span>
                    </label>
                  </div>

                  {/* Total Summary */}
                  {selectedServices.length > 0 && (
                    <Card
                      className="overflow-hidden"
                      style={{
                        background: `
                          linear-gradient(135deg, 
                            rgba(16, 185, 129, 0.1) 0%, 
                            rgba(34, 197, 94, 0.05) 100%
                          )
                        `,
                        backdropFilter: 'blur(20px) saturate(120%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Duration</p>
                            <p className="text-lg font-semibold text-foreground">
                              {selectedServices.reduce((sum, service) => sum + service.duration, 0)}{' '}
                              minutes
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="text-2xl font-bold text-green-400">
                              AED{' '}
                              {selectedServices.reduce((sum, service) => sum + service.price, 0)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="bg-background/30 border-border/10 text-foreground hover:bg-background/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-foreground"
                      onClick={async () => {
                        setLoading(true)
                        try {
                          const appointment = await createAppointment()
                          if (appointment) {
                            onBookingComplete?.(appointment)
                            toast({
                              title: 'Appointment Booked Successfully',
                              description: `Appointment created for ${selectedCustomer?.entity_name}`
                            })
                            onClose()
                          }
                        } catch (error) {
                          console.error('Booking error:', error)
                          toast({
                            title: 'Booking Failed',
                            description:
                              error instanceof Error ? error.message : 'Please try again',
                            variant: 'destructive'
                          })
                        } finally {
                          setLoading(false)
                        }
                      }}
                      disabled={
                        loading ||
                        !selectedCustomer ||
                        !selectedStylist ||
                        selectedServices.length === 0
                      }
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving to Supabase...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Save Appointment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* AI Assistant Tab */}
              <TabsContent value="assistant" className="px-8 pb-8">
                <SchedulingAssistant
                  organizationId={organizationId}
                  stylists={stylists}
                  services={services}
                  onSchedule={async data => {
                    // Convert assistant data to our format
                    setSelectedCustomer(customers.find(c => c.id === data.customerId) || null)
                    setSelectedStylist(stylists.find(s => s.id === data.stylistId) || null)
                    setSelectedServices(services.filter(s => data.serviceIds.includes(s.id)))
                    setSelectedDate(new Date(data.date))
                    setStartTime(data.startTime)

                    // Save appointment
                    setLoading(true)
                    try {
                      const appointment = await createAppointment()
                      if (appointment) {
                        onBookingComplete?.(appointment)
                        toast({
                          title: 'AI Booking Successful',
                          description: `Appointment created via AI assistant`
                        })
                        onClose()
                      }
                    } catch (error) {
                      console.error('AI booking error:', error)
                      toast({
                        title: 'Booking Failed',
                        description: 'Please try again',
                        variant: 'destructive'
                      })
                    } finally {
                      setLoading(false)
                    }
                  }}
                />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
