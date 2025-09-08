#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const organizationId = process.env.DEFAULT_ORGANIZATION_ID || 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258' // Use env or default

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createKitchenOrder() {
  try {
    // Sample menu items with stations
    const menuItems = [
      { name: 'Margherita Pizza', price: 18.50, station: 'STATION-PIZZA' },
      { name: 'Caesar Salad', price: 12.00, station: 'STATION-COLD' },
      { name: 'Grilled Salmon', price: 28.00, station: 'STATION-GRILL' },
      { name: 'Tiramisu', price: 8.50, station: 'STATION-DESSERT' },
      { name: 'Bruschetta', price: 10.00, station: 'STATION-COLD' },
      { name: 'Spaghetti Carbonara', price: 22.00, station: 'STATION-GRILL' }
    ]
    
    // Random table and priority
    const tableNumber = Math.floor(Math.random() * 20) + 1
    const priorities = ['normal', 'normal', 'normal', 'rush', 'vip'] // 80% normal
    const priority = priorities[Math.floor(Math.random() * priorities.length)]
    
    // Select 1-4 random items
    const itemCount = Math.floor(Math.random() * 3) + 1
    const selectedItems = []
    let totalAmount = 0
    
    for (let i = 0; i < itemCount; i++) {
      const item = menuItems[Math.floor(Math.random() * menuItems.length)]
      const quantity = Math.floor(Math.random() * 2) + 1
      selectedItems.push({ ...item, quantity })
      totalAmount += item.price * quantity
    }
    
    // Create the order transaction
    const { data: transaction, error: txError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'sale',
        transaction_code: `SALE-${Date.now()}`,
        smart_code: 'HERA.RESTAURANT.FOH.ORDER.NEW.v1',
        total_amount: totalAmount,
        transaction_date: new Date().toISOString(),
        metadata: {
          table_number: tableNumber.toString(),
          server_name: ['Maria', 'John', 'Sarah'][Math.floor(Math.random() * 3)],
          order_type: 'dine-in',
          priority: priority,
          status: 'new',
          special_instructions: Math.random() > 0.8 ? 'Birthday celebration - bring dessert with candle' : null
        }
      })
      .select()
      .single()
    
    if (txError) throw txError
    
    console.log(`✅ Created order ${transaction.transaction_code} for table ${tableNumber}`)
    console.log(`   Total: $${totalAmount.toFixed(2)} | Priority: ${priority}`)
    
    // Create line items
    const lineItems = selectedItems.map((item, index) => ({
      transaction_id: transaction.id,
      organization_id: organizationId,
      line_number: index + 1,
      line_type: 'product',
      quantity: item.quantity,
      unit_amount: item.price,
      line_amount: item.price * item.quantity,
      smart_code: 'HERA.RESTAURANT.FOH.ORDER.LINE.ITEM.v1',
      line_data: {
        item_name: item.name,
        station: item.station,
        modifiers: Math.random() > 0.7 ? ['Extra cheese', 'No onions'] : null,
        special_requests: Math.random() > 0.9 ? 'Well done' : null
      }
    }))
    
    const { error: lineError } = await supabase
      .from('universal_transaction_lines')
      .insert(lineItems)
    
    if (lineError) throw lineError
    
    console.log(`   Added ${lineItems.length} items:`)
    lineItems.forEach(item => {
      console.log(`   - ${item.quantity}x ${item.line_data.item_name} ($${item.line_amount.toFixed(2)})`)
    })
    
    return transaction
    
  } catch (error) {
    console.error('Error creating kitchen order:', error)
    throw error
  }
}

// Create multiple orders if requested
async function main() {
  const count = parseInt(process.argv[2]) || 1
  
  console.log(`Creating ${count} kitchen order(s) for organization: ${organizationId}`)
  console.log(`Using transaction prefix: SALE-\\n`)
  
  for (let i = 0; i < count; i++) {
    await createKitchenOrder()
    console.log('')
    
    // Small delay between orders
    if (i < count - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  console.log('\\n✨ Done! Check the kitchen display at http://localhost:3001/restaurant/kitchen')
}

main().catch(console.error)