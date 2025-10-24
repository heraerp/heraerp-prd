#!/usr/bin/env node
/**
 * Trace exactly what the orchestrator VOID does
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const TEST_ACTOR_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';

console.log('🔍 ORCHESTRATOR VOID TRACE');
console.log('='.repeat(70));

async function runTrace() {
  // Create transaction
  console.log('\n1️⃣ CREATE transaction via orchestrator');
  const createResp = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: TEST_ACTOR_ID,
    p_organization_id: TEST_ORG_ID,
    p_payload: {
      header: {
        organization_id: TEST_ORG_ID,
        transaction_type: 'SALE',
        transaction_code: 'TRACE-' + Date.now(),
        smart_code: 'HERA.SALON.POS.SALE.TXN.RETAIL.v1',
        total_amount: 99,
        transaction_status: 'completed'
      },
      lines: []
    }
  });

  const txnId = createResp.data.transaction_id;
  console.log('   ✅ Created:', txnId);

  // VOID via orchestrator (without include_deleted)
  console.log('\n2️⃣ VOID via orchestrator (NO include_deleted in payload)');
  console.log('   This means v_include_deleted = false (default)');
  const voidResp = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'VOID',
    p_actor_user_id: TEST_ACTOR_ID,
    p_organization_id: TEST_ORG_ID,
    p_payload: {
      transaction_id: txnId,
      reason: 'Trace test'
      // NOTE: include_deleted NOT provided, defaults to false
    }
  });

  console.log('   Void response success:', voidResp.data?.success);
  console.log('   Void response data:', JSON.stringify(voidResp.data?.data, null, 2));
  console.log('');
  console.log('   📌 Note: After VOID, orchestrator tries to re-read with:');
  console.log('      hera_txn_read_v1(org, txn_id, true, v_include_deleted=false)');
  console.log('      This should return "Transaction not found" because it\'s voided');

  // Check actual DB status
  console.log('\n3️⃣ Check actual database status');
  const dbCheck = await supabase
    .from('universal_transactions')
    .select('transaction_status')
    .eq('id', txnId)
    .single();
  console.log('   Actual status in DB:', dbCheck.data.transaction_status);

  // READ via orchestrator with include_deleted=false (explicit)
  console.log('\n4️⃣ READ via orchestrator with include_deleted=false (explicit)');
  const readNormal = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: TEST_ACTOR_ID,
    p_organization_id: TEST_ORG_ID,
    p_payload: {
      transaction_id: txnId,
      include_deleted: false  // ← Explicitly false
    }
  });

  console.log('   Success:', readNormal.data?.success);
  console.log('   Found:', readNormal.data?.data?.data?.header ? 'YES ❌ (WRONG!)' : 'NO ✅ (CORRECT)');
  console.log('   Error:', readNormal.data?.data?.error || 'none');

  // READ via orchestrator with include_deleted=true
  console.log('\n5️⃣ READ via orchestrator with include_deleted=true');
  const readAudit = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: TEST_ACTOR_ID,
    p_organization_id: TEST_ORG_ID,
    p_payload: {
      transaction_id: txnId,
      include_deleted: true  // ← Explicitly true
    }
  });

  console.log('   Success:', readAudit.data?.success);
  console.log('   Found:', readAudit.data?.data?.data?.header ? 'YES ✅ (CORRECT)' : 'NO ❌ (WRONG!)');
  console.log('   Status:', readAudit.data?.data?.data?.header?.transaction_status);

  // Cleanup
  await supabase.from('universal_transactions').delete().eq('id', txnId);

  // Summary
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('DIAGNOSIS');
  console.log('═'.repeat(70));
  console.log('');
  console.log('Database status after VOID:', dbCheck.data.transaction_status);
  console.log('');
  console.log('Orchestrator READ results:');
  console.log(`  include_deleted=false: ${readNormal.data?.data?.data?.header ? '❌ FOUND (BUG!)' : '✅ NOT FOUND'}`);
  console.log(`  include_deleted=true:  ${readAudit.data?.data?.data?.header ? '✅ FOUND' : '❌ NOT FOUND (BUG!)'}`);
  console.log('');

  if (dbCheck.data.transaction_status === 'voided' && readNormal.data?.data?.data?.header) {
    console.log('🔴 CONFIRMED BUG:');
    console.log('   1. VOID correctly sets status to "voided" ✅');
    console.log('   2. But orchestrator READ with include_deleted=false still finds it ❌');
    console.log('');
    console.log('   This means the issue is in how hera_txn_read_v1 is called');
    console.log('   by the orchestrator, or in the WHERE clause itself.');
  }
}

runTrace().catch(console.error);
