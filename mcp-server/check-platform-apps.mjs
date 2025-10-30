#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const PLATFORM_ORG = '00000000-0000-0000-0000-000000000000';

console.log('🔍 Querying PLATFORM organization apps...\n');

const { data: apps, error } = await supabase
  .from('core_entities')
  .select('id, entity_name, entity_code, entity_type, smart_code')
  .eq('organization_id', PLATFORM_ORG)
  .eq('entity_type', 'APP');

if (error) {
  console.error('❌ Error:', error);
} else if (!apps || apps.length === 0) {
  console.log('⚠️  No APP entities found in PLATFORM organization');
  console.log('   PLATFORM ORG ID:', PLATFORM_ORG);
} else {
  console.log(`✅ Found ${apps.length} APP(s) in PLATFORM organization:\n`);
  apps.forEach(app => {
    console.log(`   - ${app.entity_name} (${app.entity_code})`);
    console.log(`     ID: ${app.id}`);
    console.log(`     Smart Code: ${app.smart_code}\n`);
  });
}

// Also check all organizations
console.log('\n🏢 All Organizations:');
const { data: orgs } = await supabase
  .from('core_organizations')
  .select('id, organization_name, organization_code')
  .limit(10);

orgs?.forEach(org => {
  console.log(`   - ${org.organization_name} (${org.organization_code || 'N/A'})`);
  console.log(`     ID: ${org.id}\n`);
});
