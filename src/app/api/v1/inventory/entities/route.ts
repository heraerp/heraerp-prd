import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * 📦 HERA Universal Inventory Management System
 * Revolutionary Restaurant Inventory using HERA's 6-Table Architecture
 * 
 * Universal API following HERA-SPEAR patterns
 * Layer 3 of 7-Layer Build Standard
 */

// GET /api/v1/inventory/entities - Fetch inventory items using universal schema
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id') || '550e8400-e29b-41d4-a716-446655440000' // Demo org
    const entityType = searchParams.get('entity_type') || 'inventory_item'
    const includeRelationships = searchParams.get('include_relationships') === 'true'
    const includeDynamicData = searchParams.get('include_dynamic_data') === 'true'
    
    // Get inventory entities from universal core_entities table
    let query = supabaseAdmin
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .in('entity_type', ['inventory_item', 'supplier', 'storage_location'])
      .eq('status', 'active')
      .order('entity_name')

    if (entityType !== 'all') {
      query = query.eq('entity_type', entityType)
    }

    const { data: entities, error: entitiesError } = await query

    if (entitiesError) {
      console.error('Error fetching inventory entities:', entitiesError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch inventory entities' },
        { status: 500 }
      )
    }

    // Get dynamic data for each entity if requested
    let enhancedEntities = entities
    if (includeDynamicData && entities.length > 0) {
      const entityIds = entities.map(e => e.id)
      const { data: dynamicData } = await supabaseAdmin
        .from('core_dynamic_data')
        .select('entity_id, field_name, field_type, field_value_text, field_value_number, field_value_json, ai_enhanced_value')
        .in('entity_id', entityIds)

      // Merge dynamic data with entities
      enhancedEntities = entities.map(entity => {
        const entityDynamicData = dynamicData?.filter(d => d.entity_id === entity.id) || []
        const dynamicFields = {}
        
        entityDynamicData.forEach(field => {
          let value = field.field_value_text
          if (field.field_type === 'number') value = field.field_value_number
          if (field.field_type === 'json') value = field.field_value_json
          
          dynamicFields[field.field_name] = {
            value,
            ai_enhanced: field.ai_enhanced_value,
            type: field.field_type
          }
        })
        
        return {
          ...entity,
          dynamic_fields: dynamicFields
        }
      })
    }

    // Get relationships if requested
    if (includeRelationships && entities.length > 0) {
      const entityIds = entities.map(e => e.id)
      const { data: relationships } = await supabaseAdmin
        .from('core_relationships')
        .select(`
          *,
          source_entity:core_entities!core_relationships_source_entity_id_fkey(entity_name, entity_type),
          target_entity:core_entities!core_relationships_target_entity_id_fkey(entity_name, entity_type)
        `)
        .or(`source_entity_id.in.(${entityIds.join(',')}),target_entity_id.in.(${entityIds.join(',')})`)

      enhancedEntities = enhancedEntities.map(entity => ({
        ...entity,
        relationships: relationships?.filter(r => 
          r.source_entity_id === entity.id || r.target_entity_id === entity.id
        ) || []
      }))
    }

    return NextResponse.json({
      success: true,
      data: enhancedEntities,
      count: enhancedEntities.length,
      module: 'INVENTORY',
      architecture: 'HERA_UNIVERSAL_6_TABLE',
      generated_by: 'HERA_DNA_SYSTEM'
    })

  } catch (error) {
    console.error('Inventory entities API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/inventory/entities - Create inventory item using universal schema
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const {
      organization_id = '550e8400-e29b-41d4-a716-446655440000',
      entity_type = 'inventory_item',
      entity_name,
      entity_code,
      description,
      dynamic_fields = {},
      relationships = []
    } = body

    // Generate entity code if not provided
    const finalEntityCode = entity_code || `INV-${entity_type.toUpperCase().slice(0,3)}-${Date.now().toString().slice(-6)}`

    // Create entity in core_entities
    const { data: entity, error: entityError } = await supabaseAdmin
      .from('core_entities')
      .insert({
        organization_id,
        entity_type,
        entity_name,
        entity_code: finalEntityCode,
        status: 'active',
        ai_classification: dynamic_fields.category || 'inventory_item',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (entityError) {
      console.error('Error creating inventory entity:', entityError)
      return NextResponse.json(
        { success: false, message: 'Failed to create inventory entity', error: entityError },
        { status: 500 }
      )
    }

    // Create dynamic fields
    const dynamicFieldsData = []
    Object.entries(dynamic_fields).forEach(([fieldName, fieldValue]) => {
      if (fieldValue === null || fieldValue === undefined || fieldValue === '') return
      
      let fieldType = 'text'
      let textValue = null
      let numberValue = null
      let jsonValue = null

      if (typeof fieldValue === 'number') {
        fieldType = 'number'
        numberValue = fieldValue
      } else if (typeof fieldValue === 'object' && fieldValue !== null) {
        fieldType = 'json'
        jsonValue = fieldValue
      } else {
        fieldType = 'text'
        textValue = String(fieldValue)
      }

      dynamicFieldsData.push({
        organization_id,
        entity_id: entity.id,
        field_name: fieldName,
        field_type: fieldType,
        field_value_text: textValue,
        field_value_number: numberValue,
        field_value_json: jsonValue
      })
    })

    if (dynamicFieldsData.length > 0) {
      const { error: dynamicError } = await supabaseAdmin
        .from('core_dynamic_data')
        .insert(dynamicFieldsData)

      if (dynamicError) {
        console.error('Error creating dynamic fields:', dynamicError)
        // Continue - entity created successfully
      }
    }

    // Create relationships
    if (relationships.length > 0) {
      const relationshipData = relationships.map(rel => ({
        organization_id,
        source_entity_id: entity.id,
        target_entity_id: rel.target_entity_id,
        relationship_type: rel.relationship_type,
        relationship_strength: rel.relationship_strength || 1.0,
        relationship_data: rel.relationship_data || {}
      }))

      const { error: relationshipError } = await supabaseAdmin
        .from('core_relationships')
        .insert(relationshipData)

      if (relationshipError) {
        console.error('Error creating relationships:', relationshipError)
        // Continue - entity created successfully
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...entity,
        smart_code: `HERA.INVENTORY.ITEM.${finalEntityCode}.v1`,
        dynamic_fields_created: dynamicFieldsData.length,
        relationships_created: relationships.length
      },
      message: `Inventory ${entity_type} created successfully using HERA universal architecture`
    })

  } catch (error) {
    console.error('Inventory entity creation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/v1/inventory/entities - Update inventory item
export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const {
      entity_id,
      organization_id = '550e8400-e29b-41d4-a716-446655440000',
      dynamic_fields = {},
      ...entityUpdates
    } = body

    if (!entity_id) {
      return NextResponse.json(
        { success: false, message: 'entity_id is required' },
        { status: 400 }
      )
    }

    // Update entity
    const { error: entityError } = await supabaseAdmin
      .from('core_entities')
      .update({
        ...entityUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', entity_id)
      .eq('organization_id', organization_id)

    if (entityError) {
      console.error('Error updating inventory entity:', entityError)
      return NextResponse.json(
        { success: false, message: 'Failed to update inventory entity' },
        { status: 500 }
      )
    }

    // Update dynamic fields
    if (Object.keys(dynamic_fields).length > 0) {
      for (const [fieldName, fieldValue] of Object.entries(dynamic_fields)) {
        if (fieldValue === null || fieldValue === undefined || fieldValue === '') continue
        
        let fieldType = 'text'
        let textValue = null
        let numberValue = null
        let jsonValue = null

        if (typeof fieldValue === 'number') {
          fieldType = 'number'
          numberValue = fieldValue
        } else if (typeof fieldValue === 'object' && fieldValue !== null) {
          fieldType = 'json'
          jsonValue = fieldValue
        } else {
          fieldType = 'text'
          textValue = String(fieldValue)
        }

        // Upsert dynamic field
        await supabaseAdmin
          .from('core_dynamic_data')
          .upsert({
            organization_id,
            entity_id,
            field_name: fieldName,
            field_type: fieldType,
            field_value_text: textValue,
            field_value_number: numberValue,
            field_value_json: jsonValue,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'organization_id,entity_id,field_name'
          })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Inventory entity updated successfully',
      dynamic_fields_updated: Object.keys(dynamic_fields).length
    })

  } catch (error) {
    console.error('Inventory entity update error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/inventory/entities - Delete inventory item (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get('entity_id')
    const organizationId = searchParams.get('organization_id') || '550e8400-e29b-41d4-a716-446655440000'

    if (!entityId) {
      return NextResponse.json(
        { success: false, message: 'entity_id is required' },
        { status: 400 }
      )
    }

    // Soft delete by updating status
    const { error } = await supabaseAdmin
      .from('core_entities')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', entityId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting inventory entity:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to delete inventory entity' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Inventory entity deleted successfully (soft delete)'
    })

  } catch (error) {
    console.error('Inventory entity deletion error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}