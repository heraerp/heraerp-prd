// HERA Universal Calendar System - Type Definitions
// Follows HERA 6-table architecture with Smart Coding

export interface UniversalResource {
  // Maps to core_entities
  entity_id: string
  organization_id: string
  entity_type: 'calendar_resource'
  entity_name: string
  entity_code: string
  smart_code: string
  status: 'active' | 'inactive' | 'maintenance'
  ai_confidence?: number
  
  // Resource-specific properties (from core_dynamic_data)
  resource_type: 'STAFF' | 'EQUIPMENT' | 'ROOM' | 'VEHICLE' | 'VIRTUAL'
  industry_type: 'healthcare' | 'restaurant' | 'professional' | 'manufacturing' | 'universal'
  availability_windows?: string // JSON: [{"start": "09:00", "end": "17:00", "days": ["MON","TUE"]}]
  capacity?: number
  skills?: string[] // Serialized skills array
  location?: string
  cost_per_hour?: number
  maintenance_schedule?: string // JSON: maintenance windows
  booking_rules?: string // JSON: booking constraints
}

export interface UniversalAppointment {
  // Maps to universal_transactions
  transaction_id: string
  organization_id: string
  transaction_type: 'appointment' | 'reservation' | 'booking' | 'maintenance'
  smart_code: string
  reference_number: string
  transaction_date: Date
  status: 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  
  // Appointment details
  title: string
  description?: string
  start_time: Date
  end_time: Date
  duration_minutes: number
  
  // Customer/Client information (entity_id reference)
  customer_entity_id?: string
  
  // Appointment metadata
  appointment_type: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  notes?: string
  
  // Industry-specific data (JSON in core_dynamic_data)
  industry_data?: Record<string, any>
}

export interface AppointmentLine {
  // Maps to universal_transaction_lines
  line_id: string
  transaction_id: string
  entity_id: string // Resource entity_id
  line_type: 'resource_allocation'
  quantity: number // Usually 1 for resources
  duration_minutes: number
  unit_cost?: number
  line_total?: number
  smart_code: string
  
  // Resource allocation details
  allocation_type: 'primary' | 'secondary' | 'backup'
  preparation_time?: number
  cleanup_time?: number
  skills_required?: string[]
}

export interface ResourceAvailability {
  resource_entity_id: string
  date: Date
  available_slots: TimeSlot[]
  booked_slots: BookedSlot[]
  maintenance_windows: MaintenanceWindow[]
  utilization_percentage: number
}

export interface TimeSlot {
  start_time: Date
  end_time: Date
  available: boolean
  capacity_available?: number
  skills_available?: string[]
}

export interface BookedSlot {
  start_time: Date
  end_time: Date
  appointment_id: string
  customer_name: string
  appointment_type: string
  status: UniversalAppointment['status']
}

export interface MaintenanceWindow {
  start_time: Date
  end_time: Date
  maintenance_type: string
  description: string
  recurring?: boolean
}

// Smart Code Patterns for Calendar System
export interface CalendarSmartCodes {
  // Resource Smart Codes
  HEALTHCARE_STAFF: 'HERA.HLTH.CRM.RES.STAFF.v1'
  HEALTHCARE_EQUIPMENT: 'HERA.HLTH.CRM.RES.EQUIP.v1'
  HEALTHCARE_ROOM: 'HERA.HLTH.CRM.RES.ROOM.v1'
  
  RESTAURANT_TABLE: 'HERA.REST.CRM.RES.TABLE.v1'
  RESTAURANT_STAFF: 'HERA.REST.CRM.RES.STAFF.v1'
  RESTAURANT_KITCHEN: 'HERA.REST.CRM.RES.KITCHEN.v1'
  
  PROFESSIONAL_STAFF: 'HERA.PROF.CRM.RES.STAFF.v1'
  PROFESSIONAL_ROOM: 'HERA.PROF.CRM.RES.ROOM.v1'
  PROFESSIONAL_VIRTUAL: 'HERA.PROF.CRM.RES.VIRTUAL.v1'
  
  MANUFACTURING_EQUIPMENT: 'HERA.MFG.CRM.RES.EQUIP.v1'
  MANUFACTURING_STAFF: 'HERA.MFG.CRM.RES.STAFF.v1'
  MANUFACTURING_LINE: 'HERA.MFG.CRM.RES.LINE.v1'
  
  // Appointment Transaction Smart Codes
  HEALTHCARE_APPOINTMENT: 'HERA.HLTH.CRM.TXN.APPT.v1'
  RESTAURANT_RESERVATION: 'HERA.REST.CRM.TXN.RESV.v1'
  PROFESSIONAL_MEETING: 'HERA.PROF.CRM.TXN.MEET.v1'
  MANUFACTURING_MAINTENANCE: 'HERA.MFG.CRM.TXN.MAINT.v1'
  
  // Calendar Event Smart Codes
  CALENDAR_EVENT_DRAFT: 'HERA.CRM.CAL.ENT.EVENT.DRAFT'
  CALENDAR_EVENT_AI_HIGH: 'HERA.CRM.CAL.ENT.EVENT.AI.HIGH'
  CALENDAR_EVENT_REVIEWED: 'HERA.CRM.CAL.ENT.EVENT.HR.v1'
  CALENDAR_EVENT_PRODUCTION: 'HERA.CRM.CAL.ENT.EVENT.PROD.v1'
}

// Industry-Specific Calendar Configurations
export interface IndustryCalendarConfig {
  industry: string
  resource_types: string[]
  appointment_types: string[]
  default_duration: number
  business_hours: {
    start: string
    end: string
    days: string[]
  }
  booking_rules: {
    advance_booking_days: number
    cancellation_hours: number
    preparation_minutes?: number
    cleanup_minutes?: number
  }
  required_fields: string[]
  optional_fields: string[]
}

// Calendar View Types
export type CalendarView = 
  | 'dayGridMonth' 
  | 'timeGridWeek' 
  | 'timeGridDay' 
  | 'listWeek'
  | 'resourceTimeGridDay'
  | 'resourceTimeGridWeek'

// Conflict Detection
export interface SchedulingConflict {
  conflict_id: string
  type: 'resource_double_booking' | 'maintenance_overlap' | 'skills_unavailable' | 'capacity_exceeded'
  severity: 'warning' | 'error' | 'critical'
  affected_appointments: string[]
  affected_resources: string[]
  suggestions: ConflictResolution[]
  auto_resolvable: boolean
}

export interface ConflictResolution {
  resolution_type: 'reschedule' | 'reassign_resource' | 'split_appointment' | 'waitlist'
  description: string
  alternative_slots?: TimeSlot[]
  alternative_resources?: string[]
  cost_impact?: number
}

// Analytics and Reporting Types
export interface ResourceUtilization {
  resource_entity_id: string
  resource_name: string
  period_start: Date
  period_end: Date
  total_available_hours: number
  total_booked_hours: number
  utilization_percentage: number
  revenue_generated?: number
  appointments_count: number
  average_appointment_duration: number
  no_show_rate: number
  cancellation_rate: number
}

export interface CalendarAnalytics {
  organization_id: string
  period_start: Date
  period_end: Date
  total_appointments: number
  total_revenue?: number
  resource_utilization: ResourceUtilization[]
  popular_time_slots: TimeSlot[]
  peak_demand_analysis: {
    day_of_week: string
    hour_of_day: number
    demand_level: number
  }[]
  industry_benchmarks?: Record<string, number>
}

// AI Enhancement Types
export interface AISchedulingSuggestion {
  suggestion_id: string
  type: 'optimal_scheduling' | 'load_balancing' | 'resource_optimization' | 'revenue_maximization'
  confidence_score: number
  description: string
  potential_impact: {
    utilization_improvement?: number
    revenue_increase?: number
    efficiency_gain?: number
  }
  implementation_steps: string[]
  auto_implementable: boolean
}

// Multi-tenant Security Context
export interface CalendarSecurityContext {
  organization_id: string
  user_id: string
  user_role: string
  resource_access_level: 'read' | 'write' | 'admin'
  industry_permissions: string[]
  data_access_scope: 'own_appointments' | 'team_appointments' | 'all_appointments'
}

// Real-time Update Types
export interface CalendarUpdateEvent {
  event_type: 'appointment_created' | 'appointment_updated' | 'appointment_cancelled' | 'resource_updated'
  organization_id: string
  entity_id: string
  transaction_id?: string
  timestamp: Date
  changed_fields: string[]
  previous_values?: Record<string, any>
  new_values: Record<string, any>
  affected_users: string[]
}

// Integration Types
export interface ExternalCalendarSync {
  sync_id: string
  organization_id: string
  provider: 'google' | 'outlook' | 'apple' | 'custom'
  sync_direction: 'import' | 'export' | 'bidirectional'
  last_sync: Date
  sync_frequency: number // minutes
  field_mappings: Record<string, string>
  conflict_resolution: 'hera_wins' | 'external_wins' | 'manual_review'
  status: 'active' | 'paused' | 'error'
}

// Component Props Types
export interface UniversalCalendarProps {
  organization_id: string
  industry_type?: string
  initial_view?: CalendarView
  show_resources?: boolean
  editable?: boolean
  selectable?: boolean
  height?: string | number
  business_hours?: any
  resources?: UniversalResource[]
  events?: UniversalAppointment[]
  on_event_click?: (appointment: UniversalAppointment) => void
  on_event_drop?: (appointment: UniversalAppointment, delta: any) => void
  on_event_resize?: (appointment: UniversalAppointment, delta: any) => void
  on_date_select?: (start: Date, end: Date, resource?: UniversalResource) => void
  on_resource_click?: (resource: UniversalResource) => void
  custom_buttons?: Record<string, any>
  header_toolbar?: any
  footer_toolbar?: any
  slot_duration?: string
  slot_min_time?: string
  slot_max_time?: string
  all_day_slot?: boolean
}

export interface ResourceManagerProps {
  organization_id: string
  industry_type: string
  resources: UniversalResource[]
  on_resource_create: (resource: Partial<UniversalResource>) => Promise<void>
  on_resource_update: (resource: UniversalResource) => Promise<void>
  on_resource_delete: (resource_id: string) => Promise<void>
  show_utilization?: boolean
  show_analytics?: boolean
}

export interface AppointmentModalProps {
  organization_id: string
  appointment?: UniversalAppointment
  resources: UniversalResource[]
  is_open: boolean
  on_close: () => void
  on_save: (appointment: Partial<UniversalAppointment>) => Promise<void>
  on_delete?: (appointment_id: string) => Promise<void>
  mode: 'create' | 'edit' | 'view'
  industry_config: IndustryCalendarConfig
}