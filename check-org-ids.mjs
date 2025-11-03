#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkOrgIds() {
  console.log('🔍 Checking Organization IDs for demo user...\n');

  const demoUserEntityId = '4d93b3f8-dfe8-430c-83ea-3128f6a520cf';

  // 1. Call hera_auth_introspect_v1
  const { data: authContext } = await supabase.rpc('hera_auth_introspect_v1', {
    p_actor_user_id: demoUserEntityId
  });

  console.log('1️⃣ From hera_auth_introspect_v1:');
  console.log(`   default_organization_id: ${authContext.default_organization_id}`);
  console.log(`   Organizations:`);
  authContext.organizations.forEach(org => {
    console.log(`      - ${org.name}`);
    console.log(`        id: ${org.id}`);
    console.log(`        code: ${org.code}`);
  });

  // 2. Check core_organizations for HERA ERP DEMO
  const { data: demoOrg } = await supabase
    .from('core_organizations')
    .select('*')
    .eq('organization_code', 'HERA-DEMO')
    .single();

  console.log('\n2️⃣ From core_organizations (HERA-DEMO):');
  console.log(`   id: ${demoOrg.id}`);
  console.log(`   organization_name: ${demoOrg.organization_name}`);
  console.log(`   organization_code: ${demoOrg.organization_code}`);

  // 3. Check MEMBER_OF relationship
  const { data: memberRel } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', demoUserEntityId)
    .eq('relationship_type', 'MEMBER_OF')
    .eq('is_active', true)
    .single();

  console.log('\n3️⃣ From core_relationships (MEMBER_OF):');
  console.log(`   to_entity_id: ${memberRel.to_entity_id}`);
  console.log(`   from_entity_id: ${memberRel.from_entity_id}`);

  // 4. Check if to_entity_id is an ORG entity
  const { data: orgEntity } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', memberRel.to_entity_id)
    .single();

  console.log('\n4️⃣ Target of MEMBER_OF relationship:');
  console.log(`   entity_id: ${orgEntity.id}`);
  console.log(`   entity_type: ${orgEntity.entity_type}`);
  console.log(`   entity_name: ${orgEntity.entity_name}`);
  console.log(`   organization_id: ${orgEntity.organization_id}`);

  console.log('\n🔍 CRITICAL DISCOVERY:');
  console.log(`   The MEMBER_OF relationship points to: ${memberRel.to_entity_id}`);
  console.log(`   But the core_organizations table has: ${demoOrg.id}`);
  console.log(`   Are they the same? ${memberRel.to_entity_id === demoOrg.id ? '✅ YES' : '❌ NO'}`);

  if (memberRel.to_entity_id !== demoOrg.id) {
    console.log('\n⚠️ MISMATCH DETECTED!');
    console.log('   The organization entity ID and organization row ID are different!');
    console.log(`   Organization Row ID: ${demoOrg.id}`);
    console.log(`   Organization Entity ID: ${memberRel.to_entity_id}`);
  }
}

checkOrgIds().catch(console.error);
