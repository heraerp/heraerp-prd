#!/usr/bin/env node
/**
 * Test ID mapping for hera_auth_introspect_v1
 * Tests whether RPC expects Supabase auth UID or USER entity ID
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testIDMapping() {
  console.log('🧪 Testing ID Mapping for hera_auth_introspect_v1\n');
  console.log('='.repeat(80));

  try {
    // Step 1: Find a real USER entity with supabase_user_id
    console.log('\n📋 Step 1: Finding USER entities with supabase_user_id...');

    const { data: userEntities, error: queryError } = await supabase
      .from('core_entities')
      .select('id, entity_name, metadata')
      .eq('entity_type', 'USER')
      .not('metadata', 'is', null)
      .limit(5);

    if (queryError) {
      console.error('❌ Query error:', queryError.message);
      return;
    }

    console.log(`✅ Found ${userEntities.length} USER entities\n`);

    // Display all USER entities
    userEntities.forEach((user, idx) => {
      const supabaseUserId = user.metadata?.supabase_user_id;
      console.log(`[${idx + 1}] ${user.entity_name}`);
      console.log(`    USER Entity ID: ${user.id}`);
      console.log(`    Supabase Auth ID: ${supabaseUserId || 'MISSING'}`);
      console.log('');
    });

    // Step 2: Test with FIRST user that has supabase_user_id
    const testUser = userEntities.find(u => u.metadata?.supabase_user_id);

    if (!testUser) {
      console.error('❌ No USER entity found with supabase_user_id in metadata');
      return;
    }

    const userEntityId = testUser.id;
    const supabaseAuthId = testUser.metadata.supabase_user_id;

    console.log('='.repeat(80));
    console.log('🧪 TEST USER SELECTED');
    console.log('='.repeat(80));
    console.log(`Name: ${testUser.entity_name}`);
    console.log(`USER Entity ID: ${userEntityId}`);
    console.log(`Supabase Auth ID: ${supabaseAuthId}`);
    console.log('');

    // Step 3: Test with USER Entity ID
    console.log('='.repeat(80));
    console.log('🧪 TEST 1: Call with USER Entity ID');
    console.log('='.repeat(80));
    console.log(`Calling hera_auth_introspect_v1({ p_actor_user_id: "${userEntityId}" })`);
    console.log('');

    const { data: test1Data, error: test1Error } = await supabase.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: userEntityId
    });

    if (test1Error) {
      console.error('❌ TEST 1 FAILED:', test1Error.message);
      if (test1Error.details) console.error('   Details:', test1Error.details);
      if (test1Error.hint) console.error('   Hint:', test1Error.hint);
    } else {
      console.log('✅ TEST 1 SUCCESS\n');
      console.log(`Organizations returned: ${test1Data?.organizations?.length || 0}`);

      if (test1Data?.organizations && test1Data.organizations.length > 0) {
        test1Data.organizations.forEach((org, idx) => {
          console.log(`\n[${idx + 1}] ${org.name}`);
          console.log(`    Org ID: ${org.id}`);
          console.log(`    Role: ${org.primary_role}`);
          console.log(`    Apps: ${org.apps?.length || 0}`);

          if (org.apps && org.apps.length > 0) {
            org.apps.forEach(app => {
              console.log(`       - ${app.code}: ${app.name}`);
            });
          }
        });
      }
    }

    // Step 4: Test with Supabase Auth ID
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TEST 2: Call with Supabase Auth ID');
    console.log('='.repeat(80));
    console.log(`Calling hera_auth_introspect_v1({ p_actor_user_id: "${supabaseAuthId}" })`);
    console.log('');

    const { data: test2Data, error: test2Error } = await supabase.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: supabaseAuthId
    });

    if (test2Error) {
      console.error('❌ TEST 2 FAILED:', test2Error.message);
      if (test2Error.details) console.error('   Details:', test2Error.details);
      if (test2Error.hint) console.error('   Hint:', test2Error.hint);
    } else {
      console.log('✅ TEST 2 SUCCESS\n');
      console.log(`Organizations returned: ${test2Data?.organizations?.length || 0}`);

      if (test2Data?.organizations && test2Data.organizations.length > 0) {
        test2Data.organizations.forEach((org, idx) => {
          console.log(`\n[${idx + 1}] ${org.name}`);
          console.log(`    Org ID: ${org.id}`);
          console.log(`    Role: ${org.primary_role}`);
          console.log(`    Apps: ${org.apps?.length || 0}`);

          if (org.apps && org.apps.length > 0) {
            org.apps.forEach(app => {
              console.log(`       - ${app.code}: ${app.name}`);
            });
          }
        });
      }
    }

    // Step 5: Comparison
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPARISON');
    console.log('='.repeat(80));

    const test1Success = !test1Error && test1Data?.organizations?.length > 0;
    const test2Success = !test2Error && test2Data?.organizations?.length > 0;

    console.log(`\nTEST 1 (USER Entity ID):    ${test1Success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`TEST 2 (Supabase Auth ID):  ${test2Success ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (test1Success && test2Success) {
      console.log('\n🎯 BOTH WORK! RPC accepts either ID type');
    } else if (test1Success) {
      console.log('\n🎯 CORRECT ID: Use USER Entity ID (from core_entities)');
      console.log('   The API should map: Supabase Auth ID → USER Entity ID → RPC');
    } else if (test2Success) {
      console.log('\n🎯 CORRECT ID: Use Supabase Auth ID (from auth.users)');
      console.log('   The API is passing wrong ID type!');
    } else {
      console.log('\n❌ NEITHER WORK! There may be a data issue');
    }

    console.log('\n' + '='.repeat(80));
    console.log('🔍 RECOMMENDATION');
    console.log('='.repeat(80));

    if (test1Success && !test2Success) {
      console.log('\n✅ The API endpoint /api/v2/auth/resolve-membership is CORRECT');
      console.log('   It maps Supabase auth UID → USER entity ID before calling RPC');
      console.log('   Lines 43-57: User entity lookup by metadata->supabase_user_id');
      console.log('   Line 67: Calls RPC with userEntityId');
    } else if (!test1Success && test2Success) {
      console.log('\n❌ The API endpoint needs to be FIXED');
      console.log('   It should pass Supabase auth UID directly to RPC');
      console.log('   Remove the entity lookup (lines 43-57)');
      console.log('   Pass authUserId directly (line 67)');
    } else if (test1Success && test2Success) {
      console.log('\n⚠️ RPC accepts BOTH ID types - check which is more reliable');
      console.log('   Recommend using USER Entity ID for consistency');
    }

    console.log('\n✅ Test complete\n');

  } catch (err) {
    console.error('❌ EXCEPTION:', err.message);
    console.error(err.stack);
  }
}

testIDMapping();
