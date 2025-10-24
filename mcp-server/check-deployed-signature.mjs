#!/usr/bin/env node
/**
 * Check what's actually deployed in Supabase
 * by examining function signatures and testing with different payloads
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Checking Deployed Function Signatures\n');
console.log('=' .repeat(60));

// Test 1: Try calling hera_txn_create_v1 with minimal valid payload (no debit_amount)
console.log('\n📋 TEST 1: Call hera_txn_create_v1 with NO debit_amount');
console.log('-'.repeat(60));

const test1 = await supabase.rpc('hera_txn_create_v1', {
  p_header: {
    organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    transaction_type: 'SALE',
    smart_code: 'HERA.SALON.SALE.TXN.RETAIL.V1',
    transaction_code: 'CHECK-' + Date.now(),
    total_amount: 0
  },
  p_lines: [],
  p_actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674'
});

if (test1.error) {
  console.log('❌ Error:', test1.error.message);
  console.log('   Hint:', test1.error.hint);

  if (test1.error.message.includes('debit_amount')) {
    console.log('\n🔴 CONFIRMED: Old function is deployed (has debit_amount)');
  } else if (test1.error.message.includes('smart_code')) {
    console.log('\n🟢 POSSIBLE: New function deployed (different error)');
  }
} else if (test1.data?.success) {
  console.log('✅ Success! Transaction ID:', test1.data.transaction_id);
  console.log('\n🟢 CONFIRMED: New function is deployed (no debit_amount error)');

  // Cleanup
  if (test1.data.transaction_id) {
    await supabase.from('universal_transactions')
      .delete()
      .eq('id', test1.data.transaction_id);
  }
}

// Test 2: Check if trying to pass debit_amount causes error
console.log('\n📋 TEST 2: Try passing debit_amount (old signature)');
console.log('-'.repeat(60));

const test2 = await supabase.rpc('hera_txn_create_v1', {
  p_header: {
    organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    transaction_type: 'SALE',
    smart_code: 'HERA.SALON.SALE.TXN.RETAIL.V1',
    total_amount: 0
  },
  p_lines: [{
    line_number: 1,
    debit_amount: 100  // Old field
  }],
  p_actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674'
});

if (test2.error) {
  console.log('Error:', test2.error.message);
} else {
  console.log('Result:', test2.data?.success ? 'Success' : 'Failed');
}

// Test 3: Check orchestrator version
console.log('\n📋 TEST 3: Check hera_txn_crud_v1 error messages');
console.log('-'.repeat(60));

const test3 = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674',
  p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  p_payload: {
    header: {
      organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
      transaction_type: 'SALE',
      smart_code: 'HERA.SALON.SALE.TXN.RETAIL.V1',
      total_amount: 0
    },
    lines: []
  }
});

if (test3.data?.success === false) {
  console.log('Orchestrator Error:', test3.data.error);
  console.log('Error Context:', test3.data.error_context);

  if (test3.data.error.includes('debit_amount')) {
    console.log('\n🔴 ORCHESTRATOR: Calls old hera_txn_create_v1');
  }
} else if (test3.data?.success) {
  console.log('✅ Orchestrator Success!');
  console.log('Transaction ID:', test3.data.transaction_id);

  if (test3.data.transaction_id) {
    await supabase.from('universal_transactions')
      .delete()
      .eq('id', test3.data.transaction_id);
  }
}

console.log('\n');
console.log('═'.repeat(60));
console.log('DIAGNOSIS');
console.log('═'.repeat(60));
console.log('');
console.log('The deployed hera_txn_create_v1 function still contains');
console.log('OLD CODE with debit_amount/credit_amount columns.');
console.log('');
console.log('Action Required:');
console.log('1. Verify you deployed the CORRECT SQL file');
console.log('2. Check if function was created in correct schema (public)');
console.log('3. Try reloading schema cache in Supabase Dashboard:');
console.log('   Settings → API → Reload Schema');
console.log('');
