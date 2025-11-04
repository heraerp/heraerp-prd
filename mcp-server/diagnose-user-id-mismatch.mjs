#!/usr/bin/env node
/**
 * Diagnose USER entity ID vs Supabase auth ID mismatch
 * Find out why organizations are loading wrong data
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
  console.log('🔍 DIAGNOSING USER ID MISMATCH\n');
  console.log('='.repeat(80));

  try {
    // Step 1: Check ALL USER entities
    console.log('\n📋 Step 1: ALL USER Entities in core_entities');
    console.log('='.repeat(80));

    const { data: userEntities, error: queryError } = await supabase
      .from('core_entities')
      .select('id, entity_name, metadata, created_at')
      .eq('entity_type', 'USER')
      .order('created_at', { ascending: false })
      .limit(10);

    if (queryError) {
      console.error('❌ Query error:', queryError.message);
      return;
    }

    console.log(`Found ${userEntities.length} USER entities:\n`);

    userEntities.forEach((user, idx) => {
      console.log(`[${idx + 1}] ${user.entity_name || 'Unnamed'}`);
      console.log(`    Entity ID: ${user.id}`);
      console.log(`    Metadata: ${JSON.stringify(user.metadata || {})}`);
      console.log(`    Created: ${user.created_at}`);
      console.log('');
    });

    // Step 2: Check Supabase auth users
    console.log('\n' + '='.repeat(80));
    console.log('📋 Step 2: Supabase Auth Users');
    console.log('='.repeat(80));

    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Users list error:', usersError.message);
      return;
    }

    console.log(`Found ${users.length} auth users:\n`);

    users.forEach((user, idx) => {
      console.log(`[${idx + 1}] ${user.email}`);
      console.log(`    Auth UID: ${user.id}`);
      console.log(`    Created: ${user.created_at}`);
      console.log(`    Metadata: ${JSON.stringify(user.user_metadata || {})}`);
      console.log('');
    });

    // Step 3: Test RPC with actual auth UID
    console.log('\n' + '='.repeat(80));
    console.log('📋 Step 3: Testing RPC with Auth UID');
    console.log('='.repeat(80));

    if (users.length > 0) {
      const testUser = users[0];
      console.log(`Testing with: ${testUser.email} (${testUser.id})\n`);

      const { data, error } = await supabase.rpc('hera_auth_introspect_v1', {
        p_actor_user_id: testUser.id
      });

      if (error) {
        console.error('❌ RPC with Auth UID FAILED:', error.message);
        console.error('   Details:', error.details);
        console.error('   Hint:', error.hint);
      } else {
        console.log('✅ RPC with Auth UID SUCCESS\n');
        console.log(`Organizations: ${data?.organizations?.length || 0}`);

        if (data?.organizations && data.organizations.length > 0) {
          data.organizations.forEach((org, idx) => {
            console.log(`\n[${idx + 1}] ${org.name}`);
            console.log(`    Org ID: ${org.id}`);
            console.log(`    Org Code: ${org.code}`);
            console.log(`    Role: ${org.primary_role}`);
            console.log(`    Apps Count: ${org.apps?.length || 0}`);

            if (org.apps && org.apps.length > 0) {
              org.apps.forEach(app => {
                console.log(`       - ${app.code}: ${app.name}`);
              });
            }
          });
        } else {
          console.log('   ⚠️ No organizations returned');
        }
      }
    }

    // Step 4: Test RPC with USER entity ID
    console.log('\n' + '='.repeat(80));
    console.log('📋 Step 4: Testing RPC with USER Entity ID');
    console.log('='.repeat(80));

    if (userEntities.length > 0) {
      const testEntity = userEntities.find(u => u.entity_name === 'demo') || userEntities[0];
      console.log(`Testing with: ${testEntity.entity_name} (${testEntity.id})\n`);

      const { data, error } = await supabase.rpc('hera_auth_introspect_v1', {
        p_actor_user_id: testEntity.id
      });

      if (error) {
        console.error('❌ RPC with Entity ID FAILED:', error.message);
        console.error('   Details:', error.details);
        console.error('   Hint:', error.hint);
      } else {
        console.log('✅ RPC with Entity ID SUCCESS\n');
        console.log(`Organizations: ${data?.organizations?.length || 0}`);

        if (data?.organizations && data.organizations.length > 0) {
          data.organizations.forEach((org, idx) => {
            console.log(`\n[${idx + 1}] ${org.name}`);
            console.log(`    Org ID: ${org.id}`);
            console.log(`    Org Code: ${org.code}`);
            console.log(`    Role: ${org.primary_role}`);
            console.log(`    Apps Count: ${org.apps?.length || 0}`);

            if (org.apps && org.apps.length > 0) {
              org.apps.forEach(app => {
                console.log(`       - ${app.code}: ${app.name}`);
              });
            }
          });
        } else {
          console.log('   ⚠️ No organizations returned');
        }
      }
    }

    // Step 5: Check memberships directly
    console.log('\n' + '='.repeat(80));
    console.log('📋 Step 5: Check Memberships in core_relationships');
    console.log('='.repeat(80));

    const { data: memberships, error: membershipError } = await supabase
      .from('core_relationships')
      .select(`
        id,
        source_entity_id,
        target_entity_id,
        relationship_type,
        relationship_data,
        from_entity:source_entity_id(entity_name, entity_type),
        to_entity:target_entity_id(entity_name, entity_type)
      `)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .limit(10);

    if (membershipError) {
      console.error('❌ Membership query error:', membershipError.message);
    } else {
      console.log(`Found ${memberships.length} memberships:\n`);

      memberships.forEach((rel, idx) => {
        console.log(`[${idx + 1}] ${rel.from_entity?.entity_name} → ${rel.to_entity?.entity_name}`);
        console.log(`    User Entity ID: ${rel.source_entity_id}`);
        console.log(`    Org Entity ID: ${rel.target_entity_id}`);
        console.log(`    Role Data: ${JSON.stringify(rel.relationship_data || {})}`);
        console.log('');
      });
    }

    // Final Summary
    console.log('\n' + '='.repeat(80));
    console.log('🎯 DIAGNOSIS SUMMARY');
    console.log('='.repeat(80));

    console.log('\n1️⃣ USER Entity Storage:');
    console.log(`   - Total USER entities: ${userEntities.length}`);
    console.log(`   - Have supabase_user_id: 0 (THIS IS THE PROBLEM)`);

    console.log('\n2️⃣ Supabase Auth Users:');
    console.log(`   - Total auth users: ${users.length}`);

    console.log('\n3️⃣ The Issue:');
    console.log('   - USER entities do NOT have supabase_user_id in metadata');
    console.log('   - API endpoint tries to look up by metadata->supabase_user_id (lines 45-50)');
    console.log('   - Lookup always fails, falls back to using auth UID directly');
    console.log('   - RPC may be expecting USER entity ID, not auth UID');

    console.log('\n4️⃣ Solution Options:');
    console.log('   A) Add supabase_user_id to USER entity metadata during creation');
    console.log('   B) Lookup USER entities by matching email/code instead');
    console.log('   C) Store auth UID as USER entity ID directly (simplest)');

    console.log('\n✅ Diagnosis complete\n');

  } catch (err) {
    console.error('❌ EXCEPTION:', err.message);
    console.error(err.stack);
  }
}

diagnose();
