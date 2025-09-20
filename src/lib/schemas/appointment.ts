// ================================================================================
// HERA APPOINTMENT SCHEMAS
// Smart Code: HERA.SCHEMAS.APPOINTMENT.v1
// Appointment data structures with state machine validation
// ================================================================================

import { z } from 'zod'

// Main appointment schema
export const Appointment = z.object({
  id: z.string(),
  code: z.string(),
  organization_id: z.string().uuid(),
  customer: z.object({ 
    id: z.string(), 
    name: z.string(), 
    code: z.string() 
  }),
  stylist: z.object({ 
    id: z.string(), 
    name: z.string(), 
    code: z.string() 
  }),
  branch_code: z.string(),
  chair_slug: z.string().optional(),
  start_time: z.string(), // ISO
  end_time: z.string(),
  status: z.enum([
    'draft',
    'confirmed',
    'in_progress',
    'service_complete',
    'paid',
    'closed',
    'cancelled'
  ]),
  smart_code: z.string(), // e.g., HERA.SALON.APPOINTMENT.BOOKING.v1
  metadata: z.record(z.any()).optional(),
  services: z.array(z.object({
    id: z.string(),
    name: z.string(),
    duration: z.number(), // minutes
    price: z.number(),
  })).optional(),
  notes: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})
export type Appointment = z.infer<typeof Appointment>

// Create appointment schema with validation
export const AppointmentCreate = z.object({
  organization_id: z.string().uuid(),
  code: z.string().optional(), // Auto-generated if not provided
  customer_code: z.string().min(1, 'Customer is required'),
  stylist_code: z.string().min(1, 'Stylist is required'),
  branch_code: z.string().min(1, 'Branch is required'),
  chair_slug: z.string().optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  notes: z.string().optional(),
}).refine(data => {
  const start = new Date(data.start_time)
  const end = new Date(data.end_time)
  return end > start
}, {
  message: 'End time must be after start time',
  path: ['end_time']
})
export type AppointmentCreate = z.infer<typeof AppointmentCreate>

// State transition schema
export const AppointmentTransition = z.object({
  action: z.enum([
    'confirm',
    'start',
    'complete',
    'mark_paid',
    'close',
    'cancel',
    'no_show'
  ]),
  reason: z.string().optional(),
  window_hours: z.number().optional(), // used for cancel with fee
  payment_reference: z.string().optional(), // for mark_paid
})
export type AppointmentTransition = z.infer<typeof AppointmentTransition>

// State machine configuration
export const STATE_TRANSITIONS: Record<string, string[]> = {
  draft: ['confirm', 'cancel'],
  confirmed: ['start', 'cancel', 'no_show'],
  in_progress: ['complete', 'cancel'],
  service_complete: ['mark_paid', 'cancel'],
  paid: ['close'],
  closed: [], // Terminal state
  cancelled: [], // Terminal state
}

// Get allowed transitions for a status
export function getAllowedTransitions(status: Appointment['status']): AppointmentTransition['action'][] {
  return (STATE_TRANSITIONS[status] || []) as AppointmentTransition['action'][]
}

// Validate if transition is allowed
export function isTransitionAllowed(
  currentStatus: Appointment['status'],
  action: AppointmentTransition['action']
): boolean {
  const allowed = getAllowedTransitions(currentStatus)
  return allowed.includes(action)
}

// Map actions to resulting status
export const ACTION_TO_STATUS: Record<AppointmentTransition['action'], Appointment['status']> = {
  confirm: 'confirmed',
  start: 'in_progress',
  complete: 'service_complete',
  mark_paid: 'paid',
  close: 'closed',
  cancel: 'cancelled',
  no_show: 'cancelled',
}

// Status colors for UI
export const STATUS_COLORS: Record<Appointment['status'], { bg: string; text: string; border: string }> = {
  draft: { 
    bg: 'bg-gray-50', 
    text: 'text-gray-700', 
    border: 'border-gray-300' 
  },
  confirmed: { 
    bg: 'bg-primary-50', 
    text: 'text-primary-700', 
    border: 'border-primary-300' 
  },
  in_progress: { 
    bg: 'bg-purple-50', 
    text: 'text-purple-700', 
    border: 'border-purple-300' 
  },
  service_complete: { 
    bg: 'bg-secondary-50', 
    text: 'text-secondary-700', 
    border: 'border-secondary-300' 
  },
  paid: { 
    bg: 'bg-green-50', 
    text: 'text-green-700', 
    border: 'border-green-300' 
  },
  closed: { 
    bg: 'bg-blue-50', 
    text: 'text-blue-700', 
    border: 'border-blue-300' 
  },
  cancelled: { 
    bg: 'bg-gray-50', 
    text: 'text-gray-500', 
    border: 'border-gray-300' 
  },
}

// Activity event types
export const ActivityEvent = z.object({
  id: z.string(),
  appointment_id: z.string(),
  timestamp: z.string().datetime(),
  event_type: z.enum([
    'created',
    'status_changed',
    'whatsapp_sent',
    'customer_confirmed',
    'reminder_sent',
    'payment_received',
    'note_added',
  ]),
  actor: z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['user', 'customer', 'system']),
  }),
  details: z.record(z.any()),
  smart_code: z.string().optional(),
  transaction_id: z.string().optional(),
})
export type ActivityEvent = z.infer<typeof ActivityEvent>

// List filters
export const AppointmentFilters = z.object({
  organization_id: z.string().uuid(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  branch_id: z.string().optional(),
  stylist_id: z.string().optional(),
  customer_id: z.string().optional(),
  status: z.array(z.enum([
    'draft',
    'confirmed', 
    'in_progress',
    'service_complete',
    'paid',
    'closed',
    'cancelled'
  ])).optional(),
})
export type AppointmentFilters = z.infer<typeof AppointmentFilters>