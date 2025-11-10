import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WMS_USER_ID = 'b172d7c4-92af-4595-a999-e073deda7c92';
const WMS_USER_SUPABASE_UID = '04102715-4b65-449f-ac5b-5a138bc1c46b';

console.log('🔧 WMS User Fix Script\n');
console.log('=' .repeat(70));

// Step 1: Check if WMS organization exists
console.log('\n📦 Step 1: Checking for WMS organization...\n');

let wmsOrgId = null;

const { data: existingOrgs, error: searchError } = await supabase
  .from('core_organizations')
  .select('*')
  .or('organization_code.eq.WMS,organization_name.ilike.%warehouse%');

if (searchError) {
  console.error('❌ Error searching for WMS org:', searchError);
  process.exit(1);
}

if (existingOrgs && existingOrgs.length > 0) {
  console.log(`✅ Found existing organization that could be WMS:`);
  existingOrgs.forEach((org, idx) => {
    console.log(`\n   [${idx + 1}] ${org.organization_name} (${org.organization_code})`);
    console.log(`       ID: ${org.id}`);
    console.log(`       Settings:`, JSON.stringify(org.settings || {}, null, 2));
  });

  // Use first matching org as WMS org
  wmsOrgId = existingOrgs[0].id;
  console.log(`\n✅ Using org: ${existingOrgs[0].organization_name} (${wmsOrgId})`);
} else {
  console.log('❌ No WMS organization found. Creating new one...\n');

  // Create WMS organization
  const { data: newOrg, error: createOrgError } = await supabase
    .from('core_organizations')
    .insert({
      organization_name: 'WMS Logistics',
      organization_code: 'WMS',
      organization_type: 'business',
      industry_classification: 'logistics',
      settings: {
        apps: [
          {
            code: 'WMS',
            name: 'Warehouse Management System',
            config: {}
          }
        ],
        default_app_code: 'WMS'
      },
      status: 'active',
      created_by: WMS_USER_ID,
      updated_by: WMS_USER_ID
    })
    .select()
    .single();

  if (createOrgError) {
    console.error('❌ Error creating WMS organization:', createOrgError);
    process.exit(1);
  }

  wmsOrgId = newOrg.id;
  console.log(`✅ Created WMS organization: ${newOrg.organization_name}`);
  console.log(`   ID: ${wmsOrgId}`);
  console.log(`   Settings:`, JSON.stringify(newOrg.settings, null, 2));
}

// Step 2: Check if membership already exists
console.log('\n\n👤 Step 2: Checking for existing membership...\n');

const { data: existingMembership, error: membershipCheckError } = await supabase
  .from('core_relationships')
  .select('*')
  .eq('source_entity_id', WMS_USER_ID)
  .eq('target_entity_id', wmsOrgId)
  .eq('relationship_type', 'USER_MEMBER_OF_ORG')
  .maybeSingle();

if (membershipCheckError) {
  console.error('❌ Error checking membership:', membershipCheckError);
}

if (existingMembership) {
  console.log('✅ Membership already exists!');
  console.log('   Relationship ID:', existingMembership.id);
  console.log('   Relationship Data:', JSON.stringify(existingMembership.relationship_data || {}, null, 2));
} else {
  console.log('❌ No membership found. Creating new membership...\n');

  // Create membership relationship
  const { data: newMembership, error: createMembershipError } = await supabase
    .from('core_relationships')
    .insert({
      source_entity_id: WMS_USER_ID,
      target_entity_id: wmsOrgId,
      organization_id: wmsOrgId,
      relationship_type: 'USER_MEMBER_OF_ORG',
      relationship_data: {
        roles: ['org_owner'],
        joined_at: new Date().toISOString()
      },
      created_by: WMS_USER_ID,
      updated_by: WMS_USER_ID
    })
    .select()
    .single();

  if (createMembershipError) {
    console.error('❌ Error creating membership:', createMembershipError);
    process.exit(1);
  }

  console.log('✅ Created membership relationship!');
  console.log('   Relationship ID:', newMembership.id);
  console.log('   Role: org_owner');
}

// Step 3: Verify with introspection
console.log('\n\n🔐 Step 3: Verifying with auth introspection...\n');

const { data: authContext, error: introspectError } = await supabase.rpc('hera_auth_introspect_v1', {
  p_actor_user_id: WMS_USER_ID
});

if (introspectError) {
  console.error('❌ Introspection error:', introspectError);
} else {
  console.log('✅ Auth Introspection Result:');
  console.log(`   Organization Count: ${authContext.organization_count}`);
  console.log(`   Default Org ID: ${authContext.default_organization_id}`);

  if (authContext.organizations && authContext.organizations.length > 0) {
    authContext.organizations.forEach((org, idx) => {
      console.log(`\n   [${idx + 1}] ${org.name} (${org.code})`);
      console.log(`      Org ID: ${org.id}`);
      console.log(`      Role: ${org.primary_role}`);
      console.log(`      Apps:`, org.apps);
    });
  }
}

// Step 4: Update organization settings if no apps
if (wmsOrgId) {
  console.log('\n\n⚙️  Step 4: Ensuring WMS app in organization settings...\n');

  const { data: currentOrg, error: fetchError } = await supabase
    .from('core_organizations')
    .select('settings')
    .eq('id', wmsOrgId)
    .single();

  if (fetchError) {
    console.error('❌ Error fetching org:', fetchError);
  } else {
    const currentApps = currentOrg.settings?.apps || [];

    if (currentApps.length === 0 || !currentApps.some(app => app.code === 'WMS')) {
      console.log('❌ WMS app not in settings. Adding...\n');

      const { error: updateError } = await supabase
        .from('core_organizations')
        .update({
          settings: {
            ...currentOrg.settings,
            apps: [
              {
                code: 'WMS',
                name: 'Warehouse Management System',
                config: {}
              }
            ],
            default_app_code: 'WMS'
          },
          updated_by: WMS_USER_ID
        })
        .eq('id', wmsOrgId);

      if (updateError) {
        console.error('❌ Error updating settings:', updateError);
      } else {
        console.log('✅ Added WMS app to organization settings');
      }
    } else {
      console.log('✅ WMS app already in organization settings');
    }
  }
}

console.log('\n\n' + '='.repeat(70));
console.log('✅ FIX COMPLETE!');
console.log('='.repeat(70));
console.log('\n📋 Next Steps:');
console.log('   1. Clear browser localStorage');
console.log('   2. Login with wms@heraerp.com');
console.log('   3. Should now route to /wms (or first app in settings)');
console.log('\n⚠️  Note: /wms page must exist in the codebase');
console.log('   If /wms page doesn\'t exist, add it to role-normalizer.ts\n');
