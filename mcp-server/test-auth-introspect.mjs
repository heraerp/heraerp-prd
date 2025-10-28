import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('='.repeat(80));
console.log('TESTING hera_auth_introspect_v1 RPC FUNCTION');
console.log('='.repeat(80));

const testIntrospection = async () => {
  // Get a sample user with HAS_ROLE relationship
  const { data: hasRoleRels } = await supabase
    .from('core_relationships')
    .select('from_entity_id, organization_id, relationship_data')
    .eq('relationship_type', 'HAS_ROLE')
    .eq('is_active', true)
    .limit(3);

  if (hasRoleRels === null || hasRoleRels.length === 0) {
    console.log('❌ No HAS_ROLE relationships found to test');
    return;
  }

  console.log(`\n📋 Testing with ${hasRoleRels.length} users:\n`);

  for (const rel of hasRoleRels) {
    console.log('-'.repeat(80));
    console.log(`👤 Testing User: ${rel.from_entity_id.substring(0, 8)}`);
    console.log(`   Organization: ${rel.organization_id.substring(0, 8)}`);
    console.log(`   Expected Role: ${rel.relationship_data?.role_code || 'N/A'}`);
    console.log('');

    // Call hera_auth_introspect_v1
    const { data: authContext, error } = await supabase.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: rel.from_entity_id
    });

    if (error) {
      console.log(`❌ RPC Error: ${error.message}`);
      console.log(`   Details:`, error);
      continue;
    }

    if (authContext === null) {
      console.log('❌ No data returned from RPC');
      continue;
    }

    console.log('✅ RPC Call Successful');
    console.log('');
    console.log('📊 Auth Context:');
    console.log(JSON.stringify(authContext, null, 2));
    console.log('');

    // Verify key fields
    console.log('🔍 Verification:');
    console.log(`   User ID matches: ${authContext.user_id === rel.from_entity_id ? '✅' : '❌'}`);
    console.log(`   Has organizations: ${authContext.organizations?.length > 0 ? '✅' : '❌'}`);
    console.log(`   Default org set: ${authContext.default_organization_id ? '✅' : '❌'}`);

    if (authContext.organizations?.length > 0) {
      const org = authContext.organizations[0];
      console.log(`   Primary role: ${org.primary_role}`);
      console.log(`   Roles array: ${JSON.stringify(org.roles)}`);
      console.log(`   Is owner: ${org.is_owner}`);
      console.log(`   Is admin: ${org.is_admin}`);
      console.log(`   Joined at: ${org.joined_at}`);
    }
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('✅ INTROSPECTION TEST COMPLETE');
  console.log('='.repeat(80));
};

testIntrospection().catch(console.error);
