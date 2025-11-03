#!/usr/bin/env node
/**
 * Test demo user login flow end-to-end
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const demoEmail = 'demo@heraerp.com';
const demoPassword = 'demo123';

async function testDemoLoginFlow() {
  console.log('🧪 Testing Demo User Login Flow...\n');

  // 1. Try to get JWT token by logging in as demo user
  console.log('1️⃣ Attempting login with demo credentials...');
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: demoEmail,
    password: demoPassword
  });

  if (authError) {
    console.error('❌ Login failed:', authError);
    return;
  }

  console.log('✅ Login successful!');
  console.log('   Auth UID:', authData.user.id);
  console.log('   Email:', authData.user.email);
  console.log('   JWT Token:', authData.session.access_token.substring(0, 50) + '...');

  // 2. Now test what the API would do - map auth UID to user entity ID
  console.log('\n2️⃣ Looking up USER entity by supabase_user_id...');
  
  const { data: userEntities, error: lookupError } = await supabase
    .from('core_entities')
    .select('id, entity_name, metadata')
    .eq('entity_type', 'USER')
    .contains('metadata', { supabase_user_id: authData.user.id })
    .limit(1);

  if (lookupError) {
    console.error('❌ User entity lookup error:', lookupError);
    return;
  }

  if (!userEntities || userEntities.length === 0) {
    console.error('❌ No USER entity found with supabase_user_id:', authData.user.id);
    return;
  }

  const userEntityId = userEntities[0].id;
  console.log('✅ Mapped to user entity:', userEntityId);
  console.log('   Entity name:', userEntities[0].entity_name);

  // 3. Test hera_auth_introspect_v1 with user entity ID
  console.log('\n3️⃣ Calling hera_auth_introspect_v1 with user entity ID...');
  
  const { data: authContext, error: introspectError } = await supabase.rpc('hera_auth_introspect_v1', {
    p_actor_user_id: userEntityId
  });

  if (introspectError) {
    console.error('❌ Introspect error:', introspectError);
    return;
  }

  if (!authContext || !authContext.organizations || authContext.organizations.length === 0) {
    console.error('❌ No organizations found for user');
    console.log('   Response:', JSON.stringify(authContext, null, 2));
    return;
  }

  console.log('✅ Organizations found:', authContext.organization_count);
  console.log('   Default org:', authContext.default_organization_id);
  console.log('   Organizations:');
  authContext.organizations.forEach(org => {
    console.log(`     - ${org.name} (${org.code})`);
    console.log(`       Roles: ${org.roles?.join(', ') || 'none'}`);
    console.log(`       Primary: ${org.primary_role}`);
  });

  console.log('\n✅ ALL TESTS PASSED - Demo user login flow is working correctly!');
}

testDemoLoginFlow().catch(console.error);
