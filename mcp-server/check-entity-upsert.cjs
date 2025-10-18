const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEntityUpsert() {
  console.log('🔍 Checking if hera_entity_upsert_v1 exists in Supabase...\n');

  // Try to call the function with minimal valid parameters
  const testParams = {
    p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    p_entity_type: 'test',
    p_entity_name: 'Test Entity',
    p_smart_code: 'HERA.TEST.ENTITY.CHECK.V1',
    p_entity_id: null,
    p_entity_code: null,
    p_metadata: null
  };

  console.log('📤 Calling hera_entity_upsert_v1 with params:', testParams);

  const { data, error } = await supabase.rpc('hera_entity_upsert_v1', testParams);

  if (error) {
    if (error.code === 'PGRST202') {
      console.log('\n❌ Function NOT FOUND in database');
      console.log('Error:', error.message);
    } else {
      console.log('\n✅ Function EXISTS (but returned an error)');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      console.log('Error details:', error.details);
    }
  } else {
    console.log('\n✅ Function EXISTS and returned successfully!');
    console.log('Response:', data);
  }

  console.log('\n✅ Test complete!');
}

checkEntityUpsert().catch(console.error);
