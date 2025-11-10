#!/usr/bin/env node
/**
 * Check WMS User Authentication - wms@heraerp.com
 * Using hera_auth_introspect_v1 RPC function
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkWMSAuthIntrospect() {
  console.log('🔍 Checking wms@heraerp.com using hera_auth_introspect_v1...\n');
  console.log('═'.repeat(60));

  const email = 'wms@heraerp.com';

  try {
    // Step 1: Find auth user
    console.log('\n📋 Step 1: Finding auth user...');
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const authUser = users.users.find(u => u.email === email);
    if (!authUser) {
      throw new Error(`❌ Auth user ${email} not found in Supabase Auth`);
    }

    console.log('✅ Auth User Found:');
    console.log(`   Auth User ID: ${authUser.id}`);
    console.log(`   Email: ${authUser.email}`);
    console.log(`   Email Confirmed: ${authUser.email_confirmed_at ? '✅ Yes' : '❌ No'}`);
    console.log(`   Created: ${new Date(authUser.created_at).toLocaleString()}`);
    console.log(`   Last Sign In: ${authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString() : 'Never'}`);
    if (authUser.user_metadata) {
      console.log('   User Metadata:', JSON.stringify(authUser.user_metadata, null, 2));
    }

    // Step 2: Find USER entity
    console.log('\n📋 Step 2: Finding USER entity...');
    const { data: userEntities, error: entityError } = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_name, entity_code, smart_code, metadata, organization_id, created_by, updated_by')
      .eq('entity_type', 'USER');

    if (entityError) throw entityError;

    console.log(`   Total USER entities found: ${userEntities.length}`);

    // Look for user entity by various methods
    let userEntity = userEntities.find(e => e.id === authUser.id);
    if (!userEntity) {
      // Try to find by metadata.auth_user_id
      userEntity = userEntities.find(e =>
        e.metadata?.auth_user_id === authUser.id ||
        e.metadata?.supabase_user_id === authUser.id
      );
    }
    if (!userEntity) {
      // Try to find by email in entity_code or metadata
      userEntity = userEntities.find(e =>
        e.entity_code === email ||
        e.metadata?.email === email
      );
    }

    if (!userEntity) {
      console.error('\n❌ USER entity not found for wms@heraerp.com!');
      console.log('\n🔍 Available USER entities:');
      userEntities.forEach((e, i) => {
        console.log(`\n   ${i + 1}. Entity ID: ${e.id}`);
        console.log(`      Name: ${e.entity_name}`);
        console.log(`      Code: ${e.entity_code}`);
        console.log(`      Smart Code: ${e.smart_code}`);
        console.log(`      Org ID: ${e.organization_id}`);
        console.log(`      Metadata:`, JSON.stringify(e.metadata, null, 2));
      });
      console.log('\n❌ Cannot proceed without USER entity!');
      console.log('   This means hera_onboard_user_v1 did not create the USER entity properly');
      process.exit(1);
    }

    console.log('\n✅ USER Entity Found:');
    console.log(`   USER Entity ID: ${userEntity.id}`);
    console.log(`   Entity Name: ${userEntity.entity_name}`);
    console.log(`   Entity Code: ${userEntity.entity_code}`);
    console.log(`   Smart Code: ${userEntity.smart_code}`);
    console.log(`   Organization ID: ${userEntity.organization_id}`);
    console.log(`   Created By: ${userEntity.created_by}`);
    console.log(`   Updated By: ${userEntity.updated_by}`);
    if (userEntity.metadata) {
      console.log('   Metadata:', JSON.stringify(userEntity.metadata, null, 2));
    }

    // Step 3: Call hera_auth_introspect_v1
    console.log('\n═'.repeat(60));
    console.log('📋 Step 3: Calling hera_auth_introspect_v1...');
    console.log('   (This is the RPC that the auth system uses to resolve user context)');
    console.log('   Parameter: p_actor_user_id =', userEntity.id);

    const { data: introspectResult, error: introspectError } = await supabase.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: userEntity.id  // Use USER entity ID (not auth ID)
    });

    if (introspectError) {
      console.error('\n❌ hera_auth_introspect_v1 error:', introspectError);
      throw introspectError;
    }

    console.log('\n✅ hera_auth_introspect_v1 Result:');
    console.log(JSON.stringify(introspectResult, null, 2));

    // Step 4: Analyze the result
    console.log('\n═'.repeat(60));
    console.log('📊 AUTHENTICATION ANALYSIS');
    console.log('═'.repeat(60));

    if (!introspectResult) {
      console.log('\n❌ No result from hera_auth_introspect_v1');
      console.log('   This means the user has no memberships or invalid data!');
      process.exit(1);
    }

    console.log(`\n👤 Actor User ID: ${introspectResult.actor_user_id || 'N/A'}`);
    console.log(`👤 Actor Name: ${introspectResult.actor_name || 'N/A'}`);
    console.log(`🏢 Organizations: ${introspectResult.organizations?.length || 0}`);

    if (!introspectResult.organizations || introspectResult.organizations.length === 0) {
      console.log('\n❌ NO ORGANIZATIONS FOUND!');
      console.log('   This is a CRITICAL issue - user has no organization access!');
      console.log('\n🔧 DEBUGGING STEPS:');
      console.log('   1. Check if MEMBER_OF relationship exists');
      console.log('   2. Check if HAS_ROLE relationship exists');
      console.log('   3. Verify relationships are in correct organization');
      console.log('   4. Check if relationships are active (no expiration)');

      // Debug relationships
      console.log('\n🔍 Checking relationships for this user...');
      const { data: relationships, error: relError } = await supabase
        .from('core_relationships')
        .select('*')
        .eq('from_entity_id', userEntity.id);

      if (relError) {
        console.log('   ❌ Error fetching relationships:', relError.message);
      } else {
        console.log(`   Total relationships found: ${relationships.length}`);
        relationships.forEach((rel, i) => {
          console.log(`\n   ${i + 1}. Relationship ID: ${rel.id}`);
          console.log(`      Type: ${rel.relationship_type}`);
          console.log(`      From: ${rel.from_entity_id}`);
          console.log(`      To: ${rel.to_entity_id}`);
          console.log(`      Organization: ${rel.organization_id}`);
          console.log(`      Is Active: ${rel.is_active ? '✅' : '❌'}`);
          console.log(`      Effective Date: ${rel.effective_date || 'N/A'}`);
          console.log(`      Expiration Date: ${rel.expiration_date || 'N/A'}`);
          if (rel.relationship_data) {
            console.log(`      Data:`, JSON.stringify(rel.relationship_data, null, 2));
          }
        });
      }

      process.exit(1);
    }

    console.log('\n✅ Organizations found:');
    introspectResult.organizations.forEach((org, idx) => {
      console.log(`\n   ${idx + 1}. Organization: ${org.name || 'N/A'} (${org.code || 'N/A'})`);
      console.log(`      ID: ${org.id}`);
      console.log(`      Type: ${org.type || 'N/A'}`);
      console.log(`      Role: ${org.role || 'N/A'}`);
      console.log(`      Role Code: ${org.role_code || 'N/A'}`);
      console.log(`      User Role: ${org.user_role || 'N/A'}`);
      console.log(`      Primary Role: ${org.primary_role || 'N/A'}`);
      console.log(`      Apps: ${org.apps?.length || 0}`);
      if (org.apps && org.apps.length > 0) {
        org.apps.forEach(app => {
          console.log(`         - ${app.name} (${app.code})`);
        });
      }
    });

    console.log('\n═'.repeat(60));
    console.log('🎯 EXPECTED FOR WMS USER');
    console.log('═'.repeat(60));
    console.log('Organizations: 1');
    console.log('Organization Name: HERA Waste Management Demo');
    console.log('Organization Code: DEMO-WMS (or similar)');
    console.log('Role: ORG_OWNER');
    console.log('Apps: Should include WMS app');

    // Validate
    const wmsOrg = introspectResult.organizations.find(o =>
      o.code?.includes('WMS') ||
      o.name?.includes('Waste') ||
      o.name?.includes('WMS')
    );

    if (!wmsOrg) {
      console.log('\n⚠️ WARNING: WMS organization not found in introspect result!');
      console.log('   Available organizations:', introspectResult.organizations.map(o => `${o.name} (${o.code})`).join(', '));
    } else {
      console.log('\n✅ WMS organization found');
      console.log(`   Name: ${wmsOrg.name}`);
      console.log(`   Code: ${wmsOrg.code}`);
      console.log(`   Role: ${wmsOrg.role_code || wmsOrg.role || wmsOrg.user_role}`);

      const role = wmsOrg.role_code || wmsOrg.role || wmsOrg.user_role;
      if (role === 'ORG_OWNER') {
        console.log('   ✅ Role is ORG_OWNER - CORRECT!');
      } else {
        console.log(`   ⚠️ Role is ${role} - EXPECTED ORG_OWNER!`);
      }

      if (wmsOrg.apps && wmsOrg.apps.length > 0) {
        console.log(`   ✅ Apps found: ${wmsOrg.apps.length}`);
        const wmsApp = wmsOrg.apps.find(app =>
          app.code?.includes('WMS') ||
          app.name?.includes('Waste')
        );
        if (wmsApp) {
          console.log('   ✅ WMS app found!');
        } else {
          console.log('   ⚠️ WMS app not found in apps list');
        }
      } else {
        console.log('   ❌ No apps found - this could cause issues!');
      }
    }

    console.log('\n═'.repeat(60));
    console.log('🎉 CHECK COMPLETE!');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error.details) {
      console.error('📋 Details:', error.details);
    }
    if (error.hint) {
      console.error('💡 Hint:', error.hint);
    }
    process.exit(1);
  }
}

checkWMSAuthIntrospect();
