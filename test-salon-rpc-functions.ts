#!/usr/bin/env npx tsx

/**
 * Test Suite for Salon Service RPC Functions
 * Tests both V1 and V2 RPC functions to verify data retrieval
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Test configuration
const TEST_ORG_ID = '719dfed1-09b4-4ca8-bfda-f682460de945' // HERA Demo Organization

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80))
  log(title, 'bright')
  console.log('='.repeat(80))
}

function logJSON(data: any, label?: string) {
  if (label) log(label, 'cyan')
  console.log(JSON.stringify(data, null, 2))
}

async function testDirectQuery() {
  logSection('1. TESTING DIRECT SUPABASE QUERIES')

  try {
    // Test 1: Query services directly from core_entities
    log('\n📊 Direct Query: core_entities for services', 'blue')
    const { data: services, error: servicesError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code, entity_type, status, smart_code, created_at, updated_at')
      .eq('organization_id', TEST_ORG_ID)
      .in('entity_type', ['service', 'svc'])
      .eq('status', 'active')
      .limit(5)

    if (servicesError) {
      log(`❌ Error querying services: ${servicesError.message}`, 'red')
    } else {
      log(`✅ Found ${services?.length || 0} services`, 'green')
      if (services && services.length > 0) {
        logJSON(services[0], 'Sample service:')
      }
    }

    // Test 2: Query dynamic data for services
    if (services && services.length > 0) {
      const serviceIds = services.map(s => s.id)

      log('\n📊 Direct Query: core_dynamic_data for service attributes', 'blue')
      const { data: dynamicData, error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .select('entity_id, field_name, field_type, field_value_text, field_value_number, field_value_json')
        .eq('organization_id', TEST_ORG_ID)
        .in('entity_id', serviceIds)
        .in('field_name', ['service.base_price', 'service.duration_min', 'service.category'])

      if (dynamicError) {
        log(`❌ Error querying dynamic data: ${dynamicError.message}`, 'red')
      } else {
        log(`✅ Found ${dynamicData?.length || 0} dynamic data entries`, 'green')
        if (dynamicData && dynamicData.length > 0) {
          logJSON(dynamicData.slice(0, 3), 'Sample dynamic data:')
        }
      }
    }

    return services
  } catch (error) {
    log(`❌ Unexpected error in direct query: ${error}`, 'red')
    return null
  }
}

async function testRPCv1Functions(serviceIds?: string[]) {
  logSection('2. TESTING V1 RPC FUNCTIONS')

  try {
    // Test 1: fn_dynamic_fields_json
    log('\n📊 RPC Test: fn_dynamic_fields_json', 'blue')

    // First, get some service IDs if not provided
    if (!serviceIds) {
      const { data: services } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', TEST_ORG_ID)
        .in('entity_type', ['service', 'svc'])
        .limit(3)

      serviceIds = services?.map(s => s.id) || []
    }

    if (serviceIds.length === 0) {
      log('⚠️ No services found to test with', 'yellow')
      return
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('fn_dynamic_fields_json', {
      org_id: TEST_ORG_ID,
      p_entity_ids: serviceIds,
      p_smart_code: null
    })

    if (rpcError) {
      log(`❌ Error calling fn_dynamic_fields_json: ${rpcError.message}`, 'red')
    } else {
      log(`✅ RPC returned ${rpcData?.length || 0} results`, 'green')
      if (rpcData && rpcData.length > 0) {
        logJSON(rpcData[0], 'Sample RPC result:')
      }
    }

    // Test 2: fn_dynamic_fields_select
    log('\n📊 RPC Test: fn_dynamic_fields_select', 'blue')
    const { data: selectData, error: selectError } = await supabase.rpc('fn_dynamic_fields_select', {
      org_id: TEST_ORG_ID,
      p_entity_ids: serviceIds,
      p_smart_code: null,
      p_field_names: ['service.base_price', 'service.duration_min', 'service.category']
    })

    if (selectError) {
      log(`❌ Error calling fn_dynamic_fields_select: ${selectError.message}`, 'red')
    } else {
      log(`✅ RPC returned ${selectData?.length || 0} results`, 'green')
      if (selectData && selectData.length > 0) {
        logJSON(selectData.slice(0, 3), 'Sample select results:')
      }
    }

  } catch (error) {
    log(`❌ Unexpected error in RPC v1 tests: ${error}`, 'red')
  }
}

async function testRPCv2Functions() {
  logSection('3. TESTING V2 RPC FUNCTIONS')

  try {
    // Test 1: hera_entity_query_v1
    log('\n📊 RPC V2 Test: hera_entity_query_v1', 'blue')

    const filters = {
      entity_type: 'service',
      status: 'active'
    }

    const { data: entityData, error: entityError } = await supabase.rpc('hera_entity_query_v1', {
      p_org_id: TEST_ORG_ID,
      p_filters: filters,
      p_limit: 5
    })

    if (entityError) {
      log(`❌ Error calling hera_entity_query_v1: ${entityError.message}`, 'red')
      log(`Error details: ${JSON.stringify(entityError)}`, 'red')
    } else {
      const entities = entityData?.data || []
      log(`✅ V2 entity query returned ${entities.length} services`, 'green')
      if (entities.length > 0) {
        logJSON(entities[0], 'Sample V2 entity result:')
      }

      // Test 2: hera_entity_read_v1 for a specific entity
      if (entities.length > 0) {
        const entityId = entities[0].id
        log(`\n📊 RPC V2 Test: hera_entity_read_v1 for entity ${entityId}`, 'blue')

        const { data: readData, error: readError } = await supabase.rpc('hera_entity_read_v1', {
          p_org_id: TEST_ORG_ID,
          p_entity_id: entityId,
          p_include_dynamic: true
        })

        if (readError) {
          log(`❌ Error calling hera_entity_read_v1: ${readError.message}`, 'red')
        } else {
          log(`✅ V2 entity read successful`, 'green')
          logJSON(readData, 'Full entity with dynamic data:')
        }
      }
    }

    // Test 3: hera_dynamic_data_read_v1
    log('\n📊 RPC V2 Test: hera_dynamic_data_read_v1', 'blue')

    // First get an entity to test with
    const { data: testEntity } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', TEST_ORG_ID)
      .eq('entity_type', 'service')
      .limit(1)
      .single()

    if (testEntity) {
      const { data: dynamicData, error: dynamicError } = await supabase.rpc('hera_dynamic_data_read_v1', {
        p_org_id: TEST_ORG_ID,
        p_entity_id: testEntity.id,
        p_field_name: null
      })

      if (dynamicError) {
        log(`❌ Error calling hera_dynamic_data_read_v1: ${dynamicError.message}`, 'red')
      } else {
        log(`✅ V2 dynamic data read returned ${dynamicData?.data?.length || 0} fields`, 'green')
        if (dynamicData?.data?.length > 0) {
          logJSON(dynamicData.data, 'Dynamic fields:')
        }
      }
    }

  } catch (error) {
    log(`❌ Unexpected error in RPC v2 tests: ${error}`, 'red')
  }
}

async function compareResults() {
  logSection('4. COMPARING DIRECT QUERY VS RPC RESULTS')

  try {
    // Get one service to compare
    const { data: service } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', TEST_ORG_ID)
      .eq('entity_type', 'service')
      .limit(1)
      .single()

    if (!service) {
      log('⚠️ No service found for comparison', 'yellow')
      return
    }

    log(`\n🔍 Comparing data for service: ${service.entity_name} (${service.id})`, 'magenta')

    // Direct query
    const { data: directDynamic } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, field_value_number, field_value_json')
      .eq('organization_id', TEST_ORG_ID)
      .eq('entity_id', service.id)

    log('\n📊 Direct Query Results:', 'cyan')
    logJSON(directDynamic || [], 'Dynamic fields from direct query:')

    // RPC v1
    const { data: rpcV1Data } = await supabase.rpc('fn_dynamic_fields_json', {
      org_id: TEST_ORG_ID,
      p_entity_ids: [service.id],
      p_smart_code: null
    })

    log('\n📊 RPC V1 Results:', 'cyan')
    logJSON(rpcV1Data || [], 'Dynamic fields from RPC v1:')

    // RPC v2
    const { data: rpcV2Data } = await supabase.rpc('hera_entity_read_v1', {
      p_org_id: TEST_ORG_ID,
      p_entity_id: service.id,
      p_include_dynamic: true
    })

    log('\n📊 RPC V2 Results:', 'cyan')
    logJSON(rpcV2Data?.dynamic_data || [], 'Dynamic fields from RPC v2:')

    // Compare counts
    log('\n📊 Summary:', 'yellow')
    log(`Direct Query: ${directDynamic?.length || 0} fields`, 'cyan')
    log(`RPC V1: ${rpcV1Data?.[0]?.attributes ? Object.keys(rpcV1Data[0].attributes).length : 0} fields`, 'cyan')
    log(`RPC V2: ${rpcV2Data?.dynamic_data?.length || 0} fields`, 'cyan')

  } catch (error) {
    log(`❌ Error in comparison: ${error}`, 'red')
  }
}

async function main() {
  console.clear()
  log('\n🧪 SALON SERVICE RPC FUNCTION TEST SUITE', 'bright')
  log(`Testing with Organization ID: ${TEST_ORG_ID}`, 'cyan')
  log(`Supabase URL: ${supabaseUrl}`, 'cyan')

  try {
    // Run tests in sequence
    const services = await testDirectQuery()
    const serviceIds = services?.map(s => s.id)

    await testRPCv1Functions(serviceIds)
    await testRPCv2Functions()
    await compareResults()

    logSection('✅ TEST SUITE COMPLETE')
    log('All tests completed. Review results above for any issues.', 'green')

  } catch (error) {
    logSection('❌ TEST SUITE FAILED')
    log(`Fatal error: ${error}`, 'red')
    process.exit(1)
  }
}

// Run the test suite
main().catch(console.error)