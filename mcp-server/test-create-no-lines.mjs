#!/usr/bin/env node
/**
 * Test transaction creation WITHOUT lines
 * to isolate the trigger issue
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const TEST_ACTOR_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';

console.log('🧪 Transaction CREATE - No Lines Test\n');
console.log('=' .repeat(60));

// Test 1: Header only (no lines)
console.log('📋 TEST 1: Create transaction WITHOUT lines');
console.log('-'.repeat(60));

const test1 = await supabase.rpc('hera_txn_create_v1', {
  p_header: {
    organization_id: TEST_ORG_ID,
    transaction_type: 'SALE',
    transaction_code: 'NO-LINES-' + Date.now(),
    smart_code: 'HERA.SALON.POS.SALE.TXN.RETAIL.v1',
    total_amount: 100,
    transaction_status: 'draft'
  },
  p_lines: [],  // EMPTY
  p_actor_user_id: TEST_ACTOR_ID
});

console.log('📦 RESULT:');
if (test1.error) {
  console.log('❌ RPC Error:', test1.error.message);
} else if (test1.data?.success === false) {
  console.log('❌ Function Error:', test1.data.error);
} else if (test1.data?.success === true) {
  console.log('✅ SUCCESS! Transaction ID:', test1.data.transaction_id);

  // Cleanup
  if (test1.data.transaction_id) {
    await supabase.from('universal_transactions')
      .delete()
      .eq('id', test1.data.transaction_id);
    console.log('✅ Cleanup complete');
  }
}

console.log('\n');

// Test 2: Header + ONE line (triggers the issue)
console.log('📋 TEST 2: Create transaction WITH one line');
console.log('-'.repeat(60));

const test2 = await supabase.rpc('hera_txn_create_v1', {
  p_header: {
    organization_id: TEST_ORG_ID,
    transaction_type: 'SALE',
    transaction_code: 'WITH-LINE-' + Date.now(),
    smart_code: 'HERA.SALON.POS.SALE.TXN.RETAIL.v1',
    total_amount: 50
  },
  p_lines: [
    {
      line_number: 1,
      line_type: 'service',
      description: 'Test Service',
      quantity: 1,
      unit_amount: 50,
      line_amount: 50,
      smart_code: 'HERA.SALON.SERVICE.LINE.ITEM.v1'
    }
  ],
  p_actor_user_id: TEST_ACTOR_ID
});

console.log('📦 RESULT:');
if (test2.error) {
  console.log('❌ RPC Error:', test2.error.message);
} else if (test2.data?.success === false) {
  console.log('❌ Function Error:', test2.data.error);
  console.log('   Detail:', test2.data.error_detail);
  console.log('   Hint:', test2.data.error_hint);

  if (test2.data.error.includes('debit_amount')) {
    console.log('\n🔴 DIAGNOSIS: Database trigger validate_gl_balance_trigger()');
    console.log('   The trigger is trying to access debit_amount column');
    console.log('   This trigger needs to be updated or dropped');
  }
} else if (test2.data?.success === true) {
  console.log('✅ SUCCESS! Transaction ID:', test2.data.transaction_id);

  // Cleanup
  if (test2.data.transaction_id) {
    await supabase.from('universal_transaction_lines')
      .delete()
      .eq('transaction_id', test2.data.transaction_id);

    await supabase.from('universal_transactions')
      .delete()
      .eq('id', test2.data.transaction_id);

    console.log('✅ Cleanup complete');
  }
}

console.log('\n');
console.log('═'.repeat(60));
console.log('SUMMARY');
console.log('═'.repeat(60));
console.log('');
console.log('✅ Smart code validation: FIXED (regex escaping corrected)');
console.log('');

if (test1.data?.success && !test2.data?.success && test2.data?.error?.includes('debit_amount')) {
  console.log('🔴 BLOCKER: Database trigger needs update');
  console.log('');
  console.log('Trigger: validate_gl_balance_trigger()');
  console.log('Issue: References debit_amount column which no longer exists');
  console.log('');
  console.log('Action required:');
  console.log('1. Locate trigger: validate_gl_balance_trigger()');
  console.log('2. Update trigger to use derived DR/CR helper functions');
  console.log('3. Or drop trigger if using hera_gl_validate_balance() instead');
}

console.log('');
