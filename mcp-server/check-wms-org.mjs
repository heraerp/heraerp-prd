import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWMSOrg() {
  console.log('🔍 Checking for WMS organizations...\n');

  // 1. Find all organizations with WMS in name or code
  const { data: orgs, error: orgError } = await supabase
    .from('core_organizations')
    .select('id, name, code, industry, settings, created_at')
    .or('name.ilike.%wms%,code.ilike.%wms%');

  if (orgError) {
    console.error('❌ Error finding WMS organizations:', orgError);
    return;
  }

  if (!orgs || orgs.length === 0) {
    console.log('❌ No WMS organizations found in database');
    console.log('   Searching for all organizations...\n');

    const { data: allOrgs, error: allError } = await supabase
      .from('core_organizations')
      .select('id, name, code, industry, settings')
      .limit(10);

    if (!allError && allOrgs) {
      console.log('📋 Available organizations:');
      allOrgs.forEach((org, idx) => {
        console.log(`   [${idx + 1}] ${org.name} (${org.code})`);
        console.log('      ID:', org.id);
        console.log('      Settings:', JSON.stringify(org.settings || {}, null, 2));
      });
    }
    return;
  }

  console.log(`✅ Found ${orgs.length} WMS organization(s):\n`);

  for (const org of orgs) {
    console.log(`📦 ${org.name} (${org.code})`);
    console.log('   ID:', org.id);
    console.log('   Industry:', org.industry);
    console.log('   Settings:', JSON.stringify(org.settings || {}, null, 2));

    // Check if WMS user is member
    const { data: memberships, error: memberError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', org.id)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .eq('source_entity_id', 'b172d7c4-92af-4595-a999-e073deda7c92'); // WMS user ID

    console.log('   WMS User Membership:', memberships?.length > 0 ? '✅ MEMBER' : '❌ NOT MEMBER');

    if (memberships && memberships.length > 0) {
      console.log('   Relationship ID:', memberships[0].id);
      console.log('   Relationship Data:', JSON.stringify(memberships[0].relationship_data || {}, null, 2));
    }

    console.log('');
  }

  // Check what organization WMS user actually belongs to
  console.log('\n🔍 Checking actual memberships for WMS user...');
  const { data: actualMemberships, error: actualError } = await supabase
    .from('core_relationships')
    .select('*, core_organizations!inner(id, name, code, settings)')
    .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    .eq('source_entity_id', 'b172d7c4-92af-4595-a999-e073deda7c92');

  if (actualMemberships && actualMemberships.length > 0) {
    console.log(`   ✅ WMS user is member of ${actualMemberships.length} organization(s):`);
    actualMemberships.forEach((mem, idx) => {
      console.log(`   [${idx + 1}] ${mem.core_organizations.name} (${mem.core_organizations.code})`);
      console.log('      Org ID:', mem.core_organizations.id);
      console.log('      Settings:', JSON.stringify(mem.core_organizations.settings || {}, null, 2));
    });
  } else {
    console.log('   ❌ WMS user has NO organization memberships!');
  }
}

checkWMSOrg().catch(console.error);
