import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Steve Jobs Principle: "Innovation distinguishes between a leader and a follower."
// Universal table management that works for any restaurant layout

// GET /api/v1/restaurant/tables - List tables with real-time status
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const includeOrders = searchParams.get('include_orders') === 'true'
    
    console.log('🍽️ Tables: Loading table management data')

    // Get all tables (stored as entities)
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('core_entities')
      .select(`
        *,
        dynamic_data:core_dynamic_data(
          field_name,
          field_value,
          field_value_number,
          field_value_boolean,
          field_type
        )
      `)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'table')
      .order('entity_code', { ascending: true })

    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch tables' },
        { status: 500 }
      )
    }

    // Get current orders for tables if requested
    let currentOrders = []
    if (includeOrders) {
      const { data: orders, error: ordersError } = await supabaseAdmin
        .from('universal_transactions')
        .select(`
          *,
          lines:universal_transaction_lines(
            id,
            line_description,
            quantity,
            unit_price,
            line_amount,
            menu_item:core_entities!universal_transaction_lines_entity_id_fkey(
              entity_name
            )
          )
        `)
        .eq('organization_id', organizationId)
        .eq('transaction_type', 'order')
        .in('status', ['pending', 'processing', 'approved'])

      if (!ordersError) {
        currentOrders = orders || []
      }
    }

    // Transform tables with dynamic data and current status
    const transformedTables = tables?.map(table => {
      const dynamicProps = table.dynamic_data?.reduce((acc: any, prop: any) => {
        let value = prop.field_value
        if (prop.field_type === 'number' && prop.field_value_number !== null) {
          value = prop.field_value_number
        } else if (prop.field_type === 'boolean' && prop.field_value_boolean !== null) {
          value = prop.field_value_boolean
        }
        acc[prop.field_name] = value
        return acc
      }, {}) || {}

      // Find current order for this table
      const currentOrder = currentOrders.find((order: any) => 
        (order.metadata as any)?.table_id === table.id
      )

      const tableData = {
        id: table.id,
        table_number: table.entity_code,
        name: table.entity_name,
        capacity: parseInt(dynamicProps.capacity || '4'),
        location: dynamicProps.location || 'Main Dining',
        table_type: dynamicProps.table_type || 'standard',
        is_active: table.status === 'active',
        
        // Real-time status
        status: currentOrder ? 'occupied' : (dynamicProps.current_status || 'available'),
        current_party_size: currentOrder?.metadata?.party_size || 0,
        seated_at: currentOrder?.created_at || null,
        
        // Server assignment
        server_id: currentOrder?.metadata?.server_id || null,
        server_name: currentOrder?.metadata?.server_name || null,
        
        // Current order details (if table is occupied)
        ...(currentOrder && {
          current_order: {
            id: currentOrder.id,
            order_number: currentOrder.transaction_code,
            status: currentOrder.status,
            total_amount: currentOrder.total_amount || 0,
            created_at: currentOrder.created_at,
            item_count: currentOrder.lines?.length || 0,
            items: currentOrder.lines?.map((line: any) => ({
              name: line.menu_item?.entity_name || line.line_description,
              quantity: line.quantity || 0
            })) || []
          }
        }),
        
        // Table configuration
        coordinates: {
          x: parseInt(dynamicProps.x_position || '0'),
          y: parseInt(dynamicProps.y_position || '0')
        },
        shape: dynamicProps.shape || 'rectangle',
        notes: dynamicProps.notes || ''
      }

      return tableData
    }) || []

    // Calculate table statistics
    const stats = {
      total_tables: transformedTables.length,
      available_tables: transformedTables.filter(t => t.status === 'available').length,
      occupied_tables: transformedTables.filter(t => t.status === 'occupied').length,
      reserved_tables: transformedTables.filter(t => t.status === 'reserved').length,
      cleaning_tables: transformedTables.filter(t => t.status === 'cleaning').length,
      total_capacity: transformedTables.reduce((sum, t) => sum + t.capacity, 0),
      current_occupancy: transformedTables.reduce((sum, t) => sum + t.current_party_size, 0),
      occupancy_rate: transformedTables.length > 0 
        ? (transformedTables.filter(t => t.status === 'occupied').length / transformedTables.length) * 100 
        : 0
    }

    const response = {
      success: true,
      data: {
        tables: transformedTables,
        stats,
        locations: [...new Set(transformedTables.map(t => t.location))],
        table_types: [...new Set(transformedTables.map(t => t.table_type))]
      }
    }

    console.log(`✅ Loaded ${transformedTables.length} tables (${stats.occupied_tables} occupied)`)
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Tables API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/restaurant/tables - Create new table
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const tableData = await request.json()

    console.log('🍽️ Tables: Creating new table')

    // Validate required fields
    if (!tableData.table_number || !tableData.capacity) {
      return NextResponse.json(
        { success: false, message: 'Table number and capacity are required' },
        { status: 400 }
      )
    }

    // Create table entity
    const { data: table, error: tableError } = await supabaseAdmin
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'table',
        entity_name: tableData.name || `Table ${tableData.table_number}`,
        entity_code: tableData.table_number.toString(),
        status: 'active',
        description: tableData.description || ''
      })
      .select()
      .single()

    if (tableError) {
      console.error('❌ Error creating table:', tableError)
      return NextResponse.json(
        { success: false, message: 'Failed to create table' },
        { status: 500 }
      )
    }

    // Store table properties
    const tableProperties = [
      { name: 'capacity', value: tableData.capacity.toString(), type: 'number' },
      { name: 'location', value: tableData.location || 'Main Dining', type: 'text' },
      { name: 'table_type', value: tableData.table_type || 'standard', type: 'text' },
      { name: 'current_status', value: 'available', type: 'text' },
      { name: 'x_position', value: (tableData.x_position || 0).toString(), type: 'number' },
      { name: 'y_position', value: (tableData.y_position || 0).toString(), type: 'number' },
      { name: 'shape', value: tableData.shape || 'rectangle', type: 'text' },
      { name: 'notes', value: tableData.notes || '', type: 'text' }
    ].filter(prop => prop.value !== '')

    if (tableProperties.length > 0) {
      const { error: dynamicError } = await supabaseAdmin
        .from('core_dynamic_data')
        .insert(
          tableProperties.map(prop => {
            const baseProps = {
              organization_id: organizationId,
              entity_id: table.id,
              field_name: prop.name,
              field_type: prop.type
            }
            
            if (prop.type === 'number') {
              return { ...baseProps, field_value_number: parseFloat(prop.value) || 0 }
            } else {
              return { ...baseProps, field_value: prop.value }
            }
          })
        )

      if (dynamicError) {
        console.error('❌ Error storing table properties:', dynamicError)
      }
    }

    const response = {
      success: true,
      data: {
        id: table.id,
        table_number: table.entity_code,
        name: table.entity_name,
        status: table.status,
        created_at: table.created_at
      },
      message: `Table ${table.entity_code} created successfully`
    }

    console.log(`✅ Table created: ${table.entity_code}`)
    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('❌ Create table API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/restaurant/tables - Update table status or properties
export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const updateData = await request.json()

    if (!updateData.id) {
      return NextResponse.json(
        { success: false, message: 'Table ID is required for updates' },
        { status: 400 }
      )
    }

    console.log(`🍽️ Tables: Updating table ${updateData.id}`)

    // Update core entity if needed
    const entityUpdates: any = {}
    if (updateData.name) entityUpdates.entity_name = updateData.name
    if (updateData.status) entityUpdates.status = updateData.status
    if (updateData.description !== undefined) entityUpdates.description = updateData.description

    if (Object.keys(entityUpdates).length > 0) {
      const { error: entityError } = await supabaseAdmin
        .from('core_entities')
        .update(entityUpdates)
        .eq('id', updateData.id)
        .eq('organization_id', organizationId)
        .eq('entity_type', 'table')

      if (entityError) {
        console.error('❌ Error updating table entity:', entityError)
        return NextResponse.json(
          { success: false, message: 'Failed to update table' },
          { status: 500 }
        )
      }
    }

    // Update dynamic properties
    const dynamicUpdates = [
      'capacity', 'location', 'table_type', 'current_status',
      'x_position', 'y_position', 'shape', 'notes'
    ]

    for (const property of dynamicUpdates) {
      if (updateData[property] !== undefined) {
        const value = updateData[property]
        const fieldType = ['capacity', 'x_position', 'y_position'].includes(property) ? 'number' : 'text'
        
        const baseProps = {
          organization_id: organizationId,
          entity_id: updateData.id,
          field_name: property,
          field_type: fieldType
        }
        
        let upsertData
        if (fieldType === 'number') {
          upsertData = { ...baseProps, field_value_number: parseFloat(value) || 0 }
        } else {
          upsertData = { ...baseProps, field_value: value.toString() }
        }
        
        await supabaseAdmin
          .from('core_dynamic_data')
          .upsert(upsertData, {
            onConflict: 'organization_id,entity_id,field_name'
          })
      }
    }

    console.log(`✅ Table ${updateData.id} updated successfully`)
    return NextResponse.json({
      success: true,
      message: 'Table updated successfully'
    })

  } catch (error) {
    console.error('❌ Update table API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}