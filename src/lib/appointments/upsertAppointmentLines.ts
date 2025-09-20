// ================================================================================
// UPSERT APPOINTMENT LINES
// Smart Code: HERA.LIB.APPOINTMENT.UPSERT.LINES.V1
// Creates or updates appointment line items with smart codes
// ================================================================================

import { supabase } from '@/lib/supabase'

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

  // Validate required fields
  if (!organizationId) throw new Error('Organization ID is required')
  if (!appointmentId) throw new Error('Appointment ID is required')
  if (!items || items.length === 0) throw new Error('At least one item is required')

  // Delete existing lines for this appointment (to handle updates)
  const { error: deleteError } = await supabase
    .from('universal_transaction_lines')
    .delete()
    .eq('transaction_id', appointmentId)
    .eq('organization_id', organizationId)

  if (deleteError) {
    console.error('Error deleting existing lines:', deleteError)
    throw new Error(`Failed to clear existing lines: ${deleteError.message}`)
  }

  // Prepare line items
  const lines = items.map((item, index) => ({
    organization_id: organizationId,
    transaction_id: appointmentId,
    line_number: index + 1,
    entity_id: item.entityId,
    line_type: item.type,
    description: `${item.type} - Line ${index + 1}`,
    quantity: item.qty,
    unit_amount: item.unitAmount,
    line_amount: item.qty * item.unitAmount,
    discount_amount: 0,
    tax_amount: 0,
    smart_code: item.type === 'SERVICE' 
      ? 'HERA.SALON.APPOINTMENT.LINE.SERVICE.V1'
      : 'HERA.SALON.APPOINTMENT.LINE.PRODUCT.V1',
    line_data: {
      item_type: item.type,
      duration_minutes: item.durationMin || null,
      created_at: new Date().toISOString()
    }
  }))

  // Insert new lines
  const { error: insertError } = await supabase
    .from('universal_transaction_lines')
    .insert(lines)

  if (insertError) {
    console.error('Error inserting appointment lines:', insertError)
    throw new Error(`Failed to create appointment lines: ${insertError.message}`)
  }

  // Update appointment total amount
  const totalAmount = lines.reduce((sum, line) => sum + line.line_amount, 0)
  const totalDuration = items
    .filter(item => item.type === 'SERVICE' && item.durationMin)
    .reduce((sum, item) => sum + (item.durationMin || 0), 0)

  // First get current metadata
  const { data: currentData } = await supabase
    .from('universal_transactions')
    .select('metadata')
    .eq('id', appointmentId)
    .eq('organization_id', organizationId)
    .single()

  const currentMetadata = currentData?.metadata || {}
  const updatedMetadata = {
    ...(typeof currentMetadata === 'object' ? currentMetadata : {}),
    total_service_duration_minutes: totalDuration,
    line_items_count: items.length,
    updated_at: new Date().toISOString()
  }

  const { error: updateError } = await supabase
    .from('universal_transactions')
    .update({ 
      total_amount: totalAmount,
      metadata: updatedMetadata
    })
    .eq('id', appointmentId)
    .eq('organization_id', organizationId)

  if (updateError) {
    console.error('Error updating appointment total:', updateError)
    throw new Error(`Failed to update appointment total: ${updateError.message}`)
  }
}