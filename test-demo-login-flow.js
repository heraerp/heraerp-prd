const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDemoLoginFlow() {
  console.log('🔐 Testing Demo Login Flow...\n');

  try {
    // Step 1: Test login
    console.log('1️⃣ Testing demo user login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'demo@keralafurniture.com',
      password: 'FurnitureDemo2025!'
    });

    if (authError) {
      throw authError;
    }

    console.log('   ✅ Login successful!');
    console.log('   User ID:', authData.user.id);
    console.log('   User metadata:', authData.user.user_metadata);
    
    // Check organizations in metadata
    const orgId = authData.user.user_metadata.organization_id;
    const orgName = authData.user.user_metadata.organization_name;
    const orgs = authData.user.user_metadata.organizations;
    
    console.log('\n2️⃣ Organization Information:');
    console.log('   Organization ID:', orgId || 'Not set');
    console.log('   Organization Name:', orgName || 'Not set');
    console.log('   Organizations List:', orgs || 'Not set');
    
    // Check if user has organizations
    if (!orgId) {
      console.log('\n⚠️  WARNING: User has no organization_id in metadata!');
      console.log('   This will cause redirect to /auth/organizations/new');
    } else {
      console.log('\n✅ User has organization context set properly');
    }
    
    // Test query with organization context
    console.log('\n3️⃣ Testing data access...');
    const { data: entities, error: queryError } = await supabase
      .from('core_entities')
      .select('entity_type, count')
      .eq('organization_id', 'f0af4ced-9d12-4a55-a649-b484368db249')
      .limit(1);
    
    if (queryError) {
      console.log('   ❌ Query error:', queryError.message);
    } else {
      console.log('   ✅ Can access organization data');
    }
    
    // Sign out
    await supabase.auth.signOut();
    console.log('\n4️⃣ Signed out successfully');
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY:');
    console.log('='.repeat(60));
    
    if (orgId) {
      console.log('✅ Demo user is properly configured');
      console.log('✅ Should redirect to /furniture on login');
    } else {
      console.log('❌ Demo user missing organization metadata');
      console.log('❌ Will redirect to /auth/organizations/new');
      console.log('\n💡 Fix: Run node fix-demo-user-organization.js');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testDemoLoginFlow();