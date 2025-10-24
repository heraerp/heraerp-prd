import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFunctions() {
  console.log('🔍 Checking for multiple versions of hera_txn_create_v1...\n');
  
  // Try different parameter combinations
  const tests = [
    {
      name: '3 params (header, lines, actor)',
      params: {
        p_header: { organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8', transaction_type: 'test', smart_code: 'HERA.SALON.SALE.TXN.RETAIL.V1' },
        p_lines: [],
        p_actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674'
      }
    }
  ];
  
  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    const { data, error } = await supabase.rpc('hera_txn_create_v1', test.params);
    
    if (error) {
      console.log(`  ❌ ${error.message}`);
    } else {
      console.log(`  ✅ Success! Got transaction_id: ${data?.transaction_id}`);
    }
    console.log('');
  }
  
  // Now test via hera_txn_crud_v1
  console.log('Testing via hera_txn_crud_v1:');
  const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674',
    p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    p_payload: {
      header: {
        organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
        transaction_type: 'sale',
        smart_code: 'HERA.SALON.SALE.TXN.RETAIL.V1'
      },
      lines: []
    }
  });
  
  if (error) {
    console.log(`  ❌ ${error.message}`);
  } else {
    console.log(`  Result: success=${data?.success}, error=${data?.error}`);
  }
}

checkFunctions();
