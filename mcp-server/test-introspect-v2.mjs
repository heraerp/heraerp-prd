import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('='.repeat(80));
console.log('TESTING UPDATED hera_auth_introspect_v1 (with explicit type casting)');
console.log('='.repeat(80));

const testIntrospection = async () => {
  // Get a test user with HAS_ROLE
  const { data: testUsers } = await supabase
    .from('core_relationships')
    .select('from_entity_id, organization_id, relationship_data')
    .eq('relationship_type', 'HAS_ROLE')
    .eq('is_active', true)
    .limit(2);

  if (!testUsers || testUsers.length === 0) {
    console.log('❌ No test users found');
    return;
  }

  console.log(`\n📋 Testing with ${testUsers.length} users:\n`);

  for (const user of testUsers) {
    console.log('-'.repeat(80));
    console.log(`👤 Testing User: ${user.from_entity_id.substring(0, 8)}`);
    console.log(`   Expected Role: ${user.relationship_data?.role_code || 'N/A'}`);
    console.log('');

    // ✅ THE CRITICAL TEST: Call via PostgREST .rpc() method
    const { data: authContext, error } = await supabase.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: user.from_entity_id
    });

    if (error) {
      console.log(`❌ RPC Error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Details:`, error.details || 'None');
      console.log('');
      console.log('🚨 DEPLOYMENT BLOCKER: Function still has type issues');
      continue;
    }

    if (!authContext) {
      console.log('❌ No data returned from RPC');
      continue;
    }

    console.log('✅ RPC Call Successful!');
    console.log('');
    console.log('📊 Auth Context Structure:');
    console.log(JSON.stringify(authContext, null, 2));
    console.log('');

    // Verify key fields
    console.log('🔍 Field Validation:');
    console.log(`   ✅ user_id exists: ${!!authContext.user_id}`);
    console.log(`   ✅ user_id type: ${typeof authContext.user_id}`);
    console.log(`   ✅ introspected_at exists: ${!!authContext.introspected_at}`);
    console.log(`   ✅ is_platform_admin type: ${typeof authContext.is_platform_admin}`);
    console.log(`   ✅ organization_count type: ${typeof authContext.organization_count}`);
    console.log(`   ✅ organizations is array: ${Array.isArray(authContext.organizations)}`);

    if (authContext.organizations?.length > 0) {
      const org = authContext.organizations[0];
      console.log('');
      console.log('📋 First Organization:');
      console.log(`   ID: ${org.id}`);
      console.log(`   Name: ${org.name}`);
      console.log(`   Primary Role: ${org.primary_role}`);
      console.log(`   Roles: ${JSON.stringify(org.roles)}`);
      console.log(`   Is Owner: ${org.is_owner}`);
      console.log(`   Is Admin: ${org.is_admin}`);
      console.log(`   Joined At: ${org.joined_at}`);
    }
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('✅ INTROSPECTION TEST COMPLETE');
  console.log('='.repeat(80));
  console.log('');
  console.log('📝 DEPLOYMENT DECISION:');
  console.log('   If all tests passed above, function is ready for deployment!');
  console.log('   If ANY "polymorphic type" errors occurred, DO NOT DEPLOY.');
};

testIntrospection().catch(err => {
  console.error('');
  console.error('❌ FATAL TEST ERROR:', err.message);
  console.error('');
  console.error('🚨 DO NOT DEPLOY - Function has issues');
});
