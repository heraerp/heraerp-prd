import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Steve Jobs Principle: "Focus and simplicity"
// Universal operations dashboard that elegantly handles all fulfillment types

// GET /api/v1/restaurant/operations - Comprehensive operations dashboard data
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    console.log('🎯 Operations: Loading comprehensive dashboard data')

    // Get all orders for today with enhanced fulfillment data
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('universal_transactions')
      .select(
        `
        *,
        lines:universal_transaction_lines(
          id,
          line_description,
          quantity,
          unit_price,
          line_amount,
          entity_id,
          menu_item:core_entities!universal_transaction_lines_entity_id_fkey(
            entity_name,
            entity_code
          )
        )
      `
      )
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'order')
      .gte('transaction_date', date)
      .lt(
        'transaction_date',
        new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      )
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    // Get active drivers (stored as entities)
    const { data: drivers, error: driversError } = await supabaseAdmin
      .from('core_entities')
      .select(
        `
        *,
        dynamic_data:core_dynamic_data(
          field_name,
          field_value,
          field_value_number,
          field_value_boolean,
          field_type
        )
      `
      )
      .eq('organization_id', organizationId)
      .eq('entity_type', 'driver')
      .eq('status', 'active')

    // Get active tables (stored as entities)
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('core_entities')
      .select(
        `
        *,
        dynamic_data:core_dynamic_data(
          field_name,
          field_value,
          field_value_number,
          field_value_boolean,
          field_type
        )
      `
      )
      .eq('organization_id', organizationId)
      .eq('entity_type', 'table')
      .eq('status', 'active')

    // Transform orders by fulfillment type
    const ordersByType = {
      dine_in: [],
      pickup: [],
      delivery: [],
      total: orders?.length || 0
    }

    const transformedOrders =
      orders?.map(order => {
        const metadata = order.metadata || {}
        const fulfillmentType = metadata.fulfillment_type || 'dine_in'

        const transformedOrder = {
          id: order.id,
          order_number: order.transaction_code,
          status: order.status,
          fulfillment_type: fulfillmentType,
          total_amount: order.total_amount || 0,
          created_at: order.created_at,
          updated_at: order.updated_at,
          customer: {
            name: metadata.customer_name || 'Walk-in Customer',
            phone: metadata.customer_phone || '',
            email: metadata.customer_email || ''
          },

          // Common order details
          items:
            order.lines?.map((line: any) => ({
              id: line.id,
              name: line.menu_item?.entity_name || line.line_description,
              quantity: line.quantity || 0,
              unit_price: line.unit_price || 0,
              line_total: line.line_amount || 0,
              modifications: metadata.line_modifications?.[line.id] || []
            })) || [],

          special_instructions: order.notes || '',
          estimated_ready_time: metadata.estimated_ready_time,

          // Fulfillment-specific data
          ...(fulfillmentType === 'dine_in' && {
            table_id: metadata.table_id,
            table_number: metadata.table_number,
            server_id: metadata.server_id,
            server_name: metadata.server_name,
            party_size: metadata.party_size || 1,
            service_milestones: metadata.service_milestones || []
          }),

          ...(fulfillmentType === 'pickup' && {
            pickup_code: metadata.pickup_code || order.id.slice(-6).toUpperCase(),
            pickup_location: metadata.pickup_location || 'Main Counter',
            customer_notified_at: metadata.customer_notified_at,
            ready_for_pickup: metadata.ready_for_pickup || false
          }),

          ...(fulfillmentType === 'delivery' && {
            driver_id: metadata.driver_id,
            driver_name: metadata.driver_name,
            delivery_address: metadata.delivery_address || '',
            delivery_instructions: metadata.delivery_instructions || '',
            estimated_delivery_time: metadata.estimated_delivery_time,
            tracking_code: metadata.tracking_code || order.id.slice(-8).toUpperCase(),
            delivery_fee: metadata.delivery_fee || 0,
            route_id: metadata.route_id
          })
        }

        // Categorize by fulfillment type
        if (fulfillmentType === 'dine_in') {
          ;(ordersByType.dine_in as any[]).push(transformedOrder)
        } else if (fulfillmentType === 'pickup') {
          ;(ordersByType.pickup as any[]).push(transformedOrder)
        } else if (fulfillmentType === 'delivery') {
          ;(ordersByType.delivery as any[]).push(transformedOrder)
        }

        return transformedOrder
      }) || []

    // Transform drivers data
    const transformedDrivers =
      drivers?.map(driver => {
        const dynamicProps =
          driver.dynamic_data?.reduce((acc: any, prop: any) => {
            let value = prop.field_value
            if (prop.field_type === 'number' && prop.field_value_number !== null) {
              value = prop.field_value_number
            } else if (prop.field_type === 'boolean' && prop.field_value_boolean !== null) {
              value = prop.field_value_boolean
            }
            acc[prop.field_name] = value
            return acc
          }, {}) || {}

        return {
          id: driver.id,
          name: driver.entity_name,
          code: driver.entity_code,
          status: driver.status,
          phone: dynamicProps.phone || '',
          vehicle_type: dynamicProps.vehicle_type || 'car',
          current_location: dynamicProps.current_location || null,
          is_available: dynamicProps.is_available !== false,
          current_orders: dynamicProps.current_orders || 0,
          rating: parseFloat(dynamicProps.rating || '5.0'),
          total_deliveries: parseInt(dynamicProps.total_deliveries || '0')
        }
      }) || []

    // Transform tables data
    const transformedTables =
      tables?.map(table => {
        const dynamicProps =
          table.dynamic_data?.reduce((acc: any, prop: any) => {
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
        const currentOrder = ordersByType.dine_in.find(
          (order: any) =>
            order.table_id === table.id &&
            ['pending', 'processing', 'approved'].includes(order.status)
        )

        return {
          id: table.id,
          table_number: table.entity_code,
          capacity: parseInt(dynamicProps.capacity || '4'),
          current_party_size: (currentOrder as any)?.party_size || 0,
          status: currentOrder ? 'occupied' : dynamicProps.status || 'available',
          server_id: (currentOrder as any)?.server_id || null,
          server_name: (currentOrder as any)?.server_name || null,
          current_order_id: (currentOrder as any)?.id || null,
          seated_at: (currentOrder as any)?.created_at || null,
          location: dynamicProps.location || 'Main Dining'
        }
      }) || []

    // Calculate operational metrics
    const now = new Date()
    const todayStart = new Date(date + 'T00:00:00')

    const metrics = {
      // Order volume
      total_orders: transformedOrders.length,
      dine_in_orders: ordersByType.dine_in.length,
      pickup_orders: ordersByType.pickup.length,
      delivery_orders: ordersByType.delivery.length,

      // Revenue
      total_revenue: transformedOrders.reduce((sum, order) => sum + order.total_amount, 0),
      average_order_value:
        transformedOrders.length > 0
          ? transformedOrders.reduce((sum, order) => sum + order.total_amount, 0) /
            transformedOrders.length
          : 0,

      // Operational efficiency
      pending_orders: transformedOrders.filter(order => order.status === 'pending').length,
      processing_orders: transformedOrders.filter(order => order.status === 'processing').length,
      ready_orders: transformedOrders.filter(order => order.status === 'approved').length,
      completed_orders: transformedOrders.filter(order => order.status === 'completed').length,

      // Table management
      total_tables: transformedTables.length,
      occupied_tables: transformedTables.filter(table => table.status === 'occupied').length,
      available_tables: transformedTables.filter(table => table.status === 'available').length,
      table_occupancy_rate:
        transformedTables.length > 0
          ? (transformedTables.filter(table => table.status === 'occupied').length /
              transformedTables.length) *
            100
          : 0,

      // Delivery operations
      total_drivers: transformedDrivers.length,
      available_drivers: transformedDrivers.filter(driver => driver.is_available).length,
      active_deliveries: ordersByType.delivery.filter((order: any) =>
        ['processing', 'approved'].includes(order.status)
      ).length,

      // Pickup operations
      ready_for_pickup: ordersByType.pickup.filter(
        (order: any) => order.status === 'approved' || order.ready_for_pickup
      ).length
    }

    // Steve Jobs: "Details are not details. They make the design."
    const response = {
      success: true,
      data: {
        date,
        timestamp: now.toISOString(),
        metrics,
        orders: {
          all: transformedOrders,
          by_type: ordersByType
        },
        tables: transformedTables,
        drivers: transformedDrivers,

        // Operational insights
        insights: [
          ...(metrics.pending_orders > 5
            ? [
                {
                  type: 'alert',
                  message: `${metrics.pending_orders} orders waiting to be processed`,
                  priority: 'high'
                }
              ]
            : []),
          ...(metrics.table_occupancy_rate > 80
            ? [
                {
                  type: 'info',
                  message: `${metrics.table_occupancy_rate.toFixed(1)}% table occupancy - consider waitlist`,
                  priority: 'medium'
                }
              ]
            : []),
          ...(metrics.available_drivers === 0 && metrics.delivery_orders > 0
            ? [
                {
                  type: 'warning',
                  message: 'No available drivers for delivery orders',
                  priority: 'high'
                }
              ]
            : [])
        ]
      }
    }

    console.log(
      `✅ Operations dashboard loaded: ${metrics.total_orders} orders, ${metrics.occupied_tables}/${metrics.total_tables} tables occupied`
    )
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Operations API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
