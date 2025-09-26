// Eventbrite API Types
export interface EventbriteVenue {
  id: string
  name: string
  address?: {
    address_1?: string
    address_2?: string
    city?: string
    region?: string
    postal_code?: string
    country?: string
    localized_area_display?: string
  }
}

export interface EventbriteEvent {
  id: string
  name: {
    text: string
    html?: string
  }
  description?: {
    text?: string
    html?: string
  }
  start: {
    timezone: string
    utc: string
    local: string
  }
  end: {
    timezone: string
    utc: string
    local: string
  }
  url: string
  capacity?: number
  capacity_is_custom?: boolean
  status: 'draft' | 'live' | 'started' | 'ended' | 'completed' | 'canceled'
  currency?: string
  online_event?: boolean
  listed?: boolean
  shareable?: boolean
  created: string
  changed: string
  published?: string
  venue?: EventbriteVenue
  venue_id?: string
  format_id?: string
  category_id?: string
  subcategory_id?: string
  series_id?: string
  bookmark_info?: {
    bookmarked: boolean
  }
}

export interface EventbriteAttendee {
  id: string
  created: string
  changed: string
  ticket_class_name: string
  ticket_class_id: string
  profile: {
    first_name?: string
    last_name?: string
    email: string
    name?: string
    addresses?: any
  }
  barcodes?: Array<{
    barcode: string
    status: string
    created: string
    changed: string
    checkin_type?: number
    is_printed?: boolean
  }>
  team?: {
    id: string
    name: string
    date_joined: string
    event_id: string
  }
  costs?: {
    base_price?: {
      display: string
      currency: string
      value: number
      major_value: string
    }
    gross?: {
      display: string
      currency: string
      value: number
      major_value: string
    }
    eventbrite_fee?: {
      display: string
      currency: string
      value: number
      major_value: string
    }
    payment_fee?: {
      display: string
      currency: string
      value: number
      major_value: string
    }
    tax?: {
      display: string
      currency: string
      value: number
      major_value: string
    }
  }
  checked_in: boolean
  checkin_time?: string
  cancelled: boolean
  refunded: boolean
  status: 'attending' | 'deleted' | 'not_attending' | 'transferred'
  order_id: string
  quantity?: number
}

export interface EventbritePagination {
  object_count: number
  page_number: number
  page_size: number
  page_count: number
  has_more_items: boolean
  continuation?: string
}

export interface EventbriteEventsResponse {
  events: EventbriteEvent[]
  pagination: EventbritePagination
}

export interface EventbriteAttendeesResponse {
  attendees: EventbriteAttendee[]
  pagination: EventbritePagination
}

export interface EventbriteMeResponse {
  id: string
  name: string
  first_name?: string
  last_name?: string
  is_public: boolean
  image_id?: string
  emails: Array<{
    email: string
    verified: boolean
    primary: boolean
  }>
}

// Adapter Result Types
export interface AdapterStats {
  eventsProcessed: number
  attendeesProcessed: number
  eventsCreated: number
  eventsUpdated: number
  attendeesCreated: number
  attendeesUpdated: number
  checkins: number
  errors: number
}

export interface AdapterResult {
  success: boolean
  stats: AdapterStats
  cursor?: string // Last 'changed' timestamp for next sync
  partialErrors: Array<{
    type: 'event' | 'attendee'
    id: string
    error: string
  }>
}

// Mapping Types
export interface EventbriteMappingConfig {
  direction: 'pull'
  version: number
  field_map: Record<string, string>
  transforms: Array<{
    op: 'validate' | 'derive' | 'upsert' | 'relate' | 'relateByEmailIfExists'
    contract?: string
    expr?: string
    entity_type?: string
    id_field?: string
    type?: string
    from_lookup?: string
    to_lookup?: string
    email_field?: string
  }>
}

// Normalized Entity Types for HERA
export interface NormalizedEvent {
  entity_type: 'event'
  entity_name: string
  entity_code: string
  smart_code: string
  dynamic_data: {
    'EVENT.META.V1': {
      title: string
      type: 'webinar' | 'conference' | 'workshop' | 'roundtable'
      start: string
      end: string
      timezone: string
      venue?: string
      url: string
      status: 'live' | 'completed' | 'cancelled' | 'draft'
      capacity?: number
      online_event: boolean
      tags?: string[]
    }
    'EVENT.SOURCE.V1': {
      vendor: 'eventbrite'
      provider_id: string
      changed_at: string
    }
  }
}

export interface NormalizedInvite {
  entity_type: 'event_invite'
  entity_name: string
  entity_code: string
  smart_code: string
  dynamic_data: {
    'INVITE.META.V1': {
      status: 'invited' | 'registered' | 'attended' | 'no_show' | 'cancelled'
      ticket_type: string
      email: string
      first_name?: string
      last_name?: string
      checked_in: boolean
      checkin_time?: string
      source: 'eventbrite'
    }
    'INVITE.SOURCE.V1': {
      vendor: 'eventbrite'
      provider_id: string
      changed_at: string
    }
  }
}
