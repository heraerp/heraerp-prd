#!/usr/bin/env node
/**
 * Fix demo user auth mapping issue
 * The hera_auth_introspect_v1 RPC needs proper auth_uid to user_entity mapping
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const demoAuthUid = 'a55cc033-e909-4c59-b974-8ff3e098f2bf';
const demoUserEntityId = '4d93b3f8-dfe8-430c-83ea-3128f6a520cf';

async function fixDemoUserMapping() {
  console.log('🔧 Diagnosing demo user auth mapping issue...\n');

  // 1. Check if there's an auth.users record with the entity ID as its ID
  console.log('1️⃣ Checking if auth.users exists with entity ID as primary key...');
  const { data: authByEntityId, error: authError1 } = await supabase.auth.admin.getUserById(demoUserEntityId);

  if (!authError1 && authByEntityId?.user) {
    console.log('✅ Found auth user with entity ID!');
    console.log('   Email:', authByEntityId.user.email);
    console.log('   This means the RPC expects user entity ID, not auth UID');
  } else {
    console.log('❌ No auth user found with entity ID');
  }

  // 2. Check actual auth.users record
  console.log('\n2️⃣ Checking actual auth.users record...');
  const { data: authByAuthUid, error: authError2 } = await supabase.auth.admin.getUserById(demoAuthUid);

  if (!authError2 && authByAuthUid?.user) {
    console.log('✅ Found auth user with auth UID!');
    console.log('   Email:', authByAuthUid.user.email);
    console.log('   Created:', authByAuthUid.user.created_at);
  }

  // 3. The solution: The hera_auth_introspect_v1 needs BOTH to work
  // It tries auth UID first, if not found, it should look up by metadata
  console.log('\n3️⃣ Proposed Solution:');
  console.log('The RPC hera_auth_introspect_v1 should:');
  console.log('a) First try to find USER entity where metadata->>supabase_user_id = p_actor_user_id');
  console.log('b) If not found, try to find USER entity where id = p_actor_user_id');
  console.log('');
  console.log('Current USER entity metadata:');

  const { data: userEntity } = await supabase
    .from('core_entities')
    .select('metadata')
    .eq('id', demoUserEntityId)
    .single();

  console.log(JSON.stringify(userEntity?.metadata, null, 2));

  console.log('\n4️⃣ Workaround: Query directly to verify data is correct...');

  // Check memberships via relationships
  const { data: memberships } = await supabase
    .from('core_relationships')
    .select(`
      id,
      from_entity_id,
      to_entity_id,
      relationship_type,
      relationship_data,
      is_active
    `)
    .eq('from_entity_id', demoUserEntityId)
    .eq('relationship_type', 'USER_HAS_ROLE')
    .eq('is_active', true);

  console.log('Memberships found:', memberships?.length || 0);
  if (memberships && memberships.length > 0) {
    console.log(JSON.stringify(memberships[0], null, 2));
  }

  console.log('\n📋 DIAGNOSIS COMPLETE');
  console.log('The issue is that hera_auth_introspect_v1 RPC is not finding the user');
  console.log('when passed the auth UID. It needs to look up USER entity by');
  console.log('metadata->supabase_user_id field.');
}

fixDemoUserMapping();
