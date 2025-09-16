import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/src/lib/supabase-admin'

// POST /api/v1/seed-orders - Create sample order data for Mario's Restaurant
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID

    // Sample menu item IDs (these should exist in core_entities)
    const menuItems = [
      { id: '550e8400-e29b-41d4-a716-446655440010', name: 'Margherita Pizza', price: 18.5 },
      { id: '550e8400-e29b-41d4-a716-446655440011', name: 'Caesar Salad', price: 14.5 },
      { id: '550e8400-e29b-41d4-a716-446655440012', name: 'Lasagna Bolognese', price: 22.0 },
      { id: '550e8400-e29b-41d4-a716-446655440013', name: 'Tiramisu', price: 8.5 },
      { id: '550e8400-e29b-41d4-a716-446655440014', name: 'House Wine', price: 6.25 }
    ]

    // Create sample orders
    const sampleOrders = [
      {
        customer_name: 'Anna Rossi',
        table_number: 'Table 5',
        order_type: 'dine_in',
        status: 'pending',
        items: [
          { menu_item: menuItems[0], quantity: 2 },
          { menu_item: menuItems[1], quantity: 1 },
          { menu_item: menuItems[4], quantity: 2 }
        ],
        special_instructions: 'One pizza gluten-free please'
      },
      {
        customer_name: 'Marco Ferrari',
        table_number: 'Table 2',
        order_type: 'dine_in',
        status: 'processing',
        items: [
          { menu_item: menuItems[2], quantity: 1 },
          { menu_item: menuItems[3], quantity: 1 }
        ],
        special_instructions: null
      },
      {
        customer_name: 'Sofia Bianchi',
        table_number: 'Counter',
        order_type: 'takeout',
        status: 'approved',
        items: [
          { menu_item: menuItems[0], quantity: 1 },
          { menu_item: menuItems[1], quantity: 1 }
        ],
        special_instructions: 'Extra dressing on the side'
      },
      {
        customer_name: 'Giuseppe Verdi',
        table_number: 'Table 8',
        order_type: 'dine_in',
        status: 'pending',
        items: [
          { menu_item: menuItems[2], quantity: 1 },
          { menu_item: menuItems[4], quantity: 3 }
        ],
        special_instructions: 'No garlic in the lasagna'
      }
    ]

    const createdOrders = []

    for (const order of sampleOrders) {
      // Calculate total
      const total_amount = order.items.reduce(
        (sum, item) => sum + item.quantity * item.menu_item.price,
        0
      )

      // Generate reference number
      const reference_number = `ORD-${new Date().getFullYear()}-${String(Date.now() + Math.random() * 1000).slice(-6)}`
      const transaction_number = `TXN-${String(Date.now() + Math.random() * 1000).slice(-6)}`

      // Create transaction
      const { data: transaction, error: transactionError } = await supabaseAdmin
        .from('universal_transactions')
        .insert({
          organization_id: organizationId,
          transaction_type: 'order',
          transaction_number,
          reference_number,
          transaction_date: new Date().toISOString(),
          total_amount,
          status: order.status,
          transaction_data: {
            customer_name: order.customer_name,
            table_number: order.table_number,
            order_type: order.order_type,
            special_instructions: order.special_instructions,
            server_name: 'Mario',
            payment_status: 'pending'
          },
          notes: order.special_instructions
        })
        .select()
        .single()

      if (transactionError) {
        console.error('Error creating transaction:', transactionError)
        continue
      }

      // Create transaction lines
      const lineItems = order.items.map((item, index) => ({
        transaction_id: transaction.id,
        organization_id: organizationId,
        line_order: index + 1,
        entity_id: item.menu_item.id,
        line_description: item.menu_item.name,
        quantity: item.quantity,
        unit_price: item.menu_item.price,
        line_amount: item.quantity * item.menu_item.price,
        metadata: {
          prep_time: 15,
          status: 'pending',
          modifications: [],
          special_instructions: null
        }
      }))

      const { error: linesError } = await supabaseAdmin
        .from('universal_transaction_lines')
        .insert(lineItems)

      if (linesError) {
        console.error('Error creating transaction lines:', linesError)
        continue
      }

      createdOrders.push({
        id: transaction.id,
        reference_number,
        customer_name: order.customer_name,
        total_amount,
        status: order.status
      })
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdOrders.length} sample orders for Mario's Restaurant`,
      data: createdOrders
    })
  } catch (error) {
    console.error('Seed orders error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
