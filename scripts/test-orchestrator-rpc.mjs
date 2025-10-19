#!/usr/bin/env node
/**
 * HERA Orchestrator RPC Test Suite
 * Tests: hera_entities_crud_v1
 *
 * Comprehensive test coverage for:
 * - CRUD operations (CREATE, READ, UPDATE, DELETE)
 * - Enterprise guardrails (org, actor, membership, smart codes)
 * - Relationship modes (UPSERT vs REPLACE)
 * - Platform identity provisioning
 * - Dynamic field type handling
 * - Error scenarios and edge cases
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// ============================================
// Configuration
// ============================================
const TENANT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'
const ACTOR_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'

// Test entity IDs (will be created during tests)
let CATEGORY_ID_1 = null
let CATEGORY_ID_2 = null
let PRODUCT_ENTITY_ID = null
let USER_ENTITY_ID = null

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ============================================
// Utilities
// ============================================
function genSmart(type, version = 1) {
  return `HERA.SALON.${type.toUpperCase()}.ENTITY.ITEM.v${version}`
}

function genDynamicSmart(field) {
  return `HERA.SALON.PRODUCT.DYN.${field.toUpperCase()}.v1`
}

function timestamp() {
  return new Date().toISOString()
}

// Test tracking
const testResults = []
let testNumber = 0

function logTest(name, payload, response, duration, assertions) {
  testNumber++

  console.log(`\n${'='.repeat(80)}`)
  console.log(`Test #${testNumber}: ${name}`)
  console.log(`${'='.repeat(80)}`)

  // Show payload (compact for large objects)
  console.log('\n📤 Payload:')
  const compactPayload = {
    ...payload,
    p_dynamic: payload.p_dynamic
      ? `{${Object.keys(payload.p_dynamic).length} fields}`
      : undefined,
    p_relationships: payload.p_relationships
      ? `{${Object.keys(payload.p_relationships).length} types}`
      : undefined
  }
  console.log(JSON.stringify(compactPayload, null, 2))

  console.log(`\n⏱️  Duration: ${duration}ms`)

  // Show response summary
  console.log('\n📥 Response:')
  if (response.error) {
    console.log('❌ RPC Error:', response.error.message)
  } else if (response.data?.success === false) {
    console.log('❌ Function Error:', response.data.error)
  } else {
    console.log('✅ Success:', response.data?.action || 'N/A')
    if (response.data?.entity_id) {
      console.log(`   Entity ID: ${response.data.entity_id}`)
    }
  }

  // Run assertions
  console.log('\n🧪 Assertions:')
  let passed = 0
  let failed = 0

  assertions.forEach((assertion, idx) => {
    const result = assertion.check(response)
    if (result.pass) {
      passed++
      console.log(`   ✅ ${idx + 1}. ${assertion.name}`)
    } else {
      failed++
      console.log(`   ❌ ${idx + 1}. ${assertion.name}`)
      console.log(`      Expected: ${result.expected}`)
      console.log(`      Got: ${result.actual}`)
    }
  })

  const testPassed = failed === 0
  testResults.push({
    number: testNumber,
    name,
    result: testPassed ? 'PASS' : 'FAIL',
    notes: testPassed ? 'All assertions passed' : `${failed} assertion(s) failed`,
    duration
  })

  console.log(`\n${testPassed ? '✅ PASS' : '❌ FAIL'}: ${name}`)

  return testPassed
}

async function callRPC(name, payload) {
  const start = Date.now()
  const result = await supabase.rpc(name, payload)
  const duration = Date.now() - start
  return { result, duration }
}

// ============================================
// Setup: Create Test Categories
// ============================================
async function setupTestData() {
  console.log('\n🔧 Setting up test data...\n')

  // Create Category 1 using v1 RPC (fallback if orchestrator not available)
  try {
    const cat1 = await supabase.rpc('hera_entity_upsert_v1', {
      p_organization_id: TENANT_ORG_ID,
      p_entity_type: 'CATEGORY',
      p_entity_name: 'Hair Care',
      p_smart_code: 'HERA.SALON.CATEGORY.ENTITY.GROUP.v1',
      p_entity_id: null,
      p_entity_code: 'CAT-HAIR',
      p_entity_description: null,
      p_parent_entity_id: null,
      p_status: null,
      p_tags: null,
      p_smart_code_status: null,
      p_business_rules: null,
      p_metadata: null,
      p_ai_confidence: null,
      p_ai_classification: null,
      p_ai_insights: null,
      p_actor_user_id: ACTOR_USER_ID
    })

    if (cat1.data) {
      CATEGORY_ID_1 = cat1.data
      console.log(`✅ Created Category 1: ${CATEGORY_ID_1}`)
    } else {
      console.log('❌ Failed to create Category 1:', cat1.error?.message || 'Unknown error')
    }
  } catch (error) {
    console.log('❌ Failed to create Category 1:', error.message)
  }

  // Create Category 2
  try {
    const cat2 = await supabase.rpc('hera_entity_upsert_v1', {
      p_organization_id: TENANT_ORG_ID,
      p_entity_type: 'CATEGORY',
      p_entity_name: 'Styling',
      p_smart_code: 'HERA.SALON.CATEGORY.ENTITY.GROUP.v1',
      p_entity_id: null,
      p_entity_code: 'CAT-STYLE',
      p_entity_description: null,
      p_parent_entity_id: null,
      p_status: null,
      p_tags: null,
      p_smart_code_status: null,
      p_business_rules: null,
      p_metadata: null,
      p_ai_confidence: null,
      p_ai_classification: null,
      p_ai_insights: null,
      p_actor_user_id: ACTOR_USER_ID
    })

    if (cat2.data) {
      CATEGORY_ID_2 = cat2.data
      console.log(`✅ Created Category 2: ${CATEGORY_ID_2}`)
    } else {
      console.log('❌ Failed to create Category 2:', cat2.error?.message || 'Unknown error')
    }
  } catch (error) {
    console.log('❌ Failed to create Category 2:', error.message)
  }
}

// ============================================
// Test Suite
// ============================================

// Test 1: CREATE minimal PRODUCT (happy path)
async function test1_CreateProduct() {
  const payload = {
    p_action: 'CREATE',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_type: 'PRODUCT',
      entity_name: 'Hydrating Shampoo',
      smart_code: genSmart('PRODUCT'),
      entity_code: 'PROD-001'
    },
    p_dynamic: {
      price_market: {
        value: '25',
        type: 'number',
        smart_code: genDynamicSmart('PRICE.MARKET')
      }
    },
    p_relationships: {
      HAS_CATEGORY: [CATEGORY_ID_1]
    },
    p_options: {
      include_dynamic: true,
      include_relationships: true
    }
  }

  const { result, duration } = await callRPC('hera_entities_crud_v1', payload)

  const assertions = [
    {
      name: 'success = true',
      check: (r) => ({
        pass: r.data?.success === true,
        expected: 'true',
        actual: String(r.data?.success)
      })
    },
    {
      name: 'entity_id exists',
      check: (r) => ({
        pass: !!r.data?.entity_id,
        expected: 'UUID string',
        actual: r.data?.entity_id || 'null'
      })
    },
    {
      name: 'CRITICAL: CREATE returns complete entity object (no refetch needed)',
      check: (r) => {
        const entity = r.data?.data?.entity
        const hasAllFields = entity?.id && entity?.entity_name && entity?.entity_type && entity?.smart_code
        return {
          pass: hasAllFields,
          expected: 'Complete entity with id, entity_name, entity_type, smart_code',
          actual: entity ? `entity with ${Object.keys(entity).length} fields` : 'null'
        }
      }
    },
    {
      name: 'entity.id matches entity_id',
      check: (r) => ({
        pass: r.data?.data?.entity?.id === r.data?.entity_id,
        expected: r.data?.entity_id || 'matching ID',
        actual: r.data?.data?.entity?.id || 'null'
      })
    },
    {
      name: 'entity.entity_name = "Hydrating Shampoo"',
      check: (r) => ({
        pass: r.data?.data?.entity?.entity_name === 'Hydrating Shampoo',
        expected: 'Hydrating Shampoo',
        actual: r.data?.data?.entity?.entity_name || 'null'
      })
    },
    {
      name: 'entity_type = PRODUCT',
      check: (r) => ({
        pass: r.data?.data?.entity?.entity_type === 'PRODUCT',
        expected: 'PRODUCT',
        actual: r.data?.data?.entity?.entity_type || 'null'
      })
    },
    {
      name: 'entity.smart_code exists and follows HERA DNA pattern',
      check: (r) => {
        const smartCode = r.data?.data?.entity?.smart_code || ''
        const validPattern = smartCode.startsWith('HERA.') && smartCode.endsWith('.v1')
        return {
          pass: validPattern,
          expected: 'HERA.*.v1 pattern',
          actual: smartCode
        }
      }
    },
    {
      name: 'CRITICAL: dynamic_data array included',
      check: (r) => ({
        pass: Array.isArray(r.data?.data?.dynamic_data) && r.data.data.dynamic_data.length > 0,
        expected: 'array with items',
        actual: `array[${r.data?.data?.dynamic_data?.length || 0}]`
      })
    },
    {
      name: 'CRITICAL: price_market dynamic field returned with correct value',
      check: (r) => {
        const fields = r.data?.data?.dynamic_data || []
        const price = fields.find(f => f.field_name === 'price_market')
        return {
          pass: price?.field_value_number === 25,
          expected: '25',
          actual: String(price?.field_value_number || 'not found')
        }
      }
    },
    {
      name: 'price_market has correct field_type',
      check: (r) => {
        const fields = r.data?.data?.dynamic_data || []
        const price = fields.find(f => f.field_name === 'price_market')
        return {
          pass: price?.field_type === 'number',
          expected: 'number',
          actual: price?.field_type || 'not found'
        }
      }
    },
    {
      name: 'CRITICAL: relationships array included',
      check: (r) => ({
        pass: Array.isArray(r.data?.data?.relationships),
        expected: 'array',
        actual: typeof r.data?.data?.relationships
      })
    },
    {
      name: 'HAS_CATEGORY relationship exists with complete data',
      check: (r) => {
        const rels = r.data?.data?.relationships || []
        const hasCategory = rels.find(rel =>
          rel.relationship_type === 'HAS_CATEGORY' &&
          rel.to_entity_id === CATEGORY_ID_1
        )
        const complete = hasCategory && hasCategory.from_entity_id && hasCategory.to_entity_id && hasCategory.relationship_type
        return {
          pass: complete,
          expected: `Complete HAS_CATEGORY relationship to ${CATEGORY_ID_1}`,
          actual: hasCategory ? `${hasCategory.relationship_type} → ${hasCategory.to_entity_id}` : 'not found'
        }
      }
    }
  ]

  const passed = logTest('CREATE minimal PRODUCT (happy path)', payload, result, duration, assertions)

  if (result.data?.entity_id) {
    PRODUCT_ENTITY_ID = result.data.entity_id
  }

  return passed
}

// Test 2: READ by entity_id
async function test2_ReadProduct() {
  if (!PRODUCT_ENTITY_ID) {
    console.log('\n⚠️  Skipping Test 2: No product ID from Test 1')
    testResults.push({
      number: ++testNumber,
      name: 'READ by entity_id',
      result: 'SKIP',
      notes: 'Prerequisite failed (Test 1)',
      duration: 0
    })
    return false
  }

  const payload = {
    p_action: 'READ',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_id: PRODUCT_ENTITY_ID
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {
      include_dynamic: true,
      include_relationships: true
    }
  }

  const { result, duration } = await callRPC('hera_entities_crud_v1', payload)

  const assertions = [
    {
      name: 'success = true',
      check: (r) => ({
        pass: r.data?.success === true,
        expected: 'true',
        actual: String(r.data?.success)
      })
    },
    {
      name: 'entity returned',
      check: (r) => ({
        pass: r.data?.data?.entity?.id === PRODUCT_ENTITY_ID,
        expected: PRODUCT_ENTITY_ID,
        actual: r.data?.data?.entity?.id || 'null'
      })
    },
    {
      name: 'dynamic data included',
      check: (r) => ({
        pass: Array.isArray(r.data?.data?.dynamic_data),
        expected: 'array',
        actual: typeof r.data?.data?.dynamic_data
      })
    },
    {
      name: 'relationships included',
      check: (r) => ({
        pass: Array.isArray(r.data?.data?.relationships),
        expected: 'array',
        actual: typeof r.data?.data?.relationships
      })
    }
  ]

  return logTest('READ by entity_id', payload, result, duration, assertions)
}

// Test 2b: READ by entity_type (LIST operation) - CRITICAL for customer pages
async function test2b_ReadByEntityType() {
  const payload = {
    p_action: 'READ',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_type: 'PRODUCT'  // ← Reading by TYPE, not ID
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {
      limit: 10,
      include_dynamic: true,
      include_relationships: true
    }
  }

  const { result, duration } = await callRPC('hera_entities_crud_v1', payload)

  const assertions = [
    {
      name: 'success = true',
      check: (r) => ({
        pass: r.data?.success === true,
        expected: 'true',
        actual: String(r.data?.success)
      })
    },
    {
      name: 'returns list format',
      check: (r) => ({
        pass: !!r.data?.data?.list && Array.isArray(r.data.data.list),
        expected: 'array',
        actual: typeof r.data?.data?.list
      })
    },
    {
      name: 'list contains at least 1 product',
      check: (r) => ({
        pass: r.data?.data?.list?.length >= 1,
        expected: '>= 1',
        actual: String(r.data?.data?.list?.length || 0)
      })
    },
    {
      name: 'CRITICAL: first list item entity object is NOT empty',
      check: (r) => {
        const firstItem = r.data?.data?.list?.[0]
        const entityKeys = firstItem?.entity ? Object.keys(firstItem.entity) : []
        const hasEntityData = entityKeys.length > 0
        return {
          pass: hasEntityData,
          expected: 'entity object with keys',
          actual: hasEntityData ? `entity with ${entityKeys.length} keys` : 'EMPTY entity object {}'
        }
      }
    },
    {
      name: 'CRITICAL: first item entity.id exists',
      check: (r) => {
        const entityId = r.data?.data?.list?.[0]?.entity?.id
        return {
          pass: !!entityId,
          expected: 'UUID string',
          actual: entityId || 'undefined/null'
        }
      }
    },
    {
      name: 'CRITICAL: first item entity.entity_name exists',
      check: (r) => {
        const entityName = r.data?.data?.list?.[0]?.entity?.entity_name
        return {
          pass: !!entityName,
          expected: 'string',
          actual: entityName || 'undefined/null'
        }
      }
    },
    {
      name: 'CRITICAL: first item entity.entity_type = PRODUCT',
      check: (r) => {
        const entityType = r.data?.data?.list?.[0]?.entity?.entity_type
        return {
          pass: entityType === 'PRODUCT',
          expected: 'PRODUCT',
          actual: entityType || 'undefined/null'
        }
      }
    },
    {
      name: 'dynamic_data array included',
      check: (r) => {
        const dynamicData = r.data?.data?.list?.[0]?.dynamic_data
        return {
          pass: Array.isArray(dynamicData),
          expected: 'array',
          actual: typeof dynamicData
        }
      }
    },
    {
      name: 'relationships array included',
      check: (r) => {
        const relationships = r.data?.data?.list?.[0]?.relationships
        return {
          pass: Array.isArray(relationships),
          expected: 'array',
          actual: typeof relationships
        }
      }
    }
  ]

  return logTest('READ by entity_type (LIST - customer page pattern)', payload, result, duration, assertions)
}

// Test 3: UPDATE header + dynamic (UPSERT relationships)
async function test3_UpdateUpsertRelationships() {
  if (!PRODUCT_ENTITY_ID) {
    console.log('\n⚠️  Skipping Test 3: No product ID')
    testResults.push({
      number: ++testNumber,
      name: 'UPDATE UPSERT relationships',
      result: 'SKIP',
      notes: 'Prerequisite failed',
      duration: 0
    })
    return false
  }

  const payload = {
    p_action: 'UPDATE',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_id: PRODUCT_ENTITY_ID,
      entity_name: 'Hydrating Shampoo – New'
    },
    p_dynamic: {
      price_market: {
        value: '27',
        type: 'number',
        smart_code: genDynamicSmart('PRICE.MARKET')
      }
    },
    p_relationships: {
      HAS_CATEGORY: [CATEGORY_ID_1, CATEGORY_ID_2]  // Add second category
    },
    p_options: {
      include_dynamic: true,
      include_relationships: true,
      relationships_mode: 'UPSERT'
    }
  }

  const { result, duration } = await callRPC('hera_entities_crud_v1', payload)

  const assertions = [
    {
      name: 'success = true',
      check: (r) => ({
        pass: r.data?.success === true,
        expected: 'true',
        actual: String(r.data?.success)
      })
    },
    {
      name: 'CRITICAL: UPDATE returns complete entity object (no refetch needed)',
      check: (r) => {
        const entity = r.data?.data?.entity
        const hasAllFields = entity?.id && entity?.entity_name && entity?.entity_type && entity?.smart_code
        return {
          pass: hasAllFields,
          expected: 'Complete entity with id, entity_name, entity_type, smart_code',
          actual: entity ? `entity with ${Object.keys(entity).length} fields` : 'null'
        }
      }
    },
    {
      name: 'entity.id matches PRODUCT_ENTITY_ID',
      check: (r) => ({
        pass: r.data?.data?.entity?.id === PRODUCT_ENTITY_ID,
        expected: PRODUCT_ENTITY_ID,
        actual: r.data?.data?.entity?.id || 'null'
      })
    },
    {
      name: 'entity name updated to "Hydrating Shampoo – New"',
      check: (r) => ({
        pass: r.data?.data?.entity?.entity_name === 'Hydrating Shampoo – New',
        expected: 'Hydrating Shampoo – New',
        actual: r.data?.data?.entity?.entity_name || 'null'
      })
    },
    {
      name: 'entity_type still PRODUCT',
      check: (r) => ({
        pass: r.data?.data?.entity?.entity_type === 'PRODUCT',
        expected: 'PRODUCT',
        actual: r.data?.data?.entity?.entity_type || 'null'
      })
    },
    {
      name: 'CRITICAL: dynamic_data array included',
      check: (r) => ({
        pass: Array.isArray(r.data?.data?.dynamic_data),
        expected: 'array',
        actual: typeof r.data?.data?.dynamic_data
      })
    },
    {
      name: 'CRITICAL: price_market updated to 27',
      check: (r) => {
        const fields = r.data?.data?.dynamic_data || []
        const price = fields.find(f => f.field_name === 'price_market')
        return {
          pass: price?.field_value_number === 27,
          expected: '27',
          actual: String(price?.field_value_number || 'not found')
        }
      }
    },
    {
      name: 'CRITICAL: relationships array included',
      check: (r) => ({
        pass: Array.isArray(r.data?.data?.relationships),
        expected: 'array',
        actual: typeof r.data?.data?.relationships
      })
    },
    {
      name: 'HAS_CATEGORY includes CATEGORY_ID_1 (preserved)',
      check: (r) => {
        const rels = r.data?.data?.relationships || []
        const found = rels.some(rel =>
          rel.relationship_type === 'HAS_CATEGORY' &&
          rel.to_entity_id === CATEGORY_ID_1
        )
        return {
          pass: found,
          expected: 'found',
          actual: found ? 'found' : 'not found'
        }
      }
    },
    {
      name: 'HAS_CATEGORY includes CATEGORY_ID_2 (newly added)',
      check: (r) => {
        const rels = r.data?.data?.relationships || []
        const found = rels.some(rel =>
          rel.relationship_type === 'HAS_CATEGORY' &&
          rel.to_entity_id === CATEGORY_ID_2
        )
        return {
          pass: found,
          expected: 'found',
          actual: found ? 'found' : 'not found'
        }
      }
    },
    {
      name: 'UPSERT mode: both categories present (not replaced)',
      check: (r) => {
        const rels = r.data?.data?.relationships || []
        const cat1 = rels.some(rel => rel.relationship_type === 'HAS_CATEGORY' && rel.to_entity_id === CATEGORY_ID_1)
        const cat2 = rels.some(rel => rel.relationship_type === 'HAS_CATEGORY' && rel.to_entity_id === CATEGORY_ID_2)
        return {
          pass: cat1 && cat2,
          expected: 'Both CAT1 and CAT2',
          actual: `CAT1: ${cat1 ? 'yes' : 'no'}, CAT2: ${cat2 ? 'yes' : 'no'}`
        }
      }
    }
  ]

  return logTest('UPDATE UPSERT relationships (add second category)', payload, result, duration, assertions)
}

// Test 4: UPDATE REPLACE relationships
async function test4_UpdateReplaceRelationships() {
  if (!PRODUCT_ENTITY_ID) {
    console.log('\n⚠️  Skipping Test 4: No product ID')
    testResults.push({
      number: ++testNumber,
      name: 'UPDATE REPLACE relationships',
      result: 'SKIP',
      notes: 'Prerequisite failed',
      duration: 0
    })
    return false
  }

  const payload = {
    p_action: 'UPDATE',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_id: PRODUCT_ENTITY_ID
    },
    p_dynamic: {},
    p_relationships: {
      HAS_CATEGORY: [CATEGORY_ID_2]  // Only CAT2, should remove CAT1
    },
    p_options: {
      include_dynamic: true,
      include_relationships: true,
      relationships_mode: 'REPLACE'
    }
  }

  const { result, duration } = await callRPC('hera_entities_crud_v1', payload)

  const assertions = [
    {
      name: 'success = true',
      check: (r) => ({
        pass: r.data?.success === true,
        expected: 'true',
        actual: String(r.data?.success)
      })
    },
    {
      name: 'CRITICAL: UPDATE returns complete entity object (no refetch needed)',
      check: (r) => {
        const entity = r.data?.data?.entity
        const hasAllFields = entity?.id && entity?.entity_name && entity?.entity_type && entity?.smart_code
        return {
          pass: hasAllFields,
          expected: 'Complete entity with id, entity_name, entity_type, smart_code',
          actual: entity ? `entity with ${Object.keys(entity).length} fields` : 'null'
        }
      }
    },
    {
      name: 'entity.id matches PRODUCT_ENTITY_ID',
      check: (r) => ({
        pass: r.data?.data?.entity?.id === PRODUCT_ENTITY_ID,
        expected: PRODUCT_ENTITY_ID,
        actual: r.data?.data?.entity?.id || 'null'
      })
    },
    {
      name: 'CRITICAL: dynamic_data array included',
      check: (r) => ({
        pass: Array.isArray(r.data?.data?.dynamic_data),
        expected: 'array',
        actual: typeof r.data?.data?.dynamic_data
      })
    },
    {
      name: 'price_market still 27 (unchanged)',
      check: (r) => {
        const fields = r.data?.data?.dynamic_data || []
        const price = fields.find(f => f.field_name === 'price_market')
        return {
          pass: price?.field_value_number === 27,
          expected: '27',
          actual: String(price?.field_value_number || 'not found')
        }
      }
    },
    {
      name: 'CRITICAL: relationships array included',
      check: (r) => ({
        pass: Array.isArray(r.data?.data?.relationships),
        expected: 'array',
        actual: typeof r.data?.data?.relationships
      })
    },
    {
      name: 'HAS_CATEGORY includes CATEGORY_ID_2 (kept)',
      check: (r) => {
        const rels = r.data?.data?.relationships || []
        const found = rels.some(rel =>
          rel.relationship_type === 'HAS_CATEGORY' &&
          rel.to_entity_id === CATEGORY_ID_2
        )
        return {
          pass: found,
          expected: 'found',
          actual: found ? 'found' : 'not found'
        }
      }
    },
    {
      name: 'HAS_CATEGORY does NOT include CATEGORY_ID_1 (removed by REPLACE)',
      check: (r) => {
        const rels = r.data?.data?.relationships || []
        const found = rels.some(rel =>
          rel.relationship_type === 'HAS_CATEGORY' &&
          rel.to_entity_id === CATEGORY_ID_1
        )
        return {
          pass: !found,
          expected: 'not found',
          actual: found ? 'found (ERROR)' : 'not found'
        }
      }
    },
    {
      name: 'REPLACE mode: only CAT2 present (CAT1 removed)',
      check: (r) => {
        const rels = r.data?.data?.relationships || []
        const cat1 = rels.some(rel => rel.relationship_type === 'HAS_CATEGORY' && rel.to_entity_id === CATEGORY_ID_1)
        const cat2 = rels.some(rel => rel.relationship_type === 'HAS_CATEGORY' && rel.to_entity_id === CATEGORY_ID_2)
        return {
          pass: !cat1 && cat2,
          expected: 'Only CAT2',
          actual: `CAT1: ${cat1 ? 'yes (ERROR)' : 'no'}, CAT2: ${cat2 ? 'yes' : 'no (ERROR)'}`
        }
      }
    }
  ]

  return logTest('UPDATE REPLACE relationships (exact set)', payload, result, duration, assertions)
}

// Test 5: Large dynamic batch (mixed types)
async function test5_MixedDynamicTypes() {
  if (!PRODUCT_ENTITY_ID) {
    console.log('\n⚠️  Skipping Test 5: No product ID')
    testResults.push({
      number: ++testNumber,
      name: 'Mixed dynamic types',
      result: 'SKIP',
      notes: 'Prerequisite failed',
      duration: 0
    })
    return false
  }

  const payload = {
    p_action: 'UPDATE',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_id: PRODUCT_ENTITY_ID
    },
    p_dynamic: {
      sku: { value: 'PROD-001', type: 'text', smart_code: genDynamicSmart('SKU') },
      inventory_on_hand: { value: '123', type: 'number', smart_code: genDynamicSmart('INVENTORY') },
      archived: { value: 'false', type: 'boolean', smart_code: genDynamicSmart('ARCHIVED') },
      launch_date: { value: '2025-01-01T00:00:00Z', type: 'date', smart_code: genDynamicSmart('LAUNCH') },
      attributes: {
        value: { color: 'blue', sizes: ['S', 'M', 'L'] },
        type: 'json',
        smart_code: genDynamicSmart('ATTRS')
      }
    },
    p_relationships: {},
    p_options: {
      include_dynamic: true
    }
  }

  const { result, duration } = await callRPC('hera_entities_crud_v1', payload)

  const assertions = [
    {
      name: 'success = true',
      check: (r) => ({
        pass: r.data?.success === true,
        expected: 'true',
        actual: String(r.data?.success)
      })
    },
    {
      name: 'text field stored',
      check: (r) => {
        const fields = r.data?.data?.dynamic_data || []
        const sku = fields.find(f => f.field_name === 'sku')
        return {
          pass: sku?.field_value_text === 'PROD-001',
          expected: 'PROD-001',
          actual: sku?.field_value_text || 'null'
        }
      }
    },
    {
      name: 'number field stored',
      check: (r) => {
        const fields = r.data?.data?.dynamic_data || []
        const inv = fields.find(f => f.field_name === 'inventory_on_hand')
        return {
          pass: inv?.field_value_number === 123,
          expected: '123',
          actual: String(inv?.field_value_number || 'null')
        }
      }
    },
    {
      name: 'boolean field stored',
      check: (r) => {
        const fields = r.data?.data?.dynamic_data || []
        const arch = fields.find(f => f.field_name === 'archived')
        return {
          pass: arch?.field_value_boolean === false,
          expected: 'false',
          actual: String(arch?.field_value_boolean)
        }
      }
    },
    {
      name: 'json field stored',
      check: (r) => {
        const fields = r.data?.data?.dynamic_data || []
        const attr = fields.find(f => f.field_name === 'attributes')
        const hasColor = attr?.field_value_json?.color === 'blue'
        return {
          pass: hasColor,
          expected: '{color: blue, sizes: [S,M,L]}',
          actual: JSON.stringify(attr?.field_value_json || {})
        }
      }
    }
  ]

  return logTest('Mixed dynamic types (text/number/boolean/date/json)', payload, result, duration, assertions)
}

// Test 6: Guardrail - Invalid smart code
async function test6_InvalidSmartCode() {
  const payload = {
    p_action: 'CREATE',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_type: 'PRODUCT',
      entity_name: 'Bad Product',
      smart_code: 'HERA.INVALID',  // Invalid pattern
      entity_code: 'PROD-BAD'
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {}
  }

  const { result, duration } = await callRPC('hera_entities_crud_v1', payload)

  const assertions = [
    {
      name: 'success = false',
      check: (r) => ({
        pass: r.data?.success === false,
        expected: 'false',
        actual: String(r.data?.success)
      })
    },
    {
      name: 'error mentions SMARTCODE/invalid',
      check: (r) => {
        const error = r.data?.error || r.error?.message || ''
        const mentions = error.includes('SMARTCODE') || error.includes('smart_code') || error.includes('invalid')
        return {
          pass: mentions,
          expected: 'error with SMARTCODE/invalid',
          actual: error.substring(0, 100)
        }
      }
    }
  ]

  return logTest('Guardrail: Invalid smart code', payload, result, duration, assertions)
}

// Test 7: Guardrail - Missing actor
async function test7_MissingActor() {
  const payload = {
    p_action: 'CREATE',
    p_actor_user_id: null,  // Missing actor
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_type: 'PRODUCT',
      entity_name: 'No Actor Product',
      smart_code: genSmart('PRODUCT'),
      entity_code: 'PROD-NOACTOR'
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {}
  }

  const { result, duration } = await callRPC('hera_entities_crud_v1', payload)

  const assertions = [
    {
      name: 'success = false',
      check: (r) => ({
        pass: r.data?.success === false,
        expected: 'false',
        actual: String(r.data?.success)
      })
    },
    {
      name: 'error mentions ACTOR_REQUIRED',
      check: (r) => {
        const error = r.data?.error || r.error?.message || ''
        const mentions = error.includes('ACTOR') || error.includes('actor')
        return {
          pass: mentions,
          expected: 'error with ACTOR',
          actual: error.substring(0, 100)
        }
      }
    }
  ]

  return logTest('Guardrail: Missing actor for CREATE', payload, result, duration, assertions)
}

// Test 8: Guardrail - Non-member actor
async function test8_NonMemberActor() {
  if (!PRODUCT_ENTITY_ID) {
    console.log('\n⚠️  Skipping Test 8: No product ID')
    testResults.push({
      number: ++testNumber,
      name: 'Non-member actor',
      result: 'SKIP',
      notes: 'Prerequisite failed',
      duration: 0
    })
    return false
  }

  // Use a random UUID that's unlikely to be a member
  const NON_MEMBER = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

  const payload = {
    p_action: 'UPDATE',
    p_actor_user_id: NON_MEMBER,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_id: PRODUCT_ENTITY_ID,
      entity_name: 'Hacked Product'
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {}
  }

  const { result, duration } = await callRPC('hera_entities_crud_v1', payload)

  const assertions = [
    {
      name: 'success = false',
      check: (r) => ({
        pass: r.data?.success === false,
        expected: 'false',
        actual: String(r.data?.success)
      })
    },
    {
      name: 'error mentions ACTOR_NOT_MEMBER or MEMBER',
      check: (r) => {
        const error = r.data?.error || r.error?.message || ''
        const mentions = error.includes('MEMBER') || error.includes('not a member')
        return {
          pass: mentions,
          expected: 'error with MEMBER',
          actual: error.substring(0, 100)
        }
      }
    }
  ]

  return logTest('Guardrail: Non-member actor', payload, result, duration, assertions)
}

// Test 9: Platform identity allowed (CREATE USER)
async function test9_PlatformIdentity() {
  const payload = {
    p_action: 'CREATE',
    p_actor_user_id: null,  // Not required for platform identity
    p_organization_id: PLATFORM_ORG_ID,
    p_entity: {
      entity_type: 'USER',
      entity_name: 'Demo User',
      smart_code: 'HERA.SEC.USER.ENTITY.ACCOUNT.v1',
      entity_code: `USER-${Date.now()}`
    },
    p_dynamic: {
      email: { value: 'demo@example.com', type: 'text', smart_code: 'HERA.SEC.USER.DYN.EMAIL.v1' },
      supabase_uid: { value: 'su-123', type: 'text', smart_code: 'HERA.SEC.USER.DYN.SUPABASE.v1' }
    },
    p_relationships: {},
    p_options: {
      allow_platform_identity: true,
      system_actor_user_id: ACTOR_USER_ID  // Provide system actor for platform identity
    }
  }

  const { result, duration } = await callRPC('hera_entities_crud_v1', payload)

  const assertions = [
    {
      name: 'success = true',
      check: (r) => ({
        pass: r.data?.success === true,
        expected: 'true',
        actual: String(r.data?.success)
      })
    },
    {
      name: 'entity_id exists',
      check: (r) => ({
        pass: !!r.data?.entity_id,
        expected: 'UUID string',
        actual: r.data?.entity_id || 'null'
      })
    },
    {
      name: 'entity_type = USER',
      check: (r) => ({
        pass: r.data?.data?.entity?.entity_type === 'USER',
        expected: 'USER',
        actual: r.data?.data?.entity?.entity_type || 'null'
      })
    }
  ]

  const passed = logTest('Platform identity: CREATE USER in platform org', payload, result, duration, assertions)

  if (result.data?.entity_id) {
    USER_ENTITY_ID = result.data.entity_id
  }

  return passed
}

// Test 10: Platform non-identity write blocked
async function test10_PlatformNonIdentity() {
  const payload = {
    p_action: 'CREATE',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: PLATFORM_ORG_ID,
    p_entity: {
      entity_type: 'PRODUCT',  // Not USER or ROLE
      entity_name: 'Platform Product',
      smart_code: genSmart('PRODUCT'),
      entity_code: 'PLAT-PROD'
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {}
  }

  const { result, duration } = await callRPC('hera_entities_crud_v1', payload)

  const assertions = [
    {
      name: 'success = false',
      check: (r) => ({
        pass: r.data?.success === false,
        expected: 'false',
        actual: String(r.data?.success)
      })
    },
    {
      name: 'error mentions PLATFORM_ORG_WRITE_FORBIDDEN',
      check: (r) => {
        const error = r.data?.error || r.error?.message || ''
        const mentions = error.includes('PLATFORM') || error.includes('FORBIDDEN')
        return {
          pass: mentions,
          expected: 'error with PLATFORM',
          actual: error.substring(0, 100)
        }
      }
    }
  ]

  return logTest('Platform non-identity write blocked', payload, result, duration, assertions)
}

// Test 11: DELETE flow
async function test11_Delete() {
  if (!PRODUCT_ENTITY_ID) {
    console.log('\n⚠️  Skipping Test 11: No product ID')
    testResults.push({
      number: ++testNumber,
      name: 'DELETE flow',
      result: 'SKIP',
      notes: 'Prerequisite failed',
      duration: 0
    })
    return false
  }

  const payload = {
    p_action: 'DELETE',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_id: PRODUCT_ENTITY_ID
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {}
  }

  const { result, duration } = await callRPC('hera_entities_crud_v1', payload)

  const assertions = [
    {
      name: 'success = true',
      check: (r) => ({
        pass: r.data?.success === true,
        expected: 'true',
        actual: String(r.data?.success)
      })
    },
    {
      name: 'action = DELETE',
      check: (r) => ({
        pass: r.data?.action === 'DELETE',
        expected: 'DELETE',
        actual: r.data?.action || 'null'
      })
    },
    {
      name: 'deleted_at timestamp present',
      check: (r) => ({
        pass: !!r.data?.data?.deleted_at,
        expected: 'timestamp',
        actual: r.data?.data?.deleted_at || 'null'
      })
    }
  ]

  return logTest('DELETE entity', payload, result, duration, assertions)
}

// Test 12: Smart code normalization (.V1 → .v1)
async function test12_SmartCodeNormalization() {
  const payload = {
    p_action: 'CREATE',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_type: 'PRODUCT',
      entity_name: 'Uppercase V Product',
      smart_code: 'HERA.SALON.PRODUCT.ENTITY.ITEM.V1',  // Uppercase V
      entity_code: `PROD-NORM-${Date.now()}`
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {}
  }

  const { result, duration } = await callRPC('hera_entities_crud_v1', payload)

  const assertions = [
    {
      name: 'success = true (normalized)',
      check: (r) => ({
        pass: r.data?.success === true,
        expected: 'true',
        actual: String(r.data?.success)
      })
    },
    {
      name: 'smart_code normalized to lowercase v',
      check: (r) => {
        const smartCode = r.data?.data?.entity?.smart_code || ''
        const normalized = smartCode.endsWith('.v1')
        return {
          pass: normalized,
          expected: '.v1 (lowercase)',
          actual: smartCode
        }
      }
    }
  ]

  return logTest('Smart code normalization (.V1 → .v1)', payload, result, duration, assertions)
}

// ============================================
// Main Test Runner
// ============================================
async function runTests() {
  console.log('\n' + '='.repeat(80))
  console.log('HERA ORCHESTRATOR RPC TEST SUITE')
  console.log('Function: hera_entities_crud_v1')
  console.log('='.repeat(80))

  console.log('\n📋 Configuration:')
  console.log(`   Tenant Org:    ${TENANT_ORG_ID}`)
  console.log(`   Platform Org:  ${PLATFORM_ORG_ID}`)
  console.log(`   Actor User:    ${ACTOR_USER_ID}`)

  // Setup
  await setupTestData()

  if (!CATEGORY_ID_1 || !CATEGORY_ID_2) {
    console.log('\n❌ Setup failed: Could not create test categories')
    console.log('   Aborting test suite')
    return
  }

  console.log('\n' + '='.repeat(80))
  console.log('RUNNING TESTS')
  console.log('='.repeat(80))

  // Run all tests
  await test1_CreateProduct()
  await test2_ReadProduct()
  await test2b_ReadByEntityType()  // ← NEW: Critical test for customer pages
  await test3_UpdateUpsertRelationships()
  await test4_UpdateReplaceRelationships()
  await test5_MixedDynamicTypes()
  await test6_InvalidSmartCode()
  await test7_MissingActor()
  await test8_NonMemberActor()
  await test9_PlatformIdentity()
  await test10_PlatformNonIdentity()
  await test11_Delete()
  await test12_SmartCodeNormalization()

  // Summary
  console.log('\n\n' + '='.repeat(80))
  console.log('TEST SUMMARY')
  console.log('='.repeat(80))

  // Results table
  console.log('\n| Test # | Name | Result | Duration | Notes |')
  console.log('|--------|------|--------|----------|-------|')

  testResults.forEach(test => {
    const num = String(test.number).padEnd(6)
    const name = test.name.substring(0, 35).padEnd(35)
    const result = test.result === 'PASS' ? '✅ PASS' : test.result === 'FAIL' ? '❌ FAIL' : '⏭️  SKIP'
    const duration = `${test.duration}ms`.padEnd(8)
    const notes = test.notes.substring(0, 30)
    console.log(`| ${num} | ${name} | ${result} | ${duration} | ${notes} |`)
  })

  // Count
  const passed = testResults.filter(t => t.result === 'PASS').length
  const failed = testResults.filter(t => t.result === 'FAIL').length
  const skipped = testResults.filter(t => t.result === 'SKIP').length
  const total = testResults.length

  console.log('\n' + '='.repeat(80))
  console.log(`📊 Results: ${passed} passed / ${failed} failed / ${skipped} skipped (${total} total)`)

  if (failed > 0) {
    const failedTests = testResults
      .filter(t => t.result === 'FAIL')
      .map(t => `#${t.number}`)
      .join(', ')
    console.log(`❌ Failing tests: ${failedTests}`)
  } else if (passed === total) {
    console.log('✅ All tests passed!')
  }

  console.log('='.repeat(80) + '\n')
}

// Run the test suite
runTests().catch(error => {
  console.error('\n❌ Test suite failed with error:')
  console.error(error)
  process.exit(1)
})
