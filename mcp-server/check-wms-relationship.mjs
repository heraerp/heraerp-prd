import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WMS_USER_ID = 'b172d7c4-92af-4595-a999-e073deda7c92';

console.log('🔍 Checking WMS User Relationships\n');
console.log('=' .repeat(70));

// Check all relationship types for WMS user
console.log('\n📋 All relationships for WMS user:\n');

const { data: allRelationships, error: relError } = await supabase
  .from('core_relationships')
  .select('*')
  .or(`from_entity_id.eq.${WMS_USER_ID},to_entity_id.eq.${WMS_USER_ID}`);

if (relError) {
  console.error('❌ Error:', relError);
} else if (!allRelationships || allRelationships.length === 0) {
  console.log('❌ No relationships found for WMS user');
} else {
  console.log(`✅ Found ${allRelationships.length} relationship(s):\n`);

  allRelationships.forEach((rel, idx) => {
    console.log(`[${idx + 1}] Type: ${rel.relationship_type}`);
    console.log(`    From: ${rel.from_entity_id}`);
    console.log(`    To: ${rel.to_entity_id}`);
    console.log(`    Org: ${rel.organization_id}`);
    console.log(`    Data:`, JSON.stringify(rel.relationship_data || {}, null, 2));
    console.log('');
  });
}

// Check specifically for MEMBER_OF relationships
console.log('\n👤 Checking MEMBER_OF relationships:\n');

const { data: memberOfRels, error: memberError } = await supabase
  .from('core_relationships')
  .select('*')
  .eq('from_entity_id', WMS_USER_ID)
  .eq('relationship_type', 'MEMBER_OF');

if (memberError) {
  console.error('❌ Error:', memberError);
} else if (!memberOfRels || memberOfRels.length === 0) {
  console.log('❌ No MEMBER_OF relationships found');
} else {
  console.log(`✅ Found ${memberOfRels.length} MEMBER_OF relationship(s):\n`);

  for (const rel of memberOfRels) {
    console.log(`   To Organization: ${rel.to_entity_id}`);
    console.log(`   Relationship Data:`, JSON.stringify(rel.relationship_data || {}, null, 2));

    // Get organization details
    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', rel.to_entity_id)
      .single();

    if (!orgError && org) {
      console.log(`\n   📦 Organization Details:`);
      console.log(`      Name: ${org.organization_name}`);
      console.log(`      Code: ${org.organization_code}`);
      console.log(`      Settings:`, JSON.stringify(org.settings || {}, null, 2));
    }
    console.log('');
  }
}

// Now test hera_auth_introspect_v1
console.log('\n🔐 Testing hera_auth_introspect_v1 RPC:\n');

const { data: authContext, error: introspectError } = await supabase.rpc('hera_auth_introspect_v1', {
  p_actor_user_id: WMS_USER_ID
});

if (introspectError) {
  console.error('❌ Introspection error:', introspectError);
} else {
  console.log('✅ Raw RPC Response:');
  console.log(JSON.stringify(authContext, null, 2));

  if (authContext.organizations && authContext.organizations.length > 0) {
    console.log(`\n✅ Found ${authContext.organizations.length} organization(s) from RPC:\n`);

    authContext.organizations.forEach((org, idx) => {
      console.log(`[${idx + 1}] ${org.name} (${org.code})`);
      console.log(`    Org ID: ${org.id}`);
      console.log(`    Role: ${org.primary_role}`);
      console.log(`    Apps:`, org.apps);
      console.log('');
    });
  } else {
    console.log('\n❌ No organizations returned by RPC');
  }
}

console.log('\n' + '='.repeat(70));
console.log('📊 DIAGNOSIS:');
console.log('='.repeat(70));
console.log('\nIf relationships exist but RPC returns 0 orgs:');
console.log('  1. Check relationship_type (must be MEMBER_OF)');
console.log('  2. Check to_entity_id points to core_organizations.id');
console.log('  3. Check hera_auth_introspect_v1 RPC function logic');
console.log('  4. Check if relationship is active (no expiration_date or future)');
console.log('');
