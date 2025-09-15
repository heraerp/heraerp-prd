import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { HERAJWTService } from '@/lib/auth/jwt-service'

const jwtService = new HERAJWTService()

// Helper function to extract organization_id from JWT token
async function getOrganizationFromAuth(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Authentication required')
  }

  const token = authHeader.replace('Bearer ', '')
  const payload = await jwtService.verify(token)

  if (!payload.organization_id) {
    throw new Error('Organization context missing')
  }

  return payload.organization_id
}

// GET /api/v1/entities - Universal entity fetch
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const entity_type = searchParams.get('entity_type')
    const entity_id = searchParams.get('entity_id')
    const include_dynamic = searchParams.get('include_dynamic') !== 'false'

    // Get organization_id from JWT token
    const organizationId = await getOrganizationFromAuth(request)

    // Build query
    let query = supabaseAdmin
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    if (entity_type) {
      query = query.eq('entity_type', entity_type)
    }

    if (entity_id) {
      query = query.eq('id', entity_id)
    }

    query = query.order('created_at', { ascending: false })

    const { data: entities, error: entitiesError } = await query

    if (entitiesError) {
      console.error('Error fetching entities:', entitiesError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch entities' },
        { status: 500 }
      )
    }

    // If including dynamic data
    if (include_dynamic && entities && entities.length > 0) {
      const entityIds = entities.map(e => e.id)

      const { data: dynamicData, error: dynamicError } = await supabaseAdmin
        .from('core_dynamic_data')
        .select('entity_id, field_name, field_value, field_type')
        .in('entity_id', entityIds)

      if (!dynamicError && dynamicData) {
        // Merge dynamic data with entities
        const entitiesWithDynamic = entities.map(entity => {
          const entityDynamicData = dynamicData.filter(d => d.entity_id === entity.id)

          // Convert dynamic data to object
          const properties: Record<string, any> = {}
          entityDynamicData.forEach(data => {
            let value = data.field_value

            // Parse based on field type
            if (data.field_type === 'json') {
              try {
                value = JSON.parse(data.field_value)
              } catch (e) {
                console.warn(`Failed to parse JSON for ${data.field_name}:`, data.field_value)
              }
            } else if (data.field_type === 'number' || data.field_type === 'decimal') {
              value = parseFloat(data.field_value)
            } else if (data.field_type === 'integer') {
              value = parseInt(data.field_value, 10)
            } else if (data.field_type === 'boolean') {
              value = data.field_value === 'true'
            } else if (data.field_type === 'date') {
              value = new Date(data.field_value)
            }

            properties[data.field_name] = value
          })

          return {
            ...entity,
            properties
          }
        })

        return NextResponse.json({
          success: true,
          data: entity_id ? entitiesWithDynamic[0] : entitiesWithDynamic,
          count: entitiesWithDynamic.length
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: entity_id ? entities[0] : entities,
      count: entities?.length || 0
    })
  } catch (error) {
    console.error('Universal entities API error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ success: false, message: error.message }, { status: 401 })
    }
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/v1/entities - Universal entity creation
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const body = await request.json()

    // Get organization_id from JWT token
    const organizationId = await getOrganizationFromAuth(request)

    const {
      entity_type,
      entity_name,
      entity_code,
      entity_category,
      entity_subcategory,
      description,
      tags,
      status = 'active',
      properties = {}
    } = body

    // Create entity in core_entities
    const { data: entity, error: entityError } = await supabaseAdmin
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type,
        entity_name,
        entity_code,
        entity_category,
        entity_subcategory,
        description,
        tags,
        status
      })
      .select()
      .single()

    if (entityError) {
      console.error('Error creating entity:', entityError)
      return NextResponse.json(
        { success: false, message: 'Failed to create entity' },
        { status: 500 }
      )
    }

    // Create dynamic properties if provided
    if (Object.keys(properties).length > 0) {
      const dynamicDataInserts = Object.entries(properties).map(([key, value]) => {
        let field_type = 'text'
        let field_value = String(value)

        // Determine field type
        if (typeof value === 'boolean') {
          field_type = 'boolean'
        } else if (typeof value === 'number') {
          field_type = Number.isInteger(value) ? 'integer' : 'decimal'
        } else if (typeof value === 'object' && value !== null) {
          field_type = 'json'
          field_value = JSON.stringify(value)
        } else if (value instanceof Date) {
          field_type = 'datetime'
          field_value = value.toISOString()
        }

        return {
          entity_id: entity.id,
          organization_id: organizationId,
          field_name: key,
          field_value,
          field_type
        }
      })

      const { error: dynamicError } = await supabaseAdmin
        .from('core_dynamic_data')
        .insert(dynamicDataInserts)

      if (dynamicError) {
        console.error('Error creating dynamic data:', dynamicError)
        // Note: Entity is created, just dynamic data failed
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...entity,
        properties
      }
    })
  } catch (error) {
    console.error('Create entity error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/v1/entities - Universal entity update
export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const body = await request.json()

    // Get organization_id from JWT token
    const organizationId = await getOrganizationFromAuth(request)

    const {
      id,
      entity_name,
      entity_code,
      entity_category,
      entity_subcategory,
      description,
      tags,
      status,
      properties = {}
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Entity ID is required' },
        { status: 400 }
      )
    }

    // Update entity in core_entities
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only include fields that are provided
    if (entity_name !== undefined) updateData.entity_name = entity_name
    if (entity_code !== undefined) updateData.entity_code = entity_code
    if (entity_category !== undefined) updateData.entity_category = entity_category
    if (entity_subcategory !== undefined) updateData.entity_subcategory = entity_subcategory
    if (description !== undefined) updateData.description = description
    if (tags !== undefined) updateData.tags = tags
    if (status !== undefined) updateData.status = status

    const { error: entityError } = await supabaseAdmin
      .from('core_entities')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (entityError) {
      console.error('Error updating entity:', entityError)
      return NextResponse.json(
        { success: false, message: 'Failed to update entity' },
        { status: 500 }
      )
    }

    // Update dynamic properties if provided
    if (Object.keys(properties).length > 0) {
      for (const [key, value] of Object.entries(properties)) {
        let field_type = 'text'
        let field_value = String(value)

        // Determine field type
        if (typeof value === 'boolean') {
          field_type = 'boolean'
        } else if (typeof value === 'number') {
          field_type = Number.isInteger(value) ? 'integer' : 'decimal'
        } else if (typeof value === 'object' && value !== null) {
          field_type = 'json'
          field_value = JSON.stringify(value)
        } else if (value instanceof Date) {
          field_type = 'datetime'
          field_value = value.toISOString()
        }

        // Check if property exists first
        const { data: existingProp } = await supabaseAdmin
          .from('core_dynamic_data')
          .select('id')
          .eq('entity_id', id)
          .eq('organization_id', organizationId)
          .eq('field_name', key)
          .single()

        if (existingProp) {
          // Update existing property
          const { error: updateError } = await supabaseAdmin
            .from('core_dynamic_data')
            .update({
              field_value,
              field_type,
              updated_at: new Date().toISOString()
            })
            .eq('entity_id', id)
            .eq('organization_id', organizationId)
            .eq('field_name', key)

          if (updateError) {
            console.error(`Error updating property ${key}:`, updateError)
          }
        } else {
          // Insert new property
          const { error: insertError } = await supabaseAdmin.from('core_dynamic_data').insert({
            entity_id: id,
            organization_id: organizationId,
            field_name: key,
            field_value,
            field_type
          })

          if (insertError) {
            console.error(`Error inserting property ${key}:`, insertError)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Entity updated successfully'
    })
  } catch (error) {
    console.error('Update entity error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/v1/entities - Universal entity deletion
export async function DELETE(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Get organization_id from JWT token
    const organizationId = await getOrganizationFromAuth(request)

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Entity ID is required' },
        { status: 400 }
      )
    }

    // Delete dynamic data first (due to foreign key constraints)
    const { error: dynamicError } = await supabaseAdmin
      .from('core_dynamic_data')
      .delete()
      .eq('entity_id', id)
      .eq('organization_id', organizationId)

    if (dynamicError) {
      console.error('Error deleting dynamic data:', dynamicError)
    }

    // Then delete the entity
    const { error: entityError } = await supabaseAdmin
      .from('core_entities')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (entityError) {
      console.error('Error deleting entity:', entityError)
      return NextResponse.json(
        { success: false, message: 'Failed to delete entity' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Entity deleted successfully'
    })
  } catch (error) {
    console.error('Delete entity error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
