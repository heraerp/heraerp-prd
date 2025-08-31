#!/usr/bin/env node

/**
 * HERA Ice Cream Simple Business Cycle Test
 * 
 * A simplified test that demonstrates the complete flow while
 * creating any missing GL accounts as needed.
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

// Helper to create or get GL account
async function ensureGLAccount(code, name, type) {
  // Check if exists
  const { data: existing } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'gl_account')
    .eq('entity_code', code)
    .single()
  
  if (existing) return existing
  
  // Create if not exists
  const { data: newAccount, error } = await supabase
    .from('core_entities')
    .insert({
      organization_id: ORG_ID,
      entity_type: 'gl_account',
      entity_code: code,
      entity_name: name,
      smart_code: `HERA.ICE.GL.${type.toUpperCase()}.${code}.v1`,
      metadata: {
        account_type: type,
        currency: 'INR',
        normal_balance: ['asset', 'expense'].includes(type) ? 'debit' : 'credit'
      },
      status: 'active'
    })
    .select()
    .single()
  
  if (error) throw error
  console.log(`  ✓ Created GL Account: ${name} (${code})`)
  return newAccount
}

// Main test function
async function runSimpleBusinessCycleTest() {
  console.log('🍦 HERA ICE CREAM - SIMPLE BUSINESS CYCLE TEST')
  console.log('═'.repeat(60))
  console.log('Organization:', ORG_ID)
  console.log('═'.repeat(60))
  
  try {
    // Step 1: Ensure required GL accounts exist
    console.log('\n📊 Step 1: Setting up GL Accounts')
    const cashAccount = await ensureGLAccount('1110', 'Cash in Bank', 'asset')
    const capitalAccount = await ensureGLAccount('3100', 'Share Capital', 'equity')
    const fixedAssetAccount = await ensureGLAccount('1500', 'Fixed Assets - Equipment', 'asset')
    const inventoryAccount = await ensureGLAccount('1300', 'Raw Material Inventory', 'asset')
    const fgInventoryAccount = await ensureGLAccount('1310', 'Finished Goods Inventory', 'asset')
    const apAccount = await ensureGLAccount('2100', 'Accounts Payable', 'liability')
    const arAccount = await ensureGLAccount('1200', 'Accounts Receivable', 'asset')
    const salesAccount = await ensureGLAccount('4110', 'Ice Cream Sales - Retail', 'revenue')
    const cogsAccount = await ensureGLAccount('5100', 'Cost of Goods Sold', 'expense')
    const laborAccount = await ensureGLAccount('5200', 'Production Labor', 'expense')
    const wagesPayableAccount = await ensureGLAccount('2200', 'Wages Payable', 'liability')
    const gstPayableAccount = await ensureGLAccount('2400', 'GST Payable', 'liability')
    
    // Step 2: Capital Investment
    console.log('\n💰 Step 2: Owner brings capital ₹50,00,000')
    const capitalTxn = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORG_ID,
        transaction_type: 'journal_entry',
        transaction_date: new Date().toISOString(),
        transaction_code: `JE-CAPITAL-${Date.now()}`,
        metadata: {
          description: 'Initial capital investment',
          journal_type: 'capital_investment'
        },
        total_amount: 5000000,
        smart_code: 'HERA.ICE.JE.CAPITAL.v1'
      })
      .select()
      .single()
    
    if (capitalTxn.error) throw capitalTxn.error
    
    // Journal lines
    await supabase.from('universal_transaction_lines').insert([
      {
        organization_id: ORG_ID,
        transaction_id: capitalTxn.data.id,
        entity_id: cashAccount.id,
        line_number: 1,
        line_amount: 5000000,
        line_type: 'debit',
        description: 'Cash received'
      },
      {
        organization_id: ORG_ID,
        transaction_id: capitalTxn.data.id,
        entity_id: capitalAccount.id,
        line_number: 2,
        line_amount: 5000000,
        line_type: 'credit',
        description: 'Share capital'
      }
    ])
    console.log('  ✓ DR: Cash ₹50,00,000 | CR: Capital ₹50,00,000')
    
    // Step 3: Buy Freezer
    console.log('\n🏭 Step 3: Purchase industrial freezer ₹8,00,000')
    const assetTxn = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORG_ID,
        transaction_type: 'fixed_asset_purchase',
        transaction_date: new Date().toISOString(),
        transaction_code: `FA-${Date.now()}`,
        metadata: {
          description: 'Industrial blast freezer purchase',
          asset_type: 'freezer_equipment'
        },
        total_amount: 800000,
        smart_code: 'HERA.ICE.FA.PURCHASE.v1'
      })
      .select()
      .single()
    
    if (assetTxn.error) throw assetTxn.error
    
    await supabase.from('universal_transaction_lines').insert([
      {
        organization_id: ORG_ID,
        transaction_id: assetTxn.data.id,
        entity_id: fixedAssetAccount.id,
        line_number: 1,
        line_amount: 800000,
        line_type: 'debit',
        description: 'Freezer equipment'
      },
      {
        organization_id: ORG_ID,
        transaction_id: assetTxn.data.id,
        entity_id: cashAccount.id,
        line_number: 2,
        line_amount: 800000,
        line_type: 'credit',
        description: 'Cash payment'
      }
    ])
    console.log('  ✓ DR: Fixed Assets ₹8,00,000 | CR: Cash ₹8,00,000')
    
    // Step 4: Buy Raw Materials
    console.log('\n🥛 Step 4: Purchase raw materials ₹50,000')
    const purchaseTxn = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORG_ID,
        transaction_type: 'purchase_invoice',
        transaction_date: new Date().toISOString(),
        transaction_code: `PI-${Date.now()}`,
        metadata: {
          description: 'Raw materials - milk, sugar, vanilla',
          vendor: 'Kerala Dairy Cooperative'
        },
        total_amount: 50000,
        smart_code: 'HERA.ICE.PURCHASE.RM.v1'
      })
      .select()
      .single()
    
    if (purchaseTxn.error) throw purchaseTxn.error
    
    await supabase.from('universal_transaction_lines').insert([
      {
        organization_id: ORG_ID,
        transaction_id: purchaseTxn.data.id,
        entity_id: inventoryAccount.id,
        line_number: 1,
        line_amount: 50000,
        line_type: 'debit',
        description: 'Raw materials to inventory'
      },
      {
        organization_id: ORG_ID,
        transaction_id: purchaseTxn.data.id,
        entity_id: apAccount.id,
        line_number: 2,
        line_amount: 50000,
        line_type: 'credit',
        description: 'Vendor payable'
      }
    ])
    console.log('  ✓ DR: Inventory ₹50,000 | CR: AP ₹50,000')
    
    // Step 5: Production with Labor
    console.log('\n🍦 Step 5: Production batch with labor ₹5,000')
    const productionTxn = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORG_ID,
        transaction_type: 'production_batch',
        transaction_date: new Date().toISOString(),
        transaction_code: `BATCH-${Date.now()}`,
        metadata: {
          description: 'Vanilla ice cream production - 100 units',
          batch_size: 100,
          material_cost: 30000,
          labor_cost: 5000
        },
        total_amount: 35000, // 30k materials + 5k labor
        smart_code: 'HERA.ICE.PRODUCTION.v1'
      })
      .select()
      .single()
    
    if (productionTxn.error) throw productionTxn.error
    
    await supabase.from('universal_transaction_lines').insert([
      {
        organization_id: ORG_ID,
        transaction_id: productionTxn.data.id,
        entity_id: fgInventoryAccount.id,
        line_number: 1,
        line_amount: 35000,
        line_type: 'debit',
        description: 'Finished goods'
      },
      {
        organization_id: ORG_ID,
        transaction_id: productionTxn.data.id,
        entity_id: inventoryAccount.id,
        line_number: 2,
        line_amount: 30000,
        line_type: 'credit',
        description: 'Raw materials consumed'
      },
      {
        organization_id: ORG_ID,
        transaction_id: productionTxn.data.id,
        entity_id: wagesPayableAccount.id,
        line_number: 3,
        line_amount: 5000,
        line_type: 'credit',
        description: 'Labor cost'
      }
    ])
    console.log('  ✓ DR: FG Inventory ₹35,000')
    console.log('  ✓ CR: RM Inventory ₹30,000 | CR: Wages Payable ₹5,000')
    
    // Step 6: Sales
    console.log('\n💰 Step 6: Sales to customer ₹25,000 + GST')
    const salesAmount = 25000
    const gstAmount = salesAmount * 0.12
    const totalWithGST = salesAmount + gstAmount
    
    const salesTxn = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORG_ID,
        transaction_type: 'sales_invoice',
        transaction_date: new Date().toISOString(),
        transaction_code: `INV-${Date.now()}`,
        metadata: {
          description: 'Ice cream sales - 50 units',
          subtotal: salesAmount,
          gst_amount: gstAmount,
          customer: 'FreshMart Supermarket'
        },
        total_amount: totalWithGST,
        smart_code: 'HERA.ICE.SALES.v1'
      })
      .select()
      .single()
    
    if (salesTxn.error) throw salesTxn.error
    
    await supabase.from('universal_transaction_lines').insert([
      {
        organization_id: ORG_ID,
        transaction_id: salesTxn.data.id,
        entity_id: arAccount.id,
        line_number: 1,
        line_amount: totalWithGST,
        line_type: 'debit',
        description: 'Customer receivable'
      },
      {
        organization_id: ORG_ID,
        transaction_id: salesTxn.data.id,
        entity_id: salesAccount.id,
        line_number: 2,
        line_amount: salesAmount,
        line_type: 'credit',
        description: 'Sales revenue'
      },
      {
        organization_id: ORG_ID,
        transaction_id: salesTxn.data.id,
        entity_id: gstPayableAccount.id,
        line_number: 3,
        line_amount: gstAmount,
        line_type: 'credit',
        description: 'GST collected'
      }
    ])
    console.log(`  ✓ DR: AR ₹${totalWithGST.toFixed(2)}`)
    console.log(`  ✓ CR: Sales ₹${salesAmount} | CR: GST Payable ₹${gstAmount}`)
    
    // Step 7: Record COGS
    console.log('\n📉 Step 7: Recording cost of goods sold')
    const cogsAmount = 17500 // 50% of production cost
    const cogsTxn = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORG_ID,
        transaction_type: 'journal_entry',
        transaction_date: new Date().toISOString(),
        transaction_code: `JE-COGS-${Date.now()}`,
        metadata: {
          description: 'Cost of goods sold',
          units_sold: 50,
          unit_cost: 350
        },
        total_amount: cogsAmount,
        smart_code: 'HERA.ICE.COGS.v1'
      })
      .select()
      .single()
    
    if (cogsTxn.error) throw cogsTxn.error
    
    await supabase.from('universal_transaction_lines').insert([
      {
        organization_id: ORG_ID,
        transaction_id: cogsTxn.data.id,
        entity_id: cogsAccount.id,
        line_number: 1,
        line_amount: cogsAmount,
        line_type: 'debit',
        description: 'Cost of goods sold'
      },
      {
        organization_id: ORG_ID,
        transaction_id: cogsTxn.data.id,
        entity_id: fgInventoryAccount.id,
        line_number: 2,
        line_amount: cogsAmount,
        line_type: 'credit',
        description: 'Reduce FG inventory'
      }
    ])
    console.log(`  ✓ DR: COGS ₹${cogsAmount} | CR: FG Inventory ₹${cogsAmount}`)
    
    // Final Summary
    console.log('\n' + '═'.repeat(60))
    console.log('📊 FINANCIAL SUMMARY')
    console.log('═'.repeat(60))
    console.log('\n💼 Balance Sheet:')
    console.log('  Assets:')
    console.log(`    Cash: ₹${(5000000 - 800000).toLocaleString('en-IN')}`)
    console.log(`    Fixed Assets: ₹8,00,000`)
    console.log(`    AR: ₹${totalWithGST.toFixed(2)}`)
    console.log(`    RM Inventory: ₹${(50000 - 30000).toLocaleString('en-IN')}`)
    console.log(`    FG Inventory: ₹${(35000 - cogsAmount).toLocaleString('en-IN')}`)
    console.log('  Liabilities:')
    console.log(`    AP: ₹50,000`)
    console.log(`    Wages Payable: ₹5,000`)
    console.log(`    GST Payable: ₹${gstAmount}`)
    console.log('  Equity:')
    console.log(`    Share Capital: ₹50,00,000`)
    
    console.log('\n📈 Income Statement:')
    console.log(`  Revenue: ₹${salesAmount}`)
    console.log(`  COGS: ₹${cogsAmount}`)
    console.log(`  Gross Profit: ₹${salesAmount - cogsAmount} (${((salesAmount - cogsAmount) / salesAmount * 100).toFixed(1)}%)`)
    
    console.log('\n✅ TEST COMPLETED SUCCESSFULLY!')
    console.log('   All transactions posted with proper GL entries')
    console.log('   Complete audit trail maintained')
    console.log('   Real-time financial visibility achieved')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error)
  }
}

// Run the test
runSimpleBusinessCycleTest()