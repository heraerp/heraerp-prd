const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function diagnoseRLSIssue() {
  console.log('🔍 Diagnosing RLS Issue...\n');
  
  // Test with anon key (simulates browser requests)
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  console.log('1️⃣ Testing with ANON key (browser simulation):');
  try {
    const { data, error } = await anonClient
      .from('core_dynamic_data')
      .select('id')
      .eq('organization_id', '0fd09e31-d257-4329-97eb-7d7f522ed6f0')
      .limit(1);
    
    if (error) {
      console.log('❌ Error:', error.message);
      if (error.message.includes('app.current_org')) {
        console.log('   ⚠️  Found app.current_org reference!');
        console.log('\n🔍 DIAGNOSIS: The RLS policies are calling functions that internally use app.current_org');
        console.log('   The hera_* functions might be calling other functions that have the issue.\n');
      }
    } else {
      console.log('✅ Success! Data:', data?.length || 0, 'records');
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
  
  // Test with service role (should work)
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  console.log('\n2️⃣ Testing with SERVICE ROLE key:');
  try {
    const { data, error } = await serviceClient
      .from('core_dynamic_data')
      .select('id')
      .eq('organization_id', '0fd09e31-d257-4329-97eb-7d7f522ed6f0')
      .limit(1);
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Success! Data:', data?.length || 0, 'records');
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
  
  console.log('\n💡 SOLUTION:');
  console.log('The hera_* functions need to be checked for any calls to functions');
  console.log('that might use current_setting(\'app.current_org\').');
  console.log('\nCheck these functions in Supabase SQL Editor:');
  console.log('- hera_current_user_entity_id()');
  console.log('- hera_user_organizations()');
  console.log('- hera_can_access_org()');
}

diagnoseRLSIssue().catch(console.error);