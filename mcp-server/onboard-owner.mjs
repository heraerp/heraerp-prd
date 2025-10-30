#!/usr/bin/env node
/**
 * Onboard the existing Hairtalkz Owner user
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

console.log('👑 ONBOARDING HAIRTALKZ OWNER\n');

// Find the owner user by email
const { data: users, error: listError } = await supabase.auth.admin.listUsers();

if (listError) {
  console.error('❌ Error listing users:', listError.message);
  process.exit(1);
}

const ownerUser = users.users.find(u => u.email?.toLowerCase() === 'hairtalkz2022@gmail.com');

if (!ownerUser) {
  console.error('❌ Owner user not found: hairtalkz2022@gmail.com');
  process.exit(1);
}

console.log(`✅ Found owner user:`);
console.log(`   Email: ${ownerUser.email}`);
console.log(`   ID: ${ownerUser.id}\n`);

// Onboard as owner
console.log('🔗 Onboarding to Hairtalkz organization...');
console.log(`   Organization ID: ${HAIRTALKZ_ORG_ID}`);
console.log(`   Role: owner\n`);

const { data, error } = await supabase.rpc('hera_onboard_user_v1', {
  p_supabase_user_id: ownerUser.id,
  p_organization_id: HAIRTALKZ_ORG_ID,
  p_actor_user_id: ownerUser.id,
  p_role: 'owner'
});

if (error) {
  console.error('❌ Onboarding failed:', error.message);
  if (error.hint) console.error('💡 Hint:', error.hint);
  process.exit(1);
}

console.log('✅ Onboarding successful!\n');
console.log('📊 Result:', JSON.stringify(data, null, 2));

// Verify MEMBER_OF relationship
console.log('\n🔍 Verifying MEMBER_OF relationship...');

const { data: membership, error: memberError } = await supabase
  .from('core_relationships')
  .select('*')
  .eq('from_entity_id', ownerUser.id)
  .eq('organization_id', HAIRTALKZ_ORG_ID)
  .eq('relationship_type', 'MEMBER_OF');

if (!memberError && membership && membership.length > 0) {
  console.log('✅ MEMBER_OF relationship confirmed');
  console.log(`   Relationship ID: ${membership[0].id}`);
  console.log(`   Role: ${membership[0].relationship_data?.role || 'N/A'}`);
} else {
  console.log('⚠️  MEMBER_OF relationship NOT found');
}

// Verify HAS_ROLE relationship
console.log('\n🔍 Verifying HAS_ROLE relationship...');

const { data: hasRole, error: roleError } = await supabase
  .from('core_relationships')
  .select('*')
  .eq('from_entity_id', ownerUser.id)
  .eq('organization_id', HAIRTALKZ_ORG_ID)
  .eq('relationship_type', 'HAS_ROLE');

if (!roleError && hasRole && hasRole.length > 0) {
  console.log('✅ HAS_ROLE relationship confirmed');
  console.log(`   Relationship ID: ${hasRole[0].id}`);
  console.log(`   Role Code: ${hasRole[0].relationship_data?.role_code || 'N/A'}`);
  console.log(`   Is Primary: ${hasRole[0].relationship_data?.is_primary || false}`);
} else {
  console.log('⚠️  HAS_ROLE relationship NOT found');
}

console.log('\n✨ Owner onboarding complete!\n');
