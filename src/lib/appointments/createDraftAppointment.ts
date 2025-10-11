// ================================================================================
// CREATE DRAFT APPOINTMENT - HERA Universal API Pattern
// Smart Code: HERA.LIB.APPOINTMENT.CREATE.DRAFT.V1
// Uses Universal API v2 with proper RPC calls
// IMPORTANT: Appointments are TRANSACTIONS (not entities)
// ================================================================================

import { createTransaction } from '@/lib/universal-api-v2-client'

export type DraftInput = {
  organizationId: string
  startAt: string // ISO
  durationMin: number
  customerEntityId: string
  preferredStylistEntityId?: string | null
  notes?: string
  branchId?: string // branch/location ID
  idempotencyKey?: string // optional
  status?: 'draft' | 'booked' // Status: draft = save, booked = create
  serviceLines?: Array<{
    entityId: string
    quantity: number
    unitAmount: number
    lineAmount: number
    description?: string
  }>
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
    idempotencyKey,
    status = 'booked', // Default to 'booked' if not specified
    serviceLines = []
  } = input

  // Validate required fields
  if (!organizationId) throw new Error('Organization ID is required')
  if (!startAt) throw new Error('Start time is required')
  if (!durationMin || durationMin <= 0) throw new Error('Duration must be positive')
  if (!customerEntityId) throw new Error('Customer entity ID is required')

  // Calculate end time
  const startDate = new Date(startAt)
  const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000)

  console.log('[createDraftAppointment] Creating appointment transaction:', {
    status,
    organizationId,
    customerEntityId,
    stylistEntityId: preferredStylistEntityId
  })

  // Calculate total amount from service lines
  const totalAmount = serviceLines.reduce((sum, line) => sum + line.lineAmount, 0)

  // ✅ CRITICAL FIX: Extract service IDs for metadata
  const serviceIds = serviceLines.map(line => line.entityId)

  // Step 1: Create appointment TRANSACTION using Universal API
  // Appointments are transactions, not entities!
  const transactionResult = await createTransaction(organizationId, {
    p_transaction_type: 'APPOINTMENT', // UPPERCASE
    p_smart_code:
      status === 'draft'
        ? 'HERA.SALON.APPOINTMENT.TXN.DRAFT.V1'
        : 'HERA.SALON.APPOINTMENT.TXN.BOOKED.V1',
    p_from_entity_id: customerEntityId, // Customer
    p_to_entity_id: preferredStylistEntityId || null, // Stylist
    p_transaction_date: startDate.toISOString(),
    p_total_amount: totalAmount,
    p_status: status, // ✅ Pass status to set transaction_status field
    p_metadata: {
      status,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      duration_minutes: durationMin,
      branch_id: branchId || null,
      notes: notes || null,
      service_ids: serviceIds // ✅ CRITICAL FIX: Store service IDs in metadata for modal display
    },
    // Pass service lines to transaction
    p_lines:
      serviceLines.length > 0
        ? serviceLines.map(line => ({
            line_type: 'service',
            entity_id: line.entityId,
            quantity: line.quantity,
            unit_amount: line.unitAmount,
            line_amount: line.lineAmount,
            description: line.description || null
          }))
        : undefined // Will use placeholder if undefined
  })

  if (!transactionResult || !transactionResult.data) {
    throw new Error('Failed to create appointment transaction')
  }

  // Extract the ID from the transaction result
  const appointmentId =
    typeof transactionResult.data === 'string'
      ? transactionResult.data
      : transactionResult.data.id || transactionResult.data.transaction_id

  console.log('[createDraftAppointment] Transaction created:', {
    appointmentId,
    status,
    fullResult: transactionResult.data
  })

  console.log('✅ Created appointment transaction:', {
    appointmentId,
    status,
    transactionType: 'APPOINTMENT'
  })

  return { id: appointmentId }
}
