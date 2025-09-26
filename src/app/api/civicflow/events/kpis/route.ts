import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { EventKPIs } from '@/types/events'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID

    // Get all events
    const { data: events, error: eventsError } = await supabase
      .from('core_entities')
      .select(
        `
        id,
        created_at,
        core_dynamic_data!inner(field_name, field_value_text)
      `
      )
      .eq('organization_id', orgId)
      .eq('entity_type', 'event')

    if (eventsError) {
      throw eventsError
    }

    const now = new Date()
    let totalEvents = 0
    let upcomingEvents = 0
    let pastEvents = 0

    ;(events || []).forEach(event => {
      totalEvents++

      const startField = event.core_dynamic_data?.find(
        (d: any) => d.field_name === 'start_datetime'
      )
      const endField = event.core_dynamic_data?.find((d: any) => d.field_name === 'end_datetime')

      const startDate = startField?.field_value_text
        ? new Date(startField.field_value_text)
        : new Date(event.created_at)
      const endDate = endField?.field_value_text ? new Date(endField.field_value_text) : startDate

      if (startDate > now) {
        upcomingEvents++
      } else if (endDate < now) {
        pastEvents++
      }
    })

    // Get all invitations
    const { data: invites, error: invitesError } = await supabase
      .from('core_entities')
      .select(
        `
        id,
        core_dynamic_data!inner(field_name, field_value_text)
      `
      )
      .eq('organization_id', orgId)
      .eq('entity_type', 'event_invite')

    if (invitesError) {
      throw invitesError
    }

    let totalInvitations = 0
    let totalRegistrations = 0
    let totalAttendance = 0

    ;(invites || []).forEach(invite => {
      totalInvitations++

      const statusField = invite.core_dynamic_data?.find((d: any) => d.field_name === 'status')
      const status = statusField?.field_value_text || 'invited'

      if (status === 'registered' || status === 'attended') {
        totalRegistrations++
      }
      if (status === 'attended') {
        totalAttendance++
      }
    })

    // Calculate attendance rate
    const avgAttendanceRate =
      totalRegistrations > 0 ? (totalAttendance / totalRegistrations) * 100 : 0

    // Calculate trending registration rate (simplified - would need time series data)
    const trendingRegistrationRate =
      totalInvitations > 0 ? (totalRegistrations / totalInvitations) * 100 : 0

    const kpis: EventKPIs = {
      total_events: totalEvents,
      upcoming_events: upcomingEvents,
      past_events: pastEvents,
      total_invitations: totalInvitations,
      total_registrations: totalRegistrations,
      total_attendance: totalAttendance,
      avg_attendance_rate: avgAttendanceRate,
      trending_registration_rate: trendingRegistrationRate
    }

    return NextResponse.json(kpis)
  } catch (error) {
    console.error('Error fetching event KPIs:', error)
    return NextResponse.json({ error: 'Failed to fetch event KPIs' }, { status: 500 })
  }
}
