#!/usr/bin/env node
import { config } from 'dotenv'
import { universalApi } from '../src/lib/universal-api-v2'
import { postPosSaleWithCommission } from '../src/lib/playbook/finance-commissions'
import { heraCode } from '../src/lib/smart-codes'
import { getOrgSettings } from '../src/lib/playbook/org-finance-utils'
import { flags } from '../src/config/flags'

// Load environment variables
config()

// Test organization ID (use your test org)
const TEST_ORG_ID = process.env.TEST_ORGANIZATION_ID || 'e456ad1f-d467-445e-9095-d3dbc7b0ef3f'

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

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function checkCommissionMode() {
  log('\n🔍 Checking Commission Mode...', 'blue')
  
  try {
    const orgSettings = await getOrgSettings(TEST_ORG_ID)
    const commissionsEnabled = flags.ENABLE_COMMISSIONS && (orgSettings?.salon?.commissions?.enabled ?? true)
    
    log(`Organization: ${TEST_ORG_ID}`, 'cyan')
    log(`Global Flag (ENABLE_COMMISSIONS): ${flags.ENABLE_COMMISSIONS}`, 'cyan')
    log(`Org Setting (commissions.enabled): ${orgSettings?.salon?.commissions?.enabled ?? 'not set (defaults to true)'}`, 'cyan')
    log(`Effective Commission Mode: ${commissionsEnabled ? 'ON' : 'OFF'}`, commissionsEnabled ? 'green' : 'yellow')
    
    return commissionsEnabled
  } catch (error) {
    log(`Error checking commission mode: ${error}`, 'red')
    return true // Default to enabled on error
  }
}

async function findOrCreateTestEntities() {
  log('\n🏢 Setting up test entities...', 'blue')
  universalApi.setOrganizationId(TEST_ORG_ID)
  
  // Find or create a test service
  const servicesResponse = await universalApi.read('core_entities')
  const services = servicesResponse.data?.filter((e: any) => 
    e.entity_type === 'service' && e.organization_id === TEST_ORG_ID
  ) || []
  
  let service = services.find((s: any) => s.entity_name.includes('Test'))
  if (!service) {
    log('Creating test service...', 'yellow')
    const createResult = await universalApi.createEntity({
      entity_type: 'service',
      entity_name: 'Test Haircut Service',
      entity_code: 'SVC-TEST-001',
      smart_code: heraCode('HERA.SALON.SVC.HAIR.CUT.v1'),
      metadata: {
        price: 50,
        duration: 30,
        category: 'Hair Services'
      }
    })
    service = createResult.data
  }
  log(`✓ Service: ${service.entity_name} (${service.id})`, 'green')
  
  // Find or create a test stylist
  const stylistsResponse = await universalApi.read('core_entities')
  const stylists = stylistsResponse.data?.filter((e: any) => 
    e.entity_type === 'employee' && e.organization_id === TEST_ORG_ID
  ) || []
  
  let stylist = stylists.find((s: any) => s.entity_name.includes('Test'))
  if (!stylist) {
    log('Creating test stylist...', 'yellow')
    const createResult = await universalApi.createEntity({
      entity_type: 'employee',
      entity_name: 'Test Stylist',
      entity_code: 'EMP-TEST-001',
      smart_code: heraCode('HERA.SALON.HR.STAFF.STYLIST.v1'),
      metadata: {
        role: 'Senior Stylist',
        commission_rate: 0.5
      }
    })
    stylist = createResult.data
  }
  log(`✓ Stylist: ${stylist.entity_name} (${stylist.id})`, 'green')
  
  // Find or create a test branch
  const branchesResponse = await universalApi.read('core_entities')
  const branches = branchesResponse.data?.filter((e: any) => 
    e.entity_type === 'branch' && e.organization_id === TEST_ORG_ID
  ) || []
  
  let branch = branches.find((b: any) => b.entity_name.includes('Main')) || branches[0]
  if (!branch) {
    log('Creating test branch...', 'yellow')
    const createResult = await universalApi.createEntity({
      entity_type: 'branch',
      entity_name: 'Main Salon Branch',
      entity_code: 'BRANCH-001',
      smart_code: heraCode('HERA.SALON.ORG.BRANCH.MAIN.v1')
    })
    branch = createResult.data
  }
  log(`✓ Branch: ${branch.entity_name} (${branch.id})`, 'green')
  
  return { service, stylist, branch }
}

async function createPOSSale(options: {
  includeStylists: boolean
  service: any
  stylist: any
  branch: any
}) {
  const { includeStylists, service, stylist, branch } = options
  
  const transactionData = {
    organization_id: TEST_ORG_ID,
    transaction_type: 'sale',
    smart_code: heraCode('HERA.SALON.POS.SALE.HEADER.v1'),
    total_amount: 50,
    from_entity_id: branch.id,
    business_context: {
      branch_id: branch.id,
      source: 'POS_TEST',
      cashier_id: 'test-cashier',
      till_id: 'test-till-001',
      session_type: 'test'
    },
    line_items: [
      // Service line
      {
        line_entity_id: service.id,
        line_number: 1,
        quantity: 1,
        unit_price: 50,
        line_amount: 50,
        smart_code: heraCode('HERA.SALON.POS.LINE.SERVICE.v1'),
        line_data: {
          branch_id: branch.id,
          entity_type: 'service',
          entity_name: service.entity_name,
          ...(includeStylists ? {
            stylist_entity_id: stylist.id,
            stylist_name: stylist.entity_name
          } : {})
        }
      },
      // Payment line (negative to balance)
      {
        line_number: 2,
        line_amount: -50,
        smart_code: heraCode('HERA.SALON.POS.PAYMENT.CASH.v1'),
        line_data: {
          branch_id: branch.id,
          payment_method: 'cash',
          till_id: 'test-till-001'
        }
      }
    ]
  }
  
  log(`\n💰 Creating POS sale ${includeStylists ? 'WITH' : 'WITHOUT'} stylist...`, 'magenta')
  
  try {
    const result = await postPosSaleWithCommission(transactionData)
    
    if (result.success) {
      log(`✓ Sale created: ${result.transaction_code} (${result.transaction_id})`, 'green')
      
      // Check if commission lines were created
      const commissionLines = result.commission_lines || []
      if (commissionLines.length > 0) {
        log(`✓ Commission lines created: ${commissionLines.length}`, 'green')
        commissionLines.forEach((line: any, index: number) => {
          log(`  - Line ${index + 1}: $${Math.abs(line.line_amount)} for ${line.metadata?.stylist_name || 'Unknown'}`, 'cyan')
        })
      } else {
        log('ℹ️  No commission lines created', 'yellow')
      }
      
      return { success: true, result }
    } else {
      log(`✗ Sale failed: ${result.error}`, 'red')
      return { success: false, error: result.error }
    }
  } catch (error) {
    log(`✗ Error creating sale: ${error}`, 'red')
    return { success: false, error }
  }
}

async function runTests() {
  log('\n🧪 POS Commission Mode Testing', 'magenta')
  log('================================', 'magenta')
  
  try {
    // Check current commission mode
    const commissionsEnabled = await checkCommissionMode()
    
    // Set up test entities
    const { service, stylist, branch } = await findOrCreateTestEntities()
    
    // Test 1: Sale WITH stylist
    log('\n📝 Test 1: Sale WITH stylist assigned', 'blue')
    const test1 = await createPOSSale({
      includeStylists: true,
      service,
      stylist,
      branch
    })
    
    // Test 2: Sale WITHOUT stylist
    log('\n📝 Test 2: Sale WITHOUT stylist assigned', 'blue')
    const test2 = await createPOSSale({
      includeStylists: false,
      service,
      stylist,
      branch
    })
    
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
      log('- Test 2 should FAIL (no stylist)', 'cyan')
    } else {
      log('- Commissions OFF: Stylist assignment is optional', 'cyan')
      log('- Test 1 should PASS (stylist optional)', 'cyan')
      log('- Test 2 should PASS (stylist optional)', 'cyan')
    }
    
    // Verify expectations
    const expectedTest1 = true // Should always pass
    const expectedTest2 = !commissionsEnabled // Should pass only if commissions are OFF
    
    const allTestsPassed = test1.success === expectedTest1 && test2.success === expectedTest2
    
    log('\n🏁 Overall Result:', 'magenta')
    if (allTestsPassed) {
      log('✅ All tests passed as expected!', 'green')
    } else {
      log('❌ Some tests did not pass as expected', 'red')
      if (test1.success !== expectedTest1) {
        log(`  - Test 1 expected to ${expectedTest1 ? 'PASS' : 'FAIL'} but ${test1.success ? 'PASSED' : 'FAILED'}`, 'red')
      }
      if (test2.success !== expectedTest2) {
        log(`  - Test 2 expected to ${expectedTest2 ? 'PASS' : 'FAIL'} but ${test2.success ? 'PASSED' : 'FAILED'}`, 'red')
      }
    }
    
  } catch (error) {
    log(`\n❌ Test suite error: ${error}`, 'red')
    process.exit(1)
  }
}

// Run the tests
runTests().then(() => {
  log('\n✨ Test completed', 'green')
}).catch(error => {
  log(`\n❌ Fatal error: ${error}`, 'red')
  process.exit(1)
})