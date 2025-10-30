#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://awfcrncxngqwbhqapffb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.T061r8SLP6FWdTScZntvI22KjrVTMyXVU5yDLKP03I4'
);

async function main() {
  console.log('🔍 Checking for Greenworms organization...\n');

  // Check for specific org ID
  console.log('1. Checking for specific Greenworms organization ID: d4f50007-269b-4525-b534-cb5ddeed1d7e');
  const { data: specificOrg, error: specificError } = await supabase
    .from('core_organizations')
    .select('*')
    .eq('id', 'd4f50007-269b-4525-b534-cb5ddeed1d7e');

  if (specificError) {
    console.error('   ❌ Error:', specificError);
  } else if (specificOrg.length > 0) {
    console.log('   ✅ Found specific organization:');
    console.log(JSON.stringify(specificOrg[0], null, 2));
  } else {
    console.log('   ⚠️ Organization with ID d4f50007-269b-4525-b534-cb5ddeed1d7e not found');
  }

  // Search for greenworms by name
  console.log('\n2. Searching for organizations with "greenworms" in name...');
  const { data: nameSearch, error: nameError } = await supabase
    .from('core_organizations')
    .select('*')
    .ilike('organization_name', '%greenworms%');

  if (nameError) {
    console.error('   ❌ Error:', nameError);
  } else if (nameSearch.length > 0) {
    console.log('   ✅ Found organizations:');
    nameSearch.forEach(org => {
      console.log(`     - ${org.id}: ${org.organization_name}`);
    });
  } else {
    console.log('   ⚠️ No organizations found with "greenworms" in name');
  }

  // List all organizations to see what exists
  console.log('\n3. Listing all organizations (last 10)...');
  const { data: allOrgs, error: allError } = await supabase
    .from('core_organizations')
    .select('id, organization_name, organization_type, status')
    .order('created_at', { ascending: false })
    .limit(10);

  if (allError) {
    console.error('   ❌ Error:', allError);
  } else {
    console.log('   Organizations found:');
    allOrgs.forEach(org => {
      console.log(`     - ${org.id}: ${org.organization_name} (${org.organization_type || 'N/A'}) - ${org.status || 'N/A'}`);
    });
  }

  // Check if we can create the Greenworms organization
  console.log('\n4. Checking if we need to create Greenworms organization...');
  
  if (specificOrg.length === 0 && nameSearch.length === 0) {
    console.log('   🚧 Greenworms organization does not exist. Need to create it.');
    console.log('   📝 Recommended steps:');
    console.log('   1. Create organization with ID: d4f50007-269b-4525-b534-cb5ddeed1d7e');
    console.log('   2. Set name: "Greenworms Waste Management"');
    console.log('   3. Set type: "waste_management"');
    console.log('   4. Add team@hanaset.com as admin user');
  } else {
    console.log('   ✅ Greenworms organization already exists');
  }

  console.log('\n🎯 Summary:');
  console.log(`   - Specific ID exists: ${specificOrg.length > 0 ? 'YES' : 'NO'}`);
  console.log(`   - Name matches exist: ${nameSearch.length > 0 ? 'YES' : 'NO'}`);
  console.log(`   - Total organizations in system: ${allOrgs.length}`);
}

main().catch(console.error);