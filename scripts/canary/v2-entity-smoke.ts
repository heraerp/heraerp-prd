#!/usr/bin/env tsx
/**
 * V2 Entity Smoke Test
 * Validates basic entity CRUD operations through V2 facades
 */

import { apiV2 } from '@/lib/universal/v2/client'

const TEST_ORG_ID = process.env.TEST_ORG_ID || 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'

interface SmokeTestResult {
  operation: string
  success: boolean
  entityId?: string
  error?: string
  duration?: number
}

async function runEntitySmokeTest(): Promise<void> {
  console.log('🧪 V2 Entity Smoke Test Starting...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📍 Organization ID: ${TEST_ORG_ID}`)
  console.log()

  const results: SmokeTestResult[] = []
  let createdEntityId: string | null = null

  // Test 1: Create Entity with Dynamic Data
  console.log('🔄 Test 1: Creating entity with dynamic data...')
  const startCreate = Date.now()
  
  try {
    const entityData = {
      entity_type: 'test_entity',
      entity_name: 'V2 Smoke Test Entity',
      smart_code: 'HERA.TEST.ENTITY.SMOKE.V1',
      organization_id: TEST_ORG_ID,
      dynamic_fields: {
        test_text: {
          value: 'Smoke test value',
          type: 'text' as const,
          smart_code: 'HERA.TEST.ENTITY.TEXT.V1'
        },
        test_number: {
          value: 42,
          type: 'number' as const,
          smart_code: 'HERA.TEST.ENTITY.NUMBER.V1'
        },
        test_boolean: {
          value: true,
          type: 'boolean' as const,
          smart_code: 'HERA.TEST.ENTITY.BOOLEAN.V1'
        }
      }
    }

    const { data, error } = await apiV2.post('/entities', entityData)
    const duration = Date.now() - startCreate

    if (error) {
      results.push({
        operation: 'Create Entity',
        success: false,
        error: error.message,
        duration
      })
      console.log(`❌ Create failed: ${error.message}`)
    } else if (data?.success && data?.data?.entity_id) {
      createdEntityId = data.data.entity_id
      results.push({
        operation: 'Create Entity',
        success: true,
        entityId: createdEntityId,
        duration
      })
      console.log(`✅ Created entity: ${createdEntityId} (${duration}ms)`)
    } else {
      results.push({
        operation: 'Create Entity',
        success: false,
        error: 'Invalid response format',
        duration
      })
      console.log('❌ Create failed: Invalid response format')
    }
  } catch (error) {
    const duration = Date.now() - startCreate
    results.push({
      operation: 'Create Entity',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    })
    console.log(`❌ Create failed: ${error}`)
  }

  // Test 2: Read Entity by ID
  if (createdEntityId) {
    console.log('\n🔄 Test 2: Reading entity by ID...')
    const startRead = Date.now()

    try {
      const { data, error } = await apiV2.get('/entities', {
        entity_id: createdEntityId,
        organization_id: TEST_ORG_ID,
        include_dynamic: true
      })
      const duration = Date.now() - startRead

      if (error) {
        results.push({
          operation: 'Read Entity',
          success: false,
          error: error.message,
          duration
        })
        console.log(`❌ Read failed: ${error.message}`)
      } else if (data?.success && data?.data?.length > 0) {
        const entity = data.data[0]
        results.push({
          operation: 'Read Entity',
          success: true,
          entityId: createdEntityId,
          duration
        })
        console.log(`✅ Read entity: ${entity.entity_name} (${duration}ms)`)
        console.log(`   Type: ${entity.entity_type}`)
        console.log(`   Smart Code: ${entity.smart_code}`)
      } else {
        results.push({
          operation: 'Read Entity',
          success: false,
          error: 'Entity not found or invalid response',
          duration
        })
        console.log('❌ Read failed: Entity not found')
      }
    } catch (error) {
      const duration = Date.now() - startRead
      results.push({
        operation: 'Read Entity',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      })
      console.log(`❌ Read failed: ${error}`)
    }
  }

  // Test 3: List Entities with Filter
  console.log('\n🔄 Test 3: Listing entities with filter...')
  const startList = Date.now()

  try {
    const { data, error } = await apiV2.get('/entities', {
      entity_type: 'test_entity',
      organization_id: TEST_ORG_ID,
      limit: 5
    })
    const duration = Date.now() - startList

    if (error) {
      results.push({
        operation: 'List Entities',
        success: false,
        error: error.message,
        duration
      })
      console.log(`❌ List failed: ${error.message}`)
    } else if (data?.success) {
      const count = data.data?.length || 0
      results.push({
        operation: 'List Entities',
        success: true,
        duration
      })
      console.log(`✅ Listed entities: ${count} found (${duration}ms)`)
      console.log(`   Pagination: total=${data.pagination?.total}, limit=${data.pagination?.limit}`)
    } else {
      results.push({
        operation: 'List Entities',
        success: false,
        error: 'Invalid response format',
        duration
      })
      console.log('❌ List failed: Invalid response format')
    }
  } catch (error) {
    const duration = Date.now() - startList
    results.push({
      operation: 'List Entities',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    })
    console.log(`❌ List failed: ${error}`)
  }

  // Test 4: Update Entity
  if (createdEntityId) {
    console.log('\n🔄 Test 4: Updating entity...')
    const startUpdate = Date.now()

    try {
      const updateData = {
        entity_id: createdEntityId,
        entity_name: 'V2 Smoke Test Entity (Updated)',
        organization_id: TEST_ORG_ID,
        dynamic_fields: {
          test_updated: {
            value: 'Updated value',
            type: 'text' as const,
            smart_code: 'HERA.TEST.ENTITY.UPDATED.V1'
          }
        }
      }

      const { data, error } = await apiV2.put('/entities', updateData)
      const duration = Date.now() - startUpdate

      if (error) {
        results.push({
          operation: 'Update Entity',
          success: false,
          error: error.message,
          duration
        })
        console.log(`❌ Update failed: ${error.message}`)
      } else if (data?.success) {
        results.push({
          operation: 'Update Entity',
          success: true,
          entityId: createdEntityId,
          duration
        })
        console.log(`✅ Updated entity: ${createdEntityId} (${duration}ms)`)
      } else {
        results.push({
          operation: 'Update Entity',
          success: false,
          error: 'Invalid response format',
          duration
        })
        console.log('❌ Update failed: Invalid response format')
      }
    } catch (error) {
      const duration = Date.now() - startUpdate
      results.push({
        operation: 'Update Entity',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      })
      console.log(`❌ Update failed: ${error}`)
    }
  }

  // Print Summary
  console.log('\n📊 Smoke Test Summary')
  console.log('━━━━━━━━━━━━━━━━━━━━━━')
  
  const totalTests = results.length
  const passedTests = results.filter(r => r.success).length
  const failedTests = totalTests - passedTests
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0)

  console.log(`Tests Run: ${totalTests}`)
  console.log(`Passed: ${passedTests} ✅`)
  console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : ''}`)
  console.log(`Total Duration: ${totalDuration}ms`)
  console.log()

  // Detailed Results
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌'
    const duration = result.duration ? `${result.duration}ms` : 'N/A'
    console.log(`${index + 1}. ${status} ${result.operation} (${duration})`)
    if (result.entityId) {
      console.log(`   Entity ID: ${result.entityId}`)
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  // Final Status
  console.log()
  if (failedTests === 0) {
    console.log('🎉 All entity smoke tests passed!')
    console.log(`📝 Created entity ID: ${createdEntityId}`)
    process.exit(0)
  } else {
    console.log('💥 Some entity smoke tests failed!')
    process.exit(1)
  }
}

// Run the smoke test
if (require.main === module) {
  runEntitySmokeTest().catch(error => {
    console.error('💥 Smoke test crashed:', error)
    process.exit(1)
  })
}