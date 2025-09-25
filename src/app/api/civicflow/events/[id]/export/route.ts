import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Parser } from 'json2csv'
import JSZip from 'jszip'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    const eventId = params.id

    // Fetch event
    const { data: event, error: eventError } = await supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data(*)
      `
      )
      .eq('id', eventId)
      .eq('organization_id', orgId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Fetch invitations
    const { data: invites } = await supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data(*),
        core_relationships!from_entity_id(*)
      `
      )
      .eq('organization_id', orgId)
      .eq('entity_type', 'event_invite')

    // Filter invites for this event
    const eventInvites = (invites || []).filter(invite => {
      const rels = invite.core_relationships || []
      return rels.some(
        (r: any) => r.relationship_type === 'invite_to_event' && r.to_entity_id === eventId
      )
    })

    if (format === 'csv') {
      // Transform data for CSV
      const csvData = eventInvites.map(invite => {
        const dynamicData = invite.core_dynamic_data || []
        const getFieldValue = (fieldName: string) => {
          const field = dynamicData.find((d: any) => d.field_name === fieldName)
          return field?.field_value_text || field?.field_value_number || ''
        }

        return {
          name: invite.entity_name,
          status: getFieldValue('status'),
          ticket_type: getFieldValue('ticket_type'),
          ticket_number: getFieldValue('ticket_number'),
          checkin_time: getFieldValue('checkin_time'),
          registration_notes: getFieldValue('registration_notes')
        }
      })

      const parser = new Parser({
        fields: [
          'name',
          'status',
          'ticket_type',
          'ticket_number',
          'checkin_time',
          'registration_notes'
        ]
      })
      const csv = parser.parse(csvData)

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="event-${eventId}-registrations.csv"`
        }
      })
    }

    if (format === 'pdf') {
      // For now, return a simple text format for PDF (would need proper PDF library)
      let content = `Event: ${event.entity_name}\n`
      content += `Date: ${new Date().toISOString()}\n\n`
      content += `Registrations:\n`
      content += `Total: ${eventInvites.length}\n\n`

      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="event-${eventId}-registrations.txt"`
        }
      })
    }

    if (format === 'zip') {
      const zip = new JSZip()

      // Add event info
      zip.file('event-info.json', JSON.stringify(event, null, 2))

      // Add registrations
      zip.file('registrations.json', JSON.stringify(eventInvites, null, 2))

      const content = await zip.generateAsync({ type: 'nodebuffer' })

      return new NextResponse(content, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="event-${eventId}-export.zip"`
        }
      })
    }

    return NextResponse.json({ error: 'Invalid export format' }, { status: 400 })
  } catch (error) {
    console.error('Error exporting event:', error)
    return NextResponse.json({ error: 'Failed to export event data' }, { status: 500 })
  }
}
