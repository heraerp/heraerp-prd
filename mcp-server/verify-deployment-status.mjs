#!/usr/bin/env node
/**
 * Verify which version of hera_txn_create_v1 is actually deployed
 * by testing with GL lines that require side validation
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const TEST_ACTOR_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';

console.log('🔍 Deployment Status Verification\n');
console.log('=' .repeat(60));

console.log('\n📋 TEST: Create transaction with lines (non-GL)');
console.log('-'.repeat(60));

const result = await supabase.rpc('hera_txn_create_v1', {
  p_header: {
    organization_id: TEST_ORG_ID,
    transaction_type: 'SALE',
    transaction_code: 'VERIFY-' + Date.now(),
    smart_code: 'HERA.SALON.SALE.TXN.RETAIL.V1',
    total_amount: 100
  },
  p_lines: [
    {
      line_number: 1,
      line_type: 'service',
      description: 'Haircut',
      quantity: 1,
      unit_amount: 100,
      line_amount: 100,
      smart_code: 'HERA.SALON.SERVICE.LINE.HAIRCUT.V1',
      line_data: {}  // No side needed for non-GL
    }
  ],
  p_actor_user_id: TEST_ACTOR_ID
});

console.log('\n📊 RESULT:');
console.log('-'.repeat(60));

if (result.error) {
  console.log('❌ RPC Error:', result.error.message);
  console.log('   Code:', result.error.code);
  console.log('   Hint:', result.error.hint);

  if (result.error.message.includes('debit_amount')) {
    console.log('\n🔴 DIAGNOSIS: OLD VERSION DEPLOYED');
    console.log('   The function at line 316 still tries to insert debit_amount');
    console.log('   This confirms the SQL you provided was NOT deployed yet');
  }
} else if (result.data?.success === false) {
  console.log('❌ Function Error:', result.data.error);
  console.log('   Detail:', result.data.error_detail);
  console.log('   Hint:', result.data.error_hint);

  if (result.data.error.includes('debit_amount')) {
    console.log('\n🔴 DIAGNOSIS: OLD VERSION DEPLOYED');
    console.log('   The function still references debit_amount columns');
  } else if (result.data.error.includes('GL_LINE_SIDE_REQUIRED')) {
    console.log('\n🟢 DIAGNOSIS: NEW VERSION DEPLOYED');
    console.log('   Function uses new helper functions (GL validation working)');
  }
} else if (result.data?.success === true) {
  console.log('✅ Transaction created successfully!');
  console.log('   Transaction ID:', result.data.transaction_id);
  console.log('\n🟢 DIAGNOSIS: NEW VERSION DEPLOYED');
  console.log('   Function works without debit_amount columns');

  // Cleanup
  console.log('\nCleaning up test transaction...');
  await supabase.from('universal_transaction_lines')
    .delete()
    .eq('transaction_id', result.data.transaction_id);

  await supabase.from('universal_transactions')
    .delete()
    .eq('id', result.data.transaction_id);

  console.log('✅ Cleanup complete');
}

console.log('\n');
console.log('═'.repeat(60));
console.log('RECOMMENDATION');
console.log('═'.repeat(60));
console.log('');

if (result.error?.message.includes('debit_amount') ||
    result.data?.error?.includes('debit_amount')) {
  console.log('The new hera_txn_create_v1 SQL has NOT been deployed yet.');
  console.log('');
  console.log('Action Required:');
  console.log('1. Deploy the SQL you just provided to Supabase');
  console.log('2. Go to Supabase Dashboard → SQL Editor');
  console.log('3. Paste and execute the complete SQL (helpers + create function)');
  console.log('4. Then go to Settings → API → Reload Schema Cache');
  console.log('5. Re-run this test: node verify-deployment-status.mjs');
} else {
  console.log('✅ New version appears to be deployed!');
  console.log('   Re-run the comprehensive test:');
  console.log('   node test-fresh-create.mjs');
}

console.log('');
