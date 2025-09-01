'use client'

/**
 * HERA DNA Universal Calendar Component
 * Smart Code: HERA.UI.DNA.CALENDAR.UNIVERSAL.v1
 * 
 * A production-ready, industry-agnostic calendar that works with HERA's Sacred Six Tables.
 * Supports any business: Salon, Restaurant, Healthcare, Professional Services, etc.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import rrulePlugin from '@fullcalendar/rrule'
import { EventInput, DateSelectArg, EventClickArg, EventDropArg, ResourceInput } from '@fullcalendar/core'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  Users, 
  Clock, 
  AlertTriangle,
  Settings,
  Filter,
  Plus,
  RefreshCw,
  Globe,
  Eye,
  EyeOff,
  Shield,
  Star,
  MapPin,
  Palette
} from 'lucide-react'

import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

// TypeScript Interfaces for HERA Calendar
export interface HeraDnaCalendarProps {
  organizationId?: string
  industryType?: 'salon' | 'restaurant' | 'healthcare' | 'professional' | 'universal'
  initialView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'resourceTimeGridDay'
  businessHours?: {
    start: string
    end: string
    daysOfWeek: number[]
  }
  locale?: 'en' | 'ar'
  rtl?: boolean
  colorScheme?: 'light' | 'dark' | 'auto'
  privacyMode?: 'full' | 'vip_masked' | 'initials_only'
  onEventCreate?: (eventData: any) => Promise<void>
  onEventUpdate?: (eventId: string, changes: any) => Promise<void>
  onEventDelete?: (eventId: string) => Promise<void>
  onAvailabilityCheck?: (start: Date, end: Date, resourceId?: string) => Promise<boolean>
}

export interface HeraDnaCalendarEvent extends EventInput {
  id: string
  title: string
  start: string
  end: string
  resourceId?: string
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  extendedProps: {
    smartCode: string
    organizationId: string
    transactionId: string
    entityType: 'appointment' | 'shift' | 'leave' | 'block'
    privacy?: 'vip' | 'celebrity' | 'confidential'
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    industryData?: any
    aiInsights?: {
      confidence: number
      suggestions: string[]
      warnings: string[]
    }
    // Salon-specific
    clientId?: string
    clientName?: string
    serviceName?: string
    stylistId?: string
    locationId?: string
    bufferMinutes?: number
    skillRequirements?: string[]
    // Restaurant-specific
    tableNumber?: string
    partySize?: number
    menuPreferences?: string[]
    // Healthcare-specific
    patientId?: string
    treatmentType?: string
    providerId?: string
  }
}

export interface HeraDnaCalendarResource extends ResourceInput {
  id: string
  title: string
  extendedProps: {
    smartCode: string
    organizationId: string
    entityId: string
    resourceType: 'staff' | 'location' | 'equipment' | 'room'
    industryType: string
    skills?: string[]
    location?: string
    capacity?: number
    availability?: {
      start: string
      end: string
      daysOfWeek: number[]
    }
    metadata?: any
  }
}

// Industry-Specific Color Schemes
const INDUSTRY_COLORS = {
  salon: {
    chemical: '#FF4444',      // Red for Brazilian/Keratin
    color: '#4444FF',         // Blue for color services
    vip: '#8B5CF6',          // Purple for VIP
    bridal: '#10B981',       // Green for bridal
    walkin: '#F59E0B'        // Orange for walk-ins
  },
  restaurant: {
    reservation: '#10B981',   // Green for reservations
    walkin: '#F59E0B',       // Orange for walk-ins
    vip: '#8B5CF6',          // Purple for VIP
    takeaway: '#6B7280',     // Gray for takeaway
    delivery: '#EF4444'      // Red for delivery
  },
  healthcare: {
    appointment: '#10B981',   // Green for appointments
    emergency: '#EF4444',    // Red for emergency
    procedure: '#8B5CF6',    // Purple for procedures
    followup: '#F59E0B',     // Orange for follow-ups
    consultation: '#6B7280'  // Gray for consultations
  },
  universal: {
    primary: '#3B82F6',      // Blue
    secondary: '#10B981',    // Green
    warning: '#F59E0B',      // Orange
    danger: '#EF4444',       // Red
    info: '#8B5CF6'          // Purple
  }
}

// Prayer times and cultural considerations
const CULTURAL_SETTINGS = {
  dubai: {
    weekend: [5, 6], // Friday, Saturday
    prayerTimes: {
      fajr: '05:30',
      dhuhr: '12:15',
      asr: '15:30',
      maghrib: '18:45',
      isha: '20:00'
    },
    ramadanAdjustments: true
  }
}

export function HeraDnaUniversalCalendar({
  organizationId,
  industryType = 'universal',
  initialView = 'timeGridWeek',
  businessHours = {
    start: '10:00',
    end: '21:00',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0]
  },
  locale = 'en',
  rtl = false,
  colorScheme = 'light',
  privacyMode = 'full',
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onAvailabilityCheck
}: HeraDnaCalendarProps) {
  
  const { currentOrganization, isAuthenticated } = useMultiOrgAuth()
  
  // State management
  const [currentView, setCurrentView] = useState(initialView)
  const [events, setEvents] = useState<HeraDnaCalendarEvent[]>([])
  const [resources, setResources] = useState<HeraDnaCalendarResource[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [showVipDetails, setShowVipDetails] = useState(false)
  const [currentLocale, setCurrentLocale] = useState(locale)
  const [isRtl, setIsRtl] = useState(rtl)
  
  // Organization validation
  const orgId = organizationId || currentOrganization?.id
  if (!orgId) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Organization context required for calendar access.
        </AlertDescription>
      </Alert>
    )
  }

  // Industry-specific configuration
  const industryColors = INDUSTRY_COLORS[industryType] || INDUSTRY_COLORS.universal
  
  // Event rendering with privacy controls
  const renderEvent = useCallback((eventInfo: any) => {
    const event = eventInfo.event
    const extProps = event.extendedProps
    
    // Privacy masking for VIP/Celebrity clients
    let displayTitle = event.title
    if (extProps.privacy && privacyMode !== 'full') {
      if (extProps.privacy === 'celebrity') {
        displayTitle = `${extProps.serviceName || 'Service'} - **`
      } else if (extProps.privacy === 'vip' && privacyMode === 'initials_only') {
        const initials = extProps.clientName?.split(' ').map((n: string) => n[0]).join('') || 'VIP'
        displayTitle = `${extProps.serviceName || 'Service'} - ${initials}`
      }
    }
    
    return (
      <div className="fc-event-main">
        <div className="fc-event-title-container">
          <div className="fc-event-title fc-sticky">
            {extProps.privacy && (
              <Shield className="inline w-3 h-3 mr-1 text-amber-500" />
            )}
            {displayTitle}
          </div>
        </div>
        {extProps.locationId && (
          <div className="fc-event-location text-xs opacity-75">
            <MapPin className="inline w-2 h-2 mr-1" />
            {extProps.locationName || 'Location'}
          </div>
        )}
        {extProps.aiInsights?.confidence && extProps.aiInsights.confidence > 0.8 && (
          <div className="fc-event-ai-badge">
            <Star className="inline w-2 h-2 text-yellow-400" />
          </div>
        )}
      </div>
    )
  }, [privacyMode])

  // Event color determination
  const determineEventColor = useCallback((event: HeraDnaCalendarEvent) => {
    // Check for specific color in dynamic data
    if (event.extendedProps.industryData?.color_hex) {
      return event.extendedProps.industryData.color_hex
    }
    
    // Industry-specific color logic
    switch (industryType) {
      case 'salon':
        if (event.extendedProps.smartCode?.includes('CHEMICAL')) return industryColors.chemical
        if (event.extendedProps.smartCode?.includes('COLOR')) return industryColors.color
        if (event.extendedProps.privacy === 'vip') return industryColors.vip
        if (event.extendedProps.smartCode?.includes('BRIDAL')) return industryColors.bridal
        return industryColors.walkin
      
      case 'restaurant':
        if (event.extendedProps.smartCode?.includes('RESERVATION')) return industryColors.reservation
        if (event.extendedProps.smartCode?.includes('VIP')) return industryColors.vip
        if (event.extendedProps.smartCode?.includes('TAKEAWAY')) return industryColors.takeaway
        return industryColors.walkin
        
      default:
        return industryColors.primary
    }
  }, [industryType, industryColors])

  // Load calendar data
  const loadCalendarData = useCallback(async (start: Date, end: Date) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/v1/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}&org=${orgId}`)
      const data = await response.json()
      
      // Apply colors and privacy settings
      const processedEvents = data.events.map((event: HeraDnaCalendarEvent) => ({
        ...event,
        backgroundColor: determineEventColor(event),
        borderColor: determineEventColor(event),
        textColor: '#FFFFFF'
      }))
      
      setEvents(processedEvents)
      setResources(data.resources || [])
    } catch (error) {
      console.error('Failed to load calendar data:', error)
    } finally {
      setLoading(false)
    }
  }, [orgId, determineEventColor])

  // Handle event interactions
  const handleEventClick = useCallback(async (clickInfo: EventClickArg) => {
    const event = clickInfo.event
    const extProps = event.extendedProps
    
    // Privacy check
    if (extProps.privacy && !showVipDetails) {
      return // Blocked access to VIP details
    }
    
    // Open event details modal
    console.log('Event clicked:', event.toPlainObject())
  }, [showVipDetails])

  const handleEventDrop = useCallback(async (dropInfo: EventDropArg) => {
    const event = dropInfo.event
    
    // Conflict check
    if (onAvailabilityCheck) {
      const available = await onAvailabilityCheck(
        event.start!,
        event.end!,
        event.getResources()[0]?.id
      )
      
      if (!available) {
        dropInfo.revert()
        return
      }
    }
    
    // Update via API
    if (onEventUpdate) {
      await onEventUpdate(event.id, {
        start_time: event.start?.toISOString(),
        end_time: event.end?.toISOString(),
        resource_id: event.getResources()[0]?.id
      })
    }
  }, [onAvailabilityCheck, onEventUpdate])

  const handleDateSelect = useCallback(async (selectInfo: DateSelectArg) => {
    if (onEventCreate) {
      const eventData = {
        start_time: selectInfo.start.toISOString(),
        end_time: selectInfo.end.toISOString(),
        resource_id: selectInfo.resource?.id,
        organization_id: orgId,
        smart_code: `HERA.${industryType.toUpperCase()}.CALENDAR.APPOINTMENT.STANDARD.v1`
      }
      
      await onEventCreate(eventData)
    }
  }, [onEventCreate, orgId, industryType])

  // Calendar configuration
  const calendarConfig = useMemo(() => ({
    plugins: [
      dayGridPlugin,
      timeGridPlugin,
      interactionPlugin,
      listPlugin,
      resourceTimeGridPlugin,
      resourceTimelinePlugin,
      rrulePlugin
    ],
    initialView: currentView,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,resourceTimeGridDay'
    },
    businessHours,
    locale: currentLocale,
    direction: isRtl ? 'rtl' : 'ltr',
    height: 'auto',
    events: events,
    resources: resources,
    
    // Event rendering
    eventContent: renderEvent,
    
    // Interactions
    selectable: true,
    selectMirror: true,
    editable: true,
    droppable: true,
    
    // Callbacks
    select: handleDateSelect,
    eventClick: handleEventClick,
    eventDrop: handleEventDrop,
    
    // Resource settings
    resourceAreaWidth: '20%',
    resourceLabelText: industryType === 'salon' ? 'Stylists' : 'Resources',
    
    // Scheduling features
    selectConstraint: businessHours,
    eventConstraint: businessHours,
    
    // Performance
    eventDisplay: 'block',
    progressiveEventRendering: true
  }), [
    currentView, currentLocale, isRtl, events, resources, businessHours,
    renderEvent, handleDateSelect, handleEventClick, handleEventDrop, industryType
  ])

  // Load data when component mounts or view changes
  useEffect(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    loadCalendarData(start, end)
  }, [loadCalendarData])

  return (
    <div className="hera-dna-calendar-container">
      {/* Calendar Header */}
      <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                {industryType === 'salon' ? 'Salon Calendar' : 'Universal Calendar'}
                <Badge className="bg-blue-100 text-blue-700">
                  HERA DNA
                </Badge>
              </CardTitle>
            </div>
            
            {/* Calendar Controls */}
            <div className="flex items-center gap-4">
              {/* Locale Toggle */}
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <Select value={currentLocale} onValueChange={setCurrentLocale}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* RTL Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm">RTL</span>
                <Switch checked={isRtl} onCheckedChange={setIsRtl} />
              </div>
              
              {/* VIP Access Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVipDetails(!showVipDetails)}
                  className={showVipDetails ? 'bg-amber-100 border-amber-300' : ''}
                >
                  {showVipDetails ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  VIP Access
                </Button>
              </div>
              
              {/* Refresh */}
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading calendar data...
            </div>
          )}
          
          <FullCalendar {...calendarConfig} />
        </CardContent>
      </Card>

      {/* Industry-Specific Legend */}
      <Card className="mt-6 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Color Legend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(industryColors).map(([key, color]) => (
              <div key={key} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default HeraDnaUniversalCalendar