import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

// Bella Vista Salon organization ID
const SALON_ORG_ID = '44d2d8f8-167d-46a7-a704-c0e5435863d6' // HERA Software Inc

export async function GET(request: NextRequest) {
  try {
    console.log('📦 Fetching Salon Inventory Data...')

    // Fetch inventory items from core_entities
    const { data: inventoryEntities, error: entitiesError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'product')
      .eq('status', 'active')
      .order('entity_name')

    if (entitiesError) {
      console.error('Error fetching inventory entities:', entitiesError)
    }

    // Fetch dynamic data for products (stock levels, costs, etc.)
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .in('field_name', [
        'current_stock',
        'min_stock',
        'max_stock',
        'unit_cost',
        'selling_price',
        'supplier',
        'location',
        'expiry_date',
        'last_restocked',
        'units_sold',
        'brand',
        'sku',
        'category'
      ])

    if (dynamicError) {
      console.error('Error fetching dynamic data:', dynamicError)
    }

    // Transform data to match frontend expectations
    const inventory =
      inventoryEntities?.map(entity => {
        const entityDynamicData = dynamicData?.filter(dd => dd.entity_id === entity.id)

        const getDynamicValue = (fieldName: string, defaultValue: any = null) => {
          const field = entityDynamicData?.find(dd => dd.field_name === fieldName)
          if (!field) return defaultValue

          // Return the appropriate value type
          if (field.field_value_number !== null) return field.field_value_number
          if (field.field_value_text !== null) return field.field_value_text
          if (field.field_value_boolean !== null) return field.field_value_boolean
          if (field.field_value_date !== null) return field.field_value_date
          return defaultValue
        }

        return {
          id: entity.id,
          name: entity.entity_name,
          category: getDynamicValue('category', 'General'),
          brand: getDynamicValue('brand', 'Unknown'),
          sku: getDynamicValue('sku', entity.entity_code),
          currentStock: getDynamicValue('current_stock', 0),
          minStock: getDynamicValue('min_stock', 10),
          maxStock: getDynamicValue('max_stock', 100),
          unitCost: getDynamicValue('unit_cost', 0),
          sellingPrice: getDynamicValue('selling_price', 0),
          supplier: getDynamicValue('supplier', 'Unknown Supplier'),
          location: getDynamicValue('location', 'Storage'),
          expiryDate: getDynamicValue('expiry_date'),
          lastRestocked: getDynamicValue('last_restocked', entity.created_at?.split('T')[0]),
          unitsSold: getDynamicValue('units_sold', 0),
          isActive: entity.status === 'active'
        }
      }) || []

    console.log(`✅ Loaded ${inventory.length} inventory items`)
    return NextResponse.json({
      inventory,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error in salon inventory API:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, item, itemId, updates } = await request.json()
    console.log(`📝 Salon inventory ${action}...`)

    switch (action) {
      case 'create':
        // Create new inventory item
        const { data: newEntity, error: createError } = await supabase
          .from('core_entities')
          .insert({
            organization_id: SALON_ORG_ID,
            entity_type: 'product',
            entity_name: item.name,
            entity_code: item.sku,
            status: 'active'
          })
          .select()
          .single()

        if (createError) throw createError

        // Add dynamic fields
        const dynamicFields = [
          {
            field_name: 'category',
            field_value_text: item.category,
            smart_code: 'HERA.SALON.INV.FIELD.CATEGORY.V1'
          },
          {
            field_name: 'brand',
            field_value_text: item.brand,
            smart_code: 'HERA.SALON.INV.FIELD.BRAND.V1'
          },
          {
            field_name: 'sku',
            field_value_text: item.sku,
            smart_code: 'HERA.SALON.INV.FIELD.SKU.V1'
          },
          {
            field_name: 'current_stock',
            field_value_number: item.currentStock,
            smart_code: 'HERA.SALON.INV.FIELD.CURRENT_STOCK.V1'
          },
          {
            field_name: 'min_stock',
            field_value_number: item.minStock,
            smart_code: 'HERA.SALON.INV.FIELD.MIN_STOCK.V1'
          },
          {
            field_name: 'max_stock',
            field_value_number: item.maxStock,
            smart_code: 'HERA.SALON.INV.FIELD.MAX_STOCK.V1'
          },
          {
            field_name: 'unit_cost',
            field_value_number: item.unitCost,
            smart_code: 'HERA.SALON.INV.FIELD.UNIT_COST.V1'
          },
          {
            field_name: 'selling_price',
            field_value_number: item.sellingPrice,
            smart_code: 'HERA.SALON.INV.FIELD.SELLING_PRICE.V1'
          },
          {
            field_name: 'supplier',
            field_value_text: item.supplier,
            smart_code: 'HERA.SALON.INV.FIELD.SUPPLIER.V1'
          },
          {
            field_name: 'location',
            field_value_text: item.location,
            smart_code: 'HERA.SALON.INV.FIELD.LOCATION.V1'
          }
        ]

        for (const field of dynamicFields) {
          await supabase.from('core_dynamic_data').insert({
            organization_id: SALON_ORG_ID,
            entity_id: newEntity.id,
            ...field
          })
        }

        break

      case 'update':
        // Update existing item
        if (updates.name || updates.status) {
          await supabase
            .from('core_entities')
            .update({
              entity_name: updates.name,
              status: updates.status
            })
            .eq('id', itemId)
            .eq('organization_id', SALON_ORG_ID)
        }

        // Update dynamic fields
        for (const [key, value] of Object.entries(updates)) {
          if (key === 'name' || key === 'status') continue

          const fieldName =
            key === 'currentStock'
              ? 'current_stock'
              : key === 'minStock'
                ? 'min_stock'
                : key === 'maxStock'
                  ? 'max_stock'
                  : key === 'unitCost'
                    ? 'unit_cost'
                    : key === 'sellingPrice'
                      ? 'selling_price'
                      : key.toLowerCase()

          await supabase.from('core_dynamic_data').upsert({
            organization_id: SALON_ORG_ID,
            entity_id: itemId,
            field_name: fieldName,
            ...(typeof value === 'number'
              ? { field_value_number: value }
              : { field_value_text: value }),
            smart_code: `HERA.SALON.INV.FIELD.${fieldName.toUpperCase()}.v1`
          })
        }

        break

      case 'delete':
        // Soft delete item
        await supabase
          .from('core_entities')
          .update({ status: 'inactive' })
          .eq('id', itemId)
          .eq('organization_id', SALON_ORG_ID)

        break
    }

    console.log('✅ Salon inventory updated successfully')
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error updating salon inventory:', error)
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
  }
}
