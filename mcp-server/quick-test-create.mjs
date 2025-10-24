import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCreate() {
  console.log('🧪 Testing CREATE with valid smart code...\n');
  
  const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674',
    p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    p_payload: {
      header: {
        organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
        transaction_type: 'sale',
        transaction_code: `TEST-SALE-${Date.now()}`,
        smart_code: 'HERA.SALON.SALE.TXN.RETAIL.V1', // Valid HERA smart code
        total_amount: 150.00,
        transaction_status: 'completed'
      },
      lines: [
        {
          line_number: 1,
          line_type: 'service',
          description: 'Test Service',
          quantity: 1,
          unit_amount: 150.00,
          line_amount: 150.00
        }
      ]
    }
  });
  
  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }
  
  console.log('✅ Success!');
  console.log('\nResponse structure:');
  console.log(JSON.stringify(data, null, 2));
  
  // Validate response
  if (data.success && data.transaction_id && data.data) {
    console.log('\n✅ Response structure is correct:');
    console.log('  - success:', data.success);
    console.log('  - action:', data.action);
    console.log('  - transaction_id:', data.transaction_id);
    console.log('  - data includes:', Object.keys(data.data));
  }
}

testCreate();
