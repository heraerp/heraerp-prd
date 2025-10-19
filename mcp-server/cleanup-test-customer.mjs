#!/usr/bin/env node
/**
 * Cleanup Test Customer Data
 * Removes the "Test Customer - Updated" timestamp from customer names
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Configuration
const TENANT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const ACTOR_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function cleanupTestCustomers() {
  console.log('\n' + '='.repeat(80))
  console.log('CLEANUP TEST CUSTOMER DATA')
  console.log('='.repeat(80))

  // Step 1: Find all customers with "Test Customer - Updated" in name
  console.log('\n📋 Step 1: Finding test customers...')

  const { data: customers, error: readError } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_type: 'CUSTOMER'
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {
      limit: 100,
      include_dynamic: true,
      include_relationships: false
    }
  })

  if (readError) {
    console.error('❌ Error reading customers:', readError)
    return
  }

  const testCustomers = customers?.data?.list?.filter(c =>
    c.entity_name && c.entity_name.includes('Test Customer - Updated')
  ) || []

  console.log(`Found ${testCustomers.length} test customer(s) to clean up`)

  if (testCustomers.length === 0) {
    console.log('✅ No test customers found. Database is clean!')
    return
  }

  // Step 2: Update each test customer
  console.log('\n🔧 Step 2: Cleaning up customer names...')

  for (const customer of testCustomers) {
    console.log(`\n  Processing: ${customer.entity_name}`)
    console.log(`  ID: ${customer.id}`)

    // Extract a clean name or use default
    const cleanName = customer.entity_name.split(' - Updated')[0] || 'Customer'

    const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'UPDATE',
      p_actor_user_id: ACTOR_USER_ID,
      p_organization_id: TENANT_ORG_ID,
      p_entity: {
        entity_id: customer.id,
        entity_name: cleanName
      },
      p_dynamic: {},
      p_relationships: {},
      p_options: {}
    })

    if (error) {
      console.error(`  ❌ Error updating customer ${customer.id}:`, error)
    } else {
      console.log(`  ✅ Updated to: ${cleanName}`)
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ CLEANUP COMPLETE!')
  console.log('='.repeat(80))
}

// Run the cleanup
cleanupTestCustomers().catch(error => {
  console.error('\n❌ Fatal error:')
  console.error(error)
  process.exit(1)
})
