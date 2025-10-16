/**
 * Universal Entity API v2 - One API to rule them all!
 * Handles CRUD for ANY entity type with dynamic data
 *
 * POST   /api/v2/entities - Create any entity (product, service, customer, etc.)
 * GET    /api/v2/entities - Read entities with filters
 * PUT    /api/v2/entities - Update entity
 * DELETE /api/v2/entities/[id] - Delete entity
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseService } from '@/lib/supabase-service'
import { verifyAuth, buildActorContext } from '@/lib/auth/verify-auth'
import { assertSmartCode } from '@/lib/universal/smartcode'

// Universal entity schema - works for ANY entity type
const entitySchema = z.object({
  // Core entity fields
  entity_type: z.string(),
  entity_name: z.string(),
  entity_code: z.string().optional(),
  entity_description: z.string().optional().nullable(),
  smart_code: z.string(),
  parent_entity_id: z.string().uuid().optional().nullable(),
  status: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional(),

  // ✅ ENTERPRISE AUDIT TRAIL: Accept created_by for tracking entity creation
  created_by: z.string().uuid().optional(),

  // Dynamic fields - can be anything!
  dynamic_fields: z
    .record(
      z.object({
        value: z.any(),
        type: z.enum(['text', 'number', 'boolean', 'date', 'json']),
        smart_code: z.string()
      })
    )
    .optional()
})

// Update schema
const updateSchema = entitySchema.partial().extend({
  entity_id: z.string().uuid(),
  // ✅ ENTERPRISE AUDIT TRAIL: Accept updated_by for tracking entity updates
  updated_by: z.string().uuid().optional()
})

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.organizationId || !authResult.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId, id: userId, email } = authResult
    const body = await request.json()
    const data = entitySchema.parse(body)

    // Validate and normalize smart code
    const smart_code = assertSmartCode(data.smart_code)
    data.smart_code = smart_code

    const supabase = getSupabaseService()

    // ✅ HERA v2.2 ACTOR STAMPING: Build actor context
    const actor = await buildActorContext(supabase, userId, organizationId)
    
    // Step 1: Create entity using HERA v2.2 RPC with actor stamping
    const entityPayload = {
      organization_id: organizationId,
      entity_type: data.entity_type,
      entity_name: data.entity_name,
      smart_code: data.smart_code,
      entity_code: data.entity_code || `${data.entity_type.toUpperCase()}-${Date.now()}`,
      metadata: data.metadata || {},
      entity_description: data.entity_description,
      parent_entity_id: data.parent_entity_id
    }

    const { data: entityResult, error: entityError } = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: actor.actor_user_id,
      p_dynamic: data.dynamic_fields || {},
      p_entity: entityPayload,
      p_options: {},
      p_organization_id: organizationId,
      p_relationships: []
    })

    if (entityError || !entityResult?.items?.[0]) {
      console.error('Entity creation failed:', entityError || entityResult)
      return NextResponse.json(
        { error: 'Failed to create entity', details: entityError?.message || 'No entity returned' },
        { status: 500 }
      )
    }

    const entityId = entityResult.items[0].id

    // Step 2: Add dynamic fields if provided using batch operation
    if (data.dynamic_fields) {
      const dynamicFields = Object.entries(data.dynamic_fields).map(([fieldName, fieldConfig]) => ({
        entity_id: entityId,
        field_name: fieldName,
        field_type: fieldConfig.type,
        field_value_text: fieldConfig.type === 'text' ? fieldConfig.value : null,
        field_value_number: fieldConfig.type === 'number' ? fieldConfig.value : null,
        field_value_boolean: fieldConfig.type === 'boolean' ? fieldConfig.value : null,
        field_value_date: fieldConfig.type === 'date' ? fieldConfig.value : null,
        field_value_json: fieldConfig.type === 'json' ? fieldConfig.value : null,
        smart_code: fieldConfig.smart_code
      }))

      // Use batch RPC for dynamic data (when available)
      const { error: dynamicError } = await supabase.rpc('hera_dynamic_data_batch_v1', {
        p_organization_id: organizationId,
        p_entity_id: entityId,
        p_fields: dynamicFields
      })

      if (dynamicError) {
        console.error('Warning: Failed to set dynamic fields:', dynamicError)
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: entityId,
          entity_id: entityId,
          ...entityResult,
          dynamic_fields: data.dynamic_fields
        },
        actor_stamped: true, // ✅ Indicates actor stamping was applied
        actor_user_id: actor.actor_user_id
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Universal entity create error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid entity data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId } = authResult
    const { searchParams } = new URL(request.url)

    // Extract query parameters - support both p_ prefixed and non-prefixed
    const entity_type = searchParams.get('p_entity_type') || searchParams.get('entity_type')
    const entity_id = searchParams.get('p_entity_id') || searchParams.get('entity_id')
    const statusParam = searchParams.get('p_status') || searchParams.get('status')
    const status = !statusParam || statusParam === '' || statusParam === 'null' ? null : statusParam
    const limit = parseInt(searchParams.get('p_limit') || searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('p_offset') || searchParams.get('offset') || '0')
    const include_dynamic =
      searchParams.get('p_include_dynamic') !== 'false' &&
      searchParams.get('include_dynamic') !== 'false'
    const include_relationships =
      searchParams.get('p_include_relationships') !== 'false' &&
      searchParams.get('include_relationships') !== 'false'

    const supabase = getSupabaseService()

    console.log('🔍 [GET entities] Params:', {
      organizationId,
      entity_type,
      entity_id,
      status,
      include_dynamic,
      include_relationships,
      limit,
      offset
    })

    console.log('📡 [GET entities] Calling RPC with:', {
      p_organization_id: organizationId,
      p_entity_id: entity_id || null,
      p_entity_type: entity_type || null,
      p_status: status,
      p_include_relationships: include_relationships,
      p_include_dynamic_data: include_dynamic,
      p_limit: limit,
      p_offset: offset
    })

    // Call HERA RPC function v1
    const { data: result, error: rpcError } = await supabase.rpc('hera_entity_read_v1', {
      p_organization_id: organizationId,
      p_entity_id: entity_id || null,
      p_entity_type: entity_type || null,
      p_status: status,
      p_include_relationships: include_relationships,
      p_include_dynamic_data: include_dynamic,
      p_limit: limit,
      p_offset: offset
    })

    if (rpcError) {
      console.error('❌ [GET entities] RPC error:', rpcError)
      return NextResponse.json(
        { error: 'Failed to fetch entities via RPC', details: rpcError.message },
        { status: 500 }
      )
    }

    console.log('✅ [GET entities] RPC success:', {
      hasResult: !!result,
      isSuccess: result?.success,
      dataCount: result?.data?.length || 0,
      firstItemHasRelationships: result?.data?.[0] ? !!result.data[0].relationships : false,
      firstItemSample: result?.data?.[0] || null
    })

    // Handle RPC response
    if (result && result.success) {
      return NextResponse.json({
        success: true,
        data: result.data || [],
        pagination: {
          total: result.metadata?.total || result.data?.length || 0,
          limit,
          offset
        }
      })
    }

    // RPC returned but no success flag
    console.warn('⚠️ [GET entities] RPC returned unexpected format:', result)
    return NextResponse.json({
      success: true,
      data: [],
      pagination: { total: 0, limit, offset }
    })
  } catch (error: any) {
    console.error('❌ [GET entities] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.organizationId || !authResult.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId, id: userId } = authResult
    const body = await request.json()
    const data = updateSchema.parse(body)

    console.log('🔄 Updating entity:', {
      entityId: data.entity_id,
      organizationId,
      updates: Object.keys(data),
      dynamicFields: data.dynamic_fields ? Object.keys(data.dynamic_fields) : []
    })

    const supabase = getSupabaseService()

    // ✅ HERA v2.2 ACTOR STAMPING: Build actor context  
    const actor = await buildActorContext(supabase, userId, organizationId)

    // Update entity core fields using RPC with actor stamping
    if (
      data.entity_name ||
      data.entity_code ||
      data.entity_description ||
      data.parent_entity_id ||
      data.status ||
      data.metadata ||
      data.smart_code
    ) {
      const updatePayload: any = {
        entity_id: data.entity_id,
        organization_id: organizationId
      }

      if (data.entity_name) updatePayload.entity_name = data.entity_name
      if (data.entity_code) updatePayload.entity_code = data.entity_code
      if (data.entity_description !== undefined) updatePayload.entity_description = data.entity_description
      if (data.parent_entity_id !== undefined) updatePayload.parent_entity_id = data.parent_entity_id
      if (data.status !== undefined) updatePayload.status = data.status
      if (data.metadata) updatePayload.metadata = data.metadata
      if (data.smart_code) updatePayload.smart_code = data.smart_code

      console.log('📝 Updating core entity fields via RPC v2:', updatePayload)

      const { data: updateResult, error: entityError } = await supabase.rpc('hera_entities_crud_v2', {
        p_operation: 'UPDATE',
        p_payload: updatePayload,
        p_actor_user_id: actor.actor_user_id
      })

      if (entityError || !updateResult?.success) {
        console.error('Entity update failed:', entityError || updateResult)
        return NextResponse.json(
          { error: 'Failed to update entity', details: entityError?.message || updateResult?.error },
          { status: 500 }
        )
      }
    }

    // Update dynamic fields using direct database operations
    if (data.dynamic_fields) {
      console.log('🔧 Updating dynamic fields:', Object.keys(data.dynamic_fields))

      for (const [fieldName, fieldConfig] of Object.entries(data.dynamic_fields)) {
        const dynamicData: any = {
          organization_id: organizationId,
          entity_id: data.entity_id,
          field_name: fieldName,
          field_type: fieldConfig.type,
          smart_code: fieldConfig.smart_code,
          // ✅ ENTERPRISE AUDIT TRAIL: Use provided updated_by or default to current user
          updated_by: data.updated_by || userId,
          updated_at: new Date().toISOString()
        }

        // Set the appropriate value field based on type
        switch (fieldConfig.type) {
          case 'text':
            dynamicData.field_value_text = fieldConfig.value
            break
          case 'number':
            dynamicData.field_value_number = fieldConfig.value
            break
          case 'boolean':
            dynamicData.field_value_boolean = fieldConfig.value
            break
          case 'date':
            dynamicData.field_value_date = fieldConfig.value
            break
          case 'json':
            dynamicData.field_value_json = fieldConfig.value
            break
        }

        console.log(`🔧 Upserting dynamic field ${fieldName}:`, {
          type: fieldConfig.type,
          value: fieldConfig.value
        })

        // Use upsert to create or update dynamic field
        const { error: dynamicError } = await supabase
          .from('core_dynamic_data')
          .upsert(dynamicData, {
            onConflict: 'organization_id,entity_id,field_name'
          })

        if (dynamicError) {
          console.error(`Failed to update dynamic field ${fieldName}:`, dynamicError)
          // Continue with other fields instead of failing completely
        }
      }
    }

    console.log('✅ Entity update completed successfully with actor stamping')

    return NextResponse.json({
      success: true,
      message: 'Entity updated successfully',
      actor_stamped: true, // ✅ Indicates actor stamping was applied
      actor_user_id: actor.actor_user_id
    })
  } catch (error) {
    console.error('Universal entity update error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid update data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
