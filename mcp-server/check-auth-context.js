const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkAuthContext() {
  console.log('🔍 Checking authentication context...\n');
  
  // Create anon client to simulate browser
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  // First, let's see if we can query without any auth
  console.log('1️⃣ Testing query without auth context:');
  const { data: noAuthData, error: noAuthError } = await anonClient
    .from('core_dynamic_data')
    .select('id')
    .eq('organization_id', '0fd09e31-d257-4329-97eb-7d7f522ed6f0')
    .limit(1);
    
  console.log('Result:', noAuthError ? `❌ ${noAuthError.message}` : `✅ Found ${noAuthData?.length || 0} records`);
  
  // Check if the issue is with the auth functions
  console.log('\n2️⃣ Testing auth functions directly:');
  
  // Service role client for testing functions
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Test auth_organization_id function
  const { data: orgIdData, error: orgIdError } = await serviceClient
    .rpc('auth_organization_id');
    
  console.log('auth_organization_id():', orgIdError ? `❌ ${orgIdError.message}` : `Result: ${orgIdData}`);
  
  // Test auth_user_entity_id function  
  const { data: entityIdData, error: entityIdError } = await serviceClient
    .rpc('auth_user_entity_id');
    
  console.log('auth_user_entity_id():', entityIdError ? `❌ ${entityIdError.message}` : `Result: ${entityIdData}`);
  
  console.log('\n💡 DIAGNOSIS:');
  if (noAuthError) {
    console.log('- Queries are failing because auth context is not properly set');
    console.log('- The JWT token needs to include organization_id and entity_id claims');
    console.log('- Demo sessions need special handling for auth context');
  }
}

checkAuthContext().catch(console.error);