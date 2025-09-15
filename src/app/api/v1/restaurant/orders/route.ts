import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /api/v1/restaurant/orders - Fetch orders using HERA universal_transactions
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Get organization_id from mock context (in production, extract from JWT)
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID

    // Get orders from universal_transactions where transaction_type = 'sale' (restaurant orders)
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .in('transaction_type', ['order', 'sale']) // Include both order and sale types for restaurant orders
      .order('transaction_date', { ascending: false })
      .limit(50) // Limit to recent orders

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    // Get order line items
    const orderIds = orders.map(order => order.id)
    const { data: orderLines, error: linesError } = await supabaseAdmin
      .from('universal_transaction_lines')
      .select(
        `
        *,
        menu_item:core_entities!universal_transaction_lines_entity_id_fkey(entity_name)
      `
      )
      .in('transaction_id', orderIds)

    if (linesError) {
      console.error('Error fetching order lines:', linesError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch order items' },
        { status: 500 }
      )
    }

    // For now, we'll use mock customer data since transaction_data is not available
    const customers = []

    // Combine orders with their line items - simplified version
    const ordersWithDetails = orders.map(order => {
      const orderLinesForOrder = orderLines.filter(line => line.transaction_id === order.id)

      // Format order items
      const items = orderLinesForOrder.map(line => ({
        id: line.id,
        menu_item_name: line.menu_item?.entity_name || 'Unknown Item',
        quantity: line.quantity || 0,
        unit_price: line.unit_price || 0,
        line_total: line.line_total || line.quantity * line.unit_price || 0,
        special_instructions: null,
        modifications: []
      }))

      return {
        id: order.id,
        reference_number: order.reference_number,
        transaction_type: 'dine_in', // Default for now
        customer_name: 'Walk-in Customer', // Default for now
        table_number: `Table ${Math.floor(Math.random() * 12) + 1}`, // Mock table number
        phone: null,
        address: null,
        order_time: new Date(order.transaction_date),
        estimated_ready_time: new Date(new Date(order.transaction_date).getTime() + 20 * 60000), // 20 mins estimate
        status: order.status,
        total_amount: order.total_amount,
        payment_status: 'pending', // Default for now
        server_name: 'Server', // Default for now
        items,
        special_notes: null
      }
    })

    return NextResponse.json({
      success: true,
      data: ordersWithDetails,
      count: ordersWithDetails.length
    })
  } catch (error) {
    console.error('Restaurant orders API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/v1/restaurant/orders/[id] - Update order status
export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const body = await request.json()
    const { orderId, status } = body
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID

    // Update order status
    const { error: updateError } = await supabaseAdmin
      .from('universal_transactions')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('organization_id', organizationId)

    if (updateError) {
      console.error('Error updating order status:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update order status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully'
    })
  } catch (error) {
    console.error('Update order status error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/v1/restaurant/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const body = await request.json()
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID

    const { customer_id, table_id, order_type, items, special_notes, server_name } = body

    // Calculate total
    const total_amount = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unit_price,
      0
    )

    // Generate reference number and transaction number
    const reference_number = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
    const transaction_number = `TXN-${String(Date.now()).slice(-6)}`

    // Create transaction with Smart Code for auto-posting
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'sale', // Changed to 'sale' for revenue recognition
        transaction_date: new Date().toISOString(),
        reference_number,
        transaction_number,
        total_amount,
        currency: 'USD',
        status: 'pending', // New orders start as pending for kitchen workflow
        smart_code: 'HERA.REST.SALE.ORDER.v1', // Smart Code triggers auto-posting
        metadata: {
          order_type: order_type || 'dine_in',
          customer_id: customer_id,
          table_id: table_id,
          server_name: server_name,
          special_notes: special_notes,
          created_via: 'restaurant_pos',
          auto_gl_posting: true
        }
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Error creating order transaction:', transactionError)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create order',
          error: transactionError.message || transactionError
        },
        { status: 500 }
      )
    }

    // Create order line items with required fields
    const lineItems = items.map((item: any, index: number) => {
      // Only use entity_id if it's a valid UUID format
      const isUUID =
        item.menu_item_id &&
        item.menu_item_id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        )

      return {
        transaction_id: transaction.id,
        organization_id: organizationId,
        entity_id: isUUID ? item.menu_item_id : null,
        line_description: item.menu_item_name || 'Restaurant Order Item',
        line_order: index + 1,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        line_amount: (item.quantity || 1) * (item.unit_price || 0),
        metadata: {
          menu_item_name: item.menu_item_name,
          menu_item_id: item.menu_item_id, // Store original ID in metadata
          special_instructions: item.special_notes || null,
          order_type: order_type || 'dine_in'
        }
      }
    })

    const { error: linesError } = await supabaseAdmin
      .from('universal_transaction_lines')
      .insert(lineItems)

    if (linesError) {
      console.error('Error creating order lines:', linesError)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create order items',
          error: linesError.message || linesError
        },
        { status: 500 }
      )
    }

    // Wait a moment for auto-posting trigger to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check if journal entry was created by auto-posting system
    const { data: journalEntries, error: journalError } = await supabaseAdmin
      .from('universal_transactions')
      .select('reference_number, metadata')
      .eq('transaction_type', 'journal_entry')
      .ilike('reference_number', `JE-${reference_number}%`)
      .limit(1)

    const journalEntry = journalEntries && journalEntries.length > 0 ? journalEntries[0] : null

    return NextResponse.json({
      success: true,
      data: {
        id: transaction.id,
        reference_number,
        transaction_number,
        total_amount,
        status: 'completed',
        smart_code: 'HERA.REST.SALE.ORDER.v1',
        gl_posting: {
          required: true,
          journal_entry_created: !!journalEntry,
          journal_reference: journalEntry?.reference_number || null,
          auto_posted: (transaction.metadata as any)?.gl_posting_required === 'true'
        },
        items_count: items.length,
        order_type: order_type || 'dine_in'
      },
      message: `Restaurant order created successfully${journalEntry ? ' with automatic GL posting' : ''}`
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
