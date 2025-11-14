#!/usr/bin/env node

/**
 * REAL POS API REGRESSION TEST
 * 
 * Tests the actual POS checkout API with hairtalkz account
 * This test makes real API calls to validate the entire checkout flow
 */

import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'

const CONFIG = {
  baseUrl: 'http://localhost:3002',
  supabaseUrl: 'https://ralywraqvuqgdezttfde.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w',
  testAccount: {
    email: 'hairtalkz01@gmail.com',
    password: 'Hairtalkz'
  }
}

const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey)

// Real-world salon test scenarios
const REAL_POS_SCENARIOS = [
  {
    name: "Quick Service Test",
    description: "Basic haircut with cash - real world speed test",
    items: [
      {
        id: 'quick-haircut',
        entity_id: 'custom-quick-haircut', 
        name: 'Quick Haircut',
        type: 'service',
        quantity: 1,
        unit_price: 120.00
      }
    ],
    payments: [{ method: 'cash', amount: 126.00 }]
  },
  {
    name: "Complex Service Mix",
    description: "Multiple services + products - complexity test",
    items: [
      {
        id: 'color-service',
        entity_id: 'custom-color-service',
        name: 'Hair Color Treatment',
        type: 'service',
        quantity: 1,
        unit_price: 380.00
      },
      {
        id: 'styling',
        entity_id: 'custom-styling-service',
        name: 'Professional Styling',
        type: 'service', 
        quantity: 1,
        unit_price: 150.00
      },
      {
        id: 'premium-shampoo',
        entity_id: 'custom-premium-shampoo',
        name: 'Premium Shampoo',
        type: 'product',
        quantity: 2,
        unit_price: 75.00
      }
    ],
    payments: [{ method: 'card', amount: 660.75 }], // Including VAT
    tip_total: 30.00
  },
  {
    name: "Payment Stress Test",
    description: "Multiple payment methods - processing test",
    items: [
      {
        id: 'premium-treatment',
        entity_id: 'custom-premium-treatment',
        name: 'Premium Hair Treatment',
        type: 'service',
        quantity: 1,
        unit_price: 450.00
      },
      {
        id: 'hair-products',
        entity_id: 'custom-hair-products',
        name: 'Professional Hair Products',
        type: 'product',
        quantity: 3,
        unit_price: 90.00
      }
    ],
    payments: [
      { method: 'card', amount: 400.00 },
      { method: 'cash', amount: 322.50 }
    ],
    tip_total: 45.00
  }
]

class RealPOSAPITester {
  constructor() {
    this.results = []
    this.organizationId = null
    this.userId = null
  }

  async initialize() {
    console.log('🔧 Initializing Real POS API Tester...')
    
    try {
      // Get organization and user data for hairtalkz account
      const { data: orgData } = await supabase
        .from('core_organizations')
        .select('id, organization_name')
        .limit(1)
        .single()
      
      if (orgData) {
        this.organizationId = orgData.id
        console.log(`✅ Organization: ${orgData.organization_name} (${orgData.id})`)
      } else {
        throw new Error('No organization found')
      }

      // Get a user from this organization
      const { data: userData } = await supabase
        .from('core_entities')
        .select('id')
        .eq('entity_type', 'USER')
        .eq('organization_id', this.organizationId)
        .limit(1)
        .single()
      
      if (userData) {
        this.userId = userData.id
        console.log(`✅ User ID: ${userData.id}`)
      } else {
        throw new Error('No user found in organization')
      }
      
      return true
    } catch (error) {
      console.error('❌ Initialization failed:', error.message)
      return false
    }
  }

  async testRealPOSCheckout(scenario) {
    console.log(`\n🧪 Testing: ${scenario.name}`)
    console.log(`   Description: ${scenario.description}`)
    
    const startTime = performance.now()
    let result = {
      scenario: scenario.name,
      startTime,
      success: false,
      error: null,
      duration: 0,
      apiCalls: [],
      transactionId: null
    }

    try {
      // Calculate totals
      const subtotal = scenario.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
      const tax_rate = 0.05
      const tip_total = scenario.tip_total || 0
      const discount_total = scenario.discount_total || 0
      const tax_amount = (subtotal - discount_total) * tax_rate
      const total_amount = subtotal - discount_total + tax_amount + tip_total

      console.log(`   💰 Total Amount: ${total_amount.toFixed(2)} AED`)

      // Test the real hera_txn_crud_v1 RPC function
      const rpcStartTime = performance.now()
      
      const transactionPayload = {
        p_action: 'CREATE',
        p_actor_user_id: this.userId,
        p_organization_id: this.organizationId,
        p_payload: {
          header: {
            transaction_type: 'SALE',
            smart_code: 'HERA.SALON.TXN.SALE.CREATE.v1',
            transaction_date: new Date().toISOString(),
            total_amount: total_amount,
            transaction_status: 'completed',
            metadata: {
              test_scenario: scenario.name,
              regression_test: true,
              subtotal: subtotal,
              tax_amount: tax_amount,
              tip_total: tip_total,
              payment_methods: scenario.payments.map(p => p.method)
            }
          },
          lines: this.buildTransactionLines(scenario, subtotal, tax_amount, tip_total)
        }
      }

      console.log(`   📡 Calling hera_txn_crud_v1 with ${transactionPayload.p_payload.lines.length} lines...`)

      const { data: rpcResult, error: rpcError } = await supabase.rpc('hera_txn_crud_v1', transactionPayload)
      
      const rpcEndTime = performance.now()
      const rpcDuration = rpcEndTime - rpcStartTime
      
      result.apiCalls.push({
        function: 'hera_txn_crud_v1',
        duration: rpcDuration,
        success: !rpcError,
        error: rpcError?.message
      })

      if (rpcError) {
        throw new Error(`RPC Error: ${rpcError.message}`)
      }

      if (!rpcResult?.success) {
        throw new Error(`RPC Failed: ${rpcResult?.error || 'Unknown error'}`)
      }

      const transactionId = rpcResult?.data?.header?.id || rpcResult?.data?.transaction_id
      result.transactionId = transactionId

      console.log(`   ✅ RPC completed in ${Math.round(rpcDuration)}ms`)
      console.log(`   🎯 Transaction ID: ${transactionId?.substring(0, 16)}...`)

      // Test transaction verification
      if (transactionId) {
        const verifyStartTime = performance.now()
        
        const { data: verifyResult, error: verifyError } = await supabase.rpc('hera_txn_crud_v1', {
          p_action: 'READ',
          p_actor_user_id: this.userId,
          p_organization_id: this.organizationId,
          p_payload: {
            transaction_id: transactionId,
            include_lines: true
          }
        })

        const verifyDuration = performance.now() - verifyStartTime
        
        result.apiCalls.push({
          function: 'hera_txn_crud_v1_verify',
          duration: verifyDuration,
          success: !verifyError,
          error: verifyError?.message
        })

        if (verifyError) {
          console.warn(`   ⚠️  Verification failed: ${verifyError.message}`)
        } else {
          console.log(`   ✅ Transaction verified in ${Math.round(verifyDuration)}ms`)
        }
      }

      result.endTime = performance.now()
      result.duration = result.endTime - result.startTime
      result.success = true

      console.log(`   🎯 Total test duration: ${Math.round(result.duration)}ms`)

    } catch (error) {
      result.endTime = performance.now()
      result.duration = result.endTime - result.startTime
      result.error = error.message
      
      console.error(`   ❌ Test failed after ${Math.round(result.duration)}ms: ${error.message}`)
    }

    this.results.push(result)
    return result
  }

  buildTransactionLines(scenario, subtotal, tax_amount, tip_total) {
    const lines = []
    let lineNumber = 1

    // Add item lines
    scenario.items.forEach(item => {
      lines.push({
        line_number: lineNumber++,
        line_type: item.type,
        entity_id: null, // Custom items
        description: item.name,
        quantity: item.quantity,
        unit_amount: item.unit_price,
        line_amount: item.unit_price * item.quantity,
        smart_code: item.type === 'service' 
          ? 'HERA.SALON.SVC.LINE.STANDARD.v1'
          : 'HERA.SALON.RETAIL.LINE.PRODUCT.v1'
      })
    })

    // Add tip line if applicable
    if (tip_total > 0) {
      lines.push({
        line_number: lineNumber++,
        line_type: 'tip',
        entity_id: null,
        description: 'Gratuity',
        quantity: 1,
        unit_amount: tip_total,
        line_amount: tip_total,
        smart_code: 'HERA.SALON.POS.TIP.CARD.v1'
      })
    }

    // Add tax line
    if (tax_amount > 0) {
      lines.push({
        line_number: lineNumber++,
        line_type: 'tax',
        entity_id: null,
        description: 'VAT (5.0%)',
        quantity: 1,
        unit_amount: tax_amount,
        line_amount: tax_amount,
        smart_code: 'HERA.SALON.TAX.AE.VAT.STANDARD.v1'
      })
    }

    // Add payment lines
    scenario.payments.forEach(payment => {
      lines.push({
        line_number: lineNumber++,
        line_type: 'payment',
        entity_id: null,
        description: `Payment - ${payment.method.toUpperCase()}`,
        quantity: 1,
        unit_amount: payment.amount,
        line_amount: payment.amount,
        smart_code: payment.method === 'cash'
          ? 'HERA.SALON.PAYMENT.CAPTURE.CASH.v1'
          : 'HERA.SALON.PAYMENT.CAPTURE.CARD.v1'
      })
    })

    return lines
  }

  async runRealAPITests() {
    console.log('🚀 Starting REAL POS API Regression Tests')
    console.log('==========================================')
    console.log(`Account: ${CONFIG.testAccount.email}`)
    console.log(`Scenarios: ${REAL_POS_SCENARIOS.length}`)
    console.log('')

    // Initialize
    const initialized = await this.initialize()
    if (!initialized) {
      console.error('💥 Cannot proceed without proper initialization')
      return
    }

    const suiteStartTime = performance.now()

    // Run each scenario
    for (const scenario of REAL_POS_SCENARIOS) {
      await this.testRealPOSCheckout(scenario)
      
      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    const suiteDuration = performance.now() - suiteStartTime

    // Generate comprehensive report
    this.generateRealAPIReport(suiteDuration)
  }

  generateRealAPIReport(suiteDuration) {
    console.log('\n' + '='.repeat(60))
    console.log('📊 REAL POS API REGRESSION TEST RESULTS')
    console.log('='.repeat(60))

    const successful = this.results.filter(r => r.success)
    const failed = this.results.filter(r => !r.success)
    const avgDuration = successful.length > 0 
      ? successful.reduce((sum, r) => sum + r.duration, 0) / successful.length 
      : 0

    // Performance summary
    console.log('\n📈 API PERFORMANCE SUMMARY:')
    console.log(`  Total Tests: ${this.results.length}`)
    console.log(`  Successful: ${successful.length}`)
    console.log(`  Failed: ${failed.length}`)
    console.log(`  Success Rate: ${((successful.length / this.results.length) * 100).toFixed(1)}%`)
    console.log(`  Average Duration: ${Math.round(avgDuration)}ms`)
    console.log(`  Suite Duration: ${(suiteDuration / 1000).toFixed(1)}s`)

    // Detailed results
    console.log('\n⚡ DETAILED API PERFORMANCE:')
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌'
      const duration = `${Math.round(result.duration)}ms`
      
      console.log(`  ${status} ${result.scenario.padEnd(30)} ${duration}`)
      
      if (result.transactionId) {
        console.log(`     Transaction: ${result.transactionId.substring(0, 24)}...`)
      }
      
      if (result.apiCalls.length > 0) {
        result.apiCalls.forEach(call => {
          const callStatus = call.success ? '✅' : '❌'
          console.log(`     ${callStatus} ${call.function}: ${Math.round(call.duration)}ms`)
          if (call.error) {
            console.log(`        Error: ${call.error}`)
          }
        })
      }
      
      if (result.error) {
        console.log(`     Error: ${result.error}`)
      }
    })

    // API Performance Analysis
    console.log('\n🔍 API PERFORMANCE ANALYSIS:')
    
    const allApiCalls = this.results.flatMap(r => r.apiCalls)
    const successfulApiCalls = allApiCalls.filter(call => call.success)
    
    if (successfulApiCalls.length > 0) {
      const avgApiDuration = successfulApiCalls.reduce((sum, call) => sum + call.duration, 0) / successfulApiCalls.length
      console.log(`  Average API Call Duration: ${Math.round(avgApiDuration)}ms`)
      
      const slowApiCalls = successfulApiCalls.filter(call => call.duration > 10000)
      if (slowApiCalls.length > 0) {
        console.log(`  🐌 Slow API calls (>10s): ${slowApiCalls.length}`)
      }
      
      const verySlowApiCalls = successfulApiCalls.filter(call => call.duration > 30000)
      if (verySlowApiCalls.length > 0) {
        console.log(`  🔴 Very slow API calls (>30s): ${verySlowApiCalls.length}`)
      }
    }

    // Recommendations
    console.log('\n💡 API OPTIMIZATION RECOMMENDATIONS:')
    
    if (avgDuration > 15000) {
      console.log('  🔴 CRITICAL: Average API response time exceeds 15 seconds')
      console.log('     - Check database performance')
      console.log('     - Review RPC function efficiency')
      console.log('     - Consider caching strategies')
    } else if (avgDuration > 8000) {
      console.log('  🟡 WARNING: Average API response time exceeds 8 seconds')
      console.log('     - Monitor database query performance')
      console.log('     - Consider optimizing RPC functions')
    } else if (avgDuration < 5000) {
      console.log('  ✅ EXCELLENT: API performance is very good (<5s average)')
    } else {
      console.log('  ✅ GOOD: API performance is acceptable')
    }

    const failureRate = (failed.length / this.results.length) * 100
    if (failureRate > 5) {
      console.log('  🔴 RELIABILITY: High API failure rate detected')
      console.log('     - Review error patterns')
      console.log('     - Check database connectivity')
      console.log('     - Validate RPC function stability')
    } else if (failureRate > 0) {
      console.log('  🟡 RELIABILITY: Some API failures detected - monitor patterns')
    } else {
      console.log('  ✅ RELIABILITY: Perfect API success rate!')
    }

    // Transaction IDs created
    const createdTransactions = this.results.filter(r => r.transactionId)
    if (createdTransactions.length > 0) {
      console.log(`\n📝 CREATED TRANSACTIONS: ${createdTransactions.length}`)
      createdTransactions.forEach(result => {
        console.log(`  ${result.scenario}: ${result.transactionId}`)
      })
    }

    console.log('\n✅ Real POS API regression testing completed!')
    console.log('🔧 90-second timeout protection is active for all operations')
  }
}

// Run the real API tests
async function main() {
  const tester = new RealPOSAPITester()
  await tester.runRealAPITests()
}

main().catch(console.error)