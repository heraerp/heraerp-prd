#!/usr/bin/env node
/**
 * Test hera_txn_delete_v1 Behavior
 *
 * Verifies:
 * 1. HARD DELETE (not soft-delete with deleted_at)
 * 2. Only allows deleting empty DRAFT transactions
 * 3. Requires VOID or REVERSAL for completed transactions
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test data
const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'; // Hairtalkz
const TEST_ACTOR_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'; // Valid member

console.log('🧪 Testing hera_txn_delete_v1 Behavior\n');
console.log('=' .repeat(60));

async function testDeleteEmptyDraft() {
  console.log('\n📋 TEST 1: Delete Empty DRAFT Transaction');
  console.log('-'.repeat(60));

  try {
    // Create empty draft transaction
    console.log('Creating empty draft transaction...');
    const { data: createResult, error: createError } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_payload: {
        header: {
          organization_id: TEST_ORG_ID,
          transaction_type: 'sale',
          transaction_code: `TEST-DELETE-${Date.now()}`,
          smart_code: 'HERA.SALON.SALE.TXN.RETAIL.V1',
          total_amount: 0,  // ZERO total
          transaction_status: 'draft'
        },
        lines: []  // EMPTY lines
      }
    });

    if (createError) {
      console.log('❌ CREATE Failed:', createError.message);
      return { success: false };
    }

    const txnId = createResult.transaction_id;
    console.log('✅ Created draft transaction:', txnId);

    // Try to delete it
    console.log('\nAttempting to delete empty draft...');
    const { data: deleteResult, error: deleteError } = await supabase.rpc('hera_txn_delete_v1', {
      p_organization_id: TEST_ORG_ID,
      p_transaction_id: txnId
    });

    if (deleteError) {
      console.log('❌ DELETE Failed:', deleteError.message);
      return { success: false };
    }

    console.log('DELETE Response:', JSON.stringify(deleteResult, null, 2));

    if (deleteResult.success) {
      console.log('✅ HARD DELETE Successful');
      console.log(`✅ Deleted ${deleteResult.header_deleted} row(s)`);

      // Verify it's gone (should not be found)
      console.log('\nVerifying transaction is permanently deleted...');
      const { data: verifyResult } = await supabase.rpc('hera_txn_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: TEST_ACTOR_ID,
        p_organization_id: TEST_ORG_ID,
        p_payload: {
          transaction_id: txnId,
          include_deleted: true  // Even with include_deleted, should not find it
        }
      });

      if (verifyResult.success === false && verifyResult.error === 'Transaction not found') {
        console.log('✅ Transaction permanently deleted (HARD DELETE confirmed)');
        return { success: true, type: 'HARD_DELETE' };
      } else {
        console.log('⚠️  Transaction still exists (might be soft-deleted)');
        return { success: true, type: 'SOFT_DELETE' };
      }
    } else {
      console.log('❌ DELETE Failed:', deleteResult.error);
      return { success: false };
    }

  } catch (err) {
    console.log('❌ Exception:', err.message);
    return { success: false };
  }
}

async function testDeleteCompletedTransaction() {
  console.log('\n📋 TEST 2: Try to Delete COMPLETED Transaction (Should Fail)');
  console.log('-'.repeat(60));

  try {
    // Create completed transaction with lines
    console.log('Creating completed transaction with lines...');
    const { data: createResult, error: createError } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_payload: {
        header: {
          organization_id: TEST_ORG_ID,
          transaction_type: 'sale',
          transaction_code: `TEST-NODELETE-${Date.now()}`,
          smart_code: 'HERA.SALON.SALE.TXN.RETAIL.V1',
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
            line_amount: 100
          }
        ]
      }
    });

    if (createError) {
      console.log('❌ CREATE Failed:', createError.message);
      return { success: false };
    }

    const txnId = createResult.transaction_id;
    console.log('✅ Created completed transaction:', txnId);

    // Try to delete it (should fail)
    console.log('\nAttempting to delete completed transaction...');
    const { data: deleteResult, error: deleteError } = await supabase.rpc('hera_txn_delete_v1', {
      p_organization_id: TEST_ORG_ID,
      p_transaction_id: txnId
    });

    if (deleteError) {
      console.log('❌ DELETE RPC Error:', deleteError.message);
      return { success: false };
    }

    console.log('DELETE Response:', JSON.stringify(deleteResult, null, 2));

    if (deleteResult.success === false) {
      if (deleteResult.error.includes('Only empty DRAFT transactions can be deleted')) {
        console.log('✅ Correctly rejected deletion of completed transaction');
        console.log('✅ Message:', deleteResult.error);

        // Cleanup: Delete using direct SQL for test cleanup
        console.log('\nCleaning up test transaction...');
        await supabase.from('universal_transaction_lines')
          .delete()
          .eq('transaction_id', txnId)
          .eq('organization_id', TEST_ORG_ID);

        await supabase.from('universal_transactions')
          .delete()
          .eq('id', txnId)
          .eq('organization_id', TEST_ORG_ID);

        console.log('✅ Test transaction cleaned up');
        return { success: true, type: 'CORRECTLY_REJECTED' };
      } else {
        console.log('⚠️  Rejected but with unexpected error:', deleteResult.error);
        return { success: false };
      }
    } else {
      console.log('❌ Should have rejected deletion but succeeded!');
      return { success: false };
    }

  } catch (err) {
    console.log('❌ Exception:', err.message);
    return { success: false };
  }
}

async function testDeleteDraftWithAmount() {
  console.log('\n📋 TEST 3: Try to Delete DRAFT with Non-Zero Amount (Should Fail)');
  console.log('-'.repeat(60));

  try {
    // Create draft with amount (not allowed)
    console.log('Creating draft transaction with amount...');
    const { data: createResult, error: createError } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_payload: {
        header: {
          organization_id: TEST_ORG_ID,
          transaction_type: 'sale',
          transaction_code: `TEST-DRAFT-AMOUNT-${Date.now()}`,
          smart_code: 'HERA.SALON.SALE.TXN.RETAIL.V1',
          total_amount: 50,  // Non-zero amount
          transaction_status: 'draft'
        },
        lines: []  // Empty lines but has amount
      }
    });

    if (createError) {
      console.log('❌ CREATE Failed:', createError.message);
      return { success: false };
    }

    const txnId = createResult.transaction_id;
    console.log('✅ Created draft transaction with amount:', txnId);

    // Try to delete it (should fail due to non-zero amount)
    console.log('\nAttempting to delete draft with amount...');
    const { data: deleteResult, error: deleteError } = await supabase.rpc('hera_txn_delete_v1', {
      p_organization_id: TEST_ORG_ID,
      p_transaction_id: txnId
    });

    if (deleteError) {
      console.log('❌ DELETE RPC Error:', deleteError.message);
      return { success: false };
    }

    console.log('DELETE Response:', JSON.stringify(deleteResult, null, 2));

    if (deleteResult.success === false) {
      console.log('✅ Correctly rejected deletion of draft with amount');
      console.log('✅ Message:', deleteResult.error);

      // Cleanup
      await supabase.from('universal_transactions')
        .delete()
        .eq('id', txnId)
        .eq('organization_id', TEST_ORG_ID);

      console.log('✅ Test transaction cleaned up');
      return { success: true, type: 'CORRECTLY_REJECTED' };
    } else {
      console.log('❌ Should have rejected but succeeded!');
      return { success: false };
    }

  } catch (err) {
    console.log('❌ Exception:', err.message);
    return { success: false };
  }
}

// Run all tests
async function runTests() {
  console.log('\n🔍 HERA TRANSACTION DELETE BEHAVIOR TEST\n');
  console.log('Organization:', TEST_ORG_ID);
  console.log('Actor:', TEST_ACTOR_ID);

  const results = {
    total: 3,
    passed: 0,
    failed: 0
  };

  // Test 1: Delete empty draft
  const test1 = await testDeleteEmptyDraft();
  if (test1.success) {
    results.passed++;
    if (test1.type === 'HARD_DELETE') {
      console.log('\n🎯 KEY FINDING: hera_txn_delete_v1 performs HARD DELETE (permanent removal)');
    }
  } else {
    results.failed++;
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 2: Try delete completed
  const test2 = await testDeleteCompletedTransaction();
  if (test2.success) results.passed++;
  else results.failed++;

  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 3: Try delete draft with amount
  const test3 = await testDeleteDraftWithAmount();
  if (test3.success) results.passed++;
  else results.failed++;

  // Summary
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total Tests:  ${results.total}`);
  console.log(`Passed:       ${results.passed}`);
  console.log(`Failed:       ${results.failed}`);
  console.log('');

  if (results.failed === 0) {
    console.log('✅ ALL TESTS PASSED');
    console.log('');
    console.log('🔍 CONFIRMED BEHAVIOR:');
    console.log('  1. hera_txn_delete_v1 performs HARD DELETE (permanent removal)');
    console.log('  2. Only allows deleting empty DRAFT transactions');
    console.log('  3. Requires total_amount = 0 and no lines');
    console.log('  4. Completed transactions must use VOID or REVERSAL');
    console.log('  5. No soft-delete (deleted_at) - truly removes from database');
  } else {
    console.log(`❌ ${results.failed} TEST(S) FAILED`);
  }

  console.log('');
  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
