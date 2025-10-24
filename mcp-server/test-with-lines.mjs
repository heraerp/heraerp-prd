#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const TEST_ACTOR_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';

console.log('🧪 Testing CREATE with Lines\n');

console.log('TEST 1: Empty lines array (should work)');
console.log('-'.repeat(60));
const test1 = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: TEST_ACTOR_ID,
  p_organization_id: TEST_ORG_ID,
  p_payload: {
    header: {
      organization_id: TEST_ORG_ID,
      transaction_type: 'SALE',
      smart_code: 'HERA.SALON.SALE.TXN.RETAIL.V1',
      total_amount: 0
    },
    lines: []  // EMPTY
  }
});

if (test1.data?.success) {
  console.log('✅ Empty lines: SUCCESS');
  console.log('   Transaction ID:', test1.data.transaction_id);

  // Cleanup
  await supabase.from('universal_transactions')
    .delete()
    .eq('id', test1.data.transaction_id);
} else {
  console.log('❌ Empty lines: FAILED');
  console.log('   Error:', test1.data?.error);
}

console.log('\nTEST 2: With one line (critical test)');
console.log('-'.repeat(60));
const test2 = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: TEST_ACTOR_ID,
  p_organization_id: TEST_ORG_ID,
  p_payload: {
    header: {
      organization_id: TEST_ORG_ID,
      transaction_type: 'SALE',
      smart_code: 'HERA.SALON.SALE.TXN.RETAIL.V1',
      total_amount: 100
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

if (test2.data?.success) {
  console.log('✅ With lines: SUCCESS');
  console.log('   Transaction ID:', test2.data.transaction_id);

  // Cleanup
  await supabase.from('universal_transaction_lines')
    .delete()
    .eq('transaction_id', test2.data.transaction_id);

  await supabase.from('universal_transactions')
    .delete()
    .eq('id', test2.data.transaction_id);
} else {
  console.log('❌ With lines: FAILED');
  console.log('   Error:', test2.data?.error);
  console.log('   Detail:', test2.data?.error_detail);
  console.log('   Context:', test2.data?.error_context);
}

console.log('\n');
if (!test2.data?.success && test2.data?.error?.includes('debit_amount')) {
  console.log('🔴 ISSUE: The function tries to INSERT debit_amount into lines');
  console.log('');
  console.log('This means the hera_txn_create_v1 line insertion code');
  console.log('still references debit_amount/credit_amount columns.');
  console.log('');
  console.log('The function header creation works, but line insertion');
  console.log('uses old column names.');
}
