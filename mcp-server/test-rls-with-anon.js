const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testRLSWithAnon() {
  console.log('🧪 Testing RLS policies with anon key...\n');
  
  // Create client with anon key (simulating browser environment)
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const organizationId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'; // Hair Talkz
  
  // Test 1: Query settings
  console.log('1️⃣ Testing core_dynamic_data query:');
  const { data: settingsData, error: settingsError } = await anonClient
    .from('core_dynamic_data')
    .select('id, field_name, field_value_json')
    .eq('organization_id', organizationId)
    .in('field_name', ['SALES_POLICY.v1', 'INVENTORY_POLICY.v1', 'SYSTEM_SETTINGS.v1'])
    .limit(5);
    
  if (settingsError) {
    console.log('❌ Error:', settingsError.message);
  } else {
    console.log(`✅ Found ${settingsData?.length || 0} settings`);
    settingsData?.forEach(s => {
      console.log(`  - ${s.field_name}: ${s.field_value_json ? '✅ has data' : '❌ empty'}`);
    });
  }
  
  // Test 2: Query entities
  console.log('\n2️⃣ Testing core_entities query:');
  const { data: entityData, error: entityError } = await anonClient
    .from('core_entities')
    .select('id, entity_type, entity_name')
    .eq('organization_id', organizationId)
    .in('entity_type', ['customer', 'service', 'product'])
    .limit(5);
    
  if (entityError) {
    console.log('❌ Error:', entityError.message);
  } else {
    console.log(`✅ Found ${entityData?.length || 0} entities`);
    entityData?.forEach(e => {
      console.log(`  - ${e.entity_type}: ${e.entity_name}`);
    });
  }
  
  // Test 3: Check if auth functions work
  console.log('\n3️⃣ Testing auth functions:');
  const { data: authOrgId, error: authOrgError } = await anonClient
    .rpc('auth_organization_id');
    
  console.log('auth_organization_id():', authOrgError ? `❌ ${authOrgError.message}` : `Result: ${authOrgId}`);
  
  const { data: authRole, error: authRoleError } = await anonClient
    .rpc('auth_user_entity_id');
    
  console.log('auth_user_entity_id():', authRoleError ? `❌ ${authRoleError.message}` : `Result: ${authRole}`);
  
  console.log('\n✨ Summary:');
  console.log('- RLS policies are:', (settingsData?.length > 0 || entityData?.length > 0) ? '✅ WORKING' : '❌ BLOCKING ACCESS');
  console.log('- Auth context is:', (!authOrgId && !authRole) ? '❌ NOT SET (expected for demo)' : '✅ SET');
}

testRLSWithAnon().catch(console.error);