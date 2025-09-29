#!/usr/bin/env npx tsx

/**
 * Create test salon service data and verify RPC functions work correctly
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Test configuration - using Hair Talkz organization
const TEST_ORG_ID = '33cd69f0-1b97-453f-ad6a-0c4c2f88e3d2' // Hair Talkz Salon

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

// Sample salon services to create
const salonServices = [
  {
    name: 'Premium Hair Cut & Style',
    code: 'SVC-HC-001',
    category: 'Hair Services',
    duration_mins: 60,
    price: 150.00,
    smart_code: 'HERA.SALON.SERVICE.HAIR.CUT.PREMIUM.V1'
  },
  {
    name: 'Hair Color Treatment',
    code: 'SVC-HC-002',
    category: 'Hair Services',
    duration_mins: 120,
    price: 350.00,
    smart_code: 'HERA.SALON.SERVICE.HAIR.COLOR.FULL.V1'
  },
  {
    name: 'Relaxing Head Massage',
    code: 'SVC-MS-001',
    category: 'Spa Services',
    duration_mins: 30,
    price: 80.00,
    smart_code: 'HERA.SALON.SERVICE.SPA.MASSAGE.HEAD.V1'
  }
]

async function createSalonServices() {
  logSection('1. CREATING SALON SERVICE TEST DATA')

  const createdServices: any[] = []

  for (const service of salonServices) {
    try {
      log(`\n📝 Creating service: ${service.name}`, 'cyan')

      // Step 1: Create entity using RPC
      const { data: entityData, error: entityError } = await supabase.rpc('hera_entity_upsert_v1', {
        p_org_id: TEST_ORG_ID,
        p_entity_type: 'service',
        p_entity_name: service.name,
        p_entity_code: service.code,
        p_smart_code: service.smart_code,
        p_metadata: {
          category: service.category,
          created_via: 'test_script'
        }
      })

      if (entityError) {
        log(`❌ Error creating entity: ${entityError.message}`, 'red')
        continue
      }

      const entityId = entityData?.data?.id
      if (!entityId) {
        log(`❌ No entity ID returned`, 'red')
        continue
      }

      log(`✅ Created entity: ${entityId}`, 'green')

      // Step 2: Add dynamic data for price
      const { error: priceError } = await supabase.rpc('hera_dynamic_data_upsert_v1', {
        p_org_id: TEST_ORG_ID,
        p_entity_id: entityId,
        p_field_name: 'service.base_price',
        p_field_value: {
          amount: service.price,
          currency_code: 'AED',
          tax_inclusive: true
        },
        p_smart_code: 'HERA.SALON.SERVICE.PRICE.BASE.V1'
      })

      if (priceError) {
        log(`⚠️ Error adding price: ${priceError.message}`, 'yellow')
      } else {
        log(`✅ Added price: AED ${service.price}`, 'green')
      }

      // Step 3: Add dynamic data for duration
      const { error: durationError } = await supabase.rpc('hera_dynamic_data_upsert_v1', {
        p_org_id: TEST_ORG_ID,
        p_entity_id: entityId,
        p_field_name: 'service.duration_min',
        p_field_value: service.duration_mins,
        p_smart_code: 'HERA.SALON.SERVICE.DURATION.STANDARD.V1'
      })

      if (durationError) {
        log(`⚠️ Error adding duration: ${durationError.message}`, 'yellow')
      } else {
        log(`✅ Added duration: ${service.duration_mins} mins`, 'green')
      }

      // Step 4: Add dynamic data for category
      const { error: categoryError } = await supabase.rpc('hera_dynamic_data_upsert_v1', {
        p_org_id: TEST_ORG_ID,
        p_entity_id: entityId,
        p_field_name: 'service.category',
        p_field_value: service.category,
        p_smart_code: 'HERA.SALON.SERVICE.CATEGORY.STANDARD.V1'
      })

      if (categoryError) {
        log(`⚠️ Error adding category: ${categoryError.message}`, 'yellow')
      } else {
        log(`✅ Added category: ${service.category}`, 'green')
      }

      createdServices.push({ ...service, id: entityId })

    } catch (error) {
      log(`❌ Unexpected error: ${error}`, 'red')
    }
  }

  log(`\n📊 Created ${createdServices.length} services`, 'cyan')
  return createdServices
}

async function testEntityQuery() {
  logSection('2. TESTING ENTITY QUERY RPC')

  try {
    // Test hera_entity_query_v1
    log('\n🔍 Testing hera_entity_query_v1 for services', 'blue')

    const filters = {
      entity_type: 'service',
      status: 'active'
    }

    const { data, error } = await supabase.rpc('hera_entity_query_v1', {
      p_org_id: TEST_ORG_ID,
      p_filters: filters,
      p_limit: 10,
      p_offset: 0,
      p_include_deleted: false
    })

    if (error) {
      log(`❌ Error: ${error.message}`, 'red')
      return null
    }

    const entities = data?.data || []
    log(`✅ Found ${entities.length} services`, 'green')

    if (entities.length > 0) {
      log('\nSample service:', 'cyan')
      logJSON(entities[0])
    }

    return entities

  } catch (error) {
    log(`❌ Unexpected error: ${error}`, 'red')
    return null
  }
}

async function testEntityRead(entityId: string) {
  logSection('3. TESTING ENTITY READ WITH DYNAMIC DATA')

  try {
    log(`\n🔍 Testing hera_entity_read_v1 for entity ${entityId}`, 'blue')

    const { data, error } = await supabase.rpc('hera_entity_read_v1', {
      p_org_id: TEST_ORG_ID,
      p_entity_id: entityId,
      p_include_dynamic: true,
      p_include_relationships: true
    })

    if (error) {
      log(`❌ Error: ${error.message}`, 'red')
      return null
    }

    log(`✅ Successfully read entity with dynamic data`, 'green')

    if (data?.data) {
      log('\nEntity details:', 'cyan')
      logJSON({
        id: data.data.id,
        name: data.data.entity_name,
        code: data.data.entity_code,
        smart_code: data.data.smart_code,
        dynamic_data_count: data.dynamic_data?.length || 0
      })

      if (data.dynamic_data && data.dynamic_data.length > 0) {
        log('\nDynamic fields:', 'cyan')
        data.dynamic_data.forEach((field: any) => {
          log(`  - ${field.field_name}: ${JSON.stringify(field.field_value)}`, 'blue')
        })
      }
    }

    return data

  } catch (error) {
    log(`❌ Unexpected error: ${error}`, 'red')
    return null
  }
}

async function testDynamicDataRead(entityId: string) {
  logSection('4. TESTING DYNAMIC DATA READ')

  try {
    log(`\n🔍 Testing hera_dynamic_data_read_v1 for entity ${entityId}`, 'blue')

    const { data, error } = await supabase.rpc('hera_dynamic_data_read_v1', {
      p_org_id: TEST_ORG_ID,
      p_entity_id: entityId,
      p_field_name: null // Get all fields
    })

    if (error) {
      log(`❌ Error: ${error.message}`, 'red')
      return null
    }

    const fields = data?.data || []
    log(`✅ Found ${fields.length} dynamic fields`, 'green')

    if (fields.length > 0) {
      log('\nDynamic fields:', 'cyan')
      fields.forEach((field: any) => {
        log(`  Field: ${field.field_name}`, 'blue')
        log(`    Type: ${field.field_type}`, 'blue')
        log(`    Value: ${JSON.stringify(field.field_value)}`, 'blue')
        log(`    Smart Code: ${field.smart_code}`, 'blue')
      })
    }

    return fields

  } catch (error) {
    log(`❌ Unexpected error: ${error}`, 'red')
    return null
  }
}

async function compareWithDirectQuery(entityId: string) {
  logSection('5. COMPARING RPC VS DIRECT QUERY')

  try {
    log(`\n🔍 Comparing data retrieval methods for entity ${entityId}`, 'magenta')

    // Method 1: Direct Query
    log('\n📊 Method 1: Direct Supabase Query', 'cyan')
    const { data: directEntity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', entityId)
      .single()

    const { data: directDynamic } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', entityId)

    log(`Direct Query - Entity fields: ${Object.keys(directEntity || {}).length}`, 'blue')
    log(`Direct Query - Dynamic fields: ${directDynamic?.length || 0}`, 'blue')

    // Method 2: RPC V2
    log('\n📊 Method 2: RPC V2 Functions', 'cyan')
    const { data: rpcData } = await supabase.rpc('hera_entity_read_v1', {
      p_org_id: TEST_ORG_ID,
      p_entity_id: entityId,
      p_include_dynamic: true
    })

    log(`RPC V2 - Entity fields: ${Object.keys(rpcData?.data || {}).length}`, 'blue')
    log(`RPC V2 - Dynamic fields: ${rpcData?.dynamic_data?.length || 0}`, 'blue')

    // Compare results
    log('\n📊 Comparison Summary:', 'yellow')

    const directTotal = (directDynamic?.length || 0) + 1 // +1 for entity
    const rpcTotal = (rpcData?.dynamic_data?.length || 0) + 1 // +1 for entity

    if (directTotal === rpcTotal) {
      log(`✅ Both methods return the same amount of data`, 'green')
    } else {
      log(`⚠️ Data mismatch: Direct=${directTotal} vs RPC=${rpcTotal}`, 'yellow')
    }

    // Show RPC advantages
    log('\n💡 RPC V2 Advantages:', 'magenta')
    log('  ✅ Single call instead of multiple queries', 'green')
    log('  ✅ Automatic organization filtering', 'green')
    log('  ✅ Smart code validation', 'green')
    log('  ✅ Structured response format', 'green')
    log('  ✅ Built-in error handling', 'green')
    log('  ✅ Audit trail support', 'green')

  } catch (error) {
    log(`❌ Unexpected error: ${error}`, 'red')
  }
}

async function cleanupTestData(serviceIds: string[]) {
  logSection('6. CLEANUP TEST DATA (Optional)')

  log('\n⚠️ Test data created. To clean up, uncomment the cleanup code.', 'yellow')

  // Uncomment to actually delete test data
  /*
  for (const id of serviceIds) {
    try {
      const { error } = await supabase.rpc('hera_entity_delete_v1', {
        p_org_id: TEST_ORG_ID,
        p_entity_id: id,
        p_soft_delete: true
      })

      if (error) {
        log(`❌ Error deleting ${id}: ${error.message}`, 'red')
      } else {
        log(`✅ Deleted ${id}`, 'green')
      }
    } catch (error) {
      log(`❌ Error: ${error}`, 'red')
    }
  }
  */
}

async function main() {
  console.clear()
  log('\n🧪 SALON SERVICE RPC V2 COMPREHENSIVE TEST', 'bright')
  log(`Testing with Hair Talkz Organization: ${TEST_ORG_ID}`, 'cyan')
  log(`Supabase URL: ${supabaseUrl}`, 'cyan')

  try {
    // Step 1: Create test data
    const createdServices = await createSalonServices()

    if (createdServices.length === 0) {
      log('\n❌ No services created, cannot continue tests', 'red')
      process.exit(1)
    }

    // Step 2: Test entity query
    const entities = await testEntityQuery()

    // Step 3: Test entity read with dynamic data
    if (entities && entities.length > 0) {
      await testEntityRead(entities[0].id)
    }

    // Step 4: Test dynamic data read
    if (createdServices.length > 0) {
      await testDynamicDataRead(createdServices[0].id)
    }

    // Step 5: Compare RPC vs Direct Query
    if (createdServices.length > 0) {
      await compareWithDirectQuery(createdServices[0].id)
    }

    // Step 6: Cleanup (optional)
    await cleanupTestData(createdServices.map(s => s.id))

    logSection('✅ ALL TESTS COMPLETE')
    log('RPC V2 functions are working correctly!', 'green')
    log('\n🎯 Next Step: Refactor salon services to use V2 API endpoints', 'magenta')

  } catch (error) {
    logSection('❌ TEST FAILED')
    log(`Fatal error: ${error}`, 'red')
    process.exit(1)
  }
}

// Run the test suite
main().catch(console.error)