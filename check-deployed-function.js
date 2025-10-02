const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDeployedFunction() {
  console.log('🔍 Checking deployed hera_entity_upsert_v1 function definition...\n');
  
  const { data, error } = await supabase.rpc('hera_entity_upsert_v1', {
    p_organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
    p_entity_type: 'test',
    p_entity_name: 'Function Test',
    p_smart_code: 'HERA.TEST.FUNC.CHECK.DEPLOY.V1',
    p_entity_code: 'TEST-' + Date.now()
  });

  if (error) {
    console.log('❌ Error calling function:', error);
  } else {
    console.log('✅ Function returned:', data);
    console.log('📊 Response type:', typeof data);
    console.log('📊 Response structure:', JSON.stringify(data, null, 2));
  }
}

checkDeployedFunction().catch(console.error);
