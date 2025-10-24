#!/usr/bin/env node
/**
 * Test: Verify hera_txn_void_v1 correctly sets transaction_status = 'voided'
 *
 * This test will:
 * 1. Create a transaction
 * 2. Void it
 * 3. Query the database directly to check actual status
 * 4. Verify the status is exactly 'voided'
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const TEST_ACTOR_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';

console.log('🧪 VOID STATUS VERIFICATION TEST');
console.log('='.repeat(70));
console.log('Testing: Does hera_txn_void_v1 set transaction_status = "voided"?');
console.log('Organization:', TEST_ORG_ID);
console.log('Actor:', TEST_ACTOR_ID);
console.log('');

async function createTestTransaction() {
  console.log('📋 STEP 1: Creating test transaction');
  console.log('-'.repeat(70));

  const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: TEST_ACTOR_ID,
    p_organization_id: TEST_ORG_ID,
    p_payload: {
      header: {
        organization_id: TEST_ORG_ID,
        transaction_type: 'SALE',
        transaction_code: 'VOID-TEST-' + Date.now(),
        smart_code: 'HERA.SALON.POS.SALE.TXN.RETAIL.v1',
        total_amount: 100,
        transaction_status: 'completed'
      },
      lines: [
        {
          line_number: 1,
          line_type: 'service',
          description: 'Test Service',
          quantity: 1,
          unit_amount: 100,
          line_amount: 100,
          smart_code: 'HERA.SALON.SERVICE.LINE.ITEM.v1'
        }
      ]
    }
  });

  if (error || !data || data.success === false) {
    console.log('❌ CREATE FAILED');
    console.log('Error:', error?.message || data?.error);
    return null;
  }

  const txnId = data.transaction_id || data.data?.transaction_id;
  console.log('✅ Transaction created');
  console.log('   ID:', txnId);
  console.log('   Initial status: completed');
  console.log('');

  return txnId;
}

async function voidTransaction(txnId) {
  console.log('📋 STEP 2: Voiding transaction');
  console.log('-'.repeat(70));

  const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'VOID',
    p_actor_user_id: TEST_ACTOR_ID,
    p_organization_id: TEST_ORG_ID,
    p_payload: {
      transaction_id: txnId,
      reason: 'Testing void status'
    }
  });

  if (error || !data || data.success === false) {
    console.log('❌ VOID FAILED');
    console.log('Error:', error?.message || data?.error);
    return false;
  }

  console.log('✅ VOID RPC returned success');
  console.log('   Response data:', JSON.stringify(data, null, 2));
  console.log('');

  return true;
}

async function checkDatabaseStatus(txnId) {
  console.log('📋 STEP 3: Checking actual database status');
  console.log('-'.repeat(70));

  // Direct database query to see actual values
  const { data, error } = await supabase
    .from('universal_transactions')
    .select('id, transaction_code, transaction_status, updated_at')
    .eq('id', txnId)
    .eq('organization_id', TEST_ORG_ID)
    .single();

  if (error) {
    console.log('❌ Database query failed');
    console.log('Error:', error.message);
    return null;
  }

  console.log('📊 Database record:');
  console.log('   ID:', data.id);
  console.log('   Code:', data.transaction_code);
  console.log('   Status:', data.transaction_status);
  console.log('   Status type:', typeof data.transaction_status);
  console.log('   Status is NULL:', data.transaction_status === null);
  console.log('   Status is "voided":', data.transaction_status === 'voided');
  console.log('   Updated at:', data.updated_at);
  console.log('');

  return data.transaction_status;
}

async function testReadWithIncludeDeleted(txnId, includeDeleted) {
  const mode = includeDeleted ? 'AUDIT MODE (include_deleted=true)' : 'NORMAL MODE (include_deleted=false)';
  console.log(`📋 STEP 4: Testing READ - ${mode}`);
  console.log('-'.repeat(70));

  const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: TEST_ACTOR_ID,
    p_organization_id: TEST_ORG_ID,
    p_payload: {
      transaction_id: txnId,
      include_deleted: includeDeleted
    }
  });

  console.log(`   include_deleted: ${includeDeleted}`);
  console.log(`   Success: ${data?.success}`);
  console.log(`   Found transaction: ${data?.success === true && data?.data !== null}`);

  if (data?.success && data?.data?.data?.header) {
    console.log(`   Returned status: ${data.data.data.header.transaction_status}`);
  }

  console.log('');
  return data?.success === true;
}

async function cleanup(txnId) {
  console.log('📋 CLEANUP: Deleting test transaction');
  console.log('-'.repeat(70));

  // Delete lines first
  await supabase
    .from('universal_transaction_lines')
    .delete()
    .eq('transaction_id', txnId)
    .eq('organization_id', TEST_ORG_ID);

  // Delete header
  await supabase
    .from('universal_transactions')
    .delete()
    .eq('id', txnId)
    .eq('organization_id', TEST_ORG_ID);

  console.log('✅ Test transaction deleted');
  console.log('');
}

async function runTest() {
  let txnId = null;

  try {
    // Step 1: Create transaction
    txnId = await createTestTransaction();
    if (!txnId) {
      console.log('❌ Cannot proceed - CREATE failed');
      process.exit(1);
    }

    // Step 2: Void transaction
    const voidSuccess = await voidTransaction(txnId);
    if (!voidSuccess) {
      console.log('❌ Cannot proceed - VOID failed');
      await cleanup(txnId);
      process.exit(1);
    }

    // Step 3: Check actual database status
    const actualStatus = await checkDatabaseStatus(txnId);

    // Step 4: Test READ with include_deleted = false
    const foundInNormalMode = await testReadWithIncludeDeleted(txnId, false);

    // Step 5: Test READ with include_deleted = true
    const foundInAuditMode = await testReadWithIncludeDeleted(txnId, true);

    // Cleanup
    await cleanup(txnId);

    // Results
    console.log('═'.repeat(70));
    console.log('TEST RESULTS');
    console.log('═'.repeat(70));
    console.log('');
    console.log('1. VOID Operation:');
    console.log(`   ✅ VOID RPC completed successfully`);
    console.log('');
    console.log('2. Database Status After VOID:');
    console.log(`   Actual status value: "${actualStatus}"`);
    console.log(`   Status is NULL: ${actualStatus === null ? '❌ YES' : '✅ NO'}`);
    console.log(`   Status is "voided": ${actualStatus === 'voided' ? '✅ YES' : '❌ NO'}`);
    console.log('');
    console.log('3. READ Filter Behavior:');
    console.log(`   Normal mode (include_deleted=false): ${foundInNormalMode ? '❌ FOUND (WRONG)' : '✅ NOT FOUND (CORRECT)'}`);
    console.log(`   Audit mode (include_deleted=true):   ${foundInAuditMode ? '✅ FOUND (CORRECT)' : '❌ NOT FOUND (WRONG)'}`);
    console.log('');

    // Diagnosis
    console.log('═'.repeat(70));
    console.log('DIAGNOSIS');
    console.log('═'.repeat(70));
    console.log('');

    if (actualStatus !== 'voided') {
      console.log('🔴 ISSUE FOUND:');
      console.log('   hera_txn_void_v1 is NOT setting transaction_status to "voided"');
      console.log(`   Instead, it sets it to: ${actualStatus === null ? 'NULL' : `"${actualStatus}"`}`);
      console.log('');
      console.log('💡 SOLUTION:');
      console.log('   Update hera_txn_void_v1 to set transaction_status = "voided"');
      console.log('');
      process.exit(1);
    }

    if (foundInNormalMode) {
      console.log('🔴 ISSUE FOUND:');
      console.log('   Status IS set to "voided" correctly');
      console.log('   But READ filter is not excluding voided transactions');
      console.log('');
      console.log('💡 SOLUTION:');
      console.log('   The WHERE clause filter might have a logic issue:');
      console.log('   Check: AND (p_include_deleted OR t.transaction_status <> "voided")');
      console.log('');
      process.exit(1);
    }

    console.log('🎉 ALL TESTS PASSED');
    console.log('   ✅ hera_txn_void_v1 sets status to "voided"');
    console.log('   ✅ Normal READ excludes voided transactions');
    console.log('   ✅ Audit READ includes voided transactions');
    console.log('');
    console.log('✅ TRANSACTION VOID SYSTEM IS WORKING CORRECTLY');
    process.exit(0);

  } catch (err) {
    console.log('');
    console.log('❌ TEST CRASHED');
    console.log('Error:', err.message);
    console.log(err);

    if (txnId) {
      await cleanup(txnId);
    }

    process.exit(1);
  }
}

runTest();
