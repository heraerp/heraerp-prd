'use client'

// HERA Universal Calendar Component
// Works across all industries with FullCalendar integration

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import { EventInput, DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core'

import {
  UniversalCalendarProps,
  UniversalResource,
  UniversalAppointment,
  CalendarView,
  IndustryCalendarConfig,
  SchedulingConflict
} from '@/types/calendar.types'
import { useCalendarAPI } from '@/services/calendarAPI'
import { calendarSmartCodeService } from '@/services/calendarSmartCodeService'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  Users,
  Clock,
  AlertTriangle,
  Settings,
  BarChart3,
  Filter,
  Plus,
  RefreshCw
} from 'lucide-react'

import { AppointmentModal } from './AppointmentModal'
import { ResourcePanel } from './ResourcePanel'
import { ConflictResolver } from './ConflictResolver'
import { CalendarAnalytics } from './CalendarAnalytics'

export function UniversalCalendar({
  organization_id,
  industry_type = 'universal',
  initial_view = 'timeGridWeek',
  show_resources = true,
  editable = true,
  selectable = true,
  height = 'auto',
  business_hours,
  resources: propResources = [],
  events: propEvents = [],
  on_event_click,
  on_event_drop,
  on_event_resize,
  on_date_select,
  on_resource_click,
  custom_buttons = {},
  header_toolbar,
  footer_toolbar,
  slot_duration = '00:15:00',
  slot_min_time = '06:00:00',
  slot_max_time = '22:00:00',
  all_day_slot = true
}: UniversalCalendarProps) {
  // ==================== STATE MANAGEMENT ====================
  const [resources, setResources] = useState<UniversalResource[]>(propResources)
  const [appointments, setAppointments] = useState<UniversalAppointment[]>(propEvents)
  const [selectedAppointment, setSelectedAppointment] = useState<UniversalAppointment | null>(null)
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [isResourcePanelOpen, setIsResourcePanelOpen] = useState(false)
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)
  const [currentView, setCurrentView] = useState<CalendarView>(initial_view)
  const [loading, setLoading] = useState(false)
  const [conflicts, setConflicts] = useState<SchedulingConflict[]>([])
  const [industryConfig, setIndustryConfig] = useState<IndustryCalendarConfig | null>(null)
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date } | null>(
    null
  )

  // API instance
  const calendarAPI = useCalendarAPI(organization_id, 'current-user') // TODO: Get actual user ID

  // ==================== DATA LOADING ====================
  useEffect(() => {
    loadInitialData()
  }, [organization_id, industry_type])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      // Load industry configuration
      const config = await calendarAPI.getIndustryConfig(industry_type)
      setIndustryConfig(config)

      // Load resources if not provided as props
      if (propResources.length === 0) {
        const resourcesData = await calendarAPI.getResources({
          industry_type: industry_type !== 'universal' ? industry_type : undefined
        })
        setResources(resourcesData)
      }

      // Load appointments if not provided as props
      if (propEvents.length === 0) {
        const appointmentsData = await calendarAPI.getAppointments({
          start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days ahead
        })
        setAppointments(appointmentsData)
      }
    } catch (error) {
      console.error('Failed to load calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  // ==================== STYLING HELPERS ====================
  const getAppointmentColor = (appointment: UniversalAppointment): string => {
    switch (appointment.status) {
      case 'confirmed':
        return '#22c55e'
      case 'in_progress':
        return '#3b82f6'
      case 'completed':
        return '#8b5cf6'
      case 'cancelled':
        return '#ef4444'
      case 'no_show':
        return '#f59e0b'
      default:
        return '#6b7280'
    }
  }

  const getAppointmentBorderColor = (appointment: UniversalAppointment): string => {
    switch (appointment.priority) {
      case 'urgent':
        return '#dc2626'
      case 'high':
        return '#ea580c'
      case 'medium':
        return '#ca8a04'
      default:
        return '#6b7280'
    }
  }

  const getAppointmentTextColor = (appointment: UniversalAppointment): string => {
    return '#ffffff'
  }

  // ==================== EVENT CONVERSION ====================
  const calendarEvents: EventInput[] = useMemo(() => {
    return appointments.map(appointment => {
      const resourceAllocations = appointment.industry_data?.resource_allocations || []

      return {
        id: appointment.transaction_id,
        title: appointment.title,
        start: appointment.start_time,
        end: appointment.end_time,
        resourceIds: resourceAllocations.map((alloc: any) => alloc.entity_id),
        backgroundColor: getAppointmentColor(appointment),
        borderColor: getAppointmentBorderColor(appointment),
        textColor: getAppointmentTextColor(appointment),
        extendedProps: {
          appointment,
          description: appointment.description,
          status: appointment.status,
          priority: appointment.priority,
          appointment_type: appointment.appointment_type,
          customer_name: appointment.industry_data?.customer_name,
          smart_code: appointment.smart_code
        }
      }
    })
  }, [appointments])

  const calendarResources = useMemo(() => {
    if (!show_resources) return []

    return resources.map(resource => ({
      id: resource.entity_id,
      title: resource.entity_name,
      businessHours: resource.availability_windows
        ? JSON.parse(resource.availability_windows)
        : business_hours,
      extendedProps: {
        resource,
        resource_type: resource.resource_type,
        skills: resource.skills,
        capacity: resource.capacity,
        status: resource.status,
        smart_code: resource.smart_code
      }
    }))
  }, [resources, show_resources, business_hours])

  // ==================== EVENT HANDLERS ====================
  const handleDateSelect = useCallback(
    async (selectInfo: DateSelectArg) => {
      const { start, end, resource } = selectInfo

      setSelectedDateRange({ start, end })
      setSelectedAppointment(null)
      setIsAppointmentModalOpen(true)

      if (on_date_select) {
        const selectedResource = resource
          ? resources.find(r => r.entity_id === resource.id)
          : undefined
        on_date_select(start, end, selectedResource)
      }
    },
    [resources, on_date_select]
  )

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const appointment = clickInfo.event.extendedProps.appointment as UniversalAppointment
      setSelectedAppointment(appointment)
      setIsAppointmentModalOpen(true)

      if (on_event_click) {
        on_event_click(appointment)
      }
    },
    [on_event_click]
  )

  const handleEventDrop = useCallback(
    async (dropInfo: EventDropArg) => {
      const appointment = dropInfo.event.extendedProps.appointment as UniversalAppointment
      const delta = dropInfo.delta

      // Check for conflicts before allowing the drop
      const conflicts = await calendarAPI.checkConflicts(
        {
          ...appointment,
          start_time: new Date(appointment.start_time.getTime() + delta.milliseconds),
          end_time: new Date(appointment.end_time.getTime() + delta.milliseconds)
        },
        appointment.industry_data?.resource_allocations || []
      )

      if (conflicts.length > 0) {
        dropInfo.revert()
        setConflicts(conflicts)
        return
      }

      // Update appointment
      try {
        const updatedAppointment = await calendarAPI.updateAppointment(appointment.transaction_id, {
          start_time: new Date(appointment.start_time.getTime() + delta.milliseconds),
          end_time: new Date(appointment.end_time.getTime() + delta.milliseconds)
        })

        setAppointments(prev =>
          prev.map(appt =>
            appt.transaction_id === updatedAppointment.transaction_id ? updatedAppointment : appt
          )
        )

        if (on_event_drop) {
          on_event_drop(updatedAppointment, delta)
        }
      } catch (error) {
        console.error('Failed to update appointment:', error)
        dropInfo.revert()
      }
    },
    [calendarAPI, on_event_drop]
  )

  const handleEventResize = useCallback(
    async (resizeInfo: any) => {
      const appointment = resizeInfo.event.extendedProps.appointment as UniversalAppointment
      const delta = resizeInfo.endDelta

      try {
        const updatedAppointment = await calendarAPI.updateAppointment(appointment.transaction_id, {
          end_time: new Date(appointment.end_time.getTime() + delta.milliseconds),
          duration_minutes: Math.round(
            (new Date(appointment.end_time.getTime() + delta.milliseconds).getTime() -
              appointment.start_time.getTime()) /
              (1000 * 60)
          )
        })

        setAppointments(prev =>
          prev.map(appt =>
            appt.transaction_id === updatedAppointment.transaction_id ? updatedAppointment : appt
          )
        )

        if (on_event_resize) {
          on_event_resize(updatedAppointment, delta)
        }
      } catch (error) {
        console.error('Failed to resize appointment:', error)
        resizeInfo.revert()
      }
    },
    [calendarAPI, on_event_resize]
  )

  const handleResourceClick = useCallback(
    (resourceInfo: any) => {
      const resource = resourceInfo.resource.extendedProps.resource as UniversalResource

      if (on_resource_click) {
        on_resource_click(resource)
      }
    },
    [on_resource_click]
  )

  // ==================== APPOINTMENT MANAGEMENT ====================
  const handleCreateAppointment = async (appointmentData: Partial<UniversalAppointment>) => {
    try {
      // Use selected date range if available
      if (selectedDateRange && !appointmentData.start_time) {
        appointmentData.start_time = selectedDateRange.start
        appointmentData.end_time = selectedDateRange.end
      }

      const resourceAllocations = appointmentData.industry_data?.resource_allocations || []

      const newAppointment = await calendarAPI.createAppointment(
        appointmentData,
        resourceAllocations
      )

      setAppointments(prev => [...prev, newAppointment])
      setIsAppointmentModalOpen(false)
      setSelectedDateRange(null)
    } catch (error) {
      console.error('Failed to create appointment:', error)
    }
  }

  const handleUpdateAppointment = async (appointmentData: Partial<UniversalAppointment>) => {
    if (!selectedAppointment) return

    try {
      const updatedAppointment = await calendarAPI.updateAppointment(
        selectedAppointment.transaction_id,
        appointmentData
      )

      setAppointments(prev =>
        prev.map(appt =>
          appt.transaction_id === updatedAppointment.transaction_id ? updatedAppointment : appt
        )
      )

      setIsAppointmentModalOpen(false)
      setSelectedAppointment(null)
    } catch (error) {
      console.error('Failed to update appointment:', error)
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      await calendarAPI.deleteAppointment(appointmentId)
      setAppointments(prev => prev.filter(appt => appt.transaction_id !== appointmentId))
      setIsAppointmentModalOpen(false)
      setSelectedAppointment(null)
    } catch (error) {
      console.error('Failed to delete appointment:', error)
    }
  }

  // ==================== RESOURCE MANAGEMENT ====================
  const handleCreateResource = async (resourceData: Partial<UniversalResource>) => {
    try {
      const newResource = await calendarAPI.createResource(resourceData)
      setResources(prev => [...prev, newResource])
    } catch (error) {
      console.error('Failed to create resource:', error)
    }
  }

  const handleUpdateResource = async (resource: UniversalResource) => {
    try {
      const updatedResource = await calendarAPI.updateResource(resource.entity_id, resource)
      setResources(prev =>
        prev.map(res => (res.entity_id === updatedResource.entity_id ? updatedResource : res))
      )
    } catch (error) {
      console.error('Failed to update resource:', error)
    }
  }

  const handleDeleteResource = async (resourceId: string) => {
    try {
      await calendarAPI.deleteResource(resourceId)
      setResources(prev => prev.filter(res => res.entity_id !== resourceId))
    } catch (error) {
      console.error('Failed to delete resource:', error)
    }
  }

  // ==================== TOOLBAR CONFIGURATION ====================
  const defaultHeaderToolbar = {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
  }

  const defaultFooterToolbar = {
    left: 'resourceToggle,analyticsToggle',
    center: '',
    right: 'refresh'
  }

  const toolbarButtons = {
    resourceToggle: {
      text: show_resources ? 'Hide Resources' : 'Show Resources',
      click: () => setIsResourcePanelOpen(!isResourcePanelOpen)
    },
    analyticsToggle: {
      text: 'Analytics',
      click: () => setIsAnalyticsOpen(!isAnalyticsOpen)
    },
    refresh: {
      text: 'Refresh',
      click: loadInitialData
    },
    ...custom_buttons
  }

  // ==================== RENDER ====================
  return (
    <div className="hera-universal-calendar w-full h-full">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <CardTitle className="text-xl font-semibold">
              {industry_type === 'universal'
                ? 'Universal Calendar'
                : `${industry_type.charAt(0).toUpperCase() + industry_type.slice(1)} Calendar`}
            </CardTitle>
            {industryConfig && <Badge variant="outline">{industryConfig.industry}</Badge>}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setIsAnalyticsOpen(true)}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>

            <Button variant="outline" size="sm" onClick={() => setIsResourcePanelOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              Resources ({resources.length})
            </Button>

            <Button
              size="sm"
              onClick={() => {
                setSelectedAppointment(null)
                setSelectedDateRange(null)
                setIsAppointmentModalOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>

            {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {conflicts.length > 0 && (
            <div className="p-4 bg-orange-50 border-b">
              <div className="flex items-center space-x-2 text-orange-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">
                  {conflicts.length} scheduling conflict{conflicts.length > 1 ? 's' : ''} detected
                </span>
              </div>
              <ConflictResolver
                conflicts={conflicts}
                onResolve={resolutions => {
                  // Apply conflict resolutions
                  setConflicts([])
                }}
              />
            </div>
          )}

          <div className="p-4">
            <FullCalendar
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                interactionPlugin,
                listPlugin,
                ...(show_resources ? [resourceTimeGridPlugin] : [])
              ]}
              headerToolbar={header_toolbar || defaultHeaderToolbar}
              footerToolbar={footer_toolbar || defaultFooterToolbar}
              customButtons={toolbarButtons}
              initialView={show_resources ? 'resourceTimeGridWeek' : initial_view}
              resources={show_resources ? calendarResources : undefined}
              events={calendarEvents}
              editable={editable}
              selectable={selectable}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              height={height}
              slotDuration={slot_duration}
              slotMinTime={slot_min_time}
              slotMaxTime={slot_max_time}
              allDaySlot={all_day_slot}
              businessHours={business_hours}
              eventClick={handleEventClick}
              select={handleDateSelect}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              resourceClick={handleResourceClick}
              eventDisplay="block"
              eventTimeFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short'
              }}
              slotLabelFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short'
              }}
              nowIndicator={true}
              scrollTime="08:00:00"
              expandRows={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Appointment Modal */}
      <AppointmentModal
        organization_id={organization_id}
        appointment={selectedAppointment}
        resources={resources}
        is_open={isAppointmentModalOpen}
        on_close={() => {
          setIsAppointmentModalOpen(false)
          setSelectedAppointment(null)
          setSelectedDateRange(null)
        }}
        on_save={selectedAppointment ? handleUpdateAppointment : handleCreateAppointment}
        on_delete={selectedAppointment ? handleDeleteAppointment : undefined}
        mode={selectedAppointment ? 'edit' : 'create'}
        industry_config={
          industryConfig || {
            industry: industry_type,
            resource_types: ['STAFF', 'EQUIPMENT', 'ROOM'],
            appointment_types: ['appointment', 'meeting', 'consultation'],
            default_duration: 60,
            business_hours: {
              start: '09:00',
              end: '17:00',
              days: ['MON', 'TUE', 'WED', 'THU', 'FRI']
            },
            booking_rules: { advance_booking_days: 30, cancellation_hours: 24 },
            required_fields: ['title', 'start_time', 'end_time'],
            optional_fields: ['description', 'notes']
          }
        }
        initial_start_time={selectedDateRange?.start}
        initial_end_time={selectedDateRange?.end}
      />

      {/* Resource Panel */}
      <ResourcePanel
        organization_id={organization_id}
        industry_type={industry_type}
        resources={resources}
        is_open={isResourcePanelOpen}
        on_close={() => setIsResourcePanelOpen(false)}
        on_resource_create={handleCreateResource}
        on_resource_update={handleUpdateResource}
        on_resource_delete={handleDeleteResource}
        show_utilization={true}
        show_analytics={true}
      />

      {/* Calendar Analytics */}
      <CalendarAnalytics
        organization_id={organization_id}
        industry_type={industry_type}
        resources={resources}
        appointments={appointments}
        is_open={isAnalyticsOpen}
        on_close={() => setIsAnalyticsOpen(false)}
        date_range={{
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        }}
      />
    </div>
  )
}
