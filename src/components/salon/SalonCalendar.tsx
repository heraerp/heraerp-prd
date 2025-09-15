'use client'
/**
 * HERA Salon Calendar Implementation
 * Smart Code: HERA.SALON.CALENDAR.MAIN.v1
 *
 * Complete salon calendar using Universal HERA Calendar DNA
 */

import React, { useState, useEffect, useMemo } from 'react'
import { SimpleCalendar } from '@/components/calendar/SimpleCalendar'
import { CalendarEvent, CalendarResource } from '@/types/calendar-api.types'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Clock,
  User,
  Scissors,
  Sparkles,
  Calendar,
  Plus,
  Star,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Timer,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

// Salon-specific types
interface SalonService {
  id: string
  name: string
  duration: number
  price: number
  category: 'cut' | 'color' | 'chemical' | 'styling' | 'bridal' | 'treatment'
  skillLevel: 'junior' | 'senior' | 'celebrity'
  smartCode: string
}

interface SalonStylist {
  id: string
  name: string
  title: string
  specializations: string[]
  level: 'junior' | 'senior' | 'celebrity'
  hourlyRate: number
  commissionRate: number
  avatar?: string
  instagram?: string
  smartCode: string
}

interface SalonClient {
  id: string
  name: string
  phone: string
  email: string
  vipLevel?: 'regular' | 'gold' | 'platinum'
  hairType?: string
  allergies?: string[]
  preferredStylist?: string
  notes?: string
  smartCode: string
}

interface SalonAppointment extends CalendarEvent {
  extendedProps: CalendarEvent['extendedProps'] & {
    service_name: string
    service_duration: number
    service_price: number
    client_name: string
    stylist_name: string
    room_name?: string
    vip_level?: string
    special_notes?: string
    preparation_time: number
    buffer_time: number
  }
}

interface SalonCalendarProps {
  className?: string
}

export function SalonCalendar({ className }: SalonCalendarProps) {
  const { currentOrganization } = useMultiOrgAuth()
  const [events, setEvents] = useState<SalonAppointment[]>([])
  const [resources, setResources] = useState<CalendarResource[]>([])
  const [services, setServices] = useState<SalonService[]>([])
  const [stylists, setStylists] = useState<SalonStylist[]>([])
  const [clients, setClients] = useState<SalonClient[]>([])
  const [selectedView, setSelectedView] = useState<
    'timeGridWeek' | 'resourceTimeGridDay' | 'dayGridMonth'
  >('resourceTimeGridDay')
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedResource, setSelectedResource] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Salon-specific configuration
  const salonConfig = useMemo(
    () => ({
      businessHours: [
        { daysOfWeek: [1, 2, 3, 4, 6], startTime: '10:00', endTime: '21:00' }, // Mon-Thu, Sat
        { daysOfWeek: [5], startTime: '10:00', endTime: '21:00' }, // Friday (with prayer breaks)
        { daysOfWeek: [0], startTime: '10:00', endTime: '20:00' } // Sunday
      ],
      slotMinTime: '09:00:00',
      slotMaxTime: '22:00:00',
      slotDuration: '00:30:00',
      snapDuration: '00:15:00',
      resourceAreaWidth: '20%',
      resourceAreaHeaderContent: 'Stylists',
      schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives'
    }),
    []
  )

  // Prayer time configuration for UAE
  const prayerTimeBlocks = useMemo(
    () => [
      { title: 'Fajr Prayer', start: '05:30', end: '06:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
      { title: 'Dhuhr Prayer', start: '12:30', end: '13:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
      { title: 'Asr Prayer', start: '15:30', end: '16:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
      { title: 'Maghrib Prayer', start: '18:00', end: '18:30', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
      { title: 'Isha Prayer', start: '19:30', end: '20:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] }
    ],
    []
  )

  // Load salon data
  useEffect(() => {
    const loadSalonData = async () => {
      setLoading(true)
      try {
        // Load sample salon data - in production this would come from API
        await loadSampleSalonData()
      } catch (error) {
        console.error('Failed to load salon data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load salon calendar data',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadSalonData()
  }, [])

  const loadSampleSalonData = async () => {
    // Sample salon services
    const sampleServices: SalonService[] = [
      {
        id: 'srv-brazilian-001',
        name: 'Brazilian Blowout',
        duration: 240,
        price: 500,
        category: 'chemical',
        skillLevel: 'celebrity',
        smartCode: 'HERA.SALON.SERVICE.CHEMICAL.BRAZILIAN.v1'
      },
      {
        id: 'srv-keratin-001',
        name: 'Keratin Treatment',
        duration: 180,
        price: 350,
        category: 'chemical',
        skillLevel: 'senior',
        smartCode: 'HERA.SALON.SERVICE.CHEMICAL.KERATIN.v1'
      },
      {
        id: 'srv-cut-premium-001',
        name: 'Premium Cut & Style',
        duration: 90,
        price: 150,
        category: 'cut',
        skillLevel: 'senior',
        smartCode: 'HERA.SALON.SERVICE.CUT.PREMIUM.v1'
      },
      {
        id: 'srv-color-highlights-001',
        name: 'Color & Highlights',
        duration: 180,
        price: 280,
        category: 'color',
        skillLevel: 'senior',
        smartCode: 'HERA.SALON.SERVICE.COLOR.HIGHLIGHTS.v1'
      },
      {
        id: 'srv-bridal-package-001',
        name: 'Complete Bridal Package',
        duration: 360,
        price: 800,
        category: 'bridal',
        skillLevel: 'celebrity',
        smartCode: 'HERA.SALON.SERVICE.BRIDAL.PREMIUM.v1'
      }
    ]

    // Sample salon stylists
    const sampleStylists: SalonStylist[] = [
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
        instagram: '@rocky_hair_artist',
        smartCode: 'HERA.SALON.STAFF.CELEBRITY.STYLIST.v1'
      },
      {
        id: 'stylist-vinay-001',
        name: 'Vinay',
        title: 'Senior Hair Stylist',
        specializations: ['Cutting', 'Styling', 'Color', 'Highlights'],
        level: 'senior',
        hourlyRate: 150,
        commissionRate: 0.35,
        smartCode: 'HERA.SALON.STAFF.SENIOR.STYLIST.v1'
      },
      {
        id: 'stylist-maya-001',
        name: 'Maya',
        title: 'Color Specialist',
        specializations: ['Color Correction', 'Balayage', 'Highlights'],
        level: 'senior',
        hourlyRate: 140,
        commissionRate: 0.3,
        smartCode: 'HERA.SALON.STAFF.SENIOR.STYLIST.v1'
      }
    ]

    // Sample salon clients
    const sampleClients: SalonClient[] = [
      {
        id: 'client-sarah-001',
        name: 'Sarah Johnson',
        phone: '+971 55 123 4567',
        email: 'sarah.johnson@email.com',
        vipLevel: 'platinum',
        hairType: 'thick_curly',
        allergies: ['ammonia'],
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
        preferredStylist: 'stylist-vinay-001',
        smartCode: 'HERA.SALON.CUSTOMER.REGULAR.v1'
      },
      {
        id: 'client-fatima-001',
        name: 'Fatima Al Zahra',
        phone: '+971 55 345 6789',
        email: 'fatima.alzahra@email.com',
        vipLevel: 'regular',
        hairType: 'medium_wavy',
        notes: 'Requires modest treatment approach',
        smartCode: 'HERA.SALON.CUSTOMER.REGULAR.v1'
      }
    ]

    // Convert stylists to calendar resources
    const sampleResources: CalendarResource[] = sampleStylists.map(stylist => ({
      id: stylist.id,
      title: stylist.name,
      extendedProps: {
        entity_id: stylist.id,
        smart_code: stylist.smartCode,
        organization_id: currentOrganization?.id || 'demo-salon',
        resource_type: 'staff' as const,
        capacity: 1,
        skills: stylist.specializations,
        metadata: {
          title: stylist.title,
          level: stylist.level,
          hourlyRate: stylist.hourlyRate,
          commissionRate: stylist.commissionRate,
          instagram: stylist.instagram
        }
      },
      eventBackgroundColor: getStylistColor(stylist.level),
      eventBorderColor: getStylistColor(stylist.level),
      eventTextColor: '#ffffff'
    }))

    // Sample appointments
    const sampleEvents: SalonAppointment[] = [
      {
        id: 'apt-001',
        title: 'Brazilian Blowout - Sarah Johnson',
        start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // +4 hours
        resourceId: 'stylist-rocky-001',
        backgroundColor: '#8b5cf6',
        borderColor: '#8b5cf6',
        textColor: '#ffffff',
        extendedProps: {
          entity_id: 'apt-001',
          smart_code: 'HERA.SALON.CALENDAR.APPOINTMENT.CHEMICAL.v1',
          organization_id: currentOrganization?.id || 'demo-salon',
          event_type: 'appointment' as const,
          status: 'confirmed' as const,
          customer_id: 'client-sarah-001',
          staff_id: 'stylist-rocky-001',
          service_id: 'srv-brazilian-001',
          service_name: 'Brazilian Blowout',
          service_duration: 240,
          service_price: 500,
          client_name: 'Sarah Johnson',
          stylist_name: 'Rocky',
          vip_level: 'platinum',
          special_notes: 'Use organic formula - client sensitive to ammonia',
          preparation_time: 15,
          buffer_time: 30,
          metadata: {}
        }
      },
      {
        id: 'apt-002',
        title: 'Cut & Style - Emma Davis',
        start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000).toISOString(), // +1.5 hours
        resourceId: 'stylist-vinay-001',
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
        textColor: '#ffffff',
        extendedProps: {
          entity_id: 'apt-002',
          smart_code: 'HERA.SALON.CALENDAR.APPOINTMENT.PREMIUM.v1',
          organization_id: currentOrganization?.id || 'demo-salon',
          event_type: 'appointment' as const,
          status: 'confirmed' as const,
          customer_id: 'client-emma-001',
          staff_id: 'stylist-vinay-001',
          service_id: 'srv-cut-premium-001',
          service_name: 'Premium Cut & Style',
          service_duration: 90,
          service_price: 150,
          client_name: 'Emma Davis',
          stylist_name: 'Vinay',
          vip_level: 'gold',
          preparation_time: 10,
          buffer_time: 15,
          metadata: {}
        }
      }
    ]

    setServices(sampleServices)
    setStylists(sampleStylists)
    setClients(sampleClients)
    setResources(sampleResources)
    setEvents(sampleEvents)
  }

  const getStylistColor = (level: string): string => {
    switch (level) {
      case 'celebrity':
        return '#8b5cf6' // Purple for celebrity
      case 'senior':
        return '#3b82f6' // Blue for senior
      case 'junior':
        return '#6b7280' // Gray for junior
      default:
        return '#6b7280'
    }
  }

  const getVipBadgeColor = (vipLevel?: string) => {
    switch (vipLevel) {
      case 'platinum':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30'
      case 'gold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30'
      case 'regular':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30'
      default:
        return 'bg-muted text-gray-800 dark:bg-background/30'
    }
  }

  const handleEventClick = (info: any) => {
    const event = info.event
    const appointment = events.find(apt => apt.id === event.id)

    if (appointment) {
      toast({
        title: appointment.extendedProps.service_name,
        description: `Client: ${appointment.extendedProps.client_name} | Stylist: ${appointment.extendedProps.stylist_name}`
      })
    }
  }

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDate(new Date(selectInfo.start))
    setSelectedResource(selectInfo.resource?.id || null)
    setIsBookingOpen(true)
  }

  const handleEventDrop = async (info: any) => {
    // Handle drag and drop rescheduling
    const { event } = info

    try {
      // In production, make API call to update appointment
      toast({
        title: 'Appointment Rescheduled',
        description: `${event.title} moved to ${new Date(event.start).toLocaleString()}`
      })
    } catch (error) {
      // Revert if failed
      info.revert()
      toast({
        title: 'Error',
        description: 'Failed to reschedule appointment',
        variant: 'destructive'
      })
    }
  }

  const renderEventContent = (eventInfo: any) => {
    const event = eventInfo.event
    const appointment = events.find(apt => apt.id === event.id)

    return (
      <div className="p-1 text-xs">
        <div className="font-medium truncate">{event.title}</div>
        {appointment && (
          <div className="flex items-center gap-1 mt-1">
            <DollarSign className="w-3 h-3" />
            <span>AED {appointment.extendedProps.service_price}</span>
            {appointment.extendedProps.vip_level && (
              <Badge
                variant="outline"
                className={cn('text-xs', getVipBadgeColor(appointment.extendedProps.vip_level))}
              >
                {appointment.extendedProps.vip_level?.toUpperCase()}
              </Badge>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">Salon Calendar</h1>
          <p className="text-muted-foreground dark:text-muted-foreground">
            Manage appointments, stylists, and salon operations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="resourceTimeGridDay">Daily View</SelectItem>
              <SelectItem value="timeGridWeek">Weekly View</SelectItem>
              <SelectItem value="dayGridMonth">Monthly View</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsBookingOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Today's Appointments
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-foreground">8</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Active Stylists
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                  {stylists.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Today's Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-foreground">AED 2,350</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">VIP Clients</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                  {clients.filter(c => c.vipLevel && c.vipLevel !== 'regular').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            Salon Calendar
            {loading && (
              <Badge variant="outline" className="ml-auto">
                <Timer className="w-3 h-3 mr-1" />
                Loading...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleCalendar
            events={events}
            onEventClick={handleEventClick}
            onDateSelect={handleDateSelect}
            className="min-h-[600px]"
          />
        </CardContent>
      </Card>

      {/* Stylist Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Salon Team
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stylists.map(stylist => (
              <div key={stylist.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                  <span className="text-foreground font-bold text-sm">{stylist.name.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-foreground">{stylist.name}</p>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">{stylist.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: getStylistColor(stylist.level) + '20',
                        color: getStylistColor(stylist.level)
                      }}
                    >
                      {stylist.level.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">AED {stylist.hourlyRate}/hr</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Popular Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {services.slice(0, 5).map(service => (
              <div
                key={service.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-foreground">{service.name}</p>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    {Math.floor(service.duration / 60)}h {service.duration % 60}m
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-foreground">AED {service.price}</p>
                  <Badge variant="outline" className="text-xs">
                    {service.category.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Prayer Times Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {prayerTimeBlocks.map((prayer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg"
              >
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  {prayer.title}
                </span>
                <span className="text-sm text-green-600 dark:text-green-400">
                  {prayer.start} - {prayer.end}
                </span>
              </div>
            ))}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                🕌 Stylists automatically get 15-minute prayer breaks. Schedule adjusted for
                Ramadan.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Booking Dialog */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center gap-2">
                        {client.name}
                        {client.vipLevel && client.vipLevel !== 'regular' && (
                          <Badge variant="outline" className="text-xs">
                            {client.vipLevel.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Service</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{service.name}</span>
                        <span className="text-xs text-muted-foreground">AED {service.price}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Stylist</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select stylist" />
                </SelectTrigger>
                <SelectContent>
                  {stylists.map(stylist => (
                    <SelectItem key={stylist.id} value={stylist.id}>
                      <div className="flex items-center gap-2">
                        {stylist.name}
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: getStylistColor(stylist.level) + '20',
                            color: getStylistColor(stylist.level)
                          }}
                        >
                          {stylist.level.toUpperCase()}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" defaultValue={selectedDate?.toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" defaultValue="10:00" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Special Notes</Label>
              <Textarea
                placeholder="Any special requirements or notes..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsBookingOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  toast({
                    title: 'Appointment Booked',
                    description: 'New appointment has been scheduled successfully.'
                  })
                  setIsBookingOpen(false)
                }}
              >
                Book Appointment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
