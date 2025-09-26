import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { EventInvite } from '@/types/events'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const searchParams = request.nextUrl.searchParams

    // Parse filters
    const eventId = searchParams.get('event_id')
    const subjectId = searchParams.get('subject_id')
    const subjectType = searchParams.get('subject_type') as 'constituent' | 'organization' | null
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '50')

    // Build base query
    let query = supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data(*),
        core_relationships!from_entity_id(*)
      `,
        { count: 'exact' }
      )
      .eq('organization_id', orgId)
      .eq('entity_type', 'event_invite')

    // Pagination
    const offset = (page - 1) * pageSize
    query = query.range(offset, offset + pageSize - 1).order('created_at', { ascending: false })

    const { data: invites, count, error } = await query

    if (error) {
      throw error
    }

    // Transform and filter invites
    const transformedInvites: EventInvite[] = await Promise.all(
      (invites || []).map(async invite => {
        // Extract dynamic data
        const dynamicData = invite.core_dynamic_data || []
        const getFieldValue = (fieldName: string, type: 'text' | 'number' | 'json' = 'text') => {
          const field = dynamicData.find((d: any) => d.field_name === fieldName)
          if (!field) return undefined
          switch (type) {
            case 'number':
              return field.field_value_number
            case 'json':
              return field.field_value_json
            default:
              return field.field_value_text
          }
        }

        // Get relationships
        const relationships = invite.core_relationships || []
        const eventRel = relationships.find((r: any) => r.relationship_type === 'invite_to_event')
        const subjectRel = relationships.find(
          (r: any) => r.relationship_type === 'invite_to_subject'
        )

        const inviteEventId = eventRel?.to_entity_id
        const inviteSubjectId = subjectRel?.to_entity_id

        // Filter by event if specified
        if (eventId && inviteEventId !== eventId) {
          return null
        }

        // Filter by subject if specified
        if (subjectId && inviteSubjectId !== subjectId) {
          return null
        }

        // Filter by status if specified
        const inviteStatus = getFieldValue('status') || 'invited'
        if (status && inviteStatus !== status) {
          return null
        }

        // Get event and subject names
        let eventName: string | undefined
        let subjectName: string | undefined

        if (inviteEventId) {
          const { data: event } = await supabase
            .from('core_entities')
            .select('entity_name')
            .eq('id', inviteEventId)
            .single()
          if (event) {
            eventName = event.entity_name
          }
        }

        if (inviteSubjectId) {
          const { data: subject } = await supabase
            .from('core_entities')
            .select('entity_name')
            .eq('id', inviteSubjectId)
            .single()
          if (subject) {
            subjectName = subject.entity_name
          }
        }

        const inviteSubjectType =
          (getFieldValue('subject_type') as 'constituent' | 'organization') || 'constituent'

        // Filter by subject type if specified
        if (subjectType && inviteSubjectType !== subjectType) {
          return null
        }

        return {
          id: invite.id,
          entity_code: invite.entity_code,
          entity_name: invite.entity_name,
          smart_code: invite.smart_code || 'HERA.PUBLICSECTOR.CRM.EVENT.INVITE.v1',
          organization_id: invite.organization_id,
          event_id: inviteEventId || '',
          event_name: eventName,
          subject_id: inviteSubjectId || '',
          subject_type: inviteSubjectType,
          subject_name: subjectName,
          status: inviteStatus as any,
          invited_at: getFieldValue('invited_at'),
          registered_at: getFieldValue('registered_at'),
          attended_at: getFieldValue('attended_at'),
          checkin_time: getFieldValue('checkin_time'),
          ticket_type: getFieldValue('ticket_type'),
          ticket_number: getFieldValue('ticket_number'),
          registration_notes: getFieldValue('registration_notes'),
          dietary_requirements: getFieldValue('dietary_requirements'),
          accessibility_needs: getFieldValue('accessibility_needs'),
          external_id: getFieldValue('external_id'),
          created_at: invite.created_at,
          updated_at: invite.updated_at
        }
      })
    )

    // Filter out nulls
    const filteredInvites = transformedInvites.filter(invite => invite !== null) as EventInvite[]

    return NextResponse.json({
      items: filteredInvites,
      total: count || 0
    })
  } catch (error) {
    console.error('Error fetching event invites:', error)
    return NextResponse.json({ error: 'Failed to fetch event invitations' }, { status: 500 })
  }
}
