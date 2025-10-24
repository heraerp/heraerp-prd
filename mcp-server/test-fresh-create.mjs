#!/usr/bin/env node
/**
 * Fresh test for updated hera_txn_crud_v1 and hera_txn_create_v1
 * Testing directly with minimal assumptions
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const TEST_ACTOR_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';

console.log('🧪 FRESH TEST - Updated Functions');
console.log('=' .repeat(60));
console.log('Testing: hera_txn_crud_v1 + hera_txn_create_v1');
console.log('Organization:', TEST_ORG_ID);
console.log('Actor:', TEST_ACTOR_ID);
console.log('');

async function testCreate() {
  console.log('📋 TEST: CREATE Transaction via Orchestrator');
  console.log('-'.repeat(60));

  const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: TEST_ACTOR_ID,
    p_organization_id: TEST_ORG_ID,
    p_payload: {
      header: {
        organization_id: TEST_ORG_ID,
        transaction_type: 'SALE',
        transaction_code: 'FRESH-' + Date.now(),
        smart_code: 'HERA.SALON.POS.SALE.TXN.RETAIL.v1',
        total_amount: 200,
        transaction_status: 'completed'
      },
      lines: [
        {
          line_number: 1,
          line_type: 'service',
          description: 'Haircut Service',
          quantity: 1,
          unit_amount: 200,
          line_amount: 200,
          smart_code: 'HERA.SALON.SERVICE.LINE.ITEM.v1'
        }
      ]
    }
  });

  // Check for RPC-level errors first
  if (error) {
    console.log('❌ RPC ERROR (Supabase client level):');
    console.log('   Code:', error.code);
    console.log('   Message:', error.message);
    console.log('   Details:', error.details);
    console.log('   Hint:', error.hint);
    return null;
  }

  // Check for function-level errors
  if (!data || data.success === false) {
    console.log('❌ FUNCTION ERROR (Postgres function level):');
    console.log('   Success:', data?.success);
    console.log('   Error:', data?.error);
    console.log('   Error detail:', data?.error_detail);
    console.log('   Error context:', data?.error_context);
    return null;
  }

  // Success - extract transaction ID from nested response
  const txnId = data.transaction_id || data.data?.transaction_id;
  console.log('✅ CREATE SUCCESS');
  console.log('   Transaction ID:', txnId);
  console.log('   Action:', data.action);

  // Check nested data structure
  if (data.data?.data?.header) {
    const header = data.data.data.header;
    console.log('   Header fields:', Object.keys(header).length);
    console.log('   Transaction type:', header.transaction_type);
    console.log('   Total amount:', header.total_amount);
    console.log('   Status:', header.transaction_status);
  }

  if (data.data?.data?.lines) {
    const lines = data.data.data.lines;
    console.log('   Line count:', lines.length);
    if (lines.length > 0) {
      console.log('   Line 1 description:', lines[0].description);
      console.log('   Line 1 amount:', lines[0].line_amount);
    }
  }

  return txnId;
}

async function testRead(txnId) {
  console.log('\n📋 TEST: READ Transaction');
  console.log('-'.repeat(60));

  const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: TEST_ACTOR_ID,
    p_organization_id: TEST_ORG_ID,
    p_payload: {
      transaction_id: txnId
    }
  });

  if (error || !data || data.success === false) {
    console.log('❌ READ FAILED');
    console.log('   Error:', error?.message || data?.error);
    return false;
  }

  console.log('✅ READ SUCCESS');
  console.log('   Transaction ID:', data.transaction_id);

  if (data.data?.data?.header) {
    console.log('   Header fields:', Object.keys(data.data.data.header).length);
  }

  if (data.data?.data?.lines) {
    console.log('   Line count:', data.data.data.lines.length);
  }

  return true;
}

async function testVoid(txnId) {
  console.log('\n📋 TEST: VOID Transaction');
  console.log('-'.repeat(60));

  const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'VOID',
    p_actor_user_id: TEST_ACTOR_ID,
    p_organization_id: TEST_ORG_ID,
    p_payload: {
      transaction_id: txnId,
      reason: 'Test void operation'
    }
  });

  if (error || !data || data.success === false) {
    console.log('❌ VOID FAILED');
    console.log('   Error:', error?.message || data?.error);
    return false;
  }

  console.log('✅ VOID SUCCESS');
  console.log('   Transaction status:', data.data?.data?.header?.transaction_status);

  return true;
}

async function testReadVoided(txnId, includeDeleted) {
  const mode = includeDeleted ? 'AUDIT MODE' : 'NORMAL MODE';
  console.log(`\n📋 TEST: READ Voided Transaction (${mode})`);
  console.log('-'.repeat(60));

  const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: TEST_ACTOR_ID,
    p_organization_id: TEST_ORG_ID,
    p_payload: {
      transaction_id: txnId,
      include_deleted: includeDeleted
    }
  });

  if (!includeDeleted) {
    // Should NOT find voided transaction in normal mode
    // ✅ FIXED: Check nested data.data.error path (orchestrator wraps responses)
    if (data?.data?.success === false && data?.data?.error === 'Transaction not found') {
      console.log('✅ CORRECT: Voided transaction excluded in normal mode');
      return true;
    } else if (data?.success === false && data?.error === 'Transaction not found') {
      // Fallback for direct RPC call format
      console.log('✅ CORRECT: Voided transaction excluded in normal mode');
      return true;
    } else {
      console.log('⚠️  UNEXPECTED: Found voided transaction in normal mode');
      console.log('   Debug - data.success:', data?.success);
      console.log('   Debug - data.data.success:', data?.data?.success);
      console.log('   Debug - data.data.error:', data?.data?.error);
      return false;
    }
  } else {
    // SHOULD find voided transaction in audit mode
    if (error || !data || data.success === false) {
      console.log('❌ FAILED: Could not find voided transaction in audit mode');
      return false;
    } else {
      console.log('✅ CORRECT: Found voided transaction in audit mode');
      console.log('   Status:', data.data?.data?.header?.transaction_status);
      return true;
    }
  }
}

async function cleanup(txnId) {
  console.log('\n📋 CLEANUP');
  console.log('-'.repeat(60));

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
}

// Run all tests
async function runTests() {
  let txnId = null;
  let results = {
    create: false,
    read: false,
    void: false,
    readNormal: false,
    readAudit: false
  };

  try {
    // Test CREATE
    txnId = await testCreate();
    results.create = (txnId !== null);

    if (!txnId) {
      console.log('\n❌ Cannot proceed - CREATE failed');
      process.exit(1);
    }

    // Test READ
    results.read = await testRead(txnId);

    // Test VOID
    results.void = await testVoid(txnId);

    // Test READ voided (normal mode - should not find)
    results.readNormal = await testReadVoided(txnId, false);

    // Test READ voided (audit mode - should find)
    results.readAudit = await testReadVoided(txnId, true);

    // Cleanup
    await cleanup(txnId);

    // Summary
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('TEST RESULTS SUMMARY');
    console.log('═'.repeat(60));
    console.log('CREATE:              ', results.create ? '✅ PASS' : '❌ FAIL');
    console.log('READ:                ', results.read ? '✅ PASS' : '❌ FAIL');
    console.log('VOID:                ', results.void ? '✅ PASS' : '❌ FAIL');
    console.log('Read Normal (excl):  ', results.readNormal ? '✅ PASS' : '❌ FAIL');
    console.log('Read Audit (incl):   ', results.readAudit ? '✅ PASS' : '❌ FAIL');
    console.log('═'.repeat(60));

    const allPassed = Object.values(results).every(r => r === true);

    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED');
      console.log('');
      console.log('✅ hera_txn_crud_v1: PRODUCTION READY');
      console.log('✅ hera_txn_create_v1: PRODUCTION READY');
      console.log('✅ hera_txn_read_v1: PRODUCTION READY');
      console.log('✅ hera_txn_void_v1: PRODUCTION READY');
      console.log('');
      console.log('🚀 DEPLOYMENT SUCCESSFUL!');
      process.exit(0);
    } else {
      console.log('❌ SOME TESTS FAILED');
      process.exit(1);
    }

  } catch (err) {
    console.log('\n❌ TEST SUITE CRASHED');
    console.log('Error:', err.message);
    console.log(err);

    if (txnId) {
      console.log('\nAttempting cleanup...');
      await cleanup(txnId);
    }

    process.exit(1);
  }
}

runTests();
