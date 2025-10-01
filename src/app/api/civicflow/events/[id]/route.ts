import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CivicFlowEvent } from '@/types/events'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const eventId = params.id

    // Fetch event with dynamic data
    const { data: event, error } = await supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data(*)
      `
      )
      .eq('id', eventId)
      .eq('organization_id', orgId)
      .eq('entity_type', 'event')
      .single()

    if (error || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Transform to CivicFlowEvent
    const dynamicData = event.core_dynamic_data || []
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

    // Get host program name if available
    let hostProgramName: string | undefined
    const hostProgramId = getFieldValue('host_program_id')
    if (hostProgramId) {
      const { data: program } = await supabase
        .from('core_entities')
        .select('entity_name')
        .eq('id', hostProgramId)
        .single()
      if (program) {
        hostProgramName = program.entity_name
      }
    }

    const transformedEvent: CivicFlowEvent = {
      id: event.id,
      entity_code: event.entity_code,
      entity_name: event.entity_name,
      smart_code: event.smart_code || 'HERA.PUBLICSECTOR.CRM.EVENT.V1',
      organization_id: event.organization_id,
      event_type: getFieldValue('event_type') || 'other',
      description: getFieldValue('description'),
      start_datetime: getFieldValue('start_datetime') || event.created_at,
      end_datetime:
        getFieldValue('end_datetime') || getFieldValue('start_datetime') || event.created_at,
      timezone: getFieldValue('timezone') || 'UTC',
      venue_name: getFieldValue('venue_name'),
      venue_address: getFieldValue('venue_address'),
      online_url: getFieldValue('online_url'),
      is_online: getFieldValue('is_online') === 'true',
      is_hybrid: getFieldValue('is_hybrid') === 'true',
      host_program_id: hostProgramId,
      host_program_name: hostProgramName,
      capacity: getFieldValue('capacity', 'number'),
      registration_deadline: getFieldValue('registration_deadline'),
      tags: getFieldValue('tags', 'json') || [],
      external_id: getFieldValue('external_id'),
      external_source: getFieldValue('external_source'),
      created_at: event.created_at,
      updated_at: event.updated_at
    }

    return NextResponse.json(transformedEvent)
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}
