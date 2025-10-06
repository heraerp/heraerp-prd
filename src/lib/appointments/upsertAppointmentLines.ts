// ================================================================================
// UPSERT APPOINTMENT LINES - HERA Universal API Pattern
// Smart Code: HERA.LIB.APPOINTMENT.UPSERT.LINES.V1
// Uses Universal API v2 with proper RPC calls
// ================================================================================

import { setDynamicDataBatch } from '@/lib/universal-api-v2-client'

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

export async function upsertAppointmentLines(input: LineInput): Promise<void> {
  const { organizationId, appointmentId, items } = input

  // Extract ID if appointmentId is an object
  const entityId = typeof appointmentId === 'string'
    ? appointmentId
    : (appointmentId as any).id || (appointmentId as any).entity_id

  // Validate required fields
  if (!organizationId) throw new Error('Organization ID is required')
  if (!entityId) throw new Error('Appointment ID is required')
  if (!items || items.length === 0) throw new Error('At least one item is required')

  // Calculate totals
  const totalAmount = items.reduce((sum, item) => sum + item.qty * item.unitAmount, 0)
  const serviceIds = items.filter(item => item.type === 'SERVICE').map(item => item.entityId)

  console.log('[upsertAppointmentLines] Updating appointment:', {
    entityId,
    serviceCount: serviceIds.length,
    totalAmount
  })

  // Prepare dynamic data updates
  const dynamicFields = [
    {
      field_name: 'service_ids',
      field_type: 'json' as const,
      field_value_json: serviceIds
    },
    {
      field_name: 'price',
      field_type: 'number' as const,
      field_value_number: totalAmount
    }
  ]

  // Update dynamic data using batch API
  await setDynamicDataBatch('', {
    p_organization_id: organizationId,
    p_entity_id: entityId,
    p_smart_code: 'HERA.SALON.APPOINTMENT.DYN.UPDATE.V1',
    p_fields: dynamicFields
  })

  console.log('✅ Updated appointment with services and price:', {
    entityId,
    serviceCount: serviceIds.length,
    totalAmount
  })
}
