import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// POST /api/v1/seed-menu - Create sample menu items for Mario's Restaurant
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID

    // Sample menu items for Mario's Italian Restaurant
    const menuItems = [
      {
        entity_name: 'Margherita Pizza',
        entity_code: 'PIZZA_MARG',
        entity_category: 'main_course',
        entity_subcategory: 'pizza',
        description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
        properties: {
          price: 18.50,
          prep_time: 20,
          ingredients: ['tomato sauce', 'mozzarella', 'fresh basil', 'olive oil'],
          allergens: ['gluten', 'dairy'],
          vegetarian: true,
          vegan: false
        }
      },
      {
        entity_name: 'Caesar Salad',
        entity_code: 'SALAD_CAESAR',
        entity_category: 'appetizer',
        entity_subcategory: 'salad',
        description: 'Romaine lettuce with Caesar dressing, croutons and parmesan',
        properties: {
          price: 14.50,
          prep_time: 10,
          ingredients: ['romaine lettuce', 'caesar dressing', 'croutons', 'parmesan'],
          allergens: ['gluten', 'dairy', 'eggs'],
          vegetarian: true,
          vegan: false
        }
      },
      {
        entity_name: 'Lasagna Bolognese',
        entity_code: 'PASTA_LASAGNA',
        entity_category: 'main_course',
        entity_subcategory: 'pasta',
        description: 'Traditional lasagna with meat sauce, bechamel and cheese',
        properties: {
          price: 22.00,
          prep_time: 25,
          ingredients: ['pasta sheets', 'ground beef', 'tomato sauce', 'bechamel', 'mozzarella'],
          allergens: ['gluten', 'dairy'],
          vegetarian: false,
          vegan: false
        }
      },
      {
        entity_name: 'Tiramisu',
        entity_code: 'DESSERT_TIRAMISU',
        entity_category: 'dessert',
        entity_subcategory: 'traditional',
        description: 'Classic Italian dessert with coffee, mascarpone and cocoa',
        properties: {
          price: 8.50,
          prep_time: 5,
          ingredients: ['ladyfingers', 'espresso', 'mascarpone', 'eggs', 'cocoa'],
          allergens: ['gluten', 'dairy', 'eggs'],
          vegetarian: true,
          vegan: false
        }
      },
      {
        entity_name: 'House Wine (Glass)',
        entity_code: 'WINE_HOUSE',
        entity_category: 'beverage',
        entity_subcategory: 'wine',
        description: 'Italian house wine served by the glass',
        properties: {
          price: 6.25,
          prep_time: 2,
          alcohol_content: '12%',
          region: 'Tuscany',
          allergens: ['sulfites'],
          vegetarian: true,
          vegan: true
        }
      }
    ]

    const createdItems = []

    for (const item of menuItems) {
      // Create entity in core_entities
      const { data: entity, error: entityError } = await supabaseAdmin
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'menu_item',
          entity_name: item.entity_name,
          entity_code: item.entity_code,
          entity_category: item.entity_category,
          entity_subcategory: item.entity_subcategory,
          description: item.description,
          status: 'active'
        })
        .select()
        .single()

      if (entityError) {
        console.error('Error creating entity:', entityError)
        continue
      }

      // Create dynamic properties
      if (item.properties && Object.keys(item.properties).length > 0) {
        const dynamicDataInserts = Object.entries(item.properties).map(([key, value]) => {
          let field_type = 'text'
          let field_value = String(value)

          // Determine field type
          if (typeof value === 'boolean') {
            field_type = 'boolean'
          } else if (typeof value === 'number') {
            field_type = Number.isInteger(value) ? 'integer' : 'decimal'
          } else if (Array.isArray(value)) {
            field_type = 'json'
            field_value = JSON.stringify(value)
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
        }
      }

      createdItems.push({
        id: entity.id,
        name: entity.entity_name,
        code: entity.entity_code,
        price: item.properties.price
      })
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdItems.length} menu items for Mario's Restaurant`,
      data: createdItems
    })

  } catch (error) {
    console.error('Seed menu error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}