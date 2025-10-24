#!/usr/bin/env node
/**
 * Test hera_onboard_user_v1 function
 * Check how it creates user-organization relationships
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Testing hera_onboard_user_v1 Function');
console.log('='.repeat(70));

// Step 1: Check if function exists
console.log('\n📋 Step 1: Checking if function exists...');
try {
  const { error } = await supabase.rpc('hera_onboard_user_v1');

  if (error) {
    console.log('   ℹ️  Function signature info:', error.message);
    console.log('   Details:', error.details);
  }
} catch (err) {
  console.log('   ℹ️  Info:', err.message);
}

// Step 2: Try calling with test parameters
console.log('\n📋 Step 2: Testing with parameters...');

const testEmail = 'test-onboard-' + Date.now() + '@test.com';
const testOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'; // Existing Hair Talkz org

try {
  const { data, error } = await supabase.rpc('hera_onboard_user_v1', {
    p_email: testEmail,
    p_organization_id: testOrgId,
    p_role: 'owner'
  });

  if (error) {
    console.log('   ❌ Error:', error.message);
    console.log('   Code:', error.code);
    console.log('   Details:', error.details);
    console.log('   Hint:', error.hint);
  } else {
    console.log('   ✅ Success!');
    console.log('   Result:', JSON.stringify(data, null, 2));
  }
} catch (err) {
  console.log('   ❌ Exception:', err.message);
}

// Step 3: Try with minimal params
console.log('\n📋 Step 3: Trying minimal parameters...');
try {
  const { data, error } = await supabase.rpc('hera_onboard_user_v1', {
    p_user_email: testEmail
  });

  if (error) {
    console.log('   ❌ Error:', error.message);
  } else {
    console.log('   ✅ Success!');
    console.log('   Result:', data);
  }
} catch (err) {
  console.log('   ❌ Exception:', err.message);
}

// Step 4: Try with user_id and org_id
console.log('\n📋 Step 4: Trying with user_id and org_id...');

const testUserId = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a';

try {
  const { data, error } = await supabase.rpc('hera_onboard_user_v1', {
    p_user_id: testUserId,
    p_org_id: testOrgId,
    p_role: 'manager'
  });

  if (error) {
    console.log('   ❌ Error:', error.message);
  } else {
    console.log('   ✅ Success!');
    console.log('   Result:', data);
  }
} catch (err) {
  console.log('   ❌ Exception:', err.message);
}

// Step 5: Search for onboard-related functions
console.log('\n📋 Step 5: Searching for onboard functions...');
try {
  const { data, error } = await supabase
    .from('pg_proc')
    .select('proname, proargnames')
    .like('proname', '%onboard%')
    .order('proname');

  if (error) {
    console.log('   ❌ Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('   ✅ Found onboard functions:');
    data.forEach(fn => {
      console.log(`      - ${fn.proname}`);
      if (fn.proargnames) {
        console.log(`        Args: ${fn.proargnames.join(', ')}`);
      }
    });
  } else {
    console.log('   ℹ️  No onboard functions found');
  }
} catch (err) {
  console.log('   ❌ Exception:', err.message);
}

// Step 6: Look at existing working memberships to understand pattern
console.log('\n📋 Step 6: Analyzing existing memberships...');
try {
  const { data, error } = await supabase
    .from('core_relationships')
    .select('from_entity_id, to_entity_id, organization_id, relationship_type, relationship_data, smart_code')
    .eq('relationship_type', 'MEMBER_OF')
    .eq('organization_id', testOrgId)
    .limit(3);

  if (error) {
    console.log('   ❌ Error:', error.message);
  } else {
    console.log('   ✅ Found', data.length, 'memberships:');
    data.forEach((rel, i) => {
      console.log(`\n   [${i + 1}] Membership:`);
      console.log(`       from_entity_id: ${rel.from_entity_id} (user)`);
      console.log(`       to_entity_id: ${rel.to_entity_id} (org)`);
      console.log(`       organization_id: ${rel.organization_id}`);
      console.log(`       role: ${rel.relationship_data?.role}`);
      console.log(`       smart_code: ${rel.smart_code}`);
    });
  }
} catch (err) {
  console.log('   ❌ Exception:', err.message);
}

console.log('\n' + '='.repeat(70));
console.log('📊 ANALYSIS');
console.log('='.repeat(70));
console.log('\nFrom existing memberships, the pattern is:');
console.log('  - from_entity_id: User ID (from Supabase auth)');
console.log('  - to_entity_id: Organization ID');
console.log('  - organization_id: Organization ID (same as to_entity_id)');
console.log('  - relationship_type: MEMBER_OF');
console.log('  - relationship_data: { role: "owner" | "manager" | etc }');
console.log('  - smart_code: HERA.PLATFORM.REL.MEMBER_OF.USER.v1');
console.log('');
console.log('For signup flow, we need to:');
console.log('1. Check if hera_onboard_user_v1 exists and works');
console.log('2. If not, create membership directly via core_relationships');
console.log('3. Ensure to_entity_id points to organization ID');
console.log('');
