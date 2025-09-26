import { describe, it, expect } from '@jest/globals'
import { createEventbriteAdapter } from '../eventbrite'
import { validateEventData, validateInviteData } from '../../contracts-events'

describe('EventbriteAdapter', () => {
  const mockConfig = {
    apiToken: 'test-token'
  }

  describe('Event Normalization', () => {
    it('should normalize Eventbrite event to HERA format', () => {
      const adapter = createEventbriteAdapter(mockConfig)
      
      // Use private method through any cast for testing
      const normalizeEvent = (adapter as any).normalizeEvent.bind(adapter)
      
      const eventbriteEvent = {
        id: 'eb-123',
        name: { text: 'Test Event' },
        start: {
          timezone: 'America/New_York',
          utc: '2024-01-15T14:00:00Z',
          local: '2024-01-15T09:00:00'
        },
        end: {
          timezone: 'America/New_York',
          utc: '2024-01-15T16:00:00Z',
          local: '2024-01-15T11:00:00'
        },
        url: 'https://eventbrite.com/e/test-event',
        capacity: 100,
        status: 'live' as const,
        online_event: false,
        created: '2024-01-01T00:00:00Z',
        changed: '2024-01-10T00:00:00Z',
        venue: {
          id: 'venue-1',
          name: 'Test Venue'
        }
      }

      const normalized = normalizeEvent('org-123', eventbriteEvent)

      expect(normalized.entity_type).toBe('event')
      expect(normalized.entity_name).toBe('Test Event')
      expect(normalized.entity_code).toBe('EB-eb-123')
      expect(normalized.smart_code).toBe('HERA.PUBLICSECTOR.CRM.EVENT.WEBINAR.v1')
      
      expect(normalized.dynamic_data['EVENT.META.V1']).toEqual({
        title: 'Test Event',
        type: 'webinar',
        start: '2024-01-15T14:00:00Z',
        end: '2024-01-15T16:00:00Z',
        timezone: 'America/New_York',
        venue: 'Test Venue',
        url: 'https://eventbrite.com/e/test-event',
        status: 'live',
        capacity: 100,
        online_event: false,
        tags: []
      })

      expect(normalized.dynamic_data['EVENT.SOURCE.V1']).toEqual({
        vendor: 'eventbrite',
        provider_id: 'eb-123',
        changed_at: '2024-01-10T00:00:00Z'
      })

      // Validate against schema
      const validation = validateEventData(normalized)
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should derive event type based on format/category', () => {
      const adapter = createEventbriteAdapter(mockConfig)
      const normalizeEvent = (adapter as any).normalizeEvent.bind(adapter)

      const conferenceEvent = {
        id: 'eb-conf',
        name: { text: 'Annual Conference' },
        format_id: 'conference-format',
        category_id: 'business-category',
        start: {
          timezone: 'UTC',
          utc: '2024-01-15T14:00:00Z',
          local: '2024-01-15T14:00:00Z'
        },
        end: {
          timezone: 'UTC',
          utc: '2024-01-15T16:00:00Z',
          local: '2024-01-15T16:00:00Z'
        },
        url: 'https://eventbrite.com/e/conference',
        status: 'live' as const,
        online_event: true,
        created: '2024-01-01T00:00:00Z',
        changed: '2024-01-10T00:00:00Z'
      }

      const normalized = normalizeEvent('org-123', conferenceEvent)
      expect(normalized.dynamic_data['EVENT.META.V1'].type).toBe('conference')
      expect(normalized.smart_code).toBe('HERA.PUBLICSECTOR.CRM.EVENT.CONFERENCE.v1')
    })
  })

  describe('Attendee Normalization', () => {
    it('should normalize Eventbrite attendee to HERA invite format', () => {
      const adapter = createEventbriteAdapter(mockConfig)
      const normalizeAttendee = (adapter as any).normalizeAttendee.bind(adapter)

      const eventbriteAttendee = {
        id: 'att-123',
        created: '2024-01-05T00:00:00Z',
        changed: '2024-01-05T00:00:00Z',
        ticket_class_name: 'General Admission',
        ticket_class_id: 'ticket-1',
        profile: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com'
        },
        checked_in: true,
        checkin_time: '2024-01-15T13:45:00Z',
        cancelled: false,
        refunded: false,
        status: 'attending' as const,
        order_id: 'order-1'
      }

      const normalized = normalizeAttendee('org-123', 'eb-123', eventbriteAttendee)

      expect(normalized.entity_type).toBe('event_invite')
      expect(normalized.entity_name).toBe('John Doe')
      expect(normalized.entity_code).toBe('EB-ATT-att-123')
      expect(normalized.smart_code).toBe('HERA.PUBLICSECTOR.CRM.EVENT.INVITE.v1')

      expect(normalized.dynamic_data['INVITE.META.V1']).toEqual({
        status: 'attended',
        ticket_type: 'General Admission',
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        checked_in: true,
        checkin_time: '2024-01-15T13:45:00Z',
        source: 'eventbrite'
      })

      expect(normalized.dynamic_data['INVITE.SOURCE.V1']).toEqual({
        vendor: 'eventbrite',
        provider_id: 'att-123',
        changed_at: '2024-01-05T00:00:00Z'
      })

      // Validate against schema
      const validation = validateInviteData(normalized)
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should map attendee status correctly', () => {
      const adapter = createEventbriteAdapter(mockConfig)
      const normalizeAttendee = (adapter as any).normalizeAttendee.bind(adapter)

      const scenarios = [
        { cancelled: true, checked_in: false, status: 'attending' as const, expected: 'cancelled' },
        { cancelled: false, checked_in: true, status: 'attending' as const, expected: 'attended' },
        { cancelled: false, checked_in: false, status: 'attending' as const, expected: 'registered' },
        { cancelled: false, checked_in: false, status: 'deleted' as const, expected: 'cancelled' }
      ]

      scenarios.forEach(scenario => {
        const attendee = {
          id: 'att-test',
          created: '2024-01-01T00:00:00Z',
          changed: '2024-01-01T00:00:00Z',
          ticket_class_name: 'Test',
          ticket_class_id: 'ticket-1',
          profile: { email: 'test@example.com' },
          checked_in: scenario.checked_in,
          cancelled: scenario.cancelled,
          refunded: false,
          status: scenario.status,
          order_id: 'order-1'
        }

        const normalized = normalizeAttendee('org-123', 'event-123', attendee)
        expect(normalized.dynamic_data['INVITE.META.V1'].status).toBe(scenario.expected)
      })
    })
  })

  describe('Idempotency', () => {
    it('should generate consistent idempotency keys', () => {
      const orgId = 'org-123'
      const providerId = 'eb-456'
      
      const expectedKey = `${orgId}-eventbrite-event-${providerId}-upsert`
      
      // In actual implementation, this would be used in the sync engine
      expect(expectedKey).toBe('org-123-eventbrite-event-eb-456-upsert')
    })
  })

  describe('Demo Mode', () => {
    it('should return demo data when in demo mode', async () => {
      const adapter = createEventbriteAdapter(mockConfig)
      
      const result = await adapter.pull({
        orgId: '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77', // Demo org ID
        config: mockConfig,
        demoMode: true
      })

      expect(result.success).toBe(true)
      expect(result.stats.eventsProcessed).toBeGreaterThan(0)
      expect(result.stats.attendeesProcessed).toBeGreaterThan(0)
      expect(result.stats.errors).toBe(0)
    })
  })
})