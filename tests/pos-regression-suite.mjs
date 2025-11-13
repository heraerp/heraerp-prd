#!/usr/bin/env node

/**
 * POS REGRESSION TESTING SUITE
 * 
 * Comprehensive testing for salon POS performance, bottlenecks, and user experience
 * Tests multiple transaction scenarios with timing analysis and bottleneck detection
 * 
 * Usage:
 * node tests/pos-regression-suite.mjs
 * 
 * Environment Variables Required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY  
 * - TEST_ORGANIZATION_ID
 * - TEST_USER_ID
 */

import { createClient } from '@supabase/supabase-js'
import { performance } from 'perf_hooks'

// Configuration
const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  orgId: process.env.TEST_ORGANIZATION_ID,
  userId: process.env.TEST_USER_ID,
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3002'
}

// Validate configuration
if (!config.supabaseUrl || !config.supabaseKey || !config.orgId || !config.userId) {
  console.error('❌ Missing required environment variables:')
  console.error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEST_ORGANIZATION_ID, TEST_USER_ID')
  process.exit(1)
}

const supabase = createClient(config.supabaseUrl, config.supabaseKey)

// Test data scenarios
const TEST_SCENARIOS = [
  {
    name: "Simple Service Sale",
    description: "Single haircut service, cash payment",
    complexity: "LOW",
    items: [
      { name: "Basic Haircut", type: "service", price: 150.00, quantity: 1 }
    ],
    payments: [{ method: "cash", amount: 150.00 }]
  },
  {
    name: "Multi-Service Complex",
    description: "3 services, 2 products, card payment, tip",
    complexity: "MEDIUM",
    items: [
      { name: "Hair Color", type: "service", price: 450.00, quantity: 1 },
      { name: "Cut & Style", type: "service", price: 200.00, quantity: 1 },
      { name: "Hair Treatment", type: "service", price: 180.00, quantity: 1 },
      { name: "Shampoo", type: "product", price: 85.00, quantity: 2 },
      { name: "Conditioner", type: "product", price: 75.00, quantity: 1 }
    ],
    payments: [{ method: "card", amount: 1100.00 }],
    tip: 50.00
  },
  {
    name: "Large Group Booking",
    description: "5+ services, multiple staff, mixed payments",
    complexity: "HIGH",
    items: [
      { name: "Bridal Styling", type: "service", price: 800.00, quantity: 1 },
      { name: "Makeup", type: "service", price: 300.00, quantity: 1 },
      { name: "Manicure", type: "service", price: 120.00, quantity: 3 },
      { name: "Hair Extensions", type: "service", price: 600.00, quantity: 1 },
      { name: "Premium Products", type: "product", price: 150.00, quantity: 4 }
    ],
    payments: [
      { method: "card", amount: 1500.00 },
      { method: "cash", amount: 920.00 }
    ],
    tip: 120.00,
    discount: 100.00
  },
  {
    name: "Multiple Payment Methods",
    description: "Split payments across cash/card with change",
    complexity: "MEDIUM",
    items: [
      { name: "Hair Color", type: "service", price: 350.00, quantity: 1 },
      { name: "Premium Treatment", type: "product", price: 180.00, quantity: 1 }
    ],
    payments: [
      { method: "cash", amount: 300.00 },
      { method: "card", amount: 230.00 }
    ]
  },
  {
    name: "Stress Test Large Transaction",
    description: "Maximum items to test database performance",
    complexity: "EXTREME",
    items: Array.from({ length: 15 }, (_, i) => ({
      name: `Service ${i + 1}`,
      type: i % 3 === 0 ? "product" : "service",
      price: 50 + (i * 25),
      quantity: 1
    })),
    payments: [{ method: "card", amount: 2000.00 }],
    tip: 200.00
  }
]

// Performance tracking
class PerformanceTracker {
  constructor() {
    this.metrics = []
    this.errors = []
  }

  startTimer(operation) {
    return {
      operation,
      startTime: performance.now(),
      end: () => performance.now()
    }
  }

  recordMetric(operation, duration, success = true, details = {}) {
    this.metrics.push({
      operation,
      duration,
      success,
      timestamp: new Date().toISOString(),
      ...details
    })
  }

  recordError(operation, error, context = {}) {
    this.errors.push({
      operation,
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    })
  }

  generateReport() {
    const successful = this.metrics.filter(m => m.success)
    const failed = this.metrics.filter(m => !m.success)
    
    const avgDuration = successful.length > 0 
      ? successful.reduce((sum, m) => sum + m.duration, 0) / successful.length
      : 0

    const slowOperations = successful.filter(m => m.duration > 5000) // > 5 seconds

    return {
      summary: {
        total_operations: this.metrics.length,
        successful: successful.length,
        failed: failed.length,
        success_rate: `${((successful.length / this.metrics.length) * 100).toFixed(1)}%`,
        average_duration: `${avgDuration.toFixed(0)}ms`,
        slow_operations: slowOperations.length
      },
      performance: {
        fastest: successful.length > 0 ? Math.min(...successful.map(m => m.duration)).toFixed(0) + 'ms' : 'N/A',
        slowest: successful.length > 0 ? Math.max(...successful.map(m => m.duration)).toFixed(0) + 'ms' : 'N/A',
        operations_over_5s: slowOperations.length,
        operations_over_10s: successful.filter(m => m.duration > 10000).length
      },
      errors: this.errors,
      bottlenecks: this.identifyBottlenecks()
    }
  }

  identifyBottlenecks() {
    const operationGroups = {}
    
    this.metrics.forEach(metric => {
      const op = metric.operation
      if (!operationGroups[op]) {
        operationGroups[op] = []
      }
      operationGroups[op].push(metric.duration)
    })

    const bottlenecks = []
    
    Object.entries(operationGroups).forEach(([operation, durations]) => {
      const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length
      const max = Math.max(...durations)
      
      if (avg > 3000) { // Average over 3 seconds
        bottlenecks.push({
          operation,
          average_duration: `${avg.toFixed(0)}ms`,
          max_duration: `${max.toFixed(0)}ms`,
          sample_count: durations.length,
          severity: avg > 10000 ? 'HIGH' : avg > 5000 ? 'MEDIUM' : 'LOW'
        })
      }
    })

    return bottlenecks.sort((a, b) => 
      parseFloat(b.average_duration) - parseFloat(a.average_duration)
    )
  }
}

// Test execution functions
class POSRegressionTester {
  constructor() {
    this.tracker = new PerformanceTracker()
    this.testResults = []
  }

  async callRPC(functionName, params, timeout = 90000) {
    const timer = this.tracker.startTimer(`RPC_${functionName}`)
    
    try {
      console.log(`  📡 Calling ${functionName}...`)
      
      const { data, error } = await supabase.rpc(functionName, params)
      const duration = timer.end() - timer.startTime
      
      if (error) {
        this.tracker.recordMetric(`RPC_${functionName}`, duration, false, { error: error.message })
        throw new Error(`RPC ${functionName} failed: ${error.message}`)
      }
      
      this.tracker.recordMetric(`RPC_${functionName}`, duration, true, { 
        function: functionName,
        params_size: JSON.stringify(params).length 
      })
      
      console.log(`  ✅ ${functionName} completed in ${duration.toFixed(0)}ms`)
      return { data, error: null }
      
    } catch (error) {
      const duration = timer.end() - timer.startTime
      this.tracker.recordError(`RPC_${functionName}`, error, { params })
      console.error(`  ❌ ${functionName} failed after ${duration.toFixed(0)}ms:`, error.message)
      return { data: null, error: error.message }
    }
  }

  generateTestCustomer() {
    const customerNames = ['Sarah Johnson', 'Maria Garcia', 'Jennifer Chen', 'Lisa Thompson', 'Ahmed Hassan']
    return {
      entity_type: 'CUSTOMER',
      entity_name: customerNames[Math.floor(Math.random() * customerNames.length)],
      smart_code: 'HERA.SALON.CUSTOMER.ENTITY.PROFILE.v1'
    }
  }

  generateTestStaff() {
    const staffNames = ['Alex Rodriguez', 'Jamie Parker', 'Taylor Kim', 'Jordan Smith']
    return {
      entity_type: 'STAFF',
      entity_name: staffNames[Math.floor(Math.random() * staffNames.length)],
      smart_code: 'HERA.SALON.STAFF.ENTITY.PROFILE.v1'
    }
  }

  async createTestEntities() {
    const timer = this.tracker.startTimer('CREATE_TEST_ENTITIES')
    
    try {
      console.log('  🏗️ Creating test customer and staff...')
      
      // Create customer
      const customerResult = await this.callRPC('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: config.userId,
        p_organization_id: config.orgId,
        p_entity: this.generateTestCustomer(),
        p_dynamic: {
          email: {
            field_type: 'text',
            field_value_text: `test${Date.now()}@example.com`,
            smart_code: 'HERA.SALON.CUSTOMER.FIELD.EMAIL.v1'
          },
          phone: {
            field_type: 'text', 
            field_value_text: '+971501234567',
            smart_code: 'HERA.SALON.CUSTOMER.FIELD.PHONE.v1'
          }
        }
      })

      if (customerResult.error) {
        throw new Error(`Failed to create customer: ${customerResult.error}`)
      }

      // Create staff
      const staffResult = await this.callRPC('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: config.userId,
        p_organization_id: config.orgId,
        p_entity: this.generateTestStaff(),
        p_dynamic: {
          role: {
            field_type: 'text',
            field_value_text: 'Senior Stylist',
            smart_code: 'HERA.SALON.STAFF.FIELD.ROLE.v1'
          }
        }
      })

      if (staffResult.error) {
        throw new Error(`Failed to create staff: ${staffResult.error}`)
      }

      const duration = timer.end() - timer.startTime
      this.tracker.recordMetric('CREATE_TEST_ENTITIES', duration, true)

      return {
        customerId: customerResult.data?.data?.entity?.id,
        staffId: staffResult.data?.data?.entity?.id
      }
      
    } catch (error) {
      const duration = timer.end() - timer.startTime
      this.tracker.recordError('CREATE_TEST_ENTITIES', error)
      throw error
    }
  }

  buildTransactionPayload(scenario, customerId, staffId) {
    const subtotal = scenario.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const discount = scenario.discount || 0
    const tax = (subtotal - discount) * 0.05 // 5% VAT
    const tip = scenario.tip || 0
    const total = subtotal - discount + tax + tip

    const lines = []
    let lineNumber = 1

    // Add item lines
    scenario.items.forEach(item => {
      lines.push({
        line_number: lineNumber++,
        line_type: item.type,
        entity_id: `custom-${item.name.toLowerCase().replace(/\s+/g, '-')}`, // Simulate custom items
        description: item.name,
        quantity: item.quantity,
        unit_amount: item.price,
        line_amount: item.price * item.quantity,
        smart_code: item.type === 'service' 
          ? 'HERA.SALON.SVC.LINE.STANDARD.v1' 
          : 'HERA.SALON.RETAIL.LINE.PRODUCT.v1'
      })
    })

    // Add discount line if applicable
    if (discount > 0) {
      lines.push({
        line_number: lineNumber++,
        line_type: 'discount',
        entity_id: null,
        description: 'Discount',
        quantity: 1,
        unit_amount: -discount,
        line_amount: -discount,
        smart_code: 'HERA.SALON.POS.ADJUST.DISCOUNT.CART.v1'
      })
    }

    // Add tip line if applicable
    if (tip > 0) {
      lines.push({
        line_number: lineNumber++,
        line_type: 'tip',
        entity_id: null,
        description: 'Gratuity',
        quantity: 1,
        unit_amount: tip,
        line_amount: tip,
        smart_code: 'HERA.SALON.POS.TIP.CARD.v1'
      })
    }

    // Add tax line
    if (tax > 0) {
      lines.push({
        line_number: lineNumber++,
        line_type: 'tax',
        entity_id: null,
        description: 'VAT (5.0%)',
        quantity: 1,
        unit_amount: tax,
        line_amount: tax,
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

    return {
      header: {
        transaction_type: 'SALE',
        smart_code: 'HERA.SALON.TXN.SALE.CREATE.v1',
        transaction_date: new Date().toISOString(),
        source_entity_id: customerId,
        target_entity_id: staffId,
        total_amount: total,
        transaction_status: 'completed',
        metadata: {
          scenario_name: scenario.name,
          complexity: scenario.complexity,
          subtotal,
          discount,
          tax,
          tip,
          payment_methods: scenario.payments.map(p => p.method),
          test_run: true
        }
      },
      lines
    }
  }

  async runScenarioTest(scenario, iteration = 1) {
    const testName = `${scenario.name} (Run ${iteration})`
    console.log(`\n🧪 Testing: ${testName}`)
    console.log(`   Complexity: ${scenario.complexity}`)
    console.log(`   Items: ${scenario.items.length}, Payments: ${scenario.payments.length}`)

    const overallTimer = this.tracker.startTimer('COMPLETE_TRANSACTION')
    let result = {
      scenario: scenario.name,
      iteration,
      success: false,
      duration: 0,
      stages: {},
      error: null
    }

    try {
      // Stage 1: Create test entities
      const { customerId, staffId } = await this.createTestEntities()
      
      // Stage 2: Build transaction payload
      const payload = this.buildTransactionPayload(scenario, customerId, staffId)
      
      // Stage 3: Execute transaction
      const transactionTimer = this.tracker.startTimer('TRANSACTION_CREATION')
      const transactionResult = await this.callRPC('hera_txn_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: config.userId,
        p_organization_id: config.orgId,
        p_payload: payload
      })
      
      const transactionDuration = transactionTimer.end() - transactionTimer.startTime
      result.stages.transaction_creation = transactionDuration

      if (transactionResult.error) {
        throw new Error(`Transaction creation failed: ${transactionResult.error}`)
      }

      const transactionId = transactionResult.data?.data?.header?.id

      // Stage 4: Verify transaction was created successfully
      if (transactionId) {
        const verifyTimer = this.tracker.startTimer('TRANSACTION_VERIFICATION')
        const verifyResult = await this.callRPC('hera_txn_crud_v1', {
          p_action: 'READ',
          p_actor_user_id: config.userId,
          p_organization_id: config.orgId,
          p_payload: {
            transaction_id: transactionId,
            include_lines: true
          }
        })
        
        const verifyDuration = verifyTimer.end() - verifyTimer.startTime
        result.stages.verification = verifyDuration

        if (verifyResult.error) {
          console.warn(`  ⚠️ Transaction created but verification failed: ${verifyResult.error}`)
        } else {
          console.log(`  ✅ Transaction verified successfully`)
        }
      }

      const totalDuration = overallTimer.end() - overallTimer.startTime
      result.duration = totalDuration
      result.success = true

      this.tracker.recordMetric('COMPLETE_TRANSACTION', totalDuration, true, {
        scenario: scenario.name,
        complexity: scenario.complexity,
        items_count: scenario.items.length,
        transaction_id: transactionId
      })

      console.log(`  🎯 Completed in ${totalDuration.toFixed(0)}ms`)
      console.log(`     Transaction: ${transactionDuration.toFixed(0)}ms | Verification: ${result.stages.verification?.toFixed(0) || 'N/A'}ms`)

    } catch (error) {
      const totalDuration = overallTimer.end() - overallTimer.startTime
      result.duration = totalDuration
      result.error = error.message
      
      this.tracker.recordError('COMPLETE_TRANSACTION', error, { 
        scenario: scenario.name,
        iteration
      })

      console.error(`  ❌ Failed after ${totalDuration.toFixed(0)}ms: ${error.message}`)
    }

    this.testResults.push(result)
    return result
  }

  async runRegressionSuite() {
    console.log('🚀 Starting POS Regression Test Suite')
    console.log('=' .repeat(60))
    console.log(`Organization: ${config.orgId}`)
    console.log(`User: ${config.userId}`)
    console.log(`Test Scenarios: ${TEST_SCENARIOS.length}`)
    console.log('')

    const suiteStartTime = performance.now()

    // Run each scenario multiple times for statistical significance
    for (const scenario of TEST_SCENARIOS) {
      const iterations = scenario.complexity === 'EXTREME' ? 2 : 3

      for (let i = 1; i <= iterations; i++) {
        try {
          await this.runScenarioTest(scenario, i)
          
          // Brief pause between tests to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 1000))
          
        } catch (error) {
          console.error(`💥 Critical error in ${scenario.name} iteration ${i}:`, error)
        }
      }
    }

    const totalDuration = performance.now() - suiteStartTime

    // Generate comprehensive report
    console.log('\n' + '='.repeat(60))
    console.log('📊 REGRESSION TEST RESULTS')
    console.log('='.repeat(60))

    const report = this.tracker.generateReport()
    
    console.log('\n📈 PERFORMANCE SUMMARY:')
    console.log(`  Total Operations: ${report.summary.total_operations}`)
    console.log(`  Success Rate: ${report.summary.success_rate}`)
    console.log(`  Average Duration: ${report.summary.average_duration}`)
    console.log(`  Test Suite Duration: ${(totalDuration / 1000).toFixed(1)}s`)

    console.log('\n⚡ PERFORMANCE DETAILS:')
    console.log(`  Fastest Operation: ${report.performance.fastest}`)
    console.log(`  Slowest Operation: ${report.performance.slowest}`)
    console.log(`  Operations > 5s: ${report.performance.operations_over_5s}`)
    console.log(`  Operations > 10s: ${report.performance.operations_over_10s}`)

    if (report.bottlenecks.length > 0) {
      console.log('\n🐌 IDENTIFIED BOTTLENECKS:')
      report.bottlenecks.forEach(bottleneck => {
        console.log(`  ${bottleneck.severity} - ${bottleneck.operation}:`)
        console.log(`    Average: ${bottleneck.average_duration} | Max: ${bottleneck.max_duration}`)
      })
    }

    if (report.errors.length > 0) {
      console.log('\n❌ ERRORS ENCOUNTERED:')
      report.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.operation}: ${error.error}`)
      })
    }

    console.log('\n🎯 SCENARIO BREAKDOWN:')
    const scenarioStats = this.getScenarioStatistics()
    scenarioStats.forEach(stat => {
      console.log(`  ${stat.scenario} (${stat.complexity}):`)
      console.log(`    Success: ${stat.success_rate} | Avg: ${stat.average_duration}ms | Runs: ${stat.total_runs}`)
      if (stat.slowest_run > 10000) {
        console.log(`    ⚠️ Slowest run: ${stat.slowest_run}ms`)
      }
    })

    console.log('\n📋 RECOMMENDATIONS:')
    this.generateRecommendations(report)

    return {
      report,
      scenarios: scenarioStats,
      total_duration: totalDuration
    }
  }

  getScenarioStatistics() {
    const scenarioGroups = {}
    
    this.testResults.forEach(result => {
      if (!scenarioGroups[result.scenario]) {
        scenarioGroups[result.scenario] = []
      }
      scenarioGroups[result.scenario].push(result)
    })

    return Object.entries(scenarioGroups).map(([scenario, results]) => {
      const successful = results.filter(r => r.success)
      const avgDuration = successful.length > 0 
        ? successful.reduce((sum, r) => sum + r.duration, 0) / successful.length 
        : 0
      
      const scenarioData = TEST_SCENARIOS.find(s => s.name === scenario)
      
      return {
        scenario,
        complexity: scenarioData?.complexity || 'UNKNOWN',
        total_runs: results.length,
        successful_runs: successful.length,
        success_rate: `${((successful.length / results.length) * 100).toFixed(0)}%`,
        average_duration: Math.round(avgDuration),
        fastest_run: successful.length > 0 ? Math.min(...successful.map(r => r.duration)) : 0,
        slowest_run: successful.length > 0 ? Math.max(...successful.map(r => r.duration)) : 0
      }
    })
  }

  generateRecommendations(report) {
    const recommendations = []

    if (parseFloat(report.summary.success_rate) < 95) {
      recommendations.push('🔴 Success rate below 95% - investigate error patterns')
    }

    if (report.performance.operations_over_10s > 0) {
      recommendations.push('🟡 Some operations taking >10s - consider optimization')
    }

    if (report.bottlenecks.length > 0) {
      const highSeverity = report.bottlenecks.filter(b => b.severity === 'HIGH')
      if (highSeverity.length > 0) {
        recommendations.push(`🔴 ${highSeverity.length} high-severity bottlenecks need immediate attention`)
      }
    }

    const avgDuration = parseFloat(report.summary.average_duration.replace('ms', ''))
    if (avgDuration > 5000) {
      recommendations.push('🟡 Average transaction time >5s - consider caching or optimization')
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Performance looks good! Monitor trends over time.')
    }

    recommendations.forEach(rec => console.log(`    ${rec}`))
  }
}

// Main execution
async function main() {
  console.log('POS Regression Testing Suite v1.0')
  console.log('Testing salon POS performance, bottlenecks, and user experience\n')

  const tester = new POSRegressionTester()
  
  try {
    const results = await tester.runRegressionSuite()
    
    // Save detailed results to file
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
    const resultsFile = `pos-regression-results-${timestamp}.json`
    
    const detailedResults = {
      timestamp: new Date().toISOString(),
      config: {
        organization_id: config.orgId,
        test_duration: `${(results.total_duration / 1000).toFixed(1)}s`
      },
      summary: results.report.summary,
      performance: results.report.performance,
      bottlenecks: results.report.bottlenecks,
      scenarios: results.scenarios,
      errors: results.report.errors,
      raw_metrics: tester.tracker.metrics
    }

    // Write results to file (optional)
    try {
      await import('fs').then(fs => {
        fs.writeFileSync(resultsFile, JSON.stringify(detailedResults, null, 2))
        console.log(`\n📁 Detailed results saved to: ${resultsFile}`)
      })
    } catch (err) {
      console.log('\n📁 Results not saved to file (fs not available in this environment)')
    }

    console.log('\n✅ Regression test suite completed successfully!')
    
  } catch (error) {
    console.error('💥 Critical error running test suite:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { POSRegressionTester, TEST_SCENARIOS }