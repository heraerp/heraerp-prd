/**
 * HERA DNA Universal Calendar API Types
 * Smart Code: HERA.API.CALENDAR.CONTRACTS.V1
 *
 * Complete API contracts for calendar operations using Sacred Six Tables
 */

// Types for HERA Calendar API - uses Sacred Six Tables

// Base Calendar Types
export interface CalendarEvent {
  id: string
  title: string
  start: string | Date
  end?: string | Date
  allDay?: boolean
  resourceId?: string
  extendedProps?: {
    entity_id: string
    smart_code: string
    organization_id: string
    event_type: 'appointment' | 'block' | 'holiday' | 'shift' | 'maintenance'
    status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
    customer_id?: string
    staff_id?: string
    service_id?: string
    notes?: string
    metadata?: Record<string, any>
  }
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  classNames?: string[]
  display?: 'auto' | 'block' | 'list-item' | 'background' | 'inverse-background' | 'none'
  overlap?: boolean
  constraint?: string | object
}

export interface CalendarResource {
  id: string
  title: string
  extendedProps?: {
    entity_id: string
    smart_code: string
    organization_id: string
    resource_type: 'staff' | 'room' | 'equipment' | 'location'
    capacity?: number
    skills?: string[]
    availability?: ResourceAvailability[]
    metadata?: Record<string, any>
  }
  eventOverlap?: boolean
  eventConstraint?: string | object
  eventBackgroundColor?: string
  eventBorderColor?: string
  eventTextColor?: string
}

export interface ResourceAvailability {
  daysOfWeek: number[]
  startTime: string
  endTime: string
  startRecur?: string
  endRecur?: string
}

// API Request/Response Types
export interface CreateEventRequest {
  title: string
  start: string
  end?: string
  allDay?: boolean
  resourceId?: string
  event_type: 'appointment' | 'block' | 'holiday' | 'shift' | 'maintenance'
  smart_code: string
  customer_id?: string
  staff_id?: string
  service_id?: string
  notes?: string
  metadata?: Record<string, any>
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  id: string
}

export interface CreateResourceRequest {
  title: string
  resource_type: 'staff' | 'room' | 'equipment' | 'location'
  smart_code: string
  capacity?: number
  skills?: string[]
  availability?: ResourceAvailability[]
  metadata?: Record<string, any>
}

export interface UpdateResourceRequest extends Partial<CreateResourceRequest> {
  id: string
}

export interface CalendarViewConfig {
  organization_id: string
  view_type: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'resourceTimeGridDay' | 'listWeek'
  business_hours?: BusinessHours[]
  holidays?: Holiday[]
  theme_colors?: CalendarTheme
  smart_codes?: string[]
}

export interface BusinessHours {
  daysOfWeek: number[]
  startTime: string
  endTime: string
}

export interface Holiday {
  date: string
  title: string
  smart_code: string
  recurring?: boolean
}

export interface CalendarTheme {
  primary: string
  secondary: string
  success: string
  warning: string
  danger: string
  info: string
  light: string
  dark: string
}

// API Response Types
export interface CalendarApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  smart_code?: string
  timestamp: string
}

export interface EventsResponse extends CalendarApiResponse {
  data: {
    events: CalendarEvent[]
    resources?: CalendarResource[]
    total_count: number
    filtered_count: number
  }
}

export interface ResourcesResponse extends CalendarApiResponse {
  data: {
    resources: CalendarResource[]
    total_count: number
  }
}

export interface EventResponse extends CalendarApiResponse {
  data: CalendarEvent
}

export interface ResourceResponse extends CalendarApiResponse {
  data: CalendarResource
}

// Query Parameters
export interface CalendarQueryParams {
  organization_id: string
  start?: string
  end?: string
  resource_ids?: string[]
  event_types?: string[]
  smart_codes?: string[]
  status?: string[]
  customer_id?: string
  staff_id?: string
  service_id?: string
  limit?: number
  offset?: number
}

// Webhook Types for Real-time Updates
export interface CalendarWebhookPayload {
  event_type:
    | 'event.created'
    | 'event.updated'
    | 'event.deleted'
    | 'resource.created'
    | 'resource.updated'
    | 'resource.deleted'
  organization_id: string
  smart_code: string
  data: CalendarEvent | CalendarResource
  timestamp: string
  user_id?: string
}

// Error Types
export interface CalendarError {
  code: string
  message: string
  details?: Record<string, any>
  smart_code?: string
}

export interface ValidationError extends CalendarError {
  field_errors: Record<string, string[]>
}

// Database Entity Mappings for Sacred Six Tables
export interface CalendarEntityMapping {
  // Events stored in universal_transactions
  event: {
    table: 'universal_transactions'
    entity_type: 'calendar_event'
    smart_code_pattern: 'HERA.*.CALENDAR.EVENT.*'
    required_fields: ['transaction_type', 'transaction_date', 'organization_id']
  }

  // Resources stored in core_entities
  resource: {
    table: 'core_entities'
    entity_type: 'calendar_resource'
    smart_code_pattern: 'HERA.*.CALENDAR.RESOURCE.*'
    required_fields: ['entity_type', 'entity_name', 'organization_id']
  }

  // Availability stored in core_dynamic_data
  availability: {
    table: 'core_dynamic_data'
    field_name: 'calendar_availability'
    smart_code_pattern: 'HERA.*.CALENDAR.AVAILABILITY.*'
  }

  // Event-Resource relationships stored in core_relationships
  assignment: {
    table: 'core_relationships'
    relationship_type: 'calendar_assignment'
    smart_code_pattern: 'HERA.*.CALENDAR.ASSIGNMENT.*'
  }
}

// Industry-Specific Extensions
export interface SalonCalendarExtensions {
  service_duration_minutes: number
  buffer_time_minutes: number
  stylist_specializations: string[]
  chemical_service_restrictions: boolean
  bridal_package_coordination: boolean
}

export interface RestaurantCalendarExtensions {
  table_capacity: number
  reservation_duration_minutes: number
  special_dietary_requirements: string[]
  party_size_limits: { min: number; max: number }
}

export interface HealthcareCalendarExtensions {
  appointment_type: 'consultation' | 'procedure' | 'follow_up' | 'emergency'
  patient_id: string
  insurance_verification_required: boolean
  medical_equipment_required: string[]
  practitioner_license_requirements: string[]
}

export interface ManufacturingCalendarExtensions {
  production_line_id: string
  shift_type: 'morning' | 'afternoon' | 'night' | 'weekend'
  quality_control_checkpoints: string[]
  material_requirements: string[]
  safety_protocols: string[]
}
