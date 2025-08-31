#!/usr/bin/env node

/**
 * Create POS Sale Transaction for Kochi Ice Cream
 * This completes the cycle from production to customer sale
 * Demonstrates GST calculation, inventory deduction, and journal posting
 */

require('dotenv').config({ path: '../.env' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'

async function createPOSSale() {
  console.log('🛍️ Creating POS Sale at MG Road Outlet...\n')
  
  try {
    // Get entities
    const { data: outlet } = await supabase
      .from('core_entities')
      .select('id, entity_name, metadata')
      .eq('organization_id', ORG_ID)
      .eq('entity_code', 'OUTLET-MGROAD')
      .single()
      
    // Get products for sale
    const { data: products } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORG_ID)
      .in('entity_code', ['SKU-VAN-500ML', 'SKU-MANGO-100ML', 'SKU-CHOCO-CONE'])
      
    console.log('🏪 Location:', outlet?.entity_name)
    console.log('📅 Date:', new Date().toLocaleDateString('en-IN'))
    console.log('⏰ Time:', new Date().toLocaleTimeString('en-IN'))
    
    // Create POS sale transaction
    const billNumber = `BILL-${Date.now().toString().slice(-8)}`
    const saleDate = new Date()
    
    // Calculate sale items
    const saleItems = [
      {
        product: products?.find(p => p.entity_code === 'SKU-VAN-500ML'),
        quantity: 3,
        mrp: 150
      },
      {
        product: products?.find(p => p.entity_code === 'SKU-MANGO-100ML'),
        quantity: 5,
        mrp: 50
      },
      {
        product: products?.find(p => p.entity_code === 'SKU-CHOCO-CONE'),
        quantity: 2,
        mrp: 40
      }
    ]
    
    // Calculate totals with GST
    let subtotal = 0
    let gstAmount = 0
    const gstRate = 18 // 18% GST for ice cream
    
    console.log('\n📋 Sale Items:')
    console.log('─'.repeat(60))
    
    saleItems.forEach(item => {
      const lineTotal = item.quantity * item.mrp
      subtotal += lineTotal
      console.log(`${item.product?.entity_name}`)
      console.log(`  ${item.quantity} × ₹${item.mrp} = ₹${lineTotal}`)
    })
    
    // GST calculation (tax inclusive price)
    const baseAmount = subtotal / (1 + gstRate/100)
    gstAmount = subtotal - baseAmount
    
    console.log('─'.repeat(60))
    console.log(`Subtotal: ₹${subtotal.toFixed(2)}`)
    console.log(`GST (${gstRate}%): ₹${gstAmount.toFixed(2)}`)
    console.log(`Total: ₹${subtotal.toFixed(2)}`)
    
    // Create the sale transaction
    const { data: saleTxn, error } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORG_ID,
        transaction_type: 'pos_sale',
        transaction_code: billNumber,
        transaction_date: saleDate.toISOString().slice(0,10),
        source_entity_id: outlet?.id,
        smart_code: 'HERA.FOODDAIRY.POS.SALE.OUTLET_MGROAD.V1',
        metadata: {
          bill_number: billNumber,
          outlet_code: 'OUTLET-MGROAD',
          pos_terminal: 'POS-01',
          cashier: 'Priya Sharma',
          sale_time: saleDate.toISOString(),
          payment_mode: 'UPI',
          payment_reference: 'UPI-' + Date.now().toString().slice(-10),
          customer_mobile: '9876543210',
          base_amount: baseAmount,
          gst_amount: gstAmount,
          gst_rate: gstRate,
          items_count: saleItems.reduce((sum, item) => sum + item.quantity, 0)
        },
        transaction_status: 'completed',
        total_amount: subtotal
      })
      .select()
      .single()
      
    if (error) throw error
    
    console.log(`\n✅ Sale recorded: ${billNumber}`)
    
    // Create transaction lines for each item sold
    let lineNumber = 1
    const costPerTub = 22.18 // Cost from production
    
    for (const item of saleItems) {
      if (!item.product) continue
      
      // Calculate line amounts
      const lineTotal = item.quantity * item.mrp
      const lineBase = lineTotal / (1 + gstRate/100)
      const lineGst = lineTotal - lineBase
      
      // Get cost based on product type
      let unitCost = costPerTub
      if (item.product.entity_code === 'SKU-MANGO-100ML') {
        unitCost = costPerTub * 0.2 // 100ml is 1/5th of 500ml
      } else if (item.product.entity_code === 'SKU-CHOCO-CONE') {
        unitCost = costPerTub * 0.15 // Cone is cheaper
      }
      
      await supabase
        .from('universal_transaction_lines')
        .insert({
          organization_id: ORG_ID,
          transaction_id: saleTxn.id,
          line_number: lineNumber++,
          entity_id: item.product.id,
          line_type: 'sale_item',
          description: `Sale of ${item.product.entity_name}`,
          quantity: -item.quantity, // Negative for inventory reduction
          unit_amount: item.mrp,
          line_amount: lineTotal,
          smart_code: 'HERA.FOODDAIRY.POS.LINE.SALE.V1',
          line_data: {
            lot_number: 'FG-VAN-2025-08-30-001', // FEFO picking
            unit_of_measure: item.product.metadata?.unit || 'EA',
            base_amount: lineBase,
            gst_amount: lineGst,
            gst_rate: gstRate,
            cost_of_goods: unitCost * item.quantity,
            margin_amount: lineBase - (unitCost * item.quantity),
            margin_percent: ((lineBase - (unitCost * item.quantity)) / lineBase * 100).toFixed(2)
          }
        })
    }
    
    console.log('\n💳 Payment Details:')
    console.log(`  Mode: UPI`)
    console.log(`  Reference: ${saleTxn.metadata.payment_reference}`)
    console.log(`  Status: Success ✅`)
    
    // Show journal entries
    console.log('\n📊 Journal Entries (Auto-generated by Digital Accountant):')
    console.log('\nSale Transaction:')
    console.log(`  DR: 1100 Cash and Bank              ₹${subtotal.toFixed(2)}`)
    console.log(`  CR: 4110 Ice Cream Sales - Retail   ₹${baseAmount.toFixed(2)}`)
    console.log(`  CR: 2210 GST Output                 ₹${gstAmount.toFixed(2)}`)
    
    // Calculate total COGS
    let totalCOGS = 0
    saleItems.forEach(item => {
      let unitCost = costPerTub
      if (item.product?.entity_code === 'SKU-MANGO-100ML') {
        unitCost = costPerTub * 0.2
      } else if (item.product?.entity_code === 'SKU-CHOCO-CONE') {
        unitCost = costPerTub * 0.15
      }
      totalCOGS += unitCost * item.quantity
    })
    
    console.log('\nCost of Goods Sold:')
    console.log(`  DR: 5100 Material Cost              ₹${totalCOGS.toFixed(2)}`)
    console.log(`  CR: 1330 Finished Goods Inventory   ₹${totalCOGS.toFixed(2)}`)
    
    // Print receipt
    console.log('\n' + '='.repeat(40))
    console.log('         KOCHI ICE CREAM')
    console.log('      MG Road Outlet, Kochi')
    console.log('       GSTIN: 32AABCK1234L1Z5')
    console.log('       Phone: +91 484 2345678')
    console.log('='.repeat(40))
    console.log(`Bill No: ${billNumber}`)
    console.log(`Date: ${saleDate.toLocaleDateString('en-IN')}`)
    console.log(`Time: ${saleDate.toLocaleTimeString('en-IN')}`)
    console.log(`Cashier: ${saleTxn.metadata.cashier}`)
    console.log('─'.repeat(40))
    console.log('ITEM                    QTY   RATE   AMOUNT')
    console.log('─'.repeat(40))
    
    saleItems.forEach(item => {
      const name = item.product?.entity_name?.substring(0, 20).padEnd(20, ' ')
      const qty = item.quantity.toString().padStart(3, ' ')
      const rate = item.mrp.toFixed(2).padStart(6, ' ')
      const amount = (item.quantity * item.mrp).toFixed(2).padStart(7, ' ')
      console.log(`${name} ${qty} ${rate} ${amount}`)
    })
    
    console.log('─'.repeat(40))
    console.log(`TOTAL ITEMS: ${saleItems.reduce((sum, item) => sum + item.quantity, 0)}`)
    console.log(`BASE AMOUNT:`.padEnd(32, ' ') + `₹${baseAmount.toFixed(2)}`.padStart(8, ' '))
    console.log(`GST @ ${gstRate}%:`.padEnd(32, ' ') + `₹${gstAmount.toFixed(2)}`.padStart(8, ' '))
    console.log('─'.repeat(40))
    console.log(`TOTAL:`.padEnd(32, ' ') + `₹${subtotal.toFixed(2)}`.padStart(8, ' '))
    console.log('─'.repeat(40))
    console.log(`Payment Mode: UPI`)
    console.log(`Mobile: ${saleTxn.metadata.customer_mobile}`)
    console.log('='.repeat(40))
    console.log('     Thank you! Visit Again!')
    console.log('='.repeat(40))
    
    // Show profitability
    const grossProfit = baseAmount - totalCOGS
    const grossMargin = (grossProfit / baseAmount * 100).toFixed(2)
    
    console.log('\n💰 Sale Profitability:')
    console.log(`  Revenue (ex GST): ₹${baseAmount.toFixed(2)}`)
    console.log(`  Cost of Goods: ₹${totalCOGS.toFixed(2)}`)
    console.log(`  Gross Profit: ₹${grossProfit.toFixed(2)}`)
    console.log(`  Gross Margin: ${grossMargin}%`)
    
    return saleTxn
    
  } catch (error) {
    console.error('❌ Error in POS sale:', error.message)
  }
}

// Run if called directly
if (require.main === module) {
  createPOSSale()
}

module.exports = { createPOSSale }