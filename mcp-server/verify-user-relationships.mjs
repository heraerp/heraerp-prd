#!/usr/bin/env node
/**
 * Verify MEMBER_OF and HAS_ROLE relationships for Hairtalkz users
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

const USERS = [
  { email: 'hairtalkz2022@gmail.com', id: '001a2eb9-b14c-4dda-ae8c-595fb377a982', role: 'ORG_OWNER' },
  { email: 'hairtalkz01@gmail.com', id: '4e1340cf-fefc-4d21-92ee-a8c4a244364b', role: 'ORG_EMPLOYEE' },
  { email: 'hairtalkz02@gmail.com', id: '4afcbd3c-2641-4d5a-94ea-438a0bb9b99d', role: 'ORG_EMPLOYEE' }
];

console.log('🔍 VERIFYING USER RELATIONSHIPS');
console.log('=' .repeat(70));
console.log(`Organization ID: ${HAIRTALKZ_ORG_ID}\n`);

for (const user of USERS) {
  console.log('─'.repeat(70));
  console.log(`\n👤 User: ${user.email}`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Expected Role: ${user.role}\n`);

  // Check MEMBER_OF relationship
  const { data: memberOf, error: memberError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', user.id)
    .eq('organization_id', HAIRTALKZ_ORG_ID)
    .eq('relationship_type', 'MEMBER_OF');

  if (memberError) {
    console.error(`   ❌ Error querying MEMBER_OF:`, memberError.message);
  } else if (!memberOf || memberOf.length === 0) {
    console.log(`   ❌ MEMBER_OF: NOT FOUND`);
  } else {
    console.log(`   ✅ MEMBER_OF: Found`);
    console.log(`      Relationship ID: ${memberOf[0].id}`);
    console.log(`      Is Active: ${memberOf[0].is_active}`);
    console.log(`      Role in Data: ${memberOf[0].relationship_data?.role || 'N/A'}`);
    console.log(`      Smart Code: ${memberOf[0].smart_code || 'N/A'}`);
  }

  // Check HAS_ROLE relationship
  const { data: hasRole, error: roleError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', user.id)
    .eq('organization_id', HAIRTALKZ_ORG_ID)
    .eq('relationship_type', 'HAS_ROLE');

  if (roleError) {
    console.error(`   ❌ Error querying HAS_ROLE:`, roleError.message);
  } else if (!hasRole || hasRole.length === 0) {
    console.log(`   ❌ HAS_ROLE: NOT FOUND`);
  } else {
    console.log(`\n   ✅ HAS_ROLE: Found (${hasRole.length} relationship(s))`);
    hasRole.forEach((rel, idx) => {
      console.log(`      [${idx + 1}] Relationship ID: ${rel.id}`);
      console.log(`          Is Active: ${rel.is_active}`);
      console.log(`          Role Code: ${rel.relationship_data?.role_code || 'N/A'}`);
      console.log(`          Is Primary: ${rel.relationship_data?.is_primary || false}`);
      console.log(`          Smart Code: ${rel.smart_code || 'N/A'}`);
    });
  }

  console.log();
}

// Summary query - all relationships for the organization
console.log('=' .repeat(70));
console.log('\n📊 COMPLETE RELATIONSHIP SUMMARY FOR ORGANIZATION\n');

const { data: allRels, error: allError } = await supabase
  .from('core_relationships')
  .select(`
    id,
    from_entity_id,
    to_entity_id,
    relationship_type,
    is_active,
    relationship_data
  `)
  .eq('organization_id', HAIRTALKZ_ORG_ID)
  .in('relationship_type', ['MEMBER_OF', 'HAS_ROLE'])
  .order('from_entity_id', { ascending: true })
  .order('relationship_type', { ascending: true });

if (allError) {
  console.error('❌ Error querying all relationships:', allError.message);
} else if (!allRels || allRels.length === 0) {
  console.log('⚠️  No relationships found for this organization');
} else {
  console.log(`Total Relationships: ${allRels.length}\n`);

  // Group by user
  const byUser = {};
  allRels.forEach(rel => {
    if (!byUser[rel.from_entity_id]) {
      byUser[rel.from_entity_id] = { MEMBER_OF: [], HAS_ROLE: [] };
    }
    byUser[rel.from_entity_id][rel.relationship_type].push(rel);
  });

  Object.entries(byUser).forEach(([userId, rels]) => {
    const user = USERS.find(u => u.id === userId);
    console.log(`👤 ${user?.email || userId}`);
    console.log(`   MEMBER_OF: ${rels.MEMBER_OF.length} (${rels.MEMBER_OF.filter(r => r.is_active).length} active)`);
    console.log(`   HAS_ROLE: ${rels.HAS_ROLE.length} (${rels.HAS_ROLE.filter(r => r.is_active).length} active)`);

    const primaryRole = rels.HAS_ROLE.find(r => r.relationship_data?.is_primary);
    if (primaryRole) {
      console.log(`   Primary Role: ${primaryRole.relationship_data?.role_code || 'N/A'}`);
    }
    console.log();
  });
}

console.log('=' .repeat(70));
console.log('\n✨ Verification Complete!\n');
