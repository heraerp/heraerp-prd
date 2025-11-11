#!/usr/bin/env node

/**
 * Test bulk entities CRUD with valid smart codes for Salon Demo org
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const testData = {
  actor_user_id: '4d93b3f8-dfe8-430c-83ea-3128f6a520cf',
  organization_id: 'de5f248d-7747-44f3-9d11-a279f3158fa5'
}

console.log('🧪 Testing Bulk Entities CRUD with Valid Smart Codes\n')

// First, check what entities exist in this org to see what smart codes work
console.log('Step 1: Finding valid smart codes in use...')
const { data: existingEntities } = await supabase
  .from('core_entities')
  .select('entity_type, smart_code')
  .eq('organization_id', testData.organization_id)
  .not('smart_code', 'is', null)
  .limit(5)

if (existingEntities && existingEntities.length > 0) {
  console.log('\n✅ Found existing smart codes:')
  existingEntities.forEach((e, idx) => {
    console.log(`${idx + 1}. ${e.entity_type}: ${e.smart_code}`)
  })
  console.log()
}

// Use SALON smart codes since this is HERA Salon Demo
const salonSmartCode = 'HERA.SALON.CUSTOMER.ENTITY.v1'

console.log(`Using smart code: ${salonSmartCode}\n`)
console.log('='.repeat(60))

// TEST: Bulk CREATE with valid Salon smart codes
console.log('\n🧪 TEST: Bulk CREATE (3 customers, non-atomic)\n')

const bulkResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: testData.actor_user_id,
  p_organization_id: testData.organization_id,
  p_entities: [
    {
      entity: {
        entity_type: 'CUSTOMER',
        entity_name: 'Bulk Test Customer 1',
        entity_code: `BULK-TEST-${Date.now()}-001`,
        smart_code: salonSmartCode
      },
      dynamic: {
        phone: {
          field_type: 'text',
          field_value: '+1-555-0101',
          smart_code: 'HERA.SALON.CUSTOMER.FIELD.PHONE.v1'
        }
      }
    },
    {
      entity: {
        entity_type: 'CUSTOMER',
        entity_name: 'Bulk Test Customer 2',
        entity_code: `BULK-TEST-${Date.now()}-002`,
        smart_code: salonSmartCode
      },
      dynamic: {
        phone: {
          field_type: 'text',
          field_value: '+1-555-0102',
          smart_code: 'HERA.SALON.CUSTOMER.FIELD.PHONE.v1'
        }
      }
    },
    {
      entity: {
        entity_type: 'CUSTOMER',
        entity_name: 'Bulk Test Customer 3',
        entity_code: `BULK-TEST-${Date.now()}-003`,
        smart_code: salonSmartCode
      },
      dynamic: {
        phone: {
          field_type: 'text',
          field_value: '+1-555-0103',
          smart_code: 'HERA.SALON.CUSTOMER.FIELD.PHONE.v1'
        }
      }
    }
  ],
  p_options: { atomic: false }
})

if (bulkResult.error) {
  console.log('❌ RPC Error:', bulkResult.error)
} else if (bulkResult.data) {
  const result = bulkResult.data
  console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`)
  console.log(`Total: ${result.total}`)
  console.log(`Succeeded: ${result.succeeded}`)
  console.log(`Failed: ${result.failed}`)
  console.log(`Atomic Mode: ${result.atomic}`)

  if (result.succeeded > 0) {
    console.log('\n✅ Created entities:')
    result.results.forEach((r, idx) => {
      if (r.success) {
        console.log(`  ${idx + 1}. Entity ID: ${r.entity_id}`)
      } else {
        console.log(`  ${idx + 1}. Failed: ${r.result?.error || 'Unknown error'}`)
      }
    })

    // Store IDs for cleanup
    const createdIds = result.results
      .filter(r => r.success && r.entity_id)
      .map(r => r.entity_id)

    console.log(`\n📋 Created ${createdIds.length} test entities`)
    console.log('Entity IDs:', createdIds.join(', '))
    console.log('\n🧹 Cleanup: Delete these entities after testing')
  } else {
    console.log('\n❌ All entities failed:')
    result.results.forEach((r, idx) => {
      console.log(`  ${idx + 1}. Error: ${r.result?.error || 'Unknown'}`)
    })
  }
} else {
  console.log('❌ Unexpected response format')
}

console.log('\n' + '='.repeat(60))
console.log('✅ Test complete!\n')
