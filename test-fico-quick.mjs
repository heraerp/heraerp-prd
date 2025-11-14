#!/usr/bin/env node
/**
 * Quick FICO Component Test
 * Tests individual FICO components without full installation
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_CONFIG = {
  organization_id: process.env.DEFAULT_ORGANIZATION_ID,
  user_entity_id: process.env.CASHEW_ADMIN_USER_ID
}

async function testBasicConnection() {
  console.log('🔗 Testing Supabase Connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('core_organizations')
      .select('id, entity_name')
      .eq('id', TEST_CONFIG.organization_id)
      .limit(1)
    
    if (error) {
      console.log('❌ Connection failed:', error.message)
      return false
    }
    
    if (data && data.length > 0) {
      console.log('✅ Connection successful')
      console.log(`   Organization: ${data[0].entity_name}`)
      return true
    } else {
      console.log('❌ Organization not found')
      return false
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message)
    return false
  }
}

async function testGLAccountCreation() {
  console.log('\n🏦 Testing GL Account Creation...')
  
  try {
    const result = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_CONFIG.user_entity_id,
      p_organization_id: TEST_CONFIG.organization_id,
      p_entity: {
        entity_type: 'GL_ACCOUNT',
        entity_name: `Test Cash Account ${Date.now()}`,
        smart_code: 'HERA.FICO.GL.ACCOUNT.ASSET.CASH.v1'
      },
      p_dynamic: {
        account_code: {
          field_type: 'text',
          field_value_text: `TEST${Date.now().toString().slice(-6)}`,
          smart_code: 'HERA.FICO.GL.ACCOUNT.FIELD.CODE.v1'
        },
        account_type: {
          field_type: 'text',
          field_value_text: 'ASSET',
          smart_code: 'HERA.FICO.GL.ACCOUNT.FIELD.TYPE.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    })
    
    if (result.error) {
      console.log('❌ GL Account creation failed:', result.error.message)
      return false
    }
    
    console.log('✅ GL Account created successfully')
    console.log(`   Account ID: ${result.data?.id}`)
    console.log(`   Account Code: ${result.data?.dynamic_data?.account_code?.field_value_text}`)
    return true
    
  } catch (error) {
    console.log('❌ GL Account creation error:', error.message)
    return false
  }
}

async function testTransactionCreation() {
  console.log('\n💰 Testing Transaction Creation...')
  
  try {
    const result = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_CONFIG.user_entity_id,
      p_organization_id: TEST_CONFIG.organization_id,
      p_transaction: {
        transaction_type: 'GL.JOURNAL',
        smart_code: 'HERA.FICO.TXN.GL.JOURNAL.v1',
        transaction_number: `FICO-${Date.now()}`,
        total_amount: 1000.00,
        currency_code: 'AED'
      },
      p_lines: [
        {
          line_number: 1,
          line_type: 'GL',
          description: 'Test Debit Entry',
          quantity: 1,
          unit_amount: 1000.00,
          line_amount: 1000.00,
          smart_code: 'HERA.FICO.TXN.LINE.TEST.DR.v1'
        },
        {
          line_number: 2,
          line_type: 'GL',
          description: 'Test Credit Entry',
          quantity: 1,
          unit_amount: 1000.00,
          line_amount: 1000.00,
          smart_code: 'HERA.FICO.TXN.LINE.TEST.CR.v1'
        }
      ],
      p_options: {}
    })
    
    if (result.error) {
      console.log('❌ Transaction creation failed:', result.error.message)
      return false
    }
    
    console.log('✅ Transaction created successfully')
    console.log(`   Transaction ID: ${result.data?.transaction?.id}`)
    console.log(`   Transaction Number: ${result.data?.transaction?.transaction_number}`)
    console.log(`   Line Count: ${result.data?.lines?.length || 0}`)
    return true
    
  } catch (error) {
    console.log('❌ Transaction creation error:', error.message)
    return false
  }
}

async function testPolicyBundleCreation() {
  console.log('\n📋 Testing Policy Bundle Creation...')
  
  try {
    const policyBundle = {
      bundle_id: `FICO_TEST_${Date.now()}`,
      version: 'v1.0',
      priority: 4,
      effective_date: new Date().toISOString(),
      validations: {
        header_required: ['transaction_date', 'currency_code'],
        line_required: ['account_code', 'side', 'amount'],
        rules: [
          {
            code: 'BALANCE_CHECK',
            name: 'DR CR Balance',
            expr: 'sum("DR") == sum("CR")',
            severity: 'ERROR',
            message: 'Debits must equal credits'
          }
        ]
      },
      posting_rules: [],
      metadata: {
        created_by: TEST_CONFIG.user_entity_id,
        created_at: new Date().toISOString(),
        source: 'BASE',
        description: 'Test policy bundle'
      }
    }
    
    const result = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_CONFIG.user_entity_id,
      p_organization_id: TEST_CONFIG.organization_id,
      p_entity: {
        entity_type: 'POLICY_BUNDLE',
        entity_name: `Test Policy Bundle ${Date.now()}`,
        smart_code: 'HERA.FICO.POLICY.BUNDLE.TEST.v1'
      },
      p_dynamic: {
        policy_data: {
          field_type: 'json',
          field_value_json: policyBundle,
          smart_code: 'HERA.FICO.POLICY.DATA.JSON.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    })
    
    if (result.error) {
      console.log('❌ Policy Bundle creation failed:', result.error.message)
      return false
    }
    
    console.log('✅ Policy Bundle created successfully')
    console.log(`   Bundle ID: ${result.data?.id}`)
    console.log(`   Policy Bundle ID: ${policyBundle.bundle_id}`)
    return true
    
  } catch (error) {
    console.log('❌ Policy Bundle creation error:', error.message)
    return false
  }
}

async function runQuickTests() {
  console.log('⚡ FICO QUICK COMPONENT TESTS')
  console.log('=' .repeat(50))
  console.log(`Org ID: ${TEST_CONFIG.organization_id}`)
  console.log(`User ID: ${TEST_CONFIG.user_entity_id}`)
  
  const tests = [
    { name: 'Supabase Connection', test: testBasicConnection },
    { name: 'GL Account Creation', test: testGLAccountCreation },
    { name: 'Policy Bundle Creation', test: testPolicyBundleCreation },
    { name: 'Transaction Creation', test: testTransactionCreation }
  ]
  
  let passed = 0
  
  for (const { name, test } of tests) {
    const result = await test()
    if (result) passed++
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('\n📊 RESULTS')
  console.log('=' .repeat(50))
  console.log(`✅ Passed: ${passed}/${tests.length}`)
  
  if (passed === tests.length) {
    console.log('🚀 FICO Core Components: OPERATIONAL')
  } else {
    console.log('⚠️  Some components need attention')
  }
  
  return passed === tests.length
}

// Run tests
runQuickTests()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Test failure:', error)
    process.exit(1)
  })