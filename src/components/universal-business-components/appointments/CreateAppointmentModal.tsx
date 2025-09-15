'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  DollarSign,
  Brain,
  Sparkles,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  Save,
  X,
  Users,
  MapPin
} from 'lucide-react'
import {
  UniversalAppointmentSystem,
  SERVICE_TYPES,
  APPOINTMENT_SMART_CODES
} from '@/lib/universal-business-systems/appointments/universal-appointment-system'

// HERA Universal Business Component - Create Appointment Modal
// Smart Code: HERA.UNIV.CRM.APT.CREATE.v1
// Industry Agnostic - Works for ANY business type

interface CreateAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  industry: string // Universal industry support
  organizationId: string
  preselectedDate?: Date
  preselectedTime?: string
  customization?: {
    primaryColor?: string
    secondaryColor?: string
    gradient?: string
    brandName?: string
    customerTitle?: string
    serviceTitle?: string
  }
  onAppointmentCreated?: (appointment: any) => void
}

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  segment: 'new' | 'standard' | 'premium' | 'loyal' | 'at_risk'
}

interface ServiceOption {
  id: string
  name: string
  duration: number
  price: number
  smartCode: string
  requirements: string[]
  description: string
}

interface AvailabilitySlot {
  date: Date
  startTime: string
  endTime: string
  staffAvailable: string[]
  conflictScore: number
}

// Universal industry configuration - expandable for any business type
const UNIVERSAL_INDUSTRY_CONFIG: Record<string, any> = {
  jewelry: {
    icon: '💎',
    name: 'Jewelry',
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-pink-500',
    customerTitle: 'Customer',
    serviceTitle: 'Jewelry Service',
    placeholder: {
      name: 'Customer name...',
      phone: '+91 98765 43210',
      email: 'customer@email.com'
    }
  },
  healthcare: {
    icon: '🏥',
    name: 'Healthcare',
    color: '#059669',
    gradient: 'from-emerald-500 to-blue-500',
    customerTitle: 'Patient',
    serviceTitle: 'Medical Service',
    placeholder: {
      name: 'Patient name...',
      phone: '+91 98765 43210',
      email: 'patient@email.com'
    }
  },
  restaurant: {
    icon: '🍽️',
    name: 'Restaurant',
    color: '#DC2626',
    gradient: 'from-red-500 to-orange-500',
    customerTitle: 'Guest',
    serviceTitle: 'Reservation Type',
    placeholder: {
      name: 'Guest name...',
      phone: '+91 98765 43210',
      email: 'guest@email.com'
    }
  },
  professional: {
    icon: '💼',
    name: 'Professional Services',
    color: '#1F2937',
    gradient: 'from-gray-700 to-gray-900',
    customerTitle: 'Client',
    serviceTitle: 'Professional Service',
    placeholder: {
      name: 'Client name...',
      phone: '+91 98765 43210',
      email: 'client@email.com'
    }
  },
  retail: {
    icon: '🛍️',
    name: 'Retail',
    color: '#7C3AED',
    gradient: 'from-violet-500 to-amber-500',
    customerTitle: 'Customer',
    serviceTitle: 'Retail Service',
    placeholder: {
      name: 'Customer name...',
      phone: '+91 98765 43210',
      email: 'customer@email.com'
    }
  },
  manufacturing: {
    icon: '🏭',
    name: 'Manufacturing',
    color: '#0F766E',
    gradient: 'from-teal-500 to-blue-500',
    customerTitle: 'Visitor',
    serviceTitle: 'Site Visit',
    placeholder: {
      name: 'Visitor name...',
      phone: '+91 98765 43210',
      email: 'visitor@company.com'
    }
  },
  education: {
    icon: '🎓',
    name: 'Education',
    color: '#1D4ED8',
    gradient: 'from-blue-500 to-orange-500',
    customerTitle: 'Student',
    serviceTitle: 'Education Service',
    placeholder: {
      name: 'Student name...',
      phone: '+91 98765 43210',
      email: 'student@email.com'
    }
  },
  fitness: {
    icon: '💪',
    name: 'Fitness',
    color: '#DC2626',
    gradient: 'from-red-500 to-emerald-500',
    customerTitle: 'Member',
    serviceTitle: 'Fitness Service',
    placeholder: {
      name: 'Member name...',
      phone: '+91 98765 43210',
      email: 'member@email.com'
    }
  },
  beauty: {
    icon: '💄',
    name: 'Beauty & Wellness',
    color: '#EC4899',
    gradient: 'from-pink-500 to-purple-500',
    customerTitle: 'Client',
    serviceTitle: 'Beauty Service',
    placeholder: {
      name: 'Client name...',
      phone: '+91 98765 43210',
      email: 'client@email.com'
    }
  },
  automotive: {
    icon: '🚗',
    name: 'Automotive',
    color: '#374151',
    gradient: 'from-gray-9000 to-red-500',
    customerTitle: 'Customer',
    serviceTitle: 'Automotive Service',
    placeholder: {
      name: 'Customer name...',
      phone: '+91 98765 43210',
      email: 'customer@email.com'
    }
  },
  legal: {
    icon: '⚖️',
    name: 'Legal Services',
    color: '#1F2937',
    gradient: 'from-gray-800 to-red-600',
    customerTitle: 'Client',
    serviceTitle: 'Legal Service',
    placeholder: {
      name: 'Client name...',
      phone: '+91 98765 43210',
      email: 'client@email.com'
    }
  },
  consulting: {
    icon: '🧠',
    name: 'Consulting',
    color: '#6366F1',
    gradient: 'from-indigo-500 to-emerald-500',
    customerTitle: 'Client',
    serviceTitle: 'Consulting Service',
    placeholder: {
      name: 'Client name...',
      phone: '+91 98765 43210',
      email: 'client@company.com'
    }
  },
  'real-estate': {
    icon: '🏠',
    name: 'Real Estate',
    color: '#059669',
    gradient: 'from-emerald-500 to-amber-500',
    customerTitle: 'Client',
    serviceTitle: 'Real Estate Service',
    placeholder: {
      name: 'Client name...',
      phone: '+91 98765 43210',
      email: 'client@email.com'
    }
  }
}

export function CreateAppointmentModal({
  isOpen,
  onClose,
  industry,
  organizationId,
  preselectedDate,
  preselectedTime,
  customization,
  onAppointmentCreated
}: CreateAppointmentModalProps) {
  const [step, setStep] = useState(1) // 1: Customer, 2: Service, 3: DateTime, 4: Confirmation
  const [isLoading, setIsLoading] = useState(false)
  const [aiOptimization, setAiOptimization] = useState(true)

  // Form state
  const [customer, setCustomer] = useState<Partial<Customer>>({})
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null)
  const [appointmentDate, setAppointmentDate] = useState<Date>(preselectedDate || new Date())
  const [appointmentTime, setAppointmentTime] = useState<string>(preselectedTime || '10:00')
  const [specialRequests, setSpecialRequests] = useState('')
  const [customFields, setCustomFields] = useState<Record<string, string>>({})

  // Data
  const [customers, setCustomers] = useState<Customer[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)

  // Get configuration with customization overrides
  const defaultConfig =
    UNIVERSAL_INDUSTRY_CONFIG[industry] || UNIVERSAL_INDUSTRY_CONFIG.professional
  const config = {
    ...defaultConfig,
    color: customization?.primaryColor || defaultConfig.color,
    gradient: customization?.gradient || defaultConfig.gradient,
    customerTitle: customization?.customerTitle || defaultConfig.customerTitle,
    serviceTitle: customization?.serviceTitle || defaultConfig.serviceTitle,
    name: customization?.brandName || defaultConfig.name
  }

  const appointmentSystem = new UniversalAppointmentSystem(organizationId)

  useEffect(() => {
    if (isOpen) {
      loadInitialData()
    }
  }, [isOpen, industry])

  useEffect(() => {
    if (selectedService && appointmentDate) {
      checkAvailability()
    }
  }, [selectedService, appointmentDate])

  const loadInitialData = async () => {
    // Load universal customers (mock data for demo)
    const mockCustomers: Customer[] = generateUniversalMockCustomers()
    setCustomers(mockCustomers)

    // Load services based on industry with fallback
    const serviceIndustryKey = industry.toUpperCase()
    let serviceTypes = SERVICE_TYPES[serviceIndustryKey as keyof typeof SERVICE_TYPES]

    // Fallback to professional services if industry not defined
    if (!serviceTypes) {
      serviceTypes = SERVICE_TYPES.PROFESSIONAL
    }

    const serviceOptions: ServiceOption[] = Object.entries(serviceTypes).map(([key, service]) => ({
      id: key,
      name: service.name,
      duration: service.duration,
      price: service.price,
      smartCode: service.smart_code,
      requirements: service.requires,
      description: service.description
    }))
    setServices(serviceOptions)
  }

  const generateUniversalMockCustomers = (): Customer[] => {
    const universalNames = [
      'Priya Sharma',
      'Rajesh Gupta',
      'Anita Singh',
      'Vikram Mehta',
      'Sunita Joshi',
      'John Smith',
      'Emily Johnson',
      'Michael Brown',
      'Sarah Davis',
      'David Wilson',
      'Alice Cooper',
      'Bob Anderson',
      'Carol Martinez',
      'Daniel Lee',
      'Eva Garcia'
    ]

    return universalNames.slice(0, 5).map((name, index) => ({
      id: `cust_${index + 1}`,
      name,
      phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
      segment: (['premium', 'standard', 'new', 'loyal'] as const)[Math.floor(Math.random() * 4)]
    }))
  }

  const checkAvailability = async () => {
    if (!selectedService) return

    setIsLoading(true)

    try {
      const endDate = new Date(appointmentDate)
      endDate.setDate(endDate.getDate() + 7) // Check next 7 days

      const availability = await appointmentSystem.checkAvailability({
        serviceId: selectedService.id,
        dateRange: { start: appointmentDate, end: endDate },
        duration: selectedService.duration,
        staffPreferences: [],
        resourceRequirements: selectedService.requirements
      })

      setAvailableSlots(availability.availableSlots)

      // Generate AI suggestions if enabled
      if (aiOptimization) {
        generateUniversalAISuggestions()
      }
    } catch (error) {
      console.error('Error checking availability:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateUniversalAISuggestions = () => {
    // Universal AI suggestions that work for any industry
    setAiSuggestions({
      optimalTimes: ['10:00', '14:00', '16:00'],
      customerInsights: {
        preferredTimeSlots: ['morning', 'afternoon'],
        historicalPattern: `Typically books ${industry} appointments 1-2 weeks in advance`,
        serviceRecommendations: [`Consider offering premium ${industry} services`]
      },
      revenueOptimization: {
        suggestedUpsells: [`Premium ${config.serviceTitle} add-on`, `Extended service package`],
        priceOptimization: `Current pricing is optimal for this ${industry} customer segment`
      },
      industrySpecific: {
        bestPractices: [
          `${config.name} industry best practices applied`,
          `Customer segment analysis for ${industry}`,
          `Seasonal patterns for ${industry} services`
        ]
      }
    })
  }

  const handleCreateAppointment = async () => {
    if (!customer.name || !selectedService || !appointmentDate) return

    setIsLoading(true)

    try {
      // Create customer if new
      let customerId = customer.id
      if (!customerId) {
        const newCustomer = await appointmentSystem.createCustomer({
          customerName: customer.name,
          industry,
          contactInfo: {
            phone: customer.phone,
            email: customer.email
          },
          aiAnalysis: aiOptimization
        })
        customerId = newCustomer.id
      }

      // Create universal appointment
      const appointment = await appointmentSystem.createAppointment({
        customerId: customerId!,
        serviceId: selectedService.id,
        appointmentDate,
        startTime: appointmentTime,
        duration: selectedService.duration,
        specialRequests,
        customFields,
        aiOptimization
      })

      // Trigger callback with created appointment
      if (onAppointmentCreated) {
        const appointmentEvent = {
          id: appointment.id,
          title: `${customer.name} - ${selectedService.name}`,
          start: new Date(`${appointmentDate.toDateString()} ${appointmentTime}`).toISOString(),
          end: new Date(
            new Date(`${appointmentDate.toDateString()} ${appointmentTime}`).getTime() +
              selectedService.duration * 60000
          ).toISOString(),
          backgroundColor: config.color,
          borderColor: config.color,
          textColor: '#FFFFFF',
          extendedProps: {
            appointmentId: appointment.id,
            customerId,
            customerName: customer.name,
            customerPhone: customer.phone,
            customerEmail: customer.email,
            serviceId: selectedService.id,
            serviceName: selectedService.name,
            status: 'scheduled',
            industry,
            smartCode: selectedService.smartCode,
            totalAmount: selectedService.price
          }
        }
        onAppointmentCreated(appointmentEvent)
      }

      onClose()
      resetForm()
    } catch (error) {
      console.error('Error creating appointment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setCustomer({})
    setSelectedService(null)
    setAppointmentDate(new Date())
    setAppointmentTime('10:00')
    setSpecialRequests('')
    setCustomFields({})
    setAiSuggestions(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return renderCustomerStep()
      case 2:
        return renderServiceStep()
      case 3:
        return renderDateTimeStep()
      case 4:
        return renderConfirmationStep()
      default:
        return null
    }
  }

  const renderCustomerStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-2">{config.icon}</div>
        <h3 className="text-lg font-semibold">Select or Create {config.customerTitle}</h3>
        <p className="text-sm text-muted-foreground">
          Choose an existing {config.customerTitle.toLowerCase()} or create a new one
        </p>
      </div>

      {/* Search existing customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Existing {config.customerTitle}s
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {customers.map(cust => (
            <div
              key={cust.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                customer.id === cust.id
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-border hover:border-border'
              }`}
              onClick={() => setCustomer(cust)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{cust.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {cust.phone} • {cust.email}
                  </p>
                </div>
                <Badge
                  className={
                    cust.segment === 'premium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : cust.segment === 'loyal'
                        ? 'bg-purple-100 text-purple-800'
                        : cust.segment === 'standard'
                          ? 'bg-blue-100 text-blue-800'
                          : cust.segment === 'at_risk'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                  }
                >
                  {cust.segment}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Create new customer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New {config.customerTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="customerName">Name *</Label>
            <Input
              id="customerName"
              placeholder={config.placeholder.name}
              value={customer.name || ''}
              onChange={e => setCustomer({ ...customer, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                placeholder={config.placeholder.phone}
                value={customer.phone || ''}
                onChange={e => setCustomer({ ...customer, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder={config.placeholder.email}
                value={customer.email || ''}
                onChange={e => setCustomer({ ...customer, email: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderServiceStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Select {config.serviceTitle}</h3>
        <p className="text-sm text-muted-foreground">Choose the service for this appointment</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map(service => (
          <Card
            key={service.id}
            className={`cursor-pointer transition-all ${
              selectedService?.id === service.id
                ? 'border-purple-300 bg-purple-50'
                : 'border-border hover:border-border'
            }`}
            onClick={() => setSelectedService(service)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{service.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                </div>
                {selectedService?.id === service.id && (
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{service.duration} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>{formatCurrency(service.price)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs text-muted-foreground">
                  Requirements: {service.requirements.join(', ')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderDateTimeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Select Date & Time</h3>
        <p className="text-sm text-muted-foreground">Choose when you'd like to schedule the appointment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Date and Time Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="appointmentDate">Date</Label>
              <Input
                id="appointmentDate"
                type="date"
                value={appointmentDate.toISOString().split('T')[0]}
                onChange={e => setAppointmentDate(new Date(e.target.value))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="appointmentTime">Time</Label>
              <Select value={appointmentTime} onValueChange={setAppointmentTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => {
                    const hour = 9 + i
                    const time = `${hour.toString().padStart(2, '0')}:00`
                    return (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                id="specialRequests"
                placeholder={`Any special requirements for your ${config.serviceTitle.toLowerCase()}...`}
                value={specialRequests}
                onChange={e => setSpecialRequests(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Universal AI Suggestions */}
        {aiSuggestions && (
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h5 className="font-medium mb-2">Optimal Times</h5>
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.optimalTimes.map((time: string) => (
                    <Badge
                      key={time}
                      variant="outline"
                      className="cursor-pointer hover:bg-purple-100"
                      onClick={() => setAppointmentTime(time)}
                    >
                      {time}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-2">{config.customerTitle} Insights</h5>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    • Prefers {aiSuggestions.customerInsights.preferredTimeSlots.join(', ')}{' '}
                    appointments
                  </p>
                  <p>• {aiSuggestions.customerInsights.historicalPattern}</p>
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-2">Upsell Opportunities</h5>
                <div className="space-y-1">
                  {aiSuggestions.revenueOptimization.suggestedUpsells.map((upsell: string) => (
                    <Badge key={upsell} className="bg-green-100 text-green-800 text-xs mr-1 mb-1">
                      +{upsell}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-2">{config.name} Best Practices</h5>
                <div className="text-xs text-muted-foreground space-y-1">
                  {aiSuggestions.industrySpecific.bestPractices.map(
                    (practice: string, index: number) => (
                      <p key={index}>• {practice}</p>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-2">✅</div>
        <h3 className="text-lg font-semibold">Confirm Appointment</h3>
        <p className="text-sm text-muted-foreground">Review the details before creating the appointment</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">{config.customerTitle}</Label>
              <p className="font-semibold">{customer.name}</p>
              <p className="text-sm text-muted-foreground">
                {customer.phone} • {customer.email}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Service</Label>
              <p className="font-semibold">{selectedService?.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedService?.duration} minutes • {formatCurrency(selectedService?.price || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Date</Label>
              <p className="font-semibold">{appointmentDate.toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Time</Label>
              <p className="font-semibold">{appointmentTime}</p>
            </div>
          </div>

          {specialRequests && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Special Requests</Label>
              <p className="text-sm bg-muted p-2 rounded">{specialRequests}</p>
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Smart Code:</strong> {selectedService?.smartCode}
            </p>
            <p className="text-xs text-primary mt-1">
              This appointment will be processed using HERA's Universal 6-Table Architecture
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const canProceedToNextStep = () => {
    switch (step) {
      case 1:
        return customer.name && customer.name.trim().length > 0
      case 2:
        return selectedService !== null
      case 3:
        return appointmentDate && appointmentTime
      case 4:
        return true
      default:
        return false
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <div className="text-xl font-bold">New {config.name} Appointment</div>
              <div className="text-sm text-muted-foreground font-normal">
                Step {step} of 4:{' '}
                {step === 1
                  ? config.customerTitle
                  : step === 2
                    ? 'Service'
                    : step === 3
                      ? 'Date & Time'
                      : 'Confirmation'}
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                HERA.UNIV.CRM.APT.CREATE.v1
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiOptimization(!aiOptimization)}
                className={aiOptimization ? 'bg-purple-50 border-purple-200' : ''}
              >
                <Brain className="w-4 h-4 mr-1" />
                AI {aiOptimization ? 'ON' : 'OFF'}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map(stepNumber => (
            <div key={stepNumber} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNumber <= step ? 'text-foreground' : 'bg-gray-700 text-muted-foreground'
                }`}
                style={{
                  backgroundColor: stepNumber <= step ? config.color : undefined
                }}
              >
                {stepNumber}
              </div>
              {stepNumber < 4 && (
                <div
                  className={`w-16 h-1 ${stepNumber < step ? 'bg-purple-600' : 'bg-gray-700'}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[400px]">{renderStepContent()}</div>

        {/* Footer actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button variant="outline" onClick={() => (step > 1 ? setStep(step - 1) : onClose())}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          <div className="flex gap-2">
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceedToNextStep()}
                className="text-foreground"
                style={{
                  background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}CC 100%)`
                }}
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleCreateAppointment}
                disabled={isLoading}
                className="text-foreground"
                style={{
                  background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}CC 100%)`
                }}
              >
                {isLoading ? (
                  <>
                    <Save className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Appointment
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CreateAppointmentModal
