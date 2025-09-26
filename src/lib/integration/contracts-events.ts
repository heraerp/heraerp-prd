import Ajv from 'ajv'
import type { JSONSchemaType } from 'ajv'
import type { NormalizedEvent, NormalizedInvite } from '@/types/integrations-eventbrite'

// JSON Schema for Event entity
export const eventSchema: JSONSchemaType<NormalizedEvent> = {
  type: 'object',
  properties: {
    entity_type: { type: 'string', const: 'event' },
    entity_name: { type: 'string', minLength: 1 },
    entity_code: { type: 'string', pattern: '^EB-' },
    smart_code: { type: 'string', pattern: '^HERA\\.PUBLICSECTOR\\.CRM\\.EVENT\\.' },
    dynamic_data: {
      type: 'object',
      properties: {
        'EVENT.META.V1': {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 1 },
            type: { 
              type: 'string', 
              enum: ['webinar', 'conference', 'workshop', 'roundtable'] 
            },
            start: { type: 'string', format: 'date-time' },
            end: { type: 'string', format: 'date-time' },
            timezone: { type: 'string', minLength: 1 },
            venue: { type: 'string', nullable: true },
            url: { type: 'string', format: 'uri' },
            status: {
              type: 'string',
              enum: ['live', 'completed', 'cancelled', 'draft']
            },
            capacity: { type: 'number', nullable: true, minimum: 0 },
            online_event: { type: 'boolean' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              nullable: true
            }
          },
          required: ['title', 'type', 'start', 'end', 'timezone', 'url', 'status', 'online_event'],
          additionalProperties: false
        },
        'EVENT.SOURCE.V1': {
          type: 'object',
          properties: {
            vendor: { type: 'string', const: 'eventbrite' },
            provider_id: { type: 'string', minLength: 1 },
            changed_at: { type: 'string', format: 'date-time' }
          },
          required: ['vendor', 'provider_id', 'changed_at'],
          additionalProperties: false
        }
      },
      required: ['EVENT.META.V1', 'EVENT.SOURCE.V1'],
      additionalProperties: false
    }
  },
  required: ['entity_type', 'entity_name', 'entity_code', 'smart_code', 'dynamic_data'],
  additionalProperties: false
}

// JSON Schema for Event Invite entity
export const inviteSchema: JSONSchemaType<NormalizedInvite> = {
  type: 'object',
  properties: {
    entity_type: { type: 'string', const: 'event_invite' },
    entity_name: { type: 'string', minLength: 1 },
    entity_code: { type: 'string', pattern: '^EB-ATT-' },
    smart_code: { type: 'string', const: 'HERA.PUBLICSECTOR.CRM.EVENT.INVITE.v1' },
    dynamic_data: {
      type: 'object',
      properties: {
        'INVITE.META.V1': {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['invited', 'registered', 'attended', 'no_show', 'cancelled']
            },
            ticket_type: { type: 'string', minLength: 1 },
            email: { type: 'string', format: 'email' },
            first_name: { type: 'string', nullable: true },
            last_name: { type: 'string', nullable: true },
            checked_in: { type: 'boolean' },
            checkin_time: { type: 'string', nullable: true, format: 'date-time' },
            source: { type: 'string', const: 'eventbrite' }
          },
          required: ['status', 'ticket_type', 'email', 'checked_in', 'source'],
          additionalProperties: false
        },
        'INVITE.SOURCE.V1': {
          type: 'object',
          properties: {
            vendor: { type: 'string', const: 'eventbrite' },
            provider_id: { type: 'string', minLength: 1 },
            changed_at: { type: 'string', format: 'date-time' }
          },
          required: ['vendor', 'provider_id', 'changed_at'],
          additionalProperties: false
        }
      },
      required: ['INVITE.META.V1', 'INVITE.SOURCE.V1'],
      additionalProperties: false
    }
  },
  required: ['entity_type', 'entity_name', 'entity_code', 'smart_code', 'dynamic_data'],
  additionalProperties: false
}

// Create validators
const ajv = new Ajv({ allErrors: true })

export const validateEvent = ajv.compile(eventSchema)
export const validateInvite = ajv.compile(inviteSchema)

// Helper function to validate and get errors
export function validateEventData(data: unknown): {
  valid: boolean
  errors: string[]
} {
  const valid = validateEvent(data)
  if (!valid && validateEvent.errors) {
    return {
      valid: false,
      errors: validateEvent.errors.map(err => 
        `${err.instancePath} ${err.message}`
      )
    }
  }
  return { valid: true, errors: [] }
}

export function validateInviteData(data: unknown): {
  valid: boolean
  errors: string[]
} {
  const valid = validateInvite(data)
  if (!valid && validateInvite.errors) {
    return {
      valid: false,
      errors: validateInvite.errors.map(err => 
        `${err.instancePath} ${err.message}`
      )
    }
  }
  return { valid: true, errors: [] }
}

// Contract definitions for Hub
export const eventContract = {
  id: 'HERA.INTEGRATION.CONTRACT.event.v1',
  name: 'Event Entity Contract',
  version: 1,
  schema: eventSchema
}

export const inviteContract = {
  id: 'HERA.INTEGRATION.CONTRACT.event_invite.v1',
  name: 'Event Invite Entity Contract',
  version: 1,
  schema: inviteSchema
}