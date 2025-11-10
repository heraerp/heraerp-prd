#!/usr/bin/env node

/**
 * Test Script: hera_microapp_catalog_v2
 *
 * Tests all operations of the microapp catalog RPC function
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Test configuration
const TEST_CONFIG = {
  actor_user_id: process.env.TEST_USER_ID || 'YOUR_USER_UUID',
  organization_id: process.env.TEST_ORG_ID || 'YOUR_ORG_UUID',
  test_app_code: 'WASTE_MANAGEMENT_APP'
}

console.log('🧪 Testing hera_microapp_catalog_v2')
console.log('=' .repeat(80))
console.log('Configuration:', TEST_CONFIG)
console.log('=' .repeat(80))

async function testCatalogList() {
  console.log('\n📋 Test 1.1: LIST - List All Available Apps')
  console.log('-'.repeat(80))

  try {
    const { data, error } = await supabase.rpc('hera_microapp_catalog_v2', {
      p_actor_user_id: TEST_CONFIG.actor_user_id,
      p_organization_id: TEST_CONFIG.organization_id,
      p_operation: 'LIST',
      p_filters: null,
      p_options: {}
    })

    if (error) {
      console.error('❌ FAILED:', error.message)
      return { passed: false, error }
    }

    console.log('✅ SUCCESS')
    console.log('Response:', JSON.stringify(data, null, 2))

    // Validations
    const validations = []
    validations.push({
      check: 'Returns array',
      passed: Array.isArray(data)
    })

    if (Array.isArray(data) && data.length > 0) {
      const firstApp = data[0]
      validations.push({
        check: 'Has app_code',
        passed: !!firstApp.app_code
      })
      validations.push({
        check: 'Has app_name',
        passed: !!firstApp.app_name
      })
      validations.push({
        check: 'Has app_version',
        passed: !!firstApp.app_version
      })
    }

    console.log('\nValidations:')
    validations.forEach(v => {
      console.log(`  ${v.passed ? '✅' : '❌'} ${v.check}`)
    })

    return {
      passed: validations.every(v => v.passed),
      data,
      validations
    }
  } catch (err) {
    console.error('❌ EXCEPTION:', err.message)
    return { passed: false, error: err }
  }
}

async function testCatalogFilterByCategory() {
  console.log('\n📋 Test 1.2: LIST - Filter by Category')
  console.log('-'.repeat(80))

  try {
    const { data, error } = await supabase.rpc('hera_microapp_catalog_v2', {
      p_actor_user_id: TEST_CONFIG.actor_user_id,
      p_organization_id: TEST_CONFIG.organization_id,
      p_operation: 'LIST',
      p_filters: {
        category: 'WASTE_MANAGEMENT'
      },
      p_options: {}
    })

    if (error) {
      console.error('❌ FAILED:', error.message)
      return { passed: false, error }
    }

    console.log('✅ SUCCESS')
    console.log('Response:', JSON.stringify(data, null, 2))

    const validations = []
    validations.push({
      check: 'Returns array',
      passed: Array.isArray(data)
    })

    if (Array.isArray(data)) {
      const allCorrectCategory = data.every(app =>
        app.category === 'WASTE_MANAGEMENT'
      )
      validations.push({
        check: 'All apps have correct category',
        passed: allCorrectCategory
      })
    }

    console.log('\nValidations:')
    validations.forEach(v => {
      console.log(`  ${v.passed ? '✅' : '❌'} ${v.check}`)
    })

    return {
      passed: validations.every(v => v.passed),
      data,
      validations
    }
  } catch (err) {
    console.error('❌ EXCEPTION:', err.message)
    return { passed: false, error: err }
  }
}

async function testCatalogGet() {
  console.log('\n📋 Test 1.3: GET - Get Specific App Details')
  console.log('-'.repeat(80))

  try {
    const { data, error } = await supabase.rpc('hera_microapp_catalog_v2', {
      p_actor_user_id: TEST_CONFIG.actor_user_id,
      p_organization_id: TEST_CONFIG.organization_id,
      p_operation: 'GET',
      p_filters: {
        app_code: TEST_CONFIG.test_app_code
      },
      p_options: {}
    })

    if (error) {
      console.error('❌ FAILED:', error.message)
      return { passed: false, error }
    }

    console.log('✅ SUCCESS')
    console.log('Response:', JSON.stringify(data, null, 2))

    const validations = []
    validations.push({
      check: 'Returns app details',
      passed: !!data
    })

    if (data) {
      validations.push({
        check: 'Has app_code',
        passed: data.app_code === TEST_CONFIG.test_app_code
      })
      validations.push({
        check: 'Has complete definition',
        passed: !!(data.capabilities && data.description)
      })
    }

    console.log('\nValidations:')
    validations.forEach(v => {
      console.log(`  ${v.passed ? '✅' : '❌'} ${v.check}`)
    })

    return {
      passed: validations.every(v => v.passed),
      data,
      validations
    }
  } catch (err) {
    console.error('❌ EXCEPTION:', err.message)
    return { passed: false, error: err }
  }
}

async function testCatalogCreate() {
  console.log('\n📋 Test 1.4: CREATE - Register New App (Admin Only)')
  console.log('-'.repeat(80))

  const testAppCode = `TEST_APP_${Date.now()}`

  try {
    const { data, error } = await supabase.rpc('hera_microapp_catalog_v2', {
      p_actor_user_id: TEST_CONFIG.actor_user_id,
      p_organization_id: TEST_CONFIG.organization_id,
      p_operation: 'CREATE',
      p_app_definition: {
        app_code: testAppCode,
        app_name: 'Test Application',
        app_version: 'v1.0.0',
        description: 'Test app for RPC validation',
        category: 'TESTING',
        capabilities: ['READ', 'WRITE'],
        pricing: {
          model: 'FREE',
          currency: 'AED'
        }
      },
      p_options: {}
    })

    if (error) {
      console.error('❌ FAILED:', error.message)
      return { passed: false, error, testAppCode }
    }

    console.log('✅ SUCCESS')
    console.log('Response:', JSON.stringify(data, null, 2))

    const validations = []
    validations.push({
      check: 'App created',
      passed: !!data
    })

    if (data) {
      validations.push({
        check: 'Has app_code',
        passed: data.app_code === testAppCode
      })
      validations.push({
        check: 'Has ID',
        passed: !!data.id
      })
    }

    console.log('\nValidations:')
    validations.forEach(v => {
      console.log(`  ${v.passed ? '✅' : '❌'} ${v.check}`)
    })

    return {
      passed: validations.every(v => v.passed),
      data,
      validations,
      testAppCode
    }
  } catch (err) {
    console.error('❌ EXCEPTION:', err.message)
    return { passed: false, error: err, testAppCode }
  }
}

async function testCatalogUpdate(testAppCode) {
  console.log('\n📋 Test 1.5: UPDATE - Update App Definition (Admin Only)')
  console.log('-'.repeat(80))

  if (!testAppCode) {
    console.log('⏭️  SKIPPED: No test app code available')
    return { passed: true, skipped: true }
  }

  try {
    const { data, error } = await supabase.rpc('hera_microapp_catalog_v2', {
      p_actor_user_id: TEST_CONFIG.actor_user_id,
      p_organization_id: TEST_CONFIG.organization_id,
      p_operation: 'UPDATE',
      p_app_definition: {
        app_code: testAppCode,
        description: 'Updated description',
        app_version: 'v1.1.0'
      },
      p_options: {}
    })

    if (error) {
      console.error('❌ FAILED:', error.message)
      return { passed: false, error }
    }

    console.log('✅ SUCCESS')
    console.log('Response:', JSON.stringify(data, null, 2))

    const validations = []
    validations.push({
      check: 'App updated',
      passed: !!data
    })

    if (data) {
      validations.push({
        check: 'Version updated',
        passed: data.app_version === 'v1.1.0'
      })
      validations.push({
        check: 'Description updated',
        passed: data.description === 'Updated description'
      })
    }

    console.log('\nValidations:')
    validations.forEach(v => {
      console.log(`  ${v.passed ? '✅' : '❌'} ${v.check}`)
    })

    return {
      passed: validations.every(v => v.passed),
      data,
      validations
    }
  } catch (err) {
    console.error('❌ EXCEPTION:', err.message)
    return { passed: false, error: err }
  }
}

async function testCatalogDelete(testAppCode) {
  console.log('\n📋 Test 1.6: DELETE - Remove App from Catalog (Admin Only)')
  console.log('-'.repeat(80))

  if (!testAppCode) {
    console.log('⏭️  SKIPPED: No test app code available')
    return { passed: true, skipped: true }
  }

  try {
    const { data, error } = await supabase.rpc('hera_microapp_catalog_v2', {
      p_actor_user_id: TEST_CONFIG.actor_user_id,
      p_organization_id: TEST_CONFIG.organization_id,
      p_operation: 'DELETE',
      p_filters: {
        app_code: testAppCode
      },
      p_options: {}
    })

    if (error) {
      console.error('❌ FAILED:', error.message)
      return { passed: false, error }
    }

    console.log('✅ SUCCESS')
    console.log('Response:', JSON.stringify(data, null, 2))

    const validations = []
    validations.push({
      check: 'App deleted',
      passed: !!data && data.success
    })

    console.log('\nValidations:')
    validations.forEach(v => {
      console.log(`  ${v.passed ? '✅' : '❌'} ${v.check}`)
    })

    return {
      passed: validations.every(v => v.passed),
      data,
      validations
    }
  } catch (err) {
    console.error('❌ EXCEPTION:', err.message)
    return { passed: false, error: err }
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 Starting Catalog RPC Tests...\n')

  const results = {}
  let testAppCode = null

  // Test 1: LIST
  results.test1 = await testCatalogList()

  // Test 2: Filter by category
  results.test2 = await testCatalogFilterByCategory()

  // Test 3: GET specific app
  results.test3 = await testCatalogGet()

  // Test 4: CREATE
  const createResult = await testCatalogCreate()
  results.test4 = createResult
  testAppCode = createResult.testAppCode

  // Test 5: UPDATE (only if CREATE succeeded)
  if (createResult.passed && testAppCode) {
    results.test5 = await testCatalogUpdate(testAppCode)
  } else {
    results.test5 = { passed: false, skipped: true }
  }

  // Test 6: DELETE (cleanup)
  if (testAppCode) {
    results.test6 = await testCatalogDelete(testAppCode)
  } else {
    results.test6 = { passed: false, skipped: true }
  }

  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(80))

  const total = Object.keys(results).length
  const passed = Object.values(results).filter(r => r.passed).length
  const failed = Object.values(results).filter(r => !r.passed && !r.skipped).length
  const skipped = Object.values(results).filter(r => r.skipped).length

  console.log(`Total Tests:   ${total}`)
  console.log(`✅ Passed:     ${passed}`)
  console.log(`❌ Failed:     ${failed}`)
  console.log(`⏭️  Skipped:    ${skipped}`)
  console.log(`Success Rate:  ${((passed / total) * 100).toFixed(1)}%`)

  console.log('\nDetailed Results:')
  Object.entries(results).forEach(([test, result]) => {
    const status = result.skipped ? '⏭️ ' : result.passed ? '✅' : '❌'
    console.log(`  ${status} ${test}: ${result.skipped ? 'SKIPPED' : result.passed ? 'PASSED' : 'FAILED'}`)
    if (result.error) {
      console.log(`      Error: ${result.error.message}`)
    }
  })

  console.log('\n' + '='.repeat(80))

  process.exit(failed > 0 ? 1 : 0)
}

runAllTests()
