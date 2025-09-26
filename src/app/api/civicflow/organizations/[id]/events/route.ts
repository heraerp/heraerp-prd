import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isDemoMode } from '@/lib/demo-guard'
import type { OrgEventRow } from '@/types/organizations'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const entityId = params.id
    const searchParams = request.nextUrl.searchParams
    const isDemo = isDemoMode(orgId)

    const status = searchParams.get('status')
    const eventType = searchParams.get('event_type')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    if (isDemo) {
      const mockEvents: OrgEventRow[] = [
        {
          id: 'invite-1',
          event_id: 'event-1',
          event_name: 'Annual Community Health Fair',
          event_type: 'conference',
          event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'registered',
          registration_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          attendance_confirmed: false
        },
        {
          id: 'invite-2',
          event_id: 'event-2',
          event_name: 'Budget Planning Town Hall',
          event_type: 'roundtable',
          event_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'attended',
          registration_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          attendance_confirmed: true
        },
        {
          id: 'invite-3',
          event_id: 'event-3',
          event_name: 'Grant Writing Workshop',
          event_type: 'workshop',
          event_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'attended',
          registration_date: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
          attendance_confirmed: true
        },
        {
          id: 'invite-4',
          event_id: 'event-4',
          event_name: 'Digital Transformation Webinar',
          event_type: 'webinar',
          event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'invited',
          registration_date: undefined,
          attendance_confirmed: false
        }
      ]

      // Apply filters
      let filteredEvents = mockEvents
      if (status) {
        filteredEvents = filteredEvents.filter(e => e.status === status)
      }
      if (eventType) {
        filteredEvents = filteredEvents.filter(e => e.event_type === eventType)
      }
      if (dateFrom) {
        filteredEvents = filteredEvents.filter(e => new Date(e.event_date) >= new Date(dateFrom))
      }
      if (dateTo) {
        filteredEvents = filteredEvents.filter(e => new Date(e.event_date) <= new Date(dateTo))
      }

      const stats = {
        total_invited: mockEvents.length,
        total_registered: mockEvents.filter(
          e => e.status === 'registered' || e.status === 'attended'
        ).length,
        total_attended: mockEvents.filter(e => e.status === 'attended').length,
        attendance_rate: 67, // Mock rate
        upcoming_count: mockEvents.filter(e => new Date(e.event_date) > new Date()).length
      }

      return NextResponse.json({
        data: filteredEvents,
        stats
      })
    }

    // Production: Fetch event invitations for this org
    const { data: inviteEntities } = await supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data(*),
        core_relationships!from_entity_id(
          to_entity_id,
          to_entity:to_entity_id(
            id,
            entity_name,
            entity_code
          )
        )
      `
      )
      .eq('entity_type', 'event_invite')
      .eq('organization_id', orgId)

    const events: OrgEventRow[] = []
    let totalInvited = 0
    let totalRegistered = 0
    let totalAttended = 0

    for (const invite of inviteEntities || []) {
      // Check if invite is for this organization
      const orgRelated = invite.core_relationships?.some(
        (rel: any) => rel.to_entity_id === entityId
      )

      if (!orgRelated) continue

      // Get event details
      const eventRel = invite.core_relationships?.find(
        (rel: any) => rel.relationship_type === 'invite_to_event'
      )

      if (!eventRel?.to_entity) continue

      // Parse dynamic data
      const dynamicData: any = {}
      invite.core_dynamic_data?.forEach((field: any) => {
        const value = field.field_value_text || field.field_value_number || field.field_value_json
        dynamicData[field.field_name] = value
      })

      // Apply filters
      if (status && dynamicData.status !== status) continue

      // Get event details
      const { data: eventFields } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('entity_id', eventRel.to_entity_id)
        .eq('organization_id', orgId)

      const eventData: any = {}
      eventFields?.forEach(field => {
        const value = field.field_value_text || field.field_value_number || field.field_value_json
        eventData[field.field_name] = value
      })

      if (eventType && eventData.event_type !== eventType) continue
      if (
        dateFrom &&
        eventData.start_datetime &&
        new Date(eventData.start_datetime) < new Date(dateFrom)
      )
        continue
      if (
        dateTo &&
        eventData.start_datetime &&
        new Date(eventData.start_datetime) > new Date(dateTo)
      )
        continue

      const eventRow: OrgEventRow = {
        id: invite.id,
        event_id: eventRel.to_entity_id,
        event_name: eventRel.to_entity.entity_name,
        event_type: eventData.event_type || 'other',
        event_date: eventData.start_datetime || invite.created_at,
        status: dynamicData.status || 'invited',
        registration_date: dynamicData.registration_date,
        attendance_confirmed: dynamicData.status === 'attended'
      }

      events.push(eventRow)
      totalInvited++
      if (['registered', 'attended'].includes(eventRow.status)) totalRegistered++
      if (eventRow.status === 'attended') totalAttended++
    }

    const stats = {
      total_invited: totalInvited,
      total_registered: totalRegistered,
      total_attended: totalAttended,
      attendance_rate: totalInvited > 0 ? Math.round((totalAttended / totalInvited) * 100) : 0,
      upcoming_count: events.filter(e => new Date(e.event_date) > new Date()).length
    }

    return NextResponse.json({
      data: events,
      stats
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
