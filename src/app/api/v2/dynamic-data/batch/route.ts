/**
 * Dynamic Data Batch API v2
 * Handles bulk dynamic field operations using hera_dynamic_data_batch_v1 RPC
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

    // ✅ FIX: verifyAuth returns 'id' not 'userId'
    const { organizationId, id: userId } = authResult

    // ✅ HERA v2.2: Actor stamping required for all writes
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required for actor stamping', code: 'ACTOR_REQUIRED' },
        { status: 401 }
      )
    }

    const body = await request.json()

    let { p_entity_id, p_smart_code, p_fields } = body

    // ✅ FIX: Extract entity_id if it's an object (defensive coding)
    if (p_entity_id && typeof p_entity_id === 'object') {
      console.warn('[dynamic-data batch] Received entity object instead of ID, extracting ID:', {
        received: typeof p_entity_id,
        hasId: !!p_entity_id.id,
        hasEntityId: !!p_entity_id.entity_id
      })
      p_entity_id = p_entity_id.id || p_entity_id.entity_id
    }

    if (!p_entity_id || !p_smart_code || !Array.isArray(p_fields)) {
      return NextResponse.json(
        { error: 'entity_id, smart_code, and fields array required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseService()

    console.log('[dynamic-data batch V2 RPC] Processing:', {
      organizationId,
      userId,
      entity_id: p_entity_id,
      smart_code: p_smart_code,
      fieldCount: p_fields.length,
      fields: p_fields
    })

    // ✅ Transform fields to hera_dynamic_data_batch_v1 format
    // The RPC expects TYPED columns: field_value_text, field_value_number, field_value_boolean, etc.
    const transformedFields = p_fields.map(field => {
      const item: any = {
        field_name: field.field_name,
        field_type: field.field_type,
        smart_code: field.smart_code || p_smart_code
      }

      // Set the appropriate TYPED column based on field type
      // RPC reads from field_value_text, field_value_number, etc. (NOT a generic "value" field)
      if (field.field_type === 'number') {
        item.field_value_number = field.field_value_number ?? 0
      } else if (field.field_type === 'text') {
        item.field_value_text = field.field_value_text ?? ''
      } else if (field.field_type === 'boolean') {
        item.field_value_boolean = field.field_value_boolean ?? false
      } else if (field.field_type === 'json') {
        item.field_value_json = field.field_value_json ?? null
      } else if (field.field_type === 'date') {
        item.field_value_date = field.field_value_date ?? null
      }

      return item
    })

    // ✅ Use hera_dynamic_data_batch_v1 for batch dynamic field updates
    // NOTE: Function expects p_items not p_fields (as shown in error hint)
    console.log('[dynamic-data batch V2 RPC] Calling hera_dynamic_data_batch_v1 with transformed fields:', transformedFields)

    const { data, error } = await supabase.rpc('hera_dynamic_data_batch_v1', {
      p_organization_id: organizationId,
      p_entity_id: p_entity_id,
      p_items: transformedFields, // ✅ FIX: Use p_items not p_fields
      p_actor_user_id: userId
    })

    if (error) {
      console.error('[dynamic-data batch V2 RPC] RPC error:', error)
      return NextResponse.json(
        {
          error: error.message || 'Failed to update dynamic fields',
          code: error.code,
          details: error.details,
          hint: error.hint
        },
        { status: 500 }
      )
    }

    console.log('[dynamic-data batch V2 RPC] Success:', {
      requested: p_fields.length,
      entity_id: p_entity_id
    })

    return NextResponse.json({
      success: true,
      data: data,
      metadata: {
        requested: p_fields.length,
        processed: p_fields.length,
        failed: 0,
        entity_id: p_entity_id
      }
    })
  } catch (error: any) {
    console.error('[dynamic-data batch V2 RPC] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
