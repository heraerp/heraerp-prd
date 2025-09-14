require('dotenv').config()
const { SupabaseClient } = require('./lib/supabase-client')

const ORGANIZATION_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'

// Customer mappings
const customers = [
  { id: '8704112f-3536-40da-a867-1ced0337694c', name: 'Marriott Hotels Kerala' },
  { id: '5dfd1dbd-da16-4f92-a20e-b4194e142258', name: 'ITC Grand Chola' },
  { id: '81117852-7ced-4aad-86bf-d37323f6e914', name: 'Corporate Office Solutions' },
  { id: 'a82d9c94-3ee2-4c23-a78b-add5596a300a', name: 'Modern Homes Interior' },
  { id: '8fc09280-7665-436b-b9d2-9a9a4a138a00', name: 'Office Solutions Ltd' },
  { id: '132cceff-4d06-4307-a8e7-8f05316b3186', name: 'Home Decor Mart' }
]

// Product mappings with prices
const products = [
  { id: '9e0968ff-f0a3-48cb-bf1d-1b01063ed00d', name: 'King Size Bed with Storage', price: 45000 },
  { id: 'dc878fe1-58f2-4f2c-a6f0-86d29815c279', name: 'Executive Office Chair', price: 12000 },
  { id: 'ebc20eae-83a5-4c08-86ac-4c0673e7382f', name: 'Ergonomic High-Back Office Chair', price: 15000 },
  { id: '61474135-619a-4e62-884a-fde380a07a9d', name: 'Dining Chair - Solid Oak', price: 8000 },
  { id: '20ef4be8-ce42-4a78-bad6-14b79425d7e0', name: '4-Drawer Filing Cabinet', price: 18000 },
  { id: '1a4091aa-5599-4fe8-bfec-585c048f3737', name: 'Queen Size Platform Bed', price: 35000 },
  { id: '19e35f7b-35b6-4e7c-8916-1a75e6902664', name: 'Kids Bunk Bed', price: 28000 }
]

// Generate transaction code
function generateTransactionCode(index) {
  const date = new Date()
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
  return `PO-${dateStr}-${String(index).padStart(4, '0')}`
}

// Production orders configuration
const productionOrders = [
  {
    customer: customers[0], // Marriott Hotels
    status: 'completed',
    priority: 'high',
    start_date: '2025-01-05',
    expected_completion: '2025-01-20',
    actual_completion: '2025-01-18',
    items: [
      { product: products[0], quantity: 20, unit_price: 42000 }, // King Size Beds (bulk discount)
      { product: products[1], quantity: 50, unit_price: 11000 }  // Executive Chairs (bulk discount)
    ]
  },
  {
    customer: customers[1], // ITC Grand Chola
    status: 'in_progress',
    priority: 'urgent',
    start_date: '2025-01-08',
    expected_completion: '2025-01-25',
    progress_percentage: 65,
    items: [
      { product: products[2], quantity: 30, unit_price: 14000 }, // Ergonomic Chairs
      { product: products[3], quantity: 100, unit_price: 7500 }, // Dining Chairs (bulk discount)
      { product: products[4], quantity: 10, unit_price: 17000 }  // Filing Cabinets
    ]
  },
  {
    customer: customers[2], // Corporate Office Solutions
    status: 'pending',
    priority: 'normal',
    start_date: '2025-01-15',
    expected_completion: '2025-02-05',
    items: [
      { product: products[1], quantity: 25, unit_price: 11500 }, // Executive Chairs
      { product: products[4], quantity: 15, unit_price: 17500 }  // Filing Cabinets
    ]
  },
  {
    customer: customers[3], // Modern Homes Interior
    status: 'in_progress',
    priority: 'high',
    start_date: '2025-01-10',
    expected_completion: '2025-01-28',
    progress_percentage: 35,
    items: [
      { product: products[5], quantity: 5, unit_price: 35000 },  // Queen Beds
      { product: products[6], quantity: 8, unit_price: 28000 },  // Kids Bunk Beds
      { product: products[3], quantity: 20, unit_price: 8000 }   // Dining Chairs
    ]
  },
  {
    customer: customers[4], // Office Solutions Ltd
    status: 'cancelled',
    priority: 'low',
    start_date: '2025-01-01',
    expected_completion: '2025-01-15',
    cancellation_reason: 'Customer budget constraints',
    cancelled_date: '2025-01-03',
    items: [
      { product: products[1], quantity: 10, unit_price: 12000 }, // Executive Chairs
      { product: products[4], quantity: 5, unit_price: 18000 }   // Filing Cabinets
    ]
  },
  {
    customer: customers[5], // Home Decor Mart
    status: 'pending',
    priority: 'normal',
    start_date: '2025-01-20',
    expected_completion: '2025-02-10',
    items: [
      { product: products[0], quantity: 3, unit_price: 45000 },  // King Size Beds
      { product: products[5], quantity: 5, unit_price: 35000 },  // Queen Beds
      { product: products[6], quantity: 10, unit_price: 26000 }  // Kids Bunk Beds (bulk discount)
    ]
  }
]

async function createProductionOrders() {
  const client = new SupabaseClient()

  console.log('🏭 Creating Production Orders for Kerala Furniture Works...\n')

  for (let i = 0; i < productionOrders.length; i++) {
    const order = productionOrders[i]
    const transactionCode = generateTransactionCode(i + 1)
    
    // Calculate total amount
    const totalAmount = order.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0
    )

    // Prepare metadata
    const metadata = {
      status: order.status,
      priority: order.priority,
      start_date: order.start_date,
      expected_completion: order.expected_completion,
      customer_name: order.customer.name,
      production_notes: `Production order for ${order.customer.name}`,
      ...(order.actual_completion && { actual_completion: order.actual_completion }),
      ...(order.progress_percentage && { progress_percentage: order.progress_percentage }),
      ...(order.cancellation_reason && { cancellation_reason: order.cancellation_reason }),
      ...(order.cancelled_date && { cancelled_date: order.cancelled_date })
    }

    // Create transaction
    const transaction = {
      organization_id: ORGANIZATION_ID,
      transaction_type: 'production_order',
      transaction_code: transactionCode,
      transaction_date: new Date().toISOString(),
      smart_code: 'HERA.FURNITURE.PRODUCTION.ORDER.v1',
      from_entity_id: order.customer.id,
      total_amount: totalAmount,
      metadata: metadata
    }

    console.log(`📋 Creating Production Order: ${transactionCode}`)
    console.log(`   Customer: ${order.customer.name}`)
    console.log(`   Status: ${order.status}`)
    console.log(`   Priority: ${order.priority}`)
    console.log(`   Total: ₹${totalAmount.toLocaleString()}`)

    // Insert transaction
    const { data: txData, error: txError } = await client.client
      .from('universal_transactions')
      .insert(transaction)
      .select()
      .single()

    if (txError) {
      console.error('❌ Error creating transaction:', txError)
      continue
    }

    // Create transaction lines
    const lines = order.items.map((item, index) => ({
      transaction_id: txData.id,
      line_number: index + 1,
      line_entity_id: item.product.id,
      description: `${item.product.name} - Qty: ${item.quantity}`,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_amount: item.quantity * item.unit_price,
      smart_code: 'HERA.FURNITURE.PRODUCTION.LINE.v1',
      metadata: {
        product_name: item.product.name,
        production_status: order.status === 'in_progress' ? 'manufacturing' : order.status
      }
    }))

    const { error: lineError } = await client.client
      .from('universal_transaction_lines')
      .insert(lines)

    if (lineError) {
      console.error('❌ Error creating lines:', lineError)
    } else {
      console.log(`   ✅ Created ${lines.length} line items\n`)
    }
  }

  console.log('✨ Production orders created successfully!')
}

// Run the creation
createProductionOrders().catch(console.error)