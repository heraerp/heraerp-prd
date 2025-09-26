import { NextRequest, NextResponse } from 'next/server'
import { createEventbriteAdapter } from '@/lib/integration/vendors/eventbrite'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    // Get organization ID from header
    const orgId = request.headers.get('X-Organization-Id')
    if (!orgId) {
      return NextResponse.json(
        { error: 'Missing X-Organization-Id header' },
        { status: 400 }
      )
    }

    // Get request body
    const body = await request.json()
    const { vendor, domain } = body

    if (!vendor || !domain) {
      return NextResponse.json(
        { error: 'Missing required fields: vendor, domain' },
        { status: 400 }
      )
    }

    // For demo, create a simple sync run ID
    const syncRunId = uuidv4()
    
    // Simulate sync for Eventbrite
    if (vendor === 'eventbrite' && domain === 'events') {
      // Create adapter with demo config
      const adapter = createEventbriteAdapter({
        apiToken: '64ACNOYV3AQ37KHB25GN' // Your real API key
      })

      // Get normalized data
      const { events, invites } = await adapter.getNormalizedData({
        orgId,
        config: { apiToken: '64ACNOYV3AQ37KHB25GN' },
        demoMode: false // Use real API
      })

      // Return success with the data
      return NextResponse.json({
        success: true,
        syncRunId,
        message: `Sync completed successfully`,
        stats: {
          eventsProcessed: events.length,
          attendeesProcessed: invites.length,
          eventsCreated: events.length,
          attendeesCreated: invites.length,
          checkins: invites.filter(i => i.dynamic_data['INVITE.META.V1'].checked_in).length
        },
        data: {
          events: events.map(e => ({
            id: uuidv4(),
            name: e.entity_name,
            type: e.dynamic_data['EVENT.META.V1'].type,
            start: e.dynamic_data['EVENT.META.V1'].start,
            end: e.dynamic_data['EVENT.META.V1'].end,
            status: e.dynamic_data['EVENT.META.V1'].status,
            venue: e.dynamic_data['EVENT.META.V1'].venue,
            online: e.dynamic_data['EVENT.META.V1'].online_event,
            capacity: e.dynamic_data['EVENT.META.V1'].capacity,
            url: e.dynamic_data['EVENT.META.V1'].url,
            providerId: e.dynamic_data['EVENT.SOURCE.V1'].provider_id
          })),
          attendees: invites.map(i => ({
            id: uuidv4(),
            name: i.entity_name,
            email: i.dynamic_data['INVITE.META.V1'].email,
            status: i.dynamic_data['INVITE.META.V1'].status,
            ticketType: i.dynamic_data['INVITE.META.V1'].ticket_type,
            checkedIn: i.dynamic_data['INVITE.META.V1'].checked_in,
            providerId: i.dynamic_data['INVITE.SOURCE.V1'].provider_id
          }))
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: `Unsupported vendor/domain: ${vendor}/${domain}`
    }, { status: 400 })

  } catch (error) {
    console.error('Demo sync error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
        syncRunId: uuidv4() 
      },
      { status: 500 }
    )
  }
}