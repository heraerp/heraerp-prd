#!/usr/bin/env node
/**
 * Test and discover the resolve_user function behavior
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SALON_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

async function testResolveUserFunction() {
  console.log('🔍 Testing resolve_user function...\n');

  const testUsers = [
    { name: 'Owner', authUserId: '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a', email: 'Hairtalkz2022@gmail.com' },
    { name: 'Receptionist 1', authUserId: '4578ce6d-db51-4838-9dc9-faca4cbe30bb', email: 'hairtalkz01@gmail.com' },
    { name: 'Receptionist 2', authUserId: 'b3fcd455-7df2-42d2-bdd1-c962636cc8a7', email: 'hairtalkz02@gmail.com' }
  ];

  // First, try to discover the function signature
  console.log('═══════════════════════════════════════════════════════');
  console.log('Discovering resolve_user function signature...\n');

  try {
    const { data, error } = await supabase.rpc('resolve_user', {});

    if (error) {
      console.log('Error response (reveals signature):');
      console.log(`   Message: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Hint: ${error.hint || 'N/A'}\n`);
    } else {
      console.log('Unexpected success with no parameters:', data);
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }

  // Try different parameter combinations
  console.log('═══════════════════════════════════════════════════════');
  console.log('Testing parameter combinations...\n');

  const testUser = testUsers[0];

  // Test 1: Just user ID
  console.log('Test 1: p_user_id only\n');
  try {
    const { data, error } = await supabase.rpc('resolve_user', {
      p_user_id: testUser.authUserId
    });

    if (error) {
      console.log('❌ Error:', error.message);
      if (error.hint) console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Success!');
      console.log('   Result:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  // Test 2: User ID + Organization ID
  console.log('\n\nTest 2: p_user_id + p_organization_id\n');
  try {
    const { data, error } = await supabase.rpc('resolve_user', {
      p_user_id: testUser.authUserId,
      p_organization_id: SALON_ORG_ID
    });

    if (error) {
      console.log('❌ Error:', error.message);
      if (error.hint) console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Success!');
      console.log('   Result:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  // Test 3: Supabase user ID variant
  console.log('\n\nTest 3: p_supabase_user_id + p_organization_id\n');
  try {
    const { data, error } = await supabase.rpc('resolve_user', {
      p_supabase_user_id: testUser.authUserId,
      p_organization_id: SALON_ORG_ID
    });

    if (error) {
      console.log('❌ Error:', error.message);
      if (error.hint) console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Success!');
      console.log('   Result:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('Testing all three users with discovered signature...\n');

  for (const user of testUsers) {
    console.log(`\n👤 ${user.name} (${user.email}):`);
    console.log(`   Auth User ID: ${user.authUserId}`);

    // Try the most likely signature based on errors above
    const { data, error } = await supabase.rpc('resolve_user', {
      p_supabase_user_id: user.authUserId,
      p_organization_id: SALON_ORG_ID
    });

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✅ Resolved successfully!`);
      console.log(`   User Entity ID: ${data?.user_entity_id || data?.id || 'N/A'}`);
      console.log(`   Email: ${data?.email || 'N/A'}`);
      console.log(`   Is Member: ${data?.is_member || data?.has_membership || 'N/A'}`);
      console.log(`   Organization: ${data?.organization_id || 'N/A'}`);
      console.log(`   Full Result: ${JSON.stringify(data, null, 2)}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
}

testResolveUserFunction().catch(console.error);
