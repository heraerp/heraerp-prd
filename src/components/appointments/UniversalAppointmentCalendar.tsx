'use client'

import React, { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  Plus,
  Filter,
  Settings,
  Brain,
  Sparkles,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import {
  UniversalAppointmentSystem,
  APPOINTMENT_SMART_CODES,
  APPOINTMENT_WORKFLOW,
  SERVICE_TYPES
} from '@/src/lib/appointments/universal-appointment-system'

// HERA Universal Appointment Calendar with FullCalendar Integration
// Smart Code: HERA.UNIV.CRM.APT.CAL.v1

interface AppointmentEvent {
  id: string
  title: string
  start: string
  end: string
  backgroundColor: string
  borderColor: string
  textColor: string
  extendedProps: {
    appointmentId: string
    customerId: string
    customerName: string
    customerPhone?: string
    customerEmail?: string
    serviceId: string
    serviceName: string
    status: string
    industry: 'jewelry' | 'healthcare' | 'restaurant' | 'professional'
    smartCode: string
    staffAssigned?: string[]
    specialRequests?: string
    totalAmount?: number
    aiInsights?: Record<string, any>
  }
}

interface UniversalAppointmentCalendarProps {
  organizationId: string
  industry: 'jewelry' | 'healthcare' | 'restaurant' | 'professional'
  viewType?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'
  staffFilter?: string[]
  serviceFilter?: string[]
  onAppointmentClick?: (appointment: AppointmentEvent) => void
  onSlotClick?: (dateInfo: any) => void
  onAppointmentChange?: (appointment: AppointmentEvent) => void
}

// Industry-specific styling
const INDUSTRY_STYLES = {
  jewelry: {
    primary: '#8B5CF6', // Purple
    secondary: '#EC4899', // Pink
    background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    text: '#FFFFFF'
  },
  healthcare: {
    primary: '#059669', // Emerald
    secondary: '#0284C7', // Blue
    background: 'linear-gradient(135deg, #059669 0%, #0284C7 100%)',
    text: '#FFFFFF'
  },
  restaurant: {
    primary: '#DC2626', // Red
    secondary: '#EA580C', // Orange
    background: 'linear-gradient(135deg, #DC2626 0%, #EA580C 100%)',
    text: '#FFFFFF'
  },
  professional: {
    primary: '#1F2937', // Gray
    secondary: '#374151', // Dark Gray
    background: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)',
    text: '#FFFFFF'
  }
}

// Status colors
const STATUS_COLORS = {
  [APPOINTMENT_WORKFLOW.DRAFT]: { bg: '#F3F4F6', border: '#D1D5DB', text: '#374151' },
  [APPOINTMENT_WORKFLOW.SCHEDULED]: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
  [APPOINTMENT_WORKFLOW.CONFIRMED]: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
  [APPOINTMENT_WORKFLOW.REMINDED]: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  [APPOINTMENT_WORKFLOW.CHECKED_IN]: { bg: '#E0E7FF', border: '#8B5CF6', text: '#5B21B6' },
  [APPOINTMENT_WORKFLOW.IN_PROGRESS]: { bg: '#FECACA', border: '#EF4444', text: '#991B1B' },
  [APPOINTMENT_WORKFLOW.COMPLETED]: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
  [APPOINTMENT_WORKFLOW.CANCELLED]: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' },
  [APPOINTMENT_WORKFLOW.NO_SHOW]: { bg: '#F3F4F6', border: '#6B7280', text: '#374151' }
}

export function UniversalAppointmentCalendar({
  organizationId,
  industry,
  viewType = 'timeGridWeek',
  staffFilter = [],
  serviceFilter = [],
  onAppointmentClick,
  onSlotClick,
  onAppointmentChange
}: UniversalAppointmentCalendarProps) {
  const [appointments, setAppointments] = useState<AppointmentEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedView, setSelectedView] = useState(viewType)
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [isProcessingAI, setIsProcessingAI] = useState(false)

  const calendarRef = useRef<FullCalendar>(null)
  const appointmentSystem = new UniversalAppointmentSystem(organizationId)
  const industryStyle = INDUSTRY_STYLES[industry]

  useEffect(() => {
    loadAppointments()
  }, [organizationId, industry, staffFilter, serviceFilter])

  const loadAppointments = async () => {
    setIsLoading(true)

    try {
      // In production, this would fetch from database
      // For demo, generate sample appointments based on industry
      const sampleAppointments = generateSampleAppointments()
      setAppointments(sampleAppointments)
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateSampleAppointments = (): AppointmentEvent[] => {
    const appointments: AppointmentEvent[] = []
    const today = new Date()

    // Generate appointments for the next 30 days
    for (let i = 0; i < 30; i++) {
      const appointmentDate = new Date(today)
      appointmentDate.setDate(today.getDate() + i)

      // Skip weekends for professional services
      if (
        industry === 'professional' &&
        (appointmentDate.getDay() === 0 || appointmentDate.getDay() === 6)
      ) {
        continue
      }

      // Generate 2-8 appointments per day
      const appointmentsPerDay = Math.floor(Math.random() * 7) + 2

      for (let j = 0; j < appointmentsPerDay; j++) {
        const appointment = generateSingleAppointment(appointmentDate, j)
        if (appointment) {
          appointments.push(appointment)
        }
      }
    }

    return appointments.slice(0, 100) // Limit to 100 appointments for demo
  }

  const generateSingleAppointment = (date: Date, index: number): AppointmentEvent | null => {
    // Business hours based on industry
    const businessHours = {
      jewelry: { start: 10, end: 19 }, // 10 AM - 7 PM
      healthcare: { start: 8, end: 17 }, // 8 AM - 5 PM
      restaurant: { start: 11, end: 23 }, // 11 AM - 11 PM
      professional: { start: 9, end: 18 } // 9 AM - 6 PM
    }

    const hours = businessHours[industry]
    const startHour = hours.start + Math.floor(Math.random() * (hours.end - hours.start - 2))
    const startMinute = Math.floor(Math.random() * 4) * 15 // 0, 15, 30, 45

    const startTime = new Date(date)
    startTime.setHours(startHour, startMinute, 0, 0)

    // Get random service for industry
    const serviceTypes = SERVICE_TYPES[industry.toUpperCase() as keyof typeof SERVICE_TYPES]
    const serviceKeys = Object.keys(serviceTypes)
    const randomServiceKey = serviceKeys[Math.floor(Math.random() * serviceKeys.length)]
    const serviceInfo = serviceTypes[randomServiceKey as keyof typeof serviceTypes]

    const duration = serviceInfo.duration || 60
    const endTime = new Date(startTime.getTime() + duration * 60000)

    // Generate customer info
    const customerNames = {
      jewelry: ['Priya Sharma', 'Rajesh Gupta', 'Anita Singh', 'Vikram Mehta', 'Sunita Joshi'],
      healthcare: ['John Smith', 'Emily Johnson', 'Michael Brown', 'Sarah Davis', 'David Wilson'],
      restaurant: ['Alice Cooper', 'Bob Anderson', 'Carol Martinez', 'Daniel Lee', 'Eva Garcia'],
      professional: [
        'James Miller',
        'Jennifer Taylor',
        'Robert Clark',
        'Lisa Rodriguez',
        'William Hall'
      ]
    }

    const names = customerNames[industry]
    const customerName = names[Math.floor(Math.random() * names.length)]

    // Random status
    const statuses = Object.values(APPOINTMENT_WORKFLOW)
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const statusColors = STATUS_COLORS[status as keyof typeof STATUS_COLORS]

    // Generate AI insights if enabled
    const aiInsights = aiAnalysisEnabled
      ? {
          confidence_score: Math.floor(Math.random() * 30) + 70, // 70-100%
          customer_segment: ['premium', 'standard', 'new'][Math.floor(Math.random() * 3)],
          predicted_duration: duration + (Math.floor(Math.random() * 21) - 10), // ±10 minutes
          upsell_opportunity: Math.random() > 0.7,
          no_show_risk: Math.floor(Math.random() * 30) + 5 // 5-35%
        }
      : undefined

    return {
      id: `apt_${Date.now()}_${index}`,
      title: `${customerName} - ${serviceInfo.name}`,
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      backgroundColor: statusColors.bg,
      borderColor: statusColors.border,
      textColor: statusColors.text,
      extendedProps: {
        appointmentId: `apt_${Date.now()}_${index}`,
        customerId: `cust_${Math.floor(Math.random() * 10000)}`,
        customerName,
        customerPhone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        customerEmail: `${customerName.toLowerCase().replace(' ', '.')}@email.com`,
        serviceId: randomServiceKey,
        serviceName: serviceInfo.name,
        status,
        industry,
        smartCode: serviceInfo.smart_code,
        staffAssigned: [`staff_${Math.floor(Math.random() * 5) + 1}`],
        specialRequests: Math.random() > 0.7 ? 'Special dietary requirements' : '',
        totalAmount: serviceInfo.price,
        aiInsights
      }
    }
  }

  const handleDateSelect = (selectInfo: any) => {
    if (onSlotClick) {
      onSlotClick({
        start: selectInfo.start,
        end: selectInfo.end,
        allDay: selectInfo.allDay
      })
    }
  }

  const handleEventClick = (clickInfo: any) => {
    if (onAppointmentClick) {
      onAppointmentClick(clickInfo.event)
    }
  }

  const handleEventChange = (changeInfo: any) => {
    if (onAppointmentChange) {
      onAppointmentChange(changeInfo.event)
    }
  }

  const runAIOptimization = async () => {
    setIsProcessingAI(true)

    // Simulate AI processing
    setTimeout(() => {
      // Update appointments with AI insights
      setAppointments(prev =>
        prev.map(apt => ({
          ...apt,
          extendedProps: {
            ...apt.extendedProps,
            aiInsights: {
              ...apt.extendedProps.aiInsights,
              optimization_score: Math.floor(Math.random() * 30) + 70,
              suggested_improvements: ['Optimize time slot', 'Consider staff reallocation'],
              last_updated: new Date().toISOString()
            }
          }
        }))
      )

      setIsProcessingAI(false)
    }, 2000)
  }

  const getIndustryIcon = () => {
    const icons = {
      jewelry: '💎',
      healthcare: '🏥',
      restaurant: '🍽️',
      professional: '💼'
    }
    return icons[industry]
  }

  const renderEventContent = (eventInfo: any) => {
    const props = eventInfo.event.extendedProps

    return (
      <div className="p-1 text-xs">
        <div className="font-medium truncate">{props.customerName}</div>
        <div className="text-xs opacity-75 truncate">{props.serviceName}</div>
        {props.aiInsights && (
          <div className="flex items-center gap-1 mt-1">
            <Brain className="w-3 h-3" />
            <span className="text-xs">{props.aiInsights.confidence_score}%</span>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading appointments...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Calendar className="w-8 h-8" style={{ color: industryStyle.primary }} />
            {getIndustryIcon()} {industry.charAt(0).toUpperCase() + industry.slice(1)} Appointment
            Calendar
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            HERA Universal Appointment System • Smart Code: HERA.UNIV.CRM.APT.CAL.v1
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* View Controls */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {[
              { key: 'dayGridMonth', label: 'Month' },
              { key: 'timeGridWeek', label: 'Week' },
              { key: 'timeGridDay', label: 'Day' }
            ].map(view => (
              <Button
                key={view.key}
                variant={selectedView === view.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setSelectedView(view.key as any)
                  calendarRef.current?.getApi().changeView(view.key)
                }}
                className="text-xs"
              >
                {view.label}
              </Button>
            ))}
          </div>

          {/* AI Controls */}
          <Button
            onClick={runAIOptimization}
            disabled={isProcessingAI}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isProcessingAI ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                AI Optimize
              </>
            )}
          </Button>

          {/* Filter Button */}
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>

          {/* New Appointment */}
          <Button
            onClick={() => onSlotClick?.({})}
            style={{ background: industryStyle.background }}
            className="text-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Appointment Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Status Filter</label>
                <div className="space-y-1">
                  {Object.entries(STATUS_COLORS).map(([status, colors]) => (
                    <label key={status} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" defaultChecked />
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          borderColor: colors.border
                        }}
                      >
                        {status.replace('_', ' ')}
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Service Filter</label>
                <div className="space-y-1">
                  {Object.keys(
                    SERVICE_TYPES[industry.toUpperCase() as keyof typeof SERVICE_TYPES]
                  ).map(serviceKey => (
                    <label key={serviceKey} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" defaultChecked />
                      <span>{serviceKey.replace('_', ' ').toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">AI Features</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={aiAnalysisEnabled}
                      onChange={e => setAiAnalysisEnabled(e.target.checked)}
                    />
                    <Brain className="w-4 h-4" />
                    AI Analysis
                  </label>
                  <div className="pl-6 text-xs text-muted-foreground">
                    Show confidence scores and predictions
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '' // We handle view switching with our custom buttons
            }}
            initialView={selectedView}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={industry !== 'professional'} // Professional services typically don't work weekends
            events={appointments}
            select={handleDateSelect}
            eventContent={renderEventContent}
            eventClick={handleEventClick}
            eventChange={handleEventChange}
            businessHours={{
              daysOfWeek: industry === 'professional' ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6],
              startTime:
                industry === 'healthcare' ? '08:00' : industry === 'restaurant' ? '11:00' : '09:00',
              endTime:
                industry === 'restaurant' ? '23:00' : industry === 'jewelry' ? '19:00' : '17:00'
            }}
            slotMinTime="06:00:00"
            slotMaxTime="24:00:00"
            height="600px"
            nowIndicator={true}
            eventDisplay="block"
            dayHeaders={true}
            allDaySlot={false}
          />
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" style={{ color: industryStyle.primary }} />
              <div>
                <p className="text-sm text-muted-foreground">Total Appointments</p>
                <p className="text-2xl font-bold">{appointments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Confirmed Today</p>
                <p className="text-2xl font-bold">
                  {
                    appointments.filter(
                      apt =>
                        apt.extendedProps.status === APPOINTMENT_WORKFLOW.CONFIRMED &&
                        new Date(apt.start).toDateString() === new Date().toDateString()
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">AI Confidence</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    appointments
                      .filter(apt => apt.extendedProps.aiInsights?.confidence_score)
                      .reduce(
                        (sum, apt) => sum + (apt.extendedProps.aiInsights?.confidence_score || 0),
                        0
                      ) /
                      appointments.filter(apt => apt.extendedProps.aiInsights?.confidence_score)
                        .length
                  ) || 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold">
                  {
                    appointments.filter(
                      apt =>
                        apt.extendedProps.aiInsights?.no_show_risk &&
                        apt.extendedProps.aiInsights.no_show_risk > 25
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default UniversalAppointmentCalendar
