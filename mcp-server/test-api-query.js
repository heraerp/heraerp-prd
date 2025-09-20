const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testApiQuery() {
  console.log('🔍 Testing exact API query...');
  
  const { data: userEntity, error: userError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', '00000000-0000-0000-0000-000000000000')
    .eq('entity_type', 'user')
    .eq('metadata->>supabase_user_id', 'demo|salon-receptionist')
    .single();
  
  console.log('User found:', !!userEntity);
  console.log('Error:', userError?.message || 'none');
  
  if (userEntity) {
    console.log('User ID:', userEntity.id);
    console.log('Metadata:', userEntity.metadata);
  }
}

testApiQuery().catch(console.error);