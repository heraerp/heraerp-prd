#!/usr/bin/env node
/**
 * Complete Salon Integration Test
 * Tests all modules with workflow integration
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  modules: {}
}

async function testModule(moduleName, tests) {
  console.log(`\n📋 Testing ${moduleName} Module...`)
  testResults.modules[moduleName] = { passed: 0, failed: 0, tests: [] }
  
  for (const test of tests) {
    try {
      await test.fn()
      console.log(`  ✅ ${test.name}`)
      testResults.passed++
      testResults.modules[moduleName].passed++
    } catch (error) {
      console.error(`  ❌ ${test.name}: ${error.message}`)
      testResults.failed++
      testResults.modules[moduleName].failed++
    }
  }
}

// Test 1: Client Module
async function testClientModule(orgId) {
  const tests = [
    {
      name: 'Create client with workflow',
      fn: async () => {
        const { data: client } = await supabase
          .from('core_entities')
          .insert({
            organization_id: orgId,
            entity_type: 'customer',
            entity_name: 'Test Client ' + Date.now(),
            entity_code: 'CLIENT-' + Date.now(),
            smart_code: 'HERA.SALON.CLIENT.TEST.v1',
            status: 'active'
          })
          .select()
          .single()
        
        if (!client) throw new Error('Failed to create client')
        
        // Check if workflow can be assigned
        const { data: workflow } = await supabase
          .from('core_entities')
          .select('id')
          .eq('entity_type', 'workflow_template')
          .eq('entity_code', 'CLIENT-LIFECYCLE')
          .single()
        
        if (!workflow) throw new Error('Client workflow template not found')
      }
    },
    {
      name: 'Client list view exists',
      fn: async () => {
        // This would be a UI test in real scenario
        const pagePath = '../src/app/salon/clients/page.tsx'
        const fs = require('fs')
        if (!fs.existsSync(pagePath)) {
          throw new Error('Client list page not found')
        }
      }
    }
  ]
  
  await testModule('Client', tests)
}

// Test 2: Appointment Module
async function testAppointmentModule(orgId) {
  const tests = [
    {
      name: 'Create appointment with workflow',
      fn: async () => {
        // Get a client and service first
        const { data: client } = await supabase
          .from('core_entities')
          .select('id')
          .eq('organization_id', orgId)
          .eq('entity_type', 'customer')
          .limit(1)
          .single()
        
        const { data: service } = await supabase
          .from('core_entities')
          .select('id')
          .eq('organization_id', orgId)
          .eq('entity_type', 'service')
          .limit(1)
          .single()
        
        if (!client || !service) throw new Error('Prerequisites not found')
        
        // Create appointment
        const { data: appointment } = await supabase
          .from('universal_transactions')
          .insert({
            organization_id: orgId,
            transaction_type: 'appointment',
            transaction_date: new Date().toISOString(),
            transaction_code: 'APT-TEST-' + Date.now(),
            from_entity_id: client.id,
            smart_code: 'HERA.SALON.APPOINTMENT.TEST.v1',
            total_amount: 100.00,
            metadata: {
              service_id: service.id,
              duration_minutes: 60
            }
          })
          .select()
          .single()
        
        if (!appointment) throw new Error('Failed to create appointment')
        
        // Check workflow assignment
        const { data: status } = await supabase
          .from('core_relationships')
          .select('*')
          .eq('from_entity_id', appointment.id)
          .eq('relationship_type', 'has_workflow_status')
          .single()
        
        if (!status) throw new Error('Workflow not assigned to appointment')
      }
    },
    {
      name: 'Appointment workflow tracker exists',
      fn: async () => {
        const componentPath = '../src/app/salon/appointments/AppointmentWorkflow.tsx'
        const fs = require('fs')
        if (!fs.existsSync(componentPath)) {
          throw new Error('Appointment workflow component not found')
        }
      }
    }
  ]
  
  await testModule('Appointment', tests)
}

// Test 3: Services Module
async function testServicesModule(orgId) {
  const tests = [
    {
      name: 'Create service',
      fn: async () => {
        const { data: service } = await supabase
          .from('core_entities')
          .insert({
            organization_id: orgId,
            entity_type: 'service',
            entity_name: 'Test Haircut Service',
            entity_code: 'SVC-TEST-' + Date.now(),
            smart_code: 'HERA.SALON.SERVICE.TEST.v1',
            status: 'active',
            metadata: {
              price: 50.00,
              duration_minutes: 30,
              category: 'Hair Services'
            }
          })
          .select()
          .single()
        
        if (!service) throw new Error('Failed to create service')
      }
    }
  ]
  
  await testModule('Services', tests)
}

// Test 4: Staff Module
async function testStaffModule(orgId) {
  const tests = [
    {
      name: 'Create staff member',
      fn: async () => {
        const { data: staff } = await supabase
          .from('core_entities')
          .insert({
            organization_id: orgId,
            entity_type: 'employee',
            entity_name: 'Test Stylist',
            entity_code: 'EMP-TEST-' + Date.now(),
            smart_code: 'HERA.SALON.EMPLOYEE.TEST.v1',
            status: 'active',
            metadata: {
              role: 'stylist',
              hire_date: new Date().toISOString(),
              skills: ['haircut', 'color', 'styling']
            }
          })
          .select()
          .single()
        
        if (!staff) throw new Error('Failed to create staff member')
      }
    }
  ]
  
  await testModule('Staff', tests)
}

// Test 5: Inventory Module
async function testInventoryModule(orgId) {
  const tests = [
    {
      name: 'Create inventory item',
      fn: async () => {
        const { data: product } = await supabase
          .from('core_entities')
          .insert({
            organization_id: orgId,
            entity_type: 'product',
            entity_name: 'Test Shampoo',
            entity_code: 'PROD-TEST-' + Date.now(),
            smart_code: 'HERA.SALON.PRODUCT.TEST.v1',
            status: 'active',
            metadata: {
              category: 'Hair Care',
              brand: 'Test Brand',
              unit_price: 25.00,
              stock_quantity: 100
            }
          })
          .select()
          .single()
        
        if (!product) throw new Error('Failed to create inventory item')
      }
    }
  ]
  
  await testModule('Inventory', tests)
}

// Test 6: POS Module
async function testPOSModule(orgId) {
  const tests = [
    {
      name: 'Create POS transaction',
      fn: async () => {
        const { data: sale } = await supabase
          .from('universal_transactions')
          .insert({
            organization_id: orgId,
            transaction_type: 'sale',
            transaction_date: new Date().toISOString(),
            transaction_code: 'SALE-TEST-' + Date.now(),
            smart_code: 'HERA.SALON.POS.SALE.TEST.v1',
            total_amount: 150.00,
            metadata: {
              payment_method: 'cash',
              items_count: 3
            }
          })
          .select()
          .single()
        
        if (!sale) throw new Error('Failed to create POS transaction')
      }
    }
  ]
  
  await testModule('POS', tests)
}

// Test 7: Workflow Integration
async function testWorkflowIntegration(orgId) {
  const tests = [
    {
      name: 'Workflow templates exist',
      fn: async () => {
        const expectedTemplates = ['APPOINTMENT', 'SALES-ORDER', 'INVOICE', 'PURCHASE-ORDER']
        
        for (const code of expectedTemplates) {
          const { data } = await supabase
            .from('core_entities')
            .select('id')
            .eq('organization_id', orgId)
            .eq('entity_type', 'workflow_template')
            .eq('entity_code', code)
            .single()
          
          if (!data) throw new Error(`Workflow template ${code} not found`)
        }
      }
    },
    {
      name: 'Workflow transitions exist',
      fn: async () => {
        const { data: transitions } = await supabase
          .from('core_relationships')
          .select('*')
          .eq('organization_id', orgId)
          .eq('relationship_type', 'can_transition_to')
          .limit(10)
        
        if (!transitions || transitions.length === 0) {
          throw new Error('No workflow transitions found')
        }
      }
    },
    {
      name: 'Workflow UI component exists',
      fn: async () => {
        const componentPath = '../src/components/workflow/UniversalWorkflowTracker.tsx'
        const fs = require('fs')
        if (!fs.existsSync(componentPath)) {
          throw new Error('Workflow tracker component not found')
        }
      }
    }
  ]
  
  await testModule('Workflow Integration', tests)
}

// Test 8: API Integration
async function testAPIIntegration(orgId) {
  const tests = [
    {
      name: 'Universal API available',
      fn: async () => {
        const apiPath = '../src/lib/universal-api.ts'
        const fs = require('fs')
        if (!fs.existsSync(apiPath)) {
          throw new Error('Universal API not found')
        }
      }
    },
    {
      name: 'Organization context works',
      fn: async () => {
        const { data: org } = await supabase
          .from('core_organizations')
          .select('*')
          .eq('id', orgId)
          .single()
        
        if (!org) throw new Error('Organization not found')
        if (org.status !== 'active') throw new Error('Organization not active')
      }
    }
  ]
  
  await testModule('API Integration', tests)
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Running Complete Salon Integration Tests\n')
  
  const orgId = process.env.DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'
  console.log(`Organization ID: ${orgId}`)
  
  try {
    // Run all module tests
    await testClientModule(orgId)
    await testAppointmentModule(orgId)
    await testServicesModule(orgId)
    await testStaffModule(orgId)
    await testInventoryModule(orgId)
    await testPOSModule(orgId)
    await testWorkflowIntegration(orgId)
    await testAPIIntegration(orgId)
    
    // Summary
    console.log('\n📊 Test Summary:')
    console.log(`Total Tests: ${testResults.passed + testResults.failed}`)
    console.log(`✅ Passed: ${testResults.passed}`)
    console.log(`❌ Failed: ${testResults.failed}`)
    console.log(`Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`)
    
    console.log('\n📈 Module Breakdown:')
    Object.entries(testResults.modules).forEach(([module, results]) => {
      const total = results.passed + results.failed
      const percentage = Math.round((results.passed / total) * 100)
      console.log(`  ${module}: ${results.passed}/${total} (${percentage}%)`)
    })
    
    // Integration readiness
    const overallPercentage = Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)
    console.log('\n🎯 Integration Readiness:')
    if (overallPercentage >= 90) {
      console.log('  ✅ READY FOR PRODUCTION')
    } else if (overallPercentage >= 70) {
      console.log('  ⚠️ READY FOR STAGING')
    } else {
      console.log('  ❌ NEEDS MORE WORK')
    }
    
    // Recommendations
    if (testResults.failed > 0) {
      console.log('\n💡 Recommendations:')
      Object.entries(testResults.modules).forEach(([module, results]) => {
        if (results.failed > 0) {
          console.log(`  - Fix ${results.failed} issues in ${module} module`)
        }
      })
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error)
    process.exit(1)
  }
}

// Run tests
runAllTests()