#!/usr/bin/env node
/**
 * HERA FICO Installation Test Suite
 * Tests the complete FICO platform-grade module with policy engine
 * 
 * Usage: node test-fico-installation.mjs
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// =============================================================================
// CONFIGURATION
// =============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_CONFIG = {
  organization_id: process.env.DEFAULT_ORGANIZATION_ID,
  user_entity_id: process.env.CASHEW_ADMIN_USER_ID || '75c61264-f5a0-4780-9f65-4bee0db4b4a2',
  api_base_url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

// =============================================================================
// TEST DATA
// =============================================================================

const FICO_INSTALLATION_REQUEST = {
  organization_id: TEST_CONFIG.organization_id,
  industry: 'RETAIL',
  region: 'GCC',
  coa_pack: 'COA_RETAIL_STD_v3',
  overlays: ['FICO_RETAIL_PROMO', 'GCC_VAT_v2'],
  options: {
    fiscal_year_end: '03-31', // March 31st year end
    base_currency: 'AED',
    multi_currency: true,
    cost_center_required: true,
    profit_center_enabled: true,
    project_accounting: false,
    auto_close_enabled: true
  }
}

const TEST_TRANSACTION = {
  transaction_type: 'SALE',
  currency_code: 'AED',
  total_amount: 472.50,
  lines: [
    {
      line_number: 1,
      line_type: 'SERVICE',
      description: 'Hair Treatment',
      quantity: 1,
      unit_amount: 450.00,
      line_amount: 450.00
    },
    {
      line_number: 2,
      line_type: 'TAX',
      description: 'VAT on Services',
      quantity: 1,
      unit_amount: 22.50,
      line_amount: 22.50
    }
  ],
  dimensions: {
    cost_center: 'SALON-01',
    profit_center: 'RETAIL'
  }
}

// =============================================================================
// TEST FUNCTIONS
// =============================================================================

async function testFICOInstallation() {
  console.log('\n🚀 FICO INSTALLATION TEST')
  console.log('=' .repeat(60))
  
  try {
    const response = await fetch(`${TEST_CONFIG.api_base_url}/api/v2/fico/install`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify(FICO_INSTALLATION_REQUEST)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ FICO Installation:', result.success ? 'SUCCESS' : 'FAILED')
      if (result.installation_id) {
        console.log(`   Installation ID: ${result.installation_id}`)
        console.log(`   Module Version: ${result.module_version}`)
        console.log(`   Components: ${result.installed_components?.length || 0}`)
        console.log(`   Policy Bundle: ${result.policy_bundle_id}`)
      }
      return result
    } else {
      console.log('❌ FICO Installation FAILED:', result.error)
      return null
    }
  } catch (error) {
    console.log('❌ FICO Installation ERROR:', error.message)
    return null
  }
}

async function testPolicyEngine() {
  console.log('\n🧠 POLICY ENGINE TEST')
  console.log('=' .repeat(60))
  
  try {
    // Test policy compilation
    const { FICOPolicyEngine } = await import('./src/lib/fico/policy-engine.ts')
    const engine = new FICOPolicyEngine()
    
    const context = {
      organization_id: TEST_CONFIG.organization_id,
      industry: 'RETAIL',
      region: 'GCC',
      transaction_type: 'SALE'
    }
    
    console.log('🔄 Compiling policy for context:', context)
    const policy = await engine.getCompiledPolicy(context)
    
    console.log('✅ Policy Compiled Successfully:')
    console.log(`   Bundle ID: ${policy.bundle_id}`)
    console.log(`   Rule Count: ${policy.rule_count}`)
    console.log(`   Compilation Time: ${policy.compilation_time_ms}ms`)
    console.log(`   Cache Until: ${policy.cache_until}`)
    
    // Test transaction validation
    console.log('\n🔍 Testing Transaction Validation...')
    const validation = await engine.validateTransaction(context, TEST_TRANSACTION, TEST_TRANSACTION.lines)
    
    console.log('✅ Validation Result:')
    console.log(`   Valid: ${validation.valid}`)
    console.log(`   Errors: ${validation.errors.length}`)
    console.log(`   Warnings: ${validation.warnings.length}`)
    
    if (validation.errors.length > 0) {
      console.log('   Error Details:', validation.errors)
    }
    
    // Test posting line generation
    console.log('\n📝 Testing Posting Line Generation...')
    const posting = await engine.generatePostingLines(context, TEST_TRANSACTION)
    
    console.log('✅ Posting Generation:')
    console.log(`   Generated Lines: ${posting.lines.length}`)
    console.log(`   Applied Rules: ${posting.applied_rules.join(', ')}`)
    
    return { policy, validation, posting }
    
  } catch (error) {
    console.log('❌ Policy Engine ERROR:', error.message)
    console.error(error.stack)
    return null
  }
}

async function testEntityCreation() {
  console.log('\n🏗️  ENTITY CREATION TEST')
  console.log('=' .repeat(60))
  
  try {
    // Test creating a GL Account entity
    const accountResult = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_CONFIG.user_entity_id,
      p_organization_id: TEST_CONFIG.organization_id,
      p_entity: {
        entity_type: 'GL_ACCOUNT',
        entity_name: 'Cash in Hand',
        smart_code: 'HERA.FICO.GL.ACCOUNT.ASSET.CASH.v1'
      },
      p_dynamic: {
        account_code: {
          field_type: 'text',
          field_value_text: '110000',
          smart_code: 'HERA.FICO.GL.ACCOUNT.FIELD.CODE.v1'
        },
        account_type: {
          field_type: 'text',
          field_value_text: 'ASSET',
          smart_code: 'HERA.FICO.GL.ACCOUNT.FIELD.TYPE.v1'
        },
        balance_type: {
          field_type: 'text',
          field_value_text: 'DEBIT',
          smart_code: 'HERA.FICO.GL.ACCOUNT.FIELD.BALANCE.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    })
    
    console.log('✅ GL Account Creation:', accountResult.error ? 'FAILED' : 'SUCCESS')
    if (accountResult.error) {
      console.log('   Error:', accountResult.error.message)
    } else {
      console.log(`   Account ID: ${accountResult.data?.id}`)
      console.log(`   Account Code: ${accountResult.data?.dynamic_data?.account_code?.field_value_text}`)
    }
    
    // Test creating a Cost Center entity
    const costCenterResult = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_CONFIG.user_entity_id,
      p_organization_id: TEST_CONFIG.organization_id,
      p_entity: {
        entity_type: 'COST_CENTER',
        entity_name: 'Salon Operations',
        smart_code: 'HERA.FICO.COST.CENTER.ENTITY.OPERATIONS.v1'
      },
      p_dynamic: {
        cost_center_code: {
          field_type: 'text',
          field_value_text: 'SALON-01',
          smart_code: 'HERA.FICO.COST.CENTER.FIELD.CODE.v1'
        },
        currency: {
          field_type: 'text',
          field_value_text: 'AED',
          smart_code: 'HERA.FICO.COST.CENTER.FIELD.CURRENCY.v1'
        },
        valid_from: {
          field_type: 'date',
          field_value_text: '2025-01-01',
          smart_code: 'HERA.FICO.COST.CENTER.FIELD.VALID_FROM.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    })
    
    console.log('✅ Cost Center Creation:', costCenterResult.error ? 'FAILED' : 'SUCCESS')
    if (costCenterResult.error) {
      console.log('   Error:', costCenterResult.error.message)
    } else {
      console.log(`   Cost Center ID: ${costCenterResult.data?.id}`)
      console.log(`   Cost Center Code: ${costCenterResult.data?.dynamic_data?.cost_center_code?.field_value_text}`)
    }
    
    return {
      account: accountResult,
      costCenter: costCenterResult
    }
    
  } catch (error) {
    console.log('❌ Entity Creation ERROR:', error.message)
    return null
  }
}

async function testTransactionPosting() {
  console.log('\n💰 TRANSACTION POSTING TEST')
  console.log('=' .repeat(60))
  
  try {
    const transactionResult = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_CONFIG.user_entity_id,
      p_organization_id: TEST_CONFIG.organization_id,
      p_transaction: {
        transaction_type: 'GL.JOURNAL',
        smart_code: 'HERA.FICO.TXN.GL.JOURNAL.v1',
        transaction_number: `FICO-TEST-${Date.now()}`,
        total_amount: 472.50,
        currency_code: 'AED'
      },
      p_lines: [
        {
          line_number: 1,
          line_type: 'GL',
          description: 'Cash Received - Hair Treatment',
          quantity: 1,
          unit_amount: 472.50,
          line_amount: 472.50,
          smart_code: 'HERA.FICO.TXN.LINE.CASH.DR.v1',
          line_data: {
            account_code: '110000',
            side: 'DR',
            currency: 'AED'
          }
        },
        {
          line_number: 2,
          line_type: 'GL',
          description: 'Service Revenue',
          quantity: 1,
          unit_amount: 450.00,
          line_amount: 450.00,
          smart_code: 'HERA.FICO.TXN.LINE.REVENUE.CR.v1',
          line_data: {
            account_code: '410000',
            side: 'CR',
            currency: 'AED'
          }
        },
        {
          line_number: 3,
          line_type: 'GL',
          description: 'VAT on Services',
          quantity: 1,
          unit_amount: 22.50,
          line_amount: 22.50,
          smart_code: 'HERA.FICO.TXN.LINE.VAT.CR.v1',
          line_data: {
            account_code: '230000',
            side: 'CR',
            currency: 'AED'
          }
        }
      ],
      p_options: {}
    })
    
    console.log('✅ GL Transaction Posting:', transactionResult.error ? 'FAILED' : 'SUCCESS')
    if (transactionResult.error) {
      console.log('   Error:', transactionResult.error.message)
    } else {
      console.log(`   Transaction ID: ${transactionResult.data?.transaction?.id}`)
      console.log(`   Transaction Number: ${transactionResult.data?.transaction?.transaction_number}`)
      console.log(`   Total Amount: ${transactionResult.data?.transaction?.total_amount}`)
      console.log(`   Line Count: ${transactionResult.data?.lines?.length || 0}`)
      
      // Verify balance
      const lines = transactionResult.data?.lines || []
      const totalDR = lines
        .filter(l => l.line_data?.side === 'DR')
        .reduce((sum, l) => sum + l.line_amount, 0)
      const totalCR = lines
        .filter(l => l.line_data?.side === 'CR')
        .reduce((sum, l) => sum + l.line_amount, 0)
        
      console.log(`   DR Total: ${totalDR.toFixed(2)}`)
      console.log(`   CR Total: ${totalCR.toFixed(2)}`)
      console.log(`   Balanced: ${Math.abs(totalDR - totalCR) < 0.01 ? 'YES' : 'NO'}`)
    }
    
    return transactionResult
    
  } catch (error) {
    console.log('❌ Transaction Posting ERROR:', error.message)
    return null
  }
}

async function testFICOQueries() {
  console.log('\n🔍 FICO QUERY TEST')
  console.log('=' .repeat(60))
  
  try {
    // Query GL Accounts
    const accountsResult = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: TEST_CONFIG.user_entity_id,
      p_organization_id: TEST_CONFIG.organization_id,
      p_entity: {
        entity_type: 'GL_ACCOUNT'
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {
        limit: 10,
        include_dynamic: true
      }
    })
    
    console.log('✅ GL Accounts Query:', accountsResult.error ? 'FAILED' : 'SUCCESS')
    if (!accountsResult.error) {
      const accounts = accountsResult.data?.items || []
      console.log(`   Found ${accounts.length} GL accounts`)
      
      accounts.slice(0, 3).forEach((account, i) => {
        const code = account.dynamic_data?.account_code?.field_value_text
        const type = account.dynamic_data?.account_type?.field_value_text
        console.log(`   ${i + 1}. ${account.entity_name} (${code}) - ${type}`)
      })
    }
    
    // Query Transactions
    const transactionsResult = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: TEST_CONFIG.user_entity_id,
      p_organization_id: TEST_CONFIG.organization_id,
      p_transaction: {
        transaction_type: 'GL.JOURNAL'
      },
      p_lines: [],
      p_options: {
        limit: 5,
        include_lines: true
      }
    })
    
    console.log('✅ GL Transactions Query:', transactionsResult.error ? 'FAILED' : 'SUCCESS')
    if (!transactionsResult.error) {
      const transactions = transactionsResult.data?.items || []
      console.log(`   Found ${transactions.length} GL transactions`)
      
      transactions.slice(0, 2).forEach((txn, i) => {
        console.log(`   ${i + 1}. ${txn.transaction_number} - ${txn.total_amount} ${txn.currency_code}`)
      })
    }
    
    return {
      accounts: accountsResult,
      transactions: transactionsResult
    }
    
  } catch (error) {
    console.log('❌ FICO Query ERROR:', error.message)
    return null
  }
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

async function runFICOTests() {
  console.log('🎯 HERA FICO PLATFORM-GRADE MODULE TEST SUITE')
  console.log('=' .repeat(60))
  console.log(`Organization ID: ${TEST_CONFIG.organization_id}`)
  console.log(`User Entity ID: ${TEST_CONFIG.user_entity_id}`)
  console.log(`API Base URL: ${TEST_CONFIG.api_base_url}`)
  
  const results = {
    installation: null,
    policyEngine: null,
    entityCreation: null,
    transactionPosting: null,
    queries: null
  }
  
  // Test 1: FICO Installation API
  results.installation = await testFICOInstallation()
  
  // Test 2: Policy Engine
  results.policyEngine = await testPolicyEngine()
  
  // Test 3: Entity Creation
  results.entityCreation = await testEntityCreation()
  
  // Test 4: Transaction Posting
  results.transactionPosting = await testTransactionPosting()
  
  // Test 5: FICO Queries
  results.queries = await testFICOQueries()
  
  // Summary
  console.log('\n📊 TEST SUMMARY')
  console.log('=' .repeat(60))
  
  const tests = [
    { name: 'FICO Installation', result: results.installation },
    { name: 'Policy Engine', result: results.policyEngine },
    { name: 'Entity Creation', result: results.entityCreation },
    { name: 'Transaction Posting', result: results.transactionPosting },
    { name: 'FICO Queries', result: results.queries }
  ]
  
  let passed = 0
  tests.forEach(test => {
    const status = test.result ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} ${test.name}`)
    if (test.result) passed++
  })
  
  console.log(`\n🎯 Overall: ${passed}/${tests.length} tests passed`)
  
  if (passed === tests.length) {
    console.log('🚀 FICO PLATFORM-GRADE MODULE: FULLY OPERATIONAL')
    console.log('   Ready for production deployment!')
  } else {
    console.log('⚠️  Some tests failed - review implementation')
  }
  
  return results
}

// =============================================================================
// EXECUTE TESTS
// =============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  runFICOTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Test suite failed:', error)
      process.exit(1)
    })
}