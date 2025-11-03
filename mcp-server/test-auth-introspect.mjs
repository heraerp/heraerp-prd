#!/usr/bin/env node
/**
 * Test hera_auth_introspect_v1 for demo@heraerp.com
 * Tests what apps and organizations are returned
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDemoUser() {
  console.log('🧪 Testing hera_auth_introspect_v1 for demo@heraerp.com\n');
  console.log('=' .repeat(80));

  try {
    // Step 1: Login as demo@heraerp.com
    console.log('\n🔐 Step 1: Authenticating as demo@heraerp.com...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'demo@heraerp.com',
      password: 'demo123'
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ Authentication successful');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);

    // Step 2: Call hera_auth_introspect_v1
    console.log('\n📋 Step 2: Calling hera_auth_introspect_v1...');
    const { data, error } = await supabase.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: authData.user.id
    });

    if (error) {
      console.error('❌ Introspection ERROR:', error.message);
      if (error.details) console.error('   Details:', error.details);
      if (error.hint) console.error('   Hint:', error.hint);
      return;
    }

    console.log('✅ Introspection SUCCESS\n');
    console.log('=' .repeat(80));
    console.log('📊 FULL RESPONSE');
    console.log('=' .repeat(80));
    console.log(JSON.stringify(data, null, 2));

    // Parse and display key information
    console.log('\n' + '=' .repeat(80));
    console.log('🔍 KEY INFORMATION');
    console.log('=' .repeat(80));

    console.log('\n🆔 User Info:');
    console.log(`   User ID: ${data.user_id || 'N/A'}`);
    console.log(`   Default App: ${data.default_app || 'None'}`);

    if (data.organizations && data.organizations.length > 0) {
      console.log(`\n🏢 Organizations (${data.organizations.length}):`);

      data.organizations.forEach((org, idx) => {
        console.log(`\n   [${idx + 1}] ${org.name || 'Unnamed'}`);
        console.log(`       ├─ ID: ${org.id}`);
        console.log(`       ├─ Role: ${org.primary_role || 'N/A'}`);
        console.log(`       └─ Apps: ${org.apps?.length || 0} installed`);

        if (org.apps && org.apps.length > 0) {
          org.apps.forEach((app, appIdx) => {
            console.log(`           ${appIdx + 1}. ${app.name} (${app.code})`);
            if (app.config) {
              console.log(`              Config: ${JSON.stringify(app.config)}`);
            }
          });
        }
      });
    } else {
      console.log('\n🏢 Organizations: None found');
    }

    // Verification checklist
    console.log('\n' + '=' .repeat(80));
    console.log('✅ VERIFICATION CHECKLIST');
    console.log('=' .repeat(80));

    const primaryOrg = data.organizations?.[0];
    const checks = [
      { name: 'User authenticated', pass: !!authData.user.id },
      { name: 'Introspection returned data', pass: !!data },
      { name: 'Has organizations', pass: data.organizations?.length > 0 },
      { name: 'HERA ERP DEMO org found', pass: primaryOrg?.name === 'HERA ERP DEMO' },
      { name: 'Has apps installed', pass: primaryOrg?.apps?.length > 0 },
      { name: 'SALON app found', pass: primaryOrg?.apps?.some(a => a.code === 'SALON') },
      { name: 'CASHEW app found', pass: primaryOrg?.apps?.some(a => a.code === 'CASHEW') }
    ];

    checks.forEach(check => {
      console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
    });

    // Logout
    console.log('\n🔓 Logging out...');
    await supabase.auth.signOut();
    console.log('✅ Test complete\n');

  } catch (err) {
    console.error('❌ EXCEPTION:', err.message);
    console.error(err.stack);
  }
}

testDemoUser();
