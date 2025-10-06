// ================================================================================
// CREATE DRAFT APPOINTMENT - HERA Universal API Pattern
// Smart Code: HERA.LIB.APPOINTMENT.CREATE.DRAFT.V1
// Uses Universal API v2 with proper RPC calls
// ================================================================================

import { upsertEntity, setDynamicDataBatch } from '@/lib/universal-api-v2-client'

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

  // Format appointment name: "Appointment - Date"
  const appointmentName = `Appointment - ${startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })}`

  // Generate appointment code
  const appointmentCode = `APT-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Date.now().toString().slice(-6)}`

  console.log('[createDraftAppointment] Creating appointment entity:', {
    name: appointmentName,
    code: appointmentCode,
    organizationId
  })

  // Step 1: Create appointment entity using Universal API
  const entityResult = await upsertEntity('', {
    p_organization_id: organizationId,
    p_entity_type: 'appointment',
    p_entity_name: appointmentName,
    p_entity_code: appointmentCode,
    p_smart_code: 'HERA.SALON.APPOINTMENT.ENTITY.BOOKING.V1',
    p_status: 'booked'
  })

  if (!entityResult || !entityResult.data) {
    throw new Error('Failed to create appointment entity')
  }

  // Extract the ID from the entity result - it could be entityResult.data.id or entityResult.data itself if it's a UUID
  const appointmentId = typeof entityResult.data === 'string'
    ? entityResult.data
    : entityResult.data.id || entityResult.data.entity_id

  console.log('[createDraftAppointment] Entity created:', {
    appointmentId,
    fullResult: entityResult.data
  })

  // Step 2: Add dynamic data fields for appointment details
  // ENTERPRISE PATTERN: Normalized data - store only IDs, not names
  // Names will be fetched separately from customer/staff entities
  const dynamicFields = [
    {
      field_name: 'customer_id',
      field_type: 'text' as const,
      field_value: customerEntityId
    },
    {
      field_name: 'stylist_id',
      field_type: 'text' as const,
      field_value: preferredStylistEntityId || ''
    },
    {
      field_name: 'start_time',
      field_type: 'text' as const,
      field_value: startDate.toISOString()
    },
    {
      field_name: 'end_time',
      field_type: 'text' as const,
      field_value: endDate.toISOString()
    },
    {
      field_name: 'duration_minutes',
      field_type: 'number' as const,
      field_value_number: durationMin
    },
    {
      field_name: 'currency_code',
      field_type: 'text' as const,
      field_value: 'AED'
    },
    {
      field_name: 'price',
      field_type: 'number' as const,
      field_value_number: 0
    }
  ]

  // Add optional fields
  if (notes) {
    dynamicFields.push({
      field_name: 'notes',
      field_type: 'text' as const,
      field_value: notes
    })
  }

  if (branchId) {
    dynamicFields.push({
      field_name: 'branch_id',
      field_type: 'text' as const,
      field_value: branchId
    })
  }

  console.log('[createDraftAppointment] Adding dynamic fields:', dynamicFields.length)

  // Insert all dynamic fields using batch API
  try {
    console.log('[createDraftAppointment] Calling setDynamicDataBatch with:', {
      p_organization_id: organizationId,
      p_entity_id: appointmentId,
      p_smart_code: 'HERA.SALON.APPOINTMENT.DYN.BATCH.V1',
      p_fields: dynamicFields
    })

    const batchResult = await setDynamicDataBatch('', {
      p_organization_id: organizationId,
      p_entity_id: appointmentId,
      p_smart_code: 'HERA.SALON.APPOINTMENT.DYN.BATCH.V1',
      p_fields: dynamicFields
    })

    console.log('✅ Created appointment with dynamic data:', {
      appointmentId,
      batchResult
    })
  } catch (error) {
    console.error('❌ Error adding dynamic fields:', error)
    // Don't fail the whole operation if dynamic fields fail
    throw error // Re-throw so we can see the error in the UI
  }

  return { id: appointmentId }
}
