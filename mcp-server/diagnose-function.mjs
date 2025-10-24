import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Diagnosing hera_txn_create_v1...\n');
console.log('Calling function directly (bypassing hera_txn_crud_v1):\n');

supabase.rpc('hera_txn_create_v1', {
  p_header: {
    organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    transaction_type: 'sale',
    smart_code: 'HERA.SALON.SALE.TXN.RETAIL.V1'
  },
  p_lines: [],
  p_actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674'
}).then(({ data, error }) => {
  if (error) {
    console.log('Error:', error.message);
    if (error.message.includes('debit_amount')) {
      console.log('\n❌ OLD FUNCTION STILL ACTIVE');
      console.log('\nAction required:');
      console.log('1. Drop the old function: DROP FUNCTION hera_txn_create_v1;');
      console.log('2. Recreate with the new SQL');
      console.log('3. Or use: CREATE OR REPLACE FUNCTION (make sure it overwrites)');
    }
  } else {
    console.log('✅ Function works!');
    console.log('Data:', data);
  }
});
