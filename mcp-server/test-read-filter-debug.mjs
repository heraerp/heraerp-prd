#!/usr/bin/env node
/**
 * Debug: Test the exact WHERE clause logic
 * Direct test of hera_txn_read_v1 with different parameters
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const TEST_ACTOR_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';

console.log('🔍 READ FILTER DEBUG TEST');
console.log('='.repeat(70));

async function testReadDirectly(txnId, includeDeleted) {
  console.log(`\n📋 Calling hera_txn_read_v1 directly`);
  console.log(`   transaction_id: ${txnId}`);
  console.log(`   include_deleted: ${includeDeleted}`);
  console.log('-'.repeat(70));

  // Call hera_txn_read_v1 directly (not through orchestrator)
  const { data, error } = await supabase.rpc('hera_txn_read_v1', {
    p_org_id: TEST_ORG_ID,
    p_transaction_id: txnId,
    p_include_lines: true,
    p_include_deleted: includeDeleted
  });

  console.log('   RPC error:', error?.message || 'none');
  console.log('   Response success:', data?.success);
  console.log('   Response error:', data?.error || 'none');
  console.log('   Found transaction:', data?.data?.header ? 'YES' : 'NO');

  if (data?.data?.header) {
    console.log('   Transaction status:', data.data.header.transaction_status);
  }

  return data;
}

async function runDebugTest() {
  // First create and void a transaction
  console.log('STEP 1: Creating transaction...');
  const createResp = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: TEST_ACTOR_ID,
    p_organization_id: TEST_ORG_ID,
    p_payload: {
      header: {
        organization_id: TEST_ORG_ID,
        transaction_type: 'SALE',
        transaction_code: 'DEBUG-' + Date.now(),
        smart_code: 'HERA.SALON.POS.SALE.TXN.RETAIL.v1',
        total_amount: 50,
        transaction_status: 'completed'
      },
      lines: []
    }
  });

  const txnId = createResp.data.transaction_id;
  console.log('✅ Created:', txnId);

  console.log('\nSTEP 2: Voiding transaction...');
  await supabase.rpc('hera_txn_void_v1', {
    p_org_id: TEST_ORG_ID,
    p_txn_id: txnId,
    p_reason: 'Debug test',
    p_actor_user_id: TEST_ACTOR_ID
  });
  console.log('✅ Voided');

  // Test 1: Direct call with include_deleted = false
  const test1 = await testReadDirectly(txnId, false);

  // Test 2: Direct call with include_deleted = true
  const test2 = await testReadDirectly(txnId, true);

  // Test 3: Through orchestrator with include_deleted = false
  console.log(`\n📋 Calling through orchestrator (include_deleted=false)`);
  console.log('-'.repeat(70));
  const test3 = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: TEST_ACTOR_ID,
    p_organization_id: TEST_ORG_ID,
    p_payload: {
      transaction_id: txnId,
      include_deleted: false
    }
  });
  console.log('   Success:', test3.data?.success);
  console.log('   Found:', test3.data?.data?.data?.header ? 'YES' : 'NO');

  // Test 4: Through orchestrator with include_deleted = true
  console.log(`\n📋 Calling through orchestrator (include_deleted=true)`);
  console.log('-'.repeat(70));
  const test4 = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: TEST_ACTOR_ID,
    p_organization_id: TEST_ORG_ID,
    p_payload: {
      transaction_id: txnId,
      include_deleted: true
    }
  });
  console.log('   Success:', test4.data?.success);
  console.log('   Found:', test4.data?.data?.data?.header ? 'YES' : 'NO');

  // Cleanup
  await supabase.from('universal_transactions').delete().eq('id', txnId);

  // Summary
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('SUMMARY');
  console.log('═'.repeat(70));
  console.log('');
  console.log('Direct hera_txn_read_v1 calls:');
  console.log(`  include_deleted=false: ${test1?.data?.header ? '❌ FOUND' : '✅ NOT FOUND'}`);
  console.log(`  include_deleted=true:  ${test2?.data?.header ? '✅ FOUND' : '❌ NOT FOUND'}`);
  console.log('');
  console.log('Through orchestrator:');
  console.log(`  include_deleted=false: ${test3.data?.data?.data?.header ? '❌ FOUND' : '✅ NOT FOUND'}`);
  console.log(`  include_deleted=true:  ${test4.data?.data?.data?.header ? '✅ FOUND' : '❌ NOT FOUND'}`);
  console.log('');

  if (test1?.data?.header) {
    console.log('🔴 CONFIRMED: hera_txn_read_v1 filter is NOT working');
    console.log('   The WHERE clause is not excluding voided transactions');
  } else {
    console.log('✅ hera_txn_read_v1 filter works when called directly');
    console.log('   Issue might be in orchestrator parameter passing');
  }
}

runDebugTest().catch(console.error);
