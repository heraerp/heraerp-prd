#!/usr/bin/env node
/**
 * Check which RPC functions exist and work
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEST_USER_ID = '4578ce6d-db51-4838-9dc9-faca4cbe30bb'; // hairtalkz01@gmail.com

console.log('🔍 Checking RPC functions...\n');

// Test 1: resolve_user_identity_v1
console.log('1. Testing resolve_user_identity_v1:');
try {
  const { data, error } = await supabase.rpc('resolve_user_identity_v1');
  if (error) {
    console.log('   ❌ Error:', error.message);
    console.log('   Code:', error.code);
  } else {
    console.log('   ✅ Success');
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
} catch (err) {
  console.log('   ❌ Exception:', err.message);
}

console.log();

// Test 2: resolve_user_roles_in_org
console.log('2. Testing resolve_user_roles_in_org:');
try {
  const { data, error } = await supabase.rpc('resolve_user_roles_in_org', {
    p_org: '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  });
  if (error) {
    console.log('   ❌ Error:', error.message);
    console.log('   Code:', error.code);
  } else {
    console.log('   ✅ Success');
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
} catch (err) {
  console.log('   ❌ Exception:', err.message);
}

console.log();

// Test 3: Direct query to check user's memberships
console.log('3. Direct query - User memberships:');
try {
  const { data, error } = await supabase
    .from('core_relationships')
    .select('to_entity_id, organization_id, relationship_data, is_active')
    .eq('from_entity_id', TEST_USER_ID)
    .eq('relationship_type', 'MEMBER_OF')
    .eq('is_active', true);

  if (error) {
    console.log('   ❌ Error:', error.message);
  } else {
    console.log('   ✅ Found', data.length, 'memberships');
    data.forEach((rel, i) => {
      console.log(`   [${i + 1}] Org: ${rel.organization_id}`);
      console.log(`       Role: ${rel.relationship_data?.role || 'none'}`);
    });
  }
} catch (err) {
  console.log('   ❌ Exception:', err.message);
}

console.log();

// Test 4: Check what functions exist
console.log('4. Querying pg_proc for HERA functions:');
try {
  const { data, error } = await supabase
    .from('pg_proc')
    .select('proname')
    .like('proname', 'resolve%')
    .order('proname');

  if (error) {
    console.log('   ❌ Error:', error.message);
  } else if (data) {
    console.log('   ✅ Found functions:');
    data.forEach(fn => console.log(`      - ${fn.proname}`));
  }
} catch (err) {
  console.log('   ❌ Exception:', err.message);
}

console.log('\n' + '='.repeat(70));
console.log('RECOMMENDATIONS');
console.log('='.repeat(70));
console.log('\nIf resolve_user_identity_v1 does not exist:');
console.log('1. Create the RPC function in Supabase');
console.log('2. OR update verifyAuth to use direct queries');
console.log('3. OR use /api/v2/auth/resolve-membership pattern\n');
