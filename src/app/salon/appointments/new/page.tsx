// ================================================================================
// NEW APPOINTMENT PAGE
// Smart Code: HERA.PAGES.SALON.APPOINTMENTS.NEW.V1
// POS-style appointment booking page with service selection and checkout
// ================================================================================

'use client'

import React, { useState, useEffect, Suspense } from 'react'
import '@/styles/dialog-overrides.css'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, addMinutes } from 'date-fns'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { universalApi } from '@/lib/universal-api-v2'
import { useCustomers, useServices, useEmployees } from '@/hooks/useEntity'
import { createDraftAppointment } from '@/lib/appointments/createDraftAppointment'
import { upsertAppointmentLines } from '@/lib/appointments/upsertAppointmentLines'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { BranchSelector } from '@/components/ui/BranchSelector'
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
import { toast } from '@/hooks/use-toast'
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
  ArrowLeft,
  Building2,
  MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

function NewAppointmentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { organization } = useHERAAuth()
  const { selectedBranchId } = useSecuredSalonContext()

  // Demo organization ID for Hair Talkz Salon
  const DEFAULT_SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
  const [demoOrganizationId, setDemoOrganizationId] = useState<string | null>(null)

  // Check for demo session on mount
  useEffect(() => {
    const checkDemoSession = () => {
      const isDemoLogin = sessionStorage.getItem('isDemoLogin') === 'true'
      const demoModule = sessionStorage.getItem('demoModule')
      const demoOrgId = sessionStorage.getItem('demo-org-id')
      const localStorageOrgId = localStorage.getItem('organizationId')

      if (isDemoLogin && demoModule === 'salon') {
        setDemoOrganizationId(demoOrgId || DEFAULT_SALON_ORG_ID)
      } else if (localStorageOrgId) {
        setDemoOrganizationId(localStorageOrgId)
      }
    }

    checkDemoSession()
  }, [])

  // Use demo org ID if available, otherwise use authenticated org
  const organizationId = demoOrganizationId || organization?.id

  // Get customerId from URL if provided
  const customerIdFromUrl = searchParams.get('customerId')

  // Branch filter hook - initialize with selected branch from context
  const {
    branchId,
    branches,
    loading: branchesLoading,
    error: branchesError,
    setBranchId,
    hasMultipleBranches
  } = useBranchFilter(selectedBranchId, 'salon-appointments', organizationId)

  // Form state
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null)
  const [notes, setNotes] = useState('')

  // Data state
  // Customers: use Universal Entity Wrapper for reactive DB data
  const {
    data: customers = [],
    isLoading: customersLoading,
    error: customersError,
    refetch: refetchCustomers
  } = useCustomers({
    organizationId,
    filters: {},
    includeRelationships: false,
    includeDynamicData: true
  })
  const {
    data: services = [],
    isLoading: servicesLoading,
    error: servicesError,
    refetch: refetchServices
  } = useServices({ organizationId, includeDynamicData: true, disableBranchContext: true })

  const {
    data: stylists = [],
    isLoading: stylistsLoading,
    error: stylistsError,
    refetch: refetchStylists
  } = useEmployees({ organizationId, includeDynamicData: true })

  const [cart, setCart] = useState<CartItem[]>([])
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

  // Keep Universal API org context aligned (used elsewhere in flows)
  useEffect(() => {
    if (organizationId) universalApi.setOrganizationId(organizationId)
  }, [organizationId])

  // Pre-select customer if customerId is provided in URL
  useEffect(() => {
    if (customerIdFromUrl && customers.length > 0) {
      const customer = customers.find(c => c.id === customerIdFromUrl)
      if (customer) {
        setSelectedCustomer(customer)
        console.log('Pre-selected customer:', customer)
      }
    }
  }, [customerIdFromUrl, customers])

  // Cart operations
  const addToCart = (service: Service) => {
    const existingItem = cart.find(item => item.service.id === service.id)

    if (existingItem) {
      updateQuantity(service.id, 1)
    } else {
      const svcAny: any = service as any
      const price = svcAny?.dynamic_fields?.price_market?.value ?? svcAny?.metadata?.price ?? 0
      const duration =
        svcAny?.dynamic_fields?.duration_min?.value ?? svcAny?.metadata?.duration_minutes ?? 30
      setCart([
        ...cart,
        {
          service,
          quantity: 1,
          price,
          duration
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
        description: 'Organization not found'
      })
      return
    }

    if (hasMultipleBranches && !branchId) {
      toast({
        title: 'Error',
        description: 'Please select a branch location'
      })
      return
    }

    if (!selectedCustomer) {
      toast({
        title: 'Error',
        description: 'Please select a customer'
      })
      return
    }

    if (!selectedStylist) {
      toast({
        title: 'Error',
        description: 'Please select a stylist'
      })
      return
    }

    if (!selectedTime) {
      toast({
        title: 'Error',
        description: 'Please select a time'
      })
      return
    }

    if (cart.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one service'
      })
      return
    }

    setSaving(true)

    try {
      const startAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString()

      // Create draft appointment with branch info
      console.log('Creating appointment with branch:', branchId)
      const { id: appointmentId } = await createDraftAppointment({
        organizationId,
        startAt,
        durationMin: totalDuration,
        customerEntityId: selectedCustomer.id,
        preferredStylistEntityId: selectedStylist.id,
        notes: notes || undefined,
        branchId: branchId || undefined
      })
      console.log('Appointment created with ID:', appointmentId)

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
        description: 'Appointment created successfully'
      })

      // Delay redirect to allow toast to show
      setTimeout(() => {
        router.push('/salon/appointments')
      }, 1000)
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create appointment'
      })
    } finally {
      setSaving(false)
    }
  }

  if (!organizationId) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              No Organization Selected
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Please select an organization to create appointments
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #0B0B0B 0%, #1A1A1A 50%, #0F0F0F 100%)' }}
    >
      {/* Header with enterprise depth */}
      <div
        className="border-b relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, rgba(212,175,55,0.03) 0%, rgba(184,134,11,0.02) 100%)',
          borderColor: 'rgba(245,230,200,0.08)',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Decorative golden accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)'
          }}
        ></div>

        <div className="container mx-auto px-6 py-5 relative z-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/salon/appointments')}
              className="hover:bg-[#D4AF37]/10 transition-all duration-300"
              style={{
                boxShadow: 'inset 0 1px 0 rgba(245,230,200,0.1), 0 4px 6px rgba(0,0,0,0.3)',
                border: '1px solid rgba(245,230,200,0.08)'
              }}
            >
              <ArrowLeft className="h-5 w-5 text-[#F5E6C8]" />
            </Button>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center relative"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                  boxShadow: '0 10px 30px rgba(212,175,55,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                }}
              >
                <Calendar className="w-6 h-6 text-[#0B0B0B]" />
                <div
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background:
                      'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)'
                  }}
                ></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#F5E6C8]">Book New Appointment</h1>
                <p className="text-sm text-[#F5E6C8]/70 mt-1">
                  Schedule a premium service appointment for your valued customer
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

  {customersLoading || servicesLoading || stylistsLoading ? (
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D4AF37] border-t-transparent mx-auto mb-4"></div>
              <p className="text-[#F5E6C8]/60">Loading appointment data...</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Branch, Customer & Time Selection */}
            <div className="space-y-4">
              {/* Branch Location Selector - Enterprise Grade */}
              <Card
                className="p-5 transition-all duration-300 hover:translate-y-[-2px]"
                style={{
                  background: 'rgba(26,26,26,0.95)',
                  border: '1px solid rgba(245,230,200,0.08)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(245,230,200,0.05)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <h3 className="font-medium mb-4 flex items-center gap-2 text-[#F5E6C8]">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(184,134,11,0.1) 100%)',
                      border: '1px solid rgba(212,175,55,0.3)'
                    }}
                  >
                    <Building2 className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  Branch Location
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-[#F5E6C8]/70 text-sm mb-2 block">
                      Select Branch{' '}
                      {hasMultipleBranches && <span className="text-[#D4AF37]">*</span>}
                    </Label>
                    {console.log('Branch dropdown debug:', { branchesLoading, branchesLength: branches.length, branches, branchId })}
                    <Select value={branchId || ''} onValueChange={value => setBranchId(value)}>
                      <SelectTrigger
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(245,230,200,0.15)',
                          color: '#F5E6C8'
                        }}
                        className="w-full"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#D4AF37]" />
                          <SelectValue placeholder="Choose location..." />
                        </div>
                      </SelectTrigger>
                      <SelectContent
                        className="hera-select-content"
                        style={{
                          background: 'rgba(26,26,26,0.98)',
                          border: '1px solid rgba(245,230,200,0.15)'
                        }}
                      >
                        {branchesLoading ? (
                          <div className="px-2 py-4 text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#D4AF37] border-t-transparent mx-auto mb-2"></div>
                            <p className="text-sm text-[#F5E6C8]/60">Loading branches...</p>
                          </div>
                        ) : branches.length === 0 ? (
                          <div className="px-2 py-4 text-center">
                            <p className="text-sm text-[#F5E6C8]/60 mb-2">No branches available</p>
                            <p className="text-xs text-[#F5E6C8]/40">
                              Add branches in Settings to enable multi-location
                            </p>
                          </div>
                        ) : branches.length === 1 ? (
                          <SelectItem
                            value={branches[0].id}
                            className="text-[#F5E6C8] hover:bg-[#D4AF37]/10"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{branches[0].name}</span>
                              {branches[0].code && (
                                <span className="text-xs text-[#F5E6C8]/50">
                                  {branches[0].code}
                                </span>
                              )}
                              <span className="text-xs text-emerald-400 mt-1">
                                ✓ Default location
                              </span>
                            </div>
                          </SelectItem>
                        ) : (
                          branches.map(branch => (
                            <SelectItem
                              key={branch.id}
                              value={branch.id}
                              className="text-[#F5E6C8] hover:bg-[#D4AF37]/10"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{branch.name}</span>
                                {branch.code && (
                                  <span className="text-xs text-[#F5E6C8]/50">{branch.code}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {branchesError && (
                      <p className="text-xs text-red-400 mt-2">Failed to load branches</p>
                    )}
                    {!branchesLoading && branches.length === 0 && (
                      <div
                        className="mt-3 p-3 rounded-lg"
                        style={{
                          background: 'rgba(212,175,55,0.05)',
                          border: '1px solid rgba(212,175,55,0.15)'
                        }}
                      >
                        <p className="text-xs text-[#F5E6C8]/60">
                          💡 Set up branch locations in Settings to enable multi-location tracking
                          and reporting
                        </p>
                      </div>
                    )}
                    {!branchesLoading && branches.length === 1 && branchId && (
                      <div
                        className="mt-3 p-3 rounded-lg"
                        style={{
                          background: 'rgba(15,111,92,0.1)',
                          border: '1px solid rgba(15,111,92,0.2)'
                        }}
                      >
                        <p className="text-xs text-emerald-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Single location: {branches[0].name}
                        </p>
                      </div>
                    )}
                    {branchId && hasMultipleBranches && (
                      <div
                        className="mt-3 flex items-center gap-2 p-2 rounded-lg"
                        style={{
                          background: 'rgba(212,175,55,0.1)',
                          border: '1px solid rgba(212,175,55,0.2)'
                        }}
                      >
                        <MapPin className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-sm text-[#F5E6C8]">
                          {branches.find(b => b.id === branchId)?.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card
                className="p-5 transition-all duration-300 hover:translate-y-[-2px]"
                style={{
                  background: 'rgba(26,26,26,0.95)',
                  border: '1px solid rgba(245,230,200,0.08)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(245,230,200,0.05)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <h3 className="font-medium mb-4 flex items-center gap-2 text-[#F5E6C8]">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(184,134,11,0.1) 100%)',
                      border: '1px solid rgba(212,175,55,0.3)'
                    }}
                  >
                    <User className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  Customer Details
                </h3>
                {selectedCustomer ? (
                  <div
                    className="p-4 rounded-lg"
                    style={{
                      background: 'rgba(212,175,55,0.05)',
                      border: '1px solid rgba(212,175,55,0.15)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#F5E6C8]">{selectedCustomer.entity_name}</p>
                        <p className="text-sm text-[#F5E6C8]/60 mt-1">
                          {selectedCustomer.metadata?.phone || 'No phone'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedCustomer(null)}
                        className="text-[#F5E6C8]/70 hover:text-[#F5E6C8] hover:bg-[#D4AF37]/10"
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#D4AF37]/60" />
                      <Input
                        placeholder="Search customers..."
                        value={customerSearch}
                        onChange={e => setCustomerSearch(e.target.value)}
                        className="pl-9 placeholder:text-[#F5E6C8]/40"
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(245,230,200,0.15)',
                          color: '#F5E6C8'
                        }}
                      />
                    </div>

                    {customerSearch && (
                      <ScrollArea
                        className="h-32"
                        style={{ '--scrollbar-color': 'rgba(212,175,55,0.3)' } as any}
                      >
                        {filteredCustomers.map(customer => (
                          <div
                            key={customer.id}
                            className="p-3 rounded cursor-pointer transition-all duration-200"
                            style={{
                              background: customerSearch ? 'rgba(0,0,0,0.2)' : 'transparent',
                              ':hover': { background: 'rgba(212,175,55,0.1)' }
                            }}
                            onMouseEnter={e =>
                              (e.currentTarget.style.background = 'rgba(212,175,55,0.1)')
                            }
                            onMouseLeave={e =>
                              (e.currentTarget.style.background = 'rgba(0,0,0,0.2)')
                            }
                            onClick={() => {
                              setSelectedCustomer(customer)
                              setCustomerSearch('')
                            }}
                          >
                            <p className="font-medium text-[#F5E6C8]">{customer.entity_name}</p>
                            <p className="text-sm text-[#F5E6C8]/50">
                              {((customer as any).dynamic_fields?.phone?.value ?? (customer as any).metadata?.phone) || 'No phone'}
                            </p>
                          </div>
                        ))}
                      </ScrollArea>
                    )}
                  </div>
                )}
              </Card>

              <Card
                className="p-5 transition-all duration-300 hover:translate-y-[-2px]"
                style={{
                  background: 'rgba(26,26,26,0.95)',
                  border: '1px solid rgba(245,230,200,0.08)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(245,230,200,0.05)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <h3 className="font-medium mb-4 flex items-center gap-2 text-[#F5E6C8]">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(184,134,11,0.2) 0%, rgba(212,175,55,0.1) 100%)',
                      border: '1px solid rgba(184,134,11,0.3)'
                    }}
                  >
                    <Scissors className="w-5 h-5 text-[#B8860B]" />
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
                  <SelectTrigger
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(245,230,200,0.15)',
                      color: '#F5E6C8'
                    }}
                  >
                    <SelectValue placeholder="Select a stylist" />
                  </SelectTrigger>
                  <SelectContent
                    className="hera-select-content"
                    style={{
                      background: 'rgba(26,26,26,0.98)',
                      border: '1px solid rgba(245,230,200,0.15)'
                    }}
                  >
                    {stylists.map(stylist => (
                      <SelectItem
                        key={stylist.id}
                        value={stylist.id}
                        className="text-[#F5E6C8] hover:bg-[#D4AF37]/10"
                      >
                        {stylist.entity_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Card>

              <Card
                className="p-5 transition-all duration-300 hover:translate-y-[-2px]"
                style={{
                  background: 'rgba(26,26,26,0.95)',
                  border: '1px solid rgba(245,230,200,0.08)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(245,230,200,0.05)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <h3 className="font-medium mb-4 flex items-center gap-2 text-[#F5E6C8]">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(184,134,11,0.1) 100%)',
                      border: '1px solid rgba(212,175,55,0.25)'
                    }}
                  >
                    <Calendar className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  Date & Time
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-[#F5E6C8]/70 text-sm">Date</Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="text-[#F5E6C8]"
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(245,230,200,0.15)',
                        color: '#F5E6C8',
                        colorScheme: 'dark'
                      }}
                    />
                  </div>

                  <div>
                    <Label className="text-[#F5E6C8]/70 text-sm">Time</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(245,230,200,0.15)',
                          color: '#F5E6C8'
                        }}
                      >
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent
                        className="hera-select-content"
                        style={{
                          background: 'rgba(26,26,26,0.98)',
                          border: '1px solid rgba(245,230,200,0.15)'
                        }}
                      >
                        {timeSlots.map(slot => (
                          <SelectItem
                            key={slot.start}
                            value={slot.start}
                            className="text-[#F5E6C8] hover:bg-[#D4AF37]/10"
                          >
                            {slot.start}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[#F5E6C8]/70 text-sm">Notes (Optional)</Label>
                    <Textarea
                      placeholder="Any special requests..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={2}
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(245,230,200,0.15)',
                        color: '#F5E6C8',
                        resize: 'none'
                      }}
                      className="placeholder:text-[#F5E6C8]/30"
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Center Column - Service Selection */}
            <div className="space-y-4">
              <Card
                className="p-5 transition-all duration-300 hover:translate-y-[-2px] h-fit"
                style={{
                  background: 'rgba(26,26,26,0.95)',
                  border: '1px solid rgba(245,230,200,0.08)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(245,230,200,0.05)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <h3 className="font-medium mb-4 flex items-center gap-2 text-[#F5E6C8]">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(184,134,11,0.15) 100%)',
                      border: '1px solid rgba(212,175,55,0.3)'
                    }}
                  >
                    <Scissors className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  Select Services
                </h3>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#D4AF37]/60" />
                  <Input
                    placeholder="Search services..."
                    value={serviceSearch}
                    onChange={e => setServiceSearch(e.target.value)}
                    className="pl-9 placeholder:text-[#F5E6C8]/40"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(245,230,200,0.15)',
                      color: '#F5E6C8'
                    }}
                  />
                </div>

                <ScrollArea className="h-[600px] pr-2">
                  <div className="space-y-2">
                    {filteredServices.map(service => (
                      <div
                        key={service.id}
                        className="p-4 rounded-lg cursor-pointer transition-all duration-200 group"
                        style={{
                          background: 'rgba(0,0,0,0.2)',
                          border: '1px solid rgba(245,230,200,0.08)'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(212,175,55,0.05)'
                          e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(0,0,0,0.2)'
                          e.currentTarget.style.borderColor = 'rgba(245,230,200,0.08)'
                        }}
                        onClick={() => addToCart(service)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-[#F5E6C8]">{service.entity_name}</p>
                            <div className="flex items-center gap-3 text-sm text-[#F5E6C8]/50">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#D4AF37]/50" />
                                <span>
                                  {((service as any).dynamic_fields?.duration_min?.value ?? (service as any).metadata?.duration_minutes) || 30}
                                  {' '}min
                                </span>
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3 text-[#D4AF37]/50" />
                                <span>
                                  AED {((service as any).dynamic_fields?.price_market?.value ?? (service as any).metadata?.price) || 0}
                                </span>
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{
                              background: 'rgba(212,175,55,0.1)',
                              border: '1px solid rgba(212,175,55,0.2)',
                              color: '#D4AF37'
                            }}
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
              <Card
                className="p-5 transition-all duration-300 hover:translate-y-[-2px]"
                style={{
                  background: 'rgba(26,26,26,0.95)',
                  border: '1px solid rgba(245,230,200,0.08)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(245,230,200,0.05)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <h3 className="font-medium mb-4 flex items-center gap-2 text-[#F5E6C8]">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(184,134,11,0.2) 0%, rgba(212,175,55,0.15) 100%)',
                      border: '1px solid rgba(184,134,11,0.3)'
                    }}
                  >
                    <ShoppingBag className="w-5 h-5 text-[#B8860B]" />
                  </div>
                  Selected Services
                  {cart.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-auto"
                      style={{
                        background: 'rgba(212,175,55,0.2)',
                        color: '#F5E6C8',
                        border: '1px solid rgba(212,175,55,0.3)'
                      }}
                    >
                      {cart.length} item{cart.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </h3>

                {cart.length === 0 ? (
                  <p className="text-[#F5E6C8]/40 text-center py-8">No services selected</p>
                ) : (
                  <ScrollArea className="h-48 lg:h-64">
                    <div className="space-y-3">
                      {cart.map(item => (
                        <div
                          key={item.service.id}
                          className="p-3 rounded-lg"
                          style={{
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(245,230,200,0.08)'
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm text-[#F5E6C8]">
                              {item.service.entity_name}
                            </p>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="hover:bg-red-900/20"
                              onClick={() => removeFromCart(item.service.id)}
                            >
                              <X className="w-4 h-4 text-[#F5E6C8]/60 hover:text-red-400" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => updateQuantity(item.service.id, -1)}
                                className="h-6 w-6"
                                style={{
                                  border: '1px solid rgba(245,230,200,0.15)',
                                  background: 'rgba(0,0,0,0.2)'
                                }}
                              >
                                <Minus className="w-3 h-3 text-[#F5E6C8]/60" />
                              </Button>
                              <span className="w-6 text-center text-sm text-[#F5E6C8]">
                                {item.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => updateQuantity(item.service.id, 1)}
                                className="h-6 w-6"
                                style={{
                                  border: '1px solid rgba(245,230,200,0.15)',
                                  background: 'rgba(0,0,0,0.2)'
                                }}
                              >
                                <Plus className="w-3 h-3 text-[#F5E6C8]/60" />
                              </Button>
                            </div>

                            <div className="text-sm text-[#D4AF37] font-medium">
                              AED {(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </Card>

              <Card
                className="p-5 transition-all duration-300"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(184,134,11,0.05) 100%)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  boxShadow:
                    '0 10px 40px rgba(212,175,55,0.15), inset 0 1px 0 rgba(245,230,200,0.1)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <h3 className="font-medium mb-4 flex items-center gap-2 text-[#F5E6C8]">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                      boxShadow: '0 4px 12px rgba(212,175,55,0.4)'
                    }}
                  >
                    <DollarSign className="w-5 h-5 text-[#0B0B0B]" />
                  </div>
                  Booking Summary
                </h3>
                <div className="space-y-3 text-sm">
                  {branchId && hasMultipleBranches && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#F5E6C8]/60 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        Branch:
                      </span>
                      <span className="font-medium text-[#F5E6C8]">
                        {branches.find(b => b.id === branchId)?.name}
                      </span>
                    </div>
                  )}

                  {selectedCustomer && (
                    <div className="flex justify-between">
                      <span className="text-[#F5E6C8]/60">Customer:</span>
                      <span className="font-medium text-[#F5E6C8]">
                        {selectedCustomer.entity_name}
                      </span>
                    </div>
                  )}

                  {selectedStylist && (
                    <div className="flex justify-between">
                      <span className="text-[#F5E6C8]/60">Stylist:</span>
                      <span className="font-medium text-[#F5E6C8]">
                        {selectedStylist.entity_name}
                      </span>
                    </div>
                  )}

                  {selectedDate && selectedTime && (
                    <div className="flex justify-between">
                      <span className="text-[#F5E6C8]/60">Time:</span>
                      <span className="font-medium text-[#F5E6C8]">
                        {format(new Date(`${selectedDate}T${selectedTime}`), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-[#F5E6C8]/60">Duration:</span>
                    <span className="font-medium text-[#F5E6C8]">{totalDuration} minutes</span>
                  </div>

                  <div className="pt-3 border-t" style={{ borderColor: 'rgba(245,230,200,0.15)' }}>
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-[#F5E6C8]">Total:</span>
                      <span className="text-[#D4AF37]">AED {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSave}
                    disabled={
                      (hasMultipleBranches && !branchId) ||
                      !selectedCustomer ||
                      !selectedStylist ||
                      !selectedTime ||
                      cart.length === 0 ||
                      saving
                    }
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                      color: '#0B0B0B',
                      fontWeight: '600',
                      boxShadow:
                        '0 8px 24px rgba(212,175,55,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                      border: 'none'
                    }}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0B0B0B] mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Create Appointment
                      </>
                    )}
                  </Button>

                  <Button
                    className="w-full"
                    variant="outline"
                    size="lg"
                    onClick={() => router.push('/salon/appointments')}
                    disabled={saving}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(245,230,200,0.2)',
                      color: '#F5E6C8'
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NewAppointmentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto">Loading...</div>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <NewAppointmentContent />
    </Suspense>
  )
}
