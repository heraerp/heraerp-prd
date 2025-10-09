/**
 * Dynamic Data Batch API v2
 * Handles bulk dynamic field operations
 *
 * POST /api/v2/dynamic-data/batch - Set multiple dynamic fields at once
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'
import { verifyAuth } from '@/lib/auth/verify-auth'

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId } = authResult
    const body = await request.json()

    const { p_entity_id, p_smart_code, p_fields } = body

    if (!p_entity_id || !p_smart_code || !Array.isArray(p_fields)) {
      return NextResponse.json(
        { error: 'entity_id, smart_code, and fields array required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseService()

    console.log('[dynamic-data batch] Processing:', {
      organizationId,
      entity_id: p_entity_id,
      smart_code: p_smart_code,
      fieldCount: p_fields.length,
      fields: p_fields
    })

    const results = []
    const errors = []

    for (const field of p_fields) {
      const { field_name, field_type, field_value, field_value_number, field_value_boolean } =
        field

      if (!field_name || !field_type) {
        console.warn('[dynamic-data batch] Skipping invalid field:', field)
        continue
      }

      console.log('[dynamic-data batch] Processing field:', field_name, {
        field_type,
        field_value_boolean,
        organizationId,
        entity_id: p_entity_id
      })

      // Check if field exists
      const { data: existing } = await supabase
        .from('core_dynamic_data')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('entity_id', p_entity_id)
        .eq('field_name', field_name)
        .single()

      console.log('[dynamic-data batch] Field exists:', !!existing, existing?.id)

      const fieldData: any = {
        organization_id: organizationId,
        entity_id: p_entity_id,
        field_name: field_name,
        field_type: field_type,
        // Use field's smart_code if provided, otherwise use batch smart_code
        smart_code: field.smart_code || p_smart_code
      }

      console.log('[dynamic-data batch] Field data before type-specific values:', {
        ...fieldData,
        field_smart_code: field.smart_code,
        batch_smart_code: p_smart_code,
        using: fieldData.smart_code
      })

      // Set appropriate value based on type
      if (field_type === 'text') {
        fieldData.field_value_text = field_value || field.field_value_text || null
      } else if (field_type === 'number') {
        fieldData.field_value_number = field_value_number ?? field.field_value_number ?? null
      } else if (field_type === 'boolean') {
        fieldData.field_value_boolean = field_value_boolean ?? field.field_value_boolean ?? null
      } else if (field_type === 'json') {
        fieldData.field_value_json = field.field_value_json || null
      } else if (field_type === 'date') {
        fieldData.field_value_date = field.field_value_date || null
      }

      try {
        if (existing) {
          // Update existing
          console.log('[dynamic-data batch] Updating existing field:', field_name)
          const { data, error } = await supabase
            .from('core_dynamic_data')
            .update(fieldData)
            .eq('id', existing.id)
            .select()
            .single()

          if (error) {
            console.error('[dynamic-data batch] Update error for field:', field_name, {
              error,
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint
            })
            errors.push({
              field_name,
              operation: 'update',
              error: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint
            })
          } else {
            console.log('[dynamic-data batch] Updated field:', field_name, '=', fieldData.field_value_boolean)
            results.push(data)
          }
        } else {
          // Insert new
          console.log('[dynamic-data batch] Inserting new field:', field_name)
          const { data, error } = await supabase
            .from('core_dynamic_data')
            .insert(fieldData)
            .select()
            .single()

          if (error) {
            console.error('[dynamic-data batch] Insert error for field:', field_name, {
              error,
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint
            })
            errors.push({
              field_name,
              operation: 'insert',
              error: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint
            })
          } else {
            console.log('[dynamic-data batch] Inserted field:', field_name, '=', fieldData.field_value_boolean)
            results.push(data)
          }
        }
      } catch (fieldError: any) {
        console.error('[dynamic-data batch] Field processing error:', fieldError)
        errors.push({ field_name, operation: 'process', error: fieldError.message })
      }
    }

    console.log('[dynamic-data batch] Completed:', {
      requested: p_fields.length,
      processed: results.length,
      errors: errors.length
    })

    return NextResponse.json({
      success: errors.length === 0,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
      metadata: {
        requested: p_fields.length,
        processed: results.length,
        failed: errors.length
      }
    })
  } catch (error: any) {
    console.error('[dynamic-data batch] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
