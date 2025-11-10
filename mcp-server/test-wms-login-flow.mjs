#!/usr/bin/env node
/**
 * Simulate the exact login flow for wms@heraerp.com
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testWMSLoginFlow() {
  console.log('🧪 Simulating WMS Login Flow...\n');
  console.log('═'.repeat(80));

  const email = 'wms@heraerp.com';
  const password = 'demo2025!';

  try {
    // Step 1: Authenticate
    console.log('\n📋 Step 1: Authenticate User');
    console.log('─'.repeat(80));

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      throw authError;
    }

    console.log('✅ Authentication successful');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);

    // Step 2: Get user metadata
    console.log('\n📋 Step 2: Check User Metadata');
    console.log('─'.repeat(80));

    const userMetadata = authData.user.user_metadata;
    console.log('User Metadata:', JSON.stringify(userMetadata, null, 2));

    const userEntityId = userMetadata?.hera_user_entity_id;
    const metadataOrgId = userMetadata?.organization_id;

    console.log(`\n   hera_user_entity_id: ${userEntityId}`);
    console.log(`   organization_id: ${metadataOrgId}`);

    // Step 3: Call hera_auth_introspect_v1 (like HERAAuthProvider does)
    console.log('\n📋 Step 3: Call hera_auth_introspect_v1');
    console.log('─'.repeat(80));

    if (!userEntityId) {
      console.log('❌ No hera_user_entity_id in metadata!');
      console.log('   Login flow will fail - need to find USER entity');

      // Try to find USER entity
      const { data: userEntity } = await supabase
        .from('core_entities')
        .select('id, entity_name')
        .eq('entity_type', 'USER')
        .eq('metadata->supabase_user_id', authData.user.id)
        .single();

      if (userEntity) {
        console.log(`   Found USER entity: ${userEntity.id}`);
      }
    }

    const { data: introspectResult, error: introspectError } = await supabase
      .rpc('hera_auth_introspect_v1', {
        p_actor_user_id: userEntityId
      });

    if (introspectError) {
      console.error('❌ hera_auth_introspect_v1 error:', introspectError);
      throw introspectError;
    }

    console.log('\n✅ hera_auth_introspect_v1 Result:');
    console.log(JSON.stringify(introspectResult, null, 2));

    // Step 4: Analyze what login page will do
    console.log('\n═'.repeat(80));
    console.log('📊 Step 4: Simulate Login Page Logic');
    console.log('─'.repeat(80));

    const userOrganizations = introspectResult.organizations || [];
    console.log(`\nOrganizations: ${userOrganizations.length}`);

    if (userOrganizations.length === 0) {
      console.log('❌ No organizations - login will show error');
      return;
    }

    if (userOrganizations.length > 1) {
      console.log('⚠️ Multiple organizations - login will redirect to /auth/organizations');
      userOrganizations.forEach((org, i) => {
        console.log(`   ${i + 1}. ${org.name} (${org.code})`);
        console.log(`      Apps: ${org.apps?.length || 0}`);
        if (org.apps && org.apps.length > 0) {
          org.apps.forEach(app => {
            console.log(`         - ${app.name} (${app.code})`);
          });
        }
      });
      return;
    }

    // Single organization - continue with login
    const firstOrg = userOrganizations[0];
    const userApps = firstOrg?.apps || [];

    console.log(`\n✅ Single organization: ${firstOrg.name}`);
    console.log(`   Apps: ${userApps.length}`);

    if (userApps.length === 0) {
      console.log('❌ No apps - login will redirect to app store');
      return;
    }

    // THIS IS THE CRITICAL LINE from login page.tsx line 206
    const appCode = userApps[0].code.toLowerCase();

    console.log(`\n🎯 Login page will use: userApps[0].code.toLowerCase()`);
    console.log(`   userApps[0].code: ${userApps[0].code}`);
    console.log(`   Lowercased: ${appCode}`);
    console.log(`   Full app: ${userApps[0].name}`);

    console.log('\n📋 All apps in order (as they appear in introspect result):');
    userApps.forEach((app, i) => {
      console.log(`   ${i + 1}. ${app.name} (${app.code}) ${i === 0 ? '← THIS ONE WILL BE USED' : ''}`);
    });

    // Simulate getRoleRedirectPath
    console.log('\n🔀 Login will call getRoleRedirectPath:');
    console.log(`   Role: ${firstOrg.primary_role}`);
    console.log(`   App: ${appCode}`);

    // Based on role-normalizer.ts logic
    const role = firstOrg.primary_role;
    let redirectPath = '';

    if (role === 'ORG_OWNER' || role === 'ORG_ADMIN') {
      redirectPath = `/${appCode}/dashboard`;
    } else {
      redirectPath = `/${appCode}/dashboard`;
    }

    console.log(`   Redirect path: ${redirectPath}`);

    console.log('\n═'.repeat(80));
    console.log('🎯 FINAL RESULT');
    console.log('═'.repeat(80));

    console.log(`\n✅ Login will redirect to: ${redirectPath}`);

    if (appCode !== 'wms') {
      console.log(`\n❌ PROBLEM: Expected /wms but will redirect to /${appCode}`);
      console.log(`   This means the first app in the introspect result is ${userApps[0].code}, not WMS`);
    } else {
      console.log('\n✅ Correct! Will redirect to /wms/dashboard');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message || error);
    if (error.details) {
      console.error('📋 Details:', error.details);
    }
    if (error.hint) {
      console.error('💡 Hint:', error.hint);
    }
  }
}

testWMSLoginFlow();
