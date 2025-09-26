import type {
  EventbriteEvent,
  EventbriteAttendee,
  EventbriteEventsResponse,
  EventbriteAttendeesResponse,
  EventbriteMeResponse,
  AdapterResult,
  AdapterStats,
  NormalizedEvent,
  NormalizedInvite
} from '@/types/integrations-eventbrite'

interface EventbriteConfig {
  apiToken: string
  apiUrl?: string
}

interface PullOptions {
  orgId: string
  config: EventbriteConfig
  sinceCursor?: string // ISO timestamp
  page?: number
  demoMode?: boolean
}

// Demo fixtures
const DEMO_EVENTS: EventbriteEvent[] = [
  {
    id: 'demo-event-1',
    name: { text: 'Public Policy Forum: Infrastructure Investment' },
    description: { text: 'Join us for a discussion on the latest infrastructure bill' },
    start: {
      timezone: 'America/New_York',
      utc: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      local: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    end: {
      timezone: 'America/New_York',
      utc: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      local: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString()
    },
    url: 'https://eventbrite.com/demo-event-1',
    capacity: 150,
    status: 'live',
    online_event: false,
    created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    changed: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    venue: {
      id: 'venue-1',
      name: 'City Hall Auditorium',
      address: {
        address_1: '123 Main Street',
        city: 'Washington',
        region: 'DC',
        postal_code: '20001',
        country: 'US'
      }
    }
  },
  {
    id: 'demo-event-2',
    name: { text: 'Virtual Town Hall: Community Safety Initiative' },
    start: {
      timezone: 'America/New_York',
      utc: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      local: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    end: {
      timezone: 'America/New_York',
      utc: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
      local: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString()
    },
    url: 'https://eventbrite.com/demo-event-2',
    capacity: 500,
    status: 'live',
    online_event: true,
    created: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    changed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
]

const DEMO_ATTENDEES: Record<string, EventbriteAttendee[]> = {
  'demo-event-1': [
    {
      id: 'attendee-1',
      created: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      changed: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      ticket_class_name: 'General Admission',
      ticket_class_id: 'ticket-1',
      profile: {
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@example.com'
      },
      checked_in: true,
      checkin_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      cancelled: false,
      refunded: false,
      status: 'attending',
      order_id: 'order-1'
    },
    {
      id: 'attendee-2',
      created: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      changed: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      ticket_class_name: 'VIP',
      ticket_class_id: 'ticket-2',
      profile: {
        first_name: 'Michael',
        last_name: 'Chen',
        email: 'mchen@civicorg.org'
      },
      checked_in: false,
      cancelled: false,
      refunded: false,
      status: 'attending',
      order_id: 'order-2'
    }
  ],
  'demo-event-2': [
    {
      id: 'attendee-3',
      created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      changed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      ticket_class_name: 'Online Access',
      ticket_class_id: 'ticket-3',
      profile: {
        first_name: 'Emily',
        last_name: 'Davis',
        email: 'emily.davis@community.gov'
      },
      checked_in: false,
      cancelled: false,
      refunded: false,
      status: 'attending',
      order_id: 'order-3'
    }
  ]
}

export class EventbriteAdapter {
  private apiUrl: string
  private headers: Record<string, string>
  private rateLimitDelay = 100 // ms between requests
  private maxRetries = 3

  constructor(private config: EventbriteConfig) {
    this.apiUrl = config.apiUrl || 'https://www.eventbriteapi.com/v3'
    this.headers = {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json'
    }
  }

  // Main pull method
  async pull(options: PullOptions): Promise<AdapterResult> {
    const stats: AdapterStats = {
      eventsProcessed: 0,
      attendeesProcessed: 0,
      eventsCreated: 0,
      eventsUpdated: 0,
      attendeesCreated: 0,
      attendeesUpdated: 0,
      checkins: 0,
      errors: 0
    }
    const partialErrors: AdapterResult['partialErrors'] = []

    try {
      // Demo mode returns fixtures for demo org only
      // For other orgs with valid token, use real API
      const isDemoOrg = options.orgId === '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'
      if (options.demoMode || (isDemoOrg && !options.config.apiToken?.startsWith('64AC'))) {
        return this.pullDemoData(options.orgId, stats)
      }

      // Fetch all owned events
      const events = await this.fetchAllEvents(options.sinceCursor)
      
      let latestChangedTimestamp: string | undefined

      // Process each event
      for (const event of events) {
        stats.eventsProcessed++
        
        try {
          // Track latest changed timestamp
          if (!latestChangedTimestamp || event.changed > latestChangedTimestamp) {
            latestChangedTimestamp = event.changed
          }

          // Normalize event
          const normalizedEvent = this.normalizeEvent(options.orgId, event)
          
          // TODO: Call HERA API to upsert event
          // This will be handled by the sync engine using the normalized data
          
          // Fetch attendees for this event
          const attendees = await this.fetchAllAttendees(event.id)
          
          for (const attendee of attendees) {
            stats.attendeesProcessed++
            
            try {
              // Track latest changed timestamp
              if (!latestChangedTimestamp || attendee.changed > latestChangedTimestamp) {
                latestChangedTimestamp = attendee.changed
              }

              // Normalize attendee
              const normalizedInvite = this.normalizeAttendee(options.orgId, event.id, attendee)
              
              // Track checkins
              if (attendee.checked_in) {
                stats.checkins++
              }
              
              // TODO: Call HERA API to upsert invite
              // This will be handled by the sync engine
              
            } catch (error) {
              stats.errors++
              partialErrors.push({
                type: 'attendee',
                id: attendee.id,
                error: error instanceof Error ? error.message : 'Unknown error'
              })
            }
          }
          
        } catch (error) {
          stats.errors++
          partialErrors.push({
            type: 'event',
            id: event.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return {
        success: stats.errors === 0,
        stats,
        cursor: latestChangedTimestamp,
        partialErrors
      }

    } catch (error) {
      console.error('Eventbrite pull error:', error)
      return {
        success: false,
        stats,
        partialErrors: [{
          type: 'event',
          id: 'pull',
          error: error instanceof Error ? error.message : 'Unknown error'
        }]
      }
    }
  }

  // Test connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.fetchWithRetry(`${this.apiUrl}/users/me/`)
      const data = await response.json() as EventbriteMeResponse
      
      return {
        success: true,
        message: `Connected to Eventbrite as ${data.name || data.emails?.[0]?.email || 'Unknown'}`
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed'
      }
    }
  }

  // Fetch all events with pagination
  private async fetchAllEvents(sinceCursor?: string): Promise<EventbriteEvent[]> {
    const events: EventbriteEvent[] = []
    let continuation: string | undefined
    
    // First get user info to get organizer ID
    const meResponse = await this.fetchWithRetry(`${this.apiUrl}/users/me/`)
    const userData = await meResponse.json()
    const userId = userData.id
    
    // Get user's organizations
    let organizationId = userId
    try {
      const orgsResponse = await this.fetchWithRetry(`${this.apiUrl}/users/${userId}/organizations/`)
      const orgsData = await orgsResponse.json()
      if (orgsData.organizations && orgsData.organizations.length > 0) {
        organizationId = orgsData.organizations[0].id
      }
    } catch (error) {
      // No organizations found, using user ID as organizer
    }
    
    do {
      const params = new URLSearchParams()
      
      if (continuation) {
        params.set('continuation', continuation)
      }
      
      if (sinceCursor) {
        params.set('changed_since', sinceCursor)
      }
      
      const response = await this.fetchWithRetry(
        `${this.apiUrl}/organizations/${organizationId}/events/?${params.toString()}`
      )
      
      const data = await response.json() as EventbriteEventsResponse
      events.push(...data.events)
      
      continuation = data.pagination.continuation
      
      // Rate limit
      await this.delay(this.rateLimitDelay)
      
    } while (continuation)
    
    return events
  }

  // Fetch all attendees for an event with pagination
  private async fetchAllAttendees(eventId: string): Promise<EventbriteAttendee[]> {
    const attendees: EventbriteAttendee[] = []
    let continuation: string | undefined
    
    do {
      const params = new URLSearchParams({
        status: 'attending,transferred,deleted'
      })
      
      if (continuation) {
        params.set('continuation', continuation)
      }
      
      const response = await this.fetchWithRetry(
        `${this.apiUrl}/events/${eventId}/attendees/?${params.toString()}`
      )
      
      const data = await response.json() as EventbriteAttendeesResponse
      attendees.push(...data.attendees)
      
      continuation = data.pagination.continuation
      
      // Rate limit
      await this.delay(this.rateLimitDelay)
      
    } while (continuation)
    
    return attendees
  }

  // Fetch with retry and backoff
  private async fetchWithRetry(url: string, retries = 0): Promise<Response> {
    try {
      const response = await fetch(url, { headers: this.headers })
      
      if (response.status === 429) {
        // Rate limited
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
        if (retries < this.maxRetries) {
          await this.delay(retryAfter * 1000)
          return this.fetchWithRetry(url, retries + 1)
        }
        throw new Error('Rate limited after max retries')
      }
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }
      
      return response
    } catch (error) {
      if (retries < this.maxRetries && error instanceof Error && error.message.includes('fetch')) {
        // Network error, retry with exponential backoff
        await this.delay(Math.pow(2, retries) * 1000)
        return this.fetchWithRetry(url, retries + 1)
      }
      throw error
    }
  }

  // Normalize Eventbrite event to HERA format
  private normalizeEvent(orgId: string, event: EventbriteEvent): NormalizedEvent {
    // Derive event type based on format/category
    let eventType: NormalizedEvent['dynamic_data']['EVENT.META.V1']['type'] = 'webinar'
    if (event.category_id || event.format_id?.includes('conference')) {
      eventType = 'conference'
    } else if (event.format_id?.includes('workshop')) {
      eventType = 'workshop'
    } else if (event.format_id?.includes('roundtable')) {
      eventType = 'roundtable'
    }

    return {
      entity_type: 'event',
      entity_name: event.name.text,
      entity_code: `EB-${event.id}`,
      smart_code: `HERA.PUBLICSECTOR.CRM.EVENT.${eventType.toUpperCase()}.v1`,
      dynamic_data: {
        'EVENT.META.V1': {
          title: event.name.text,
          type: eventType,
          start: event.start.utc,
          end: event.end.utc,
          timezone: event.start.timezone,
          venue: event.venue?.name,
          url: event.url,
          status: this.mapEventStatus(event.status),
          capacity: event.capacity,
          online_event: event.online_event || false,
          tags: []
        },
        'EVENT.SOURCE.V1': {
          vendor: 'eventbrite',
          provider_id: event.id,
          changed_at: event.changed
        }
      }
    }
  }

  // Normalize Eventbrite attendee to HERA invite format
  private normalizeAttendee(orgId: string, eventId: string, attendee: EventbriteAttendee): NormalizedInvite {
    return {
      entity_type: 'event_invite',
      entity_name: `${attendee.profile.first_name || ''} ${attendee.profile.last_name || attendee.profile.email}`.trim(),
      entity_code: `EB-ATT-${attendee.id}`,
      smart_code: 'HERA.PUBLICSECTOR.CRM.EVENT.INVITE.v1',
      dynamic_data: {
        'INVITE.META.V1': {
          status: this.mapAttendeeStatus(attendee),
          ticket_type: attendee.ticket_class_name,
          email: attendee.profile.email,
          first_name: attendee.profile.first_name,
          last_name: attendee.profile.last_name,
          checked_in: attendee.checked_in,
          checkin_time: attendee.checkin_time,
          source: 'eventbrite'
        },
        'INVITE.SOURCE.V1': {
          vendor: 'eventbrite',
          provider_id: attendee.id,
          changed_at: attendee.changed
        }
      }
    }
  }

  // Map Eventbrite event status to HERA status
  private mapEventStatus(status: EventbriteEvent['status']): NormalizedEvent['dynamic_data']['EVENT.META.V1']['status'] {
    switch (status) {
      case 'live':
      case 'started':
        return 'live'
      case 'ended':
      case 'completed':
        return 'completed'
      case 'canceled':
        return 'cancelled'
      default:
        return 'draft'
    }
  }

  // Map Eventbrite attendee status to HERA invite status
  private mapAttendeeStatus(attendee: EventbriteAttendee): NormalizedInvite['dynamic_data']['INVITE.META.V1']['status'] {
    if (attendee.cancelled || attendee.status === 'deleted') {
      return 'cancelled'
    }
    if (attendee.checked_in) {
      return 'attended'
    }
    if (attendee.status === 'attending') {
      return 'registered'
    }
    return 'invited'
  }

  // Demo data pull
  private pullDemoData(orgId: string, stats: AdapterStats): AdapterResult {
    const partialErrors: AdapterResult['partialErrors'] = []
    
    // Process demo events
    for (const event of DEMO_EVENTS) {
      stats.eventsProcessed++
      stats.eventsCreated++ // Assume all demo events are new
      
      // Process demo attendees
      const attendees = DEMO_ATTENDEES[event.id] || []
      for (const attendee of attendees) {
        stats.attendeesProcessed++
        stats.attendeesCreated++ // Assume all demo attendees are new
        
        if (attendee.checked_in) {
          stats.checkins++
        }
      }
    }
    
    return {
      success: true,
      stats,
      cursor: new Date().toISOString(),
      partialErrors
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Get normalized data for sync engine
  async getNormalizedData(options: PullOptions): Promise<{
    events: NormalizedEvent[]
    invites: NormalizedInvite[]
  }> {
    const events: NormalizedEvent[] = []
    const invites: NormalizedInvite[] = []

    if (options.demoMode) {
      // Return demo data
      for (const event of DEMO_EVENTS) {
        events.push(this.normalizeEvent(options.orgId, event))
        
        const attendees = DEMO_ATTENDEES[event.id] || []
        for (const attendee of attendees) {
          invites.push(this.normalizeAttendee(options.orgId, event.id, attendee))
        }
      }
    } else {
      // Fetch real data
      const eventbriteEvents = await this.fetchAllEvents(options.sinceCursor)
      
      for (const event of eventbriteEvents) {
        events.push(this.normalizeEvent(options.orgId, event))
        
        const attendees = await this.fetchAllAttendees(event.id)
        for (const attendee of attendees) {
          invites.push(this.normalizeAttendee(options.orgId, event.id, attendee))
        }
      }
    }

    return { events, invites }
  }
}

// Factory function
export function createEventbriteAdapter(config: EventbriteConfig): EventbriteAdapter {
  return new EventbriteAdapter(config)
}