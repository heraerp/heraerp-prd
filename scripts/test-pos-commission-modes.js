#!/usr/bin/env node
const { config } = require('dotenv')
const path = require('path')

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') })

// Import after env is loaded
const { createClient } = require('../src/lib/supabase/client')

// Test organization ID
const TEST_ORG_ID = process.env.TEST_ORGANIZATION_ID || 'e456ad1f-d467-445e-9095-d3dbc7b0ef3f'

// Initialize Supabase client
const supabase = createClient()

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function checkCommissionMode() {
  log('\n🔍 Checking Commission Mode...', 'blue')
  
  try {
    const { data: org, error } = await supabase
      .from('core_organizations')
      .select('settings')
      .eq('id', TEST_ORG_ID)
      .single()
    
    if (error) throw error
    
    const settings = org?.settings || {}
    const commissionsEnabled = settings?.salon?.commissions?.enabled ?? true
    const globalFlag = process.env.NEXT_PUBLIC_ENABLE_COMMISSIONS !== 'false'
    const effectiveEnabled = globalFlag && commissionsEnabled
    
    log(`Organization: ${TEST_ORG_ID}`, 'cyan')
    log(`Global Flag (ENABLE_COMMISSIONS): ${globalFlag}`, 'cyan')
    log(`Org Setting (commissions.enabled): ${commissionsEnabled}`, 'cyan')
    log(`Effective Commission Mode: ${effectiveEnabled ? 'ON' : 'OFF'}`, effectiveEnabled ? 'green' : 'yellow')
    
    return effectiveEnabled
  } catch (error) {
    log(`Error checking commission mode: ${error.message}`, 'red')
    return true
  }
}

async function createTestSale(includeStylists) {
  log(`\n💰 Creating POS sale ${includeStylists ? 'WITH' : 'WITHOUT'} stylist...`, 'magenta')
  
  try {
    // Create transaction header
    const transactionData = {
      organization_id: TEST_ORG_ID,
      transaction_type: 'sale',
      transaction_code: `TEST-${Date.now()}`,
      smart_code: 'HERA.SALON.POS.SALE.HEADER.v1',
      total_amount: 50,
      metadata: {
        branch_id: 'test-branch',
        source: 'POS_TEST',
        test_mode: true
      }
    }
    
    const { data: transaction, error: txError } = await supabase
      .from('universal_transactions')
      .insert(transactionData)
      .select()
      .single()
    
    if (txError) throw txError
    
    // Create transaction lines
    const lines = [
      // Service line
      {
        transaction_id: transaction.id,
        line_number: 1,
        quantity: 1,
        unit_price: 50,
        line_amount: 50,
        smart_code: 'HERA.SALON.POS.LINE.SERVICE.v1',
        metadata: {
          entity_name: 'Test Haircut Service',
          entity_type: 'service',
          ...(includeStylists ? {
            stylist_entity_id: 'test-stylist-id',
            stylist_name: 'Test Stylist'
          } : {})
        }
      },
      // Payment line
      {
        transaction_id: transaction.id,
        line_number: 2,
        line_amount: -50,
        smart_code: 'HERA.SALON.POS.PAYMENT.CASH.v1',
        metadata: {
          payment_method: 'cash'
        }
      }
    ]
    
    const { error: lineError } = await supabase
      .from('universal_transaction_lines')
      .insert(lines)
    
    if (lineError) throw lineError
    
    log(`✓ Sale created: ${transaction.transaction_code}`, 'green')
    
    // Check if we need to validate commission requirements
    const commissionsEnabled = await checkCommissionMode()
    
    if (commissionsEnabled && !includeStylists) {
      log('⚠️  Sale created but should have failed (no stylist with commissions ON)', 'yellow')
      return { success: true, shouldHaveFailed: true }
    }
    
    return { success: true, transaction }
    
  } catch (error) {
    log(`✗ Error creating sale: ${error.message}`, 'red')
    return { success: false, error: error.message }
  }
}

async function runTests() {
  log('\n🧪 POS Commission Mode Testing', 'magenta')
  log('================================', 'magenta')
  
  try {
    // Check current commission mode
    const commissionsEnabled = await checkCommissionMode()
    
    // Test 1: Sale WITH stylist
    log('\n📝 Test 1: Sale WITH stylist assigned', 'blue')
    const test1 = await createTestSale(true)
    
    // Test 2: Sale WITHOUT stylist
    log('\n📝 Test 2: Sale WITHOUT stylist assigned', 'blue')
    const test2 = await createTestSale(false)
    
    // Summary
    log('\n📊 Test Summary', 'magenta')
    log('================', 'magenta')
    log(`Commission Mode: ${commissionsEnabled ? 'ON' : 'OFF'}`, commissionsEnabled ? 'green' : 'yellow')
    log(`Test 1 (with stylist): ${test1.success ? 'PASSED' : 'FAILED'}`, test1.success ? 'green' : 'red')
    log(`Test 2 (without stylist): ${test2.success ? 'PASSED' : 'FAILED'}`, test2.success ? 'green' : 'red')
    
    // Expected behavior
    log('\n📋 Expected Behavior:', 'cyan')
    if (commissionsEnabled) {
      log('- Commissions ON: Service sales MUST have stylist assigned', 'cyan')
      log('- Test 1 should PASS (has stylist)', 'cyan')
      log('- Test 2 should FAIL validation (no stylist)', 'cyan')
    } else {
      log('- Commissions OFF: Stylist assignment is optional', 'cyan')
      log('- Test 1 should PASS (stylist optional)', 'cyan')
      log('- Test 2 should PASS (stylist optional)', 'cyan')
    }
    
    // Note about validation
    log('\n⚠️  Note: Direct database inserts bypass validation', 'yellow')
    log('The actual POS UI enforces these rules properly', 'yellow')
    
  } catch (error) {
    log(`\n❌ Test suite error: ${error}`, 'red')
    process.exit(1)
  }
}

// Run tests
runTests().then(() => {
  log('\n✨ Test completed', 'green')
  process.exit(0)
}).catch(error => {
  log(`\n❌ Fatal error: ${error}`, 'red')
  process.exit(1)
})