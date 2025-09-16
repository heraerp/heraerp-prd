/**
 * HERA DNA Universal Calendar - JSON Schemas & Validation
 * Smart Code: HERA.SCHEMA.CALENDAR.VALIDATION.v1
 *
 * Complete validation schemas for calendar operations using Zod
 */

import { z } from 'zod'

// ====================================================================
// BASE SCHEMAS
// ====================================================================

// UUID Schema
const uuidSchema = z.string().uuid('Invalid UUID format')

// Smart Code Schema
const smartCodeSchema = z
  .string()
  .regex(
    /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/,
    'Smart code must follow HERA.INDUSTRY.MODULE.FUNCTION.TYPE.vN format'
  )

// Date/Time Schemas
const dateTimeSchema = z.union([z.string().datetime(), z.date()])
const timeSchema = z
  .string()
  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')

// ====================================================================
// CALENDAR EVENT SCHEMAS
// ====================================================================

export const CalendarEventSchema = z.object({
  id: uuidSchema,
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  start: dateTimeSchema,
  end: dateTimeSchema.optional(),
  allDay: z.boolean().default(false),
  resourceId: uuidSchema.optional(),
  extendedProps: z.object({
    entity_id: uuidSchema,
    smart_code: smartCodeSchema,
    organization_id: uuidSchema,
    event_type: z.enum(['appointment', 'block', 'holiday', 'shift', 'maintenance']),
    status: z
      .enum(['draft', 'confirmed', 'pending', 'cancelled', 'completed', 'no_show'])
      .default('confirmed'),
    customer_id: uuidSchema.optional(),
    staff_id: uuidSchema.optional(),
    service_id: uuidSchema.optional(),
    notes: z.string().max(1000, 'Notes too long').optional(),
    metadata: z.record(z.any()).optional()
  }),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional(),
  borderColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional(),
  textColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional(),
  classNames: z.array(z.string()).optional(),
  display: z
    .enum(['auto', 'block', 'list-item', 'background', 'inverse-background', 'none'])
    .optional(),
  overlap: z.boolean().optional(),
  constraint: z.union([z.string(), z.record(z.any())]).optional()
})

export const CreateEventSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    start: dateTimeSchema,
    end: dateTimeSchema.optional(),
    allDay: z.boolean().default(false),
    resourceId: uuidSchema.optional(),
    event_type: z.enum(['appointment', 'block', 'holiday', 'shift', 'maintenance']),
    smart_code: smartCodeSchema,
    customer_id: uuidSchema.optional(),
    staff_id: uuidSchema.optional(),
    service_id: uuidSchema.optional(),
    notes: z.string().max(1000, 'Notes too long').optional(),
    metadata: z.record(z.any()).optional()
  })
  .refine(
    data => {
      // If end is provided, it must be after start
      if (data.end) {
        const startTime = new Date(data.start).getTime()
        const endTime = new Date(data.end).getTime()
        return endTime > startTime
      }
      return true
    },
    {
      message: 'End time must be after start time',
      path: ['end']
    }
  )

export const UpdateEventSchema = CreateEventSchema.extend({
  id: uuidSchema
})
  .partial()
  .required({ id: true })

// ====================================================================
// CALENDAR RESOURCE SCHEMAS
// ====================================================================

export const ResourceAvailabilitySchema = z
  .object({
    daysOfWeek: z.array(z.number().min(0).max(6)).min(1, 'At least one day must be specified'),
    startTime: timeSchema,
    endTime: timeSchema,
    startRecur: z.string().datetime().optional(),
    endRecur: z.string().datetime().optional()
  })
  .refine(
    data => {
      // End time must be after start time
      const startMinutes =
        parseInt(data.startTime.split(':')[0]) * 60 + parseInt(data.startTime.split(':')[1])
      const endMinutes =
        parseInt(data.endTime.split(':')[0]) * 60 + parseInt(data.endTime.split(':')[1])
      return endMinutes > startMinutes
    },
    {
      message: 'End time must be after start time',
      path: ['endTime']
    }
  )

export const CalendarResourceSchema = z.object({
  id: uuidSchema,
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  extendedProps: z.object({
    entity_id: uuidSchema,
    smart_code: smartCodeSchema,
    organization_id: uuidSchema,
    resource_type: z.enum(['staff', 'room', 'equipment', 'location']),
    capacity: z.number().int().min(1).max(100).optional(),
    skills: z.array(z.string()).optional(),
    availability: z.array(ResourceAvailabilitySchema).optional(),
    metadata: z.record(z.any()).optional()
  }),
  eventOverlap: z.boolean().optional(),
  eventConstraint: z.union([z.string(), z.record(z.any())]).optional(),
  eventBackgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional(),
  eventBorderColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional(),
  eventTextColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional()
})

export const CreateResourceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  resource_type: z.enum(['staff', 'room', 'equipment', 'location']),
  smart_code: smartCodeSchema,
  capacity: z.number().int().min(1).max(100).optional(),
  skills: z.array(z.string()).optional(),
  availability: z.array(ResourceAvailabilitySchema).optional(),
  metadata: z.record(z.any()).optional()
})

export const UpdateResourceSchema = CreateResourceSchema.extend({
  id: uuidSchema
})
  .partial()
  .required({ id: true })

// ====================================================================
// CALENDAR VIEW & CONFIG SCHEMAS
// ====================================================================

export const BusinessHoursSchema = z.object({
  daysOfWeek: z.array(z.number().min(0).max(6)),
  startTime: timeSchema,
  endTime: timeSchema
})

export const HolidaySchema = z.object({
  date: z.string().date('Invalid date format'),
  title: z.string().min(1, 'Title is required'),
  smart_code: smartCodeSchema,
  recurring: z.boolean().default(false)
})

export const CalendarThemeSchema = z.object({
  primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  success: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  warning: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  danger: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  info: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  light: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  dark: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
})

export const CalendarViewConfigSchema = z.object({
  organization_id: uuidSchema,
  view_type: z.enum([
    'dayGridMonth',
    'timeGridWeek',
    'timeGridDay',
    'resourceTimeGridDay',
    'listWeek'
  ]),
  business_hours: z.array(BusinessHoursSchema).optional(),
  holidays: z.array(HolidaySchema).optional(),
  theme_colors: CalendarThemeSchema.optional(),
  smart_codes: z.array(smartCodeSchema).optional()
})

// ====================================================================
// QUERY PARAMETER SCHEMAS
// ====================================================================

export const CalendarQuerySchema = z.object({
  organization_id: uuidSchema,
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  resource_ids: z.array(uuidSchema).optional(),
  event_types: z
    .array(z.enum(['appointment', 'block', 'holiday', 'shift', 'maintenance']))
    .optional(),
  smart_codes: z.array(smartCodeSchema).optional(),
  status: z
    .array(z.enum(['draft', 'confirmed', 'pending', 'cancelled', 'completed', 'no_show']))
    .optional(),
  customer_id: uuidSchema.optional(),
  staff_id: uuidSchema.optional(),
  service_id: uuidSchema.optional(),
  limit: z.number().int().min(1).max(500).default(100),
  offset: z.number().int().min(0).default(0)
})

// ====================================================================
// API RESPONSE SCHEMAS
// ====================================================================

export const CalendarApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  smart_code: smartCodeSchema.optional(),
  timestamp: z.string().datetime()
})

export const EventsResponseSchema = CalendarApiResponseSchema.extend({
  data: z
    .object({
      events: z.array(CalendarEventSchema),
      resources: z.array(CalendarResourceSchema).optional(),
      total_count: z.number().int().min(0),
      filtered_count: z.number().int().min(0)
    })
    .optional()
})

export const ResourcesResponseSchema = CalendarApiResponseSchema.extend({
  data: z
    .object({
      resources: z.array(CalendarResourceSchema),
      total_count: z.number().int().min(0)
    })
    .optional()
})

// ====================================================================
// WEBHOOK SCHEMAS
// ====================================================================

export const CalendarWebhookSchema = z.object({
  event_type: z.enum([
    'event.created',
    'event.updated',
    'event.deleted',
    'resource.created',
    'resource.updated',
    'resource.deleted'
  ]),
  organization_id: uuidSchema,
  smart_code: smartCodeSchema,
  data: z.union([CalendarEventSchema, CalendarResourceSchema]),
  timestamp: z.string().datetime(),
  user_id: uuidSchema.optional()
})

// ====================================================================
// INDUSTRY-SPECIFIC EXTENSION SCHEMAS
// ====================================================================

export const SalonCalendarExtensionsSchema = z.object({
  service_duration_minutes: z.number().int().min(15).max(480),
  buffer_time_minutes: z.number().int().min(0).max(120).default(30),
  stylist_specializations: z.array(z.string()),
  chemical_service_restrictions: z.boolean().default(false),
  bridal_package_coordination: z.boolean().default(false)
})

export const RestaurantCalendarExtensionsSchema = z.object({
  table_capacity: z.number().int().min(1).max(20),
  reservation_duration_minutes: z.number().int().min(30).max(300).default(120),
  special_dietary_requirements: z.array(z.string()),
  party_size_limits: z.object({
    min: z.number().int().min(1).default(1),
    max: z.number().int().min(1).max(50).default(8)
  })
})

export const HealthcareCalendarExtensionsSchema = z.object({
  appointment_type: z.enum(['consultation', 'procedure', 'follow_up', 'emergency']),
  patient_id: uuidSchema,
  insurance_verification_required: z.boolean().default(true),
  medical_equipment_required: z.array(z.string()),
  practitioner_license_requirements: z.array(z.string())
})

export const ManufacturingCalendarExtensionsSchema = z.object({
  production_line_id: uuidSchema,
  shift_type: z.enum(['morning', 'afternoon', 'night', 'weekend']),
  quality_control_checkpoints: z.array(z.string()),
  material_requirements: z.array(z.string()),
  safety_protocols: z.array(z.string())
})

// ====================================================================
// VALIDATION ERROR SCHEMA
// ====================================================================

export const ValidationErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
  smart_code: smartCodeSchema.optional(),
  field_errors: z.record(z.array(z.string()))
})

// ====================================================================
// METADATA SCHEMAS FOR SACRED SIX TABLES
// ====================================================================

// Universal Transaction Metadata for Calendar Events
export const EventTransactionMetadataSchema = z.object({
  calendar_event: z.literal(true),
  title: z.string(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime().optional(),
  all_day: z.boolean().default(false),
  service_type: z.string().optional(),
  service_id: uuidSchema.optional(),
  duration_minutes: z.number().int().min(0).optional(),
  buffer_minutes: z.number().int().min(0).default(0),
  room_id: uuidSchema.optional(),
  equipment_required: z.array(z.string()).optional(),
  special_instructions: z.string().optional(),
  reminder_sent: z.boolean().default(false),
  confirmation_required: z.boolean().default(true),
  deposit_paid: z.boolean().default(false),
  deposit_amount: z.number().min(0).optional(),
  recurring_pattern: z.string().optional(),
  parent_appointment_id: uuidSchema.optional(),
  cancellation_policy: z
    .enum(['24_hours', '48_hours', '72_hours', 'no_cancellation'])
    .default('24_hours'),
  color_code: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional()
})

// Core Entity Metadata for Calendar Resources
export const ResourceEntityMetadataSchema = z.object({
  calendar_resource: z.literal(true),
  resource_type: z.enum(['staff', 'room', 'equipment', 'location']),
  specializations: z.array(z.string()).optional(),
  skill_level: z.enum(['junior', 'intermediate', 'senior', 'expert', 'celebrity']).optional(),
  hourly_rate: z.number().min(0).optional(),
  commission_rate: z.number().min(0).max(1).optional(),
  capacity: z.number().int().min(1).default(1),
  simultaneous_bookings: z.boolean().default(false),
  mobile_service: z.boolean().default(false),
  languages: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  years_experience: z.number().int().min(0).optional(),
  booking_lead_time_hours: z.number().int().min(0).default(0),
  cancellation_fee: z.number().min(0).optional(),
  color_code: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional()
})

// Dynamic Data Schema for Availability
export const AvailabilityDynamicDataSchema = z.object({
  schedule_type: z
    .enum(['weekly_recurring', 'custom_dates', 'flexible'])
    .default('weekly_recurring'),
  timezone: z.string().default('UTC'),
  weekly_hours: z.number().int().min(0).max(168).optional(),
  schedule: z.array(
    z.object({
      day: z.number().int().min(0).max(6),
      day_name: z.string(),
      start: timeSchema.optional(),
      end: timeSchema.optional(),
      available: z.boolean(),
      break_start: timeSchema.optional(),
      break_end: timeSchema.optional(),
      notes: z.string().optional()
    })
  ),
  exceptions: z
    .array(
      z.object({
        date: z.string().date(),
        available: z.boolean().optional(),
        start: timeSchema.optional(),
        end: timeSchema.optional(),
        reason: z.string().optional()
      })
    )
    .optional(),
  prayer_times: z
    .object({
      enabled: z.boolean().default(false),
      duration_minutes: z.number().int().min(0).max(60).default(15),
      flexible_timing: z.boolean().default(true),
      ramadan_adjustments: z.boolean().default(false)
    })
    .optional(),
  overtime_allowed: z.boolean().default(false),
  weekend_premium: z.number().min(1).default(1.5),
  holiday_premium: z.number().min(1).default(2.0)
})

// ====================================================================
// TYPE EXPORTS (for TypeScript usage)
// ====================================================================

export type CalendarEvent = z.infer<typeof CalendarEventSchema>
export type CreateEventRequest = z.infer<typeof CreateEventSchema>
export type UpdateEventRequest = z.infer<typeof UpdateEventSchema>
export type CalendarResource = z.infer<typeof CalendarResourceSchema>
export type CreateResourceRequest = z.infer<typeof CreateResourceSchema>
export type UpdateResourceRequest = z.infer<typeof UpdateResourceSchema>
export type CalendarViewConfig = z.infer<typeof CalendarViewConfigSchema>
export type CalendarQuery = z.infer<typeof CalendarQuerySchema>
export type CalendarWebhook = z.infer<typeof CalendarWebhookSchema>
export type SalonCalendarExtensions = z.infer<typeof SalonCalendarExtensionsSchema>
export type RestaurantCalendarExtensions = z.infer<typeof RestaurantCalendarExtensionsSchema>
export type HealthcareCalendarExtensions = z.infer<typeof HealthcareCalendarExtensionsSchema>
export type ManufacturingCalendarExtensions = z.infer<typeof ManufacturingCalendarExtensionsSchema>
export type ValidationError = z.infer<typeof ValidationErrorSchema>
export type EventTransactionMetadata = z.infer<typeof EventTransactionMetadataSchema>
export type ResourceEntityMetadata = z.infer<typeof ResourceEntityMetadataSchema>
export type AvailabilityDynamicData = z.infer<typeof AvailabilityDynamicDataSchema>
