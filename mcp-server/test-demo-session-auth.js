const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testDemoSessionAuth() {
  console.log('🧪 Testing demo session authentication...\n');
  
  // First, let's check if we have demo user data
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const organizationId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';
  
  // Check demo users
  console.log('1️⃣ Checking demo users for organization:');
  const { data: demoUsers, error: demoError } = await serviceClient
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'user')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
    
  console.log(`Found ${demoUsers?.length || 0} demo users`);
  if (demoUsers?.length > 0) {
    console.log('Most recent user:', {
      id: demoUsers[0].id,
      name: demoUsers[0].entity_name,
      code: demoUsers[0].entity_code,
      created: demoUsers[0].created_at
    });
  }
  
  // Check organization settings
  console.log('\n2️⃣ Checking organization settings:');
  const { data: settingsData, error: settingsError } = await serviceClient
    .from('core_dynamic_data')
    .select('field_name, field_value_json')
    .eq('organization_id', organizationId)
    .in('field_name', ['SALES_POLICY.v1', 'INVENTORY_POLICY.v1', 'SYSTEM_SETTINGS.v1']);
    
  console.log(`Found ${settingsData?.length || 0} settings`);
  settingsData?.forEach(s => {
    console.log(`- ${s.field_name}: ${s.field_value_json ? '✅' : '❌'}`);
  });
  
  // Test a direct query with organization filter
  console.log('\n3️⃣ Testing direct query with organization filter:');
  const { data: directData, error: directError } = await serviceClient
    .from('core_dynamic_data')
    .select('id, field_name')
    .eq('organization_id', organizationId)
    .limit(5);
    
  if (directError) {
    console.log('❌ Error:', directError.message);
  } else {
    console.log(`✅ Found ${directData?.length || 0} records`);
    directData?.forEach(d => console.log(`  - ${d.field_name}`));
  }
  
  console.log('\n💡 SOLUTION:');
  console.log('The demo session needs to:');
  console.log('1. Create a proper JWT token with organization_id and entity_id claims');
  console.log('2. Use the demo user entity_id from the database');
  console.log('3. Ensure the Supabase client uses this JWT for authentication');
}

testDemoSessionAuth().catch(console.error);