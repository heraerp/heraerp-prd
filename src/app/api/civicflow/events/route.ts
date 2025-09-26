import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CivicFlowEvent } from '@/types/events'

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
    const search = searchParams.get('search')
    const eventType = searchParams.get('event_type')
    const programIds = searchParams.get('program_ids')?.split(',').filter(Boolean)
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const isOnline = searchParams.get('is_online')
    const status = searchParams.get('status') // upcoming, past, today
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '20')

    // Build query
    let query = supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data(*)
      `,
        { count: 'exact' }
      )
      .eq('organization_id', orgId)
      .eq('entity_type', 'event')

    // Apply search filter
    if (search) {
      query = query.ilike('entity_name', `%${search}%`)
    }

    // Pagination
    const offset = (page - 1) * pageSize
    query = query.range(offset, offset + pageSize - 1).order('created_at', { ascending: false })

    const { data: events, count, error } = await query

    if (error) {
      throw error
    }

    // Transform and filter events
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    const transformedEvents: CivicFlowEvent[] = (events || [])
      .map(event => {
        // Extract dynamic data
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

        const startDatetime = getFieldValue('start_datetime') || event.created_at
        const endDatetime = getFieldValue('end_datetime') || startDatetime

        return {
          id: event.id,
          entity_code: event.entity_code,
          entity_name: event.entity_name,
          smart_code: event.smart_code || 'HERA.PUBLICSECTOR.CRM.EVENT.v1',
          organization_id: event.organization_id,
          event_type: getFieldValue('event_type') || 'other',
          description: getFieldValue('description'),
          start_datetime: startDatetime,
          end_datetime: endDatetime,
          timezone: getFieldValue('timezone') || 'UTC',
          venue_name: getFieldValue('venue_name'),
          venue_address: getFieldValue('venue_address'),
          online_url: getFieldValue('online_url'),
          is_online: getFieldValue('is_online') === 'true',
          is_hybrid: getFieldValue('is_hybrid') === 'true',
          host_program_id: getFieldValue('host_program_id'),
          host_program_name: getFieldValue('host_program_name'),
          capacity: getFieldValue('capacity', 'number'),
          registration_deadline: getFieldValue('registration_deadline'),
          tags: getFieldValue('tags', 'json') || [],
          external_id: getFieldValue('external_id'),
          external_source: getFieldValue('external_source'),
          created_at: event.created_at,
          updated_at: event.updated_at
        }
      })
      .filter(event => {
        // Apply post-transform filters
        if (eventType && event.event_type !== eventType) return false

        if (isOnline !== null && event.is_online !== (isOnline === 'true')) return false

        if (tags?.length && !tags.some(tag => event.tags?.includes(tag))) return false

        if (programIds?.length && !programIds.includes(event.host_program_id || '')) return false

        const eventStart = new Date(event.start_datetime)
        const eventEnd = new Date(event.end_datetime)

        if (status === 'upcoming' && eventStart <= now) return false
        if (status === 'past' && eventEnd >= now) return false
        if (status === 'today' && (eventStart < todayStart || eventStart >= todayEnd)) return false

        if (dateFrom && eventStart < new Date(dateFrom)) return false
        if (dateTo && eventEnd > new Date(dateTo)) return false

        return true
      })

    return NextResponse.json({
      items: transformedEvents,
      total: count || 0
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
