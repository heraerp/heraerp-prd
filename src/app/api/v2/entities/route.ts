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
  dynamic_fields: z.record(z.object({
    value: z.any(),
    type: z.enum(['text', 'number', 'boolean', 'date', 'json']),
    smart_code: z.string()
  })).optional()
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
        
        const { error: dynamicError } = await supabase
          .from('core_dynamic_data')
          .insert(dynamicData)
        
        if (dynamicError) {
          console.error(`Warning: Failed to set field ${fieldName}:`, dynamicError)
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        entity_id: entityId,
        ...entityResult.data,
        dynamic_fields: data.dynamic_fields
      }
    }, { status: 201 })
    
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
    
    // Use HERA read function
    const { data: result, error } = await supabase.rpc('hera_entity_read_v1', {
      p_organization_id: organizationId,
      p_entity_id: entity_id,
      p_entity_type: entity_type,
      p_status: status === 'all' ? null : status,
      p_include_relationships: false,
      p_include_dynamic_data: include_dynamic,
      p_limit: limit,
      p_offset: offset
    })
    
    if (error) {
      console.error('Failed to fetch entities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch entities', details: error.message },
        { status: 500 }
      )
    }
    
    // Transform result
    const entities = result.entities || []
    
    return NextResponse.json({
      success: true,
      data: entities,
      pagination: {
        total: result.total_count || entities.length,
        limit: limit,
        offset: offset
      }
    })
    
  } catch (error) {
    console.error('Universal entity read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    
    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { organizationId } = authResult
    const body = await request.json()
    const data = updateSchema.parse(body)
    
    const supabase = getSupabaseService()
    
    // Update entity if core fields changed
    if (data.entity_name || data.entity_code || data.metadata) {
      const { error: entityError } = await supabase.rpc('hera_entity_upsert_v1', {
        p_org_id: organizationId,
        p_entity_id: data.entity_id,
        p_entity_type: data.entity_type,
        p_entity_name: data.entity_name,
        p_smart_code: data.smart_code,
        p_entity_code: data.entity_code,
        p_metadata: data.metadata
      })
      
      if (entityError) {
        console.error('Entity update failed:', entityError)
        return NextResponse.json(
          { error: 'Failed to update entity', details: entityError.message },
          { status: 500 }
        )
      }
    }
    
    // Update dynamic fields
    if (data.dynamic_fields) {
      for (const [fieldName, fieldConfig] of Object.entries(data.dynamic_fields)) {
        const params: any = {
          p_organization_id: organizationId,
          p_entity_id: data.entity_id,
          p_field_name: fieldName,
          p_field_type: fieldConfig.type,
          p_smart_code: fieldConfig.smart_code
        }
        
        // Set value based on type
        switch (fieldConfig.type) {
          case 'text':
            params.p_field_value_text = fieldConfig.value
            break
          case 'number':
            params.p_field_value_number = fieldConfig.value
            break
          case 'boolean':
            params.p_field_value_boolean = fieldConfig.value
            break
          case 'date':
            params.p_field_value_date = fieldConfig.value
            break
          case 'json':
            params.p_field_value_json = fieldConfig.value
            break
        }
        
        await supabase.rpc('hera_dynamic_data_set_v1', params)
      }
    }
    
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