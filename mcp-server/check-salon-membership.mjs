#!/usr/bin/env node
/**
 * Check salon user membership in organization
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const orgId = 'de5f248d-7747-44f3-9d11-a279f3158fa5'; // HERA Salon Demo
const authUserId = 'ebd0e099-e25a-476b-b6dc-4b3c26fae4a7'; // salon@heraerp.com

console.log('🔍 Checking salon user membership...');
console.log('📋 Organization ID:', orgId);
console.log('👤 Auth User ID:', authUserId);
console.log('');

try {
  // Step 1: Find USER entity for this auth user
  console.log('1️⃣ Finding USER entity for auth user...');

  const { data: userEntities } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', '00000000-0000-0000-0000-000000000000') // Platform org
    .eq('entity_type', 'USER');

  console.log(`   Found ${userEntities?.length || 0} USER entities in platform org`);

  // Find the one that matches our auth user
  const userEntity = userEntities?.find(u =>
    u.metadata?.auth_user_id === authUserId ||
    u.metadata?.supabase_user_id === authUserId ||
    u.entity_code?.includes(authUserId.substring(0, 8))
  );

  if (!userEntity) {
    console.log('   ❌ USER entity NOT found for auth user');
    console.log('');
    console.log('💡 This is the problem! Actor validation requires:');
    console.log('   1. USER entity exists in platform org (00000000...)');
    console.log('   2. USER entity has metadata.auth_user_id or metadata.supabase_user_id');
    console.log('   3. MEMBER_OF relationship exists to target organization');
    process.exit(1);
  }

  console.log('   ✅ USER entity found:');
  console.log('      Entity ID:', userEntity.id);
  console.log('      Entity Name:', userEntity.entity_name);
  console.log('      Entity Code:', userEntity.entity_code);
  console.log('      Metadata:', JSON.stringify(userEntity.metadata, null, 2));
  console.log('');

  // Step 2: Check MEMBER_OF relationships
  console.log('2️⃣ Checking MEMBER_OF relationships...');

  const { data: memberships, error: memberError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', userEntity.id)
    .eq('relationship_type', 'MEMBER_OF')
    .eq('is_active', true);

  if (memberError) {
    console.log('   ❌ Error:', memberError);
    process.exit(1);
  }

  console.log(`   Found ${memberships?.length || 0} active memberships`);
  console.log('');

  if (memberships && memberships.length > 0) {
    memberships.forEach(m => {
      console.log(`   📋 Membership:`);
      console.log(`      ID: ${m.id}`);
      console.log(`      Organization ID: ${m.organization_id}`);
      console.log(`      Target Entity ID: ${m.to_entity_id}`);
      console.log(`      Is Target Org?: ${m.organization_id === orgId ? '✅ YES' : '❌ NO'}`);
      console.log('');
    });
  }

  // Step 3: Check specific membership to salon org
  console.log('3️⃣ Checking membership to HERA Salon Demo org...');

  const salonMembership = memberships?.find(m => m.organization_id === orgId);

  if (salonMembership) {
    console.log('   ✅ Membership EXISTS!');
    console.log('      Membership ID:', salonMembership.id);
    console.log('      Created:', salonMembership.created_at);
  } else {
    console.log('   ❌ Membership NOT FOUND!');
    console.log('');
    console.log('💡 This is why UPDATE fails with HERA_ACTOR_NOT_MEMBER');
    console.log('');
    console.log('🔧 SOLUTION: Create MEMBER_OF relationship');
    console.log('   - From: USER entity ID:', userEntity.id);
    console.log('   - To: Organization entity (needs to exist in core_entities)');
    console.log('   - Relationship Type: MEMBER_OF');
    console.log('   - Organization ID:', orgId);
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(60));

  console.log('Auth User ID:', authUserId);
  console.log('User Entity ID:', userEntity?.id || 'NOT FOUND');
  console.log('Membership to Salon Org:', salonMembership ? '✅ EXISTS' : '❌ MISSING');
  console.log('Can Update Org:', salonMembership ? '✅ YES' : '❌ NO (Actor not member)');

} catch (error) {
  console.error('💥 Unexpected error:', error);
}
