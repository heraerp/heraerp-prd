// ================================================================================
// APPOINTMENT SYSTEM TYPES
// Smart Code: HERA.TYPES.APPOINTMENT.v1
// TypeScript type definitions for salon appointment system
// ================================================================================

export type DraftInput = {
  organizationId: string
  startAt: string // ISO timestamp
  durationMin: number
  customerEntityId: string
  preferredStylistEntityId?: string | null
  notes?: string
  idempotencyKey?: string // optional
}

export type LineInput = {
  organizationId: string
  appointmentId: string
  items: Array<{
    type: 'SERVICE' | 'PRODUCT'
    entityId: string
    qty: number
    unitAmount: number
    durationMin?: number
  }>
}

export type AppointmentStatus = 
  | 'DRAFT'
  | 'CONFIRMED' 
  | 'IN_SERVICE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

export type SmartCodes = {
  readonly APPOINTMENT_HEADER: 'HERA.SALON.APPOINTMENT.BOOKING.HEADER.V1'
  readonly SERVICE_LINE: 'HERA.SALON.APPOINTMENT.LINE.SERVICE.V1'
  readonly PRODUCT_LINE: 'HERA.SALON.APPOINTMENT.LINE.PRODUCT.V1'
}

export const SMART_CODES: SmartCodes = {
  APPOINTMENT_HEADER: 'HERA.SALON.APPOINTMENT.BOOKING.HEADER.V1',
  SERVICE_LINE: 'HERA.SALON.APPOINTMENT.LINE.SERVICE.V1', 
  PRODUCT_LINE: 'HERA.SALON.APPOINTMENT.LINE.PRODUCT.V1'
} as const

export type Customer = {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    phone?: string
    email?: string
    preferred_stylist_id?: string
  }
}

export type Service = {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    price?: number
    duration_minutes?: number
    category?: string
  }
}

export type Stylist = {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    specialties?: string[]
    hourly_rate?: number
  }
}

export type CartItem = {
  service: Service
  quantity: number
  price: number
  duration: number
}

export type TimeSlot = {
  start: string
  end: string
}

export type AppointmentRecord = {
  id: string
  transaction_date: string
  transaction_code: string
  total_amount: number
  metadata?: any
  source_entity?: any  // Customer
  target_entity?: any  // Stylist
  status?: string
}

// Type guards for runtime validation
export const isValidAppointmentStatus = (status: string): status is AppointmentStatus => {
  return ['DRAFT', 'CONFIRMED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)
}

export const isServiceItem = (item: { type: string }): item is { type: 'SERVICE' } => {
  return item.type === 'SERVICE'
}

export const isProductItem = (item: { type: string }): item is { type: 'PRODUCT' } => {
  return item.type === 'PRODUCT'
}