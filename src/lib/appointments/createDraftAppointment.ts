// ================================================================================
// CREATE DRAFT APPOINTMENT
// Smart Code: HERA.LIB.APPOINTMENT.CREATE.DRAFT.V1
// Creates a DRAFT appointment header with smart_code and org filter
// ================================================================================

import { supabase } from '@/lib/supabase'

export type DraftInput = {
  organizationId: string
  startAt: string // ISO
  durationMin: number
  customerEntityId: string
  preferredStylistEntityId?: string | null
  notes?: string
  branchId?: string // branch/location ID
  idempotencyKey?: string // optional
}

export async function createDraftAppointment(input: DraftInput): Promise<{ id: string }> {
  const {
    organizationId,
    startAt,
    durationMin,
    customerEntityId,
    preferredStylistEntityId,
    notes,
    branchId,
    idempotencyKey
  } = input

  // Validate required fields
  if (!organizationId) throw new Error('Organization ID is required')
  if (!startAt) throw new Error('Start time is required')
  if (!durationMin || durationMin <= 0) throw new Error('Duration must be positive')
  if (!customerEntityId) throw new Error('Customer entity ID is required')

  // Calculate end time
  const startDate = new Date(startAt)
  const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000)

  // Generate transaction code
  const transactionCode = `APT-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Date.now().toString().slice(-6)}`

  // Create appointment transaction
  const appointmentData = {
    organization_id: organizationId,
    transaction_type: 'APPOINTMENT',
    transaction_code: transactionCode,
    transaction_date: startDate.toISOString(),
    source_entity_id: customerEntityId,
    target_entity_id: preferredStylistEntityId || null,
    total_amount: 0, // Will be calculated from services
    smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.HEADER.V1',
    metadata: {
      status: 'DRAFT',
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      duration_minutes: durationMin,
      notes: notes || null,
      branch_id: branchId || null,
      idempotency_key: idempotencyKey || null,
      created_via: 'POS_MODAL',
      created_at: new Date().toISOString()
    }
  }

  const { data, error } = await supabase
    .from('universal_transactions')
    .insert(appointmentData)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating draft appointment:', error)
    throw new Error(`Failed to create appointment: ${error.message}`)
  }

  if (!data) {
    throw new Error('No data returned from appointment creation')
  }

  return { id: data.id as string }
}
