#!/usr/bin/env node
/**
 * Test: Call hera_txn_void_v1 with CORRECT parameter names
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const TEST_ACTOR_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';

console.log('🧪 VOID WITH CORRECT PARAMETERS TEST');
console.log('='.repeat(70));

async function runTest() {
  // Create transaction
  console.log('STEP 1: Creating transaction...');
  const createResp = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: TEST_ACTOR_ID,
    p_organization_id: TEST_ORG_ID,
    p_payload: {
      header: {
        organization_id: TEST_ORG_ID,
        transaction_type: 'SALE',
        transaction_code: 'PARAM-TEST-' + Date.now(),
        smart_code: 'HERA.SALON.POS.SALE.TXN.RETAIL.v1',
        total_amount: 75,
        transaction_status: 'completed'
      },
      lines: []
    }
  });

  const txnId = createResp.data.transaction_id;
  console.log('✅ Created:', txnId);

  // Check status before void
  console.log('\nSTEP 2: Checking status BEFORE void...');
  const beforeVoid = await supabase
    .from('universal_transactions')
    .select('transaction_status')
    .eq('id', txnId)
    .single();
  console.log('   Status:', beforeVoid.data.transaction_status);

  // VOID with CORRECT parameter names
  console.log('\nSTEP 3: Calling hera_txn_void_v1 with CORRECT parameters...');
  console.log('   Parameters:');
  console.log('   - p_organization_id (not p_org_id)');
  console.log('   - p_transaction_id (not p_txn_id)');
  console.log('   - p_reason');
  console.log('   - p_actor_user_id');

  const voidResp = await supabase.rpc('hera_txn_void_v1', {
    p_organization_id: TEST_ORG_ID,    // ✅ CORRECT
    p_transaction_id: txnId,           // ✅ CORRECT
    p_reason: 'Testing with correct params',
    p_actor_user_id: TEST_ACTOR_ID
  });

  console.log('   Void response:', JSON.stringify(voidResp.data, null, 2));

  // Check status after void
  console.log('\nSTEP 4: Checking status AFTER void...');
  const afterVoid = await supabase
    .from('universal_transactions')
    .select('transaction_status, metadata')
    .eq('id', txnId)
    .single();
  console.log('   Status:', afterVoid.data.transaction_status);
  console.log('   Voided at:', afterVoid.data.metadata?.voided_at);
  console.log('   Void reason:', afterVoid.data.metadata?.void_reason);

  // Test READ filter
  console.log('\nSTEP 5: Testing READ with include_deleted=false...');
  const readNormal = await supabase.rpc('hera_txn_read_v1', {
    p_org_id: TEST_ORG_ID,
    p_transaction_id: txnId,
    p_include_lines: true,
    p_include_deleted: false
  });

  console.log('   Found:', readNormal.data?.success ? 'YES' : 'NO');
  console.log('   Error:', readNormal.data?.error || 'none');

  // Test READ with include_deleted=true
  console.log('\nSTEP 6: Testing READ with include_deleted=true...');
  const readAudit = await supabase.rpc('hera_txn_read_v1', {
    p_org_id: TEST_ORG_ID,
    p_transaction_id: txnId,
    p_include_lines: true,
    p_include_deleted: true
  });

  console.log('   Found:', readAudit.data?.success ? 'YES' : 'NO');
  console.log('   Status:', readAudit.data?.data?.header?.transaction_status);

  // Cleanup
  await supabase.from('universal_transactions').delete().eq('id', txnId);

  // Results
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('RESULTS');
  console.log('═'.repeat(70));
  console.log('');
  console.log(`Status before void: ${beforeVoid.data.transaction_status}`);
  console.log(`Status after void:  ${afterVoid.data.transaction_status}`);
  console.log('');
  console.log(`Void successful: ${afterVoid.data.transaction_status === 'voided' ? '✅ YES' : '❌ NO'}`);
  console.log(`Normal READ excludes: ${!readNormal.data?.success ? '✅ YES' : '❌ NO'}`);
  console.log(`Audit READ includes: ${readAudit.data?.success ? '✅ YES' : '❌ NO'}`);
  console.log('');

  if (afterVoid.data.transaction_status === 'voided' && !readNormal.data?.success && readAudit.data?.success) {
    console.log('🎉 ALL WORKING CORRECTLY!');
    console.log('   The issue was parameter naming in the test');
  } else {
    console.log('🔴 Still have issues:');
    if (afterVoid.data.transaction_status !== 'voided') {
      console.log('   ❌ Void not setting status correctly');
    }
    if (readNormal.data?.success) {
      console.log('   ❌ Normal READ not excluding voided');
    }
    if (!readAudit.data?.success) {
      console.log('   ❌ Audit READ not including voided');
    }
  }
}

runTest().catch(console.error);
