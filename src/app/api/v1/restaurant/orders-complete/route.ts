import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Smart Code: HERA.REST.ORDERS.API.COMPLETE.V1
// Complete Restaurant Order Management API with Universal 6-Table Architecture
// Supports B2C customer ordering and B2B internal operations (POS, KDS)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const status = searchParams.get('status')
    const dateRange = searchParams.get('date_range') || 'today'
    const includeItems = searchParams.get('include_items') === 'true'
    const customerView = searchParams.get('customer_view') === 'true'

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Calculate date filter based on range
    let dateFilter = new Date()
    if (dateRange === 'today') {
      dateFilter.setHours(0, 0, 0, 0)
    } else if (dateRange === 'week') {
      dateFilter.setDate(dateFilter.getDate() - 7)
    } else if (dateRange === 'month') {
      dateFilter.setMonth(dateFilter.getMonth() - 1)
    }

    // Fetch orders from universal_transactions with transaction_type = 'order'
    let orderQuery = supabase
      .from('universal_transactions')
      .select(
        `
        *,
        reference_entity:core_entities!reference_entity_id(*),
        transaction_lines:universal_transaction_lines(*)
      `
      )
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'order')
      .gte('transaction_date', dateFilter.toISOString())
      .order('transaction_date', { ascending: false })

    if (status) {
      orderQuery = orderQuery.eq('status', status)
    }

    const { data: orders, error } = await orderQuery

    if (error) {
      console.error('Orders fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Transform orders for response
    const transformedOrders = await Promise.all(
      (orders || []).map(async order => {
        // Get dynamic data for additional order properties
        const { data: orderDynamicData } = await supabase
          .from('core_dynamic_data')
          .select('*')
          .eq('entity_id', order.id)

        const dynamicProps = (orderDynamicData || []).reduce((acc, prop) => {
          let value =
            prop.field_value_text ||
            prop.field_value_number ||
            prop.field_value_json ||
            prop.field_value_boolean ||
            prop.field_value_integer
          acc[prop.field_name] = value
          return acc
        }, {})

        // Get customer information if available
        let customerInfo = null
        if (order.reference_entity_id && order.reference_entity) {
          const { data: customerDynamic } = await supabase
            .from('core_dynamic_data')
            .select('*')
            .eq('entity_id', order.reference_entity_id)

          const customerProps = (customerDynamic || []).reduce((acc, prop) => {
            let value = prop.field_value_text || prop.field_value_number || prop.field_value_json
            acc[prop.field_name] = value
            return acc
          }, {})

          customerInfo = {
            id: order.reference_entity.id,
            name: order.reference_entity.entity_name,
            phone: customerProps.phone,
            email: customerProps.email,
            loyalty_tier: customerProps.loyalty_tier || 'bronze'
          }
        }

        // Transform line items with menu item details
        const transformedLines = await Promise.all(
          (order.transaction_lines || []).map(async line => {
            // Get menu item details
            let menuItem = null
            if (line.line_entity_id) {
              const { data: menuEntity } = await supabase
                .from('core_entities')
                .select('*')
                .eq('id', line.line_entity_id)
                .single()

              if (menuEntity) {
                const { data: menuDynamic } = await supabase
                  .from('core_dynamic_data')
                  .select('*')
                  .eq('entity_id', line.line_entity_id)

                const menuProps = (menuDynamic || []).reduce((acc, prop) => {
                  let value =
                    prop.field_value_text || prop.field_value_number || prop.field_value_json
                  acc[prop.field_name] = value
                  return acc
                }, {})

                menuItem = {
                  id: menuEntity.id,
                  name: menuEntity.entity_name,
                  category: menuEntity.entity_category,
                  price: menuProps.price || line.unit_price,
                  preparation_time: menuProps.preparation_time || 15,
                  image_url: menuProps.image_url
                }
              }
            }

            // Get line item dynamic data for customizations
            const { data: lineDynamic } = await supabase
              .from('core_dynamic_data')
              .select('*')
              .eq('entity_id', line.id)

            const lineProps = (lineDynamic || []).reduce((acc, prop) => {
              let value = prop.field_value_text || prop.field_value_number || prop.field_value_json
              acc[prop.field_name] = value
              return acc
            }, {})

            return {
              id: line.id,
              menu_item: menuItem,
              quantity: line.quantity,
              unit_price: line.unit_price,
              line_amount: line.line_amount,
              // Customizations and special instructions
              customizations: lineProps.customizations || [],
              special_instructions: lineProps.special_instructions,
              allergen_notes: lineProps.allergen_notes,
              status: lineProps.status || 'pending',
              kitchen_notes: lineProps.kitchen_notes,
              estimated_ready: lineProps.estimated_ready
            }
          })
        )

        const transformedOrder = {
          id: order.id,
          order_number: order.transaction_code,
          transaction_date: order.transaction_date,
          status: order.status,
          total_amount: order.total_amount,
          // Order-specific properties from dynamic data
          order_type: dynamicProps.order_type || 'dine-in', // dine-in, takeout, delivery
          table_number: dynamicProps.table_number,
          customer_name: dynamicProps.customer_name,
          customer_phone: dynamicProps.customer_phone,
          special_instructions: dynamicProps.special_instructions,
          estimated_ready: dynamicProps.estimated_ready,
          actual_ready: dynamicProps.actual_ready,
          payment_method: dynamicProps.payment_method,
          payment_status: dynamicProps.payment_status || 'pending',
          // Kitchen Management
          kitchen_status: dynamicProps.kitchen_status || 'pending', // pending, preparing, ready, served
          prep_start_time: dynamicProps.prep_start_time,
          prep_end_time: dynamicProps.prep_end_time,
          server_assigned: dynamicProps.server_assigned,
          // Customer information
          customer: customerInfo,
          // Line items (conditionally included)
          items: includeItems ? transformedLines : undefined,
          item_count: transformedLines.length,
          // Analytics for B2B
          prep_time_actual: dynamicProps.prep_time_actual,
          customer_satisfaction: dynamicProps.customer_satisfaction
        }

        // Filter sensitive information for customer view
        if (customerView) {
          return {
            id: transformedOrder.id,
            order_number: transformedOrder.order_number,
            transaction_date: transformedOrder.transaction_date,
            status: transformedOrder.status,
            total_amount: transformedOrder.total_amount,
            order_type: transformedOrder.order_type,
            estimated_ready: transformedOrder.estimated_ready,
            kitchen_status: transformedOrder.kitchen_status,
            items: transformedOrder.items,
            item_count: transformedOrder.item_count
          }
        }

        return transformedOrder
      })
    )

    // Group orders by status for KDS view
    const ordersByStatus = {
      pending: transformedOrders.filter(o => o.kitchen_status === 'pending'),
      preparing: transformedOrders.filter(o => o.kitchen_status === 'preparing'),
      ready: transformedOrders.filter(o => o.kitchen_status === 'ready'),
      served: transformedOrders.filter(o => o.kitchen_status === 'served'),
      all: transformedOrders
    }

    return NextResponse.json({
      success: true,
      data: transformedOrders,
      grouped: ordersByStatus,
      count: transformedOrders.length,
      analytics: {
        total_revenue: transformedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        avg_order_value:
          transformedOrders.length > 0
            ? transformedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0) /
              transformedOrders.length
            : 0,
        avg_prep_time:
          transformedOrders.filter(o => o.prep_time_actual).length > 0
            ? transformedOrders
                .filter(o => o.prep_time_actual)
                .reduce((sum, o) => sum + o.prep_time_actual, 0) /
              transformedOrders.filter(o => o.prep_time_actual).length
            : 0
      },
      smart_code: 'HERA.REST.ORDERS.API.READ.COMPLETE.V1'
    })
  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organization_id,
      items, // Array of { menu_item_id, quantity, customizations, special_instructions }
      customer_info, // { name, phone, email }
      order_type = 'dine-in', // dine-in, takeout, delivery
      table_number,
      special_instructions,
      payment_method = 'cash'
    } = body

    if (!organization_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'Organization ID and items are required' }, { status: 400 })
    }

    // Calculate total amount
    let totalAmount = 0
    const processedItems = []

    for (const item of items) {
      // Get menu item details
      const { data: menuItem } = await supabase
        .from('core_entities')
        .select('*, core_dynamic_data(*)')
        .eq('id', item.menu_item_id)
        .eq('entity_type', 'menu_item')
        .single()

      if (!menuItem) {
        return NextResponse.json(
          { error: `Menu item ${item.menu_item_id} not found` },
          { status: 400 }
        )
      }

      const price =
        menuItem.core_dynamic_data?.find(d => d.field_name === 'price')?.field_value_number || 0
      const lineAmount = price * item.quantity

      processedItems.push({
        ...item,
        unit_price: price,
        line_amount: lineAmount,
        menu_name: menuItem.entity_name
      })

      totalAmount += lineAmount
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`
    const estimatedReady = new Date()
    estimatedReady.setMinutes(estimatedReady.getMinutes() + 25) // Average 25 min prep time

    // Create customer entity if customer_info provided
    let customerId = null
    if (customer_info?.phone) {
      // Check if customer exists
      const { data: existingCustomer } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', organization_id)
        .eq('entity_type', 'customer')
        .eq('entity_code', customer_info.phone)
        .single()

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        // Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from('core_entities')
          .insert({
            organization_id,
            entity_type: 'customer',
            entity_name: customer_info.name || 'Walk-in Customer',
            entity_code: customer_info.phone,
            smart_code: 'HERA.REST.CUSTOMER.WALKIN.v1',
            status: 'active'
          })
          .select()
          .single()

        if (!customerError) {
          customerId = newCustomer.id

          // Add customer dynamic data
          const customerData = []
          if (customer_info.phone) {
            customerData.push({
              entity_id: customerId,
              field_name: 'phone',
              field_value_text: customer_info.phone,
              smart_code: 'HERA.REST.CUSTOMER.PHONE.v1'
            })
          }
          if (customer_info.email) {
            customerData.push({
              entity_id: customerId,
              field_name: 'email',
              field_value_text: customer_info.email,
              smart_code: 'HERA.REST.CUSTOMER.EMAIL.v1'
            })
          }

          if (customerData.length > 0) {
            await supabase.from('core_dynamic_data').insert(customerData)
          }
        }
      }
    }

    // Create order transaction
    const { data: orderTransaction, error: orderError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id,
        transaction_type: 'order',
        transaction_code: orderNumber,
        transaction_date: new Date().toISOString(),
        reference_entity_id: customerId,
        total_amount: totalAmount,
        status: 'confirmed',
        smart_code: `HERA.REST.ORDER.${order_type.toUpperCase()}.v1`
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Create order line items
    const lineItems = processedItems.map((item, index) => ({
      transaction_id: orderTransaction.id,
      line_number: index + 1,
      line_entity_id: item.menu_item_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_amount: item.line_amount,
      smart_code: 'HERA.REST.ORDER.LINE.v1'
    }))

    const { error: linesError } = await supabase
      .from('universal_transaction_lines')
      .insert(lineItems)

    if (linesError) {
      console.error('Order lines creation error:', linesError)
      // Clean up order
      await supabase.from('universal_transactions').delete().eq('id', orderTransaction.id)
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
    }

    // Create order dynamic data
    const orderDynamicData = [
      {
        entity_id: orderTransaction.id,
        field_name: 'order_type',
        field_value_text: order_type,
        smart_code: 'HERA.REST.ORDER.TYPE.v1'
      },
      {
        entity_id: orderTransaction.id,
        field_name: 'kitchen_status',
        field_value_text: 'pending',
        smart_code: 'HERA.REST.ORDER.KITCHEN.STATUS.V1'
      },
      {
        entity_id: orderTransaction.id,
        field_name: 'payment_method',
        field_value_text: payment_method,
        smart_code: 'HERA.REST.ORDER.PAYMENT.METHOD.V1'
      },
      {
        entity_id: orderTransaction.id,
        field_name: 'payment_status',
        field_value_text: payment_method === 'cash' ? 'pending' : 'completed',
        smart_code: 'HERA.REST.ORDER.PAYMENT.STATUS.V1'
      },
      {
        entity_id: orderTransaction.id,
        field_name: 'estimated_ready',
        field_value_text: estimatedReady.toISOString(),
        smart_code: 'HERA.REST.ORDER.ESTIMATED.READY.V1'
      }
    ]

    // Add optional fields
    if (table_number) {
      orderDynamicData.push({
        entity_id: orderTransaction.id,
        field_name: 'table_number',
        field_value_text: table_number,
        smart_code: 'HERA.REST.ORDER.TABLE.v1'
      })
    }

    if (customer_info?.name) {
      orderDynamicData.push({
        entity_id: orderTransaction.id,
        field_name: 'customer_name',
        field_value_text: customer_info.name,
        smart_code: 'HERA.REST.ORDER.CUSTOMER.NAME.V1'
      })
    }

    if (customer_info?.phone) {
      orderDynamicData.push({
        entity_id: orderTransaction.id,
        field_name: 'customer_phone',
        field_value_text: customer_info.phone,
        smart_code: 'HERA.REST.ORDER.CUSTOMER.PHONE.V1'
      })
    }

    if (special_instructions) {
      orderDynamicData.push({
        entity_id: orderTransaction.id,
        field_name: 'special_instructions',
        field_value_text: special_instructions,
        smart_code: 'HERA.REST.ORDER.INSTRUCTIONS.v1'
      })
    }

    await supabase.from('core_dynamic_data').insert(orderDynamicData)

    return NextResponse.json({
      success: true,
      data: {
        id: orderTransaction.id,
        order_number: orderNumber,
        total_amount: totalAmount,
        estimated_ready: estimatedReady,
        status: 'confirmed',
        kitchen_status: 'pending',
        items: processedItems.map(item => ({
          menu_name: item.menu_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_amount: item.line_amount
        }))
      },
      message: 'Order created successfully',
      smart_code: 'HERA.REST.ORDERS.API.CREATE.V1'
    })
  } catch (error) {
    console.error('Order creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update order status (for KDS and POS operations)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      order_id,
      organization_id,
      status,
      kitchen_status,
      payment_status,
      server_assigned,
      prep_start_time,
      prep_end_time,
      customer_satisfaction
    } = body

    if (!order_id || !organization_id) {
      return NextResponse.json(
        { error: 'Order ID and organization ID are required' },
        { status: 400 }
      )
    }

    // Update transaction status if provided
    if (status) {
      await supabase
        .from('universal_transactions')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', order_id)
        .eq('organization_id', organization_id)
    }

    // Update dynamic fields
    const fieldsToUpdate = {
      kitchen_status,
      payment_status,
      server_assigned,
      prep_start_time,
      prep_end_time,
      customer_satisfaction
    }

    for (const [fieldName, value] of Object.entries(fieldsToUpdate)) {
      if (value !== undefined) {
        await supabase.from('core_dynamic_data').upsert({
          entity_id: order_id,
          field_name: fieldName,
          field_value_text: value?.toString(),
          smart_code: `HERA.REST.ORDER.${fieldName.toUpperCase()}.v1`
        })
      }
    }

    // Auto-calculate prep time if both start and end provided
    if (prep_start_time && prep_end_time) {
      const startTime = new Date(prep_start_time)
      const endTime = new Date(prep_end_time)
      const prepTimeMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

      await supabase.from('core_dynamic_data').upsert({
        entity_id: order_id,
        field_name: 'prep_time_actual',
        field_value_integer: prepTimeMinutes,
        smart_code: 'HERA.REST.ORDER.PREP.TIME.ACTUAL.V1'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      smart_code: 'HERA.REST.ORDERS.API.UPDATE.V1'
    })
  } catch (error) {
    console.error('Order update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
