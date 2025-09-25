// Types for CivicFlow Events and Registrations

export type EventType = 'webinar' | 'roundtable' | 'conference' | 'workshop' | 'meeting' | 'other';
export type InviteStatus = 'invited' | 'registered' | 'attended' | 'no_show' | 'cancelled' | 'declined';

export interface CivicFlowEvent {
  id: string;
  entity_code: string;
  entity_name: string;
  smart_code: string;
  organization_id: string;
  // Dynamic data fields
  event_type: EventType;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  timezone?: string;
  venue_name?: string;
  venue_address?: string;
  online_url?: string;
  is_online: boolean;
  is_hybrid?: boolean;
  host_program_id?: string;
  host_program_name?: string;
  capacity?: number;
  registration_deadline?: string;
  tags?: string[];
  external_id?: string; // Eventbrite, etc.
  external_source?: string;
  created_at: string;
  updated_at: string;
}

export interface EventInvite {
  id: string;
  entity_code: string;
  entity_name: string;
  smart_code: string;
  organization_id: string;
  // Relationships
  event_id: string;
  event_name?: string;
  subject_id: string; // constituent or organization
  subject_type: 'constituent' | 'organization';
  subject_name?: string;
  // Dynamic data fields
  status: InviteStatus;
  invited_at?: string;
  registered_at?: string;
  attended_at?: string;
  checkin_time?: string;
  ticket_type?: string;
  ticket_number?: string;
  registration_notes?: string;
  dietary_requirements?: string;
  accessibility_needs?: string;
  external_id?: string; // Eventbrite attendee ID, etc.
  created_at: string;
  updated_at: string;
}

export interface EventKPIs {
  total_events: number;
  upcoming_events: number;
  past_events: number;
  total_invitations: number;
  total_registrations: number;
  total_attendance: number;
  avg_attendance_rate: number;
  trending_registration_rate: number;
}

export interface EventFilters {
  search?: string;
  event_type?: EventType;
  program_ids?: string[];
  tags?: string[];
  date_from?: string;
  date_to?: string;
  is_online?: boolean;
  status?: 'upcoming' | 'past' | 'today';
  page?: number;
  page_size?: number;
}

export interface EventInviteFilters {
  event_id?: string;
  subject_id?: string;
  subject_type?: 'constituent' | 'organization';
  status?: InviteStatus;
  program_ids?: string[];
  page?: number;
  page_size?: number;
}

export interface EventStats {
  invited_count: number;
  registered_count: number;
  attended_count: number;
  no_show_count: number;
  cancelled_count: number;
  registration_rate: number;
  attendance_rate: number;
  no_show_rate: number;
  capacity_filled: number;
}

export interface CreateEventRequest {
  entity_name: string;
  event_type: EventType;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  timezone?: string;
  venue_name?: string;
  venue_address?: string;
  online_url?: string;
  is_online: boolean;
  is_hybrid?: boolean;
  host_program_id?: string;
  capacity?: number;
  registration_deadline?: string;
  tags?: string[];
}

export interface SendInvitationRequest {
  event_id: string;
  subject_ids: string[];
  subject_type: 'constituent' | 'organization';
  message?: string;
}

export interface RecordCheckinRequest {
  event_id: string;
  invite_id: string;
  checkin_time?: string; // Defaults to now
  notes?: string;
}