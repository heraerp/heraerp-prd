/**
 * Test: hera_entities_crud_v2 Universal Transaction Table Access
 *
 * Purpose: Verify if the RPC function can access universal_transactions table
 *
 * Tests:
 * 1. Can the RPC read entities that are linked to transactions?
 * 2. Can the RPC create entities and also create/link transactions?
 * 3. Can the RPC update entities that have transaction relationships?
 * 4. Does the RPC return transaction data when requested?
 *
 * Issue: Need to verify if entities_crud_v2 can access transaction tables
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'
const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function testTransactionAccess() {
  console.log('🔍 Testing hera_entities_crud_v2 Transaction Table Access\n')
  console.log('Test Parameters:')
  console.log(`  User ID: ${TEST_USER_ID}`)
  console.log(`  Org ID: ${TEST_ORG_ID}\n`)

  // Test 1: Create a transaction directly in DB
  console.log('📝 Test 1: Create Test Transaction Directly')
  console.log('=' .repeat(60))

  const { data: transaction, error: txnError } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: TEST_ORG_ID,
      transaction_type: 'SALE',
      transaction_code: `TEST-TXN-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      smart_code: 'HERA.TEST.SALE.TRANSACTION.V1',
      transaction_status: 'draft',
      total_amount: 1000.00,
      created_by: TEST_USER_ID,
      updated_by: TEST_USER_ID
    })
    .select()
    .single()

  if (txnError) {
    console.error('❌ Transaction Creation Error:', txnError)
    return
  }

  console.log('✅ Transaction Created:', transaction.id)
  console.log(`   Code: ${transaction.transaction_code}`)
  console.log(`   Type: ${transaction.transaction_type}`)
  console.log(`   Status: ${transaction.transaction_status}`)

  const testTransactionId = transaction.id

  // Test 2: Create an entity (customer) using the RPC
  console.log('\n📝 Test 2: Create Entity Using RPC')
  console.log('=' .repeat(60))

  const createEntityPayload = {
    p_action: 'create',
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_entity: {
      entity_type: 'customer',
      entity_name: 'Test Customer for Transaction',
      smart_code: 'HERA.TEST.CUSTOMER.ENTITY.V1'
    },
    p_dynamic: [],
    p_relationships: [],
    p_options: {}
  }

  const { data: entityResult, error: entityError } = await supabase.rpc(
    'hera_entities_crud_v2',
    createEntityPayload
  )

  if (entityError) {
    console.error('❌ Entity Creation Error:', entityError)
    await supabase.from('universal_transactions').delete().eq('id', testTransactionId)
    return
  }

  if (!entityResult?.items || entityResult.items.length === 0) {
    console.error('❌ Failed to create entity')
    await supabase.from('universal_transactions').delete().eq('id', testTransactionId)
    return
  }

  const testEntityId = entityResult.items[0].id
  console.log('✅ Entity Created:', testEntityId)

  // Test 3: Link entity to transaction via relationship
  console.log('\n🔗 Test 3: Link Entity to Transaction')
  console.log('=' .repeat(60))

  const { data: relationship, error: relError } = await supabase
    .from('core_relationships')
    .insert({
      from_entity_id: testEntityId,
      to_entity_id: testTransactionId,
      relationship_type: 'ENTITY_HAS_TRANSACTION',
      organization_id: TEST_ORG_ID,
      created_by: TEST_USER_ID,
      updated_by: TEST_USER_ID
    })
    .select()
    .single()

  if (relError) {
    console.error('❌ Relationship Creation Error:', relError)
    console.log('   Note: This might fail if transaction_id is not a valid entity')
  } else {
    console.log('✅ Relationship Created:', relationship?.id)
  }

  // Test 4: Try to read entity with transaction data
  console.log('\n📖 Test 4: Read Entity (checking for transaction access)')
  console.log('=' .repeat(60))

  const readPayload = {
    p_action: 'read',
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_entity: null,
    p_dynamic: null,
    p_relationships: null,
    p_options: {
      where: { id: testEntityId },
      include_relationships: true,
      include_transactions: true // Try to request transaction data
    }
  }

  console.log('Request:', JSON.stringify(readPayload, null, 2))

  const { data: readResult, error: readError } = await supabase.rpc(
    'hera_entities_crud_v2',
    readPayload
  )

  if (readError) {
    console.error('❌ Read Error:', readError)
  } else {
    console.log('✅ Read Result:')
    console.log(JSON.stringify(readResult, null, 2))

    if (readResult?.items?.[0]) {
      const entity = readResult.items[0]
      console.log('\n🔍 Entity Data Analysis:')
      console.log(`   Has 'relationships' field: ${entity.relationships ? 'YES' : 'NO'}`)
      console.log(`   Has 'transactions' field: ${entity.transactions ? 'YES' : 'NO'}`)
      console.log(`   Has 'dynamic' field: ${entity.dynamic ? 'YES' : 'NO'}`)
      console.log(`   Available fields: ${Object.keys(entity).join(', ')}`)
    }
  }

  // Test 5: Try to create entity WITH transaction in single RPC call
  console.log('\n📝 Test 5: Create Entity WITH Transaction Data in Single Call')
  console.log('=' .repeat(60))

  const createWithTxnPayload = {
    p_action: 'create',
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_entity: {
      entity_type: 'customer',
      entity_name: 'Customer With Immediate Transaction',
      smart_code: 'HERA.TEST.CUSTOMER.WITH.TXN.V1'
    },
    p_dynamic: [
      { field_name: 'email', field_type: 'text', field_value_text: 'test@example.com' }
    ],
    p_relationships: [],
    p_options: {
      create_transaction: {
        transaction_type: 'SALE',
        transaction_code: `TEST-TXN-RPC-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        transaction_status: 'draft',
        total_amount: 500.00
      }
    }
  }

  console.log('Request:', JSON.stringify(createWithTxnPayload, null, 2))

  const { data: createWithTxnResult, error: createWithTxnError } = await supabase.rpc(
    'hera_entities_crud_v2',
    createWithTxnPayload
  )

  if (createWithTxnError) {
    console.error('❌ Create With Transaction Error:', createWithTxnError)
    console.log('   Note: This may not be supported by the RPC function')
  } else {
    console.log('✅ Create With Transaction Result:')
    console.log(JSON.stringify(createWithTxnResult, null, 2))
  }

  // Test 6: Direct query to check transaction table access
  console.log('\n🔍 Test 6: Direct Transaction Table Query')
  console.log('=' .repeat(60))

  const { data: directTxns, error: directTxnError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', TEST_ORG_ID)
    .limit(5)

  if (directTxnError) {
    console.error('❌ Direct Transaction Query Error:', directTxnError)
  } else {
    console.log(`✅ Found ${directTxns.length} transaction(s) in database`)
    console.log('Transaction IDs:', directTxns.map(t => t.id).join(', '))
  }

  // Test 7: Check if we can query universal_transaction_lines
  console.log('\n🔍 Test 7: Check Universal Transaction Lines Access')
  console.log('=' .repeat(60))

  const { data: lines, error: linesError } = await supabase
    .from('universal_transaction_lines')
    .select('*')
    .eq('organization_id', TEST_ORG_ID)
    .limit(5)

  if (linesError) {
    console.error('❌ Transaction Lines Query Error:', linesError)
  } else {
    console.log(`✅ Found ${lines.length} transaction line(s) in database`)
  }

  // Test 8: Try to update entity and check if it affects transaction
  console.log('\n📝 Test 8: Update Entity (check transaction impact)')
  console.log('=' .repeat(60))

  const updatePayload = {
    p_action: 'update',
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_entity: {
      id: testEntityId,
      entity_name: 'Updated Customer Name'
    },
    p_dynamic: [
      { field_name: 'status', field_type: 'text', field_value_text: 'active' }
    ],
    p_relationships: null,
    p_options: {
      where: { id: testEntityId }
    }
  }

  console.log('Request:', JSON.stringify(updatePayload, null, 2))

  const { data: updateResult, error: updateError } = await supabase.rpc(
    'hera_entities_crud_v2',
    updatePayload
  )

  if (updateError) {
    console.error('❌ Update Error:', updateError)
  } else {
    console.log('✅ Update Result:')
    console.log(JSON.stringify(updateResult, null, 2))
  }

  // Summary
  console.log('\n' + '=' .repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('=' .repeat(60))
  console.log(`✅ Transaction Created: ${testTransactionId}`)
  console.log(`✅ Entity Created: ${testEntityId}`)
  console.log(`✅ Relationship Created: ${relationship?.id || 'N/A'}`)
  console.log(`✅ Direct Transaction Query: ${directTxnError ? 'FAILED' : 'SUCCESS'}`)
  console.log(`✅ Direct Transaction Lines Query: ${linesError ? 'FAILED' : 'SUCCESS'}`)

  console.log('\n🔍 RPC FUNCTION CAPABILITIES:')
  console.log(`   Can create entities: ${entityError ? 'NO' : 'YES'}`)
  console.log(`   Can update entities: ${updateError ? 'NO' : 'YES'}`)
  console.log(`   Can read entities: ${readError ? 'NO' : 'YES'}`)
  console.log(`   Returns transaction data: ${readResult?.items?.[0]?.transactions ? 'YES' : 'NO'}`)
  console.log(`   Can create entity+transaction: ${createWithTxnError ? 'NO/UNKNOWN' : 'YES'}`)

  console.log('\n🎯 TRANSACTION ACCESS FINDINGS:')
  if (directTxnError) {
    console.log('❌ Cannot access universal_transactions table directly')
  } else {
    console.log('✅ Can access universal_transactions table directly')
  }

  if (linesError) {
    console.log('❌ Cannot access universal_transaction_lines table')
  } else {
    console.log('✅ Can access universal_transaction_lines table')
  }

  if (readError?.message?.includes('READ_SELECTOR_REQUIRED')) {
    console.log('⚠️  READ operation requires different selector format')
  }

  // Cleanup
  console.log('\n🧹 Cleaning up test data...')
  await supabase.from('core_relationships').delete().eq('from_entity_id', testEntityId)
  await supabase.from('core_entities').delete().eq('id', testEntityId)
  await supabase.from('universal_transactions').delete().eq('id', testTransactionId)
  if (createWithTxnResult?.items?.[0]?.id) {
    await supabase.from('core_entities').delete().eq('id', createWithTxnResult.items[0].id)
  }
  console.log('✅ Cleanup complete')
}

// Run the test
testTransactionAccess().catch(console.error)
