import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🧪 Testing QUERY action (should not call hera_txn_read_v1)...\n');

supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674',
  p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  p_payload: {
    filters: { limit: 5 }
  }
}).then(({ data, error }) => {
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(data, null, 2));
  }
});
