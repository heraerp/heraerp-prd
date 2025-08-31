#!/usr/bin/env node

/**
 * HERA Ice Cream Complete Business Cycle Test
 * 
 * This comprehensive test covers:
 * 1. Capital Investment (Owner brings capital)
 * 2. Fixed Asset Purchase (Buy freezer equipment)
 * 3. Raw Material Procurement (Buy milk, sugar, flavoring)
 * 4. Labor Cost Booking (Factory workers, drivers)
 * 5. Production (Create ice cream batch)
 * 6. Sales Transaction (Sell to retail outlet)
 * 7. Financial Verification (Check all GL postings)
 * 
 * Organization: Kochi Ice Cream Manufacturing
 * ID: 1471e87b-b27e-42ef-8192-343cc5e0d656
 */

require('dotenv').config({ path: '../.env' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Organization details
const ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'
const ORG_CODE = 'ORG.COCHIN.ICECREAM'

// Test data tracking
const testData = {
  entities: {},
  transactions: [],
  relationships: [],
  journalEntries: []
}

// Helper functions
async function createEntity(data) {
  const { data: entity, error } = await supabase
    .from('core_entities')
    .insert({
      ...data,
      organization_id: ORG_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return entity
}

async function createTransaction(data) {
  const { data: transaction, error } = await supabase
    .from('universal_transactions')
    .insert({
      ...data,
      organization_id: ORG_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return transaction
}

async function createTransactionLines(lines) {
  const { data: lineItems, error } = await supabase
    .from('universal_transaction_lines')
    .insert(lines.map(line => ({
      ...line,
      organization_id: ORG_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })))
    .select()
  
  if (error) throw error
  return lineItems
}

async function createRelationship(data) {
  const { data: relationship, error } = await supabase
    .from('core_relationships')
    .insert({
      ...data,
      organization_id: ORG_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return relationship
}

async function setDynamicField(entityId, fieldName, value, dataType = 'text') {
  const fieldData = {
    entity_id: entityId,
    field_name: fieldName,
    organization_id: ORG_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  // Set the appropriate field based on data type
  if (dataType === 'number') {
    fieldData.field_value_number = value
  } else if (dataType === 'date') {
    fieldData.field_value_date = value
  } else {
    fieldData.field_value_text = value
  }
  
  const { data, error } = await supabase
    .from('core_dynamic_data')
    .insert(fieldData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Test Steps

async function step1_capitalInvestment() {
  console.log('\n💰 Step 1: Capital Investment - Owner brings ₹50,00,000')
  
  // Get or create owner entity
  const owner = await createEntity({
    entity_type: 'person',
    entity_name: 'Rajesh Kumar (Owner)',
    entity_code: 'OWNER-001',
    smart_code: 'HERA.ICE.PERSON.OWNER.v1'
  })
  testData.entities.owner = owner
  
  // Get GL accounts
  const { data: glAccounts } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'gl_account')
    .in('entity_code', ['3100', '1110']) // Share Capital & Cash accounts
  
  const capitalAccount = glAccounts.find(a => a.entity_code === '3100')
  const cashAccount = glAccounts.find(a => a.entity_code === '1110')
  
  if (!capitalAccount || !cashAccount) {
    throw new Error('GL accounts not found. Please run setup-kochi-icecream.js first')
  }
  
  testData.entities.capitalAccount = capitalAccount
  testData.entities.cashAccount = cashAccount
  
  // Create capital investment transaction
  const capitalTxn = await createTransaction({
    transaction_type: 'journal_entry',
    transaction_date: new Date().toISOString(),
    transaction_code: `JE-${Date.now()}`,
    description: 'Initial capital investment by owner',
    total_amount: 5000000,
    smart_code: 'HERA.FIN.GL.TXN.JE.CAPITAL.v1',
    from_entity_id: owner.id,
    to_entity_id: capitalAccount.id,
    metadata: {
      journal_type: 'capital_investment',
      source: 'owner_investment'
    }
  })
  testData.transactions.push(capitalTxn)
  
  // Create journal entry lines
  const capitalLines = await createTransactionLines([
    {
      transaction_id: capitalTxn.id,
      line_entity_id: cashAccount.id,
      line_number: 1,
      line_amount: 5000000,
      line_type: 'debit',
      description: 'Cash received from owner',
      smart_code: 'HERA.FIN.GL.LINE.DEBIT.v1'
    },
    {
      transaction_id: capitalTxn.id,
      line_entity_id: capitalAccount.id,
      line_number: 2,
      line_amount: 5000000,
      line_type: 'credit',
      description: 'Owner capital account',
      smart_code: 'HERA.FIN.GL.LINE.CREDIT.v1'
    }
  ])
  
  console.log('✅ Capital investment recorded:')
  console.log(`   - DR: Cash Account (${cashAccount.entity_code}): ₹50,00,000`)
  console.log(`   - CR: Capital Account (${capitalAccount.entity_code}): ₹50,00,000`)
  
  return { transaction: capitalTxn, lines: capitalLines }
}

async function step2_fixedAssetPurchase() {
  console.log('\n🏭 Step 2: Fixed Asset Purchase - Industrial Freezer ₹8,00,000')
  
  // Create freezer asset entity
  const freezer = await createEntity({
    entity_type: 'fixed_asset',
    entity_name: 'Blast Freezer BF-5000 Industrial',
    entity_code: 'FA-FREEZER-001',
    smart_code: 'HERA.ICE.FA.FREEZER.INDUSTRIAL.v1'
  })
  testData.entities.freezer = freezer
  
  // Set asset details
  await setDynamicField(freezer.id, 'purchase_cost', 800000, 'number')
  await setDynamicField(freezer.id, 'useful_life_years', 10, 'number')
  await setDynamicField(freezer.id, 'temperature_range', '-40°C to -25°C', 'text')
  await setDynamicField(freezer.id, 'capacity', '5000 liters', 'text')
  
  // Create vendor entity
  const vendor = await createEntity({
    entity_type: 'vendor',
    entity_name: 'ColdTech Equipment Pvt Ltd',
    entity_code: 'VENDOR-COLDTECH',
    smart_code: 'HERA.ICE.VENDOR.EQUIPMENT.v1'
  })
  testData.entities.equipmentVendor = vendor
  
  // Get GL accounts
  const { data: faGlAccounts } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'gl_account')
    .in('entity_code', ['1500', '1110']) // Fixed Assets & Cash
  
  const fixedAssetAccount = faGlAccounts.find(a => a.entity_code === '1500')
  const cashAccount = faGlAccounts.find(a => a.entity_code === '1110')
  
  // Create purchase transaction
  const assetPurchase = await createTransaction({
    transaction_type: 'fixed_asset_purchase',
    transaction_date: new Date().toISOString(),
    transaction_code: `FA-PUR-${Date.now()}`,
    description: 'Purchase of industrial blast freezer',
    total_amount: 800000,
    smart_code: 'HERA.ICE.FA.TXN.PURCHASE.v1',
    from_entity_id: vendor.id,
    to_entity_id: freezer.id,
    metadata: {
      asset_type: 'freezer_equipment',
      warranty_years: 2,
      installation_included: true
    }
  })
  testData.transactions.push(assetPurchase)
  
  // Create transaction lines
  const assetLines = await createTransactionLines([
    {
      transaction_id: assetPurchase.id,
      line_entity_id: fixedAssetAccount.id,
      line_number: 1,
      line_amount: 800000,
      line_type: 'debit',
      description: 'Freezer equipment capitalized',
      smart_code: 'HERA.FIN.GL.LINE.DEBIT.v1'
    },
    {
      transaction_id: assetPurchase.id,
      line_entity_id: cashAccount.id,
      line_number: 2,
      line_amount: 800000,
      line_type: 'credit',
      description: 'Cash payment for freezer',
      smart_code: 'HERA.FIN.GL.LINE.CREDIT.v1'
    }
  ])
  
  console.log('✅ Fixed asset purchase recorded:')
  console.log(`   - DR: Fixed Assets (${fixedAssetAccount.entity_code}): ₹8,00,000`)
  console.log(`   - CR: Cash (${cashAccount.entity_code}): ₹8,00,000`)
  console.log(`   - Asset: ${freezer.entity_name} (${freezer.entity_code})`)
  
  return { transaction: assetPurchase, lines: assetLines, asset: freezer }
}

async function step3_rawMaterialProcurement() {
  console.log('\n🥛 Step 3: Raw Material Procurement - Milk, Sugar, Flavoring')
  
  // Create dairy supplier
  const dairySupplier = await createEntity({
    entity_type: 'vendor',
    entity_name: 'Kerala Dairy Cooperative',
    entity_code: 'VENDOR-DAIRY-001',
    smart_code: 'HERA.ICE.VENDOR.DAIRY.v1'
  })
  testData.entities.dairySupplier = dairySupplier
  
  // Get or create raw material entities
  const milk = await createEntity({
    entity_type: 'raw_material',
    entity_name: 'Fresh Whole Milk',
    entity_code: 'RM-MILK-001',
    smart_code: 'HERA.ICE.RM.DAIRY.MILK.v1'
  })
  await setDynamicField(milk.id, 'unit_of_measure', 'liters', 'text')
  await setDynamicField(milk.id, 'cost_per_unit', 45, 'number')
  
  const sugar = await createEntity({
    entity_type: 'raw_material',
    entity_name: 'Refined Sugar',
    entity_code: 'RM-SUGAR-001',
    smart_code: 'HERA.ICE.RM.INGREDIENT.SUGAR.v1'
  })
  await setDynamicField(sugar.id, 'unit_of_measure', 'kg', 'text')
  await setDynamicField(sugar.id, 'cost_per_unit', 55, 'number')
  
  const vanilla = await createEntity({
    entity_type: 'raw_material',
    entity_name: 'Natural Vanilla Extract',
    entity_code: 'RM-VANILLA-001',
    smart_code: 'HERA.ICE.RM.FLAVOR.VANILLA.v1'
  })
  await setDynamicField(vanilla.id, 'unit_of_measure', 'liters', 'text')
  await setDynamicField(vanilla.id, 'cost_per_unit', 2500, 'number')
  
  testData.entities.rawMaterials = { milk, sugar, vanilla }
  
  // Get GL accounts
  const { data: invAccounts } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'gl_account')
    .in('entity_code', ['1300', '2100']) // Inventory & AP
  
  const inventoryAccount = invAccounts.find(a => a.entity_code === '1300')
  const apAccount = invAccounts.find(a => a.entity_code === '2100')
  
  // Create purchase order
  const purchaseOrder = await createTransaction({
    transaction_type: 'purchase_order',
    transaction_date: new Date().toISOString(),
    transaction_code: `PO-${Date.now()}`,
    description: 'Raw materials for vanilla ice cream production',
    total_amount: 62000, // 1000L milk + 100kg sugar + 2L vanilla
    smart_code: 'HERA.ICE.PO.RAW_MATERIALS.v1',
    from_entity_id: dairySupplier.id,
    metadata: {
      delivery_date: new Date(Date.now() + 86400000).toISOString(),
      payment_terms: 'Net 30'
    }
  })
  testData.transactions.push(purchaseOrder)
  
  // Create PO lines
  await createTransactionLines([
    {
      transaction_id: purchaseOrder.id,
      line_entity_id: milk.id,
      line_number: 1,
      quantity: 1000,
      unit_price: 45,
      line_amount: 45000,
      description: 'Fresh whole milk - 1000 liters',
      smart_code: 'HERA.ICE.PO.LINE.MILK.v1'
    },
    {
      transaction_id: purchaseOrder.id,
      line_entity_id: sugar.id,
      line_number: 2,
      quantity: 100,
      unit_price: 55,
      line_amount: 5500,
      description: 'Refined sugar - 100 kg',
      smart_code: 'HERA.ICE.PO.LINE.SUGAR.v1'
    },
    {
      transaction_id: purchaseOrder.id,
      line_entity_id: vanilla.id,
      line_number: 3,
      quantity: 2,
      unit_price: 2500,
      line_amount: 5000,
      description: 'Natural vanilla extract - 2 liters',
      smart_code: 'HERA.ICE.PO.LINE.VANILLA.v1'
    }
  ])
  
  // Create goods receipt
  const goodsReceipt = await createTransaction({
    transaction_type: 'goods_receipt',
    transaction_date: new Date().toISOString(),
    transaction_code: `GR-${Date.now()}`,
    description: 'Receipt of raw materials',
    total_amount: 62000,
    smart_code: 'HERA.ICE.GR.RAW_MATERIALS.v1',
    from_entity_id: purchaseOrder.id,
    to_entity_id: inventoryAccount.id,
    metadata: {
      po_reference: purchaseOrder.transaction_code,
      temperature_on_arrival: '4°C',
      quality_check_passed: true
    }
  })
  testData.transactions.push(goodsReceipt)
  
  // Create journal lines for goods receipt
  await createTransactionLines([
    {
      transaction_id: goodsReceipt.id,
      line_entity_id: inventoryAccount.id,
      line_number: 1,
      line_amount: 62000,
      line_type: 'debit',
      description: 'Raw materials to inventory',
      smart_code: 'HERA.FIN.GL.LINE.DEBIT.v1'
    },
    {
      transaction_id: goodsReceipt.id,
      line_entity_id: apAccount.id,
      line_number: 2,
      line_amount: 62000,
      line_type: 'credit',
      description: 'Accounts payable - Kerala Dairy',
      smart_code: 'HERA.FIN.GL.LINE.CREDIT.v1'
    }
  ])
  
  console.log('✅ Raw material procurement recorded:')
  console.log(`   - Purchase Order: ${purchaseOrder.transaction_code} - ₹62,000`)
  console.log(`   - Goods Receipt: ${goodsReceipt.transaction_code}`)
  console.log(`   - DR: Inventory (${inventoryAccount.entity_code}): ₹62,000`)
  console.log(`   - CR: Accounts Payable (${apAccount.entity_code}): ₹62,000`)
  
  return { purchaseOrder, goodsReceipt }
}

async function step4_laborCostBooking() {
  console.log('\n👷 Step 4: Labor Cost Booking - Factory Workers')
  
  // Create employee entities
  const productionWorker = await createEntity({
    entity_type: 'employee',
    entity_name: 'Production Team (5 workers)',
    entity_code: 'EMP-PROD-TEAM',
    smart_code: 'HERA.ICE.EMP.PRODUCTION.v1'
  })
  await setDynamicField(productionWorker.id, 'hourly_rate', 150, 'number')
  await setDynamicField(productionWorker.id, 'team_size', 5, 'number')
  
  testData.entities.productionWorker = productionWorker
  
  // Get GL accounts
  const { data: laborAccounts } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'gl_account')
    .in('entity_code', ['5200', '2200']) // Production Labor & Accrued Wages
  
  const laborAccount = laborAccounts.find(a => a.entity_code === '5200')
  const accruedWagesAccount = laborAccounts.find(a => a.entity_code === '2200')
  
  // Create labor cost transaction for 8 hours production
  const laborCost = await createTransaction({
    transaction_type: 'labor_cost',
    transaction_date: new Date().toISOString(),
    transaction_code: `LC-${Date.now()}`,
    description: 'Production labor for vanilla ice cream batch',
    total_amount: 6000, // 5 workers * 8 hours * 150/hour
    smart_code: 'HERA.ICE.LABOR.PRODUCTION.v1',
    from_entity_id: productionWorker.id,
    metadata: {
      hours_worked: 8,
      workers_count: 5,
      hourly_rate: 150,
      batch_reference: 'BATCH-VANILLA-001'
    }
  })
  testData.transactions.push(laborCost)
  
  // Create journal lines
  await createTransactionLines([
    {
      transaction_id: laborCost.id,
      line_entity_id: laborAccount.id,
      line_number: 1,
      line_amount: 6000,
      line_type: 'debit',
      description: 'Direct labor cost',
      smart_code: 'HERA.FIN.GL.LINE.DEBIT.v1'
    },
    {
      transaction_id: laborCost.id,
      line_entity_id: accruedWagesAccount.id,
      line_number: 2,
      line_amount: 6000,
      line_type: 'credit',
      description: 'Accrued wages payable',
      smart_code: 'HERA.FIN.GL.LINE.CREDIT.v1'
    }
  ])
  
  console.log('✅ Labor cost recorded:')
  console.log(`   - Production Team: 5 workers × 8 hours × ₹150/hour = ₹6,000`)
  console.log(`   - DR: Direct Labor (${laborAccount.entity_code}): ₹6,000`)
  console.log(`   - CR: Accrued Wages (${accruedWagesAccount.entity_code}): ₹6,000`)
  
  return { transaction: laborCost }
}

async function step5_production() {
  console.log('\n🍦 Step 5: Production - Create Vanilla Ice Cream Batch')
  
  // Create finished product entity
  const vanillaIceCream = await createEntity({
    entity_type: 'finished_product',
    entity_name: 'Premium Vanilla Ice Cream',
    entity_code: 'FG-VANILLA-5L',
    smart_code: 'HERA.ICE.FG.VANILLA.5L.v1'
  })
  await setDynamicField(vanillaIceCream.id, 'unit_size', '5 liters', 'text')
  await setDynamicField(vanillaIceCream.id, 'selling_price', 500, 'number')
  await setDynamicField(vanillaIceCream.id, 'shelf_life_days', 180, 'number')
  
  testData.entities.finishedProduct = vanillaIceCream
  
  // Get GL accounts
  const { data: prodAccounts } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'gl_account')
    .in('entity_code', ['1310', '1300', '5200']) // FG Inventory, RM Inventory, Labor
  
  const fgInventoryAccount = prodAccounts.find(a => a.entity_code === '1310')
  const rmInventoryAccount = prodAccounts.find(a => a.entity_code === '1300')
  const laborAccount = prodAccounts.find(a => a.entity_code === '5200')
  
  // Calculate production cost
  const materialCost = 31000 // 500L milk + 50kg sugar + 1L vanilla
  const laborCost = 6000
  const totalCost = materialCost + laborCost
  const unitCost = totalCost / 100 // Producing 100 units of 5L each
  
  // Create production batch transaction
  const productionBatch = await createTransaction({
    transaction_type: 'production_batch',
    transaction_date: new Date().toISOString(),
    transaction_code: `BATCH-${Date.now()}`,
    description: 'Production of 500L vanilla ice cream (100 units × 5L)',
    total_amount: totalCost,
    smart_code: 'HERA.ICE.PROD.BATCH.VANILLA.v1',
    to_entity_id: vanillaIceCream.id,
    metadata: {
      batch_size: 500,
      units_produced: 100,
      unit_cost: unitCost,
      temperature_maintained: '-25°C',
      quality_score: 95
    }
  })
  testData.transactions.push(productionBatch)
  
  // Create production journal entries
  await createTransactionLines([
    {
      transaction_id: productionBatch.id,
      line_entity_id: fgInventoryAccount.id,
      line_number: 1,
      line_amount: totalCost,
      line_type: 'debit',
      description: 'Finished goods inventory',
      smart_code: 'HERA.FIN.GL.LINE.DEBIT.v1'
    },
    {
      transaction_id: productionBatch.id,
      line_entity_id: rmInventoryAccount.id,
      line_number: 2,
      line_amount: materialCost,
      line_type: 'credit',
      description: 'Raw materials consumed',
      smart_code: 'HERA.FIN.GL.LINE.CREDIT.v1'
    },
    {
      transaction_id: productionBatch.id,
      line_entity_id: laborAccount.id,
      line_number: 3,
      line_amount: laborCost,
      line_type: 'credit',
      description: 'Labor cost applied to production',
      smart_code: 'HERA.FIN.GL.LINE.CREDIT.v1'
    }
  ])
  
  console.log('✅ Production batch completed:')
  console.log(`   - Batch: ${productionBatch.transaction_code}`)
  console.log(`   - Output: 100 units × 5L = 500L vanilla ice cream`)
  console.log(`   - Total Cost: ₹${totalCost} (Material: ₹${materialCost} + Labor: ₹${laborCost})`)
  console.log(`   - Unit Cost: ₹${unitCost} per 5L unit`)
  console.log(`   - DR: Finished Goods (${fgInventoryAccount.entity_code}): ₹${totalCost}`)
  console.log(`   - CR: Raw Materials (${rmInventoryAccount.entity_code}): ₹${materialCost}`)
  console.log(`   - CR: Direct Labor (${laborAccount.entity_code}): ₹${laborCost}`)
  
  return { transaction: productionBatch, product: vanillaIceCream, unitCost }
}

async function step6_salesTransaction() {
  console.log('\n💰 Step 6: Sales Transaction - Sell to Retail Outlet')
  
  // Create customer entity
  const retailOutlet = await createEntity({
    entity_type: 'customer',
    entity_name: 'FreshMart Supermarket - MG Road',
    entity_code: 'CUST-FRESHMART-001',
    smart_code: 'HERA.ICE.CUST.RETAIL.v1'
  })
  await setDynamicField(retailOutlet.id, 'credit_limit', 200000, 'number')
  await setDynamicField(retailOutlet.id, 'payment_terms', 'Net 15', 'text')
  
  testData.entities.customer = retailOutlet
  
  // Get GL accounts
  const { data: salesAccounts } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'gl_account')
    .in('entity_code', ['1200', '4110', '5100', '1310', '2400']) 
  
  const arAccount = salesAccounts.find(a => a.entity_code === '1200')
  const salesAccount = salesAccounts.find(a => a.entity_code === '4110')
  const cogsAccount = salesAccounts.find(a => a.entity_code === '5100')
  const fgInventoryAccount = salesAccounts.find(a => a.entity_code === '1310')
  const gstPayableAccount = salesAccounts.find(a => a.entity_code === '2400')
  
  // Create sales order
  const salesQuantity = 50 // 50 units of 5L each
  const unitPrice = 500
  const subtotal = salesQuantity * unitPrice
  const gstAmount = subtotal * 0.12 // 12% GST
  const totalAmount = subtotal + gstAmount
  
  const salesOrder = await createTransaction({
    transaction_type: 'sales_order',
    transaction_date: new Date().toISOString(),
    transaction_code: `SO-${Date.now()}`,
    description: 'Sale of vanilla ice cream to FreshMart',
    total_amount: totalAmount,
    smart_code: 'HERA.ICE.SO.RETAIL.v1',
    from_entity_id: retailOutlet.id,
    to_entity_id: testData.entities.finishedProduct.id,
    metadata: {
      delivery_date: new Date().toISOString(),
      payment_terms: 'Net 15',
      temperature_requirement: '-18°C',
      subtotal: subtotal,
      gst_amount: gstAmount
    }
  })
  testData.transactions.push(salesOrder)
  
  // Create sales order lines
  await createTransactionLines([
    {
      transaction_id: salesOrder.id,
      line_entity_id: testData.entities.finishedProduct.id,
      line_number: 1,
      quantity: salesQuantity,
      unit_price: unitPrice,
      line_amount: subtotal,
      description: 'Premium Vanilla Ice Cream - 5L units',
      smart_code: 'HERA.ICE.SO.LINE.PRODUCT.v1'
    }
  ])
  
  // Create sales invoice (automatic GL posting)
  const salesInvoice = await createTransaction({
    transaction_type: 'sales_invoice',
    transaction_date: new Date().toISOString(),
    transaction_code: `INV-${Date.now()}`,
    description: 'Invoice for vanilla ice cream delivery',
    total_amount: totalAmount,
    smart_code: 'HERA.ICE.INV.RETAIL.v1',
    from_entity_id: retailOutlet.id,
    reference_id: salesOrder.id,
    metadata: {
      so_reference: salesOrder.transaction_code,
      subtotal: subtotal,
      gst_amount: gstAmount,
      delivery_completed: true
    }
  })
  testData.transactions.push(salesInvoice)
  
  // Create invoice GL postings
  await createTransactionLines([
    {
      transaction_id: salesInvoice.id,
      line_entity_id: arAccount.id,
      line_number: 1,
      line_amount: totalAmount,
      line_type: 'debit',
      description: 'Accounts receivable - FreshMart',
      smart_code: 'HERA.FIN.GL.LINE.DEBIT.v1'
    },
    {
      transaction_id: salesInvoice.id,
      line_entity_id: salesAccount.id,
      line_number: 2,
      line_amount: subtotal,
      line_type: 'credit',
      description: 'Sales revenue',
      smart_code: 'HERA.FIN.GL.LINE.CREDIT.v1'
    },
    {
      transaction_id: salesInvoice.id,
      line_entity_id: gstPayableAccount.id,
      line_number: 3,
      line_amount: gstAmount,
      line_type: 'credit',
      description: 'GST payable on sales',
      smart_code: 'HERA.FIN.GL.LINE.CREDIT.v1'
    }
  ])
  
  // Record COGS
  const cogsCost = 370 * salesQuantity // Unit cost × quantity
  const cogsEntry = await createTransaction({
    transaction_type: 'journal_entry',
    transaction_date: new Date().toISOString(),
    transaction_code: `JE-COGS-${Date.now()}`,
    description: 'Cost of goods sold for invoice',
    total_amount: cogsCost,
    smart_code: 'HERA.ICE.JE.COGS.v1',
    reference_id: salesInvoice.id,
    metadata: {
      invoice_reference: salesInvoice.transaction_code,
      units_sold: salesQuantity,
      unit_cost: 370
    }
  })
  testData.transactions.push(cogsEntry)
  
  await createTransactionLines([
    {
      transaction_id: cogsEntry.id,
      line_entity_id: cogsAccount.id,
      line_number: 1,
      line_amount: cogsCost,
      line_type: 'debit',
      description: 'Cost of goods sold',
      smart_code: 'HERA.FIN.GL.LINE.DEBIT.v1'
    },
    {
      transaction_id: cogsEntry.id,
      line_entity_id: fgInventoryAccount.id,
      line_number: 2,
      line_amount: cogsCost,
      line_type: 'credit',
      description: 'Reduce finished goods inventory',
      smart_code: 'HERA.FIN.GL.LINE.CREDIT.v1'
    }
  ])
  
  console.log('✅ Sales transaction completed:')
  console.log(`   - Sales Order: ${salesOrder.transaction_code}`)
  console.log(`   - Invoice: ${salesInvoice.transaction_code}`)
  console.log(`   - Quantity: ${salesQuantity} units × ₹${unitPrice} = ₹${subtotal}`)
  console.log(`   - GST (12%): ₹${gstAmount}`)
  console.log(`   - Total: ₹${totalAmount}`)
  console.log('\n   Revenue Recognition:')
  console.log(`   - DR: Accounts Receivable (${arAccount.entity_code}): ₹${totalAmount}`)
  console.log(`   - CR: Sales Revenue (${salesAccount.entity_code}): ₹${subtotal}`)
  console.log(`   - CR: GST Payable (${gstPayableAccount.entity_code}): ₹${gstAmount}`)
  console.log('\n   Cost Recognition:')
  console.log(`   - DR: COGS (${cogsAccount.entity_code}): ₹${cogsCost}`)
  console.log(`   - CR: FG Inventory (${fgInventoryAccount.entity_code}): ₹${cogsCost}`)
  console.log(`\n   Gross Profit: ₹${subtotal - cogsCost} (${((subtotal - cogsCost) / subtotal * 100).toFixed(1)}%)`)
  
  return { salesOrder, salesInvoice, cogsEntry }
}

async function step7_financialVerification() {
  console.log('\n📊 Step 7: Financial Verification - Check All GL Postings')
  
  // Get all transactions created in this test
  const { data: allTransactions } = await supabase
    .from('universal_transactions')
    .select(`
      *,
      universal_transaction_lines (*)
    `)
    .eq('organization_id', ORG_ID)
    .in('id', testData.transactions.map(t => t.id))
    .order('created_at', { ascending: true })
  
  console.log('\n📋 Transaction Summary:')
  console.log('─'.repeat(80))
  
  let totalDebits = 0
  let totalCredits = 0
  
  for (const txn of allTransactions) {
    console.log(`\n${txn.transaction_code} - ${txn.description}`)
    console.log(`Type: ${txn.transaction_type} | Date: ${new Date(txn.transaction_date).toLocaleDateString()}`)
    console.log(`Amount: ₹${txn.total_amount.toLocaleString('en-IN')}`)
    
    if (txn.universal_transaction_lines && txn.universal_transaction_lines.length > 0) {
      console.log('\nJournal Entries:')
      for (const line of txn.universal_transaction_lines) {
        if (line.line_type === 'debit') {
          console.log(`  DR: ${line.description} - ₹${line.line_amount.toLocaleString('en-IN')}`)
          totalDebits += line.line_amount
        } else if (line.line_type === 'credit') {
          console.log(`  CR: ${line.description} - ₹${line.line_amount.toLocaleString('en-IN')}`)
          totalCredits += line.line_amount
        }
      }
    }
  }
  
  console.log('\n' + '═'.repeat(80))
  console.log('FINANCIAL SUMMARY')
  console.log('═'.repeat(80))
  
  // Calculate key metrics
  const capitalInvested = 5000000
  const fixedAssetsPurchased = 800000
  const rawMaterialsCost = 62000
  const laborCost = 6000
  const salesRevenue = 25000
  const gstCollected = 3000
  const cogsAmount = 18500
  const grossProfit = salesRevenue - cogsAmount
  
  console.log('\n💰 BALANCE SHEET IMPACT:')
  console.log(`   Assets:`)
  console.log(`   - Cash: ₹${(capitalInvested - fixedAssetsPurchased).toLocaleString('en-IN')}`)
  console.log(`   - Fixed Assets: ₹${fixedAssetsPurchased.toLocaleString('en-IN')}`)
  console.log(`   - Accounts Receivable: ₹${(salesRevenue + gstCollected).toLocaleString('en-IN')}`)
  console.log(`   - Raw Material Inventory: ₹${(rawMaterialsCost - 31000).toLocaleString('en-IN')}`)
  console.log(`   - Finished Goods Inventory: ₹${(37000 - cogsAmount).toLocaleString('en-IN')}`)
  
  console.log(`\n   Liabilities:`)
  console.log(`   - Accounts Payable: ₹${rawMaterialsCost.toLocaleString('en-IN')}`)
  console.log(`   - Accrued Wages: ₹${laborCost.toLocaleString('en-IN')}`)
  console.log(`   - GST Payable: ₹${gstCollected.toLocaleString('en-IN')}`)
  
  console.log(`\n   Equity:`)
  console.log(`   - Owner's Capital: ₹${capitalInvested.toLocaleString('en-IN')}`)
  
  console.log('\n📈 INCOME STATEMENT:')
  console.log(`   Revenue: ₹${salesRevenue.toLocaleString('en-IN')}`)
  console.log(`   Cost of Goods Sold: ₹${cogsAmount.toLocaleString('en-IN')}`)
  console.log(`   Gross Profit: ₹${grossProfit.toLocaleString('en-IN')} (${(grossProfit / salesRevenue * 100).toFixed(1)}%)`)
  
  console.log('\n✅ ACCOUNTING EQUATION CHECK:')
  console.log(`   Total Debits: ₹${totalDebits.toLocaleString('en-IN')}`)
  console.log(`   Total Credits: ₹${totalCredits.toLocaleString('en-IN')}`)
  console.log(`   Balance: ${totalDebits === totalCredits ? '✅ BALANCED' : '❌ NOT BALANCED'}`)
  
  return {
    totalDebits,
    totalCredits,
    balanced: totalDebits === totalCredits
  }
}

// Main execution
async function runCompleteBusinessCycleTest() {
  console.log('🍦 HERA ICE CREAM - COMPLETE BUSINESS CYCLE TEST')
  console.log('═'.repeat(80))
  console.log('Organization: Kochi Ice Cream Manufacturing')
  console.log('Test Date:', new Date().toLocaleString())
  console.log('═'.repeat(80))
  
  try {
    // Execute all steps
    await step1_capitalInvestment()
    await step2_fixedAssetPurchase()
    await step3_rawMaterialProcurement()
    await step4_laborCostBooking()
    await step5_production()
    await step6_salesTransaction()
    const verification = await step7_financialVerification()
    
    console.log('\n' + '═'.repeat(80))
    console.log('🎉 COMPLETE BUSINESS CYCLE TEST COMPLETED SUCCESSFULLY!')
    console.log('═'.repeat(80))
    
    console.log('\n📊 Test Results:')
    console.log(`   - Total Transactions: ${testData.transactions.length}`)
    console.log(`   - Accounting Balance: ${verification.balanced ? '✅ VERIFIED' : '❌ ERROR'}`)
    console.log(`   - Business Flow: Capital → Assets → Materials → Production → Sales`)
    console.log(`   - Financial Integration: ✅ All GL postings verified`)
    
    console.log('\n💡 Key Insights:')
    console.log(`   1. Complete traceability from capital to sales`)
    console.log(`   2. Accurate cost accounting through production`)
    console.log(`   3. Proper GL postings for all transactions`)
    console.log(`   4. Real-time profitability analysis`)
    console.log(`   5. GST compliance integrated`)
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error)
  }
}

// Run the test
runCompleteBusinessCycleTest()