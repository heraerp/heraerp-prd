/**
 * HERA DNA Universal Calendar API
 * Smart Code: HERA.API.CALENDAR.UNIVERSAL.v1
 *
 * RESTful API for calendar operations using Sacred Six Tables architecture
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import {
  CalendarEvent,
  CalendarResource,
  CalendarQueryParams,
  CreateEventRequest,
  UpdateEventRequest,
  CreateResourceRequest,
  UpdateResourceRequest,
  CalendarApiResponse,
  EventsResponse,
  ResourcesResponse
} from '@/src/types/calendar-api.types'

// GET /api/v1/calendar - Fetch events and resources
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { searchParams } = new URL(request.url)

    const params: CalendarQueryParams = {
      organization_id: searchParams.get('organization_id') || '',
      start: searchParams.get('start') || undefined,
      end: searchParams.get('end') || undefined,
      resource_ids: searchParams.get('resource_ids')?.split(',') || undefined,
      event_types: searchParams.get('event_types')?.split(',') || undefined,
      smart_codes: searchParams.get('smart_codes')?.split(',') || undefined,
      status: searchParams.get('status')?.split(',') || undefined,
      customer_id: searchParams.get('customer_id') || undefined,
      staff_id: searchParams.get('staff_id') || undefined,
      service_id: searchParams.get('service_id') || undefined,
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0')
    }

    if (!params.organization_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'organization_id is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Fetch events from universal_transactions with Sacred Six Tables pattern
    let eventsQuery = supabase
      .from('universal_transactions')
      .select(
        `
        id,
        transaction_type,
        transaction_date,
        total_amount,
        smart_code,
        organization_id,
        from_entity_id,
        to_entity_id,
        reference_number,
        notes,
        metadata,
        created_at,
        updated_at,
        status,
        universal_transaction_lines (
          id,
          line_entity_id,
          quantity,
          unit_price,
          line_amount,
          metadata
        )
      `
      )
      .eq('organization_id', params.organization_id)
      .like('smart_code', 'HERA.%.CALENDAR.%')

    // Apply date filters if provided
    if (params.start) {
      eventsQuery = eventsQuery.gte('transaction_date', params.start)
    }
    if (params.end) {
      eventsQuery = eventsQuery.lte('transaction_date', params.end)
    }

    // Apply filters
    if (params.event_types?.length) {
      eventsQuery = eventsQuery.in('transaction_type', params.event_types)
    }
    if (params.smart_codes?.length) {
      eventsQuery = eventsQuery.in('smart_code', params.smart_codes)
    }
    if (params.status?.length) {
      eventsQuery = eventsQuery.in('status', params.status)
    }

    eventsQuery = eventsQuery
      .range(params.offset, params.offset + params.limit - 1)
      .order('transaction_date', { ascending: true })

    const { data: eventsData, error: eventsError } = await eventsQuery

    if (eventsError) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch events: ${eventsError.message}`,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // Fetch resources from core_entities
    let resourcesQuery = supabase
      .from('core_entities')
      .select(
        `
        id,
        entity_type,
        entity_name,
        entity_code,
        smart_code,
        organization_id,
        status,
        metadata,
        created_at,
        updated_at,
        core_dynamic_data (
          field_name,
          field_value_text,
          field_value_number,
          field_value_boolean,
          field_value_date,
          metadata
        )
      `
      )
      .eq('organization_id', params.organization_id)
      .like('smart_code', 'HERA.%.CALENDAR.RESOURCE.%')

    if (params.resource_ids?.length) {
      resourcesQuery = resourcesQuery.in('id', params.resource_ids)
    }

    const { data: resourcesData, error: resourcesError } = await resourcesQuery

    if (resourcesError) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch resources: ${resourcesError.message}`,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // Transform data to FullCalendar format
    const events: CalendarEvent[] =
      eventsData?.map(event => ({
        id: event.id,
        title: extractEventTitle(event),
        start: event.transaction_date,
        end: calculateEventEnd(event),
        allDay: isAllDayEvent(event),
        resourceId: event.to_entity_id, // Resource assignment
        extendedProps: {
          entity_id: event.id,
          smart_code: event.smart_code,
          organization_id: event.organization_id,
          event_type: mapEventType(event.transaction_type),
          status: event.status || 'confirmed',
          customer_id: event.from_entity_id,
          staff_id: event.to_entity_id,
          service_id: extractServiceId(event),
          notes: event.notes || '',
          metadata: event.metadata || {}
        },
        backgroundColor: getEventColor(event.smart_code, event.status),
        borderColor: getEventBorderColor(event.smart_code, event.status),
        textColor: getEventTextColor(event.smart_code, event.status),
        classNames: [
          `calendar-event-${event.transaction_type}`,
          `smart-code-${event.smart_code.replace(/\./g, '-').toLowerCase()}`
        ]
      })) || []

    const resources: CalendarResource[] =
      resourcesData?.map(resource => ({
        id: resource.id,
        title: resource.entity_name,
        extendedProps: {
          entity_id: resource.id,
          smart_code: resource.smart_code,
          organization_id: resource.organization_id,
          resource_type: extractResourceType(resource.smart_code),
          capacity: extractCapacity(resource),
          skills: extractSkills(resource),
          availability: extractAvailability(resource),
          metadata: resource.metadata || {}
        },
        eventBackgroundColor: getResourceEventColor(resource.smart_code),
        eventBorderColor: getResourceEventBorderColor(resource.smart_code),
        eventTextColor: getResourceEventTextColor(resource.smart_code)
      })) || []

    const response: EventsResponse = {
      success: true,
      data: {
        events,
        resources,
        total_count: events.length,
        filtered_count: events.length
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// POST /api/v1/calendar - Create event or resource
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const body = await request.json()

    // Determine if creating event or resource based on request structure
    if (body.event_type) {
      return createEvent(supabase, body as CreateEventRequest)
    } else if (body.resource_type) {
      return createResource(supabase, body as CreateResourceRequest)
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: must specify event_type or resource_type',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// PUT /api/v1/calendar - Update event or resource
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID is required for updates',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Determine if updating event or resource
    if (body.event_type !== undefined) {
      return updateEvent(supabase, body as UpdateEventRequest)
    } else if (body.resource_type !== undefined) {
      return updateResource(supabase, body as UpdateResourceRequest)
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: must specify event_type or resource_type for updates',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/calendar - Delete event or resource
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { searchParams } = new URL(request.url)

    const id = searchParams.get('id')
    const type = searchParams.get('type') // 'event' or 'resource'
    const organization_id = searchParams.get('organization_id')

    if (!id || !type || !organization_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'id, type, and organization_id are required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    if (type === 'event') {
      return deleteEvent(supabase, id, organization_id)
    } else if (type === 'resource') {
      return deleteResource(supabase, id, organization_id)
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid type: must be "event" or "resource"',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Helper functions
async function createEvent(supabase: any, eventData: CreateEventRequest) {
  const { data, error } = await supabase
    .from('universal_transactions')
    .insert({
      transaction_type: eventData.event_type,
      transaction_date: eventData.start,
      smart_code: eventData.smart_code,
      from_entity_id: eventData.customer_id,
      to_entity_id: eventData.staff_id,
      reference_number: generateEventReference(),
      notes: eventData.notes,
      metadata: {
        ...eventData.metadata,
        title: eventData.title,
        end: eventData.end,
        allDay: eventData.allDay,
        resourceId: eventData.resourceId,
        service_id: eventData.service_id
      },
      status: 'confirmed'
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to create event: ${error.message}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: transformToCalendarEvent(data),
    message: 'Event created successfully',
    timestamp: new Date().toISOString()
  })
}

async function createResource(supabase: any, resourceData: CreateResourceRequest) {
  const { data, error } = await supabase
    .from('core_entities')
    .insert({
      entity_type: 'calendar_resource',
      entity_name: resourceData.title,
      entity_code: generateResourceCode(),
      smart_code: resourceData.smart_code,
      metadata: {
        ...resourceData.metadata,
        resource_type: resourceData.resource_type,
        capacity: resourceData.capacity,
        skills: resourceData.skills,
        availability: resourceData.availability
      },
      status: 'active'
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to create resource: ${error.message}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: transformToCalendarResource(data),
    message: 'Resource created successfully',
    timestamp: new Date().toISOString()
  })
}

// Additional helper functions for data transformation and business logic
function extractEventTitle(event: any): string {
  return (
    (event.metadata as any)?.title ||
    event.notes ||
    `${event.transaction_type} - ${event.transaction_date}`
  )
}

function calculateEventEnd(event: any): string | undefined {
  return (event.metadata as any)?.end || undefined
}

function isAllDayEvent(event: any): boolean {
  return (event.metadata as any)?.allDay || false
}

function mapEventType(
  transactionType: string
): 'appointment' | 'block' | 'holiday' | 'shift' | 'maintenance' {
  const mapping: Record<string, any> = {
    appointment: 'appointment',
    booking: 'appointment',
    block: 'block',
    holiday: 'holiday',
    shift: 'shift',
    maintenance: 'maintenance'
  }
  return mapping[transactionType] || 'appointment'
}

function extractServiceId(event: any): string | undefined {
  return (event.metadata as any)?.service_id || undefined
}

function getEventColor(smartCode: string, status?: string): string {
  // Color logic based on smart code and status
  if (status === 'cancelled') return '#ef4444'
  if (status === 'completed') return '#10b981'
  if (smartCode.includes('BRIDAL')) return '#f59e0b'
  if (smartCode.includes('VIP')) return '#8b5cf6'
  return '#3b82f6' // Default blue
}

function getEventBorderColor(smartCode: string, status?: string): string {
  return getEventColor(smartCode, status)
}

function getEventTextColor(smartCode: string, status?: string): string {
  return '#ffffff'
}

function extractResourceType(smartCode: string): 'staff' | 'room' | 'equipment' | 'location' {
  if (smartCode.includes('STAFF')) return 'staff'
  if (smartCode.includes('ROOM')) return 'room'
  if (smartCode.includes('EQUIPMENT')) return 'equipment'
  return 'location'
}

function extractCapacity(resource: any): number | undefined {
  return (
    (resource.metadata as any)?.capacity ||
    resource.core_dynamic_data?.find((d: any) => d.field_name === 'capacity')?.field_value_number
  )
}

function extractSkills(resource: any): string[] {
  return (resource.metadata as any)?.skills || []
}

function extractAvailability(resource: any): any[] {
  return (resource.metadata as any)?.availability || []
}

function getResourceEventColor(smartCode: string): string {
  if (smartCode.includes('CELEBRITY')) return '#8b5cf6'
  if (smartCode.includes('SENIOR')) return '#3b82f6'
  return '#6b7280'
}

function getResourceEventBorderColor(smartCode: string): string {
  return getResourceEventColor(smartCode)
}

function getResourceEventTextColor(smartCode: string): string {
  return '#ffffff'
}

function generateEventReference(): string {
  return `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
}

function generateResourceCode(): string {
  return `RES-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
}

function transformToCalendarEvent(data: any): CalendarEvent {
  return {
    id: data.id,
    title: extractEventTitle(data),
    start: data.transaction_date,
    end: calculateEventEnd(data),
    allDay: isAllDayEvent(data),
    extendedProps: {
      entity_id: data.id,
      smart_code: data.smart_code,
      organization_id: data.organization_id,
      event_type: mapEventType(data.transaction_type),
      status: data.status || 'confirmed',
      notes: data.notes || '',
      metadata: data.metadata || {}
    }
  }
}

function transformToCalendarResource(data: any): CalendarResource {
  return {
    id: data.id,
    title: data.entity_name,
    extendedProps: {
      entity_id: data.id,
      smart_code: data.smart_code,
      organization_id: data.organization_id,
      resource_type: extractResourceType(data.smart_code),
      metadata: data.metadata || {}
    }
  }
}

async function updateEvent(supabase: any, eventData: UpdateEventRequest) {
  // Implementation for updating events
  const { data, error } = await supabase
    .from('universal_transactions')
    .update({
      transaction_date: eventData.start,
      notes: eventData.notes,
      metadata: eventData.metadata,
      status: 'confirmed'
    })
    .eq('id', eventData.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to update event: ${error.message}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: transformToCalendarEvent(data),
    message: 'Event updated successfully',
    timestamp: new Date().toISOString()
  })
}

async function updateResource(supabase: any, resourceData: UpdateResourceRequest) {
  // Implementation for updating resources
  const { data, error } = await supabase
    .from('core_entities')
    .update({
      entity_name: resourceData.title,
      metadata: resourceData.metadata,
      status: 'active'
    })
    .eq('id', resourceData.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to update resource: ${error.message}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: transformToCalendarResource(data),
    message: 'Resource updated successfully',
    timestamp: new Date().toISOString()
  })
}

async function deleteEvent(supabase: any, id: string, organizationId: string) {
  const { error } = await supabase
    .from('universal_transactions')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId)

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to delete event: ${error.message}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Event deleted successfully',
    timestamp: new Date().toISOString()
  })
}

async function deleteResource(supabase: any, id: string, organizationId: string) {
  const { error } = await supabase
    .from('core_entities')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId)

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to delete resource: ${error.message}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Resource deleted successfully',
    timestamp: new Date().toISOString()
  })
}
