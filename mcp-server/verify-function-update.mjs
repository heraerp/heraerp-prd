import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyFunction() {
  console.log('🔍 Checking if hera_txn_create_v1 was updated...\n');
  
  // Try to call it directly with minimal params to see the actual error
  const { data, error } = await supabase.rpc('hera_txn_create_v1', {
    p_header: {
      organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
      transaction_type: 'test',
      smart_code: 'HERA.TEST.TXN.V1'
    },
    p_lines: [],
    p_actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674'
  });
  
  if (error) {
    console.log('❌ Error:', error.message);
    console.log('\nError details:', error);
    
    if (error.message.includes('debit_amount')) {
      console.log('\n⚠️  OLD VERSION STILL DEPLOYED');
      console.log('The function is still using the old schema.');
      console.log('\nPlease redeploy hera_txn_create_v1 to Supabase.');
    }
  } else {
    console.log('✅ Function executed successfully!');
    console.log('Response:', data);
  }
}

verifyFunction();
