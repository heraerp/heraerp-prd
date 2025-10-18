/**
 * Test Leave Data via RPC Function
 * Tests hera_entities_crud_v2 directly to see what's happening
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testLeaveRPC() {
  console.log('\n🧪 TESTING LEAVE RPC FUNCTIONS\n')

  const orgId = process.env.DEFAULT_ORGANIZATION_ID || '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  const actorUserId = '09b0b92a-d797-489e-bc03-5ca0a6272674' // From your console log

  console.log(`📍 Organization ID: ${orgId}`)
  console.log(`👤 Actor User ID: ${actorUserId}\n`)

  // Test 1: Read STAFF entities using RPC
  console.log('1️⃣  Testing hera_entities_crud_v2 for STAFF...')
  const { data: staffData, error: staffError } = await supabase.rpc('hera_entities_crud_v2', {
    p_action: 'READ',
    p_actor_user_id: actorUserId,
    p_organization_id: orgId,
    p_entity: {
      entity_type: 'STAFF'
    },
    p_dynamic: null,
    p_relationships: null,
    p_options: {
      limit: 100,
      offset: 0,
      include_dynamic: true,
      include_relationships: false
    }
  })

  if (staffError) {
    console.error('   ❌ RPC Error:', staffError.message)
    console.error('   Details:', staffError)
  } else {
    const entities = Array.isArray(staffData) ? staffData : (staffData?.data || [])
    console.log(`   ✅ RPC returned ${entities.length} STAFF entities`)
    if (entities.length > 0) {
      console.log('   Sample entity:', JSON.stringify(entities[0], null, 2))
    }
  }

  // Test 2: Read LEAVE_POLICY entities using RPC
  console.log('\n2️⃣  Testing hera_entities_crud_v2 for LEAVE_POLICY...')
  const { data: policyData, error: policyError } = await supabase.rpc('hera_entities_crud_v2', {
    p_action: 'READ',
    p_actor_user_id: actorUserId,
    p_organization_id: orgId,
    p_entity: {
      entity_type: 'LEAVE_POLICY'
    },
    p_dynamic: null,
    p_relationships: null,
    p_options: {
      limit: 100,
      offset: 0,
      include_dynamic: false,
      include_relationships: false
    }
  })

  if (policyError) {
    console.error('   ❌ RPC Error:', policyError.message)
  } else {
    const entities = Array.isArray(policyData) ? policyData : (policyData?.data || [])
    console.log(`   ✅ RPC returned ${entities.length} LEAVE_POLICY entities`)
    if (entities.length > 0) {
      console.log('   Sample entity:', JSON.stringify(entities[0], null, 2))
    }
  }

  // Test 3: Check if hera_transactions_crud_v2 exists
  console.log('\n3️⃣  Testing hera_transactions_crud_v2 for LEAVE...')
  const { data: txnData, error: txnError } = await supabase.rpc('hera_transactions_crud_v2', {
    p_action: 'READ',
    p_actor_user_id: actorUserId,
    p_organization_id: orgId,
    p_transaction: {
      transaction_type: 'LEAVE'
    },
    p_lines: null,
    p_options: {
      limit: 100,
      offset: 0
    }
  })

  if (txnError) {
    console.error('   ❌ RPC Error:', txnError.message)
    console.error('   Details:', txnError)
  } else {
    const transactions = Array.isArray(txnData) ? txnData : (txnData?.data || [])
    console.log(`   ✅ RPC returned ${transactions.length} LEAVE transactions`)
    if (transactions.length > 0) {
      console.log('   Sample transaction:', JSON.stringify(transactions[0], null, 2))
    }
  }

  console.log('\n✅ RPC test complete!\n')
}

testLeaveRPC().catch(console.error)
