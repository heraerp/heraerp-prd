#!/usr/bin/env node
/**
 * Test with lowercase v1 (as required by current regex)
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const TEST_ACTOR_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';

console.log('🧪 TEST: Smart code with lowercase v1\n');

const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: TEST_ACTOR_ID,
  p_organization_id: TEST_ORG_ID,
  p_payload: {
    header: {
      organization_id: TEST_ORG_ID,
      transaction_type: 'SALE',
      transaction_code: 'TEST-' + Date.now(),
      smart_code: 'HERA.SALON.SALE.TXN.RETAIL.v1',  // lowercase v1
      total_amount: 100
    },
    lines: [
      {
        line_number: 1,
        line_type: 'service',
        description: 'Test Service',
        quantity: 1,
        unit_amount: 100,
        line_amount: 100,
        smart_code: 'HERA.SALON.SERVICE.LINE.HAIRCUT.v1'  // lowercase v1
      }
    ]
  }
});

console.log('📦 RESULT:');
console.log('=' .repeat(60));

if (error) {
  console.log('❌ RPC Error:', error.message);
  process.exit(1);
}

if (data.data?.success === false) {
  console.log('❌ Function Error:', data.data.error);
  console.log('   Detail:', data.data.error_detail);
  console.log('   Context:', data.data.error_context);
  process.exit(1);
}

if (data.data?.success === true) {
  console.log('✅ CREATE SUCCESS!');
  console.log('   Transaction ID:', data.data.transaction_id);

  // Cleanup
  if (data.data.transaction_id) {
    console.log('\n🧹 Cleaning up test transaction...');

    await supabase
      .from('universal_transaction_lines')
      .delete()
      .eq('transaction_id', data.data.transaction_id);

    await supabase
      .from('universal_transactions')
      .delete()
      .eq('id', data.data.transaction_id);

    console.log('✅ Cleanup complete');
  }

  console.log('\n🟢 DIAGNOSIS: Function works with lowercase .v1');
  console.log('   However, HERA DNA standard requires uppercase .V1');
  console.log('   The smart code validation regex needs to be updated.');
} else {
  console.log('⚠️  Unexpected response:', JSON.stringify(data, null, 2));
}
