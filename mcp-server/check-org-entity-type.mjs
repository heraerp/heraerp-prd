#!/usr/bin/env node
/**
 * Check what entity_type organizations use in core_entities
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const orgId = 'de5f248d-7747-44f3-9d11-a279f3158fa5'; // HERA Salon Demo

console.log('🔍 Checking organization entity type in core_entities...');
console.log('📋 Organization ID:', orgId);
console.log('');

try {
  // Check with entity_type = 'ORGANIZATION'
  console.log('1️⃣ Checking with entity_type = "ORGANIZATION"...');
  const { data: orgEntity1, error: error1 } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', orgId)
    .eq('entity_type', 'ORGANIZATION')
    .maybeSingle();

  if (error1) {
    console.log('   ❌ Error:', error1.message);
  } else if (orgEntity1) {
    console.log('   ✅ Found!');
    console.log('   Entity Name:', orgEntity1.entity_name);
    console.log('   Entity Code:', orgEntity1.entity_code);
  } else {
    console.log('   ⚠️ Not found with entity_type = "ORGANIZATION"');
  }

  console.log('');

  // Check with entity_type = 'ORG'
  console.log('2️⃣ Checking with entity_type = "ORG"...');
  const { data: orgEntity2, error: error2 } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', orgId)
    .eq('entity_type', 'ORG')
    .maybeSingle();

  if (error2) {
    console.log('   ❌ Error:', error2.message);
  } else if (orgEntity2) {
    console.log('   ✅ Found!');
    console.log('   Entity Name:', orgEntity2.entity_name);
    console.log('   Entity Code:', orgEntity2.entity_code);
  } else {
    console.log('   ⚠️ Not found with entity_type = "ORG"');
  }

  console.log('');

  // Check if organization exists at all in core_entities
  console.log('3️⃣ Checking if organization exists in core_entities (any entity_type)...');
  const { data: anyOrgEntity, error: error3 } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', orgId)
    .maybeSingle();

  if (error3) {
    console.log('   ❌ Error:', error3.message);
  } else if (anyOrgEntity) {
    console.log('   ✅ Found with entity_type:', anyOrgEntity.entity_type);
    console.log('   Entity Name:', anyOrgEntity.entity_name);
    console.log('   Entity Code:', anyOrgEntity.entity_code);
  } else {
    console.log('   ❌ NOT FOUND - Organization does not exist in core_entities table');
    console.log('');
    console.log('💡 This confirms the issue: Organization exists in core_organizations');
    console.log('   but NOT in core_entities, so the RPC cannot find it.');
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('📊 Checking all organization-type entities in the system...');
  console.log('');

  const { data: allOrgs, error: error4 } = await supabase
    .from('core_entities')
    .select('id, entity_type, entity_name, entity_code')
    .or('entity_type.eq.ORGANIZATION,entity_type.eq.ORG,entity_type.eq.organization,entity_type.eq.org')
    .limit(10);

  if (error4) {
    console.log('❌ Error:', error4.message);
  } else {
    console.log(`Found ${allOrgs?.length || 0} organization entities:`);
    if (allOrgs && allOrgs.length > 0) {
      allOrgs.forEach(org => {
        console.log(`   - ${org.entity_type}: ${org.entity_name} (${org.entity_code})`);
      });
    } else {
      console.log('   No organization entities found in core_entities');
    }
  }

} catch (error) {
  console.error('💥 Unexpected error:', error);
}
