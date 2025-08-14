import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /crm/entities - Fetch all crm items
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const entityType = searchParams.get('entity_type') || 'crm_item'
    const includeDynamicData = searchParams.get('include_dynamic_data') === 'true'

    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Fetch entities
    let query = supabaseAdmin
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('entity_name')

    if (entityType !== 'all') {
      query = query.eq('entity_type', entityType)
    }

    const { data: entities, error: entitiesError } = await query

    if (entitiesError) {
      console.error('Error fetching crm entities:', entitiesError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch crm entities' },
        { status: 500 }
      )
    }

    // Get dynamic data if requested
    let enhancedEntities = entities
    if (includeDynamicData && entities.length > 0) {
      const entityIds = entities.map(e => e.id)
      const { data: dynamicData } = await supabaseAdmin
        .from('core_dynamic_data')
        .select('*')
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

    return NextResponse.json({
      success: true,
      data: enhancedEntities,
      count: enhancedEntities.length
    })

  } catch (error) {
    console.error('Crm API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /crm/entities - Create crm item
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { organization_id, entity_type, entity_name, entity_code, dynamic_fields } = body

    if (!organization_id || !entity_type || !entity_name) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create entity
    const { data: entity, error: entityError } = await supabaseAdmin
      .from('core_entities')
      .insert({
        organization_id,
        entity_type,
        entity_name,
        entity_code: entity_code || `CRM-${Date.now().toString().slice(-6)}`,
        status: 'active',
        created_at: new Date().toISOString(),
        created_by: 'system'
      })
      .select()
      .single()

    if (entityError) {
      console.error('Error creating crm entity:', entityError)
      return NextResponse.json(
        { success: false, message: 'Failed to create crm entity', error: entityError },
        { status: 500 }
      )
    }

    // Create dynamic fields
    if (dynamic_fields && Object.keys(dynamic_fields).length > 0) {
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
        } else if (typeof fieldValue === 'object') {
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
          field_value_json: jsonValue,
          created_at: new Date().toISOString()
        })
      })

      if (dynamicFieldsData.length > 0) {
        const { error: dynamicError } = await supabaseAdmin
          .from('core_dynamic_data')
          .insert(dynamicFieldsData)

        if (dynamicError) {
          console.error('Error creating dynamic fields:', dynamicError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...entity,
        message: 'Crm created successfully'
      }
    })

  } catch (error) {
    console.error('Crm creation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
