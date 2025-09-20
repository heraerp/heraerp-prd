'use client'
/**
 * HERA Salon Booking Workflow
 * Smart Code: HERA.SALON.BOOKING.WORKFLOW.v1
 *
 * Complete salon booking workflow with service selection, stylist matching, and intelligent scheduling
 */

import React, { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Calendar,
  Clock,
  User,
  Scissors,
  Sparkles,
  Star,
  DollarSign,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Search,
  Filter,
  MapPin,
  Palette,
  Zap,
  Heart,
  Crown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

// Types for salon booking workflow
interface SalonService {
  id: string
  name: string
  description: string
  duration: number // minutes
  price: number
  category: 'cut' | 'color' | 'chemical' | 'styling' | 'bridal' | 'treatment'
  skillLevel: 'junior' | 'senior' | 'celebrity'
  addons?: SalonAddon[]
  preparation?: string[]
  aftercare?: string[]
  smartCode: string
  popularity?: number
}

interface SalonAddon {
  id: string
  name: string
  duration: number
  price: number
  optional: boolean
  smartCode: string
}

interface SalonStylist {
  id: string
  name: string
  title: string
  avatar?: string
  specializations: string[]
  level: 'junior' | 'senior' | 'celebrity'
  hourlyRate: number
  commissionRate: number
  rating: number
  reviews: number
  nextAvailable?: Date
  instagram?: string
  bio?: string
  smartCode: string
}

interface SalonClient {
  id: string
  name: string
  phone: string
  email: string
  vipLevel?: 'regular' | 'gold' | 'platinum'
  hairType?: string
  skinTone?: string
  allergies?: string[]
  preferences?: string[]
  visitHistory?: number
  lastVisit?: Date
  preferredStylist?: string
  notes?: string
  smartCode: string
}

interface TimeSlot {
  date: string
  time: string
  available: boolean
  stylistId: string
  confidence: number
  price?: number
}

interface BookingWorkflowProps {
  isOpen: boolean
  onClose: () => void
  selectedDate?: Date
  selectedStylist?: string
  onBookingComplete?: (booking: any) => void
}

type BookingStep = 'service' | 'stylist' | 'client' | 'timing' | 'confirmation'

export function SalonBookingWorkflow({
  isOpen,
  onClose,
  selectedDate,
  selectedStylist,
  onBookingComplete
}: BookingWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<BookingStep>('service')
  const [selectedService, setSelectedService] = useState<SalonService | null>(null)
  const [selectedAddons, setSelectedAddons] = useState<SalonAddon[]>([])
  const [selectedClient, setSelectedClient] = useState<SalonClient | null>(null)
  const [selectedStylistId, setSelectedStylistId] = useState<string>(selectedStylist || '')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [specialNotes, setSpecialNotes] = useState('')
  const [isNewClient, setIsNewClient] = useState(false)
  const [newClientData, setNewClientData] = useState({
    name: '',
    phone: '',
    email: '',
    hairType: '',
    allergies: ''
  })

  // Sample data - in production this would come from API
  const services: SalonService[] = [
    {
      id: 'srv-brazilian-001',
      name: 'Brazilian Blowout',
      description:
        'Revolutionary smoothing treatment that eliminates frizz and reduces styling time by 50%',
      duration: 240,
      price: 500,
      category: 'chemical',
      skillLevel: 'celebrity',
      preparation: [
        'Hair wash with clarifying shampoo',
        'Section hair properly',
        'Set up ventilation'
      ],
      aftercare: [
        'No washing for 72 hours',
        'Use sulfate-free products',
        'Deep conditioning weekly'
      ],
      smartCode: 'HERA.SALON.SERVICE.CHEMICAL.BRAZILIAN.V1',
      popularity: 95,
      addons: [
        {
          id: 'addon-1',
          name: 'Deep Conditioning Treatment',
          duration: 30,
          price: 45,
          optional: true,
          smartCode: 'HERA.SALON.ADDON.CONDITIONING.v1'
        },
        {
          id: 'addon-2',
          name: 'Scalp Massage',
          duration: 15,
          price: 25,
          optional: true,
          smartCode: 'HERA.SALON.ADDON.MASSAGE.v1'
        }
      ]
    },
    {
      id: 'srv-keratin-001',
      name: 'Keratin Treatment',
      description:
        'Intensive protein treatment that repairs damaged hair and adds incredible shine',
      duration: 180,
      price: 350,
      category: 'chemical',
      skillLevel: 'senior',
      preparation: ['Wash with clarifying shampoo', 'Towel dry to 80%'],
      aftercare: [
        'No water contact for 48 hours',
        'Sleep on silk pillowcase',
        'Use keratin-safe products'
      ],
      smartCode: 'HERA.SALON.SERVICE.CHEMICAL.KERATIN.V1',
      popularity: 88
    },
    {
      id: 'srv-highlights-001',
      name: 'Balayage Highlights',
      description: 'Hand-painted highlights for natural, sun-kissed dimension',
      duration: 180,
      price: 280,
      category: 'color',
      skillLevel: 'senior',
      smartCode: 'HERA.SALON.SERVICE.COLOR.BALAYAGE.V1',
      popularity: 92
    },
    {
      id: 'srv-cut-premium-001',
      name: 'Signature Cut & Style',
      description: 'Precision cut with personalized styling consultation',
      duration: 90,
      price: 150,
      category: 'cut',
      skillLevel: 'senior',
      smartCode: 'HERA.SALON.SERVICE.CUT.PREMIUM.V1',
      popularity: 85
    },
    {
      id: 'srv-bridal-001',
      name: 'Complete Bridal Package',
      description: 'Full bridal experience including trial, styling, and touch-ups',
      duration: 360,
      price: 800,
      category: 'bridal',
      skillLevel: 'celebrity',
      smartCode: 'HERA.SALON.SERVICE.BRIDAL.COMPLETE.V1',
      popularity: 98
    }
  ]

  const stylists: SalonStylist[] = [
    {
      id: 'stylist-rocky-001',
      name: 'Rocky',
      title: 'Celebrity Hair Artist',
      specializations: [
        'Brazilian Blowout',
        'Keratin Treatment',
        'Color Specialist',
        'Bridal Styling'
      ],
      level: 'celebrity',
      hourlyRate: 200,
      commissionRate: 0.4,
      rating: 4.9,
      reviews: 247,
      bio: '15+ years of experience with celebrity clients. Certified Brazilian Blowout specialist.',
      instagram: '@rocky_hair_artist',
      smartCode: 'HERA.SALON.STAFF.CELEBRITY.STYLIST.V1'
    },
    {
      id: 'stylist-vinay-001',
      name: 'Vinay',
      title: 'Senior Hair Stylist',
      specializations: ['Cutting', 'Styling', 'Color', 'Highlights'],
      level: 'senior',
      hourlyRate: 150,
      commissionRate: 0.35,
      rating: 4.7,
      reviews: 156,
      bio: 'Master of precision cuts and modern styling techniques.',
      smartCode: 'HERA.SALON.STAFF.SENIOR.STYLIST.V1'
    },
    {
      id: 'stylist-maya-001',
      name: 'Maya',
      title: 'Color Specialist',
      specializations: ['Color Correction', 'Balayage', 'Highlights', 'Fashion Colors'],
      level: 'senior',
      hourlyRate: 140,
      commissionRate: 0.3,
      rating: 4.8,
      reviews: 189,
      bio: 'Award-winning colorist specializing in natural-looking highlights.',
      smartCode: 'HERA.SALON.STAFF.COLOR.SPECIALIST.V1'
    }
  ]

  const clients: SalonClient[] = [
    {
      id: 'client-sarah-001',
      name: 'Sarah Johnson',
      phone: '+971 55 123 4567',
      email: 'sarah.johnson@email.com',
      vipLevel: 'platinum',
      hairType: 'thick_curly',
      allergies: ['ammonia'],
      visitHistory: 15,
      lastVisit: new Date('2024-11-15'),
      preferredStylist: 'stylist-rocky-001',
      notes: 'Prefers organic formulas, sensitive scalp',
      smartCode: 'HERA.SALON.CUSTOMER.VIP.v1'
    },
    {
      id: 'client-emma-001',
      name: 'Emma Davis',
      phone: '+971 55 234 5678',
      email: 'emma.davis@email.com',
      vipLevel: 'gold',
      hairType: 'fine_straight',
      visitHistory: 8,
      lastVisit: new Date('2024-10-28'),
      preferredStylist: 'stylist-vinay-001',
      smartCode: 'HERA.SALON.CUSTOMER.REGULAR.v1'
    }
  ]

  const steps: { id: BookingStep; title: string; icon: React.ReactNode }[] = [
    { id: 'service', title: 'Select Service', icon: <Scissors className="w-4 h-4" /> },
    { id: 'stylist', title: 'Choose Stylist', icon: <User className="w-4 h-4" /> },
    { id: 'client', title: 'Client Info', icon: <Phone className="w-4 h-4" /> },
    { id: 'timing', title: 'Book Time', icon: <Clock className="w-4 h-4" /> },
    { id: 'confirmation', title: 'Confirm', icon: <CheckCircle2 className="w-4 h-4" /> }
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cut':
        return <Scissors className="w-4 h-4" />
      case 'color':
        return <Palette className="w-4 h-4" />
      case 'chemical':
        return <Zap className="w-4 h-4" />
      case 'styling':
        return <Sparkles className="w-4 h-4" />
      case 'bridal':
        return <Crown className="w-4 h-4" />
      case 'treatment':
        return <Heart className="w-4 h-4" />
      default:
        return <Scissors className="w-4 h-4" />
    }
  }

  const getStylistColor = (level: string) => {
    switch (level) {
      case 'celebrity':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'senior':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'junior':
        return 'bg-muted text-gray-200 border-border'
      default:
        return 'bg-muted text-gray-200 border-border'
    }
  }

  const getVipColor = (level?: string) => {
    switch (level) {
      case 'platinum':
        return 'bg-purple-100 text-purple-800'
      case 'gold':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const calculateTotalDuration = () => {
    const serviceDuration = selectedService?.duration || 0
    const addonDuration = selectedAddons.reduce((total, addon) => total + addon.duration, 0)
    return serviceDuration + addonDuration
  }

  const calculateTotalPrice = () => {
    const servicePrice = selectedService?.price || 0
    const addonPrice = selectedAddons.reduce((total, addon) => total + addon.price, 0)
    return servicePrice + addonPrice
  }

  const getCompatibleStylists = () => {
    if (!selectedService) return stylists

    return stylists
      .filter(stylist => {
        const hasSkill = stylist.specializations.some(
          skill =>
            selectedService.name.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(selectedService.category)
        )
        const hasLevel =
          (selectedService.skillLevel === 'celebrity' && stylist.level === 'celebrity') ||
          (selectedService.skillLevel === 'senior' &&
            ['senior', 'celebrity'].includes(stylist.level)) ||
          selectedService.skillLevel === 'junior'

        return hasSkill || hasLevel
      })
      .sort((a, b) => {
        // Preferred stylist first, then by rating
        if (selectedClient?.preferredStylist === a.id) return -1
        if (selectedClient?.preferredStylist === b.id) return 1
        return b.rating - a.rating
      })
  }

  const handleNext = () => {
    const stepOrder: BookingStep[] = ['service', 'stylist', 'client', 'timing', 'confirmation']
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1])
    }
  }

  const handleBack = () => {
    const stepOrder: BookingStep[] = ['service', 'stylist', 'client', 'timing', 'confirmation']
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1])
    }
  }

  const handleBookingComplete = () => {
    const booking = {
      id: `booking-${Date.now()}`,
      service: selectedService,
      addons: selectedAddons,
      client: selectedClient || newClientData,
      stylist: stylists.find(s => s.id === selectedStylistId),
      timeSlot: selectedTimeSlot,
      notes: specialNotes,
      totalDuration: calculateTotalDuration(),
      totalPrice: calculateTotalPrice(),
      smartCode: 'HERA.SALON.BOOKING.COMPLETE.v1'
    }

    onBookingComplete?.(booking)
    toast({
      title: 'Booking Confirmed!',
      description: `${selectedService?.name} scheduled with ${stylists.find(s => s.id === selectedStylistId)?.name}`
    })
    onClose()
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'service':
        return selectedService !== null
      case 'stylist':
        return selectedStylistId !== ''
      case 'client':
        return selectedClient !== null || (isNewClient && newClientData.name && newClientData.phone)
      case 'timing':
        return selectedTimeSlot !== null
      case 'confirmation':
        return true
      default:
        return false
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Book Salon Appointment
          </DialogTitle>

          {/* Progress Bar */}
          <div className="space-y-4">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-xs">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center gap-1',
                    index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {step.icon}
                  <span>{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Selection */}
          {currentStep === 'service' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Your Service</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map(service => (
                  <Card
                    key={service.id}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-md',
                      selectedService?.id === service.id && 'ring-2 ring-blue-500'
                    )}
                    onClick={() => setSelectedService(service)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(service.category)}
                          <CardTitle className="text-base">{service.name}</CardTitle>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">AED {service.price}</div>
                          <div className="text-sm text-muted-foreground">
                            {Math.floor(service.duration / 60)}h {service.duration % 60}m
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <CardDescription>{service.description}</CardDescription>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStylistColor(service.skillLevel)}>
                          {service.skillLevel.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{service.category.toUpperCase()}</Badge>
                        {service.popularity && service.popularity > 90 && (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            POPULAR
                          </Badge>
                        )}
                      </div>
                      {service.addons && service.addons.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          + {service.addons.length} optional add-ons available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add-ons */}
              {selectedService?.addons && (
                <div className="space-y-3">
                  <h4 className="font-medium">Optional Add-ons</h4>
                  <div className="space-y-2">
                    {selectedService.addons.map(addon => (
                      <div
                        key={addon.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={addon.id}
                            checked={selectedAddons.some(a => a.id === addon.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedAddons([...selectedAddons, addon])
                              } else {
                                setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id))
                              }
                            }}
                            className="rounded"
                          />
                          <label htmlFor={addon.id} className="font-medium">
                            {addon.name}
                          </label>
                          <span className="text-sm text-muted-foreground">(+{addon.duration}min)</span>
                        </div>
                        <div className="font-semibold">+AED {addon.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stylist Selection */}
          {currentStep === 'stylist' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Choose Your Stylist</h3>
              <div className="grid grid-cols-1 gap-4">
                {getCompatibleStylists().map(stylist => (
                  <Card
                    key={stylist.id}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-md',
                      selectedStylistId === stylist.id && 'ring-2 ring-blue-500'
                    )}
                    onClick={() => setSelectedStylistId(stylist.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                          <span className="text-foreground font-bold text-xl">
                            {stylist.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-lg">{stylist.name}</h4>
                              <p className="text-muted-foreground">{stylist.title}</p>
                              {stylist.bio && (
                                <p className="text-sm text-muted-foreground mt-1">{stylist.bio}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="font-semibold">{stylist.rating}</span>
                                <span className="text-sm text-muted-foreground">({stylist.reviews})</span>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                AED {stylist.hourlyRate}/hour
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="outline" className={getStylistColor(stylist.level)}>
                              {stylist.level.toUpperCase()}
                            </Badge>
                            {selectedClient?.preferredStylist === stylist.id && (
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                <Heart className="w-3 h-3 mr-1" />
                                PREFERRED
                              </Badge>
                            )}
                          </div>

                          <div className="mt-2">
                            <div className="text-sm text-muted-foreground">Specializes in:</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {stylist.specializations.map(spec => (
                                <Badge key={spec} variant="secondary" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Client Selection */}
          {currentStep === 'client' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Client Information</h3>
                <Button variant="outline" onClick={() => setIsNewClient(!isNewClient)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {isNewClient ? 'Select Existing' : 'New Client'}
                </Button>
              </div>

              {!isNewClient ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="w-4 h-4" />
                    <Input placeholder="Search clients..." />
                  </div>
                  {clients.map(client => (
                    <Card
                      key={client.id}
                      className={cn(
                        'cursor-pointer transition-all hover:shadow-md',
                        selectedClient?.id === client.id && 'ring-2 ring-blue-500'
                      )}
                      onClick={() => setSelectedClient(client)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{client.name}</h4>
                              {client.vipLevel && client.vipLevel !== 'regular' && (
                                <Badge variant="outline" className={getVipColor(client.vipLevel)}>
                                  {client.vipLevel.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                {client.phone}
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="w-3 h-3" />
                                {client.email}
                              </div>
                              {client.hairType && <div>Hair Type: {client.hairType}</div>}
                              {client.allergies && client.allergies.length > 0 && (
                                <div className="flex items-center gap-2 text-orange-600">
                                  <AlertTriangle className="w-3 h-3" />
                                  Allergies: {client.allergies.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <div>{client.visitHistory} visits</div>
                            {client.lastVisit && (
                              <div>Last: {client.lastVisit.toLocaleDateString()}</div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={newClientData.name}
                      onChange={e => setNewClientData({ ...newClientData, name: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input
                      value={newClientData.phone}
                      onChange={e => setNewClientData({ ...newClientData, phone: e.target.value })}
                      placeholder="+971 55 XXX XXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={newClientData.email}
                      onChange={e => setNewClientData({ ...newClientData, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hair Type</Label>
                    <Select
                      value={newClientData.hairType}
                      onValueChange={value =>
                        setNewClientData({ ...newClientData, hairType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select hair type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fine_straight">Fine & Straight</SelectItem>
                        <SelectItem value="thick_straight">Thick & Straight</SelectItem>
                        <SelectItem value="fine_wavy">Fine & Wavy</SelectItem>
                        <SelectItem value="thick_wavy">Thick & Wavy</SelectItem>
                        <SelectItem value="fine_curly">Fine & Curly</SelectItem>
                        <SelectItem value="thick_curly">Thick & Curly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Allergies (comma-separated)</Label>
                    <Input
                      value={newClientData.allergies}
                      onChange={e =>
                        setNewClientData({ ...newClientData, allergies: e.target.value })
                      }
                      placeholder="e.g. ammonia, sulfates"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timing Selection */}
          {currentStep === 'timing' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Date & Time</h3>
              <Alert>
                <Clock className="w-4 h-4" />
                <AlertDescription>
                  Service duration: {Math.floor(calculateTotalDuration() / 60)}h{' '}
                  {calculateTotalDuration() % 60}m | Total price: AED {calculateTotalPrice()}
                </AlertDescription>
              </Alert>

              {/* Simplified time slot selection - in production this would show available slots */}
              <div className="grid grid-cols-3 gap-4">
                {['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'].map(time => (
                  <Button
                    key={time}
                    variant={selectedTimeSlot?.time === time ? 'default' : 'outline'}
                    onClick={() =>
                      setSelectedTimeSlot({
                        date:
                          selectedDate?.toISOString().split('T')[0] ||
                          new Date().toISOString().split('T')[0],
                        time,
                        available: true,
                        stylistId: selectedStylistId,
                        confidence: 0.9
                      })
                    }
                    className="h-16 flex flex-col"
                  >
                    <div className="font-semibold">{time}</div>
                    <div className="text-xs opacity-75">Available</div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Confirmation */}
          {currentStep === 'confirmation' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Confirm Your Booking</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Service Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>{selectedService?.name}</span>
                      <span>AED {selectedService?.price}</span>
                    </div>
                    {selectedAddons.map(addon => (
                      <div key={addon.id} className="flex justify-between text-sm">
                        <span>+ {addon.name}</span>
                        <span>AED {addon.price}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>AED {calculateTotalPrice()}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Duration: {Math.floor(calculateTotalDuration() / 60)}h{' '}
                      {calculateTotalDuration() % 60}m
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Appointment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Client:</span>
                      <div className="font-medium">
                        {selectedClient?.name || newClientData.name}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Stylist:</span>
                      <div className="font-medium">
                        {stylists.find(s => s.id === selectedStylistId)?.name}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Date & Time:</span>
                      <div className="font-medium">
                        {selectedTimeSlot?.date} at {selectedTimeSlot?.time}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <Label>Special Notes</Label>
                <Textarea
                  value={specialNotes}
                  onChange={e => setSpecialNotes(e.target.value)}
                  placeholder="Any special requirements or notes for the stylist..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={currentStep === 'service' ? onClose : handleBack}
              disabled={currentStep === 'service'}
            >
              {currentStep === 'service' ? (
                'Cancel'
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </>
              )}
            </Button>

            {currentStep === 'confirmation' ? (
              <Button onClick={handleBookingComplete} disabled={!canProceed()}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm Booking
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
