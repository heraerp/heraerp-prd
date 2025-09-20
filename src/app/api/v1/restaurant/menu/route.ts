import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /api/v1/restaurant/menu - Fetch menu items using HERA universal tables
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Get organization_id from mock context (in production, extract from JWT)
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID

    // Get menu items from core_entities where entity_type = 'menu_item'
    const { data: menuEntities, error: entitiesError } = await supabaseAdmin
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'menu_item')
      .eq('status', 'active')
      .order('entity_name')

    if (entitiesError) {
      console.error('Error fetching menu entities:', entitiesError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch menu items' },
        { status: 500 }
      )
    }

    // Get dynamic data for all menu items
    const entityIds = menuEntities.map(entity => entity.id)
    const { data: dynamicData, error: dynamicError } = await supabaseAdmin
      .from('core_dynamic_data')
      .select('entity_id, field_name, field_value, field_type')
      .in('entity_id', entityIds)

    if (dynamicError) {
      console.error('Error fetching dynamic data:', dynamicError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch menu properties' },
        { status: 500 }
      )
    }

    // Combine entities with their dynamic properties
    const menuItems = menuEntities.map(entity => {
      const entityDynamicData = dynamicData.filter(d => d.entity_id === entity.id)

      // Convert dynamic data to object
      const properties: Record<string, any> = {}
      entityDynamicData.forEach(data => {
        let value = data.field_value

        // Parse JSON fields
        if (data.field_type === 'json') {
          try {
            value = JSON.parse(data.field_value)
          } catch (e) {
            console.warn(`Failed to parse JSON for ${data.field_name}:`, data.field_value)
          }
        }
        // Parse numeric fields
        else if (data.field_type === 'number' || data.field_type === 'decimal') {
          value = parseFloat(data.field_value)
        } else if (data.field_type === 'integer') {
          value = parseInt(data.field_value, 10)
        }

        properties[data.field_name] = value
      })

      return {
        id: entity.id,
        entity_name: entity.entity_name,
        entity_code: entity.entity_code,
        status: entity.status,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
        // Dynamic properties
        price: properties.price || 0,
        description: properties.description || '',
        category: properties.category || 'Other',
        prep_time: properties.prep_time || 0,
        dietary_tags: properties.dietary_tags || [],
        ingredients: properties.ingredients || '',
        popularity: properties.popularity || 0,
        image_url: properties.image_url || null
      }
    })

    return NextResponse.json({
      success: true,
      data: menuItems,
      count: menuItems.length
    })
  } catch (error) {
    console.error('Restaurant menu API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/v1/restaurant/menu - Create new menu item
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID

    const {
      entity_name,
      entity_code,
      price,
      description,
      category,
      prep_time,
      dietary_tags,
      ingredients
    } = body

    // Create entity in core_entities
    const { data: entity, error: entityError } = await supabaseAdmin
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'menu_item',
        entity_name,
        entity_code,
        status: 'active'
      })
      .select()
      .single()

    if (entityError) {
      console.error('Error creating menu entity:', entityError)
      return NextResponse.json(
        { success: false, message: 'Failed to create menu item' },
        { status: 500 }
      )
    }

    // Create dynamic data properties with organization_id
    const dynamicDataInserts = [
      {
        entity_id: entity.id,
        organization_id: organizationId,
        field_name: 'price',
        field_value: price.toString(),
        field_type: 'decimal'
      },
      {
        entity_id: entity.id,
        organization_id: organizationId,
        field_name: 'description',
        field_value: description,
        field_type: 'text'
      },
      {
        entity_id: entity.id,
        organization_id: organizationId,
        field_name: 'category',
        field_value: category,
        field_type: 'text'
      },
      {
        entity_id: entity.id,
        organization_id: organizationId,
        field_name: 'prep_time',
        field_value: prep_time.toString(),
        field_type: 'integer'
      },
      {
        entity_id: entity.id,
        organization_id: organizationId,
        field_name: 'dietary_tags',
        field_value: JSON.stringify(dietary_tags),
        field_type: 'json'
      },
      {
        entity_id: entity.id,
        organization_id: organizationId,
        field_name: 'ingredients',
        field_value: ingredients,
        field_type: 'text'
      },
      {
        entity_id: entity.id,
        organization_id: organizationId,
        field_name: 'popularity',
        field_value: '0',
        field_type: 'integer'
      }
    ]

    const { error: dynamicError } = await supabaseAdmin
      .from('core_dynamic_data')
      .insert(dynamicDataInserts)

    if (dynamicError) {
      console.error('Error creating dynamic data:', dynamicError)
      return NextResponse.json(
        { success: false, message: 'Failed to create menu item properties' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: entity.id,
        entity_name,
        entity_code,
        price,
        description,
        category,
        prep_time,
        dietary_tags,
        ingredients,
        popularity: 0,
        status: 'active'
      }
    })
  } catch (error) {
    console.error('Create menu item error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
