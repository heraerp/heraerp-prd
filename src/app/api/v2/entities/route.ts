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
import { verifyAuth } from '@/lib/auth/verify-auth'
import { assertSmartCode } from '@/lib/universal/smartcode'

// Universal entity schema - works for ANY entity type
const entitySchema = z.object({
  // Core entity fields
  entity_type: z.string(),
  entity_name: z.string(),
  entity_code: z.string().optional(),
  smart_code: z.string(),
  metadata: z.record(z.any()).optional(),

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
  entity_id: z.string().uuid()
})

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.organizationId || !authResult.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId, id: userId } = authResult
    const body = await request.json()
    const data = entitySchema.parse(body)

    // Validate and normalize smart code
    const smart_code = assertSmartCode(data.smart_code)
    data.smart_code = smart_code

    const supabase = getSupabaseService()

    // Step 1: Create entity using direct database insert
    const entityData = {
      organization_id: organizationId,
      entity_type: data.entity_type,
      entity_name: data.entity_name,
      smart_code: data.smart_code,
      entity_code: data.entity_code || `${data.entity_type.toUpperCase()}-${Date.now()}`,
      metadata: data.metadata || {},
      created_by: userId,
      updated_by: userId
    }

    const { data: entityResult, error: entityError } = await supabase
      .from('core_entities')
      .insert(entityData)
      .select()
      .single()

    if (entityError || !entityResult) {
      console.error('Entity creation failed:', entityError)
      return NextResponse.json(
        { error: 'Failed to create entity', details: entityError?.message },
        { status: 500 }
      )
    }

    const entityId = entityResult.id

    // Step 2: Add dynamic fields if provided
    if (data.dynamic_fields) {
      for (const [fieldName, fieldConfig] of Object.entries(data.dynamic_fields)) {
        const dynamicData: any = {
          organization_id: organizationId,
          entity_id: entityId,
          field_name: fieldName,
          field_type: fieldConfig.type,
          smart_code: fieldConfig.smart_code,
          created_by: userId,
          updated_by: userId
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

        const { error: dynamicError } = await supabase.from('core_dynamic_data').insert(dynamicData)

        if (dynamicError) {
          console.error(`Warning: Failed to set field ${fieldName}:`, dynamicError)
        }
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
        }
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

    // Extract query parameters
    const entity_type = searchParams.get('entity_type')
    const entity_id = searchParams.get('entity_id')
    const status = searchParams.get('status') || 'active'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const include_dynamic = searchParams.get('include_dynamic') !== 'false'

    const supabase = getSupabaseService()

    console.log('🔍 Fetching entities with params:', {
      organizationId,
      entity_type,
      entity_id,
      status,
      include_dynamic,
      limit,
      offset
    })

    console.log('🔍 Auth result details:', {
      authUser: authResult,
      requestOrigin: request.headers.get('origin'),
      userAgent: request.headers.get('user-agent')?.substring(0, 50)
    })

    // Try HERA read function v2 first
    const { data: result, error } = await supabase.rpc('hera_entity_read_v2', {
      p_organization_id: organizationId,
      p_entity_id: entity_id,
      p_entity_type: entity_type,
      p_status: status,
      p_include_relationships: false,
      p_include_dynamic_data: include_dynamic,
      p_limit: limit,
      p_offset: offset
    })

    if (error) {
      console.error('RPC function failed, falling back to direct query:', error)

      // Fallback to direct table query
      console.log('🔄 Using fallback direct query with organizationId:', organizationId)

      let query = supabase.from('core_entities').select('*').eq('organization_id', organizationId)

      if (entity_type) {
        console.log('🎯 Filtering by entity_type:', entity_type)
        query = query.eq('entity_type', entity_type)
      }

      if (entity_id) {
        console.log('🎯 Filtering by entity_id:', entity_id)
        query = query.eq('id', entity_id)
      }

      query = query.limit(limit).range(offset, offset + limit - 1)

      console.log('📋 Final query being executed')
      const { data: entities, error: directError } = await query

      console.log('📊 Direct query results:', {
        success: !directError,
        entityCount: entities?.length || 0,
        error: directError?.message,
        sampleEntity: entities?.[0]
      })

      if (directError) {
        console.error('Direct query also failed:', directError)
        return NextResponse.json(
          { error: 'Failed to fetch entities', details: directError.message },
          { status: 500 }
        )
      }

      console.log('✅ Direct query succeeded, found entities:', entities?.length)

      // If include_dynamic is true, fetch dynamic fields for each entity
      if (include_dynamic && entities && entities.length > 0) {
        console.log('🔄 Fetching dynamic fields for entities')

        const entityIds = entities.map(e => e.id)
        const { data: dynamicData, error: dynamicError } = await supabase
          .from('core_dynamic_data')
          .select('*')
          .eq('organization_id', organizationId)
          .in('entity_id', entityIds)

        if (!dynamicError && dynamicData) {
          console.log('📋 Found dynamic fields:', dynamicData.length)

          // Group dynamic fields by entity_id
          const dynamicByEntity = new Map()
          for (const field of dynamicData) {
            if (!dynamicByEntity.has(field.entity_id)) {
              dynamicByEntity.set(field.entity_id, {})
            }

            const value =
              field.field_value_text ||
              field.field_value_number ||
              field.field_value_boolean ||
              field.field_value_date ||
              field.field_value_json

            dynamicByEntity.get(field.entity_id)[field.field_name] = {
              value: value,
              type: field.field_type,
              smart_code: field.smart_code
            }
          }

          // Merge dynamic fields into entities
          for (const entity of entities) {
            entity.dynamic_fields = dynamicByEntity.get(entity.id) || {}
          }

          console.log('🔗 Merged dynamic fields into entities')
        }
      }

      return NextResponse.json({
        success: true,
        data: entities || [],
        pagination: {
          total: entities?.length || 0,
          limit: limit,
          offset: offset
        }
      })
    }

    // Handle RPC v2 response format
    if (result && result.success) {
      return NextResponse.json({
        success: true,
        data: result.data || [],
        pagination: {
          total: result.metadata?.total || 0,
          limit: limit,
          offset: offset
        }
      })
    } else {
      // This shouldn't happen unless RPC failed
      console.error('Unexpected RPC response format:', result)
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: limit,
          offset: offset
        }
      })
    }
  } catch (error) {
    console.error('Universal entity read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    // Update entity core fields if provided
    if (data.entity_name || data.entity_code || data.metadata || data.smart_code) {
      const updateData: any = {
        updated_by: userId,
        updated_at: new Date().toISOString()
      }

      if (data.entity_name) updateData.entity_name = data.entity_name
      if (data.entity_code) updateData.entity_code = data.entity_code
      if (data.metadata) updateData.metadata = data.metadata
      if (data.smart_code) updateData.smart_code = data.smart_code

      console.log('📝 Updating core entity fields:', updateData)

      const { error: entityError } = await supabase
        .from('core_entities')
        .update(updateData)
        .eq('id', data.entity_id)
        .eq('organization_id', organizationId)

      if (entityError) {
        console.error('Entity update failed:', entityError)
        return NextResponse.json(
          { error: 'Failed to update entity', details: entityError.message },
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
          updated_by: userId,
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

    console.log('✅ Entity update completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Entity updated successfully'
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
