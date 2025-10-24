import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('Checking deployed HERA functions...\n');

// Try calling each function with minimal params to verify deployment
const checks = [
  {
    name: 'hera_permissions_ensure_pages_v1',
    params: {
      p_organization_id: '00000000-0000-0000-0000-000000000001',
      p_actor_user_id: '00000000-0000-0000-0000-000000000001',
      p_page_codes: []
    }
  },
  {
    name: 'hera_role_set_pages_v1',
    params: {
      p_organization_id: '00000000-0000-0000-0000-000000000001',
      p_actor_user_id: '00000000-0000-0000-0000-000000000001',
      p_role_code: 'TEST',
      p_page_codes: [],
      p_effect: 'allow'
    }
  },
  {
    name: 'hera_org_custom_page_upsert_v1',
    params: {
      p_organization_id: '00000000-0000-0000-0000-000000000001',
      p_actor_user_id: '00000000-0000-0000-0000-000000000001',
      p_app_code: 'TEST',
      p_page_code: 'TEST'
    }
  }
];

for (const check of checks) {
  const { data, error } = await supabase.rpc(check.name, check.params);
  
  if (error) {
    // Function exists if we get a business logic error (not "function does not exist")
    if (error.message.includes('does not exist')) {
      console.log(`❌ ${check.name}: NOT DEPLOYED`);
    } else {
      console.log(`✅ ${check.name}: DEPLOYED (error: ${error.message.substring(0, 50)}...)`);
    }
  } else {
    console.log(`✅ ${check.name}: DEPLOYED (returned: ${JSON.stringify(data).substring(0, 50)}...)`);
  }
}

console.log('\nVerification complete!');
