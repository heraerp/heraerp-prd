import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WMS_USER_ID = 'b172d7c4-92af-4595-a999-e073deda7c92';

console.log('🔍 Complete WMS Setup Diagnostic\n');
console.log('=' .repeat(60));

// 1. Check WMS organizations
console.log('\n📦 Step 1: Finding WMS Organizations...\n');
const { data: wmsOrgs, error: orgError } = await supabase
  .from('core_organizations')
  .select('*')
  .or('organization_name.ilike.%wms%,organization_code.ilike.%wms%');

if (orgError) {
  console.error('❌ Error:', orgError);
} else if (!wmsOrgs || wmsOrgs.length === 0) {
  console.log('❌ No WMS organizations found');
} else {
  console.log(`✅ Found ${wmsOrgs.length} WMS organization(s):\n`);
  wmsOrgs.forEach(org => {
    console.log(`   📦 ${org.organization_name} (${org.organization_code})`);
    console.log(`      ID: ${org.id}`);
    console.log(`      Industry: ${org.industry_classification || 'N/A'}`);
    console.log(`      Settings:`, JSON.stringify(org.settings || {}, null, 2));
    console.log('');
  });
}

// 2. Check WMS user memberships
console.log('\n👤 Step 2: Checking WMS User Memberships...\n');
const { data: memberships, error: memError } = await supabase
  .from('core_relationships')
  .select('*, core_organizations!inner(*)')
  .eq('relationship_type', 'USER_MEMBER_OF_ORG')
  .eq('source_entity_id', WMS_USER_ID);

if (memError) {
  console.error('❌ Error:', memError);
} else if (!memberships || memberships.length === 0) {
  console.log(`❌ WMS user (${WMS_USER_ID}) has NO organization memberships!`);
  console.log('\n⚠️  This is the ROOT CAUSE of the routing issue.');
  console.log('   Without a membership, the user has no apps.');
  console.log('   The system falls back to /salon as default.\n');
} else {
  console.log(`✅ WMS user is member of ${memberships.length} organization(s):\n`);
  memberships.forEach((mem, idx) => {
    const org = mem.core_organizations;
    console.log(`   [${idx + 1}] ${org.organization_name} (${org.organization_code})`);
    console.log(`      Org ID: ${org.id}`);
    console.log(`      Settings:`, JSON.stringify(org.settings || {}, null, 2));
    console.log('');
  });
}

// 3. Check auth introspection
console.log('\n🔐 Step 3: Testing Auth Introspection RPC...\n');
const { data: authContext, error: introspectError } = await supabase.rpc('hera_auth_introspect_v1', {
  p_actor_user_id: WMS_USER_ID
});

if (introspectError) {
  console.error('❌ Introspection Error:', introspectError);
} else {
  console.log('✅ Auth Introspection Result:');
  console.log(`   Organization Count: ${authContext.organization_count}`);
  console.log(`   Default Org ID: ${authContext.default_organization_id || 'N/A'}`);

  if (authContext.organizations && authContext.organizations.length > 0) {
    console.log(`\n   Organizations:`);
    authContext.organizations.forEach((org, idx) => {
      console.log(`\n   [${idx + 1}] ${org.name} (${org.code})`);
      console.log(`      Role: ${org.primary_role}`);
      console.log(`      Apps:`, org.apps || []);
    });
  } else {
    console.log('\n   ❌ No organizations in introspection result');
  }
}

// 4. Recommendations
console.log('\n\n' + '='.repeat(60));
console.log('📋 DIAGNOSIS & SOLUTION:');
console.log('='.repeat(60));

if (!memberships || memberships.length === 0) {
  console.log('\n🚨 ISSUE: WMS user has no organization membership');
  console.log('\n✅ SOLUTION: Create membership relationship');
  console.log('\nSQL to fix (if WMS org exists):');
  console.log(`
INSERT INTO core_relationships (
  source_entity_id,
  target_entity_id,
  organization_id,
  relationship_type,
  relationship_data,
  created_by
)
VALUES (
  '${WMS_USER_ID}',                    -- WMS user entity ID
  '<WMS_ORG_ID>',                       -- Replace with actual WMS org ID
  '<WMS_ORG_ID>',                       -- Same as target
  'USER_MEMBER_OF_ORG',
  '{"roles": ["org_owner"]}'::jsonb,    -- Or appropriate role
  '${WMS_USER_ID}'                      -- Created by WMS user
);
  `.trim());
} else if (memberships.length > 0) {
  const org = memberships[0].core_organizations;
  const apps = org.settings?.apps || [];

  if (apps.length === 0) {
    console.log('\n🚨 ISSUE: Organization exists but has no apps configured');
    console.log('\n✅ SOLUTION: Add WMS app to organization settings');
    console.log(`\nSQL to fix:`);
    console.log(`
UPDATE core_organizations
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{apps}',
  '[
    {
      "code": "WMS",
      "name": "Warehouse Management",
      "config": {}
    }
  ]'::jsonb
)
WHERE id = '${org.id}';
    `.trim());
  } else {
    console.log('\n✅ Setup looks correct!');
    console.log('\nIf still routing to /salon, check:');
    console.log('1. Browser localStorage (clear it)');
    console.log('2. App code in settings.apps[0].code (must match role-normalizer.ts)');
    console.log('3. Login page logic (should use first app)');
  }
}

console.log('\n' + '='.repeat(60) + '\n');
